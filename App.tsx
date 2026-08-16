import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Search, 
  Smartphone, 
  CreditCard, 
  LayoutDashboard,
  Menu,
  X,
  ChevronRight,
  FileText,
  Trash2,
  Lock,
  Wallet,
  LogOut,
  Users,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { VerificationType, NavItem } from './types';
import { NIGERIAN_BANKS } from './constants';
import { verifyIdentity } from './src/services/apiService';
import { Card, Button, Input, Select, ResultDisplay, Alert, Modal, CopyButton } from './components/UI';
import { AdminDashboard as AdminView } from './src/pages/AdminDashboard';

// Add new type for Auth
interface AuthData {
    token: string;
    userId: string;
}

// --- Auth / Wallet Portal Components ---

const AuthPortal = ({ onLogin }: { onLogin: (auth: AuthData) => void }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email.');
            return;
        }
        if (pin.length !== 4) {
            setError('Please enter a valid 4-digit PIN.');
            return;
        }

        setLoading(true);
        setError('');

        try {
             const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
             const res = await fetch(endpoint, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ email, pin })
             });
             const data = await res.json();

             if (res.ok && data.token) {
                 onLogin(data);
             } else {
                 setError(data.error || 'Authentication failed');
             }
        } catch (e) {
             setError('Network error. Please try again.');
        } finally {
             setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10 bg-slate-50">
            <Card className="w-full max-w-md p-8 !bg-white shadow-2xl border-slate-200">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white mx-auto flex items-center justify-center text-2xl font-bold font-display mb-4 shadow-xl">N</div>
                    <h1 className="text-3xl font-display font-bold text-slate-900">NovaID</h1>
                    <p className="text-slate-500 mt-2 font-medium">Enterprise Identity Verification</p>
                </div>

                <div className="flex p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200">
                    <button 
                        onClick={() => { setMode('login'); setError(''); }}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Login
                    </button>
                    <button 
                        onClick={() => { setMode('register'); setError(''); }}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'register' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Register
                    </button>
                </div>

                <div className="space-y-4">
                    <Input
                        label="Email Address"
                        placeholder="you@company.com"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    />
                    <Input
                        label="Secure 4-Digit PIN"
                        placeholder="0 0 0 0"
                        maxLength={4}
                        type="password"
                        className="text-center tracking-[1em] font-mono text-2xl py-4 font-bold"
                        value={pin}
                        onChange={(e) => { setPin(e.target.value.replace(/\D/g,'')); setError(''); }}
                    />
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-rose-600 text-sm text-center bg-rose-50 p-3 rounded-lg border border-rose-100 font-medium flex items-center justify-center gap-2"
                        >
                            <AlertCircle size={16} />
                            {error}
                        </motion.div>
                    )}
                    <Button
                        className="w-full text-lg py-4"
                        onClick={handleAuth}
                        isLoading={loading}
                    >
                        {mode === 'login' ? 'Access Dashboard' : 'Create Account'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};


// --- Verification Components ---

interface VerificationProps {
    auth: AuthData;
    onVerified: () => void; // Trigger balance refresh
}

const BVNVerification: React.FC<VerificationProps> = ({ auth, onVerified }) => {
  const [bvn, setBvn] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!bvn || bvn.length !== 11) {
        setError("BVN must be exactly 11 digits.");
        return;
    }
    
    setLoading(true);
    setError(null);

    try {
        const res = await verifyIdentity(VerificationType.BVN, { bvn }, auth.token);
        if (res.success) {
            setResult(res.data);
            onVerified();
        } else {
            setError(res.message);
        }
    } catch (err) {
        setError("An unexpected error occurred.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-slate-900">BVN Resolution</h2>
            <p className="text-slate-500 mt-1">Verify identity using Bank Verification Number. Cost: ₦50</p>
          </div>
          
          <AnimatePresence>
            {error && (
                <div className="mb-6">
                     <Alert type="error" title="Verification Failed" message={error} />
                </div>
            )}
          </AnimatePresence>

          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <Input 
                label="BVN (11 Digits)" 
                placeholder="22223333444" 
                maxLength={11}
                value={bvn}
                onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setBvn(val);
                    setError(null);
                }}
              />
            </div>
            <Button className="w-full md:w-auto" onClick={handleVerify} isLoading={loading}>Verify Identity</Button>
          </div>
          <AnimatePresence>
            {result && <ResultDisplay title="KYC Identity Profile" data={result} />}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
};

