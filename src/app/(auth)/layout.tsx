import Image from "next/image";
import { Quote } from "lucide-react";

export default function AuthLayout({ children }) {
  return (
    <div className="flex flex-row items-center justify-center w-full h-full">
      <div className="flex flex-col items-center justify-center w-full xl:w-4/12 h-full p-2 gap-2 border-r border-border">
        {children}
      </div>
      <div className="xl:flex hidden flex-col items-center justify-center w-full xl:w-8/12 h-full p-2 gap-2">
        <div className="flex items-center justify-start w-6/12 h-fit p-2 gap-2">
          <Quote className="text-default" />
        </div>
        <div className="flex items-center justify-center w-6/12 h-fit p-2 gap-2 text-xs font-light">
          EverGreen Internal makes managing company operations effortless — from
          sales and warehousing to production, everything in one place.
        </div>
        <div className="flex items-center justify-end w-6/12 h-fit p-2 gap-2">
          <Quote className="text-default rotate-180" />
        </div>
        <div className="flex items-center justify-center w-full h-fit p-2 gap-2">
          <Image
            src="/images/index.png"
            width={200}
            height={200}
            alt="illustration"
          />
        </div>
      </div>
    </div>
  );
}
