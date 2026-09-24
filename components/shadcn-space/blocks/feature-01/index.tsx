"use client";
import Feature from "@/components/shadcn-space/blocks/feature-01/feature";
import { Camera, MessageCircle, Search, ShieldCheck } from "lucide-react"

const featureData = [
    {
      icon: Camera,
      content: "Post items in seconds with photos, descriptions, and pricing that grab buyers' attention.",
    },
    {
      icon: Search,
      content: "Find exactly what you need with filters for category, price, location, and condition.",
    },
    {
      icon: MessageCircle,
      content: "Chat safely with buyers and sellers inside the platform without sharing personal contact info.",
    },
    {
      icon: ShieldCheck,
      content: "Trade with confidence through verified user profiles, ratings, and secure checkout.",
    },
];

const Feature01 = () => {
  return (
    <>
      <Feature featureData={featureData} />
    </>
  );
};

export default Feature01;
