"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { LogOut, Menu, X } from 'lucide-react';
import Logo from "@/assets/logo/logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { useMe, useSignOut } from "@/hooks/use-auth";
import { APP_ROUTES } from "@/lib/constants";

export type NavigationSection = {
  title: string;
  href: string;
};

type HeaderProps = {
  navigationData: NavigationSection[];
  className?: string;
};

const CollaborateButton = ({ className, href }: { className?: string; href?: string }) => {
  const content = (
    <>
      <span className="relative z-10 transition-all duration-500">
        My Listings
      </span>
      <span className="absolute right-1 w-8 h-8 bg-background text-foreground rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-36px)] group-hover:rotate-45">
        <ArrowUpRight size={16} />
      </span>
    </>
  );

  const classes = cn(
    "relative text-sm font-medium rounded-full h-10 p-1 ps-4 pe-12 group transition-all duration-500 hover:ps-12 hover:pe-4 w-fit overflow-hidden inline-flex items-center justify-center bg-primary text-primary-foreground",
    className
  );

  return href ? (
    <Link href={href} className={classes}>
      {content}
    </Link>
  ) : (
    <Button className={cn(classes, "cursor-pointer")}>
      {content}
    </Button>
  );
};

/**
 * The navbar's right-hand slot: "My Listings" + sign out when signed in, "Sign
 * in" when not.
 *
 * Sign out lives here rather than on /my-listings because it is a session
 * action, not a page action — it has to be reachable from anywhere, and the
 * navbar is the one thing on every page.
 *
 * The skeleton is not decoration. Auth lives in localStorage, so the first paint
 * genuinely does not know who the user is; rendering "Sign in" during that gap
 * would flash the wrong state on every page load for anyone logged in.
 */
const AuthButton = ({ className }: { className?: string }) => {
  const router = useRouter();
  const { isSignedIn, isResolved } = useMe();
  const signOut = useSignOut();

  const handleSignOut = () => {
    signOut();
    // Half the signed-in surface is guarded, so staying put could strand the
    // user on a page that immediately bounces them to sign-in.
    router.push(APP_ROUTES.HOME);
  };

  if (!isResolved) {
    return <Skeleton className={cn("h-10 w-36 rounded-full", className)} />;
  }

  if (isSignedIn) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <CollaborateButton href="/my-listings" />
        <Button
          variant="outline"
          size="icon"
          onClick={handleSignOut}
          title="Sign out"
          aria-label="Sign out"
          className="size-10 shrink-0 cursor-pointer rounded-full"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <Link
      href={APP_ROUTES.AUTH.SIGN_IN}
      className={cn(
        "relative text-sm font-medium rounded-full h-10 p-1 ps-4 pe-12 group transition-all duration-500 hover:ps-12 hover:pe-4 w-fit overflow-hidden inline-flex items-center justify-center bg-primary text-primary-foreground",
        className,
      )}
    >
      <span className="relative z-10 transition-all duration-500">Sign in</span>
      <span className="absolute right-1 w-8 h-8 bg-background text-foreground rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-36px)] group-hover:rotate-45">
        <ArrowUpRight size={16} />
      </span>
    </Link>
  );
};

// Next.js <Link> navigation doesn't fire "hashchange", so nav clicks set the
// hash manually; browser hash/history events reset it to the real location.
let manualHash: string | null = null;
const hashListeners = new Set<() => void>();

const setHash = (hash: string) => {
  manualHash = hash;
  hashListeners.forEach((listener) => listener());
};

const getHash = () => manualHash ?? window.location.hash;

const subscribeToHash = (onChange: () => void) => {
  const onLocationChange = () => {
    manualHash = null;
    onChange();
  };
  hashListeners.add(onChange);
  window.addEventListener("hashchange", onLocationChange);
  window.addEventListener("popstate", onLocationChange);
  return () => {
    hashListeners.delete(onChange);
    window.removeEventListener("hashchange", onLocationChange);
    window.removeEventListener("popstate", onLocationChange);
  };
};

