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
  ExternalLink,
  Filter,
  Lock,
  Wallet,
  LogOut,
  MessageSquare,
  Users
} from 'lucide-react';
import { VerificationType, NavItem, AuditLogEntry } from './types';
import { NIGERIAN_BANKS } from './constants';
import { verifyIdentity } from './services/geminiService';
import { saveAuditLog, getAuditLogs, clearAuditLogs } from './services/auditService';
import { purchaseCredits, validatePin, deductCredit, getBalance } from './services/creditService';
import { Card, Button, Input, Select, ResultDisplay, Alert, Modal, Pagination, CopyButton } from './components/UI';

// --- Auth / Credit Portal Components ---

const CreditPortal = ({ onLogin }: { onLogin: (pin: string) => void }) => {
    const [mode, setMode] = useState<'login' | 'buy'>('login');
    const [pin, setPin] = useState('');
    const [loginError, setLoginError] = useState('');

    // Buy Mode States
    const [credits, setCredits] = useState(1);
    const [contact, setContact] = useState('');
    const [buying, setBuying] = useState(false);
    const [generatedPin, setGeneratedPin] = useState<string | null>(null);

    const handleLogin = () => {
        const account = validatePin(pin);
        if (account) {
            onLogin(pin);
        } else {
            setLoginError('Invalid or expired PIN code.');
        }
    };

    const handlePurchase = () => {
        if (!contact) {
            alert("Please enter your Email or WhatsApp number");
            return;
        }
        setBuying(true);
        purchaseCredits(
            credits, 
            contact, 
            (newPin, ref) => {
                setBuying(false);
                setGeneratedPin(newPin);
                saveAuditLog({
                    type: VerificationType.CREDIT_PURCHASE,
                    input: `Bought ${credits} credits`,
                    status: 'success',
                    message: 'Credits purchased successfully',
                    transactionRef: ref,
                    details: { credits, contact, pin: newPin }
                });
            },
            () => setBuying(false)
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
            <Card className="w-full max-w-md p-8 !bg-white shadow-2xl border-slate-200">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white mx-auto flex items-center justify-center text-2xl font-bold font-display mb-4 shadow-xl">N</div>
                    <h1 className="text-3xl font-display font-bold text-slate-900">NovaID Access</h1>
                    <p className="text-slate-500 mt-2 font-medium">Secure Identity Verification Portal</p>
                </div>

                <div className="flex p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200">
                    <button 
                        onClick={() => setMode('login')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Enter PIN
                    </button>
                    <button 
                        onClick={() => setMode('buy')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'buy' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Buy Credits
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {mode === 'login' ? (
                        <motion.div 
                            key="login"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <Input 
                                label="Access PIN" 
                                placeholder="0 0 0 0" 
                                maxLength={4}
                                type="text"
                                className="text-center tracking-[1em] font-mono text-2xl py-4 font-bold text-slate-900 placeholder:text-slate-200"
                                value={pin}
                                onChange={(e) => {
                                    setPin(e.target.value.replace(/\D/g,''));
                                    setLoginError('');
                                }}
                            />
                            {loginError && <div className="text-rose-600 text-sm text-center bg-rose-50 p-3 rounded-lg border border-rose-100 font-medium">{loginError}</div>}
                            <Button className="w-full text-lg py-4" onClick={handleLogin}>Unlock Dashboard</Button>
                            
                            <p className="text-xs text-center text-slate-400">
                                Don't have a code? Switch to "Buy Credits" above.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="buy"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {!generatedPin ? (
                                <>
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 mb-2 block">Select Credits (₦50 / unit)</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[1, 5, 10, 20].map(num => (
                                                <button
                                                    key={num}
                                                    onClick={() => setCredits(num)}
                                                    className={`py-3 rounded-xl border-2 font-bold transition-all ${credits === num ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'}`}
                                                >
                                                    {num}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-200">
                                        <span className="text-sm font-medium text-slate-600">Total Cost:</span>
                                        <span className="text-xl font-bold text-slate-900">₦{credits * 50}</span>
                                    </div>
                                    <Input 
                                        label="Email or WhatsApp" 
                                        placeholder="e.g. user@email.com" 
                                        value={contact}
                                        onChange={(e) => setContact(e.target.value)}
                                        className="py-3 font-medium text-slate-900"
                                    />
                                    <Button className="w-full text-lg py-4" onClick={handlePurchase} isLoading={buying}>Proceed to Payment</Button>
                                </>
                            ) : (
                                <div className="text-center space-y-6">
                                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                        <Wallet className="w-8 h-8" />
                                    </div>
                                    
                                    <div>
                                        <h3 className="font-bold text-xl text-slate-900">Purchase Successful!</h3>
                                        <p className="text-slate-500 text-sm mt-1">Your credit access code is ready.</p>
                                    </div>

                                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10"><Lock size={80}/></div>
                                        <p className="text-xs text-slate-400 uppercase tracking-widest mb-2 font-semibold">Your Access PIN</p>
                                        <div className="text-5xl font-mono font-bold tracking-widest">{generatedPin}</div>
                                    </div>

                                    <div className="text-xs text-slate-600 bg-blue-50 p-4 rounded-xl border border-blue-100 text-left leading-relaxed">
                                        <p className="mb-2"><strong>Save this code!</strong> It has been sent to <b>{contact}</b> (simulated).</p>
                                        <p>This code holds your <strong>{credits} credits</strong>. Use it to log in anytime.</p>
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <Button variant="secondary" className="flex-1" onClick={() => setGeneratedPin(null)}>Buy More</Button>
                                        <Button className="flex-1" onClick={() => {
                                            setMode('login');
                                            setPin(generatedPin);
                                            setGeneratedPin(null);
                                        }}>Login Now</Button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </div>
    );
};


// --- Verification Components ---

interface VerificationProps {
    activePin: string;
    refreshBalance: () => void;
}

const BVNVerification: React.FC<VerificationProps> = ({ activePin, refreshBalance }) => {
  const [bvn, setBvn] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!bvn || bvn.length !== 11) {
        setError("BVN must be exactly 11 digits.");
        return;
    }
    if (!deductCredit(activePin)) {
        setError("Insufficient credits. Please top up.");
        return;
    }
    
    refreshBalance(); // Update UI
    setLoading(true);
    setError(null);

    try {
        const res = await verifyIdentity(VerificationType.BVN, { bvn });
        saveAuditLog({
            type: VerificationType.BVN,
            input: `BVN: ${bvn}`,
            status: res.success ? 'success' : 'failed',
            message: res.message,
            details: { request: { bvn }, response: res, usedPin: activePin }
        });

        if (res.success) {
            setResult(res.data);
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
            <p className="text-slate-500 mt-1">Verify identity using Bank Verification Number. Cost: 1 Credit</p>
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
                    // Numeric Validation Logic
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

const NINVerification: React.FC<VerificationProps> = ({ activePin, refreshBalance }) => {
  const [nin, setNin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!nin || nin.length !== 11) {
        setError("NIN must be exactly 11 digits.");
        return;
    }
    if (!deductCredit(activePin)) {
        setError("Insufficient credits.");
        return;
    }

    refreshBalance();
    setLoading(true);
    setError(null);

    try {
        const res = await verifyIdentity(VerificationType.NIN, { nin });
        saveAuditLog({
            type: VerificationType.NIN,
            input: `NIN: ${nin}`,
            status: res.success ? 'success' : 'failed',
            message: res.message,
            details: { request: { nin }, response: res, usedPin: activePin }
        });

        if (res.success) {
            setResult(res.data);
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
            <p className="text-slate-500 mt-1">Retrieve NIMC data. Cost: 1 Credit</p>
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

const PhoneVerification: React.FC<VerificationProps> = ({ activePin, refreshBalance }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    // Basic Nigerian Phone Regex
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    if (!phoneRegex.test(phone)) {
        setError("Invalid Nigerian phone number format.");
        return;
    }
    if (!deductCredit(activePin)) {
        setError("Insufficient credits.");
        return;
    }
    refreshBalance();
    setLoading(true);
    setError(null);

    try {
        const res = await verifyIdentity(VerificationType.PHONE, { phone });
        saveAuditLog({
            type: VerificationType.PHONE,
            input: `Phone: ${phone}`,
            status: res.success ? 'success' : 'failed',
            message: res.message,
            details: { request: { phone }, response: res, usedPin: activePin }
        });

        if (res.success) {
            setResult(res.data);
        } else {
            setError(res.message);
        }
    } catch (e) {
        setError("Error resolving phone details.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-slate-900">Phone Intel</h2>
            <p className="text-slate-500 mt-1">Caller identification. Cost: 1 Credit</p>
          </div>
          <AnimatePresence>
            {error && <div className="mb-6"><Alert type="error" title="Error" message={error} /></div>}
          </AnimatePresence>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <Input 
                label="Phone Number" 
                placeholder="08012345678" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button className="w-full md:w-auto" onClick={handleVerify} isLoading={loading}>Resolve</Button>
          </div>
           <AnimatePresence>
            {result && <ResultDisplay title="Subscriber Details" data={result} />}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
};

const AccountVerification: React.FC<VerificationProps> = ({ activePin, refreshBalance }) => {
  const [account, setAccount] = useState('');
  const [bankCode, setBankCode] = useState(NIGERIAN_BANKS[0].code);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!account || account.length !== 10) {
        setError("Please enter a valid 10-digit account number.");
        return;
    }
    if (!deductCredit(activePin)) {
        setError("Insufficient credits.");
        return;
    }
    refreshBalance();
    setLoading(true);
    setError(null);

    try {
        const res = await verifyIdentity(VerificationType.ACCOUNT, { accountNumber: account, bankCode });
        const bankName = NIGERIAN_BANKS.find(b => b.code === bankCode)?.name || bankCode;
        saveAuditLog({
            type: VerificationType.ACCOUNT,
            input: `Acct: ${account} (${bankName})`,
            status: res.success ? 'success' : 'failed',
            message: res.message,
            details: { request: { account, bankCode, bankName }, response: res, usedPin: activePin }
        });

        if (res.success) {
            setResult(res.data);
        } else {
            setError(res.message);
        }
    } catch (e) {
        setError("Bank account resolution failed.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="p-8">
           <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-slate-900">Account Resolution</h2>
            <p className="text-slate-500 mt-1">Verify bank account ownership. Cost: 1 Credit</p>
          </div>
          <AnimatePresence>
            {error && <div className="mb-6"><Alert type="error" title="Error" message={error} /></div>}
          </AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Select label="Bank" value={bankCode} onChange={(e) => setBankCode(e.target.value)}>
              {NIGERIAN_BANKS.map((bank) => (
                <option key={bank.code} value={bank.code}>{bank.name}</option>
              ))}
            </Select>
            <Input 
              label="Account Number" 
              placeholder="1234567890" 
              maxLength={10}
              value={account}
              onChange={(e) => setAccount(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <Button className="w-full" onClick={handleVerify} isLoading={loading}>Resolve Account Name</Button>
           <AnimatePresence>
            {result && <ResultDisplay title="Account Details" data={result} />}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
};

const BvnMatch: React.FC<VerificationProps> = ({ activePin, refreshBalance }) => {
  const [account, setAccount] = useState('');
  const [bvn, setBvn] = useState('');
  const [bankCode, setBankCode] = useState(NIGERIAN_BANKS[0].code);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!account || !bvn) {
        setError("Please provide both Account Number and BVN.");
        return;
    }
    if (!deductCredit(activePin)) {
        setError("Insufficient credits.");
        return;
    }
    refreshBalance();
    setLoading(true);
    setError(null);

    try {
        const res = await verifyIdentity(VerificationType.BVN_MATCH, { accountNumber: account, bankCode, bvn });
        saveAuditLog({
            type: VerificationType.BVN_MATCH,
            input: `Match: ${bvn} vs ${account}`,
            status: res.success ? 'success' : 'failed',
            message: res.message,
            details: { request: { account, bvn, bankCode }, response: res, usedPin: activePin }
        });

        if (res.success) {
            setResult(res.data);
        } else {
            setError(res.message);
        }
    } catch (e) {
        setError("Match verification process error.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="p-8">
           <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-slate-900">BVN Match</h2>
            <p className="text-slate-500 mt-1">Cross-reference BVN. Cost: 1 Credit</p>
          </div>
          <AnimatePresence>
            {error && <div className="mb-6"><Alert type="error" title="Error" message={error} /></div>}
          </AnimatePresence>
          <div className="space-y-4 mb-6">
             <Select label="Bank" value={bankCode} onChange={(e) => setBankCode(e.target.value)}>
              {NIGERIAN_BANKS.map((bank) => (
                <option key={bank.code} value={bank.code}>{bank.name}</option>
              ))}
            </Select>
            <Input 
              label="Account Number" 
              placeholder="1234567890" 
              maxLength={10}
              value={account}
              onChange={(e) => setAccount(e.target.value.replace(/\D/g, ''))}
            />
            <Input 
              label="BVN to Match" 
              placeholder="22223333444" 
              maxLength={11}
              value={bvn}
              onChange={(e) => setBvn(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <Button className="w-full" onClick={handleVerify} isLoading={loading}>Run Match Analysis</Button>
           <AnimatePresence>
            {result && (
                <div className="mt-6">
                     <div className={`p-4 rounded-xl border ${result.isMatch ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'} flex items-center gap-3`}>
                        {result.isMatch ? (
                            <div className="p-2 bg-emerald-100 rounded-full text-emerald-600"><ShieldCheck className="w-6 h-6"/></div>
                        ) : (
                            <div className="p-2 bg-rose-100 rounded-full text-rose-600"><X className="w-6 h-6"/></div>
                        )}
                        <div>
                            <h4 className={`font-bold ${result.isMatch ? 'text-emerald-900' : 'text-rose-900'}`}>
                                {result.isMatch ? 'Identity Matched' : 'Mismatch Detected'}
                            </h4>
                            <p className="text-sm opacity-80">
                                The account details {result.isMatch ? 'correspond' : 'do not correspond'} to the provided BVN.
                            </p>
                        </div>
                     </div>
                </div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
};

const AuditLogs = () => {
    const [allLogs, setAllLogs] = useState<AuditLogEntry[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
    const itemsPerPage = 8;
    
    useEffect(() => {
        const logs = getAuditLogs();
        setAllLogs(logs);
        setFilteredLogs(logs);
    }, []);

    useEffect(() => {
        let result = allLogs;
        if (filterType !== 'ALL') {
            result = result.filter(log => log.type === filterType);
        }
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(log => 
                log.input.toLowerCase().includes(term) || 
                log.message.toLowerCase().includes(term) ||
                log.id.toLowerCase().includes(term)
            );
        }
        setFilteredLogs(result);
        setCurrentPage(1); 
    }, [searchTerm, filterType, allLogs]);

    const handleClear = () => {
        if(confirm("Are you sure you want to clear the audit logs?")) {
            clearAuditLogs();
            setAllLogs([]);
            setFilteredLogs([]);
        }
    };

    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    return (
        <div className="max-w-6xl mx-auto">
             <Card>
                <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-display font-bold text-slate-900">Audit Trail</h2>
                            <p className="text-slate-500 text-sm mt-1">Local logs of verifications & purchases.</p>
                        </div>
                         {allLogs.length > 0 && (
                            <Button variant="outline" onClick={handleClear} className="!py-2 !px-4 text-xs w-full md:w-auto">
                                <Trash2 className="w-4 h-4" /> Clear Logs
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search logs..." 
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-48">
                             <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                <option value="ALL">All Types</option>
                                <option value={VerificationType.BVN}>BVN</option>
                                <option value={VerificationType.NIN}>NIN</option>
                                <option value={VerificationType.PHONE}>Phone</option>
                                <option value={VerificationType.ACCOUNT}>Account</option>
                                <option value={VerificationType.BVN_MATCH}>BVN Match</option>
                                <option value={VerificationType.CREDIT_PURCHASE}>Purchases</option>
                            </Select>
                        </div>
                    </div>

                    {filteredLogs.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
                            <p className="text-slate-500 font-medium">No records found</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50">
                                            <th className="p-3 text-xs font-bold text-slate-600 uppercase tracking-wider rounded-tl-lg">Time</th>
                                            <th className="p-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Type</th>
                                            <th className="p-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Details</th>
                                            <th className="p-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                                            <th className="p-3 text-xs font-bold text-slate-600 uppercase tracking-wider rounded-tr-lg">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-3 text-sm text-slate-500 whitespace-nowrap">
                                                    {new Date(log.timestamp).toLocaleTimeString()} 
                                                    <span className="text-xs ml-1 opacity-60 block">{new Date(log.timestamp).toLocaleDateString()}</span>
                                                </td>
                                                <td className="p-3 text-sm font-bold text-slate-800">
                                                    {log.type === VerificationType.CREDIT_PURCHASE ? 
                                                        <span className="text-emerald-600 flex items-center gap-1"><Wallet className="w-3 h-3"/> Purchase</span> : 
                                                        log.type.replace(/_/g, ' ')
                                                    }
                                                </td>
                                                <td className="p-3 text-sm text-slate-600 font-mono bg-slate-50/50 rounded">{log.input}</td>
                                                <td className="p-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                                        log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <button 
                                                        onClick={() => setSelectedLog(log)}
                                                        className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 px-2 py-1 rounded"
                                                    >
                                                        Details <ExternalLink className="w-3 h-3"/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
             </Card>

             <Modal 
                isOpen={!!selectedLog} 
                onClose={() => setSelectedLog(null)} 
                title="Transaction Details"
             >
                {selectedLog && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="text-xs text-slate-500 uppercase mb-1 font-bold">Transaction ID</div>
                                <div className="font-mono text-slate-800 break-all">{selectedLog.id}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="text-xs text-slate-500 uppercase mb-1 font-bold">Reference</div>
                                <div className="font-mono text-slate-800 break-all">{selectedLog.transactionRef || 'N/A'}</div>
                            </div>
                        </div>
                        
                        <div>
                             <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-slate-900">Request Parameters</h4>
                                <CopyButton text={JSON.stringify(selectedLog.details?.request || { input: selectedLog.input }, null, 2)} />
                             </div>
                             <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs overflow-x-auto shadow-inner">
                                <pre>{JSON.stringify(selectedLog.details?.request || { input: selectedLog.input }, null, 2)}</pre>
                             </div>
                        </div>

                        <div>
                             <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-slate-900">Response / Result</h4>
                                <CopyButton text={JSON.stringify(selectedLog.details?.response || { message: selectedLog.message }, null, 2)} />
                             </div>
                             <div className="bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-xs overflow-x-auto shadow-inner">
                                <pre>{JSON.stringify(selectedLog.details?.response || { message: selectedLog.message }, null, 2)}</pre>
                             </div>
                        </div>
                    </div>
                )}
             </Modal>
        </div>
    );
}

const Dashboard = ({ onNavigate }: { onNavigate: (id: string) => void }) => {
    const tools = [
        { id: 'bvn', title: "BVN Resolution", desc: "Full KYC via BVN", icon: <Users className="w-6 h-6 text-blue-500"/> },
        { id: 'nin', title: "NIN Lookup", desc: "NIMC database check", icon: <ShieldCheck className="w-6 h-6 text-indigo-500"/> },
        { id: 'phone', title: "Phone Intel", desc: "Truecaller-style ID", icon: <Smartphone className="w-6 h-6 text-purple-500"/> },
        { id: 'account', title: "Account Resolve", desc: "Get account names", icon: <CreditCard className="w-6 h-6 text-emerald-500"/> },
    ];

    return (
        <div className="space-y-8">
             <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck size={120} /></div>
                <h2 className="text-2xl font-bold mb-2 relative z-10">Welcome to NovaID</h2>
                <p className="text-slate-400 max-w-lg relative z-10">The advanced identity verification layer for Nigeria. Fast, secure, and reliable data resolution powered by next-gen AI simulation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tools.map((tool, i) => (
                    <motion.div 
                        key={tool.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + (i * 0.1) }}
                        onClick={() => onNavigate(tool.id)}
                        className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-lg shadow-blue-900/5 hover:shadow-xl hover:shadow-blue-500/10 transition-all cursor-pointer relative overflow-hidden"
                    >
                         <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 opacity-50" />
                         
                         <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                {tool.icon}
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{tool.title}</h3>
                            <p className="text-slate-500 text-sm mb-4">{tool.desc}</p>
                            <div className="flex items-center text-blue-600 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                                Launch Tool <ChevronRight className="w-4 h-4 ml-1" />
                            </div>
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
  const [activePin, setActivePin] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
      // Check if user is already logged in via simpler session mechanism if needed, 
      // but for now, prompt login on refresh to ensure security simulation.
      // For "swift" feel, we could persist activePin in sessionStorage.
      const savedPin = sessionStorage.getItem('novaid_active_pin');
      if (savedPin && validatePin(savedPin)) {
          setActivePin(savedPin);
          setBalance(getBalance(savedPin));
      }
  }, []);

  const handleLogin = (pin: string) => {
      setActivePin(pin);
      setBalance(getBalance(pin));
      sessionStorage.setItem('novaid_active_pin', pin);
  };

  const handleLogout = () => {
      setActivePin(null);
      setBalance(0);
      sessionStorage.removeItem('novaid_active_pin');
      setActiveTab('dashboard');
  };

  const refreshBalance = () => {
      if (activePin) setBalance(getBalance(activePin));
  };

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'bvn', label: 'BVN Resolution', icon: <Users size={20} />, type: VerificationType.BVN },
    { id: 'nin', label: 'NIN Lookup', icon: <ShieldCheck size={20} />, type: VerificationType.NIN },
    { id: 'bvn_match', label: 'BVN Match', icon: <Search size={20} />, type: VerificationType.BVN_MATCH },
    { id: 'phone', label: 'Phone ID', icon: <Smartphone size={20} />, type: VerificationType.PHONE },
    { id: 'account', label: 'Account Verify', icon: <CreditCard size={20} />, type: VerificationType.ACCOUNT },
    { id: 'audit', label: 'Audit Logs', icon: <FileText size={20} /> },
  ];

  if (!activePin) {
      return <CreditPortal onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={setActiveTab} />;
      case 'bvn': return <BVNVerification activePin={activePin} refreshBalance={refreshBalance} />;
      case 'nin': return <NINVerification activePin={activePin} refreshBalance={refreshBalance} />;
      case 'bvn_match': return <BvnMatch activePin={activePin} refreshBalance={refreshBalance} />;
      case 'phone': return <PhoneVerification activePin={activePin} refreshBalance={refreshBalance} />;
      case 'account': return <AccountVerification activePin={activePin} refreshBalance={refreshBalance} />;
      case 'audit': return <AuditLogs />;
      default: return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen flex text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 relative z-10">
      
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white/95 backdrop-blur-md border-r border-slate-200 fixed h-full z-20 shadow-sm">
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
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-900 rounded-xl p-4 text-white shadow-lg shadow-slate-900/10">
                 <div className="flex justify-between items-center mb-2">
                     <div className="text-xs text-slate-400 font-medium">Balance</div>
                     <div className="flex items-center gap-1 text-xs text-emerald-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> Active</div>
                 </div>
                 <div className="font-display font-bold text-2xl">{balance} Credits</div>
                 <div className="text-xs text-slate-500 mt-1 font-mono tracking-widest">PIN: ****</div>
                 <button onClick={handleLogout} className="mt-3 w-full py-2 bg-slate-800 rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                    <LogOut className="w-3 h-3" /> Lock Session
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
                <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-sm text-slate-500 mb-1 font-medium">Available Credits</div>
                    <div className="text-2xl font-bold text-slate-900">{balance}</div>
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
                    <div className="text-xs text-slate-500 font-medium">v2.5.1 • Secure</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 shadow-sm overflow-hidden p-1">
                   <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
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