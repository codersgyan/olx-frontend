'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import type { PresignResponse } from '@/lib/api/types'
import { useAuthStore } from '@/store/auth-store'

export type UploadStatus = 'uploading' | 'uploaded' | 'error'

export interface UploadedImage {
  id: string
  file: File
  /** An object URL — this hook owns revoking it. */
  preview: string
  status: UploadStatus
  /** The R2 key, set once the PUT lands. This is what Submit sends. */
  objectKey?: string
  error?: string
}

export interface SettleResult {
  /** Keys of every photo that uploaded successfully, in selection order. */
  keys: string[]
  /** How many photos ended in `error`. Non-zero means don't post yet. */
  failed: number
}

const uploadFailedMessage = (name: string, status: number) =>
  `Upload failed for "${name}" (${status}). ` +
  'If this is a CORS error, the R2 bucket needs a CORS policy allowing PUT from this origin.'

/**
 * Photo state for the listing form, uploaded the moment it is picked.
 *
 * The three-step flow lives here rather than in `useCreateListing`: presign and
 * PUT run at file-select time, so by the time the user hits Submit the bytes are
 * already in R2 and the only thing left is a JSON POST carrying the keys.
 *
 * Nothing here touches Postgres. `POST /uploads/presign` writes no rows, and an
 * object under `uploads/` that never gets finalised is reaped by the bucket's
 * lifecycle rule — so an abandoned form, or a photo the user removes after it
 * uploaded, leaves nothing to clean up.
 */