const Header = ({ navigationData, className }: HeaderProps) => {
  const pathname = usePathname();
  const [sticky, setSticky] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const hash = useSyncExternalStore(
    subscribeToHash,
    getHash,
    () => "",
  );

  const handleScroll = useCallback(() => {
    setSticky(window.scrollY >= 50);
  }, []);

  const handleResize = useCallback(() => {
    if (window.innerWidth >= 768) setIsOpen(false);
  }, []);

  const getIsActive = useCallback((href: string) => {
    if (href === "/") {
      return pathname === "/" && hash === "";
    }
    if (href.startsWith("/#")) {
      return hash === href.slice(1);
    }
    return pathname.startsWith(href);
  }, [pathname, hash]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleScroll, handleResize]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
      className={cn(
        "inset-x-0 z-50 px-4 flex items-center justify-center sticky top-0 h-20",
        className,
      )}
    >
      <div
        className={cn(
          "w-full max-w-6xl flex items-center h-fit justify-between gap-3.5 lg:gap-6 transition-all duration-500",
          sticky
            ? "p-2.5 bg-background/60 backdrop-blur-lg border border-border/40 shadow-2xl shadow-primary/5 rounded-full"
            : "bg-transparent border-transparent",
        )}
      >
        <div className="flex items-center gap-10">
          {/* Logo */}
          <Link href="/">
            <Logo className="gap-3" />
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="max-lg:hidden">
            <NavigationMenuList className="flex gap-6">
              {navigationData.map((navItem) => {
                const isActive = getIsActive(navItem.href);
                return (
                  <NavigationMenuItem key={navItem.title}>
                    <Link
                      href={navItem.href}
                      onClick={() => setHash(navItem.href.startsWith("/#") ? navItem.href.slice(1) : "")}
                      className={cn("text-sm font-medium text-muted-foreground hover:text-foreground transition tracking-normal", isActive ? "text-foreground" : "")}
                    >
                      {navItem.title}
                    </Link>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Desktop CTA */}
        <div className="flex gap-4 items-center">
          <AuthButton className="hidden lg:flex" />
          <div className="hidden lg:flex">
            <ModeToggle />
          </div>

          <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger id="mobile-menu-trigger">
                <span className="rounded-full border border-border p-2 block">
                  <Menu
                    width={20}
                    height={20}
                  />
                  <span className="sr-only">Menu</span>
                </span>
              </SheetTrigger>

              <SheetContent
                showCloseButton={false}
                side="right"
                className="w-full sm:w-96 p-0 border-l-0"
              >
                <div className="flex items-center justify-between p-6">
                  <Link href="/">
                    <Logo className="gap-2" />
                  </Link>
                  <SheetClose id="mobile-menu-close">
                    <span className="rounded-full border border-border p-2.5 block">
                      <X width={16} height={16} />
                    </span>
                  </SheetClose>
                </div>

                <div className="flex flex-col gap-12 px-6 pb-6 overflow-y-auto">
                  <div className="flex flex-col gap-8">
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <NavigationMenu
                      orientation="vertical"
                      className="items-start flex-none"
                    >
                      <NavigationMenuList className="flex flex-col items-start gap-3">
                        {navigationData.map((item) => {
                          const isActive = getIsActive(item.href);
                          return (
                            <NavigationMenuItem key={item.title}>
                              <Link
                                href={item.href}
                                onClick={() => setHash(item.href.startsWith("/#") ? item.href.slice(1) : "")}
                                className={cn(
                                  "group/nav flex items-center text-2xl font-semibold tracking-tight transition-all p-0 hover:bg-transparent focus:bg-transparent",
                                  isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:translate-x-2",
                                )}
                              >
                                <div
                                  className={cn(
                                    "h-0.5 bg-primary transition-all duration-300 overflow-hidden",
                                    isActive
                                      ? "w-4 mr-2 opacity-100"
                                      : "w-0 opacity-0 group-hover/nav:w-4 group-hover/nav:mr-2 group-hover/nav:opacity-100",
                                  )}
                                />
                                {item.title}
                              </Link>
                            </NavigationMenuItem>
                          );
                        })}
                      </NavigationMenuList>
                    </NavigationMenu>

                    <div className="flex items-center gap-4">
                      <div className="w-fit">
                        <AuthButton />
                      </div>
                      <ModeToggle />
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-4">
                    <div className="flex gap-3">
                      {[
                        "lucide:dribbble",
                        "lucide:instagram",
                        "lucide:twitter",
                        "lucide:linkedin",
                      ].map((icon) => (
                        <a
                          key={icon}
                          href="#"
                          className="flex items-center justify-center rounded-full outline outline-border hover:bg-muted transition p-3 shadow-xs"
                        >
                          <Icon icon={icon} width={16} height={16} />
                        </a>
                      ))}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      © 2026 Coder&apos;s Shop
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;