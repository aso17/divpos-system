export default function LoadingDots({
  fullscreen = false,
  overlay = false,
  size = "w-2.5 h-2.5",
  color = "bg-emerald-500",
}) {
  let containerClasses =
    "flex flex-col items-center justify-center transition-all duration-300 ";

  if (fullscreen) {
    containerClasses += "fixed inset-0 z-[9999] bg-white/70 backdrop-blur-xl";
  } else if (overlay) {
    containerClasses += "absolute inset-0 z-20 bg-white/50 backdrop-blur-sm";
  } else {
    containerClasses += "w-full h-full py-16";
  }

  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`${size} ${color} rounded-full 
                        shadow-md shadow-emerald-500/40
                        animate-pulse`}
            style={{
              animationDelay: `${index * 0.15}s`,
              animationDuration: "1.2s",
            }}
          />
        ))}
      </div>

      {!overlay && (
        <p className="mt-6 text-xs font-medium text-slate-400 tracking-widest animate-pulse">
          {fullscreen ? "Loading System" : "Processing..."}
        </p>
      )}
    </div>
  );
}
