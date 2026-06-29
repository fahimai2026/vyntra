import React from 'react';
import { useSecurityLogs } from '../../hooks/useSecurityLogs';
import { Shield, ShieldAlert, CheckCircle, AlertTriangle, Clock, User, Activity } from 'lucide-react';

export function SecurityLogsView() {
  const { logs, loading } = useSecurityLogs();

  return (
    <div className="flex-1 w-full flex flex-col h-full overflow-y-auto pb-20 sm:pb-4 p-4">
        <div className="w-full max-w-5xl">
            <div className="mb-6 border-b border-vyntra-border pb-4 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <ShieldAlert className="text-vyntra-primary" /> Vyntra Guardian Logs
                </h1>
                <p className="text-vyntra-text-sec text-sm mt-1">Real-time security analytics and AI moderation decisions</p>
              </div>
              <div className="bg-vyntra-primary/10 text-vyntra-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-vyntra-primary/30">
                <Activity size={14} className="animate-pulse" /> Live Monitoring
              </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vyntra-primary"></div>
                </div>
            ) : logs.length === 0 ? (
                <div className="bg-vyntra-surface border border-vyntra-border rounded-xl p-12 text-center text-vyntra-text-sec">
                    <Shield size={48} className="mx-auto mb-4 opacity-30" />
                    <p>No security events logged yet.</p>
                </div>
            ) : (
                <div className="bg-vyntra-surface border border-vyntra-border rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-black/20 text-vyntra-text-sec uppercase text-xs border-b border-vyntra-border">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Status / Action</th>
                                    <th className="px-4 py-3 font-medium">Context</th>
                                    <th className="px-4 py-3 font-medium">Threat Type</th>
                                    <th className="px-4 py-3 font-medium">Confidence</th>
                                    <th className="px-4 py-3 font-medium">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-vyntra-border">
                                {logs.map((log) => {
                                    const ActionIcon = log.action === 'BLOCKED' ? Ban : log.action === 'FLAGGED' ? AlertTriangle : CheckCircle;
                                    const actionColor = log.action === 'BLOCKED' ? 'text-red-500' : log.action === 'FLAGGED' ? 'text-orange-500' : 'text-green-500';
                                    const actionBg = log.action === 'BLOCKED' ? 'bg-red-500/10' : log.action === 'FLAGGED' ? 'bg-orange-500/10' : 'bg-green-500/10';
                                    
                                    return (
                                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 border border-current/20 ${actionColor} ${actionBg}`}>
                                                    <ActionIcon size={12} />
                                                    {log.action}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="flex items-center gap-1 text-xs text-vyntra-text-sec">
                                                        <Clock size={10} /> 
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs font-mono">
                                                        <User size={10} className="text-vyntra-primary" />
                                                        {log.user_id.slice(0, 8)}...
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-widest mt-0.5 bg-black/40 px-1.5 py-0.5 rounded w-fit">
                                                        Source: {log.source}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${log.threat_type !== 'NONE' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/10 text-green-500'}`}>
                                                    {log.threat_type || 'NONE'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-16 bg-black/40 rounded-full overflow-hidden flex-shrink-0">
                                                        <div 
                                                            className={`h-full ${log.confidence > 80 ? 'bg-red-500' : log.confidence > 40 ? 'bg-orange-500' : 'bg-green-500'}`}
                                                            style={{ width: `${log.confidence}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-vyntra-text-sec w-8">{log.confidence}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="max-w-[280px] sm:max-w-md whitespace-normal leading-relaxed text-gray-300">
                                                    {log.reason}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}

// Need to import Ban
import { Ban } from 'lucide-react';