export function useImageUploads() {
  const token = useAuthStore(state => state.token)
  const [images, setImages] = useState<UploadedImage[]>([])

  // A mirror of `images` that survives `await`. Submit calls settle(), and the
  // `images` captured in its closure is a snapshot from before the uploads
  // finished — reading it there would post an empty image_keys.
  const imagesRef = useRef<UploadedImage[]>([])
  const abortControllers = useRef(new Map<string, AbortController>())
  const inflight = useRef(new Set<Promise<void>>())

  // Every mutation goes through the ref first and only then publishes to state.
  // Deriving from `prev` inside the updater would leave the ref trailing React's
  // render queue, and settle() reads the ref the instant the last PUT resolves.
  const write = useCallback((next: (prev: UploadedImage[]) => UploadedImage[]) => {
    imagesRef.current = next(imagesRef.current)
    setImages(imagesRef.current)
  }, [])

  const patch = useCallback(
    (id: string, changes: Partial<UploadedImage>) => {
      write(prev => prev.map(img => (img.id === id ? { ...img, ...changes } : img)))
    },
    [write],
  )

  /**
   * Presign a batch and PUT every file in parallel.
   *
   * Never rejects: a failed photo becomes an `error` item the user can retry or
   * remove. Throwing would take the whole form down with it.
   */
  const upload = useCallback(
    async (items: UploadedImage[]) => {
      try {
        // One request for the batch — presigning is local HMAC signing, so N
        // URLs cost a single round trip.
        const { uploads } = await apiFetch<PresignResponse>('/uploads/presign', {
          method: 'POST',
          token,
          body: {
            files: items.map(item => ({
              content_type: item.file.type,
              size_bytes: item.file.size,
            })),
          },
        })

        await Promise.all(
          items.map(async (item, index) => {
            const upload = uploads[index]
            const controller = new AbortController()
            abortControllers.current.set(item.id, controller)

            try {
              // Deliberately raw `fetch`, not `apiFetch`: this request does not
              // go to our API, and an Authorization header here would break the
              // signature. The signature *is* the authorisation.
              const response = await fetch(upload.upload_url, {
                method: 'PUT',
                headers: { 'Content-Type': item.file.type },
                body: item.file,
                signal: controller.signal,
              })

              if (!response.ok) {
                patch(item.id, {
                  status: 'error',
                  error: uploadFailedMessage(item.file.name, response.status),
                })
                return
              }

              patch(item.id, { status: 'uploaded', objectKey: upload.object_key })
            } catch (error) {
              // An abort means the user removed the photo mid-flight; the item
              // is already gone from state and there is nothing to mark.
              if (error instanceof DOMException && error.name === 'AbortError') return
              patch(item.id, {
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed.',
              })
            } finally {
              abortControllers.current.delete(item.id)
            }
          }),
        )
      } catch (error) {
        // Presign failed, so no file in this batch ever got a URL.
        const message = error instanceof Error ? error.message : 'Could not prepare the upload.'
        write(prev =>
          prev.map(img =>
            items.some(item => item.id === img.id)
              ? { ...img, status: 'error' as const, error: message }
              : img,
          ),
        )
      }
    },
    [token, patch, write],
  )

  /** Track a batch so `settle()` can wait on it. */
  const track = useCallback((work: Promise<void>) => {
    inflight.current.add(work)
    void work.finally(() => inflight.current.delete(work))
  }, [])

  /** Add freshly picked files: preview immediately, upload straight away. */
  const add = useCallback(
    (files: File[]) => {
      if (files.length === 0) return

      const items: UploadedImage[] = files.map(file => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        status: 'uploading',
      }))

      write(prev => [...prev, ...items])
      track(upload(items))
    },
    [write, track, upload],
  )

  /** Re-presign and re-PUT one failed photo. */
  const retry = useCallback(
    (id: string) => {
      const item = imagesRef.current.find(img => img.id === id)
      if (!item || item.status === 'uploading') return

      patch(id, { status: 'uploading', error: undefined, objectKey: undefined })
      track(upload([{ ...item, status: 'uploading' }]))
    },
    [patch, track, upload],
  )

  /**
   * Move one photo in front of another.
   *
   * Array order is the listing's image order: `settle()` reads the keys off
   * this list, `POST /listings` inserts them with `position = index`, and every
   * read path sorts by position. So the first item is the cover image, and this
   * splice is the whole of drag-to-reorder — there is nothing to tell the API.
   *
   * Safe while a batch is in flight: `patch` finds its item by id, not index.
   */
  const reorder = useCallback(
    (activeId: string, overId: string) => {
      if (activeId === overId) return

      write(prev => {
        const from = prev.findIndex(img => img.id === activeId)
        const to = prev.findIndex(img => img.id === overId)
        if (from === -1 || to === -1) return prev

        const next = [...prev]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        return next
      })
    },
    [write],
  )

  const remove = useCallback(
    (id: string) => {
      abortControllers.current.get(id)?.abort()
      abortControllers.current.delete(id)

      const item = imagesRef.current.find(img => img.id === id)
      if (item) URL.revokeObjectURL(item.preview)

      // An already-uploaded object is simply left in `uploads/` for the bucket's
      // lifecycle rule to expire. Nothing references it, so nothing breaks.
      write(prev => prev.filter(img => img.id !== id))
    },
    [write],
  )

  const reset = useCallback(() => {
    abortControllers.current.forEach(controller => controller.abort())
    abortControllers.current.clear()
    imagesRef.current.forEach(img => URL.revokeObjectURL(img.preview))
    write(() => [])
  }, [write])

  /**
   * Wait for every in-flight upload, then report the keys.
   *
   * Batches never reject, so this resolves once each photo is either uploaded or
   * marked errored. Results come off the ref, not the closed-over `images`.
   */
  const settle = useCallback(async (): Promise<SettleResult> => {
    while (inflight.current.size > 0) {
      await Promise.all([...inflight.current])
    }

    const settled = imagesRef.current
    return {
      keys: settled.flatMap(img => (img.objectKey ? [img.objectKey] : [])),
      failed: settled.filter(img => img.status === 'error').length,
    }
  }, [])

  // Previews outlive the component otherwise — the form lives in a dialog that
  // unmounts on close.
  useEffect(() => {
    // The Map is created once and never reassigned, so capturing it here is the
    // same object cleanup would have read. `tracked` has to stay a ref: its
    // contents are what matters at unmount, not what they were at mount.
    const controllers = abortControllers.current
    const tracked = imagesRef

    return () => {
      controllers.forEach(controller => controller.abort())
      tracked.current.forEach(img => URL.revokeObjectURL(img.preview))
    }
  }, [])

  return {
    images,
    add,
    remove,
    retry,
    reorder,
    reset,
    settle,
    isUploading: images.some(img => img.status === 'uploading'),
    uploadedCount: images.filter(img => img.status === 'uploaded').length,
    // settle() reports this too, but the form needs it before submit — a failed
    // photo should be visible in the footer, not discovered on the way out.
    failedCount: images.filter(img => img.status === 'error').length,
  }
}
