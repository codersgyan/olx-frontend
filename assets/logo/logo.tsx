import Image from "next/image";
import { Instrument_Serif } from "next/font/google";
import type { SVGAttributes } from "react";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

const Logo = (props: SVGAttributes<SVGElement>) => {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex flex-row items-center justify-center gap-x-2">
        <Image
          width={1000}
          height={1000}
          alt="logo"
          src={"/panda_logo.png"}
          className="w-10 h-10"
        />
        <span className="flex items-baseline gap-1 text-lg">
          <span className={`${instrumentSerif.className} text-xl font-black tracking-wide`}>Coder&apos;s</span>
          <span className={`${instrumentSerif.className} text-xl font-black tracking-wide`}>
            Shop
          </span>
        </span>
      </div>
    </div>
  );
};

export default Logo;
