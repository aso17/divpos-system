export default function SubmitButton({
  isSubmitting = false,
  label = "Submit",
  loadingLabel = "Processing...",
  onClick,
  color = "#2563eb", // default blue
  fullWidth = true,
  type = "submit",
  className = "", // 👈 tambahan
}) {
  return (
    <button
      type={type}
      disabled={isSubmitting}
      onClick={onClick}
      className={`
        ${fullWidth ? "w-full" : ""}
        rounded-lg py-2 px-4
        text-white font-semibold
        flex justify-center items-center gap-2
        disabled:opacity-70 disabled:cursor-not-allowed
        transition
        ${className}   /* 👈 inject dari luar */
      `}
      style={{ backgroundColor: color }}
    >
      {isSubmitting && (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      )}
      {isSubmitting ? loadingLabel : label}
    </button>
  );
}
