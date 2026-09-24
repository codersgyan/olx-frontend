"use client";
import AboutUs from "@/components/shadcn-space/blocks/about-us-01/about-us";
import { HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";

const aboutusData = [
    {
      icon: ShieldCheck,
      title: "Trust",
      color: "bg-blue-500/10 text-blue-500"
    },
    {
      icon: HeartHandshake,
      title: "Community",
      color: "bg-teal-400/10 text-teal-400" 
    },
    {
      icon: Sparkles,
      title: "Value",
      color: "bg-orange-400/10 text-orange-400" 
    }
];

const statisticsCounter = [
    {
        title: "Active Listings",
        count: 45
    },
    {
        title: "Happy Users",
        count: 24
    },
    {
        title: "Successful Sales",
        count: 5
    },
]

const AboutAndStats01 = () => {
  return (
    <>
      <AboutUs aboutusData={aboutusData} statisticsCounter={statisticsCounter} />
    </>
  );
};

export default AboutAndStats01;
