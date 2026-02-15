
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Guest, WantedPerson, Notification, Language, HotelProfile } from './types';
import { translations } from './translations';
import { 
  Users, UserPlus, AlertTriangle, FileText, LogOut, Bell, Camera, Image as ImageIcon, Download, 
  Printer, Globe, Plus, Settings, Edit, X, Maximize2, CheckCircle2, ShieldCheck, Search, MapPin, 
  Building2, FileBarChart, Menu, Info, ChevronRight, ShieldAlert, History, TrendingUp, Activity, 
  Phone, Fingerprint, Map, Share2, Send, ExternalLink, Lock, DownloadCloud
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
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
      const savedZone = localStorage.getItem('police_jurisdiction');
      const isConfirmed = localStorage.getItem('police_jurisdiction_confirmed') === 'true';
      setUser({ role: UserRole.LOCAL_POLICE, username: 'police', zone: savedZone || undefined, isConfirmed });
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
    
    // Notification for strictly routed receiving system
    const newReport: Notification = {
      id: Date.now().toString(),
      title: isWanted ? t.alertWantedFound : 'Guest Check-in Report',
      message: `${guest.fullName} registered at ${guest.hotelName}, Room ${guest.roomNumber}. Jurisdiction: ${guest.hotelZone}`,
      type: isWanted ? 'danger' : 'info',
      timestamp: new Date().toLocaleTimeString(),
      targetZone: guest.hotelZone,
      guestId: guest.id
    };
    setNotifications([newReport, ...notifications]);

    if (isWanted) alert(t.alertWantedFound + " - " + guest.fullName);
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
      list = guests.filter(g => g.hotelZone === user.zone);
    } else if (user?.role === UserRole.RECEPTION) {
      list = guests.filter(g => g.hotelId === hotelProfile.id);
    }
    return list.filter(g => g.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [guests, user, searchTerm, hotelProfile.id]);

  const filteredNotifications = useMemo(() => {
    if (user?.role === UserRole.SUPER_POLICE) return notifications;
    if (user?.role === UserRole.LOCAL_POLICE && user.zone) {
      return notifications.filter(n => n.targetZone === user.zone);
    }
    return [];
  }, [notifications, user]);

  const handleShare = (guest: Guest, platform: 'telegram' | 'whatsapp') => {
    const text = `*Police Registry Info - Begu Engeda*\n\nName: ${guest.fullName}\nNationality: ${guest.nationality}\nProperty: ${guest.hotelName}\nZone: ${guest.hotelZone}\nRoom: ${guest.roomNumber}\nStatus: ${guest.isWanted ? 'WANTED ALERT' : 'Normal'}`;
    const encoded = encodeURIComponent(text);
    const url = platform === 'telegram' 
      ? `https://t.me/share/url?url=${window.location.href}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md relative z-10 border-t-8 border-amber-600">
          <img src={LOGO_PATH} className="w-24 h-24 mx-auto mb-6 drop-shadow-xl" />
          <h1 className={`text-4xl text-center mb-1 ${GOLDEN_GRADIENT} tracking-tight`}>{t.appName}</h1>
          <p className="text-[10px] font-black text-slate-400 text-center uppercase mb-8 tracking-widest">{t.developedBy}</p>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
               <input type="text" placeholder={t.username} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 outline-none focus:border-amber-500 font-bold transition-all pl-12" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} required />
               <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
            </div>
            <div className="relative">
               <input type="password" placeholder={t.password} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 outline-none focus:border-amber-500 font-bold transition-all pl-12" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required />
               <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
            </div>
            <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl uppercase text-sm mt-4 flex items-center justify-center gap-3">
               {t.login} <ChevronRight size={18}/>
            </button>
          </form>
          <div className="mt-8 flex justify-center gap-4">
            <button onClick={() => setLang('am')} className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all ${lang === 'am' ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>አማርኛ</button>
            <button onClick={() => setLang('en')} className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all ${lang === 'en' ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>ENGLISH</button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-12 font-bold italic opacity-60 uppercase tracking-tighter">"{t.motto}"</p>
          <p className="text-[9px] text-amber-700 text-center mt-2 font-black uppercase opacity-80">{t.developerCredit}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <aside className="w-80 bg-slate-900 text-white flex flex-col no-print hidden md:flex border-r-4 border-amber-600/20 shadow-2xl">
        <div className="p-8 border-b border-white/5 text-center bg-slate-800/30">
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
        <div className="p-8 border-t border-white/5 bg-slate-800/50">
          <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"><LogOut size={18}/> {t.logout}</button>
          <p className="text-[8px] text-slate-500 mt-6 text-center font-black uppercase tracking-widest opacity-40">{t.developerCredit}</p>
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
                   {user.zone || "Command post..."} {user.isConfirmed && <Lock size={10} className="inline ml-1 opacity-50"/>}
                </p>
             </div>
             <div className="w-10 h-10 bg-amber-500 rounded-2xl text-white flex items-center justify-center font-black shadow-lg shadow-amber-500/20">{user.username[0].toUpperCase()}</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 max-w-7xl mx-auto w-full relative">
          {zoomImg && <div className="fixed inset-0 bg-slate-900/95 z-[100] flex items-center justify-center p-12 backdrop-blur-md" onClick={() => setZoomImg(null)}><div className="relative group"><X className="absolute -top-12 right-0 text-white cursor-pointer hover:scale-125 transition-all" size={32}/><img src={zoomImg} className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl border-4 border-white/10 ring-1 ring-white/20"/></div></div>}
          
          <div className="print-only hidden mb-12 border-b-8 border-slate-900 pb-6 text-center">
             <div className="flex justify-between items-start">
               <img src={LOGO_PATH} className="w-24 h-24 mb-4" />
               <div className="text-right">
                  <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{t.developedBy}</h1>
                  <p className="text-sm font-bold text-slate-500 mt-1">{t.motto}</p>
               </div>
             </div>
             <div className="h-2 bg-amber-500 my-6"></div>
             <p className="text-xs font-black uppercase tracking-widest">Official Registry Document • System Report ID: {Math.floor(Math.random()*1000000)}</p>
             <p className="text-xs font-bold text-slate-400 mt-1">Generated: {new Date().toLocaleString()}</p>
          </div>

          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
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

function Input({ label, value, onChange, type = "text", required, icon }: any) {
  return (
    <div className="space-y-3 flex-1">
      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <input 
          type={type} 
          className="w-full bg-slate-50 border-4 border-slate-100 rounded-3xl px-6 py-5 font-black text-sm text-slate-800 outline-none focus:border-amber-500 transition-all pl-14" 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          required={required} 
        />
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

function SetupForm({ hotelProfile, setHotelProfile, onSubmit, t, isSettings }: any) {
  return (
    <div className="max-w-2xl mx-auto bg-white p-12 rounded-[50px] shadow-2xl border-2 border-slate-100">
      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-10 text-center">
        {isSettings ? t.settings : t.setupHotel}
      </h3>
      <form onSubmit={onSubmit} className="space-y-8">
        <Input label={t.hotel} value={hotelProfile.name} onChange={(v: string) => setHotelProfile({...hotelProfile, name: v})} required icon={<Building2 size={20}/>} />
        <Input label={t.hotelAddress} value={hotelProfile.address} onChange={(v: string) => setHotelProfile({...hotelProfile, address: v})} required icon={<MapPin size={20}/>} />
        <div className="space-y-3">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.zone}</label>
          <div className="relative">
            <select className="w-full bg-slate-50 border-4 border-slate-100 rounded-3xl px-6 py-5 font-black text-sm text-slate-800 outline-none focus:border-amber-500 transition-all appearance-none" value={hotelProfile.zone} onChange={e => setHotelProfile({...hotelProfile, zone: e.target.value})} required>
              <option value="">Select Command Post</option>{ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 rotate-90" size={24}/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8">
           <Input label={t.receptionistName} value={hotelProfile.receptionistName} onChange={(v: string) => setHotelProfile({...hotelProfile, receptionistName: v})} required icon={<Users size={20}/>} />
           <Input label={t.phoneNumber} value={hotelProfile.phoneNumber} onChange={(v: string) => setHotelProfile({...hotelProfile, phoneNumber: v})} type="tel" required icon={<Phone size={20}/>} />
        </div>
        <button className="w-full bg-slate-900 text-white font-black py-6 rounded-3xl uppercase text-xs shadow-2xl hover:bg-slate-800 transition-all tracking-[0.3em]">Save Profile</button>
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
    <div className="max-w-3xl mx-auto bg-white p-16 rounded-[60px] shadow-2xl border-2 border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32"></div>
      <div className="text-center mb-12">
         <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-xl">
            <ShieldCheck size={48}/>
         </div>
         <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{t.selectJurisdiction}</h3>
         <p className="text-xs text-slate-400 font-bold mt-3 tracking-widest uppercase">Police Receiving System Configuration</p>
      </div>
      
      {!isConfirming ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {ZONES.map((z: string) => (
            <button key={z} onClick={() => { setTempZone(z); setIsConfirming(true); }} className={`text-left p-8 bg-slate-50 border-4 rounded-[40px] font-black text-slate-600 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-800 transition-all flex items-center justify-between group ${tempZone === z ? 'border-indigo-500 bg-indigo-50 text-indigo-800' : 'border-transparent'}`}>
              <span className="text-[13px] uppercase tracking-tight leading-tight">{z}</span>
              <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-all translate-x-2" size={24}/>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-10 animate-in zoom-in-95 duration-500">
          <div className="p-12 bg-amber-50 rounded-[50px] border-4 border-amber-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-amber-400"></div>
            <Lock className="mx-auto mb-6 text-amber-500" size={40}/>
            <h4 className="text-2xl font-black text-slate-900 uppercase mb-3 tracking-tight">{t.confirmJurisdiction}</h4>
            <div className="py-4 px-8 bg-white/50 rounded-3xl inline-block mb-8 border-2 border-amber-200">
               <p className="text-3xl font-black text-amber-700 uppercase tracking-tighter">{tempZone}</p>
            </div>
            <p className="text-xs text-slate-600 font-black leading-relaxed mb-10 uppercase tracking-tight max-w-sm mx-auto">{t.jurisdictionWarning}</p>
            <div className="flex gap-6 max-w-md mx-auto">
               <button onClick={() => setIsConfirming(false)} className="flex-1 py-5 bg-white border-4 border-slate-100 rounded-3xl text-[11px] font-black uppercase text-slate-400 hover:bg-slate-50 transition-all tracking-widest">Change</button>
               <button onClick={handleConfirm} className="flex-1 py-5 bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all">{t.confirmBtn}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GuestForm({ newGuest, setNewGuest, onSubmit, t, handleFileUpload }: any) {
  return (
    <div className="max-w-4xl mx-auto bg-white p-16 rounded-[60px] shadow-2xl border-2 border-slate-100 relative overflow-hidden">
      <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-12 text-center">{t.registerGuest}</h3>
      <form onSubmit={onSubmit} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-10">
            <Input label={t.fullName} value={newGuest.fullName} onChange={(v: string) => setNewGuest({...newGuest, fullName: v})} required icon={<Users size={20}/>} />
            <Input label={t.nationality} value={newGuest.nationality} onChange={(v: string) => setNewGuest({...newGuest, nationality: v})} required icon={<Globe size={20}/>} />
            <Input label={t.roomNumber} value={newGuest.roomNumber} onChange={(v: string) => setNewGuest({...newGuest, roomNumber: v})} required icon={<MapPin size={20}/>} />
          </div>
          <div className="flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[50px] p-8 bg-slate-50/50 group hover:border-amber-300 transition-all">
            {newGuest.idPhoto ? (
              <div className="relative w-full h-64">
                <img src={newGuest.idPhoto} className="w-full h-full object-cover rounded-[40px] shadow-xl" />
                <button type="button" onClick={() => setNewGuest({...newGuest, idPhoto: ''})} className="absolute -top-4 -right-4 bg-red-500 text-white p-3 rounded-2xl shadow-lg hover:bg-red-600 transition-all"><X size={20}/></button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-6 cursor-pointer text-slate-400 group-hover:text-amber-500 transition-all">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
                  <Camera size={40}/>
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-black uppercase tracking-widest">{t.capturePhoto}</p>
                  <p className="text-[9px] font-bold uppercase mt-2 opacity-60">PNG, JPG, JPEG (Max 5MB)</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'guest')} />
              </label>
            )}
          </div>
        </div>
        <button className="w-full bg-slate-900 text-white font-black py-6 rounded-3xl uppercase text-xs shadow-2xl hover:bg-slate-800 transition-all tracking-[0.3em] mt-6 flex items-center justify-center gap-4">
           {t.submit} <Send size={18}/>
        </button>
      </form>
    </div>
  );
}

function WantedForm({ t, handleFileUpload, addWanted, newWanted, setNewWanted }: any) {
  return (
    <div className="max-w-4xl mx-auto bg-white p-16 rounded-[60px] shadow-2xl border-2 border-slate-100 relative overflow-hidden">
      <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-12 text-center">{t.policeNotice}</h3>
      <form onSubmit={addWanted} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <Input label={t.fullName} value={newWanted.fullName} onChange={(v: string) => setNewWanted({...newWanted, fullName: v})} required icon={<Users size={20}/>} />
            <Input label={t.crime} value={newWanted.crime} onChange={(v: string) => setNewWanted({...newWanted, crime: v})} required icon={<ShieldAlert size={20}/>} />
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.description}</label>
              <textarea 
                className="w-full bg-slate-50 border-4 border-slate-100 rounded-3xl px-6 py-5 font-black text-sm text-slate-800 outline-none focus:border-amber-500 transition-all h-32" 
                value={newWanted.description} 
                onChange={e => setNewWanted({...newWanted, description: e.target.value})} 
                required 
              />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[50px] p-8 bg-slate-50/50 group hover:border-amber-300 transition-all">
            {newWanted.photo ? (
              <div className="relative w-full h-80">
                <img src={newWanted.photo} className="w-full h-full object-cover rounded-[40px] shadow-xl" />
                <button type="button" onClick={() => setNewWanted({...newWanted, photo: ''})} className="absolute -top-4 -right-4 bg-red-500 text-white p-3 rounded-2xl shadow-lg hover:bg-red-600 transition-all"><X size={20}/></button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-6 cursor-pointer text-slate-400 group-hover:text-amber-500 transition-all">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
                  <ImageIcon size={40}/>
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-black uppercase tracking-widest">{t.capturePhoto}</p>
                  <p className="text-[9px] font-bold uppercase mt-2 opacity-60">Suspect Photo Required</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'wanted')} />
              </label>
            )}
          </div>
        </div>
        <button className="w-full bg-red-600 text-white font-black py-6 rounded-3xl uppercase text-xs shadow-2xl hover:bg-red-700 transition-all tracking-[0.3em] mt-6 flex items-center justify-center gap-4">
           {t.policeNotice} <ShieldAlert size={18}/>
        </button>
      </form>
    </div>
  );
}

function PrintFooter({ t }: any) {
  return (
    <div className="print-only hidden mt-24 pt-12 border-t-4 border-slate-100 no-break">
      <div className="grid grid-cols-2 gap-32">
        <div className="space-y-10">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Commanding Officer Oversight</p>
          <div className="space-y-6">
             <div className="border-b-2 border-slate-300 pb-2">
                <span className="text-[13px] font-black uppercase text-slate-800">{t.supervisorName}: ______________________</span>
             </div>
             <div className="border-b-2 border-slate-300 pb-2">
                <span className="text-[13px] font-black uppercase text-slate-800">{t.rank}: ______________________</span>
             </div>
          </div>
        </div>
        <div className="space-y-10 text-right flex flex-col items-end">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Official Seal & Stamp</p>
          <div className="w-48 h-32 border-4 border-slate-100 flex items-center justify-center text-[10px] text-slate-300 font-black uppercase italic rounded-3xl rotate-12 bg-slate-50/50">Jurisdiction Seal Required</div>
          <div className="mt-8 border-b-2 border-slate-300 w-full pb-2">
             <span className="text-[13px] font-black uppercase text-slate-800">{t.signature}: ______________________</span>
          </div>
        </div>
      </div>
      <div className="mt-24 text-center">
         <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em]">{t.developerCredit}</p>
         <p className="text-[8px] text-slate-300 font-bold uppercase mt-2 tracking-widest">Benishangul Gumuz Police Information & Tech Directorate (Biniyam Yirsaw Metina)</p>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, count }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 group ${active ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/40 translate-x-2' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      <span className={`${active ? 'text-white' : 'text-amber-500/50 group-hover:text-amber-500'} transition-colors`}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {count > 0 && <span className="bg-red-500 text-white text-[9px] px-2.5 py-1 rounded-xl shadow-lg shadow-red-500/20 animate-pulse">{count}</span>}
    </button>
  );
}

function Dashboard({ t, guests, notifications, wanted, setView, user }: any) {
  const stats = [
    { l: t.guestList, v: guests.length, c: 'bg-indigo-600', icon: <Users size={24}/>, am: "የእንግዳ ዝርዝር" },
    { l: t.wantedPersons, v: wanted.length, c: 'bg-red-600', icon: <ShieldAlert size={24}/>, am: "ተፈላጊ ሰዎች" },
    { l: t.notifications, v: notifications.length, c: 'bg-amber-600', icon: <Bell size={24}/>, am: "ማሳወቂያዎች" }
  ];
  
  const chartData = [
    { name: 'Mon', count: 12 }, { name: 'Tue', count: 18 }, { name: 'Wed', count: 15 },
    { name: 'Thu', count: 25 }, { name: 'Fri', count: 32 }, { name: 'Sat', count: 28 }, { name: 'Sun', count: 14 },
  ];

  return (
    <div className="space-y-10 no-print">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map(s => <div key={s.l} className="bg-white p-10 rounded-[40px] border-2 border-slate-100 flex items-center justify-between shadow-sm hover:shadow-2xl hover:border-amber-200 transition-all cursor-pointer group" onClick={() => setView(s.l === t.guestList ? 'guestList' : s.l === t.wantedPersons ? 'wantedPersons' : 'notifications')}>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{s.am}</p>
            <p className="text-5xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">{s.v}</p>
            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">{s.l}</p>
          </div>
          <div className={`${s.c} w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-slate-200 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>{s.icon}</div>
        </div>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[40px] border-2 border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-10">
              <div>
                <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Regional Activity Trends</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Automatic Daily Sync Analysis</p>
              </div>
              <History className="text-amber-500" size={24}/>
           </div>
           <div className="h-80 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                 <defs>
                   <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                 <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px'}} />
                 <Area type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={5} fillOpacity={1} fill="url(#colorCount)" animationDuration={2000} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] border-2 border-slate-100 shadow-sm flex flex-col">
           <div className="flex justify-between items-center mb-8">
              <div>
                <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Police Receiving Log</h4>
                <p className="text-[9px] text-amber-600 font-bold uppercase mt-1">Real-time Jurisdiction Sync</p>
              </div>
              <DownloadCloud className="text-indigo-600 animate-bounce" size={24}/>
           </div>
           <div className="flex-1 space-y-5 overflow-y-auto max-h-[350px] pr-4 custom-scrollbar">
             {guests.slice(0,10).map(g => (
               <div key={g.id} className="flex items-center gap-6 p-6 bg-slate-50 rounded-[30px] border-2 border-transparent hover:border-amber-200 hover:bg-white transition-all group relative overflow-hidden">
                 <div className={`absolute left-0 top-0 h-full w-1.5 ${g.isWanted ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                 <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-slate-300 group-hover:text-amber-500 transition-colors">
                    {g.fullName[0].toUpperCase()}
                 </div>
                 <div className="flex-1">
                   <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight group-hover:text-amber-600 transition-colors">{g.fullName}</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{g.hotelName} • Room {g.roomNumber}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-800 uppercase">{g.checkInDate}</p>
                    <p className={`text-[8px] font-black uppercase mt-1 ${g.isWanted ? 'text-red-500' : 'text-emerald-500'}`}>{g.isWanted ? 'Intercept' : 'Verified'}</p>
                 </div>
               </div>
             ))}
             {guests.length === 0 && (
               <div className="text-center py-24">
                  <Activity className="mx-auto mb-4 text-slate-200" size={48}/>
                  <p className="text-slate-300 font-black uppercase tracking-widest text-xs italic">Standing by for regional data...</p>
               </div>
             )}
           </div>
           <button onClick={() => setView('guestList')} className="mt-8 w-full py-5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl hover:bg-slate-800 shadow-xl transition-all flex items-center justify-center gap-3">
             View Secure Registry <ChevronRight size={14}/>
           </button>
        </div>
      </div>
    </div>
  );
}

function ListView({ items, t, setZoomImg, handleShare, user }: any) {
  return (
    <div className="space-y-8">
       <div className="flex justify-between items-end mb-4 no-print">
          <div>
             <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Registry Database</h2>
             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
               {user.role === UserRole.SUPER_POLICE ? "Regional Oversight" : `${user.zone} Jurisdiction`} Records • {items.length} Secure Entries
             </p>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-3 bg-white border-4 border-slate-100 px-8 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest text-slate-700 hover:border-amber-500 transition-all shadow-sm">
             <Printer size={18}/> {t.print}
          </button>
       </div>
       <div className="bg-white rounded-[50px] shadow-sm border-4 border-slate-50 overflow-hidden overflow-x-auto">
         <table className="w-full text-left min-w-[900px]">
           <thead className="bg-slate-100/50 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] border-b-2 border-slate-100">
             <tr>
               <th className="px-10 py-8">Biometrics</th>
               <th className="px-10 py-8">Identity</th>
               <th className="px-10 py-8">Property Data</th>
               <th className="px-10 py-8">Status</th>
               <th className="px-10 py-8 text-center no-print">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y-2 divide-slate-50 text-[12px] font-black uppercase text-slate-800">
             {items.map((g: any) => (
               <tr key={g.id} className="hover:bg-slate-50 transition-all group">
                 <td className="px-10 py-6">
                   <div className="relative w-14 h-20 rounded-2xl overflow-hidden border-4 border-slate-200 shadow-lg cursor-zoom-in group-hover:border-amber-500 transition-all" onClick={() => setZoomImg(g.idPhoto)}>
                      {g.idPhoto ? <img src={g.idPhoto} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><ImageIcon size={24}/></div>}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Maximize2 size={20} className="text-white"/></div>
                   </div>
                 </td>
                 <td className="px-10 py-6">
                    <p className="text-[14px] font-black tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors">{g.fullName}</p>
                    <p className="text-[10px] text-slate-400 tracking-widest mt-1.5">{g.nationality}</p>
                 </td>
                 <td className="px-10 py-6">
                    <p className="text-slate-800">{g.hotelName}</p>
                    <p className="text-[10px] text-amber-600 tracking-widest mt-1.5 font-black uppercase">{g.hotelZone} • Room {g.roomNumber}</p>
                 </td>
                 <td className="px-10 py-6">
                    {g.isWanted ? (
                      <span className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-2xl border-2 border-red-100 animate-pulse">
                         <AlertTriangle size={16}/> WANTED
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-2xl border-2 border-emerald-100">
                         <ShieldCheck size={16}/> VERIFIED
                      </span>
                    )}
                 </td>
                 <td className="px-10 py-6 no-print">
                    <div className="flex justify-center items-center gap-4 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                       <button onClick={() => handleShare(g, 'whatsapp')} className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Share via WhatsApp"><Send size={18}/></button>
                       <button onClick={() => handleShare(g, 'telegram')} className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Share via Telegram"><Share2 size={18}/></button>
                    </div>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
    </div>
  );
}

function HotelDir({ hotels, t, user }: any) {
  const filtered = useMemo(() => {
    if (user.role === UserRole.SUPER_POLICE) return hotels;
    return hotels.filter((h: any) => h.zone === user.zone);
  }, [hotels, user]);

  return (
    <div className="space-y-8">
       <div className="mb-4">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Property Directory</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {user.role === UserRole.SUPER_POLICE ? "Regional Command Oversight" : `${user.zone} Jurisdiction Properties`} • {filtered.length} Active Feeds
          </p>
       </div>
       <div className="bg-white rounded-[50px] shadow-sm border-4 border-slate-50 overflow-hidden overflow-x-auto">
         <table className="w-full text-left min-w-[900px]">
           <thead className="bg-slate-100/50 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] border-b-2 border-slate-100">
             <tr>
               <th className="px-10 py-8">Property Name</th>
               <th className="px-10 py-8">Jurisdiction</th>
               <th className="px-10 py-8">Personnel</th>
               <th className="px-10 py-8">Security Contact</th>
             </tr>
           </thead>
           <tbody className="divide-y-2 divide-slate-50 text-[12px] font-black uppercase text-slate-800">
             {filtered.map((h: any) => (
               <tr key={h.id} className="hover:bg-slate-50 transition-all">
                 <td className="px-10 py-6">
                    <p className="text-[14px] font-black tracking-tight text-slate-900">{h.name}</p>
                    <p className="text-[10px] text-slate-400 tracking-widest mt-1.5 uppercase">{h.address}</p>
                 </td>
                 <td className="px-10 py-6">
                    <span className="bg-slate-100 px-5 py-2.5 rounded-2xl text-[10px] font-black text-slate-600 tracking-widest">{h.zone}</span>
                 </td>
                 <td className="px-10 py-6 text-slate-500 font-bold">{h.receptionistName}</td>
                 <td className="px-10 py-6">
                    <div className="flex items-center gap-3 text-indigo-600 font-black tracking-[0.2em]">
                       <Phone size={14}/> {h.phoneNumber}
                    </div>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
    </div>
  );
}

function UtilityView({ t, GOLDEN_GRADIENT }: any) {
  return (
    <div className="bg-white p-20 rounded-[60px] shadow-sm border-2 border-slate-100 space-y-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full -mr-48 -mt-48"></div>
      <div className="text-center">
         <div className="w-24 h-24 bg-slate-900 rounded-[40px] flex items-center justify-center text-amber-500 mx-auto mb-10 shadow-2xl">
            <Info size={48}/>
         </div>
         <h3 className={`text-5xl text-center tracking-tighter uppercase ${GOLDEN_GRADIENT}`}>{t.appUtility}</h3>
         <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] mt-4">Official Commission Protocol</p>
      </div>
      <div className="max-w-3xl mx-auto">
         <p className="text-slate-700 font-black leading-[2.2] uppercase text-[15px] tracking-tight text-center md:text-justify opacity-90">{t.utilityText}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t-2 border-slate-50">
         {[
           { icon: <ShieldCheck size={32}/>, label: "Registry Security", text: "End-to-end encrypted military-grade database" },
           { icon: <DownloadCloud size={32}/>, label: "Police receiving", text: "Instant jurisdiction-based intelligence routing" },
           { icon: <TrendingUp size={32}/>, label: "Automated report", text: "Cross-interval periodic audit automation" }
         ].map(item => (
           <div key={item.label} className="text-center space-y-4 group cursor-default">
              <div className="text-amber-500 mx-auto group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">{item.icon}</div>
              <p className="text-[12px] font-black uppercase text-slate-900 tracking-widest">{item.label}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed max-w-[200px] mx-auto">{item.text}</p>
           </div>
         ))}
      </div>
      <div className="text-center pt-12">
         <p className="text-amber-800 font-black uppercase tracking-[0.3em] text-[11px]">{t.developerCredit}</p>
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
    <div className="bg-white p-16 rounded-[60px] shadow-sm border-2 border-slate-100 text-center space-y-16 no-print relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700"></div>
      <div className="flex flex-col items-center">
         <div className="w-24 h-24 bg-amber-50 rounded-[40px] flex items-center justify-center text-amber-500 mb-8 shadow-sm">
            <FileBarChart size={48} />
         </div>
         <h3 className={`text-4xl uppercase ${GOLDEN_GRADIENT} tracking-tighter`}>Automated Reporting System</h3>
         <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">{t.developedBy}</p>
      </div>

      <div className="space-y-6">
         <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Select Audit Receiving Interval</p>
         <div className="flex flex-wrap justify-center gap-4">
            {intervals.map(itv => (
              <button key={itv.id} onClick={() => setActiveReport(itv.id)} className={`px-8 py-4 rounded-[30px] text-[11px] font-black uppercase tracking-widest transition-all ${activeReport === itv.id ? 'bg-slate-900 text-white shadow-2xl scale-110 ring-4 ring-slate-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                 {itv.am} / {itv.label}
              </button>
            ))}
         </div>
      </div>

      <div className="space-y-8">
         <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Download Secure receiving records</p>
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
           {[
             { name: "EXCEL", color: "text-emerald-600", bg: "bg-emerald-50", am: "ኤክሴል", icon: <FileText size={40}/> },
             { name: "WORD", color: "text-blue-600", bg: "bg-blue-50", am: "ዎርድ", icon: <FileText size={40}/> },
             { name: "PPT", color: "text-orange-600", bg: "bg-orange-50", am: "ፒፒቲ", icon: <FileText size={40}/> },
             { name: "PDF", color: "text-red-600", bg: "bg-red-50", am: "ፒዲኤፍ", icon: <Printer size={40}/> }
           ].map(f => (
             <button key={f.name} onClick={() => window.print()} className={`p-10 ${f.bg} border-4 border-transparent rounded-[50px] flex flex-col items-center gap-6 hover:border-amber-400 group transition-all shadow-sm hover:shadow-2xl`}>
               <div className={`${f.color} group-hover:scale-125 group-hover:-rotate-12 transition-all duration-500`}>{f.icon}</div>
               <div className="text-center">
                  <p className="text-[13px] font-black uppercase text-slate-900 tracking-widest">{f.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{f.am}</p>
               </div>
             </button>
           ))}
         </div>
      </div>

      <div className="pt-16 border-t-2 border-slate-50 flex flex-col md:flex-row justify-between items-center gap-16 text-left">
        <div className="space-y-2">
           <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] mb-8">Registry Audit certification</p>
           <div className="h-0.5 bg-slate-100 w-64 mb-3"></div>
           <p className="text-[14px] font-black text-slate-900 uppercase tracking-tight">{t.supervisorName}</p>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.rank}</p>
        </div>
        <div className="text-center md:text-right space-y-2 flex flex-col items-end">
           <div className="w-40 h-40 border-8 border-double border-slate-100 rounded-full flex items-center justify-center text-[10px] text-slate-200 font-black uppercase tracking-widest mb-6 bg-slate-50/30">Official Receipt Stamp</div>
           <div className="h-0.5 bg-slate-100 w-64 mb-3"></div>
           <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em]">{t.signature}</p>
        </div>
      </div>
    </div>
  );
}

