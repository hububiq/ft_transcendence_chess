import { useMemo } from "react";

export function FloatingPawns() {
  // Generate 20 random pawns when the component loads
  const pawns = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // Random horizontal position (0% - 100%)
      size: Math.random() * 3 + 1.5, // Random size (1.5rem - 4.5rem)
      delay: Math.random() * 12, // Random start delay (0s - 15s)
      duration: Math.random() * 15 + 22, // Random speed (15s - 37s)
    }));
  }, []);

  return (
    // pointer-events-none. It ensures users can still click the login boxes through the pawns.
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {pawns.map((pawn) => (
        <div
          key={pawn.id}
          className="absolute text-neutral-900/70" // Dark grey, semi-transparent
          style={{
            left: `${pawn.left}%`,
            bottom: "-10%",
            fontSize: `${pawn.size}rem`,
            animation: `float-up ${pawn.duration}s linear infinite`,
            animationDelay: `${pawn.delay}s`,
          }}
        >
          ♟
        </div>
      ))}

      {/* Inline CSS Keyframes for the floating animation */}
      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.4; /* Fades in at the bottom */
          }
          90% {
            opacity: 0.4; /* Fades out at the top */
          }
          100% {
            transform: translateY(-120vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}