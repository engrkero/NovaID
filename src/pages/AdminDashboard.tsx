import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Modal, CopyButton, Pagination } from '../../components/UI';
import { ShieldCheck, Search, FileText, Lock, Users, Wallet, Activity, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Simple decryption for admin display (in a real app, this should ideally happen securely, maybe a dedicated admin decrypt endpoint)
// We'll leave the PII encrypted in the UI unless a specific "Decrypt" button is clicked which calls an admin endpoint.
// For now, we'll just show the raw encrypted string to demonstrate immutability and encryption at rest.

interface AdminDashboardProps {
    token: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token }) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ users: 0, totalInflow: 0, verifications: 0 });

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            // Fetch logs via API (which enforces admin role)
            const res = await fetch('/api/logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if(res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
            }

            // Fetch basic stats
            const statsRes = await fetch('/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

        } catch (e) {
            console.error("Admin fetch error", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 !bg-slate-900 text-white">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-500/20 rounded-lg"><Wallet className="w-6 h-6 text-emerald-400"/></div>
                    </div>
                    <div className="text-sm text-slate-400 font-medium mb-1">Total Cash Inflow</div>
                    <div className="text-3xl font-bold font-display">₦{stats.totalInflow.toLocaleString()}</div>
                </Card>
                <Card className="p-6">
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg"><Users className="w-6 h-6 text-blue-600"/></div>
                    </div>
                    <div className="text-sm text-slate-500 font-medium mb-1">Total Users</div>
                    <div className="text-3xl font-bold font-display text-slate-900">{stats.users}</div>
                </Card>
                <Card className="p-6">
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-indigo-100 rounded-lg"><Activity className="w-6 h-6 text-indigo-600"/></div>
                    </div>
                    <div className="text-sm text-slate-500 font-medium mb-1">Total Verifications</div>
                    <div className="text-3xl font-bold font-display text-slate-900">{stats.verifications}</div>
                </Card>
            </div>

            <Card>
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Lock className="w-5 h-5 text-slate-700" />
                        <h2 className="text-xl font-bold text-slate-900">Immutable Audit Logs</h2>
                    </div>

                    {loading ? (
                        <div className="text-center py-10 text-slate-500">Loading secure logs...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                                        <th className="p-3 font-medium">Timestamp</th>
                                        <th className="p-3 font-medium">User Email</th>
                                        <th className="p-3 font-medium">Action</th>
                                        <th className="p-3 font-medium">Device FP</th>
                                        <th className="p-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="p-3 text-slate-600">{new Date(log.created_at).toLocaleString()}</td>
                                            <td className="p-3 font-mono text-xs">{log.users?.email || 'N/A'}</td>
                                            <td className="p-3 font-bold text-slate-700">{log.action_type.replace('_', ' ')}</td>
                                            <td className="p-3 font-mono text-[10px] text-slate-400 max-w-[120px] truncate">{log.device_fingerprint}</td>
                                            <td className="p-3">
                                                 <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase ${log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr><td colSpan={5} className="text-center p-6 text-slate-500">No logs found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}
