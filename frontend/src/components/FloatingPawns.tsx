const PAWNS = Array.from({ length: 20 }).map((_, i) => ({
  id: i,
  left: Math.random() * 100,
  size: Math.random() * 3 + 1.5,
  delay: Math.random() * 12,
  duration: Math.random() * 15 + 22,
}));

export function FloatingPawns() {
  return (
    // pointer-events-none. It ensures users can still click the login boxes through the pawns.
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {PAWNS.map((pawn) => (
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
         <img src={pawnImg} alt="pawn background" className="w-full h-auto opacity-70" />
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