const NINVerification: React.FC<VerificationProps> = ({ auth, onVerified }) => {
  const [nin, setNin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!nin || nin.length !== 11) {
        setError("NIN must be exactly 11 digits.");
        return;
    }

    setLoading(true);
    setError(null);

    try {
        const res = await verifyIdentity(VerificationType.NIN, { nin }, auth.token);
        if (res.success) {
            setResult(res.data);
            onVerified();
        } else {
            setError(res.message);
        }
    } catch (err) {
        setError("System error.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="p-8">
           <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-slate-900">NIN Lookup</h2>
            <p className="text-slate-500 mt-1">Retrieve NIMC data. Cost: ₦50</p>
          </div>

          <AnimatePresence>
            {error && (
                <div className="mb-6">
                     <Alert type="error" title="Lookup Failed" message={error} />
                </div>
            )}
          </AnimatePresence>

          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <Input 
                label="NIN (11 Digits)" 
                placeholder="11112222333" 
                maxLength={11}
                value={nin}
                onChange={(e) => {
                    setNin(e.target.value.replace(/\D/g, ''));
                    setError(null);
                }}
              />
            </div>
            <Button className="w-full md:w-auto" onClick={handleVerify} isLoading={loading}>Verify NIN</Button>
          </div>
           <AnimatePresence>
            {result && <ResultDisplay title="NIMC Record" data={result} />}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
};


const DisabledFeature = ({ title, desc }: { title: string, desc: string }) => (
    <div className="max-w-2xl mx-auto opacity-60 pointer-events-none">
        <Card>
            <div className="p-8 relative">
                <div className="absolute top-4 right-4 bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle size={14} /> Coming Soon
                </div>
                <div className="mb-6">
                    <h2 className="text-2xl font-display font-bold text-slate-900">{title}</h2>
                    <p className="text-slate-500 mt-1">{desc}</p>
                </div>
                <div className="space-y-4">
                    <Input label="Input Field" placeholder="Currently disabled..." disabled />
                    <Button disabled className="w-full bg-slate-300 text-slate-500">Feature Disabled</Button>
                </div>
            </div>
        </Card>
    </div>
);


const Dashboard = ({ onNavigate }: { onNavigate: (id: string) => void }) => {
    const tools = [
        { id: 'bvn', title: "BVN Resolution", desc: "Full KYC via BVN", icon: <Users className="w-6 h-6 text-blue-500"/>, active: true },
        { id: 'nin', title: "NIN Lookup", desc: "NIMC database check", icon: <ShieldCheck className="w-6 h-6 text-indigo-500"/>, active: true },
        { id: 'phone', title: "Phone Intel", desc: "Truecaller-style ID", icon: <Smartphone className="w-6 h-6 text-slate-400"/>, active: false },
        { id: 'account', title: "Account Resolve", desc: "Get account names", icon: <CreditCard className="w-6 h-6 text-slate-400"/>, active: false },
    ];

    return (
        <div className="space-y-8">
             <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck size={120} /></div>
                <h2 className="text-2xl font-bold mb-2 relative z-10">Welcome to NovaID</h2>
                <p className="text-slate-400 max-w-lg relative z-10">The advanced identity verification layer for Nigeria. Powered by robust APIs and secure wallet infrastructure.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tools.map((tool, i) => (
                    <motion.div 
                        key={tool.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + (i * 0.1) }}
                        onClick={() => tool.active && onNavigate(tool.id)}
                        className={`group bg-white p-6 rounded-2xl border border-slate-200 shadow-lg shadow-blue-900/5 transition-all relative overflow-hidden ${tool.active ? 'hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer' : 'opacity-60 grayscale'}`}
                    >
                         {tool.active && <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 opacity-50" />}
                         {!tool.active && <div className="absolute top-4 right-4 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Coming Soon</div>}
                         <div className="relative z-10">
                            <div className={`w-12 h-12 rounded-xl border border-slate-100 flex items-center justify-center mb-4 shadow-sm ${tool.active ? 'bg-white group-hover:scale-110 transition-transform duration-300' : 'bg-slate-50'}`}>
                                {tool.icon}
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{tool.title}</h3>
                            <p className="text-slate-500 text-sm mb-4">{tool.desc}</p>
                            {tool.active && (
                                <div className="flex items-center text-blue-600 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                                    Launch Tool <ChevronRight className="w-4 h-4 ml-1" />
                                </div>
                            )}
                         </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

// --- Main App Layout ---

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [balance, setBalance] = useState(0);
  const [accountInfo, setAccountInfo] = useState<{acc: string, bank: string} | null>(null);

  // Real DB Fetch logic
  const fetchUserData = async () => {
      if(!auth) return;
      try {
          const res = await fetch('/api/user', {
              headers: {
                  'Authorization': `Bearer ${auth.token}`
              }
          });
          if (res.ok) {
              const data = await res.json();
              setBalance(data.balance);
              setAccountInfo({ acc: data.virtual_account_number, bank: data.virtual_account_bank });
          }
      } catch (e) {
          console.error("Failed to fetch user data", e);
      }
  };

  useEffect(() => {
      const storedAuth = sessionStorage.getItem('novaid_auth');
      if (storedAuth) {
          setAuth(JSON.parse(storedAuth));
      }
  }, []);

  useEffect(() => {
      if (auth) {
          fetchUserData();
          // Poll balance every 15s in case of webhook funding
          const interval = setInterval(fetchUserData, 15000);
          return () => clearInterval(interval);
      }
  }, [auth]);

  const handleLogin = (data: AuthData) => {
      setAuth(data);
      sessionStorage.setItem('novaid_auth', JSON.stringify(data));
  };

  const handleLogout = () => {
      setAuth(null);
      setBalance(0);
      setAccountInfo(null);
      sessionStorage.removeItem('novaid_auth');
      setActiveTab('dashboard');
  };


  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'bvn', label: 'BVN Resolution', icon: <Users size={20} />, type: VerificationType.BVN },
    { id: 'nin', label: 'NIN Lookup', icon: <ShieldCheck size={20} />, type: VerificationType.NIN },
    { id: 'phone', label: 'Phone ID', icon: <Smartphone size={20} />, type: VerificationType.PHONE },
    { id: 'account', label: 'Account Verify', icon: <CreditCard size={20} />, type: VerificationType.ACCOUNT },
    { id: 'admin', label: 'Admin Logs', icon: <Lock size={20} /> },
  ];

  if (!auth) {
      return <AuthPortal onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={setActiveTab} />;
      case 'bvn': return <BVNVerification auth={auth} onVerified={fetchUserData} />;
      case 'nin': return <NINVerification auth={auth} onVerified={fetchUserData} />;
      case 'phone': return <DisabledFeature title="Phone Intelligence" desc="Caller ID features are currently disabled." />;
      case 'account': return <DisabledFeature title="Account Resolution" desc="Bank account verification is coming soon." />;
      case 'admin': return <AdminView token={auth.token} />;
      default: return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen flex text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 relative z-10 bg-slate-50">
      
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 fixed h-full z-20 shadow-sm">
        <div className="p-8">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold font-display text-xl shadow-lg shadow-slate-900/20">
                    N
                </div>
                <span className="font-display font-bold text-2xl tracking-tight text-slate-900">NovaID</span>
            </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-slate-100 text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.icon}
              {item.label}
              {['phone', 'account'].includes(item.id) && <span className="ml-auto text-[9px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-500 uppercase font-bold">SOON</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-900 rounded-xl p-4 text-white shadow-lg shadow-slate-900/10">
                 <div className="flex justify-between items-center mb-2">
                     <div className="text-xs text-slate-400 font-medium">Wallet Balance</div>
                     <div className="flex items-center gap-1 text-xs text-emerald-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> Live</div>
                 </div>
                 <div className="font-display font-bold text-2xl">₦{balance.toLocaleString()}</div>

                 {accountInfo?.acc && (
                     <div className="mt-4 pt-3 border-t border-slate-700/50">
                         <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">Fund Wallet via Transfer</div>
                         <div className="flex justify-between items-center bg-slate-800 p-2 rounded-lg">
                             <div>
                                 <div className="font-mono text-sm font-bold tracking-widest">{accountInfo.acc}</div>
                                 <div className="text-[10px] text-slate-400">{accountInfo.bank}</div>
                             </div>
                             <CopyButton text={accountInfo.acc} />
                         </div>
                     </div>
                 )}

                 <button onClick={handleLogout} className="mt-4 w-full py-2 bg-slate-800/50 rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 text-rose-400">
                    <LogOut className="w-3 h-3" /> Secure Logout
                 </button>
            </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-200 z-30 px-6 py-4 flex items-center justify-between">
         <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold font-display">N</div>
                <span className="font-display font-bold text-xl">NovaID</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
            {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed inset-0 top-[73px] bg-white z-20 p-4 lg:hidden flex flex-col"
            >
                <div className="mb-6 p-4 bg-slate-900 text-white rounded-xl shadow-lg">
                    <div className="text-sm text-slate-400 mb-1 font-medium">Wallet Balance</div>
                    <div className="text-2xl font-bold">₦{balance.toLocaleString()}</div>
                    {accountInfo?.acc && <div className="mt-2 text-xs text-slate-300">Fund Account: {accountInfo.acc} ({accountInfo.bank})</div>}
                </div>
                <nav className="space-y-2 flex-1">
                {navItems.map((item) => (
                    <button
                    key={item.id}
                    onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-lg font-medium ${
                        activeTab === item.id
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-500'
                    }`}
                    >
                    {item.icon}
                    {item.label}
                    </button>
                ))}
                </nav>
                <button onClick={handleLogout} className="w-full py-4 text-rose-600 font-medium border-t border-slate-100 mt-4 flex items-center justify-center gap-2">
                    <LogOut size={20} /> Logout
                </button>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 pt-[80px] lg:pt-0 p-6 lg:p-10 min-h-screen transition-all">
        <header className="flex justify-between items-center mb-8 lg:mt-4">
            <div>
                <h1 className="text-2xl lg:text-3xl font-display font-bold text-slate-900">
                    {navItems.find(n => n.id === activeTab)?.label}
                </h1>
                <p className="text-slate-500 mt-1 font-medium">Manage and verify identities with precision.</p>
            </div>
            <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">Enterprise API</div>
                    <div className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1"><Lock size={10}/> Secure Connection</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 shadow-sm overflow-hidden p-1">
                   <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-white">
                        <ShieldCheck size={20} />
                   </div>
                </div>
            </div>
        </header>

        <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            {renderContent()}
        </motion.div>
      </main>
    </div>
  );
};

export default App;
