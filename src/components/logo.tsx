import Link from "next/link";
import React from "react";

const Logo: React.FC = () => {
  return (
    <Link href="/workflow" className="flex items-center gap-1">
      <div
        className="bg-primary size-7 rounded-sm
       flex items-center justify-center text-lg text-white
      "
      >
        <span>S</span>
      </div>
      <div className="flex items-center">
        <span className="font-black text-primary text-lg">{"Syntra "}</span>
        <span
          className="font-black text-foreground
        text-lg"
        >
          agent.ai
        </span>
      </div>
    </Link>
  );
};

export default Logo;
