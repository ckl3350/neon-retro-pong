
import React from "react";

interface NeonScoreboardProps {
  playerScore: number;
  aiScore: number;
}

const NeonScoreboard: React.FC<NeonScoreboardProps> = ({
  playerScore,
  aiScore,
}) => (
  <div className="flex justify-center gap-12 mb-6 select-none">
    <div className="flex flex-col items-center">
      <span className="text-xs text-white/70 mb-1 tracking-widest">PLAYER</span>
      <span
        className="text-4xl font-black neon-text shadow-[0_0_14px_#0FF] px-4 py-2 rounded"
        style={{
          textShadow: "0 0 10px #0ff,0 0 22px #1eaedb",
          color: "#7FEFFF",
        }}
      >
        {playerScore}
      </span>
    </div>
    <div className="flex flex-col items-center">
      <span className="text-xs text-white/70 mb-1 tracking-widest">AI</span>
      <span
        className="text-4xl font-black neon-text shadow-[0_0_14px_#E16EE6] px-4 py-2 rounded"
        style={{
          textShadow: "0 0 10px #ff4fe0,0 0 24px #A700C3",
          color: "#FF6EE6",
        }}
      >
        {aiScore}
      </span>
    </div>
  </div>
);

export default NeonScoreboard;
