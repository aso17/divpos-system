export default function LoadingDots({
  fullscreen = false,
  size = "w-3 h-3",
  colors = ["bg-blue-500", "bg-green-500", "bg-purple-500"],
}) {
  // 1. Optimasi: Gunakan class kondisional daripada membuat sub-komponen Wrapper
  // Ini mencegah remount yang bikin berat/lambat.
  const containerClasses = fullscreen
    ? "fixed inset-0 z-[9999] flex items-center justify-center bg-slate-100/80 backdrop-blur-sm"
    : "flex items-center justify-center w-full h-full p-4 pointer-events-none";
  // pointer-events-none: Agar klik 'menembus' loading dan tidak menghalangi tombol

  return (
    <div className={containerClasses}>
      <div className="flex space-x-2">
        {colors.map((color, index) => (
          <div
            key={index}
            className={`${size} ${color} rounded-full animate-bounce`}
            style={{
              // 2. Gunakan delay positif agar sinkronisasi GPU lebih ringan
              animationDelay: `${index * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
