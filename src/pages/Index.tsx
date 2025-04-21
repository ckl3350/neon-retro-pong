
import React from "react";
import PongGame from "@/components/PongGame";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1A1F2C] to-[#411D56]">
      <div className="max-w-2xl w-full mx-auto px-3 pt-10 pb-14">
        <PongGame />
        <div className="mt-8 text-center text-[13px] text-gray-400 select-none font-mono tracking-wide">
          Pong &copy; {new Date().getFullYear()} &mdash; Neon Retro Edition
        </div>
      </div>
    </div>
  );
};

export default Index;
