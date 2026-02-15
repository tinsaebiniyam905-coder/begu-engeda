
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Guest, WantedPerson, Notification, Language, HotelProfile, UserAccount, PoliceProfile } from './types';
import { translations } from './translations';
import { 
  Users, UserPlus, AlertTriangle, FileText, LogOut, Bell, Camera, Image as ImageIcon, Download, 
  Printer, Globe, Plus, Settings, Edit, X, Maximize2, CheckCircle2, ShieldCheck, Search, MapPin, 
  Building2, FileBarChart, Menu, Info, ShieldAlert, TrendingUp, Activity, 
  Phone, Fingerprint, Map, LayoutDashboard, Save, UserCircle, Key, ChevronRight, Cloud
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const LOGO_PATH = 'https://raw.githubusercontent.com/Anu-Anu/Begu-Engeda/main/logo.png';
const GOLDEN_GRADIENT = "text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 font-black drop-shadow-sm";
const ZONES = ["Assosa Zone", "Kamashi Zone", "Metekel Zone", "Mao Komo Special Woreda", "Assosa City Administration", "Gilgel Beles City Administration"];

export default function App() {
  const [lang, setLang] = useState<Language>('am');
  const [authState, setAuthState] = useState<'login' | 'signup' | 'otp' | 'setup_hotel' | 'setup_police' | 'authenticated'>('login');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('begu_active_session');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [accounts, setAccounts] = useState<UserAccount[]>(() => JSON.parse(localStorage.getItem('begu_accounts') || '[]'));
  const [guests, setGuests] = useState<Guest[]>(() => JSON.parse(localStorage.getItem('begu_guests') || '[]'));
  const [wanted, setWanted] = useState<WantedPerson[]>(() => JSON.parse(localStorage.getItem('begu_wanted') || '[]'));
  const [notifications, setNotifications] = useState<Notification[]>(() => JSON.parse(localStorage.getItem('begu_notifications') || '[]'));
  
  const [view, setView] = useState<string>('dashboard');
  const [loginData, setLoginData] = useState({ identifier: '', password: '', confirmPassword: '', username: '', otp: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const [hotelProfile, setHotelProfile] = useState<HotelProfile>(() => JSON.parse(localStorage.getItem('begu_currentHotel') || '{"name":"","address":"","zone":"","receptionistName":"","phoneNumber":""}'));
  const [policeProfile, setPoliceProfile] = useState<PoliceProfile>(() => JSON.parse(localStorage.getItem('begu_currentPolice') || '{"name":"","address":"","zone":""}'));

  const t = translations[lang];

  useEffect(() => {
    if (currentUser && authState === 'login') {
      setAuthState('authenticated');
    }
  }, []);

  useEffect(() => localStorage.setItem('begu_accounts', JSON.stringify(accounts)), [accounts]);
  useEffect(() => localStorage.setItem('begu_guests', JSON.stringify(guests)), [guests]);
  useEffect(() => localStorage.setItem('begu_wanted', JSON.stringify(wanted)), [wanted]);
  useEffect(() => localStorage.setItem('begu_notifications', JSON.stringify(notifications)), [notifications]);
  useEffect(() => localStorage.setItem('begu_currentHotel', JSON.stringify(hotelProfile)), [hotelProfile]);
  useEffect(() => localStorage.setItem('begu_currentPolice', JSON.stringify(policeProfile)), [policeProfile]);
  
  useEffect(() => {
    if (currentUser) localStorage.setItem('begu_active_session', JSON.stringify(currentUser));
    else localStorage.removeItem('begu_active_session');
  }, [currentUser]);

  // Auth Handlers
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.password !== loginData.confirmPassword) return alert(lang === 'am' ? "የይለፍ ቃል አይመሳሰልም!" : "Passwords do not match!");
    if (accounts.find(a => a.phoneNumber === loginData.identifier)) return alert(lang === 'am' ? "ይህ ስልክ ቁጥር ቀደም ብሎ ተመዝግቧል!" : "Phone number already registered!");
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const newAcc: UserAccount = {
      phoneNumber: loginData.identifier,
      username: loginData.username,
      password: loginData.password,
      role: UserRole.RECEPTION,
      isVerified: false,
      isProfileComplete: false,
      otpCode: otp
    };
    setAccounts([...accounts, newAcc]);
    setCurrentUser(newAcc);
    alert(lang === 'am' ? `የማረጋገጫ ቁጥር ወደ ${loginData.identifier} ተልኳል: ${otp}` : `Confirmation number sent to ${loginData.identifier}: ${otp}`);
    setAuthState('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.otp === currentUser?.otpCode) {
      const updated = accounts.map(a => a.phoneNumber === currentUser.phoneNumber ? { ...a, isVerified: true } : a);
      setAccounts(updated);
      setCurrentUser({ ...currentUser, isVerified: true });
      setAuthState('setup_hotel');
    } else alert(lang === 'am' ? "የተሳሳተ የማረጋገጫ ቁጥር!" : "Invalid OTP!");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    
    setTimeout(() => {
      setIsSyncing(false);
      // Pre-assigned Police account
      if (loginData.identifier === 'police' && loginData.password === '1234') {
        const pAcc = { username: 'Police_Office', phoneNumber: 'admin', role: UserRole.LOCAL_POLICE, isVerified: true, isProfileComplete: !!policeProfile.name } as any;
        setCurrentUser(pAcc);
        setAuthState(pAcc.isProfileComplete ? 'authenticated' : 'setup_police');
        return;
      }
      
      // Receptionist login - Works for any existing account in the simulation
      const acc = accounts.find(a => a.phoneNumber === loginData.identifier && a.password === loginData.password);
      if (acc) {
        setCurrentUser(acc);
        if (!acc.isVerified) {
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          acc.otpCode = otp;
          alert(lang === 'am' ? `የማረጋገጫ ቁጥር ተልኳል: ${otp}` : `OTP sent: ${otp}`);
          setAuthState('otp');
        } else if (!acc.isProfileComplete) {
          setAuthState('setup_hotel');
        } else {
          setAuthState('authenticated');
        }
      } else alert(lang === 'am' ? "የተሳሳተ ስልክ ቁጥር ወይም የይለፍ ቃል!" : "Invalid phone number or password!");
    }, 800);
  };

  const handleLogout = () => { setCurrentUser(null); setAuthState('login'); setView('dashboard'); setLoginData({ identifier: '', password: '', confirmPassword: '', username: '', otp: '' }); };

  const handleHotelSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (hotelProfile.name && hotelProfile.zone) {
      if (currentUser) {
        const updated = accounts.map(a => a.phoneNumber === currentUser.phoneNumber ? { ...a, isProfileComplete: true } : a);
        setAccounts(updated);
        setCurrentUser({ ...currentUser, isProfileComplete: true });
      }
      setAuthState('authenticated');
    } else alert(lang === 'am' ? "እባክዎን ሁሉንም መረጃዎች ይሙሉ!" : "Please fill all details.");
  };

  const handlePoliceSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (policeProfile.name && policeProfile.zone) setAuthState('authenticated');
    else alert(lang === 'am' ? "እባክዎን ሁሉንም መረጃዎች ይሙሉ!" : "Please fill all details.");
  };

  const saveGuest = (e: React.FormEvent) => {
    e.preventDefault();
    const guest: Guest = {
      ...newGuest,
      id: Math.random().toString(36).substr(2, 9),
      hotelId: hotelProfile.name,
      hotelName: hotelProfile.name,
      hotelAddress: hotelProfile.address,
      hotelZone: hotelProfile.zone,
      receptionistName: currentUser?.username || '',
      receptionistPhone: currentUser?.phoneNumber || '',
      checkInDate: new Date().toISOString().split('T')[0],
      isWanted: wanted.some(w => w.fullName.toLowerCase() === newGuest.fullName.toLowerCase())
    };
    setGuests([guest, ...guests]);
    if (guest.isWanted) {
      setNotifications([{
        id: Date.now().toString(),
        title: t.alertWantedFound,
        message: `${guest.fullName} checked into ${guest.hotelName}`,
        type: 'danger',
        timestamp: new Date().toLocaleTimeString(),
        targetZone: guest.hotelZone
      }, ...notifications]);
    }
    setNewGuest({ fullName: '', nationality: '', roomNumber: '', idPhoto: '' });
    setView('guestList');
  };

  const [newGuest, setNewGuest] = useState({ fullName: '', nationality: '', roomNumber: '', idPhoto: '' });

  const filteredGuests = useMemo(() => {
    let list = guests;
    if (currentUser?.role === UserRole.LOCAL_POLICE && policeProfile.zone) {
      list = guests.filter(g => g.hotelZone === policeProfile.zone);
    } else if (currentUser?.role === UserRole.RECEPTION) {
      list = guests.filter(g => g.hotelName === hotelProfile.name);
    }
    return list.filter(g => g.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [guests, currentUser, hotelProfile, policeProfile, searchTerm]);

  // --- UI ATOMS ---

  const NavItem = ({ icon, label, active, onClick, count }: any) => (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-[1.5px] transition-all duration-300 group
      ${active ? 'bg-amber-500 text-white shadow-2xl shadow-amber-500/20 translate-x-2' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      <span className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>{icon}</span>
      <span className="flex-1 text-left truncate">{label}</span>
      {count > 0 && <span className="bg-red-500 text-white text-[9px] px-2.5 py-1 rounded-full font-black shadow-lg ring-2 ring-[#0F172A]">{count}</span>}
    </button>
  );

  const FormInput = ({ label, value, onChange, type = "text", required, icon }: any) => (
    <div className="space-y-2 w-full">
      <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[2px] ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors duration-300">{icon}</div>
        <input type={type} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:border-amber-400 outline-none transition-all shadow-inner" 
          value={value} onChange={e => onChange(e.target.value)} required={required} />
      </div>
    </div>
  );

  // --- AUTH SCREENS ---

  if (authState !== 'authenticated') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        <div className="bg-white rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] p-8 sm:p-14 w-full max-w-md animate-in zoom-in-95 duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 -mr-16 -mt-16 rounded-full blur-3xl"></div>
          
          <img src={LOGO_PATH} className="w-24 h-24 mx-auto mb-6 drop-shadow-xl" onError={(e) => { e.currentTarget.src = "https://img.icons8.com/color/512/police-badge.png" }} />
          <h1 className={`text-3xl sm:text-4xl text-center mb-2 ${GOLDEN_GRADIENT}`}>{t.appName}</h1>
          <p className="text-[10px] font-black text-gray-400 text-center uppercase mb-10 tracking-[2px] opacity-80">{t.developedBy}</p>
          
          <div className="space-y-6">
            {authState === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <FormInput label={t.phoneNumber + " / " + t.username} value={loginData.identifier} onChange={(v:any) => setLoginData({...loginData, identifier: v})} required icon={<UserCircle size={20}/>} />
                <FormInput label={t.password} value={loginData.password} onChange={(v:any) => setLoginData({...loginData, password: v})} type="password" required icon={<Key size={20}/>} />
                <button disabled={isSyncing} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-2xl transition-all uppercase text-xs sm:text-sm tracking-[4px] mt-4 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70">
                  {isSyncing ? <Activity size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                  {isSyncing ? "Syncing..." : t.login}
                </button>
                <button type="button" onClick={() => setAuthState('signup')} className="w-full text-center text-[11px] font-black text-indigo-600 uppercase tracking-widest mt-4 hover:underline">{t.noAccount}</button>
              </form>
            )}

            {authState === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-5">
                <FormInput label={t.username} value={loginData.username} onChange={(v:any) => setLoginData({...loginData, username: v})} required icon={<UserCircle size={20}/>} />
                <FormInput label={t.phoneNumber} value={loginData.identifier} onChange={(v:any) => setLoginData({...loginData, identifier: v})} required icon={<Phone size={20}/>} />
                <FormInput label={t.password} value={loginData.password} onChange={(v:any) => setLoginData({...loginData, password: v})} type="password" required icon={<Key size={20}/>} />
                <FormInput label={t.confirmPassword} value={loginData.confirmPassword} onChange={(v:any) => setLoginData({...loginData, confirmPassword: v})} type="password" required icon={<CheckCircle2 size={20}/>} />
                <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-2xl transition-all uppercase text-xs sm:text-sm tracking-[4px] mt-4">{t.signup}</button>
                <button type="button" onClick={() => setAuthState('login')} className="w-full text-center text-[11px] font-black text-indigo-600 uppercase tracking-widest mt-4 hover:underline">{t.alreadyHaveAccount}</button>
              </form>
            )}

            {authState === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-8">
                <div className="bg-amber-50 p-6 rounded-2xl border-2 border-amber-100 text-center shadow-inner">
                  <p className="font-bold text-slate-700 text-sm leading-relaxed">{t.enterOtp}</p>
                </div>
                <FormInput label={t.otpLabel} value={loginData.otp} onChange={(v:any) => setLoginData({...loginData, otp: v})} required icon={<ShieldCheck size={20}/>} />
                <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-2xl transition-all uppercase text-xs sm:text-sm tracking-[4px]">{t.verify}</button>
              </form>
            )}

            {authState === 'setup_hotel' && (
              <form onSubmit={handleHotelSetup} className="space-y-5">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{t.setupHotel}</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Initial Property Registration</p>
                </div>
                <FormInput label={t.hotel} value={hotelProfile.name} onChange={(v:any) => setHotelProfile({...hotelProfile, name: v})} required icon={<Building2 size={20}/>} />
                <FormInput label={t.hotelAddress} value={hotelProfile.address} onChange={(v:any) => setHotelProfile({...hotelProfile, address: v})} required icon={<MapPin size={20}/>} />
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] ml-1">{t.zone}</label>
                  <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4.5 font-bold text-sm outline-none focus:border-amber-400 appearance-none shadow-inner" value={hotelProfile.zone} onChange={e => setHotelProfile({...hotelProfile, zone: e.target.value})} required>
                    <option value="">Select Zone</option>
                    {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <button className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl uppercase tracking-[4px] text-xs mt-6 shadow-2xl">{t.save} & {t.submit}</button>
              </form>
            )}

            {authState === 'setup_police' && (
              <form onSubmit={handlePoliceSetup} className="space-y-5">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{t.setupPolice}</h3>
                </div>
                <FormInput label={t.policeOfficeName} value={policeProfile.name} onChange={(v:any) => setPoliceProfile({...policeProfile, name: v})} required icon={<ShieldCheck size={20}/>} />
                <FormInput label={t.location} value={policeProfile.address} onChange={(v:any) => setPoliceProfile({...policeProfile, address: v})} required icon={<MapPin size={20}/>} />
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] ml-1">{t.zone}</label>
                  <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4.5 font-bold text-sm outline-none focus:border-amber-400 shadow-inner" value={policeProfile.zone} onChange={e => setPoliceProfile({...policeProfile, zone: e.target.value})} required>
                    <option value="">Select Jurisdiction</option>
                    {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <button className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl uppercase tracking-[4px] text-xs mt-6 shadow-2xl">{t.save}</button>
              </form>
            )}
          </div>

          <div className="mt-12 flex justify-center gap-6 pt-8 border-t border-slate-100">
            <button onClick={() => setLang('am')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${lang === 'am' ? 'bg-amber-500 text-white shadow-xl' : 'bg-slate-50 text-slate-400'}`}>አማርኛ</button>
            <button onClick={() => setLang('en')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${lang === 'en' ? 'bg-amber-500 text-white shadow-xl' : 'bg-slate-50 text-slate-400'}`}>ENGLISH</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-900 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-950/70 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}
      
      {/* Sidebar - Advanced Professional */}
      <aside className={`fixed md:relative z-50 w-72 h-full bg-[#0F172A] text-white flex flex-col transition-all duration-500 no-print 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shadow-[10px_0_40px_-15px_rgba(0,0,0,0.3)]`}>
        <div className="p-10 border-b border-white/5 text-center flex flex-col items-center">
          <img src={LOGO_PATH} className="w-20 h-20 mb-5 drop-shadow-2xl" onError={(e) => { e.currentTarget.src = "https://img.icons8.com/color/512/police-badge.png" }} />
          <h2 className={`text-2xl leading-tight ${GOLDEN_GRADIENT}`}>{t.appName}</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase mt-3 tracking-[1.5px] opacity-70 leading-relaxed">{t.developedBy}</p>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          <NavItem icon={<LayoutDashboard size={20}/>} label={t.dashboard} active={view === 'dashboard'} onClick={() => {setView('dashboard'); setIsSidebarOpen(false);}} />
          {currentUser?.role === UserRole.RECEPTION && (
            <>
              <NavItem icon={<UserPlus size={20}/>} label={t.registerGuest} active={view === 'registerGuest'} onClick={() => {setView('registerGuest'); setIsSidebarOpen(false);}} />
              <NavItem icon={<Users size={20}/>} label={t.guestList} active={view === 'guestList'} onClick={() => {setView('guestList'); setIsSidebarOpen(false);}} />
            </>
          )}
          {(currentUser?.role === UserRole.LOCAL_POLICE || currentUser?.role === UserRole.SUPER_POLICE) && (
            <>
              <NavItem icon={<AlertTriangle size={20}/>} label={t.wantedPersons} active={view === 'addWanted'} onClick={() => {setView('addWanted'); setIsSidebarOpen(false);}} />
              <NavItem icon={<Users size={20}/>} label={t.guestList} active={view === 'guestList'} onClick={() => {setView('guestList'); setIsSidebarOpen(false);}} />
            </>
          )}
          <NavItem icon={<Bell size={20}/>} label={t.notifications} active={view === 'notifications'} count={notifications.length} onClick={() => {setView('notifications'); setIsSidebarOpen(false);}} />
          <NavItem icon={<Info size={20}/>} label={t.appUtility} active={view === 'utility'} onClick={() => {setView('utility'); setIsSidebarOpen(false);}} />
          <NavItem icon={<Settings size={20}/>} label={t.settings} active={view === 'settings'} onClick={() => {setView('settings'); setIsSidebarOpen(false);}} />
        </nav>

        <div className="p-8 bg-slate-950/60 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center justify-center gap-4 w-full py-4.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl text-[11px] font-black uppercase transition-all shadow-xl active:scale-95">
            <LogOut size={18}/> {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Judicial Feed */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white border-b px-6 sm:px-12 py-5 flex justify-between items-center shadow-sm z-30">
          <div className="flex items-center gap-5">
             <button className="md:hidden p-3 bg-slate-50 text-slate-600 rounded-2xl active:bg-slate-200" onClick={() => setIsSidebarOpen(true)}><Menu size={24}/></button>
             <div className="leading-none">
               <h3 className="font-black text-slate-900 uppercase text-sm sm:text-xl tracking-tighter">{t[view] || view}</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5 tracking-widest hidden sm:block opacity-60">
                 {currentUser?.role === UserRole.RECEPTION ? hotelProfile.name : policeProfile.name || "Regional Police Feed"}
               </p>
             </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-8">
             <div className="hidden sm:flex items-center gap-3 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
               <Cloud size={14} /> Cloud Active
             </div>
             <button onClick={() => setLang(lang === 'am' ? 'en' : 'am')} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-amber-50 transition-all shadow-sm"><Globe size={20} className="text-amber-600" /></button>
             <div className="flex items-center gap-3 sm:gap-4 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="text-right leading-none hidden xs:block">
                   <p className="text-xs font-black text-slate-900 uppercase truncate max-w-[120px]">{currentUser?.username}</p>
                   <p className="text-[9px] text-amber-600 font-black uppercase mt-1 tracking-tighter opacity-70">{currentUser?.role}</p>
                </div>
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black shadow-lg border-2 border-white text-sm">{currentUser?.username[0].toUpperCase()}</div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 sm:p-12 custom-scrollbar scroll-smooth bg-[#F8FAFC]">
          {zoomImg && (
            <div className="fixed inset-0 bg-slate-950/98 z-[100] flex items-center justify-center p-6 sm:p-20" onClick={() => setZoomImg(null)}>
              <div className="relative max-w-5xl w-full animate-in zoom-in-95 duration-300">
                <button className="absolute -top-16 right-0 text-white bg-white/10 p-5 rounded-full hover:bg-white/20 transition-all border border-white/10"><X size={32}/></button>
                <img src={zoomImg} className="w-full h-auto max-h-[85vh] rounded-[3rem] shadow-[0_0_100px_rgba(255,255,255,0.1)] object-contain ring-4 ring-white/10" />
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in duration-1000">
            {view === 'dashboard' && <Dashboard user={currentUser} t={t} guests={filteredGuests} notifications={notifications} wanted={wanted} setView={setView} />}
            {view === 'registerGuest' && <GuestEntryForm newGuest={newGuest} setNewGuest={setNewGuest} onSubmit={saveGuest} t={t} />}
            
            {/* COMPREHENSIVE JUDICIAL DATA TABLE */}
            {(view === 'guestList' || view === 'reports') && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 no-print">
                   <div className="relative w-full max-w-lg group">
                     <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={20}/>
                     <input type="text" placeholder={t.searchPlaceholder} className="w-full bg-white border-2 border-slate-100 rounded-[1.5rem] pl-16 pr-8 py-5 outline-none focus:border-amber-400 font-bold text-base shadow-xl shadow-slate-200/50 transition-all" 
                       value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                   </div>
                   <div className="flex gap-3 w-full sm:w-auto">
                      <button onClick={() => window.print()} className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-white border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-all font-black uppercase text-[10px] tracking-widest shadow-xl"><Printer size={18}/> {t.print}</button>
                      <button className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-slate-900/20"><Download size={18}/> {t.download}</button>
                   </div>
                </div>

                <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
                  <div className="p-10 border-b bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase">{t.fullTableRecord}</h3>
                      <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[4px] mt-3 opacity-70">Benishangul Regional Surveillance Intelligence Log</p>
                    </div>
                    <div className="bg-slate-900 text-white text-[10px] font-black px-6 py-3 rounded-2xl uppercase tracking-[2px] shadow-xl">Total Records: {filteredGuests.length}</div>
                  </div>
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead className="bg-slate-50/80 text-[11px] sm:text-[12px] font-black uppercase text-slate-400 tracking-[3px] border-b border-slate-100">
                        <tr>
                          <th className="px-12 py-12">Identification Image</th>
                          <th className="px-12 py-12">Full Judicial Name</th>
                          <th className="px-12 py-12">Bed Registry</th>
                          <th className="px-12 py-12">Property & Location Feed</th>
                          <th className="px-12 py-12">Authorized Agent</th>
                          <th className="px-12 py-12 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm font-bold uppercase text-slate-700">
                        {filteredGuests.map((g: any) => (
                          <tr key={g.id} className="hover:bg-indigo-50/40 transition-all duration-500 group">
                            <td className="px-12 py-10">
                              <div className="w-24 h-36 rounded-[1.5rem] overflow-hidden shadow-2xl ring-4 ring-white border border-slate-100 transform group-hover:scale-105 transition-transform cursor-zoom-in relative" onClick={() => setZoomImg(g.idPhoto)}>
                                <img src={g.idPhoto} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors"></div>
                              </div>
                            </td>
                            <td className="px-12 py-10">
                              <p className="font-black text-slate-900 text-xl sm:text-2xl tracking-tighter mb-2">{g.fullName}</p>
                              <div className="flex items-center gap-3 text-slate-400 text-[11px] font-black tracking-widest">
                                <Globe size={16}/> {g.nationality} • {g.checkInDate}
                              </div>
                            </td>
                            <td className="px-12 py-10">
                              <span className="inline-block px-8 py-4 bg-white rounded-2xl text-slate-900 font-black border-2 border-slate-100 shadow-xl text-xl">BED #{g.roomNumber}</span>
                            </td>
                            <td className="px-12 py-10 leading-relaxed">
                              <p className="text-slate-900 text-lg font-black tracking-tight">{g.hotelName}</p>
                              <p className="text-[11px] text-slate-500 mt-2 font-black italic uppercase tracking-widest opacity-60">{g.hotelAddress} | {g.hotelZone}</p>
                            </td>
                            <td className="px-12 py-10">
                              <p className="text-slate-800 text-sm font-black">{g.receptionistName}</p>
                              <div className="flex items-center gap-2 text-[11px] text-indigo-600 font-black mt-4 bg-indigo-50/50 px-4 py-1.5 rounded-full inline-block border border-indigo-100">
                                <Phone size={14}/> {g.receptionistPhone}
                              </div>
                            </td>
                            <td className="px-12 py-10 text-center">
                              {g.isWanted ? (
                                <span className="inline-flex items-center gap-3 px-10 py-5 bg-red-600 text-white rounded-full text-[11px] font-black shadow-[0_15px_30px_rgba(220,38,38,0.3)] animate-pulse border-4 border-white">
                                  <AlertTriangle size={18}/> INTERCEPT REQUIRED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-3 px-10 py-5 bg-emerald-500 text-white rounded-full text-[11px] font-black shadow-[0_15px_30px_rgba(16,185,129,0.2)] border-4 border-white">
                                  <CheckCircle2 size={18}/> REGION SECURE
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredGuests.length === 0 && (
                          <tr><td colSpan={6} className="p-60 text-center text-slate-300 font-black tracking-[15px] uppercase opacity-20">No Regional Intelligence Log Found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {view === 'utility' && <AppUtility t={t} />}
            {view === 'notifications' && <NotificationsFeed notifications={notifications} t={t} setView={setView} />}
            
            {view === 'settings' && (
              <div className="max-w-xl mx-auto bg-white p-12 sm:p-16 rounded-[3.5rem] shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-10 duration-700">
                <h3 className="text-2xl font-black mb-10 uppercase tracking-tighter text-center">{t.settings}</h3>
                <div className="space-y-8">
                  <div className="p-8 bg-slate-50 rounded-3xl border-2 border-slate-100 space-y-6">
                    <div className="flex items-center gap-5">
                       <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-xl">{currentUser?.username[0].toUpperCase()}</div>
                       <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-1">Active Officer Feed</p>
                         <p className="font-black text-slate-900 text-lg">{currentUser?.username}</p>
                       </div>
                    </div>
                    <div className="pt-6 border-t border-slate-200">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-2">Registered Identifier</p>
                       <p className="text-base font-black text-slate-700">{currentUser?.phoneNumber}</p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-100/50 p-4 rounded-2xl border border-emerald-100">
                      <ShieldCheck size={18} /> Verified Account Session
                    </div>
                  </div>
                  <button onClick={() => alert("Cloud settings synchronized!")} className="w-full py-6 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-[2rem] shadow-2xl transition-all uppercase tracking-[4px] text-sm flex items-center justify-center gap-4">
                    <Save size={20}/> Synchronize Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Dashboard({ t, guests, notifications, wanted, setView, user }: any) {
  const stats = [
    { l: t.guestList, v: guests.length, c: 'bg-indigo-600', icon: <Users size={28}/> },
    { l: t.wantedPersons, v: wanted.length, c: 'bg-red-600', icon: <AlertTriangle size={28}/> },
    { l: t.notifications, v: notifications.length, c: 'bg-amber-600', icon: <Bell size={28}/> }
  ];
  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
        {stats.map(s => (
          <div key={s.l} className="bg-white p-10 sm:p-12 rounded-[3.5rem] shadow-xl border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer overflow-hidden relative" 
            onClick={() => setView(s.l === t.guestList ? 'guestList' : s.l === t.wantedPersons ? 'wantedPersons' : 'notifications')}>
            <div className={`absolute top-0 right-0 w-40 h-40 ${s.c} opacity-[0.05] rounded-bl-[6rem] group-hover:scale-125 transition-transform duration-700`}></div>
            <div className="relative z-10">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[4px] mb-3 opacity-60">{s.l}</p>
              <p className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tighter">{s.v}</p>
            </div>
            <div className={`${s.c} w-16 h-16 sm:w-20 sm:h-20 rounded-[1.75rem] flex items-center justify-center text-white shadow-2xl transition-all duration-500 group-hover:rotate-12`}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-white p-10 sm:p-12 rounded-[4rem] shadow-2xl border border-slate-100 h-[450px] flex flex-col">
          <h4 className="font-black text-slate-900 uppercase mb-10 text-[11px] tracking-[5px] flex items-center gap-5 opacity-80">
            <TrendingUp size={24} className="text-indigo-600"/> Surveillance Trend Analysis
          </h4>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{n:'Weekly', v:guests.length},{n:'Regional', v:12},{n:'Alerts', v:notifications.length}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 900, fill: '#64748b'}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 900, fill: '#64748b'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '25px', border: 'none', boxShadow: '0 30px 60px rgba(0,0,0,0.1)', padding: '20px'}} />
                <Bar dataKey="v" fill="#4f46e5" radius={[15, 15, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-10 sm:p-12 rounded-[4rem] shadow-2xl border border-slate-100 flex flex-col h-[450px]">
          <h4 className="font-black text-slate-900 uppercase mb-10 text-[11px] tracking-[5px] flex items-center gap-5 opacity-80">
            <Activity size={24} className="text-emerald-500"/> Live Activity Feed
          </h4>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <table className="w-full text-left text-[11px] font-black uppercase tracking-tight">
              <thead className="bg-slate-50 text-slate-400 sticky top-0 rounded-xl overflow-hidden">
                <tr><th className="p-4 rounded-l-xl">Identification</th><th className="p-4">Jurisdiction</th><th className="p-4 text-center rounded-r-xl">Protocol</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {guests.slice(0, 15).map(g => (
                  <tr key={g.id} className="hover:bg-indigo-50/50 transition-colors duration-300">
                    <td className="p-4 uppercase text-slate-800 truncate max-w-[120px]">{g.fullName}</td>
                    <td className="p-4 uppercase text-slate-400 font-bold opacity-60 truncate max-w-[100px]">{g.hotelZone}</td>
                    <td className="p-4 text-center">
                      {g.isWanted ? <span className="text-red-600 font-black tracking-widest">WANTED</span> : <span className="text-emerald-600 font-black tracking-widest">CLEAR</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function GuestEntryForm({ onSubmit, newGuest, setNewGuest, t }: any) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewGuest({...newGuest, idPhoto: reader.result as string});
      reader.readAsDataURL(file);
    }
  };
  return (
    <div className="max-w-3xl mx-auto bg-white p-10 sm:p-16 rounded-[4rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
      <h3 className="text-3xl sm:text-4xl font-black mb-12 flex items-center gap-6 uppercase tracking-tighter tracking-[4px]"><UserPlus size={44} className="text-indigo-600" /> {t.registerGuest}</h3>
      <form onSubmit={onSubmit} className="space-y-8 sm:space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
          <InputWrapper label={t.fullName} value={newGuest.fullName} onChange={(v: string) => setNewGuest({...newGuest, fullName: v})} required icon={<Users size={22}/>} />
          <InputWrapper label={t.nationality} value={newGuest.nationality} onChange={(v: string) => setNewGuest({...newGuest, nationality: v})} required icon={<Globe size={22}/>} />
        </div>
        <InputWrapper label={t.roomNumber} value={newGuest.roomNumber} onChange={(v: string) => setNewGuest({...newGuest, roomNumber: v})} required icon={<Plus size={22}/>} />
        <div className="space-y-4">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[4px] ml-1">{t.idPhoto}</label>
          <div className="p-16 sm:p-24 bg-slate-50/50 border-4 border-dashed border-slate-100 rounded-[3.5rem] text-center cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all duration-500 group relative overflow-hidden" onClick={() => document.getElementById('idUpload')?.click()}>
            <div className="flex flex-col items-center relative z-10">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6 text-slate-200 group-hover:text-indigo-600 group-hover:scale-110 transition-all border-4 border-white"><Camera size={40}/></div>
              <p className="text-[12px] font-black uppercase text-slate-300 tracking-[8px] group-hover:text-indigo-900 transition-colors">{t.capturePhoto}</p>
              <input type="file" id="idUpload" className="hidden" onChange={handleFileUpload} capture="environment" />
            </div>
            <div className="absolute inset-0 bg-indigo-50/0 group-hover:bg-indigo-50/10 transition-colors"></div>
          </div>
        </div>
        {newGuest.idPhoto && (
          <div className="relative w-48 h-64 sm:w-56 sm:h-72 mx-auto animate-in zoom-in-95 duration-500 group">
            <img src={newGuest.idPhoto} className="w-full h-full object-cover rounded-[2.5rem] shadow-2xl ring-8 ring-white border-2 border-slate-100" />
            <button type="button" onClick={() => setNewGuest({...newGuest, idPhoto: ''})} className="absolute -top-5 -right-5 bg-red-600 text-white p-3.5 rounded-full shadow-2xl border-4 border-white transform group-hover:scale-110 transition-all active:scale-90"><X size={20}/></button>
          </div>
        )}
        <button className="w-full bg-slate-900 hover:bg-indigo-800 text-white font-black py-7 sm:py-8 rounded-[2.5rem] shadow-2xl transition-all uppercase text-lg sm:text-2xl tracking-[8px] mt-8 active:scale-[0.98]">
           {t.submit}
        </button>
      </form>
    </div>
  );
}

function InputWrapper({ label, value, onChange, type = "text", required, icon }: any) {
  return (
    <div className="space-y-3 w-full">
      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[4px] ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors duration-300">{icon}</div>
        <input type={type} className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl pl-16 pr-8 py-5 text-base font-black focus:border-amber-400 outline-none transition-all shadow-inner" 
          value={value} onChange={e => onChange(e.target.value)} required={required} />
      </div>
    </div>
  );
}

function AppUtility({ t }: any) {
  return (
    <div className="bg-white p-10 sm:p-24 rounded-[5rem] shadow-2xl border border-slate-100 space-y-12 max-w-5xl mx-auto text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 -ml-32 -mt-32 rounded-full blur-3xl"></div>
      <div className="flex flex-col items-center relative z-10">
        <img src={LOGO_PATH} className="w-40 h-40 mb-12 drop-shadow-2xl grayscale opacity-20" onError={(e) => { e.currentTarget.src = "https://img.icons8.com/color/512/police-badge.png" }} />
        <h3 className={`text-4xl sm:text-6xl leading-tight mb-10 ${GOLDEN_GRADIENT}`}>{t.appUtility}</h3>
        <div className="h-1.5 bg-amber-500/20 w-32 mb-10 rounded-full"></div>
      </div>
      <p className="text-slate-700 font-bold leading-[2.5] text-lg sm:text-2xl text-justify px-8 sm:px-16 opacity-90 border-l-[12px] border-amber-500 py-8 bg-amber-50/30 rounded-r-[4rem] shadow-inner">
        {t.utilityText}
      </p>
      <div className="pt-24 border-t border-slate-100">
        <p className="text-amber-900 font-black uppercase text-[11px] sm:text-sm tracking-[12px] opacity-40">{t.developerCredit}</p>
      </div>
    </div>
  );
}

function NotificationsFeed({ notifications, t, setView }: any) {
  return (
    <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10 animate-in slide-in-from-bottom-12 duration-1000">
      {notifications.map((n: any) => (
        <div key={n.id} className={`p-10 sm:p-14 bg-white border-l-[20px] rounded-[3.5rem] shadow-2xl flex gap-8 sm:gap-14 transition-all hover:-translate-x-3 
          ${n.type === 'danger' ? 'border-red-600 bg-red-50/30' : 'border-indigo-600'}`}>
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] shadow-2xl border-4 border-white flex-shrink-0 flex items-center justify-center 
            ${n.type === 'danger' ? 'bg-red-600 text-white shadow-red-200' : 'bg-indigo-600 text-white shadow-indigo-200'}`}>
            <ShieldAlert size={40}/>
          </div>
          <div className="flex-1">
            <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[6px] py-2 px-5 bg-white shadow-xl rounded-xl inline-block mb-6 border border-slate-100">{n.timestamp}</span>
            <h4 className="text-2xl sm:text-4xl font-black uppercase text-slate-900 tracking-tighter mb-5 leading-none">{n.title}</h4>
            <p className="text-lg sm:text-xl font-bold text-slate-600 leading-relaxed opacity-80">{n.message}</p>
            {n.guestId && (
              <button onClick={() => setView('guestList')} className="mt-10 px-12 py-5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-black uppercase rounded-[1.5rem] shadow-2xl shadow-red-200 transition-all tracking-[5px] active:scale-95">Access Regional Evidence Log</button>
            )}
          </div>
        </div>
      ))}
      {notifications.length === 0 && (
        <div className="text-center py-64 opacity-20 flex flex-col items-center">
          <ShieldCheck size={140} className="mb-12 text-slate-200" />
          <h3 className="text-2xl font-black uppercase tracking-[20px] text-slate-300">Region Secured</h3>
        </div>
      )}
    </div>
  );
}