function NotifView({ notifications, t, setView }: any) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-10">
         <div>
           <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Command Center Receiving</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live Jurisdiction Monitoring Status</p>
         </div>
         <span className="bg-slate-900 text-white text-[10px] font-black px-6 py-3 rounded-2xl uppercase tracking-[0.2em] shadow-xl">{notifications.length} Active Feeds</span>
      </div>
      {notifications.map((n: any) => (
        <div key={n.id} className={`p-10 bg-white border-4 rounded-[40px] shadow-sm flex gap-8 hover:shadow-2xl hover:-translate-y-2 transition-all group ${n.type === 'danger' ? 'border-red-100 ring-8 ring-red-50/30' : 'border-slate-50'}`}>
          <div className={`p-6 rounded-3xl shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ${n.type === 'danger' ? 'bg-red-600 text-white shadow-2xl shadow-red-200' : 'bg-slate-800 text-white'}`}>
             {n.type === 'danger' ? <ShieldAlert size={36}/> : <Bell size={36}/>}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-4">
               <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">{n.timestamp}</p>
               {n.type === 'danger' && <span className="bg-red-600 text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase animate-bounce shadow-lg shadow-red-500/30">Urgent receiving</span>}
            </div>
            <h4 className="text-lg font-black uppercase text-slate-900 tracking-tight leading-none mb-4 group-hover:text-amber-600 transition-colors">{n.title}</h4>
            <p className="text-[13px] text-slate-500 font-bold leading-relaxed mb-8">{n.message}</p>
            {n.guestId && (
              <div className="flex gap-4">
                 <button onClick={() => setView('guestList')} className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${n.type === 'danger' ? 'bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-500/20' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl'}`}>
                   Intercept Profile <Maximize2 size={16}/>
                 </button>
                 <button className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-amber-500 hover:text-white transition-all shadow-sm">
                   <Share2 size={20}/>
                 </button>
              </div>
            )}
          </div>
        </div>
      ))}
      {notifications.length === 0 && (
        <div className="text-center py-52">
           <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-xl">
              <CheckCircle2 size={48}/>
           </div>
           <p className="text-slate-300 font-black uppercase tracking-[0.6em] text-sm select-none opacity-40">Command post standing by</p>
           <p className="text-[11px] font-black text-slate-200 uppercase mt-3 tracking-widest">No Active Security Alerts in Jurisdiction</p>
        </div>
      )}
    </div>
  );
}
