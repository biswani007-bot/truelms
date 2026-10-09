export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F7FA]">
      {/* TrueLern Logo */}
      <img
        src="/TrueernLogo_primary.png"
        alt="TrueLern"
        className="w-[260px] h-auto object-contain mb-8"
        style={{
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        }}
      />

      {/* Subtle progress bar */}
      <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: "40%",
            background: "linear-gradient(90deg, #1E4ED8, #10B981)",
            animation: "shimmer 1.8s ease-in-out infinite",
          }}
        />
      </div>

      {/* Loading text */}
      <p className="mt-4 text-sm text-slate-500 font-medium tracking-wide uppercase">
        Loading...
      </p>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-250%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
