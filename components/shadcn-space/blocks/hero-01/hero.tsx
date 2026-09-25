"use client";

import Image from "next/image";
import Link from "next/link";
import { Instrument_Serif } from "next/font/google";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { ArrowUpRight, Star } from "lucide-react";

const MotionImage = motion.create(Image);

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

export type AvatarList = {
  image: string;
};

type HeroSectionProps = {
  avatarList: AvatarList[];
};

function HeroSection({ avatarList }: HeroSectionProps) {
  return (
    <section>
      <div className="w-full h-full relative">
        <div className="relative w-full pt-0 md:pt-20 pb-6 md:pb-10 before:absolute before:w-full before:h-full before:bg-linear-to-r before:from-sky-100 before:via-white before:to-amber-100 before:rounded-full before:top-24 before:blur-3xl before:-z-10 dark:before:from-slate-800 dark:before:via-black dark:before:to-stone-700 dark:before:rounded-full dark:before:blur-3xl dark:before:-z-10">
          <div className="container mx-auto relative z-10">
            <div className="flex flex-col max-w-5xl mx-auto gap-8">
              <div className="relative flex flex-col text-center items-center sm:gap-6 gap-4">
                <motion.h1
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 1,
                    ease: "easeInOut",
                  }}
                  className="lg:text-8xl md:text-7xl text-5xl font-medium leading-14 md:leading-20 lg:leading-24">
                  Buy & Sell with{" "}
                  <span
                    className={`${instrumentSerif.className} tracking-tight`}>
                    confidence
                  </span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 1,
                    delay: 0.1,
                    ease: "easeInOut",
                  }}
                  className="text-base font-normal max-w-2xl text-muted-foreground">
                  Discover great deals on digital gadgets,
                  phones, laptops, and more. Resell items
                  you no longer need or find pre-loved
                  treasures from local sellers.
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 1,
                  delay: 0.2,
                  ease: "easeInOut",
                }}
                className="flex items-center flex-col md:flex-row justify-center gap-8">
                <Button
                  className="relative text-sm font-medium rounded-full h-12 p-1 ps-6 pe-14 group transition-all duration-500 hover:ps-14 hover:pe-6 w-fit overflow-hidden cursor-pointer"
                  render={<Link href="/listing" />}
                  nativeButton={false}>
                  <span className="relative z-10 transition-all duration-500">
                    View all listings
                  </span>
                  <span className="absolute right-1 w-10 h-10 bg-background text-foreground rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
                    <ArrowUpRight size={16} />
                  </span>
                </Button>
                <div className="flex items-center sm:gap-7 gap-3">
                  <ul className="avatar flex flex-row items-center">
                    {avatarList.map((avatar, index) => (
                      <li
                        key={index}
                        className="-mr-2 z-1 avatar-hover:ml-2">
                        <img
                          src={avatar.image}
                          alt="Avatar"
                          width={40}
                          height={40}
                          className="rounded-full border-2 border-white"
                        />
                      </li>
                    ))}
                  </ul>
                  <div className="gap-1 flex flex-col items-start">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map(
                        (_, index) => (
                          <Star
                            key={index}
                            className="h-4 w-4 fill-amber-400 text-amber-400"
                          />
                        ),
                      )}
                    </div>
                    <p className="sm:text-sm text-xs font-normal text-muted-foreground">
                      Trusted by 1000+ buyers and sellers
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <MotionImage
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 1,
              delay: 0.3,
              ease: "easeInOut",
            }}
            src="/panda__left.png"
            alt="Panda mascot shopping on phone"
            width={660}
            height={735}
            className="absolute bottom-0 left-30 2xl:left-16 w-46 xl:w-62 2xl:w-78 hidden xl:block pointer-events-none z-0"
          />
          <MotionImage
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 1,
              delay: 0.4,
              ease: "easeInOut",
            }}
            src="/panda__right.png"
            alt="Panda mascot browsing on laptop"
            width={743}
            height={715}
            className="absolute bottom-0 right-30 2xl:right-16 w-60 xl:w-74 2xl:w-94 hidden xl:block pointer-events-none z-0"
          />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
