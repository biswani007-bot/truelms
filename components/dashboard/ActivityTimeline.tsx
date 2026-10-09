import * as React from "react";

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  timestamp: string;
}

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex justify-between items-center text-xs p-3 bg-slate-50 border rounded-lg">
          <div>
            <span className="font-bold text-gray-900">{item.user}</span>
            <span className="text-gray-500 ml-1 font-medium">{item.action}</span>
          </div>
          <span className="text-[10px] text-gray-400 font-semibold">{item.timestamp}</span>
        </div>
      ))}
    </div>
  );
}
