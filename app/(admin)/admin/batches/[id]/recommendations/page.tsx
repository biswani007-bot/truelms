import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../../../config/db";
import { batchRecommendationRepository } from "../../../../../../repositories/batch-recommendation.repository";
import { IBatchRecommendation } from "../../../../../../models/batch-recommendation.model";

interface Props { params: Promise<{ id: string }>; }
export const revalidate = 0;

const SeverityBadge = ({ severity }: { severity: IBatchRecommendation["severity"] }) => {
  const colors = {
    info: "bg-blue-950 text-blue-400 border-blue-500/20",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    critical: "bg-red-950 text-red-400 border-red-500/20",
  };
  return (
    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${colors[severity]}`}>
      {severity}
    </span>
  );
};

export default async function RecommendationsPage({ params }: Props) {
  await connectDB();
  const { id } = await params;

  const all = await batchRecommendationRepository.findMany({ batch: id });
  const unresolved = all.filter((r) => !r.isResolved);
  const resolved = all.filter((r) => r.isResolved);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Recommendations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Advisory guidance only — no automatic execution. {unresolved.length} unresolved.
          </p>
        </div>
        <Link href={`/admin/batches/${id}`} className="px-4 py-2 border border-gray-200 text-gray-400 hover:bg-white rounded-lg text-sm transition">← Back</Link>
      </div>

      {/* Unresolved */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Unresolved ({unresolved.length})</h2>
        {unresolved.map((rec) => (
          <div key={rec._id?.toString()} className="bg-gray-50 border border-gray-200 p-5 rounded-2xl flex justify-between items-start gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={rec.severity} />
                <span className="text-white font-bold">{rec.title}</span>
              </div>
              <p className="text-sm text-gray-500">{rec.message}</p>
              {rec.triggeredByRule && (
                <span className="text-[9px] text-gray-400 font-mono">Rule: {rec.triggeredByRule}</span>
              )}
            </div>
          </div>
        ))}
        {unresolved.length === 0 && (
          <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center text-emerald-600 text-sm font-medium">
            ✓ Batch is operating nominally. No unresolved recommendations.
          </div>
        )}
      </div>

      {/* Resolved */}
      {resolved.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Resolved ({resolved.length})</h2>
          {resolved.map((rec) => (
            <div key={rec._id?.toString()} className="bg-gray-50/50 border border-slate-850 p-4 rounded-xl flex justify-between items-start gap-4 opacity-60">
              <div>
                <p className="text-gray-500 text-sm font-medium line-through">{rec.title}</p>
                {rec.resolvedNote && <p className="text-xs text-gray-400 mt-1">{rec.resolvedNote}</p>}
              </div>
              <span className="text-[9px] text-emerald-600 uppercase font-bold border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 rounded">resolved</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
