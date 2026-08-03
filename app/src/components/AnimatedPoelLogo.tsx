"use client";

/**
 * ELSIAA loading mark (keeps AnimatedPoelLogo export name for copied UI).
 */
type AnimatedPoelLogoProps = {
  width?: string;
  height?: string;
  colors?: string[];
  speed?: number;
  pulse?: boolean;
  label?: string;
  className?: string;
};

export default function AnimatedPoelLogo({
  width = "120px",
  height = "120px",
  speed = 1.2,
  label = "ELSIAA",
  className,
}: AnimatedPoelLogoProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}
    >
      <img
        src="/assets/elsiaa-lion-192.png"
        alt=""
        style={{
          width: "55%",
          height: "55%",
          objectFit: "contain",
          animation: `elsiaa-pulse ${Math.max(0.6, 2 / speed)}s ease-in-out infinite`,
        }}
      />
      {label ? (
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#1e6b3c",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
      ) : null}
      <style>{`@keyframes elsiaa-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.72; transform: scale(0.96); } }`}</style>
    </div>
  );
}
