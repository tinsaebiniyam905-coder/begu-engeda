import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Guest, WantedPerson, Notification, Language, HotelProfile } from './types';
import { translations } from './translations';
import { 
  Users, UserPlus, AlertTriangle, FileText, LogOut, Bell, Camera, Image as ImageIcon, Download, 
  Printer, Globe, Plus, Settings, Edit, X, Maximize2, CheckCircle2, ShieldCheck, Search, MapPin, 
  Building2, FileBarChart, Menu, Info, ChevronRight, ShieldAlert, History, TrendingUp, Activity, 
  Phone, Fingerprint, Map, Share2, Send, ExternalLink, Lock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const INITIAL_WANTED: WantedPerson[] = [
  { id: 'w1', fullName: 'Abebe Kebede', photo: 'https://picsum.photos/seed/abebe/200/200', description: 'Medium build', crime: 'Theft', postedDate: '2023-10-15' },
];

const ZONES = [
  "Assosa Zone", 
  "Kamashi Zone", 
  "Metekel Zone", 
  "Mao Komo Special Woreda", 
  "Assosa City Administration",
  "Gilgel Beles City Administration",
  "Kamashi City Administration",
  "Bambasi City Administration"
];
const LOGO_PATH = 'https://img.icons8.com/color/512/police-badge.png';
const GOLDEN_GRADIENT = "text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 font-black drop-shadow-sm";

export default function App() {
  const [lang, setLang] = useState<Language>('am');
  const [user, setUser] = useState<{ role: UserRole; username: string; zone?: string; isConfirmed?: boolean } | null>(null);
  const [guests, setGuests] = useState<Guest[]>(() => JSON.parse(localStorage.getItem('guests') || '[]'));
  const [wanted, setWanted] = useState<WantedPerson[]>(() => JSON.parse(localStorage.getItem('wanted') || JSON.stringify(INITIAL_WANTED)));
  const [notifications, setNotifications] = useState<Notification[]>(() => JSON.parse(localStorage.getItem('notifications') || '[]'));
  const [view, setView] = useState<string>('dashboard');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [allHotels, setAllHotels] = useState<HotelProfile[]>(() => JSON.parse(localStorage.getItem('allHotels') || '[]'));
  const [hotelProfile, setHotelProfile] = useState<HotelProfile>(() => JSON.parse(localStorage.getItem('currentHotel') || '{"name":"","address":"","zone":"","receptionistName":"","phoneNumber":""}'));

  const t = translations[lang];

  useEffect(() => localStorage.setItem('guests', JSON.stringify(guests)), [guests]);
  useEffect(() => localStorage.setItem('wanted', JSON.stringify(wanted)), [wanted]);
  useEffect(() => localStorage.setItem('notifications', JSON.stringify(notifications)), [notifications]);
  useEffect(() => localStorage.setItem('allHotels', JSON.stringify(allHotels)), [allHotels]);
  useEffect(() => localStorage.setItem('currentHotel', JSON.stringify(hotelProfile)), [hotelProfile]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.username === 'reception' && loginData.password === '1234') {
      setUser({ role: UserRole.RECEPTION, username: 'reception' });
      setView('setupHotel');
    } else if (loginData.username === 'police' && loginData.password === '1234') {
      // Load saved police jurisdiction if exists
      const savedJurisdiction = localStorage.getItem('police_jurisdiction');
      const isConfirmed = localStorage.getItem('police_jurisdiction_confirmed') === 'true';
      setUser({ 
        role: UserRole.LOCAL_POLICE, 
        username: 'police', 
        zone: savedJurisdiction || undefined,
        isConfirmed
      });
      setView(isConfirmed ? 'dashboard' : 'setupPolice');
    } else if (loginData.username === 'police' && loginData.password === 'police@1234') {
      setUser({ role: UserRole.SUPER_POLICE, username: 'police_hq', isConfirmed: true });
      setView('dashboard');
    } else alert('Invalid credentials / የተሳሳተ መረጃ');
  };

  const handleLogout = () => { setUser(null); setView('dashboard'); setIsSidebarOpen(false); };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hotelProfile.name && hotelProfile.zone) {
      if (!hotelProfile.id) hotelProfile.id = Math.random().toString(36).substr(2, 9);
      const exists = allHotels.find(h => h.id === hotelProfile.id);
      if (!exists) setAllHotels([...allHotels, hotelProfile]);
      else setAllHotels(allHotels.map(h => h.id === hotelProfile.id ? hotelProfile : h));
      setView('dashboard');
    } else alert("Fill all details / ሁሉንም ይሙሉ");
  };

  const saveGuest = (e: React.FormEvent) => {
    e.preventDefault();
    const isWanted = wanted.some(w => w.fullName.toLowerCase().trim() === newGuest.fullName.toLowerCase().trim());
    const guest: Guest = {
      ...newGuest,
      id: Math.random().toString(36).substr(2, 9),
      hotelId: hotelProfile.id,
      hotelName: hotelProfile.name,
      hotelAddress: hotelProfile.address,
      hotelZone: hotelProfile.zone,
      receptionistName: hotelProfile.receptionistName,
      receptionistPhone: hotelProfile.phoneNumber,
      checkInDate: new Date().toISOString().split('T')[0],
      isWanted
    };
    setGuests([guest, ...guests]);
    
    // Automatic Report to Police Notification (Specific routing handled in visibility)
    const policeReportNotif: Notification = {
      id: Date.now().toString() + '_reg',
      title: 'New Guest Registration',
      message: `${guest.fullName} checked into ${guest.hotelName}, Room ${guest.roomNumber}.`,
      type: 'info',
      timestamp: new Date().toLocaleTimeString(),
      targetZone: guest.hotelZone,
      guestId: guest.id
    };
    setNotifications([policeReportNotif, ...notifications]);

    if (isWanted) {
      const wantedNotif: Notification = {
        id: Date.now().toString() + '_alert',
        title: t.alertWantedFound,
        message: `CRITICAL ALERT: ${guest.fullName} (WANTED) detected at ${guest.hotelName}, Room ${guest.roomNumber}. Jurisdiction: ${guest.hotelZone}`,
        type: 'danger',
        timestamp: new Date().toLocaleTimeString(),
        targetZone: guest.hotelZone,
        guestId: guest.id
      };
      setNotifications(prev => [wantedNotif, ...prev]);
    }
    setNewGuest({ fullName: '', nationality: '', roomNumber: '', idPhoto: '' });
    setView('guestList');
  };

  const [newGuest, setNewGuest] = useState({ fullName: '', nationality: '', roomNumber: '', idPhoto: '' });
  const [newWanted, setNewWanted] = useState({ fullName: '', photo: '', description: '', crime: '' });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'guest' | 'wanted' | 'hotel') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'guest') setNewGuest(prev => ({ ...prev, idPhoto: base64 }));
        else if (type === 'wanted') setNewWanted(prev => ({ ...prev, photo: base64 }));
        else if (type === 'hotel') setHotelProfile(prev => ({ ...prev, digitalIdPhoto: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addWanted = (e: React.FormEvent) => {
    e.preventDefault();
    const person: WantedPerson = {
      ...newWanted,
      id: Math.random().toString(36).substr(2, 9),
      postedDate: new Date().toISOString().split('T')[0]
    };
    setWanted([person, ...wanted]);
    setNewWanted({ fullName: '', photo: '', description: '', crime: '' });
    setView('dashboard');
  };

  const visibleGuests = useMemo(() => {
    let list = guests;
    if (user?.role === UserRole.LOCAL_POLICE && user.zone) {
      // STRICT ROUTING: Local police only see guests from their specific zone
      list = guests.filter(g => g.hotelZone === user.zone);
    } else if (user?.role === UserRole.RECEPTION) {
      // Reception only sees their own property guests
      list = guests.filter(g => g.hotelId === hotelProfile.id);
    }
    // SUPER_POLICE see everything
    return list.filter(g => g.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [guests, user, searchTerm, hotelProfile.id]);

  const filteredNotifications = useMemo(() => {
    if (user?.role === UserRole.SUPER_POLICE) return notifications;
    if (user?.role === UserRole.LOCAL_POLICE && user.zone) {
      return notifications.filter(n => n.targetZone === user.zone);
    }
    return []; // Receptions don't see security notifications by default unless found
  }, [notifications, user]);

  const handleShare = (guest: Guest, platform: 'telegram' | 'whatsapp') => {
    const text = `*Police Notification - Begu Engeda*\n\nGuest: ${guest.fullName}\nNationality: ${guest.nationality}\nHotel: ${guest.hotelName}\nRoom: ${guest.roomNumber}\nZone: ${guest.hotelZone}\nCheck-in: ${guest.checkInDate}\n\nRegistered via Benishangul Gumuz Police System.`;
    const encodedText = encodeURIComponent(text);
    const url = platform === 'telegram' 
      ? `https://t.me/share/url?url=${window.location.href}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(url, '_blank');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md relative z-10 border-t-8 border-amber-600">
          <img src={LOGO_PATH} className="w-24 h-24 mx-auto mb-6 drop-shadow-lg" />
          <h1 className={`text-4xl text-center mb-1 ${GOLDEN_GRADIENT} tracking-tight`}>{t.appName}</h1>
          <p className="text-[10px] font-black text-slate-400 text-center uppercase mb-8 tracking-widest">{t.developedBy}</p>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
               <input type="text" placeholder={t.username} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-4 outline-none focus:border-amber-500 font-bold transition-all pl-12" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} required />
               <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
            </div>
            <div className="relative">
               <input type="password" placeholder={t.password} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-4 outline-none focus:border-amber-500 font-bold transition-all pl-12" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required />
               <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
            </div>
            <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl transition-all shadow-xl uppercase text-sm mt-4 flex items-center justify-center gap-2">
              <LogOut className="rotate-180" size={18}/> {t.login}
            </button>
          </form>
          <div className="mt-8 flex justify-center gap-4">
            <button onClick={() => setLang('am')} className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all ${lang === 'am' ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>አማርኛ</button>
            <button onClick={() => setLang('en')} className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all ${lang === 'en' ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>ENGLISH</button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-10 font-bold italic opacity-60">"{t.motto}"</p>
          <p className="text-[9px] text-amber-700 text-center mt-3 font-black uppercase tracking-tighter opacity-80">{t.developerCredit}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-amber-200">
      <aside className="w-72 bg-slate-900 text-white flex flex-col no-print hidden md:flex border-r-4 border-amber-600/20 shadow-2xl">
        <div className="p-8 border-b border-white/5 text-center bg-slate-800/50">
          <img src={LOGO_PATH} className="w-20 h-20 mx-auto mb-4 drop-shadow-md" />
          <h2 className={`text-2xl ${GOLDEN_GRADIENT} tracking-tighter`}>{t.appName}</h2>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          <NavItem icon={<TrendingUp size={20}/>} label={t.dashboard} active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          {user.role === UserRole.RECEPTION && (
            <>
              <NavItem icon={<UserPlus size={20}/>} label={t.registerGuest} active={view === 'registerGuest'} onClick={() => setView('registerGuest')} />
              <NavItem icon={<Users size={20}/>} label={t.guestList} active={view === 'guestList'} onClick={() => setView('guestList')} />
              <NavItem icon={<FileBarChart size={20}/>} label={t.reports} active={view === 'reports'} onClick={() => setView('reports')} />
              <NavItem icon={<Settings size={20}/>} label={t.settings} active={view === 'settings'} onClick={() => setView('settings')} />
            </>
          )}
          {(user.role === UserRole.LOCAL_POLICE || user.role === UserRole.SUPER_POLICE) && (
            <>
              <NavItem icon={<ShieldAlert size={20}/>} label={t.policeNotice} active={view === 'addWanted'} onClick={() => setView('addWanted')} />
              <NavItem icon={<Users size={20}/>} label={t.guestList} active={view === 'guestList'} onClick={() => setView('guestList')} />
              <NavItem icon={<Building2 size={20}/>} label={t.hotelDirectory} active={view === 'hotelDirectory'} onClick={() => setView('hotelDirectory')} />
              <NavItem icon={<FileBarChart size={20}/>} label={t.reports} active={view === 'reports'} onClick={() => setView('reports')} />
            </>
          )}
          <NavItem icon={<Bell size={20}/>} label={t.notifications} active={view === 'notifications'} count={filteredNotifications.length} onClick={() => setView('notifications')} />
          <NavItem icon={<Info size={20}/>} label={t.appUtility} active={view === 'utility'} onClick={() => setView('utility')} />
        </nav>
        <div className="p-6 border-t border-white/5 text-center bg-slate-800/50">
          <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all"><LogOut size={18}/> {t.logout}</button>
          <p className="text-[8px] text-slate-500 mt-4 font-black uppercase tracking-widest">{t.developerCredit}</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-8 py-5 flex justify-between items-center sticky top-0 z-30 shadow-sm no-print">
          <div className="flex items-center gap-4">
             <button className="md:hidden p-2 hover:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}><Menu/></button>
             <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">{t[view] || view}</h3>
          </div>
          <div className="flex items-center gap-6">
             <div className="text-right leading-none hidden sm:block">
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{user.username}</p>
                <p className="text-[10px] text-amber-600 font-bold uppercase mt-1 tracking-tighter">
                   {user.zone ? user.zone : "Assigning..."} {user.isConfirmed && <Lock size={10} className="inline ml-1 opacity-50"/>}
                </p>
             </div>
             <div className="w-10 h-10 bg-amber-500 rounded-xl text-white flex items-center justify-center font-black shadow-lg shadow-amber-500/20">{user.username[0].toUpperCase()}</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full relative">
          {zoomImg && <div className="fixed inset-0 bg-slate-900/90 z-[100] flex items-center justify-center p-8 backdrop-blur-sm" onClick={() => setZoomImg(null)}><div className="relative"><X className="absolute -top-12 -right-4 text-white cursor-pointer hover:scale-110 transition-all" size={32}/><img src={zoomImg} className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border-4 border-white/10 ring-1 ring-white/20"/></div></div>}
          
          <div className="print-only hidden mb-8 border-b-4 border-amber-600 pb-4 text-center">
             <img src={LOGO_PATH} className="w-16 h-16 mx-auto mb-2" />
             <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{t.developedBy}</h1>
             <p className="text-xs font-bold text-slate-500">{t.motto}</p>
             <p className="text-[10px] font-black mt-4 uppercase">Registry Report - {new Date().toLocaleDateString()}</p>
          </div>

          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {view === 'setupHotel' && <SetupForm hotelProfile={hotelProfile} setHotelProfile={setHotelProfile} onSubmit={handleSetupSubmit} t={t} />}
            {view === 'setupPolice' && <JurisdictionSetup ZONES={ZONES} setUser={setUser} user={user} setView={setView} t={t} />}
            
            {view === 'dashboard' && <Dashboard user={user} t={t} guests={visibleGuests} notifications={filteredNotifications} wanted={wanted} setView={setView} />}
            {view === 'guestList' && <ListView items={visibleGuests} t={t} setZoomImg={setZoomImg} handleShare={handleShare} user={user} />}
            {view === 'registerGuest' && <GuestForm newGuest={newGuest} setNewGuest={setNewGuest} onSubmit={saveGuest} t={t} handleFileUpload={handleFileUpload} />}
            {view === 'addWanted' && <WantedForm wanted={wanted} setWanted={setWanted} t={t} handleFileUpload={handleFileUpload} addWanted={addWanted} newWanted={newWanted} setNewWanted={setNewWanted} />}
            {view === 'hotelDirectory' && <HotelDir hotels={allHotels} t={t} user={user} />}
            {view === 'utility' && <UtilityView t={t} GOLDEN_GRADIENT={GOLDEN_GRADIENT} />}
            {view === 'reports' && <ReportSection t={t} guests={visibleGuests} user={user} GOLDEN_GRADIENT={GOLDEN_GRADIENT} />}
            {view === 'notifications' && <NotifView notifications={filteredNotifications} t={t} setView={setView} />}
            {view === 'settings' && <SetupForm hotelProfile={hotelProfile} setHotelProfile={setHotelProfile} onSubmit={handleSetupSubmit} t={t} isSettings />}
          </div>

          <PrintFooter t={t} />
        </main>
      </div>
    </div>
  );
}

// --- Specialized Components ---

function PrintFooter({ t }: any) {
  return (
    <div className="print-only hidden mt-20 pt-10 border-t-2 border-slate-100 no-break">
      <div className="grid grid-cols-2 gap-20">
        <div className="space-y-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supervisor Authority</p>
          <div className="space-y-4">
             <div className="border-b border-slate-300 pb-1">
                <span className="text-[11px] font-black uppercase text-slate-800">{t.supervisorName}: ______________________</span>
             </div>
             <div className="border-b border-slate-300 pb-1">
                <span className="text-[11px] font-black uppercase text-slate-800">{t.rank}: ______________________</span>
             </div>
          </div>
        </div>
        <div className="space-y-6 text-right flex flex-col items-end">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seal & Approval</p>
          <div className="w-40 h-24 border-2 border-slate-100 flex items-center justify-center text-[9px] text-slate-300 font-bold uppercase italic rounded-xl">Department Seal</div>
          <div className="mt-4 border-b border-slate-300 w-full pb-1">
             <span className="text-[11px] font-black uppercase text-slate-800">{t.signature}: ______________________</span>
          </div>
        </div>
      </div>
      <p className="text-[8px] text-center mt-20 text-slate-400 font-black uppercase tracking-widest">{t.developerCredit}</p>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, count }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 group ${active ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 translate-x-1' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      <span className={`${active ? 'text-white' : 'text-amber-500/60 group-hover:text-amber-500'} transition-colors`}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {count > 0 && <span className="bg-red-500 text-white text-[9px] px-2 py-1 rounded-lg shadow-sm animate-pulse">{count}</span>}
    </button>
  );
}

function Dashboard({ t, guests, notifications, wanted, setView, user }: any) {
  const stats = [
    { l: t.guestList, v: guests.length, c: 'bg-blue-600', icon: <Users size={20}/> },
    { l: t.wantedPersons, v: wanted.length, c: 'bg-red-600', icon: <ShieldAlert size={20}/> },
    { l: t.notifications, v: notifications.length, c: 'bg-amber-600', icon: <Bell size={20}/> }
  ];
  
  const chartData = [
    { name: 'Mon', count: 12 },
    { name: 'Tue', count: 18 },
    { name: 'Wed', count: 15 },
    { name: 'Thu', count: 25 },
    { name: 'Fri', count: 32 },
    { name: 'Sat', count: 28 },
    { name: 'Sun', count: 14 },
  ];

  return (
    <div className="space-y-8 no-print">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map(s => <div key={s.l} className="bg-white p-8 rounded-2xl border-2 border-slate-100 flex items-center justify-between shadow-sm hover:shadow-xl hover:border-amber-200 transition-all cursor-pointer group" onClick={() => setView(s.l === t.guestList ? 'guestList' : s.l === t.wantedPersons ? 'wantedPersons' : 'notifications')}>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{s.l}</p>
            <p className="text-4xl font-black text-slate-800 group-hover:text-amber-600 transition-colors">{s.v}</p>
          </div>
          <div className={`${s.c} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-slate-200 group-hover:scale-110 transition-transform`}>{s.icon}</div>
        </div>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Regional Registry Trend</h4>
              <History className="text-slate-300" size={18}/>
           </div>
           <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                 <defs>
                   <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                 <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                 <Area type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col">
           <div className="flex justify-between items-center mb-6">
              <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Live Activity Log</h4>
              <Activity className="text-amber-500 animate-pulse" size={18}/>
           </div>
           <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2">
             {guests.slice(0,8).map(g => (
               <div key={g.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-amber-200 transition-all group">
                 <div className={`w-3 h-3 rounded-full ${g.isWanted ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                 <div className="flex-1">
                   <p className="text-[11px] font-black text-slate-800 uppercase tracking-tighter group-hover:text-amber-600 transition-colors">{g.fullName}</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{g.hotelName} • Room {g.roomNumber}</p>
                 </div>
                 <p className="text-[9px] font-black text-slate-300 uppercase">{g.checkInDate}</p>
               </div>
             ))}
             {guests.length === 0 && <p className="text-center py-10 text-slate-300 font-bold uppercase tracking-widest text-xs italic">No check-ins today</p>}
           </div>
           <button onClick={() => setView('guestList')} className="mt-6 w-full py-4 bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all">View All Records</button>
        </div>
      </div>
    </div>
  );
}

function SetupForm({ hotelProfile, setHotelProfile, onSubmit, t, isSettings }: any) {
  return (
    <div className="max-w-xl mx-auto bg-white p-10 rounded-3xl shadow-xl border-2 border-slate-100">
      <div className="text-center mb-10">
         <Building2 className="mx-auto mb-4 text-amber-500" size={48}/>
         <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{t.setupHotel}</h3>
         <p className="text-xs text-slate-400 font-bold mt-2">{t.setupWelcome}</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        <Input label={t.hotel} value={hotelProfile.name} onChange={(v: string) => setHotelProfile({...hotelProfile, name: v})} required icon={<Building2 size={18}/>}/>
        <Input label={t.hotelAddress} value={hotelProfile.address} onChange={(v: string) => setHotelProfile({...hotelProfile, address: v})} required icon={<MapPin size={18}/>}/>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.zone}</label>
          <div className="relative">
            <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-4 font-black text-sm text-slate-800 outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer" value={hotelProfile.zone} onChange={e => setHotelProfile({...hotelProfile, zone: e.target.value})} required>
              <option value="">Select Jurisdiction</option>{ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 rotate-90 pointer-events-none" size={20}/>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Input label={t.receptionistName} value={hotelProfile.receptionistName} onChange={(v: string) => setHotelProfile({...hotelProfile, receptionistName: v})} required icon={<Users size={18}/>}/>
           <Input label={t.phoneNumber} value={hotelProfile.phoneNumber} onChange={(v: string) => setHotelProfile({...hotelProfile, phoneNumber: v})} type="tel" required icon={<Phone size={18}/>}/>
        </div>
        {isSettings && (
          <div className="p-5 bg-amber-50 border-2 border-amber-100 rounded-2xl flex items-center gap-4">
             <Info className="text-amber-500 shrink-0" size={24}/>
             <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase">{t.verificationRequired}</p>
          </div>
        )}
        <button className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl uppercase text-sm shadow-2xl hover:bg-slate-800 transition-all tracking-widest">{t.save}</button>
      </form>
    </div>
  );
}

function JurisdictionSetup({ ZONES, setUser, user, setView, t }: any) {
  const [tempZone, setTempZone] = useState<string | undefined>(user.zone);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = () => {
    if (!tempZone) return;
    localStorage.setItem('police_jurisdiction', tempZone);
    localStorage.setItem('police_jurisdiction_confirmed', 'true');
    setUser({...user, zone: tempZone, isConfirmed: true});
    setView('dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-10 rounded-3xl shadow-xl border-2 border-slate-100">
      <div className="text-center mb-10">
         <ShieldCheck className="mx-auto mb-4 text-indigo-600" size={48}/>
         <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{t.selectJurisdiction}</h3>
         <p className="text-xs text-slate-400 font-bold mt-2">Select your assigned command post</p>
      </div>
      
      {!isConfirming ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ZONES.map((z: string) => (
            <button key={z} onClick={() => { setTempZone(z); setIsConfirming(true); }} className={`text-left p-6 bg-slate-50 border-2 rounded-2xl font-black text-slate-600 hover:bg-amber-50 hover:border-amber-500 hover:text-amber-700 transition-all flex items-center justify-between group ${tempZone === z ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-transparent'}`}>
              <span className="text-sm uppercase tracking-tight">{z}</span>
              <ChevronRight className="text-slate-300 group-hover:text-amber-500 transition-all" size={20}/>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-8 animate-in zoom-in-95 duration-300">
          <div className="p-8 bg-amber-50 rounded-3xl border-4 border-amber-100 text-center">
            <Lock className="mx-auto mb-4 text-amber-500" size={32}/>
            <h4 className="text-xl font-black text-slate-800 uppercase mb-2">{t.confirmJurisdiction}</h4>
            <p className="text-2xl font-black text-amber-600 uppercase mb-6">{tempZone}</p>
            <p className="text-xs text-slate-500 font-bold leading-relaxed mb-6 uppercase tracking-tighter">{t.jurisdictionWarning}</p>
            <div className="flex gap-4">
               <button onClick={() => setIsConfirming(false)} className="flex-1 py-4 bg-white border-2 border-slate-100 rounded-xl text-xs font-black uppercase text-slate-400 hover:bg-slate-50 transition-all">Back</button>
               <button onClick={handleConfirm} className="flex-1 py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">{t.confirmBtn}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required, icon }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <input type={type} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-4 text-sm font-black text-slate-800 focus:border-amber-500 outline-none transition-all pl-12" value={value} onChange={e => onChange(e.target.value)} required={required} />
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">{icon}</div>}
      </div>
    </div>
  );
}

function ListView({ items, t, setZoomImg, handleShare, user }: any) {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-end mb-2 no-print">
          <div>
             <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Registry Database</h2>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               {user.role === UserRole.SUPER_POLICE ? "Global Oversight" : `${user.zone} Jurisdiction Records`} • Count: {items.length}
             </p>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-white border-2 border-slate-100 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-amber-500 transition-all shadow-sm">
             <Printer size={16}/> {t.print}
          </button>
       </div>
       <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 overflow-hidden overflow-x-auto">
         <table className="w-full text-left min-w-[800px]">
           <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
             <tr>
               <th className="px-8 py-6">Identity</th>
               <th className="px-8 py-6">Guest Credentials</th>
               <th className="px-8 py-6">Property Data</th>
               <th className="px-8 py-6">Security Status</th>
               <th className="px-8 py-6 text-center no-print">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-50 text-[11px] font-black uppercase text-slate-700">
             {items.map((g: any) => (
               <tr key={g.id} className="hover:bg-slate-50/50 transition-all group">
                 <td className="px-8 py-5">
                   <div className="relative w-12 h-16 rounded-lg overflow-hidden border-2 border-slate-200 shadow-sm cursor-zoom-in group-hover:border-amber-400 transition-all" onClick={() => setZoomImg(g.idPhoto)}>
                      {g.idPhoto ? <img src={g.idPhoto} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><ImageIcon size={20}/></div>}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <Maximize2 size={16} className="text-white"/>
                      </div>
                   </div>
                 </td>
                 <td className="px-8 py-5">
                    <p className="text-[12px] font-black tracking-tight text-slate-900">{g.fullName}</p>
                    <p className="text-[9px] text-slate-400 tracking-widest mt-1">{g.nationality}</p>
                 </td>
                 <td className="px-8 py-5">
                    <p className="text-slate-800">{g.hotelName}</p>
                    <p className="text-[9px] text-amber-600 tracking-widest mt-1">Room {g.roomNumber} • {g.hotelZone}</p>
                 </td>
                 <td className="px-8 py-5">
                    {g.isWanted ? (
                      <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 animate-pulse">
                         <AlertTriangle size={14}/> Wanted
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                         <ShieldCheck size={14}/> Clear
                      </span>
                    )}
                 </td>
                 <td className="px-8 py-5 no-print">
                    <div className="flex justify-center items-center gap-3">
                       <button onClick={() => handleShare(g, 'whatsapp')} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all" title="Share via WhatsApp">
                          <Send size={16}/>
                       </button>
                       <button onClick={() => handleShare(g, 'telegram')} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all" title="Share via Telegram">
                          <Share2 size={16}/>
                       </button>
                       <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-800 hover:text-white transition-all" onClick={() => window.print()}>
                          <Printer size={16}/>
                       </button>
                    </div>
                 </td>
               </tr>
             ))}
             {items.length === 0 && <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-widest text-sm select-none opacity-40">Database Empty</td></tr>}
           </tbody>
         </table>
       </div>
    </div>
  );
}

function GuestForm({ onSubmit, newGuest, setNewGuest, t, handleFileUpload }: any) {
  return (
    <div className="max-w-xl mx-auto bg-white p-10 rounded-3xl shadow-xl border-2 border-slate-100">
       <div className="text-center mb-10">
          <UserPlus className="mx-auto mb-4 text-amber-500" size={48}/>
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{t.registerGuest}</h3>
          <p className="text-xs text-slate-400 font-bold mt-2">All guest data is automatically synced with the Police Commission</p>
       </div>
       <form onSubmit={onSubmit} className="space-y-6">
          <Input label={t.fullName} value={newGuest.fullName} onChange={(v: string) => setNewGuest({...newGuest, fullName: v})} required icon={<Users size={18}/>} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Input label={t.nationality} value={newGuest.nationality} onChange={(v: string) => setNewGuest({...newGuest, nationality: v})} required icon={<Globe size={18}/>} />
             <Input label={t.roomNumber} value={newGuest.roomNumber} onChange={(v: string) => setNewGuest({...newGuest, roomNumber: v})} required icon={<Activity size={18}/>} />
          </div>
          
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.idPhoto}</label>
             <div className="flex flex-col items-center gap-6 p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl hover:border-amber-400 transition-all group cursor-pointer" onClick={() => document.getElementById('idUpload')?.click()}>
                {newGuest.idPhoto ? (
                  <div className="relative group/img">
                    <img src={newGuest.idPhoto} className="w-32 h-44 object-cover rounded-2xl shadow-xl border-4 border-white"/>
                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">Change Image</div>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 group-hover:text-amber-500 transition-colors">
                      <Camera size={32}/>
                    </div>
                    <div className="text-center">
                       <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">{t.capturePhoto}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Click to upload image or take a photo</p>
                    </div>
                  </>
                )}
                <input type="file" id="idUpload" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'guest')} />
             </div>
          </div>

          <button className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl uppercase text-sm shadow-2xl hover:bg-slate-800 transition-all tracking-widest flex items-center justify-center gap-3">
             <ShieldCheck size={20}/> Submit Registry Record
          </button>
       </form>
    </div>
  );
}

function WantedForm({ addWanted, newWanted, setNewWanted, t, handleFileUpload }: any) {
  return (
    <div className="max-w-xl mx-auto bg-white p-10 rounded-3xl shadow-xl border-2 border-red-50">
       <div className="text-center mb-10">
          <ShieldAlert className="mx-auto mb-4 text-red-600" size={48}/>
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Police Bulletin System</h3>
          <p className="text-xs text-slate-400 font-bold mt-2">Post critical information to alert all regional hotel receptions</p>
       </div>
       <form onSubmit={addWanted} className="space-y-6">
          <Input label={t.fullName} value={newWanted.fullName} onChange={(v: string) => setNewWanted({...newWanted, fullName: v})} required icon={<Users size={18}/>} />
          <Input label={t.crime} value={newWanted.crime} onChange={(v: string) => setNewWanted({...newWanted, crime: v})} required icon={<AlertTriangle size={18}/>} />
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.description}</label>
             <textarea className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-sm font-black text-slate-800 focus:border-red-500 outline-none transition-all h-32" value={newWanted.description} onChange={e => setNewWanted({...newWanted, description: e.target.value})} placeholder="Unique identification marks, last known location..." />
          </div>
          
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profile Photo</label>
             <div className="flex flex-col items-center gap-6 p-8 bg-red-50/30 border-2 border-dashed border-red-100 rounded-3xl hover:border-red-400 transition-all group cursor-pointer" onClick={() => document.getElementById('wantedUpload')?.click()}>
                {newWanted.photo ? (
                  <img src={newWanted.photo} className="w-32 h-44 object-cover rounded-2xl shadow-xl border-4 border-white"/>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center text-red-300 group-hover:text-red-500 transition-colors">
                      <ImageIcon size={32}/>
                    </div>
                    <div className="text-center">
                       <p className="text-[10px] font-black text-red-800 uppercase tracking-widest mb-1">Upload Mugshot</p>
                       <p className="text-[9px] font-bold text-red-300 uppercase tracking-tighter">Click to add profile image</p>
                    </div>
                  </>
                )}
                <input type="file" id="wantedUpload" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'wanted')} />
             </div>
          </div>

          <button className="w-full bg-red-600 text-white font-black py-5 rounded-2xl uppercase text-sm shadow-2xl hover:bg-red-700 transition-all tracking-widest flex items-center justify-center gap-3">
             <Plus size={20}/> Publish Security Alert
          </button>
       </form>
    </div>
  );
}

