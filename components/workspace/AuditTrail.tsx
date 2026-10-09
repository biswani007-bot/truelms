import * as React from "react";

export interface AuditLogItem {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
}

export function AuditTrail({ logs }: { logs: AuditLogItem[] }) {
  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-gray-50 font-bold text-sm text-gray-900">Audit Trail</div>
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b bg-gray-50 text-gray-400 font-semibold uppercase">
            <th className="p-3">User</th>
            <th className="p-3">Action</th>
            <th className="p-3">Changes</th>
            <th className="p-3">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50 transition">
              <td className="p-3 font-semibold text-gray-900">{log.user}</td>
              <td className="p-3 text-gray-600">{log.action}</td>
              <td className="p-3 font-mono text-[10px] text-gray-500">
                {log.oldValue && <span className="line-through text-red-400 mr-2">{log.oldValue}</span>}
                {log.newValue && <span className="text-emerald-600">{log.newValue}</span>}
              </td>
              <td className="p-3 text-gray-400 font-medium">{log.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
