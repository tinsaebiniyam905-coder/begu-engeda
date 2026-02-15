
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Guest, WantedPerson, Notification, Language, HotelProfile, UserAccount, PoliceProfile } from './types';
import { translations } from './translations';
import { 
  Users, UserPlus, AlertTriangle, FileText, LogOut, Bell, Camera, Image as ImageIcon, Download, 
  Printer, Globe, Plus, Settings, Edit, X, Maximize2, CheckCircle2, ShieldCheck, Search, MapPin, 
  Building2, FileBarChart, Menu, Info, ChevronRight, ShieldAlert, History, TrendingUp, Activity, 
  Phone, Fingerprint, Map, LayoutDashboard, Save, UserCircle, Key
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const INITIAL_WANTED: WantedPerson[] = [
  { id: 'w1', fullName: 'Abebe Kebede', photo: 'https://picsum.photos/seed/abebe/200/200', description: 'Medium build', crime: 'Theft', postedDate: '2023-10-15' },
];

const ZONES = [
  "Assosa Zone", "Kamashi Zone", "Metekel Zone", "Mao Komo Special Woreda", 
  "Assosa City Administration", "Gilgel Beles City Administration", 
  "Kamashi City Administration", "Bambasi City Administration"
];

const LOGO_PATH = 'https://raw.githubusercontent.com/Anu-Anu/Begu-Engeda/main/logo.png';
const GOLDEN_GRADIENT = "text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 font-black drop-shadow-sm";

export default function App() {
  const [lang, setLang] = useState<Language>('am');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  
  const [guests, setGuests] = useState<Guest[]>(() => JSON.parse(localStorage.getItem('guests') || '[]'));
  const [wanted, setWanted] = useState<WantedPerson[]>(() => JSON.parse(localStorage.getItem('wanted') || JSON.stringify(INITIAL_WANTED)));
  const [notifications, setNotifications] = useState<Notification[]>(() => JSON.parse(localStorage.getItem('notifications') || '[]'));
  const [accounts, setAccounts] = useState<UserAccount[]>(() => JSON.parse(localStorage.getItem('accounts') || '[]'));
  
  const [view, setView] = useState<string>('dashboard');
  const [loginData, setLoginData] = useState({ identifier: '', password: '', confirmPassword: '', username: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [hotelProfile, setHotelProfile] = useState<HotelProfile>(() => JSON.parse(localStorage.getItem('currentHotel') || '{"name":"","address":"","zone":"","receptionistName":"","phoneNumber":""}'));
  const [policeProfile, setPoliceProfile] = useState<PoliceProfile>(() => JSON.parse(localStorage.getItem('currentPolice') || '{"name":"","address":"","zone":""}'));

  const t = translations[lang];

  useEffect(() => localStorage.setItem('guests', JSON.stringify(guests)), [guests]);
  useEffect(() => localStorage.setItem('wanted', JSON.stringify(wanted)), [wanted]);
  useEffect(() => localStorage.setItem('notifications', JSON.stringify(notifications)), [notifications]);
  useEffect(() => localStorage.setItem('accounts', JSON.stringify(accounts)), [accounts]);
  useEffect(() => localStorage.setItem('currentHotel', JSON.stringify(hotelProfile)), [hotelProfile]);
  useEffect(() => localStorage.setItem('currentPolice', JSON.stringify(policeProfile)), [policeProfile]);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.password !== loginData.confirmPassword) return alert("Passwords do not match / የይለፍ ቃል አይመሳሰልም");
    if (accounts.find(a => a.phoneNumber === loginData.identifier)) return alert("Phone already registered / ስልኩ ተመዝግቧል");
    
    const newAcc: UserAccount = {
      phoneNumber: loginData.identifier,
      username: loginData.username || loginData.identifier,
      password: loginData.password,
      role: UserRole.RECEPTION,
      isProfileComplete: false
    };
    setAccounts([...accounts, newAcc]);
    setCurrentUser(newAcc);
    setView('setupHotel');
    alert("Account Created / አካዉንት ተከፍቷል");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Check for hardcoded Police accounts
    if (loginData.identifier === 'police' && loginData.password === '1234') {
      const acc = { username: 'police', role: UserRole.LOCAL_POLICE, isProfileComplete: !!policeProfile.name } as any;
      setCurrentUser(acc);
      if (!acc.isProfileComplete) setView('setupPolice');
      else setView('dashboard');
      return;
    }
    if (loginData.identifier === 'police' && loginData.password === 'police@1234') {
      setCurrentUser({ username: 'police_hq', role: UserRole.SUPER_POLICE, isProfileComplete: true } as any);
      setView('dashboard');
      return;
    }

    // Check Receptionist accounts
    const acc = accounts.find(a => a.phoneNumber === loginData.identifier && a.password === loginData.password);
    if (acc) {
      setCurrentUser(acc);
      if (!acc.isProfileComplete) setView('setupHotel');
      else setView('dashboard');
    } else {
      alert('Invalid credentials / የተሳሳተ መረጃ');
    }
  };

  const handleLogout = () => { setCurrentUser(null); setView('dashboard'); setAuthMode('login'); setIsSidebarOpen(false); };

  const handleHotelSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (hotelProfile.name && hotelProfile.zone) {
      setHotelProfile(prev => ({ ...prev, receptionistName: currentUser?.username || '', phoneNumber: currentUser?.phoneNumber || '' }));
      if (currentUser) {
        const updatedAccounts = accounts.map(a => a.phoneNumber === currentUser.phoneNumber ? { ...a, isProfileComplete: true } : a);
        setAccounts(updatedAccounts);
        setCurrentUser({ ...currentUser, isProfileComplete: true });
      }
      setView('dashboard');
    } else alert("Fill all details / ሁሉንም ይሙሉ");
  };

  const handlePoliceSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (policeProfile.name && policeProfile.zone) {
      setView('dashboard');
    } else alert("Fill all details / ሁሉንም ይሙሉ");
  };

  const saveGuest = (e: React.FormEvent) => {
    e.preventDefault();
    const isWanted = wanted.some(w => w.fullName.toLowerCase().trim() === newGuest.fullName.toLowerCase().trim());
    const guest: Guest = {
      ...newGuest,
      id: Math.random().toString(36).substr(2, 9),
      hotelId: hotelProfile.id || 'h1',
      hotelName: hotelProfile.name,
      hotelAddress: hotelProfile.address,
      hotelZone: hotelProfile.zone,
      receptionistName: hotelProfile.receptionistName,
      receptionistPhone: hotelProfile.phoneNumber,
      checkInDate: new Date().toISOString().split('T')[0],
      isWanted
    };
    setGuests([guest, ...guests]);
    if (isWanted) {
      const notif: Notification = {
        id: Date.now().toString(),
        title: t.alertWantedFound,
        message: `${guest.fullName} at ${guest.hotelName}, Room ${guest.roomNumber}`,
        type: 'danger',
        timestamp: new Date().toLocaleTimeString(),
        targetZone: guest.hotelZone
      };
      setNotifications([notif, ...notifications]);
    }
    setNewGuest({ fullName: '', nationality: '', roomNumber: '', idPhoto: '' });
    setView('guestList');
  };

  const [newGuest, setNewGuest] = useState({ fullName: '', nationality: '', roomNumber: '', idPhoto: '' });
  const [newWanted, setNewWanted] = useState({ fullName: '', photo: '', description: '', crime: '' });

  // Fix: Implemented addWanted function to handle broadcasting bulletin
  const addWanted = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWanted.fullName || !newWanted.crime) return alert("Fill all details / ሁሉንም ይሙሉ");
    
    const person: WantedPerson = {
      ...newWanted,
      id: Math.random().toString(36).substr(2, 9),
      postedDate: new Date().toISOString().split('T')[0]
    };
    setWanted([person, ...wanted]);
    setNewWanted({ fullName: '', photo: '', description: '', crime: '' });
    setView('dashboard');
    alert("New bulletin broadcasted / አዲስ ማስታወቂያ ተለጥፏል");
  };

  // Fix: Computed currentUserZone to resolve errors where 'zone' didn't exist on UserAccount type
  const currentUserZone = useMemo(() => {
    if (currentUser?.role === UserRole.RECEPTION) return hotelProfile.zone;
    if (currentUser?.role === UserRole.LOCAL_POLICE) return policeProfile.zone;
    return undefined;
  }, [currentUser, hotelProfile.zone, policeProfile.zone]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'guest' | 'wanted') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'guest') setNewGuest(prev => ({ ...prev, idPhoto: reader.result as string }));
        else if (type === 'wanted') setNewWanted(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const visibleGuests = useMemo(() => {
    let list = guests;
    if (currentUser?.role === UserRole.LOCAL_POLICE && policeProfile.zone) {
      list = guests.filter(g => g.hotelZone === policeProfile.zone);
    } else if (currentUser?.role === UserRole.RECEPTION) {
      list = guests.filter(g => g.hotelName === hotelProfile.name);
    }
    return list.filter(g => g.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [guests, currentUser, policeProfile, hotelProfile, searchTerm]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2rem] shadow-2xl p-8 sm:p-12 w-full max-w-md animate-in zoom-in-95 duration-500">
          <img src={LOGO_PATH} className="w-24 h-24 mx-auto mb-6 drop-shadow-lg" 
            onError={(e) => { e.currentTarget.src = "https://img.icons8.com/color/512/police-badge.png" }} />
          <h1 className={`text-3xl text-center mb-1 ${GOLDEN_GRADIENT}`}>{t.appName}</h1>
          <p className="text-[10px] font-black text-gray-400 text-center uppercase mb-10 tracking-[2px]">{t.developedBy}</p>
          
          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <Input label={currentUser?.role === UserRole.RECEPTION ? t.phoneNumber : t.username} value={loginData.identifier} onChange={(v:any) => setLoginData({...loginData, identifier: v})} required icon={<UserCircle size={18}/>} />
              <Input label={t.password} value={loginData.password} onChange={(v:any) => setLoginData({...loginData, password: v})} type="password" required icon={<Key size={18}/>} />
              <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all uppercase text-sm mt-6 tracking-widest">{t.login}</button>
              <button type="button" onClick={() => setAuthMode('signup')} className="w-full text-center text-xs font-black text-indigo-600 uppercase tracking-widest mt-4 hover:underline">{t.noAccount}</button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-5">
              <Input label={t.username} value={loginData.username} onChange={(v:any) => setLoginData({...loginData, username: v})} required icon={<UserCircle size={18}/>} />
              <Input label={t.phoneNumber} value={loginData.identifier} onChange={(v:any) => setLoginData({...loginData, identifier: v})} required icon={<Phone size={18}/>} />
              <Input label={t.password} value={loginData.password} onChange={(v:any) => setLoginData({...loginData, password: v})} type="password" required icon={<Key size={18}/>} />
              <Input label={t.confirmPassword} value={loginData.confirmPassword} onChange={(v:any) => setLoginData({...loginData, confirmPassword: v})} type="password" required icon={<CheckCircle2 size={18}/>} />
              <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl transition-all uppercase text-sm mt-6 tracking-widest">{t.signup}</button>
              <button type="button" onClick={() => setAuthMode('login')} className="w-full text-center text-xs font-black text-indigo-600 uppercase tracking-widest mt-4 hover:underline">{t.alreadyHaveAccount}</button>
            </form>
          )}
          
          <div className="mt-12 flex justify-center gap-6 border-t pt-8">
            <button onClick={() => setLang('am')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${lang === 'am' ? 'bg-amber-500 text-white shadow-lg' : 'bg-gray-100 text-gray-500'}`}>አማርኛ</button>
            <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${lang === 'en' ? 'bg-amber-500 text-white shadow-lg' : 'bg-gray-100 text-gray-500'}`}>ENGLISH</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col md:flex-row font-sans text-slate-900 overflow-hidden">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed md:relative z-50 w-64 h-full bg-[#1F2937] text-white flex flex-col transition-all duration-300 no-print 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shadow-2xl`}>
        <div className="p-8 border-b border-white/5 text-center flex flex-col items-center">
          <img src={LOGO_PATH} className="w-16 h-16 mb-4 drop-shadow-md" 
            onError={(e) => { e.currentTarget.src = "https://img.icons8.com/color/512/police-badge.png" }} />
          <h2 className={`text-xl leading-tight ${GOLDEN_GRADIENT}`}>{t.appName}</h2>
          <p className="text-[9px] font-black text-gray-400 uppercase mt-2 opacity-60 leading-tight tracking-[1px]">{t.developedBy}</p>
        </div>
        
        <nav className="flex-1 p-5 space-y-2 overflow-y-auto custom-scrollbar">
          <NavItem icon={<LayoutDashboard size={20}/>} label={t.dashboard} active={view === 'dashboard'} onClick={() => {setView('dashboard'); setIsSidebarOpen(false);}} />
          {currentUser.role === UserRole.RECEPTION && (
            <>
              <NavItem icon={<UserPlus size={20}/>} label={t.registerGuest} active={view === 'registerGuest'} onClick={() => {setView('registerGuest'); setIsSidebarOpen(false);}} />
              <NavItem icon={<Users size={20}/>} label={t.guestList} active={view === 'guestList'} onClick={() => {setView('guestList'); setIsSidebarOpen(false);}} />
              <NavItem icon={<Settings size={20}/>} label={t.settings} active={view === 'settings'} onClick={() => {setView('settings'); setIsSidebarOpen(false);}} />
            </>
          )}
          {(currentUser.role === UserRole.LOCAL_POLICE || currentUser.role === UserRole.SUPER_POLICE) && (
            <>
              <NavItem icon={<Plus size={20}/>} label={t.policeNotice} active={view === 'addWanted'} onClick={() => {setView('addWanted'); setIsSidebarOpen(false);}} />
              <NavItem icon={<Users size={20}/>} label={t.guestList} active={view === 'guestList'} onClick={() => {setView('guestList'); setIsSidebarOpen(false);}} />
              <NavItem icon={<Settings size={20}/>} label={t.settings} active={view === 'settings'} onClick={() => {setView('settings'); setIsSidebarOpen(false);}} />
            </>
          )}
          <NavItem icon={<Bell size={20}/>} label={t.notifications} active={view === 'notifications'} count={notifications.length} onClick={() => {setView('notifications'); setIsSidebarOpen(false);}} />
          <NavItem icon={<Info size={20}/>} label={t.appUtility} active={view === 'utility'} onClick={() => {setView('utility'); setIsSidebarOpen(false);}} />
        </nav>

        <div className="p-6 border-t border-white/5 bg-[#111827]/50">
          <p className="text-[8px] text-amber-500/50 mb-4 text-center uppercase font-black tracking-widest leading-relaxed italic">{t.developerCredit}</p>
          <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full py-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg active:scale-95">
            <LogOut size={18}/> {t.logout}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white border-b px-6 py-5 flex justify-between items-center shadow-sm z-30">
          <div className="flex items-center gap-4">
             <button className="md:hidden p-3 bg-slate-50 text-slate-500 rounded-xl" onClick={() => setIsSidebarOpen(true)}><Menu size={24}/></button>
             <div>
               <h3 className="font-black text-slate-800 uppercase text-sm sm:text-lg tracking-tighter leading-none">{t[view] || view}</h3>
               <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase hidden sm:block">
                 {currentUser.role === UserRole.RECEPTION ? hotelProfile.name : policeProfile.name || "Police Command"}
               </p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setLang(lang === 'am' ? 'en' : 'am')} className="p-3 bg-slate-50 border rounded-xl hover:bg-amber-50 hover:border-amber-200 transition-all shadow-sm"><Globe size={20} className="text-amber-600" /></button>
             <div className="h-10 w-px bg-slate-200 hidden sm:block mx-1"></div>
             <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                <div className="text-right leading-tight hidden xs:block">
                   <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{currentUser.username}</p>
                   <p className="text-[9px] text-amber-600 font-black uppercase mt-1 tracking-widest opacity-70">{currentUser.role}</p>
                </div>
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg border-2 border-white">{currentUser.username[0].toUpperCase()}</div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 sm:p-8 lg:p-12 custom-scrollbar">
          {zoomImg && (
            <div className="fixed inset-0 bg-slate-950/95 z-[100] flex items-center justify-center p-6" onClick={() => setZoomImg(null)}>
              <div className="relative max-w-5xl w-full animate-in zoom-in-95 duration-300">
                <button className="absolute -top-16 right-0 text-white bg-white/10 p-4 rounded-full hover:bg-white/20 transition-all border border-white/10"><X size={32}/></button>
                <img src={zoomImg} className="w-full h-auto max-h-[80vh] rounded-[2rem] shadow-2xl object-contain ring-4 ring-white/10" />
              </div>
            </div>
          )}
          
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {view === 'setupHotel' && <SetupForm hotelProfile={hotelProfile} setHotelProfile={setHotelProfile} onSubmit={handleHotelSetup} t={t} />}
            {view === 'setupPolice' && <PoliceSetupForm policeProfile={policeProfile} setPoliceProfile={setPoliceProfile} onSubmit={handlePoliceSetup} t={t} />}
            {view === 'dashboard' && <Dashboard userZone={currentUserZone} t={t} guests={visibleGuests} notifications={notifications} wanted={wanted} setView={setView} />}
            {view === 'registerGuest' && <GuestForm newGuest={newGuest} setNewGuest={setNewGuest} onSubmit={saveGuest} t={t} handleFileUpload={handleFileUpload} />}
            
            {(view === 'guestList' || view === 'reports') && (
              <div className="space-y-6">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
                    <div className="relative w-full max-w-md">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                      <input type="text" placeholder={t.searchPlaceholder} className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 outline-none focus:border-amber-400 font-bold text-sm shadow-xl shadow-slate-200/50 transition-all" 
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                       <button onClick={() => window.print()} className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-all font-black uppercase text-[10px] tracking-widest shadow-lg shadow-slate-200/50"><Printer size={18}/> {t.print}</button>
                       <button className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-black uppercase text-[10px] tracking-widest shadow-lg shadow-slate-900/20"><Download size={18}/> {t.download}</button>
                    </div>
                 </div>
                 
                 <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="p-10 border-b bg-slate-50/50">
                       <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase tracking-[2px]">{t.fullTableRecord}</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 opacity-70">Comprehensive Judicial Archive Feed</p>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 tracking-[3px] border-b border-slate-100">
                          <tr>
                            <th className="px-10 py-8 min-w-[140px]">{t.idPhoto}</th>
                            <th className="px-10 py-8 min-w-[250px]">{t.fullName}</th>
                            <th className="px-10 py-8 min-w-[150px]">{t.roomNumber}</th>
                            <th className="px-10 py-8 min-w-[250px]">{t.hotel} / {t.location}</th>
                            <th className="px-10 py-8 min-w-[200px]">{t.receptionistName}</th>
                            <th className="px-10 py-8 min-w-[180px] text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px] font-bold uppercase text-slate-700">
                          {visibleGuests.map((g: any) => (
                            <tr key={g.id} className="hover:bg-indigo-50/50 transition-all duration-300 group">
                              <td className="px-10 py-6">
                                <div className="w-20 h-28 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white border border-slate-100 transform group-hover:scale-105 transition-transform cursor-zoom-in" onClick={() => setZoomImg(g.idPhoto)}>
                                  <img src={g.idPhoto} className="w-full h-full object-cover" />
                                </div>
                              </td>
                              <td className="px-10 py-6">
                                <p className="font-black text-slate-900 text-lg tracking-tighter leading-none mb-2">{g.fullName}</p>
                                <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                                  <Globe size={12}/> {g.nationality} • {g.checkInDate}
                                </div>
                              </td>
                              <td className="px-10 py-6">
                                <span className="inline-block px-5 py-2 bg-slate-100 rounded-xl text-slate-800 font-black border border-slate-200 shadow-inner">#{g.roomNumber}</span>
                              </td>
                              <td className="px-10 py-6 leading-relaxed">
                                <p className="text-slate-800 text-sm font-black tracking-tight">{g.hotelName}</p>
                                <p className="text-[10px] text-slate-400 mt-1 opacity-60">{g.hotelAddress} • {g.hotelZone}</p>
                              </td>
                              <td className="px-10 py-6">
                                <p className="text-slate-700">{g.receptionistName}</p>
                                <div className="flex items-center gap-1.5 text-[9px] text-indigo-500 font-black mt-2">
                                  <Phone size={10}/> {g.receptionistPhone}
                                </div>
                              </td>
                              <td className="px-10 py-6 text-center">
                                {g.isWanted ? (
                                  <span className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full text-[10px] font-black shadow-xl shadow-red-100 animate-pulse border-2 border-white">
                                    <AlertTriangle size={14}/> WANTED
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-full text-[10px] font-black shadow-lg border-2 border-white">
                                    <CheckCircle2 size={14}/> CLEAR
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {visibleGuests.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-32 text-center opacity-30">
                                <Users size={80} className="mx-auto mb-6 text-slate-200" />
                                <p className="font-black tracking-[10px] uppercase text-slate-300">No Intelligence Records</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                 </div>
              </div>
            )}

            {view === 'addWanted' && <WantedForm t={t} handleFileUpload={handleFileUpload} addWanted={addWanted} newWanted={newWanted} setNewWanted={setNewWanted} />}
            {view === 'notifications' && <NotifView notifications={notifications.filter(n => !currentUserZone || n.targetZone === currentUserZone)} t={t} setView={setView} />}
            {view === 'utility' && <UtilitySection t={t} />}
            {view === 'settings' && (
              currentUser.role === UserRole.RECEPTION ? 
              <SetupForm hotelProfile={hotelProfile} setHotelProfile={setHotelProfile} onSubmit={handleHotelSetup} t={t} isSettings /> :
              <PoliceSetupForm policeProfile={policeProfile} setPoliceProfile={setPoliceProfile} onSubmit={handlePoliceSetup} t={t} isSettings />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, count }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all duration-500 group
      ${active ? 'bg-amber-500 text-white shadow-2xl shadow-amber-500/30 translate-x-2' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      <span className={`${active ? 'scale-110 rotate-3' : 'group-hover:scale-110 group-hover:-rotate-3'} transition-transform duration-500`}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {count > 0 && <span className="bg-red-500 text-white text-[9px] px-2.5 py-1 rounded-full font-black shadow-lg ring-4 ring-slate-800">{count}</span>}
    </button>
  );
}

// Fix: Dashboard now accepts userZone instead of user to filter notifications correctly
function Dashboard({ t, guests, notifications, wanted, setView, userZone }: any) {
  const stats = [
    { l: t.guestList, v: guests.length, c: 'bg-indigo-600', icon: <Users size={24}/> },
    { l: t.wantedPersons, v: wanted.length, c: 'bg-red-600', icon: <AlertTriangle size={24}/> },
    { l: t.notifications, v: notifications.filter((n:any) => !userZone || n.targetZone === userZone).length, c: 'bg-amber-600', icon: <Bell size={24}/> }
  ];
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {stats.map(s => (
          <div key={s.l} className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer overflow-hidden relative" 
            onClick={() => setView(s.l === t.guestList ? 'guestList' : s.l === t.wantedPersons ? 'wantedPersons' : 'notifications')}>
            <div className={`absolute top-0 right-0 w-32 h-32 ${s.c} opacity-[0.03] rounded-bl-[5rem] group-hover:scale-125 transition-transform duration-700`}></div>
            <div className="relative z-10">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] mb-2">{s.l}</p>
              <p className="text-5xl font-black text-slate-800 tracking-tighter">{s.v}</p>
            </div>
            <div className={`${s.c} w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-${s.c.split('-')[1]}-200 transition-all duration-500 group-hover:rotate-12`}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 h-[450px]">
          <h4 className="font-black text-slate-800 uppercase mb-10 text-xs tracking-[4px] flex items-center gap-4">
            <TrendingUp size={24} className="text-indigo-500"/> Activity Intelligence
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{n:'Weekly', v:guests.length},{n:'Regional', v:12},{n:'Alerts', v:notifications.length}]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 900}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 900}} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'}} />
              <Bar dataKey="v" fill="#6366f1" radius={[12, 12, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 flex flex-col">
          <h4 className="font-black text-slate-800 uppercase mb-8 text-xs tracking-[4px] flex items-center gap-4">
            <Activity size={24} className="text-emerald-500"/> Live Evidence Stream
          </h4>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-[11px] font-black">
              <thead className="bg-slate-50 uppercase text-slate-400 sticky top-0">
                <tr><th className="p-4">Evidence ID</th><th className="p-4">Origin</th><th className="p-4 text-center">Protocol</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {guests.slice(0, 10).map(g => (
                  <tr key={g.id} className="hover:bg-indigo-50/50 transition-colors duration-300">
                    <td className="p-4 uppercase text-slate-700 tracking-tighter">{g.fullName}</td>
                    <td className="p-4 uppercase text-slate-400 font-bold opacity-60">{g.hotelZone}</td>
                    <td className="p-4 text-center">
                      {g.isWanted ? <span className="text-red-600 bg-red-50 px-3 py-1 rounded-lg">WANTED</span> : <span className="text-emerald-600">SECURE</span>}
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

function SetupForm({ hotelProfile, setHotelProfile, onSubmit, t, isSettings }: any) {
  return (
    <div className="max-w-2xl mx-auto bg-white p-10 sm:p-14 rounded-[3.5rem] shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center gap-6 mb-12">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-[1.5rem] flex items-center justify-center shadow-inner ring-8 ring-amber-50">
          <Building2 size={40}/>
        </div>
        <div>
          <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">{t.setupHotel}</h3>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[4px] mt-3 opacity-60 leading-tight">{t.setupWelcome}</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-8">
        <Input label={t.hotel} value={hotelProfile.name} onChange={(v:any) => setHotelProfile({...hotelProfile, name: v})} required icon={<Building2 size={20}/>} />
        <Input label={t.hotelAddress} value={hotelProfile.address} onChange={(v:any) => setHotelProfile({...hotelProfile, address: v})} required icon={<MapPin size={20}/>} />
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] ml-1">{t.zone}</label>
          <div className="relative group">
            <Map className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors duration-300" size={20}/>
            <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-16 pr-6 py-5 font-black text-sm outline-none focus:border-amber-400 transition-all appearance-none" 
              value={hotelProfile.zone} onChange={e => setHotelProfile({...hotelProfile, zone: e.target.value})} required>
              <option value="">Select Zone</option>
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>
        <div className="p-6 bg-amber-50 rounded-3xl border-2 border-amber-100 text-[11px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-4 shadow-inner">
          <Fingerprint size={32} className="opacity-50"/> {t.verificationRequired}
        </div>
        <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-6 rounded-[2rem] shadow-2xl transition-all uppercase tracking-[4px] flex items-center justify-center gap-4 text-lg">
          <Save size={24}/> {t.save}
        </button>
      </form>
    </div>
  );
}

function PoliceSetupForm({ policeProfile, setPoliceProfile, onSubmit, t, isSettings }: any) {
  return (
    <div className="max-w-2xl mx-auto bg-white p-10 sm:p-14 rounded-[3.5rem] shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center gap-6 mb-12">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-inner ring-8 ring-indigo-50">
          <MapPin size={40}/>
        </div>
        <div>
          <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">{t.setupPolice}</h3>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[4px] mt-3 opacity-60 leading-tight">{t.setupWelcome}</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-8">
        <Input label={t.policeOfficeName} value={policeProfile.name} onChange={(v:any) => setPoliceProfile({...policeProfile, name: v})} required icon={<ShieldCheck size={20}/>} />
        <Input label={t.location} value={policeProfile.address} onChange={(v:any) => setPoliceProfile({...policeProfile, address: v})} required icon={<MapPin size={20}/>} />
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] ml-1">{t.zone}</label>
          <div className="relative group">
            <Map className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors duration-300" size={20}/>
            <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-16 pr-6 py-5 font-black text-sm outline-none focus:border-indigo-400 transition-all appearance-none" 
              value={policeProfile.zone} onChange={e => setPoliceProfile({...policeProfile, zone: e.target.value})} required>
              <option value="">Select Jurisdiction Zone</option>
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>
        <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-6 rounded-[2rem] shadow-2xl transition-all uppercase tracking-[4px] flex items-center justify-center gap-4 text-lg">
          <Save size={24}/> {t.save}
        </button>
      </form>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required, icon }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors duration-300">{icon}</div>
        <input type={type} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-16 pr-6 py-5 text-sm font-black focus:border-amber-400 outline-none transition-all group-hover:border-slate-200 shadow-inner" 
          value={value} onChange={e => onChange(e.target.value)} required={required} />
      </div>
    </div>
  );
}

function GuestForm({ onSubmit, newGuest, setNewGuest, t, handleFileUpload }: any) {
  return (
    <div className="max-w-3xl mx-auto bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
      <h3 className="text-3xl font-black mb-12 flex items-center gap-5 uppercase tracking-tighter tracking-[3px]"><UserPlus size={40} className="text-indigo-600" /> {t.registerGuest}</h3>
      <form onSubmit={onSubmit} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Input label={t.fullName} value={newGuest.fullName} onChange={(v: string) => setNewGuest({...newGuest, fullName: v})} required icon={<Users size={20}/>} />
          <Input label={t.nationality} value={newGuest.nationality} onChange={(v: string) => setNewGuest({...newGuest, nationality: v})} required icon={<Globe size={20}/>} />
        </div>
        <Input label={t.roomNumber} value={newGuest.roomNumber} onChange={(v: string) => setNewGuest({...newGuest, roomNumber: v})} required icon={<Plus size={20}/>} />
        <div className="space-y-4">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] ml-1">{t.idPhoto}</label>
          <div className="p-16 bg-slate-50/50 border-4 border-dashed border-slate-100 rounded-[3rem] text-center cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all duration-500 group" onClick={() => document.getElementById('idUpload')?.click()}>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6 text-slate-200 group-hover:text-indigo-600 group-hover:scale-110 transition-all border-4 border-white"><Camera size={40}/></div>
              <p className="text-[12px] font-black uppercase text-slate-300 tracking-[5px] group-hover:text-indigo-900 transition-colors">{t.capturePhoto}</p>
              <input type="file" id="idUpload" className="hidden" onChange={e => handleFileUpload(e, 'guest')} capture="environment" />
            </div>
          </div>
        </div>
        {newGuest.idPhoto && (
          <div className="relative w-48 h-64 mx-auto animate-in zoom-in-95 duration-500">
            <img src={newGuest.idPhoto} className="w-full h-full object-cover rounded-[2rem] shadow-2xl ring-8 ring-white border-2 border-slate-100" />
            <button type="button" onClick={() => setNewGuest({...newGuest, idPhoto: ''})} className="absolute -top-4 -right-4 bg-red-600 text-white p-3 rounded-full shadow-2xl border-4 border-white"><X size={20}/></button>
          </div>
        )}
        <button className="w-full bg-slate-900 hover:bg-indigo-700 text-white font-black py-7 rounded-[2.5rem] shadow-2xl transition-all uppercase text-xl tracking-[5px] mt-10">{t.submit}</button>
      </form>
    </div>
  );
}

function WantedForm({ addWanted, newWanted, setNewWanted, t, handleFileUpload }: any) {
  return (
    <div className="max-w-3xl mx-auto bg-white p-12 rounded-[4rem] shadow-2xl border-4 border-red-50 animate-in zoom-in-95 duration-500">
      <h3 className="text-3xl font-black text-red-600 mb-12 flex items-center gap-5 uppercase tracking-tighter tracking-[3px]"><AlertTriangle size={40}/> {t.policeNotice}</h3>
      <form onSubmit={addWanted} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Input label={t.fullName} value={newWanted.fullName} onChange={(v: string) => setNewWanted({...newWanted, fullName: v})} required icon={<Users size={20}/>} />
          <Input label={t.crime} value={newWanted.crime} onChange={(v: string) => setNewWanted({...newWanted, crime: v})} required icon={<AlertTriangle size={20}/>} />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] ml-1">{t.description}</label>
          <textarea className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 py-6 text-sm font-black focus:border-red-400 outline-none transition-all min-h-[150px] shadow-inner" 
            value={newWanted.description} onChange={e => setNewWanted({...newWanted, description: e.target.value})} />
        </div>
        <div className="space-y-4">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] ml-1">Evidence Photo</label>
          <div className="p-16 bg-red-50/20 border-4 border-dashed border-red-100 rounded-[3rem] text-center cursor-pointer group" onClick={() => document.getElementById('wantedUpload')?.click()}>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6 text-red-200 group-hover:text-red-600 transition-all border-4 border-white"><Camera size={40}/></div>
              <p className="text-[12px] font-black uppercase text-red-300 tracking-[5px]">{t.fromGallery}</p>
              <input type="file" id="wantedUpload" className="hidden" onChange={e => handleFileUpload(e, 'wanted')} />
            </div>
          </div>
        </div>
        {newWanted.photo && (
          <div className="relative w-48 h-64 mx-auto animate-in zoom-in-95 duration-500">
            <img src={newWanted.photo} className="w-full h-full object-cover rounded-[2rem] shadow-2xl ring-8 ring-white border-4 border-red-50" />
            <button type="button" onClick={() => setNewWanted({...newWanted, photo: ''})} className="absolute -top-4 -right-4 bg-red-600 text-white p-3 rounded-full shadow-2xl border-4 border-white"><X size={20}/></button>
          </div>
        )}
        <button className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-7 rounded-[2.5rem] shadow-2xl transition-all uppercase text-xl tracking-[5px] mt-10">Broadcast Bulletin</button>
      </form>
    </div>
  );
}

function UtilitySection({ t }: any) {
  return (
    <div className="bg-white p-12 sm:p-20 rounded-[5rem] shadow-2xl border border-slate-100 space-y-12 max-w-5xl mx-auto text-center">
      <div className="flex flex-col items-center">
        <img src={LOGO_PATH} className="w-40 h-40 mb-10 drop-shadow-2xl grayscale opacity-20" 
          onError={(e) => { e.currentTarget.src = "https://img.icons8.com/color/512/police-badge.png" }} />
        <h3 className={`text-4xl sm:text-6xl leading-tight mb-8 ${GOLDEN_GRADIENT}`}>{t.appUtility}</h3>
        <div className="h-1 bg-amber-500/20 w-32 mb-10 rounded-full"></div>
      </div>
      <p className="text-slate-600 font-bold leading-[2.5] text-lg sm:text-2xl text-justify px-4 sm:px-10 opacity-80 border-l-8 border-amber-400 py-4 bg-amber-50/50 rounded-r-[3rem]">
        {t.utilityText}
      </p>
      <div className="pt-20 border-t border-slate-50">
        <p className="text-amber-800 font-black uppercase text-sm sm:text-base tracking-[8px] opacity-40">{t.developerCredit}</p>
      </div>
    </div>
  );
}

function NotifView({ notifications, t, setView }: any) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-12 duration-700">
      {notifications.map((n: any) => (
        <div key={n.id} className={`p-10 bg-white border-l-[15px] rounded-[3rem] shadow-2xl flex gap-10 transition-all hover:-translate-x-2 
          ${n.type === 'danger' ? 'border-red-600 bg-red-50/30' : 'border-indigo-600'}`}>
          <div className={`w-20 h-20 rounded-[1.5rem] shadow-2xl border-4 border-white-shrink-0 flex items-center justify-center 
            ${n.type === 'danger' ? 'bg-red-600 text-white shadow-red-100' : 'bg-indigo-600 text-white shadow-indigo-100'}`}>
            <ShieldAlert size={36}/>
          </div>
          <div className="flex-1">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[4px] py-2 px-4 bg-white/50 rounded-xl shadow-inner inline-block mb-4">{n.timestamp}</span>
            <h4 className="text-3xl font-black uppercase text-slate-800 tracking-tighter mb-4">{n.title}</h4>
            <p className="text-xl font-bold text-slate-600 leading-relaxed opacity-80">{n.message}</p>
            {n.guestId && (
              <button onClick={() => setView('guestList')} className="mt-8 px-10 py-4 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase rounded-2xl shadow-2xl shadow-red-100 transition-all tracking-[4px]">Access Judicial Record</button>
            )}
          </div>
        </div>
      ))}
      {notifications.length === 0 && (
        <div className="text-center py-60 opacity-20">
          <ShieldCheck size={120} className="mx-auto mb-10 text-slate-200" />
          <h3 className="text-2xl font-black uppercase tracking-[15px] text-slate-300">Region Secured</h3>
        </div>
      )}
    </div>
  );
}
