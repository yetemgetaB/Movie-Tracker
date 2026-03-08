import { useState, useEffect } from "react";

const LoadingScreen = ({ onFinished }: { onFinished: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "fadeOut">("loading");

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setPhase("fadeOut");
          setTimeout(onFinished, 600);
          return 100;
        }
        // Ease-out acceleration
        const remaining = 100 - prev;
        const step = Math.max(1, remaining * 0.08 + Math.random() * 3);
        return Math.min(100, prev + step);
      });
    }, 40);
    return () => clearInterval(interval);
  }, [onFinished]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center mica-bg transition-opacity duration-500 ${
        phase === "fadeOut" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[80px] animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Logo / Brand */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Animated film reel icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center backdrop-blur-sm shadow-[0_0_40px_hsl(var(--glow-soft))]">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              className="text-primary drop-shadow-[0_0_12px_hsl(var(--glow-soft))]"
              style={{ animation: "spin-slow 3s linear infinite" }}
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <circle cx="12" cy="5" r="1.5" fill="currentColor" />
              <circle cx="12" cy="19" r="1.5" fill="currentColor" />
              <circle cx="5" cy="12" r="1.5" fill="currentColor" />
              <circle cx="19" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </div>
          {/* Orbiting dot */}
          <div
            className="absolute w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--glow))]"
            style={{
              animation: "orbit 2s linear infinite",
              top: "50%",
              left: "50%",
            }}
          />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
            Movie Vault
          </h1>
          <p className="text-sm text-muted-foreground font-medium tracking-wide uppercase">
            Loading your collection
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-56 space-y-3">
          <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-100 ease-out shadow-[0_0_12px_hsl(var(--glow-soft))]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center tabular-nums">
            {Math.round(progress)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
