export default function LoadingDots({
  fullscreen = false,
  size = "w-2.5 h-2.5",
  color = "bg-blue-600",
}) {
  const containerClasses = fullscreen
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/70 backdrop-blur-md"
    : "flex flex-col items-center justify-center w-full h-full min-h-[300px] pointer-events-none";

  return (
    <div className={containerClasses}>
      <div className="flex space-x-2">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`${size} ${color} rounded-full animate-pulse`}
            style={{
              animationDelay: `${index * 0.15}s`,
              animationDuration: "1.2s",
            }}
          />
        ))}
      </div>
      <p className="mt-4 text-[7px] font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">
        {fullscreen ? "System Loading" : "Processing..."}
      </p>
    </div>
  );
}