function HotelDir({ hotels, t, user }: any) {
  const filteredHotels = useMemo(() => {
    if (user.role === UserRole.SUPER_POLICE) return hotels;
    return hotels.filter((h: any) => h.zone === user.zone);
  }, [hotels, user]);

  return (
    <div className="space-y-6">
       <div className="mb-2">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Hotel Directory</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {user.role === UserRole.SUPER_POLICE ? "Regional Oversight" : `${user.zone} Jurisdiction`} • Property Count: {filteredHotels.length}
          </p>
       </div>
       <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 overflow-hidden overflow-x-auto">
         <table className="w-full text-left min-w-[800px]">
           <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
             <tr>
               <th className="px-8 py-6">Property Name</th>
               <th className="px-8 py-6">Jurisdiction</th>
               <th className="px-8 py-6">Personnel Data</th>
               <th className="px-8 py-6">Contact Info</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-50 text-[11px] font-black uppercase text-slate-700">
             {filteredHotels.map((h: any) => (
               <tr key={h.id} className="hover:bg-slate-50/50 transition-all">
                 <td className="px-8 py-5">
                    <p className="text-[12px] font-black tracking-tight text-slate-900">{h.name}</p>
                    <p className="text-[9px] text-slate-400 tracking-widest mt-1">{h.address}</p>
                 </td>
                 <td className="px-8 py-5">
                    <span className="bg-slate-100 px-3 py-1 rounded-lg text-slate-600">{h.zone}</span>
                 </td>
                 <td className="px-8 py-5 text-slate-600">{h.receptionistName}</td>
                 <td className="px-8 py-5 text-indigo-600 font-black tracking-widest">{h.phoneNumber}</td>
               </tr>
             ))}
             {filteredHotels.length === 0 && <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-widest text-sm select-none opacity-40">No Registered Properties in this Jurisdiction</td></tr>}
           </tbody>
         </table>
       </div>
    </div>
  );
}

function ReportSection({ t, guests, user, GOLDEN_GRADIENT }: any) {
  const [activeReport, setActiveReport] = useState('daily');
  
  const intervals = [
    { id: 'daily', label: 'Daily (24H)', am: 'የቀን' },
    { id: '3months', label: '3 Months', am: 'የ3 ወር' },
    { id: '6months', label: '6 Months', am: 'የ6 ወር' },
    { id: '9months', label: '9 Months', am: 'የ9 ወር' },
    { id: 'annual', label: 'Annual (1Y)', am: 'የአመት' }
  ];

  return (
    <div className="bg-white p-12 rounded-[40px] shadow-sm border-2 border-slate-100 text-center space-y-12 no-print relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700"></div>
      <div className="flex flex-col items-center">
         <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mb-6 shadow-sm">
            <FileBarChart size={40} />
         </div>
         <h3 className={`text-3xl uppercase ${GOLDEN_GRADIENT} tracking-tighter`}>Official Oversight Ledger</h3>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">{t.developedBy}</p>
      </div>

      <div className="space-y-4">
         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Select Audit Interval</p>
         <div className="flex flex-wrap justify-center gap-3">
            {intervals.map(itv => (
              <button key={itv.id} onClick={() => setActiveReport(itv.id)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeReport === itv.id ? 'bg-slate-800 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                 {itv.am} / {itv.label}
              </button>
            ))}
         </div>
      </div>

      <div className="space-y-4">
         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Generate Official Export</p>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
           {[
             { name: "EXCEL", color: "text-emerald-600", bg: "bg-emerald-50", am: "ኤክሴል" },
             { name: "WORD", color: "text-blue-600", bg: "bg-blue-50", am: "ዎርድ" },
             { name: "PPT", color: "text-orange-600", bg: "bg-orange-50", am: "ፒፒቲ" },
             { name: "PDF", color: "text-red-600", bg: "bg-red-50", am: "ፒዲኤፍ" }
           ].map(f => (
             <button key={f.name} onClick={() => window.print()} className={`p-8 ${f.bg} border-2 border-transparent rounded-3xl flex flex-col items-center gap-4 hover:border-amber-400 group transition-all shadow-sm hover:shadow-xl`}>
               <div className={`${f.color} group-hover:scale-110 transition-transform`}><Download size={32}/></div>
               <div className="text-center">
                  <p className="text-[11px] font-black uppercase text-slate-800 tracking-widest">{f.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{f.am}</p>
               </div>
             </button>
           ))}
         </div>
      </div>

      <div className="pt-12 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-10 text-left">
        <div className="space-y-1">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6">Internal Registry Certification</p>
           <div className="h-px bg-slate-100 w-48 mb-2"></div>
           <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{t.supervisorName}</p>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.rank}</p>
        </div>
        <div className="text-center md:text-right space-y-1">
           <div className="w-32 h-32 border-4 border-double border-slate-100 rounded-full flex items-center justify-center text-[9px] text-slate-200 font-black uppercase tracking-widest mb-4">Seal of Commission</div>
           <div className="h-px bg-slate-100 w-48 mb-2 ml-auto"></div>
           <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">{t.signature}</p>
        </div>
      </div>
    </div>
  );
}

function UtilityView({ t, GOLDEN_GRADIENT }: any) {
  return (
    <div className="bg-white p-16 rounded-[40px] shadow-sm border-2 border-slate-100 space-y-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-20 -mt-20"></div>
      <div className="text-center">
         <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-amber-500 mx-auto mb-8 shadow-2xl">
            <Info size={40}/>
         </div>
         <h3 className={`text-4xl text-center tracking-tighter uppercase ${GOLDEN_GRADIENT}`}>{t.appUtility}</h3>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Strategic Information Oversight</p>
      </div>
      <div className="max-w-3xl mx-auto">
         <p className="text-slate-600 font-black leading-[2] uppercase text-sm tracking-tight text-center md:text-justify opacity-80">{t.utilityText}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-slate-50">
         {[
           { icon: <ShieldCheck size={24}/>, label: "Security", text: "End-to-end encrypted regional monitoring" },
           { icon: <Globe size={24}/>, label: "Sync", text: "Real-time data flow to Commission HQ" },
           { icon: <TrendingUp size={24}/>, label: "Analysis", text: "Automated crime pattern detection" }
         ].map(item => (
           <div key={item.label} className="text-center space-y-3">
              <div className="text-amber-500 mx-auto">{item.icon}</div>
              <p className="text-[10px] font-black uppercase text-slate-800 tracking-widest">{item.label}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">{item.text}</p>
           </div>
         ))}
      </div>
      <div className="text-center pt-10">
         <p className="text-amber-700 font-black uppercase tracking-[0.2em] text-[10px]">{t.developerCredit}</p>
      </div>
    </div>
  );
}

function NotifView({ notifications, t, setView }: any) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
         <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Command Notifications</h2>
         <span className="bg-slate-800 text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-widest">{notifications.length} Pending</span>
      </div>
      {notifications.map((n: any) => (
        <div key={n.id} className={`p-8 bg-white border-2 rounded-3xl shadow-sm flex gap-6 hover:shadow-xl hover:-translate-y-1 transition-all group ${n.type === 'danger' ? 'border-red-100 ring-4 ring-red-50/50' : 'border-slate-50'}`}>
          <div className={`p-5 rounded-2xl shrink-0 group-hover:scale-110 transition-transform ${n.type === 'danger' ? 'bg-red-500 text-white shadow-xl shadow-red-200' : 'bg-slate-800 text-white'}`}>
             {n.type === 'danger' ? <ShieldAlert size={28}/> : <Bell size={28}/>}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-3">
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{n.timestamp}</p>
               {n.type === 'danger' && <span className="bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded uppercase animate-bounce">Priority 1</span>}
            </div>
            <h4 className="text-sm font-black uppercase text-slate-900 tracking-tight leading-none mb-3 group-hover:text-amber-600 transition-colors">{n.title}</h4>
            <p className="text-[11px] text-slate-500 font-bold leading-relaxed mb-6">{n.message}</p>
            {n.guestId && (
              <button onClick={() => setView('guestList')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${n.type === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-800 text-white hover:bg-slate-900'}`}>
                Intercept Profile <ExternalLink size={14}/>
              </button>
            )}
          </div>
        </div>
      ))}
      {notifications.length === 0 && (
        <div className="text-center py-40">
           <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40}/>
           </div>
           <p className="text-slate-300 font-black uppercase tracking-[0.4em] text-sm select-none opacity-40">All Systems Clear</p>
           <p className="text-[10px] font-bold text-slate-200 uppercase mt-2">Standing by for regional data...</p>
        </div>
      )}
    </div>
  );
}
