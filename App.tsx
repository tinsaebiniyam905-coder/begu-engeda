
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Guest, WantedPerson, Notification, Language, HotelProfile } from './types';
import { translations } from './translations';
import { 
  Users, UserPlus, AlertTriangle, FileText, LogOut, Bell, Camera, Image as ImageIcon, Download, 
  Printer, Globe, Plus, Settings, Edit, X, Maximize2, CheckCircle2, ShieldCheck, Search, MapPin, 
  Building2, FileBarChart, Menu, Info, ChevronRight, ShieldAlert, History, TrendingUp, Activity, 
  Phone, Fingerprint, Map, LayoutDashboard, Save
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
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
  const [user, setUser] = useState<{ role: UserRole; username: string; zone?: string } | null>(null);
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
      setUser({ role: UserRole.LOCAL_POLICE, username: 'police' });
      setView('setupPolice');
    } else if (loginData.username === 'police' && loginData.password === 'police@1234') {
      setUser({ role: UserRole.SUPER_POLICE, username: 'police_hq' });
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

  const [newGuest, setNewGuest] = useState({ fullName: '', nationality: '', roomNumber: '', idPhoto: '' });
  const [newWanted, setNewWanted] = useState({ fullName: '', photo: '', description: '', crime: '' });

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
    if (isWanted) {
      const notif: Notification = {
        id: Date.now().toString(),
        title: t.alertWantedFound,
        message: `${guest.fullName} at ${guest.hotelName}, Room ${guest.roomNumber}. (${guest.hotelZone})`,
        type: 'danger',
        timestamp: new Date().toLocaleTimeString(),
        targetZone: guest.hotelZone,
        guestId: guest.id
      };
      setNotifications([notif, ...notifications]);
    }
    setNewGuest({ fullName: '', nationality: '', roomNumber: '', idPhoto: '' });
    setView('guestList');
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

  const visibleGuests = useMemo(() => {
    let list = guests;
    if (user?.role === UserRole.LOCAL_POLICE && user.zone) {
      list = guests.filter(g => g.hotelZone === user.zone);
    }
    return list.filter(g => g.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [guests, user, searchTerm]);

  // Handle mobile sidebar auto-close
  const navigateTo = (v: string) => {
    setView(v);
    setIsSidebarOpen(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-10 w-full max-w-sm transition-all">
          <img src={LOGO_PATH} className="w-20 h-20 mx-auto mb-6" />
          <h1 className={`text-2xl sm:text-3xl text-center mb-1 ${GOLDEN_GRADIENT}`}>{t.appName}</h1>
          <p className="text-[10px] font-bold text-gray-400 text-center uppercase mb-8">{t.developedBy}</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder={t.username} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500 font-bold transition-all" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} required />
            <input type="password" placeholder={t.password} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500 font-bold transition-all" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required />
            <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl shadow-lg transition-all uppercase text-sm mt-4 tracking-wider">
              {t.login}
            </button>
          </form>
          <div className="mt-8 flex justify-center gap-4">
            <button onClick={() => setLang('am')} className={`px-4 py-2 rounded-full text-[10px] font-black transition-all ${lang === 'am' ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>አማርኛ</button>
            <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-full text-[10px] font-black transition-all ${lang === 'en' ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>EN</button>
          </div>
          <p className="text-[9px] text-gray-300 text-center mt-10 font-bold italic">"{t.motto}"</p>
          <p className="text-[8px] text-amber-600/60 text-center mt-2 font-black uppercase tracking-tight">{t.developerCredit}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col md:flex-row font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative z-50 w-64 h-full bg-[#1F2937] text-white flex flex-col transition-all duration-300 no-print 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-white/5 text-center flex flex-col items-center">
          <img src={LOGO_PATH} className="w-12 h-12 mb-3" />
          <h2 className={`text-lg leading-tight ${GOLDEN_GRADIENT}`}>{t.appName}</h2>
          <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 opacity-60 leading-tight">{t.developedBy}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
          <NavItem icon={<LayoutDashboard size={18}/>} label={t.dashboard} active={view === 'dashboard'} onClick={() => navigateTo('dashboard')} />
          {user.role === UserRole.RECEPTION && (
            <>
              <NavItem icon={<UserPlus size={18}/>} label={t.registerGuest} active={view === 'registerGuest'} onClick={() => navigateTo('registerGuest')} />
              <NavItem icon={<Users size={18}/>} label={t.guestList} active={view === 'guestList'} onClick={() => navigateTo('guestList')} />
              <NavItem icon={<Settings size={18}/>} label={t.settings} active={view === 'settings'} onClick={() => navigateTo('settings')} />
            </>
          )}
          {(user.role === UserRole.LOCAL_POLICE || user.role === UserRole.SUPER_POLICE) && (
            <>
              <NavItem icon={<Plus size={18}/>} label={t.policeNotice} active={view === 'addWanted'} onClick={() => navigateTo('addWanted')} />
              <NavItem icon={<Users size={18}/>} label={t.guestList} active={view === 'guestList'} onClick={() => navigateTo('guestList')} />
              <NavItem icon={<Building2 size={18}/>} label={t.hotelDirectory} active={view === 'hotelDirectory'} onClick={() => navigateTo('hotelDirectory')} />
            </>
          )}
          <NavItem icon={<Bell size={18}/>} label={t.notifications} active={view === 'notifications'} count={notifications.filter(n => !user.zone || n.targetZone === user.zone).length} onClick={() => navigateTo('notifications')} />
          <NavItem icon={<Info size={18}/>} label={t.appUtility} active={view === 'utility'} onClick={() => navigateTo('utility')} />
        </nav>

        <div className="p-4 border-t border-white/5 bg-[#111827]/50">
          <div className="text-[8px] text-amber-500/50 mb-3 text-center uppercase font-black leading-tight">{t.developerCredit}</div>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all">
            <LogOut size={16}/> {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b px-4 sm:px-6 py-4 flex justify-between items-center shadow-sm z-30">
          <div className="flex items-center gap-3">
             <button className="md:hidden p-2 -ml-2 text-slate-500" onClick={() => setIsSidebarOpen(true)}>
               <Menu size={20}/>
             </button>
             <div>
               <h3 className="font-black text-slate-800 uppercase text-xs sm:text-sm tracking-widest leading-none">
                 {t[view] || view}
               </h3>
               <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase hidden sm:block">
                 {hotelProfile.name || "Regional System"}
               </p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="text-right leading-none hidden xs:block">
                <p className="text-[10px] sm:text-xs font-black text-slate-900 uppercase tracking-tighter">{user.username}</p>
                <p className="text-[8px] sm:text-[9px] text-amber-600 font-black uppercase mt-1">
                  {user.zone || (user.role === UserRole.SUPER_POLICE ? "Police HQ" : "Pending...")}
                </p>
             </div>
             <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-xl text-amber-700 flex items-center justify-center font-black shadow-sm border border-amber-200 uppercase">
                {user.username[0]}
             </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar scroll-smooth">
          {zoomImg && (
            <div className="fixed inset-0 bg-slate-900/95 z-[100] flex items-center justify-center p-4" onClick={() => setZoomImg(null)}>
              <div className="relative max-w-4xl w-full">
                <button className="absolute -top-12 right-0 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all">
                  <X size={24}/>
                </button>
                <img src={zoomImg} className="w-full h-auto max-h-[85vh] rounded-2xl shadow-2xl object-contain ring-4 ring-white/10" />
              </div>
            </div>
          )}
          
          <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            {view === 'setupHotel' && <SetupForm hotelProfile={hotelProfile} setHotelProfile={setHotelProfile} onSubmit={handleSetupSubmit} t={t} />}
            {view === 'setupPolice' && (
              <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 animate-in zoom-in-95 duration-300">
                <h3 className="text-lg font-black mb-6 uppercase text-slate-800 tracking-tight flex items-center gap-2">
                  <MapPin size={20} className="text-amber-500"/>
                  Assigned Jurisdiction
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {ZONES.map(z => (
                    <button key={z} onClick={() => { setUser({...user, zone: z}); setView('dashboard'); }} 
                      className="w-full text-left p-4 bg-gray-50 border border-slate-100 rounded-xl font-black text-[11px] text-gray-500 uppercase tracking-wider hover:bg-amber-50 hover:border-amber-500 hover:text-amber-700 transition-all shadow-sm">
                      {z}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {view === 'dashboard' && <Dashboard user={user} t={t} guests={visibleGuests} notifications={notifications} wanted={wanted} setView={setView} />}
            {view === 'guestList' && <ListView items={visibleGuests} t={t} setZoomImg={setZoomImg} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />}
            {view === 'registerGuest' && <GuestForm newGuest={newGuest} setNewGuest={setNewGuest} onSubmit={saveGuest} t={t} handleFileUpload={handleFileUpload} />}
            {view === 'addWanted' && <WantedForm wanted={wanted} setWanted={setWanted} t={t} handleFileUpload={handleFileUpload} addWanted={addWanted} newWanted={newWanted} setNewWanted={setNewWanted} />}
            {view === 'hotelDirectory' && <HotelDir hotels={allHotels} t={t} />}
            {view === 'utility' && (
              <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-100 space-y-8 max-w-3xl mx-auto">
                <h3 className={`text-2xl sm:text-3xl text-center leading-tight ${GOLDEN_GRADIENT}`}>{t.appUtility}</h3>
                <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
                  <p className="text-slate-700 font-bold leading-relaxed text-sm sm:text-base text-justify">
                    {t.utilityText}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-4 pt-6 border-t border-slate-100">
                  <img src={LOGO_PATH} className="w-16 h-16 opacity-30 grayscale" />
                  <p className="text-amber-700 font-black uppercase text-xs tracking-widest text-center">{t.developerCredit}</p>
                </div>
              </div>
            )}
            {view === 'reports' && <ReportSection t={t} guests={visibleGuests} user={user} />}
            {view === 'notifications' && <NotifView notifications={notifications.filter(n => !user.zone || n.targetZone === user.zone)} t={t} setView={setView} />}
            {view === 'settings' && <SetupForm hotelProfile={hotelProfile} setHotelProfile={setHotelProfile} onSubmit={handleSetupSubmit} t={t} isSettings />}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, count }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[1px] transition-all duration-300 group
      ${active ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 translate-x-1' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      <span className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {count > 0 && <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black shadow-sm ring-2 ring-slate-800">{count}</span>}
    </button>
  );
}

function Dashboard({ t, guests, notifications, wanted, setView, user }: any) {
  const stats = [
    { l: t.guestList, v: guests.length, c: 'bg-indigo-600', icon: <Users size={20}/> },
    { l: t.wantedPersons, v: wanted.length, c: 'bg-red-600', icon: <AlertTriangle size={20}/> },
    { l: t.notifications, v: notifications.filter((n:any) => !user.zone || n.targetZone === user.zone).length, c: 'bg-amber-600', icon: <Bell size={20}/> }
  ];
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {stats.map(s => (
          <div key={s.l} className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]" 
            onClick={() => setView(s.l === t.guestList ? 'guestList' : s.l === t.wantedPersons ? 'wantedPersons' : 'notifications')}>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.l}</p>
              <p className="text-3xl font-black text-slate-800 tracking-tighter">{s.v}</p>
            </div>
            <div className={`${s.c} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform`}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 h-80 shadow-sm">
          <h4 className="font-black text-slate-800 uppercase mb-4 text-[10px] tracking-widest flex items-center gap-2">
            <TrendingUp size={14} className="text-indigo-500"/>
            Registration Analytics
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{n:'Daily', v:guests.length},{n:'Regional', v:12}]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
              <Bar dataKey="v" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h4 className="font-black text-slate-800 uppercase mb-4 text-[10px] tracking-widest flex items-center gap-2">
            <Activity size={14} className="text-emerald-500"/>
            Recent Regional Activity
          </h4>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-[10px] font-bold">
              <thead className="bg-slate-50 uppercase text-slate-400 sticky top-0">
                <tr>
                  <th className="p-3">Guest Name</th>
                  <th className="p-3">Property</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {guests.slice(0, 8).map(g => (
                  <tr key={g.id} className="hover:bg-indigo-50/50 transition-colors">
                    <td className="p-3 uppercase text-slate-700">{g.fullName}</td>
                    <td className="p-3 uppercase text-slate-400 font-medium">{g.hotelName}</td>
                    <td className="p-3 text-center">
                      {g.isWanted ? 
                        <span className="text-red-500 font-black animate-pulse bg-red-50 px-2 py-0.5 rounded">Wanted</span> : 
                        <span className="text-emerald-500 font-black">Clear</span>
                      }
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

// Added 'Save' to lucide-react imports above
function SetupForm({ hotelProfile, setHotelProfile, onSubmit, t, isSettings }: any) {
  const [needsId, setNeedsId] = useState(isSettings);
  return (
    <div className="max-w-xl mx-auto bg-white p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
          <Building2 size={28}/>
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t.setupHotel}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.setupWelcome}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <Input label={t.hotel} value={hotelProfile.name} onChange={(v:any) => setHotelProfile({...hotelProfile, name: v})} required icon={<Building2 size={16}/>} />
        <Input label={t.hotelAddress} value={hotelProfile.address} onChange={(v:any) => setHotelProfile({...hotelProfile, address: v})} required icon={<MapPin size={16}/>} />
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.zone}</label>
          <div className="relative group">
            <Map className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={16}/>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none" 
              value={hotelProfile.zone} onChange={e => setHotelProfile({...hotelProfile, zone: e.target.value})} required>
              <option value="">Select Zone</option>
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input label={t.receptionistName} value={hotelProfile.receptionistName} onChange={(v:any) => setHotelProfile({...hotelProfile, receptionistName: v})} required icon={<Users size={16}/>} />
          <Input label={t.phoneNumber} value={hotelProfile.phoneNumber} onChange={(v:any) => setHotelProfile({...hotelProfile, phoneNumber: v})} type="tel" required icon={<Phone size={16}/>} />
        </div>

        {needsId && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-[10px] font-black text-amber-700 uppercase tracking-wider flex items-center gap-3">
            <Fingerprint size={20}/>
            {t.verificationRequired}
          </div>
        )}
        
        <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all uppercase text-xs tracking-[2px] mt-4 flex items-center justify-center gap-2">
          <Save size={18}/> {t.save}
        </button>
      </form>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required, icon }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors duration-300">
          {icon}
        </div>
        <input type={type} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all group-hover:border-slate-300" 
          value={value} onChange={e => onChange(e.target.value)} required={required} />
      </div>
    </div>
  );
}

function ListView({ items, t, setZoomImg, searchTerm, setSearchTerm }: any) {
  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
        <input type="text" placeholder={t.searchPlaceholder} className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-amber-500 font-bold text-sm shadow-sm transition-all" 
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-5">ID</th>
                <th className="px-6 py-5">Full Name</th>
                <th className="px-6 py-5">Property Data</th>
                <th className="px-6 py-5 text-center">Security Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] font-bold uppercase text-slate-700">
              {items.map((g: any) => (
                <tr key={g.id} className="hover:bg-indigo-50/30 transition-all duration-300 group">
                  <td className="px-6 py-4">
                    <div className="w-12 h-16 rounded-xl overflow-hidden shadow-lg ring-2 ring-white border border-slate-100 transform group-hover:scale-110 transition-transform cursor-zoom-in" onClick={() => setZoomImg(g.idPhoto)}>
                      <img src={g.idPhoto} className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-800 text-sm tracking-tight">{g.fullName}</p>
                    <p className="text-[9px] text-slate-400 mt-1 font-bold">{g.nationality} • {g.checkInDate}</p>
                  </td>
                  <td className="px-6 py-4 leading-tight">
                    <p className="text-slate-600">{g.hotelName}</p>
                    <p className="text-[9px] text-slate-400 font-bold opacity-60 mt-1">{g.hotelZone}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {g.isWanted ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-full text-[9px] font-black shadow-lg shadow-red-200 animate-pulse border-2 border-white uppercase">
                        <AlertTriangle size={12}/> Wanted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-full text-[9px] font-black shadow-lg shadow-emerald-200 border-2 border-white uppercase">
                        <CheckCircle2 size={12}/> Clear
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-20 text-center opacity-20">
                    <Users size={64} className="mx-auto mb-4" />
                    <p className="font-black tracking-widest uppercase">No Guests Found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function GuestForm({ onSubmit, newGuest, setNewGuest, t, handleFileUpload }: any) {
  return (
    <div className="max-w-xl mx-auto bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center shadow-inner">
          <UserPlus size={32}/>
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">{t.registerGuest}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Identity Intake Form</p>
        </div>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Input label={t.fullName} value={newGuest.fullName} onChange={(v: string) => setNewGuest({...newGuest, fullName: v})} required icon={<Users size={16}/>} />
          <Input label={t.nationality} value={newGuest.nationality} onChange={(v: string) => setNewGuest({...newGuest, nationality: v})} required icon={<Globe size={16}/>} />
        </div>
        <Input label={t.roomNumber} value={newGuest.roomNumber} onChange={(v: string) => setNewGuest({...newGuest, roomNumber: v})} required icon={<Plus size={16}/>} />
        
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.idPhoto}</label>
          <div className="p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center cursor-pointer hover:bg-slate-100 hover:border-indigo-400 transition-all duration-300 group" onClick={() => document.getElementById('idUpload')?.click()}>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4 text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all">
                <Camera size={28}/>
              </div>
              <p className="text-[11px] font-black uppercase text-slate-500 tracking-widest">{t.capturePhoto}</p>
              <input type="file" id="idUpload" className="hidden" onChange={e => handleFileUpload(e, 'guest')} capture="environment" />
            </div>
          </div>
        </div>

        {newGuest.idPhoto && (
          <div className="relative w-32 h-44 mx-auto animate-in zoom-in-75 duration-300">
            <img src={newGuest.idPhoto} className="w-full h-full object-cover rounded-2xl shadow-2xl ring-4 ring-white" />
            <button type="button" onClick={() => setNewGuest({...newGuest, idPhoto: ''})} className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg border-2 border-white">
              <X size={14}/>
            </button>
          </div>
        )}

        <button className="w-full bg-slate-900 hover:bg-indigo-700 text-white font-black py-5 rounded-[1.5rem] uppercase text-sm tracking-[3px] mt-6 shadow-2xl shadow-slate-200 transition-all">
          Submit to Registry
        </button>
      </form>
    </div>
  );
}

function WantedForm({ addWanted, newWanted, setNewWanted, t, handleFileUpload }: any) {
  return (
    <div className="max-w-xl mx-auto bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-red-50 animate-in zoom-in-95 duration-500">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center shadow-inner">
          <AlertTriangle size={32}/>
        </div>
        <div>
          <h3 className="text-2xl font-black text-red-600 uppercase tracking-tighter leading-none">{t.policeNotice}</h3>
          <p className="text-[10px] font-bold text-red-300 uppercase tracking-widest mt-1">Criminal Bulletin Board</p>
        </div>
      </div>

      <form onSubmit={addWanted} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Input label={t.fullName} value={newWanted.fullName} onChange={(v: string) => setNewWanted({...newWanted, fullName: v})} required icon={<Users size={16}/>} />
          <Input label={t.crime} value={newWanted.crime} onChange={(v: string) => setNewWanted({...newWanted, crime: v})} required icon={<AlertTriangle size={16}/>} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.description}</label>
          <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none transition-all min-h-[100px]" 
            value={newWanted.description} onChange={e => setNewWanted({...newWanted, description: e.target.value})} />
        </div>
        
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Suspect Photo</label>
          <div className="p-10 bg-red-50/50 border-2 border-dashed border-red-200 rounded-3xl text-center cursor-pointer group" onClick={() => document.getElementById('wantedUpload')?.click()}>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4 text-red-400 group-hover:scale-110 transition-all">
                <Camera size={28}/>
              </div>
              <p className="text-[11px] font-black uppercase text-red-400 tracking-widest">Upload Profile Photo</p>
              <input type="file" id="wantedUpload" className="hidden" onChange={e => handleFileUpload(e, 'wanted')} />
            </div>
          </div>
        </div>

        {newWanted.photo && (
          <div className="relative w-32 h-40 mx-auto animate-in zoom-in-75 duration-300">
            <img src={newWanted.photo} className="w-full h-full object-cover rounded-2xl shadow-2xl ring-4 ring-white border-2 border-red-100" />
            <button type="button" onClick={() => setNewWanted({...newWanted, photo: ''})} className="absolute -top-3 -right-3 bg-red-600 text-white p-2 rounded-full shadow-lg border-2 border-white">
              <X size={14}/>
            </button>
          </div>
        )}

        <button className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-[1.5rem] uppercase text-sm tracking-[3px] mt-6 shadow-2xl shadow-red-100 transition-all">
          Publish Bulletin
        </button>
      </form>
    </div>
  );
}

function HotelDir({ hotels, t }: any) {
  return (
    <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-[11px] font-bold uppercase tracking-tight">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-8 py-6">Hotel Name</th>
              <th className="px-8 py-6">Jurisdiction</th>
              <th className="px-8 py-6">Personnel Info</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {hotels.map((h: any) => (
              <tr key={h.id} className="hover:bg-slate-50 transition-all duration-300">
                <td className="px-8 py-5">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner">
                       <Building2 size={18}/>
                     </div>
                     <span className="font-black text-slate-800 tracking-tight">{h.name}</span>
                   </div>
                </td>
                <td className="px-8 py-5 text-slate-400 font-black">{h.zone}</td>
                <td className="px-8 py-5">
                  <p className="text-slate-700">{h.receptionistName}</p>
                  <div className="flex items-center gap-1 text-[9px] text-indigo-500 font-black mt-1">
                    <Phone size={10}/> {h.phoneNumber}
                  </div>
                </td>
              </tr>
            ))}
            {hotels.length === 0 && (
              <tr>
                <td colSpan={3} className="p-20 text-center opacity-20">
                  <Building2 size={64} className="mx-auto mb-4" />
                  <p className="font-black tracking-widest uppercase">No Hotels Registered</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportSection({ t, guests, user }: any) {
  return (
    <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 text-center space-y-12 max-w-4xl mx-auto">
      <div className="flex flex-col items-center">
        <div className="p-6 bg-amber-50 rounded-3xl shadow-inner mb-6 ring-8 ring-amber-50/50">
          <FileBarChart className="text-amber-500" size={56} />
        </div>
        <h3 className={`text-3xl uppercase leading-none ${GOLDEN_GRADIENT}`}>Official Oversight Ledger</h3>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] mt-4 opacity-60 leading-relaxed max-w-sm">
          Certified Regional Law Enforcement Documentation Center
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {["EXCEL", "WORD", "PPT", "PDF"].map(f => (
          <button key={f} className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-white hover:shadow-xl hover:border-amber-300 group transition-all duration-500 active:scale-95">
            <Download className="text-slate-300 group-hover:text-amber-600 transition-colors" size={28}/>
            <span className="text-[11px] font-black uppercase text-slate-400 group-hover:text-slate-800 tracking-widest">{f}</span>
          </button>
        ))}
      </div>

      <div className="pt-12 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 text-left no-print gap-10 sm:gap-0">
        <div className="flex flex-col items-center sm:items-start">
          <p className="mb-10 text-slate-500">Judicial Auditor Certification</p>
          <div className="h-0.5 bg-slate-200 w-48 mb-2"></div>
          <p className="opacity-40">{t.supervisorName}</p>
        </div>
        <div className="flex flex-col items-center sm:items-end">
          <p className="mb-10 text-slate-500">Official Regional Seal</p>
          <div className="h-0.5 bg-slate-200 w-48 mb-2"></div>
          <p className="opacity-40">{t.signature}</p>
        </div>
      </div>
    </div>
  );
}

function NotifView({ notifications, t, setView }: any) {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {notifications.map((n: any) => (
        <div key={n.id} className={`p-8 bg-white border-l-[10px] rounded-[2rem] shadow-xl flex gap-6 animate-in slide-in-from-left-6 duration-500 transition-all hover:shadow-2xl hover:-translate-y-1 
          ${n.type === 'danger' ? 'border-red-600 bg-red-50/30' : 'border-indigo-600'}`}>
          <div className={`p-4 rounded-2xl shadow-lg border-2 border-white flex-shrink-0 self-start
            ${n.type === 'danger' ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'}`}>
            <ShieldAlert size={28}/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-1 px-3 bg-white/50 rounded-lg shadow-inner">
                {n.timestamp}
              </span>
            </div>
            <h4 className="text-xl font-black uppercase text-slate-800 tracking-tight leading-none mb-3 drop-shadow-sm">
              {n.title}
            </h4>
            <p className="text-sm text-slate-500 font-bold leading-relaxed">
              {n.message}
            </p>
            {n.guestId && (
              <button onClick={() => setView('guestList')} 
                className="mt-6 px-8 py-3 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase rounded-2xl shadow-xl shadow-red-200 transition-all active:scale-95 tracking-[2px]">
                Intercept Details
              </button>
            )}
          </div>
        </div>
      ))}
      {notifications.length === 0 && (
        <div className="text-center py-40 flex flex-col items-center select-none animate-in fade-in duration-1000">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 opacity-30 shadow-inner">
            <ShieldCheck size={48} className="text-indigo-400"/>
          </div>
          <h3 className="text-sm font-black uppercase tracking-[10px] text-slate-300">System Secure</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest opacity-40">Regional network scanning active</p>
        </div>
      )}
    </div>
  );
}
