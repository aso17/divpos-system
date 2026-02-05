export default function LoadingDots({
  fullscreen = false,
  overlay = false, // Prop baru untuk mode melayang di atas tabel
  size = "w-2 h-2",
  color = "bg-blue-600",
}) {
  // Susun class berdasarkan kondisi
  let containerClasses =
    "flex flex-col items-center justify-center transition-all duration-300 ";

  if (fullscreen) {
    containerClasses += "fixed inset-0 z-[9999] bg-white/70 backdrop-blur-md";
  } else if (overlay) {
    // INI KUNCINYA: Absolute agar menempel di div 'relative' terdekat
    containerClasses +=
      "absolute inset-0 z-20 bg-white/40 backdrop-blur-[1px] w-full h-full";
  } else {
    containerClasses += "w-full h-full py-10";
  }

  return (
    <div className={containerClasses}>
      <div className="flex space-x-1.5">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`${size} ${color} rounded-full animate-bounce`}
            style={{
              animationDelay: `${index * 0.15}s`,
              animationDuration: "0.8s",
            }}
          />
        ))}
      </div>
      {/* Tampilkan teks hanya jika bukan mode overlay agar tidak sumpek */}
      {!overlay && (
        <p className="mt-4 text-[7px] font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">
          {fullscreen ? "System Loading" : "Processing..."}
        </p>
      )}
    </div>
  );
}
