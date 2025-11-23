import { AuditLogEntry, VerificationType } from "../types";

const STORAGE_KEY = 'novaid_audit_logs';

export const saveAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
  const logs = getAuditLogs();
  const newEntry: AuditLogEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  // Keep only last 100 logs
  const updatedLogs = [newEntry, ...logs].slice(0, 100);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (e) {
    console.error("Failed to save audit log", e);
  }
  return newEntry;
};

export const getAuditLogs = (): AuditLogEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse audit logs", e);
    return [];
  }
};

export const clearAuditLogs = () => {
  localStorage.removeItem(STORAGE_KEY);
};