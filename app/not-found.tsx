import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-black mb-6">
        404
      </div>
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
        Page Not Found
      </h1>
      <p className="mt-3 text-slate-500 max-w-md text-base leading-relaxed">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md text-sm transition"
        >
          Return to Home
        </Link>
        <Link
          href="/courses"
          className="px-6 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-xl text-sm transition"
        >
          Explore Courses
        </Link>
      </div>
    </div>
  );
}
