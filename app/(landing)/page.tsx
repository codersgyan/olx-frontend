"use client";

import Image from "next/image";
import { motion } from "motion/react";

import Feature01 from "@/components/shadcn-space/blocks/feature-01";
import AgencyHeroSection from "@/components/shadcn-space/blocks/hero-01";
import AboutAndStats01 from "@/components/shadcn-space/blocks/about-us-01";

const MotionImage = motion.create(Image);

export default function Home() {
  return (
    <>
      <AgencyHeroSection />
      <MotionImage
        height={1000}
        width={2000}
        alt="shop"
        src={"/panda_logo.png"}
        className="w-full h-auto max-w-48 sm:max-w-56 md:max-w-64 mx-auto relative top-4 md:top-10 px-4 opacity-50"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
      <AboutAndStats01 />
      <MotionImage
        height={1000}
        width={2000}
        alt="shop"
        src={"/shop-animate.gif"}
        className="w-full md:w-[60vw] h-auto max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, delay: 0.1, ease: "easeInOut" }}
      />
      <div className="overflow-x-hidden">
        <Feature01 />
      </div>
    </>
  );
}
