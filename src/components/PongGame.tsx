
import React, { useRef, useEffect, useState } from "react";
import NeonScoreboard from "./NeonScoreboard";
import { Button } from "@/components/ui/button";

const GAME_WIDTH = 460;
const GAME_HEIGHT = 320;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 64;
const BALL_SIZE = 16;
const PADDLE_MARGIN = 12;
const PLAYER_SPEED = 6;
const AI_SPEED = 4;
const BALL_SPEED_START = 4;
const BALL_SPEED_MAX = 8;

enum GameState {
  Start = "start",
  Playing = "playing",
  End = "end",
}

interface Paddle {
  y: number;
}

const initialBallState = () => ({
  x: GAME_WIDTH / 2 - BALL_SIZE / 2,
  y: GAME_HEIGHT / 2 - BALL_SIZE / 2,
  vx: Math.random() < 0.5 ? BALL_SPEED_START : -BALL_SPEED_START,
  vy: (Math.random() - 0.5) * 6,
});

const PongGame: React.FC = () => {
  const [player, setPlayer] = useState<Paddle>({ y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2 });
  const [ai, setAi] = useState<Paddle>({ y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2 });
  const [ball, setBall] = useState(initialBallState());
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>(GameState.Start);
  const [lastWinner, setLastWinner] = useState<string | null>(null);

  const animationRef = useRef(0);
  const keysPressed = useRef<{ArrowUp: boolean; ArrowDown: boolean}>({ ArrowUp: false, ArrowDown: false });

  // Reset everything for a fresh game
  const resetGame = () => {
    setPlayer({ y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2 });
    setAi({ y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2 });
    setBall(initialBallState());
    setPlayerScore(0);
    setAiScore(0);
    setLastWinner(null);
    setGameState(GameState.Start);
  };

  // Start a round, resets ball position and speeds
  const startRound = () => {
    setPlayer({ y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2 });
    setAi({ y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2 });
    setBall(initialBallState());
    setGameState(GameState.Playing);
  };

  // Keyboard controls
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp" || e.code === "ArrowDown") {
        keysPressed.current[e.code as "ArrowUp" | "ArrowDown"] = true;
      }
      if (e.code === "Space" && gameState !== GameState.Playing) {
        startRound();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp" || e.code === "ArrowDown") {
        keysPressed.current[e.code as "ArrowUp" | "ArrowDown"] = false;
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
    // Only re-run if gameState changes
    // eslint-disable-next-line
  }, [gameState]);
  
  // Game Loop
  useEffect(() => {
    if (gameState !== GameState.Playing) return;

    const loop = () => {
      // Player paddle movement
      let pY = player.y;
      if (keysPressed.current.ArrowUp) pY -= PLAYER_SPEED;
      if (keysPressed.current.ArrowDown) pY += PLAYER_SPEED;
      pY = Math.max(0, Math.min(GAME_HEIGHT - PADDLE_HEIGHT, pY));

      // AI paddle follows the ball, with basic smoothing
      let aY = ai.y + ((ball.y + BALL_SIZE/2 - (ai.y + PADDLE_HEIGHT/2)) > 0
        ? Math.min(AI_SPEED, ball.y + BALL_SIZE/2 - (ai.y + PADDLE_HEIGHT/2))
        : Math.max(-AI_SPEED, ball.y + BALL_SIZE/2 - (ai.y + PADDLE_HEIGHT/2))
      );
      aY = Math.max(0, Math.min(GAME_HEIGHT - PADDLE_HEIGHT, aY));

      // Ball movement and collision
      let {x, y, vx, vy} = ball;

      x += vx;
      y += vy;

      // Collisions with top/bottom
      if (y <= 0) {
        y = 0;
        vy *= -1;
      } else if (y + BALL_SIZE >= GAME_HEIGHT) {
        y = GAME_HEIGHT - BALL_SIZE;
        vy *= -1;
      }

      // Collisions with paddles
      // Player paddle
      if (
        x <= PADDLE_MARGIN + PADDLE_WIDTH &&
        y + BALL_SIZE > pY &&
        y < pY + PADDLE_HEIGHT &&
        vx < 0
      ) {
        x = PADDLE_MARGIN + PADDLE_WIDTH;
        vx = Math.min(BALL_SPEED_MAX, -vx * 1.08);
        vy += ((y + BALL_SIZE/2) - (pY + PADDLE_HEIGHT/2)) * 0.18;
      }
      // AI paddle
      else if (
        x + BALL_SIZE >= GAME_WIDTH - PADDLE_MARGIN - PADDLE_WIDTH &&
        y + BALL_SIZE > aY &&
        y < aY + PADDLE_HEIGHT &&
        vx > 0
      ) {
        x = GAME_WIDTH - PADDLE_MARGIN - PADDLE_WIDTH - BALL_SIZE;
        vx = Math.max(-BALL_SPEED_MAX, -vx * 1.08);
        vy += ((y + BALL_SIZE/2) - (aY + PADDLE_HEIGHT/2)) * 0.18;
      }

      // Score update (ball goes past paddle)
      if (x < 0) {
        setAiScore((prev) => prev + 1);
        setLastWinner("ai");
        setGameState(GameState.End);
        return;
      }
      if (x > GAME_WIDTH - BALL_SIZE) {
        setPlayerScore((prev) => prev + 1);
        setLastWinner("player");
        setGameState(GameState.End);
        return;
      }

      setPlayer((prev) => ({ ...prev, y: pY }));
      setAi((prev) => ({ ...prev, y: aY }));
      setBall({ x, y, vx, vy });
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
    // Only rerun if ball, player, or ai references change
    // eslint-disable-next-line
  }, [ball, gameState]);

  // Mobile touch paddle control
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onTouch = (e: TouchEvent) => {
      if (gameState !== GameState.Playing || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const touchY = e.touches[0].clientY - rect.top;
      let newPY = Math.max(
        0,
        Math.min(GAME_HEIGHT - PADDLE_HEIGHT, touchY - PADDLE_HEIGHT / 2)
      );
      setPlayer((prev) => ({ ...prev, y: newPY }));
    };
    const node = containerRef.current;
    node?.addEventListener("touchmove", onTouch);
    return () => node?.removeEventListener("touchmove", onTouch);
    // eslint-disable-next-line
  }, [gameState]);

  // Restart round after scoring
  useEffect(() => {
    if (gameState !== GameState.End) return;
    // Small delay then start again
    const t = setTimeout(() => {
      setBall(initialBallState());
      setGameState(GameState.Playing);
    }, 1000);
    return () => clearTimeout(t);
  }, [gameState]);

  // Win on reaching score 7
  const WIN_SCORE = 7;
  useEffect(() => {
    if (playerScore >= WIN_SCORE || aiScore >= WIN_SCORE) {
      setGameState(GameState.Start);
      setLastWinner(null);
    }
  }, [playerScore, aiScore]);

  return (
    <div className="flex flex-col items-center w-full animate-fade-in">
      <NeonScoreboard playerScore={playerScore} aiScore={aiScore} />
      <div
        className="relative mx-auto border-2 rounded-xl shadow-2xl"
        ref={containerRef}
        style={{
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          background:
            "radial-gradient(ellipse at center, #13111b 60%, #1A1F2C 100%)",
          borderColor: "#352b5c",
          boxShadow: "0 0 34px 3px #6E59A562,0 0 1px #9b87f5a0",
          overflow: "hidden",
        }}
      >
        {/* Middle Line */}
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 w-1 h-full"
          style={{
            background:
              "repeating-linear-gradient(180deg, #888 0 6px, transparent 6px 18px)",
            opacity: 0.46,
          }}
        />
        {/* Player Paddle */}
        <div
          className="absolute rounded-lg"
          style={{
            left: PADDLE_MARGIN,
            top: player.y,
            width: PADDLE_WIDTH,
            height: PADDLE_HEIGHT,
            background:
              "linear-gradient(180deg,#7FEFFF,#3DD8FE 60%,#7E69AB 100%)",
            boxShadow: "0 0 14px #1EAEDB,0 0 30px 2px #6E59A5",
            border: "2px solid #0ff",
          }}
        />
        {/* AI Paddle */}
        <div
          className="absolute rounded-lg"
          style={{
            left: GAME_WIDTH - PADDLE_MARGIN - PADDLE_WIDTH,
            top: ai.y,
            width: PADDLE_WIDTH,
            height: PADDLE_HEIGHT,
            background:
              "linear-gradient(180deg,#FF6EE6 10%,#7E69AB 68%,#9b87f5 98%)",
            boxShadow: "0 0 18px #FF6EE6,0 0 30px 2px #A700C3",
            border: "2px solid #f0f",
          }}
        />
        {/* Ball */}
        <div
          className="absolute rounded-full"
          style={{
            left: ball.x,
            top: ball.y,
            width: BALL_SIZE,
            height: BALL_SIZE,
            background:
              "radial-gradient(circle at 60% 42%, #fdf6fd,#ff6ee6 68%,#a700c3 100%)",
            boxShadow: "0 0 12px 0 #ff4fe033,0 0 60px 4px #7E69AB33",
            border: "2px solid #ff6ee6",
          }}
        />

        {/* Show messages for state */}
        {gameState === GameState.Start && (
          <div className="absolute inset-0 flex flex-col gap-5 items-center justify-center z-10 animate-scale-in">
            <div className="text-2xl md:text-3xl font-black neon-text text-[#fcf3ff] drop-shadow-[0_0_18px_#9B87F5]">
              Neon Pong
            </div>
            <p className="font-semibold text-white/70 text-xs mb-1">First to {WIN_SCORE} wins!</p>
            <Button variant="outline" className="text-lg px-8 py-4 shadow-md font-black tracking-wide border-2 border-[#7FEFFF] hover:scale-105 transition"
              style={{
                background: "linear-gradient(90deg, #7FEFFF24, #f0f 100%)",
                color: "#222",
                borderColor: "#7FEFFF",
                boxShadow: "0 0 8px #9b87f5, 0 0 32px #0ff2",
              }}
              onClick={startRound}
            >
              Start Game
            </Button>
            <div className="mt-2 text-white/60 text-xs">
              Use <b>↑</b>/<b>↓</b> or <b>touch</b> to move paddle
            </div>
          </div>
        )}

        {gameState === GameState.End && (
          <div className="absolute inset-0 flex flex-col gap-3 items-center justify-center z-20 animate-fade-in pointer-events-none">
            <div
              className={
                "font-bold text-lg px-5 py-2 rounded-xl shadow neon-text " +
                (lastWinner === "player"
                  ? "text-[#7FEFFF] drop-shadow-[0_0_8px_#0ff]" //
                  : "text-[#FF6EE6] drop-shadow-[0_0_8px_#f0f]")
              }
            >
              {lastWinner === "player" ? "Player Scores!" : "AI Scores!"}
            </div>
          </div>
        )}

        {/* Game End/Reset */}
        {(playerScore >= WIN_SCORE || aiScore >= WIN_SCORE) && (
          <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center z-30 animate-fade-in">
            <div className="text-2xl font-black neon-text text-[#fcf3ff] drop-shadow-[0_0_16px_#9B87F5]">
              {playerScore >= WIN_SCORE ? "You Win! 🎉" : "AI Wins! 🤖"}
            </div>
            <Button className="mt-2 shadow-md text-lg px-7 py-3" variant="default" onClick={resetGame}>
              Play Again
            </Button>
          </div>
        )}
      </div>
      <div className="text-white/60 text-xs mt-2">
        <span>
          Use <b>↑</b>/<b>↓</b> to move (or <b>touch</b> on mobile). Press <b>Space</b> to start round.
        </span>
      </div>
      <Button className="mt-8 px-4 py-2 font-bold shadow hover-scale text-[#7FEFFF] border-2 border-[#7FEFFF]" variant="outline"
        style={{ background: "linear-gradient(90deg, #7FEFFF14, #f0f2)", borderColor: "#7FEFFF", color: "#7FEFFF" }}
        onClick={resetGame}
      >
        Reset
      </Button>
    </div>
  );
};

export default PongGame;
