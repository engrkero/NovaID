import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, AlertCircle, X, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const Card: React.FC<CardProps> = ({ children, className = "", delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`bg-white/80 rounded-2xl border border-white/20 shadow-xl shadow-blue-900/5 backdrop-blur-md ${className}`}
    >
      {children}
    </motion.div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({ children, isLoading, variant = 'primary', className = "", ...props }) => {
  const base = "relative px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden";
  
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] shadow-lg shadow-slate-900/20",
    secondary: "bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-[0.98]",
    outline: "border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-[0.98]",
    danger: "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 active:scale-[0.98]"
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? (
        <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = "", ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="text-sm font-medium text-slate-600 ml-1">{label}</label>}
    <input
      className={`w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400 ${className}`}
      {...props}
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, children, className = "", ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="text-sm font-medium text-slate-600 ml-1">{label}</label>}
    <select
      className={`w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
);

export const StatusBadge: React.FC<{ success: boolean; text?: string }> = ({ success, text }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
    success ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
  }`}>
    {success ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
    {text || (success ? 'Verified' : 'Failed')}
  </span>
);

export const Alert: React.FC<{ type: 'error' | 'success' | 'info'; title?: string; message: string }> = ({ type, title, message }) => {
  const styles = {
    error: "bg-rose-50 text-rose-900 border-rose-100",
    success: "bg-emerald-50 text-emerald-900 border-emerald-100",
    info: "bg-blue-50 text-blue-900 border-blue-100"
  };
  const icons = {
    error: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
    success: <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    info: <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border ${styles[type]} flex gap-3 items-start shadow-sm`}
    >
      {icons[type]}
      <div>
        {title && <h4 className="font-semibold text-sm mb-1">{title}</h4>}
        <p className="text-sm opacity-90">{message}</p>
      </div>
    </motion.div>
  );
};

export const ResultDisplay: React.FC<{ data: any, title: string }> = ({ data, title }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }} 
      animate={{ opacity: 1, height: 'auto' }} 
      exit={{ opacity: 0, height: 0 }}
      className="mt-6"
    >
      <div className="p-6 rounded-2xl bg-white/50 border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
        </div>

        <div className="flex justify-between items-start mb-6">
          <h3 className="text-lg font-display font-semibold text-slate-900">{title}</h3>
          <StatusBadge success={true} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(data).map(([key, value], idx) => {
             if (typeof value === 'object' && value !== null) return null; 
             return (
              <motion.div 
                key={key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm"
              >
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                <div className="font-medium text-slate-800 break-all">{String(value)}</div>
              </motion.div>
             );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-0 right-0 top-0 bottom-0 m-auto w-full max-w-2xl h-fit max-h-[90vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col border border-white/50"
                    >
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-display font-bold text-lg text-slate-900">{title}</h3>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

export const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (p: number) => void }> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-center gap-2 mt-4">
            <button 
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-600 font-medium">Page {currentPage} of {totalPages}</span>
            <button 
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    )
}