
import React, { useState, useEffect } from 'react';
import { UserRole, Guest, WantedPerson, Notification, Language, HotelProfile } from './types';
import { translations } from './translations';
import { 
  Users, 
  UserPlus, 
  AlertTriangle, 
  FileText, 
  LogOut, 
  Bell, 
  Camera, 
  Image as ImageIcon, 
  Download, 
  Printer, 
  Share2,
  PieChart as PieChartIcon,
  Globe,
  Plus,
  Settings,
  Edit,
  Save,
  X,
  Maximize2,
  CheckCircle2,
  ShieldCheck,
  Search,
  MapPin,
  Building2,
  FileBarChart,
  Menu,
  Info,
  ChevronRight,
  ShieldAlert,
  History,
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const INITIAL_WANTED: WantedPerson[] = [
  { id: 'w1', fullName: 'Abebe Kebede', photo: 'https://picsum.photos/seed/abebe/200/200', description: 'Medium build, height 1.75m', crime: 'Robbery', postedDate: '2023-10-15' },
  { id: 'w2', fullName: 'Mulugeta Tadesse', photo: 'https://picsum.photos/seed/mulu/200/200', description: 'Scar on left cheek', crime: 'Fraud', postedDate: '2023-11-01' }
];

const CHART_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6'];

// Professional High-Quality Gold Police Badge Logo
const LOGO_PATH = 'https://img.icons8.com/color/512/police-badge.png';

// Enhanced Golden Gradient for the Title
const GOLDEN_TITLE_STYLE = "text-transparent bg-clip-text bg-gradient-to-b from-[#FFFDE7] via-[#FFD700] to-[#B8860B] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] font-black";

export default function App() {
  const [lang, setLang] = useState<Language>('am');
  const [user, setUser] = useState<{ role: UserRole; username: string } | null>(null);
  const [guests, setGuests] = useState<Guest[]>(() => JSON.parse(localStorage.getItem('guests') || '[]'));
  const [wanted, setWanted] = useState<WantedPerson[]>(() => JSON.parse(localStorage.getItem('wanted') || JSON.stringify(INITIAL_WANTED)));
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [view, setView] = useState<string>('dashboard');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [allHotels, setAllHotels] = useState<HotelProfile[]>(() => JSON.parse(localStorage.getItem('allHotels') || '[]'));
  const [hotelProfile, setHotelProfile] = useState<HotelProfile>({ name: '', address: '', receptionistName: '' });

  const t = translations[lang];

  useEffect(() => localStorage.setItem('guests', JSON.stringify(guests)), [guests]);
  useEffect(() => localStorage.setItem('wanted', JSON.stringify(wanted)), [wanted]);
  useEffect(() => localStorage.setItem('allHotels', JSON.stringify(allHotels)), [allHotels]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.username === 'reception' && loginData.password === '1234') {
      setUser({ role: UserRole.RECEPTION, username: 'reception' });
      setView('setupHotel');
    } else if (loginData.username === 'police' && loginData.password === '1234') {
      setUser({ role: UserRole.POLICE, username: 'police' });
    } else alert('Invalid credentials / የተሳሳተ መረጃ');
  };

  const handleLogout = () => { 
    setUser(null); 
    setView('dashboard'); 
    setIsSidebarOpen(false); 
    setHotelProfile({ name: '', address: '', receptionistName: '' });
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hotelProfile.name && hotelProfile.address && hotelProfile.receptionistName) {
      const exists = allHotels.some(h => h.name.toLowerCase() === hotelProfile.name.toLowerCase() && h.address.toLowerCase() === hotelProfile.address.toLowerCase());
      if (!exists) {
        setAllHotels(prev => [...prev, hotelProfile]);
      }
      setView('dashboard');
    } else {
      alert("Please fill all details / እባክዎን ሁሉንም መረጃዎች ይሙሉ");
    }
  };

  const filteredGuests = guests.filter(g => 
    g.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.hotelAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.nationality.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.roomNumber.includes(searchTerm)
  );

  const [newGuest, setNewGuest] = useState({ fullName: '', nationality: '', roomNumber: '', idPhoto: '' });
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);

  const saveGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuest.idPhoto) return alert(t.idPhoto + " required");

    const isWanted = wanted.some(w => w.fullName.toLowerCase().trim() === newGuest.fullName.toLowerCase().trim());
    
    if (editingGuestId) {
      setGuests(guests.map(g => g.id === editingGuestId ? { ...g, ...newGuest, isWanted } : g));
      setEditingGuestId(null);
    } else {
      const guest: Guest = {
        ...newGuest,
        id: Math.random().toString(36).substr(2, 9),
        hotelName: hotelProfile.name,
        hotelAddress: hotelProfile.address,
        receptionistName: hotelProfile.receptionistName,
        checkInDate: new Date().toISOString().split('T')[0],
        isWanted
      };
      setGuests([guest, ...guests]);
      if (isWanted) {
        const notif: Notification = {
          id: Date.now().toString(),
          title: t.alertWantedFound,
          message: `${newGuest.fullName} checked into ${hotelProfile.name}, Room ${newGuest.roomNumber}`,
          type: 'danger',
          timestamp: new Date().toLocaleTimeString(),
          guestId: guest.id
        };
        setNotifications([notif, ...notifications]);
      }
    }
    setNewGuest({ fullName: '', nationality: '', roomNumber: '', idPhoto: '' });
    setView('guestList');
  };

  const startEdit = (guest: Guest) => {
    setNewGuest({ fullName: guest.fullName, nationality: guest.nationality, roomNumber: guest.roomNumber, idPhoto: guest.idPhoto });
    setEditingGuestId(guest.id);
    setView('registerGuest');
  };

  const [newWanted, setNewWanted] = useState({ fullName: '', description: '', crime: '', photo: '' });
  const addWanted = (e: React.FormEvent) => {
    e.preventDefault();
    setWanted([{ ...newWanted, id: Math.random().toString(36).substr(2, 9), postedDate: new Date().toISOString().split('T')[0] }, ...wanted]);
    setNewWanted({ fullName: '', description: '', crime: '', photo: '' });
    setView('wantedPersons');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'guest' | 'wanted') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'guest') setNewGuest(prev => ({ ...prev, idPhoto: reader.result as string }));
        else setNewWanted(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-3xl rounded-[4rem] shadow-2xl p-12 w-full max-w-md border border-white/10 text-center relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-600/20 blur-3xl rounded-full"></div>
          <div className="mb-10 relative inline-block">
            <img src={LOGO_PATH} alt="Police Badge" className="w-48 h-48 mx-auto relative drop-shadow-[0_10px_20px_rgba(255,215,0,0.4)] transition-transform hover:scale-105 duration-500" />
          </div>
          <h1 className={`text-6xl mb-4 leading-tight ${GOLDEN_TITLE_STYLE}`}>{t.appName}</h1>
          <p className="text-indigo-300 font-bold text-sm mb-6 leading-tight uppercase tracking-[3px] font-black">{t.developedBy}</p>
          <div className="h-1 w-20 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mb-6"></div>
          <p className="text-gray-400 italic text-[10px] mb-12 opacity-80 font-black tracking-widest uppercase">"{t.motto}"</p>
          <form onSubmit={handleLogin} className="space-y-6 text-left">
            <input type="text" placeholder={t.username} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:ring-4 focus:ring-indigo-500/30 font-bold text-lg" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} required />
            <input type="password" placeholder={t.password} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:ring-4 focus:ring-indigo-500/30 font-bold text-lg" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required />
            <button className="w-full bg-gradient-to-r from-[#B8860B] via-[#FFD700] to-[#B8860B] text-indigo-950 font-black py-5 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95 text-xl tracking-widest uppercase mt-6 shadow-xl">
              {t.login}
            </button>
          </form>
          <div className="mt-12 flex justify-center gap-8">
            <button onClick={() => setLang('am')} className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${lang === 'am' ? 'bg-white text-indigo-950 shadow-2xl scale-110' : 'text-gray-500 hover:text-gray-300'}`}>አማርኛ</button>
            <button onClick={() => setLang('en')} className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${lang === 'en' ? 'bg-white text-indigo-950 shadow-2xl scale-110' : 'text-gray-500 hover:text-gray-300'}`}>English</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-md transition-opacity duration-500" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <aside className={`fixed md:relative z-50 w-80 h-full bg-[#020617] text-white flex flex-col transition-transform duration-500 no-print shadow-[20px_0_50px_rgba(0,0,0,0.3)] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-10 border-b border-white/5 text-center bg-indigo-950/20">
          <img src={LOGO_PATH} className="w-28 h-28 mx-auto mb-8 drop-shadow-[0_10px_20px_rgba(255,215,0,0.3)]" alt="Sidebar Logo" />
          <h1 className={`text-3xl leading-tight mb-2 ${GOLDEN_TITLE_STYLE}`}>{t.appName}</h1>
          <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[4px] leading-tight opacity-70">{t.developedBy}</p>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          <NavItem icon={<PieChartIcon size={24} />} label={t.dashboard} active={view === 'dashboard'} onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} />
          {user.role === UserRole.RECEPTION && (
            <>
              <NavItem icon={<UserPlus size={24} />} label={t.registerGuest} active={view === 'registerGuest'} onClick={() => { setView('registerGuest'); setIsSidebarOpen(false); }} />
              <NavItem icon={<Users size={24} />} label={t.guestList} active={view === 'guestList'} onClick={() => { setView('guestList'); setIsSidebarOpen(false); }} />
              <NavItem icon={<Settings size={24} />} label={t.settings} active={view === 'settings'} onClick={() => { setView('settings'); setIsSidebarOpen(false); }} />
            </>
          )}
          {user.role === UserRole.POLICE && (
            <>
               <NavItem icon={<Plus size={24} />} label={t.policeNotice} active={view === 'addWanted'} onClick={() => { setView('addWanted'); setIsSidebarOpen(false); }} />
               <NavItem icon={<Users size={24} />} label={t.guestList} active={view === 'guestList'} onClick={() => { setView('guestList'); setIsSidebarOpen(false); }} />
               <NavItem icon={<Building2 size={24} />} label={t.hotelDirectory} active={view === 'hotelDirectory'} onClick={() => { setView('hotelDirectory'); setIsSidebarOpen(false); }} />
               <NavItem icon={<Settings size={24} />} label={t.policeSettings} active={view === 'policeSettings'} onClick={() => { setView('policeSettings'); setIsSidebarOpen(false); }} />
            </>
          )}
          <NavItem icon={<AlertTriangle size={24} />} label={t.wantedPersons} active={view === 'wantedPersons'} onClick={() => { setView('wantedPersons'); setIsSidebarOpen(false); }} />
          <NavItem icon={<FileText size={24} />} label={t.reports} active={view === 'reports'} onClick={() => { setView('reports'); setIsSidebarOpen(false); }} />
          <NavItem icon={<Info size={24} />} label={t.appUtility} active={view === 'utility'} onClick={() => { setView('utility'); setIsSidebarOpen(false); }} />
          <NavItem icon={<Bell size={24} />} label={t.notifications} active={view === 'notifications'} count={notifications.length} onClick={() => { setView('notifications'); setIsSidebarOpen(false); }} />
        </nav>
        <div className="p-8 border-t border-white/5 space-y-4">
           <button onClick={handleLogout} className="flex items-center justify-center gap-4 w-full py-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-[1.5rem] transition-all font-black text-xs uppercase shadow-xl">
            <LogOut size={22} /> {t.logout}
          </button>
        </div>
      </aside>

      <div className="flex-1 h-screen overflow-y-auto relative bg-[#f1f5f9]">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-2xl border-b border-slate-200 px-10 py-6 flex justify-between items-center no-print shadow-sm">
          <div className="flex items-center gap-8">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem] hover:bg-indigo-100 transition-all shadow-md"><Menu size={28} /></button>
            <h2 className={`text-3xl leading-none hidden sm:block ${GOLDEN_TITLE_STYLE}`}>
              {view === 'dashboard' ? t.dashboard : view === 'registerGuest' ? t.registerGuest : view === 'guestList' ? t.guestList : view === 'settings' ? t.settings : view === 'wantedPersons' ? t.wantedPersons : view === 'reports' ? t.reports : t.notifications}
            </h2>
          </div>
          <div className="flex items-center gap-8">
            <button onClick={() => setLang(lang === 'am' ? 'en' : 'am')} className="p-4 border-2 border-slate-50 bg-white rounded-[1.5rem] hover:bg-indigo-50 transition-all shadow-md group active:scale-95">
              <Globe size={26} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </button>
            <div className="flex items-center gap-5 px-6 py-3 bg-white rounded-[1.8rem] border border-slate-100 shadow-md">
               <div className="text-right hidden sm:block">
                  <p className="text-base font-black text-slate-800 uppercase leading-none tracking-tighter">{user.username}</p>
                  <p className="text-[11px] text-indigo-500 font-black uppercase mt-2 tracking-[4px] opacity-60">{user.role}</p>
               </div>
               <div className="w-14 h-14 bg-gradient-to-br from-[#B8860B] to-[#FFD700] rounded-[1.2rem] flex items-center justify-center text-indigo-950 font-black uppercase shadow-xl border-4 border-white text-2xl">
                {user.username[0]}
               </div>
            </div>
          </div>
        </header>

        <main className="p-8 md:p-12 max-w-7xl mx-auto animate-in fade-in duration-700">
          {zoomImg && (
            <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-8 transition-opacity duration-500" onClick={() => setZoomImg(null)}>
               <button className="absolute top-12 right-12 text-white bg-white/10 p-6 rounded-full hover:bg-white/30 transition-all border-2 border-white/20 shadow-2xl"><X size={48} /></button>
               <img src={zoomImg} alt="Zoomed View" className="max-w-full max-h-[80vh] rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] border-[6px] border-white/10 object-contain transition-transform duration-500 scale-100 hover:scale-[1.02]" />
               <p className={`text-4xl mt-16 tracking-[10px] ${GOLDEN_TITLE_STYLE}`}>{t.zoomImage}</p>
            </div>
          )}

          {view === 'dashboard' && <DashboardView user={user} t={t} guests={guests} wanted={wanted} notifications={notifications} setView={setView} setZoomImg={setZoomImg} />}
          {view === 'guestList' && <GuestListView guests={filteredGuests} t={t} setZoomImg={setZoomImg} startEdit={startEdit} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />}
          {view === 'registerGuest' && <GuestFormView newGuest={newGuest} setNewGuest={setNewGuest} hotelProfile={hotelProfile} saveGuest={saveGuest} t={t} setZoomImg={setZoomImg} handleFileUpload={handleFileUpload} editingGuestId={editingGuestId} setEditingGuestId={setEditingGuestId} setView={setView} />}
          {view === 'wantedPersons' && <WantedPersonsView wanted={wanted} t={t} setZoomImg={setZoomImg} />}
          {view === 'addWanted' && <AddWantedView newWanted={newWanted} setNewWanted={setNewWanted} addWanted={addWanted} t={t} handleFileUpload={handleFileUpload} setZoomImg={setZoomImg} />}
          {view === 'reports' && <ReportView t={t} guests={guests} userRole={user.role} />}
          {view === 'notifications' && <NotificationsView notifications={notifications} setView={setView} t={t} />}
        </main>
      </div>
    </div>
  );
}

// --- Components ---

function NavItem({ icon, label, active, onClick, count }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, count?: number }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-6 px-8 py-5 rounded-[1.8rem] transition-all duration-500 group relative ${active ? 'bg-white text-indigo-950 shadow-2xl scale-[1.05]' : 'text-indigo-200/50 hover:bg-white/5 hover:text-white'}`}>
      <span className={`${active ? 'text-indigo-600' : 'opacity-40 group-hover:scale-125 transition-transform duration-500'}`}>{icon}</span>
      <span className="font-black text-[13px] tracking-[3px] uppercase flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="px-4 py-1.5 bg-red-600 text-white text-[11px] font-black rounded-full animate-pulse shadow-2xl">{count}</span>
      )}
    </button>
  );
}

function FormInput({ label, value, onChange, type = "text", required, disabled, icon }: { label: string, value: string, onChange?: (v: string) => void, type?: string, required?: boolean, disabled?: boolean, icon: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <label className="text-[12px] font-black text-slate-400 uppercase tracking-[6px] ml-2">{label}</label>
      <div className="relative group">
        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-indigo-600 duration-500">{icon}</div>
        <input type={type} className={`w-full bg-slate-50 border-[3px] border-slate-100 rounded-[2rem] pl-20 pr-10 py-6 outline-none transition-all font-bold text-slate-800 text-xl focus:border-indigo-400 focus:bg-white ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`} value={value} onChange={e => onChange?.(e.target.value)} required={required} disabled={disabled} />
      </div>
    </div>
  );
}

function DashboardView({ user, t, guests, wanted, notifications, setView, setZoomImg }: any) {
  const stats = [
    { label: t.guestList, value: guests.length, icon: <Users size={28}/>, color: 'bg-indigo-600', trend: '+12%' },
    { label: t.wantedPersons, value: wanted.length, icon: <AlertTriangle size={28}/>, color: 'bg-red-600', trend: '-2%' },
    { label: t.notifications, value: notifications.length, icon: <Bell size={28}/>, color: 'bg-amber-500', trend: 'Critical' },
    { label: t.reports, value: 'Active', icon: <FileBarChart size={28}/>, color: 'bg-emerald-600', trend: 'Live' },
  ];

  const pieData = [
    { name: 'Clear', value: guests.filter(g => !g.isWanted).length },
    { name: 'Wanted Matches', value: guests.filter(g => g.isWanted).length },
  ];

  const lastGuests = guests.slice(0, 5);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Top Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className={`text-4xl uppercase tracking-widest ${GOLDEN_TITLE_STYLE}`}>System Overview</h3>
          <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-[4px]">Regional Monitoring Command Terminal</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setView('registerGuest')} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[3px] shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3">
            <Plus size={18} /> {t.registerGuest}
          </button>
          <button onClick={() => window.print()} className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-[3px] shadow-sm hover:bg-slate-50 transition-all flex items-center gap-3">
            <Printer size={18} /> {t.print}
          </button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
         {stats.map((s, i) => (
           <div key={i} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer relative overflow-hidden" onClick={() => {
              if (s.label === t.guestList) setView('guestList');
              if (s.label === t.wantedPersons) setView('wantedPersons');
              if (s.label === t.notifications) setView('notifications');
           }}>
             <div className={`${s.color} absolute top-0 right-0 w-2 h-full opacity-60 group-hover:w-4 transition-all duration-500`}></div>
             <div className={`${s.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl mb-8 group-hover:scale-110 transition-transform`}>{s.icon}</div>
             <div className="flex justify-between items-end">
                <div>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[4px] mb-1 opacity-60">{s.label}</p>
                   <p className="text-5xl font-black text-slate-800 tracking-tighter leading-none">{s.value}</p>
                </div>
                <div className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${s.trend === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {s.trend}
                </div>
             </div>
           </div>
         ))}
      </div>

      {/* Analytics & Detailed View */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Main Activity Chart */}
        <div className="xl:col-span-2 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-10">
              <h4 className="text-xl font-black uppercase tracking-[5px] flex items-center gap-4">
                 <TrendingUp className="text-indigo-600" /> Registration Volume
              </h4>
              <div className="flex gap-2">
                 <span className="w-3 h-3 bg-indigo-600 rounded-full"></span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Past 7 Days</span>
              </div>
           </div>
           <div className="h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[ {n: 'Mon', v: 12}, {n: 'Tue', v: 19}, {n: 'Wed', v: 15}, {n: 'Thu', v: 22}, {n: 'Fri', v: 30}, {n: 'Sat', v: 28}, {n: 'Sun', v: 14} ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 900, fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 900, fill: '#64748b'}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '20px', fontWeight: 'bold'}} />
                  <Bar dataKey="v" fill="#6366f1" radius={[10, 10, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
           <h4 className="text-xl font-black uppercase tracking-[5px] mb-10 flex items-center gap-4">
              <Activity className="text-indigo-600" /> Security Ratios
           </h4>
           <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                   <Pie data={pieData} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                   </Pie>
                   <Tooltip />
                   <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="mt-8 space-y-4">
              <div className="p-5 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                 <span className="text-xs font-black uppercase text-slate-500">Matches Found</span>
                 <span className="text-lg font-black text-red-600">{pieData[1].value}</span>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                 <span className="text-xs font-black uppercase text-slate-500">Clear Records</span>
                 <span className="text-lg font-black text-emerald-600">{pieData[0].value}</span>
              </div>
           </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
         <div className="p-10 border-b flex justify-between items-center bg-slate-50/30">
            <h4 className="text-xl font-black uppercase tracking-[5px] flex items-center gap-4">
               <History className="text-indigo-600" /> Recent Ingress Activity
            </h4>
            <button onClick={() => setView('guestList')} className="text-[10px] font-black uppercase text-indigo-600 hover:underline tracking-widest flex items-center gap-2">
               View All Records <ChevronRight size={14} />
            </button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400">
                  <tr>
                     <th className="px-10 py-6">Target Profile</th>
                     <th className="px-10 py-6">Assigned Hotel</th>
                     <th className="px-10 py-6">Location/Room</th>
                     <th className="px-10 py-6 text-center">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {lastGuests.map((g: Guest) => (
                    <tr key={g.id} className="hover:bg-indigo-50/20 transition-colors group">
                       <td className="px-10 py-5 flex items-center gap-5">
                          <img src={g.idPhoto} className="w-12 h-14 rounded-xl object-cover shadow-md cursor-zoom-in group-hover:scale-110 transition-transform" onClick={() => setZoomImg(g.idPhoto)} />
                          <div>
                             <p className="font-black text-slate-800 uppercase text-sm leading-none mb-1.5">{g.fullName}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{g.nationality}</p>
                          </div>
                       </td>
                       <td className="px-10 py-5">
                          <p className="text-xs font-black text-slate-600 uppercase tracking-tight">{g.hotelName}</p>
                       </td>
                       <td className="px-10 py-5">
                          <p className="text-xs font-black text-slate-600 uppercase tracking-tight">Room {g.roomNumber}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{g.checkInDate}</p>
                       </td>
                       <td className="px-10 py-5 text-center">
                          {g.isWanted ? (
                            <span className="px-3 py-1 bg-red-600 text-white text-[9px] font-black rounded-full uppercase shadow-lg">Wanted</span>
                          ) : (
                            <span className="px-3 py-1 bg-emerald-500 text-white text-[9px] font-black rounded-full uppercase shadow-md">Clear</span>
                          )}
                       </td>
                    </tr>
                  ))}
                  {lastGuests.length === 0 && (
                    <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-black uppercase tracking-widest opacity-40">No Recent Activity Recorded</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}

function GuestListView({ guests, t, setZoomImg, startEdit, searchTerm, setSearchTerm }: any) {
  return (
    <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100">
       <div className="p-10 md:p-14 border-b flex flex-col md:flex-row gap-8 justify-between items-center bg-slate-50/50">
          <div>
            <h3 className={`text-4xl uppercase tracking-widest leading-none ${GOLDEN_TITLE_STYLE}`}>{t.guestList}</h3>
            <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[5px] mt-3 opacity-60">Digital Surveillance Ledger</p>
          </div>
          <div className="relative w-full md:w-[500px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
            <input type="text" placeholder={t.searchPlaceholder} className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-[1.8rem] outline-none focus:border-indigo-400 font-bold text-lg shadow-sm transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
       </div>
       <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 border-b">
               <tr>
                 <th className="px-12 py-10 tracking-[4px]">{t.idPhoto}</th>
                 <th className="px-12 py-10 tracking-[4px]">{t.fullName}</th>
                 <th className="px-12 py-10 tracking-[4px]">{t.hotel}</th>
                 <th className="px-12 py-10 tracking-[4px]">Status</th>
                 <th className="px-12 py-10 tracking-[4px] no-print text-center">{t.edit}</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {guests.map((g: Guest) => (
                 <tr key={g.id} className="hover:bg-indigo-50/30 transition-all group">
                    <td className="px-12 py-7">
                      <div className="w-20 h-24 rounded-[1.8rem] overflow-hidden shadow-2xl border-4 border-white ring-2 ring-slate-100 transform group-hover:scale-110 transition-all cursor-zoom-in" onClick={() => setZoomImg(g.idPhoto)}>
                        <img src={g.idPhoto} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-12 py-7">
                      <p className="font-black text-slate-800 uppercase text-2xl tracking-tighter leading-none">{g.fullName}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <Globe size={16} className="text-indigo-400" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{g.nationality} • ROOM {g.roomNumber}</p>
                      </div>
                    </td>
                    <td className="px-12 py-7">
                       <p className="text-base font-black text-slate-600 uppercase tracking-tighter">{g.hotelName}</p>
                       <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{g.hotelAddress}</p>
                    </td>
                    <td className="px-12 py-7">
                       {g.isWanted ? (
                         <span className="px-6 py-3 bg-red-600 text-white text-[11px] font-black rounded-full uppercase flex items-center gap-3 w-fit animate-pulse shadow-2xl">
                            <AlertTriangle size={18}/> Wanted / ተፈላጊ
                         </span>
                       ) : (
                         <span className="px-6 py-3 bg-emerald-500 text-white text-[11px] font-black rounded-full uppercase flex items-center gap-3 w-fit shadow-xl">
                            <CheckCircle2 size={18}/> Clear / ንፁህ
                         </span>
                       )}
                    </td>
                    <td className="px-12 py-7 no-print text-center">
                       <button onClick={() => startEdit(g)} className="p-5 bg-white border border-slate-100 text-indigo-600 rounded-[1.8rem] hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><Edit size={24}/></button>
                    </td>
                 </tr>
               ))}
             </tbody>
          </table>
       </div>
    </div>
  );
}

function GuestFormView({ newGuest, setNewGuest, hotelProfile, saveGuest, t, setZoomImg, handleFileUpload, editingGuestId, setEditingGuestId, setView }: any) {
  return (
    <div className="max-w-4xl mx-auto bg-white p-16 rounded-[4.5rem] shadow-2xl border border-slate-100">
       <div className="flex justify-between items-start mb-16">
          <div>
             <h3 className={`text-4xl leading-none mb-4 ${GOLDEN_TITLE_STYLE}`}>{editingGuestId ? t.edit : t.registerGuest}</h3>
             <p className="text-slate-400 font-bold text-xs uppercase tracking-[5px] opacity-60">Regional Compliance Monitoring Division</p>
          </div>
          {editingGuestId && <button onClick={() => { setEditingGuestId(null); setView('guestList'); }} className="p-4 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-2xl transition-all"><X size={32}/></button>}
       </div>
       <form onSubmit={saveGuest} className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <FormInput label={t.fullName} value={newGuest.fullName} onChange={(v: string) => setNewGuest({...newGuest, fullName: v})} required icon={<Users size={26}/>} />
             <FormInput label={t.nationality} value={newGuest.nationality} onChange={(v: string) => setNewGuest({...newGuest, nationality: v})} required icon={<Globe size={26}/>} />
             <FormInput label={t.roomNumber} value={newGuest.roomNumber} onChange={(v: string) => setNewGuest({...newGuest, roomNumber: v})} required icon={<Building2 size={26}/>} />
             <FormInput label={t.hotel} value={hotelProfile.name} disabled icon={<Building2 size={26}/>} />
          </div>
          <div className="space-y-8">
             <label className="text-[12px] font-black text-slate-400 uppercase tracking-[6px] ml-1">{t.idPhoto}</label>
             <div className="flex flex-col sm:flex-row items-center gap-12 bg-slate-50/50 p-12 rounded-[4rem] border-4 border-dashed border-slate-100 hover:border-indigo-200 transition-all group">
                <div className="w-40 h-56 bg-white rounded-[2.5rem] border-[6px] border-white shadow-2xl overflow-hidden flex items-center justify-center cursor-zoom-in" onClick={() => newGuest.idPhoto && setZoomImg(newGuest.idPhoto)}>
                  {newGuest.idPhoto ? <img src={newGuest.idPhoto} className="w-full h-full object-cover" /> : <Camera size={64} className="text-slate-100" />}
                </div>
                <div className="flex-1 w-full space-y-6">
                   <label className="block w-full text-center py-7 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase cursor-pointer hover:bg-indigo-700 shadow-2xl transition-all"><Camera className="inline mr-3" size={24}/> {t.capturePhoto} <input type="file" capture="environment" className="hidden" onChange={e => handleFileUpload(e, 'guest')} /></label>
                   <label className="block w-full text-center py-7 bg-white border-2 border-slate-200 text-slate-600 rounded-[2rem] font-black text-xs uppercase cursor-pointer hover:bg-slate-50 transition-all shadow-sm"><ImageIcon className="inline mr-3" size={24}/> {t.fromGallery} <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'guest')} /></label>
                </div>
             </div>
          </div>
          <button className="w-full bg-gradient-to-r from-indigo-700 to-indigo-500 text-white font-black py-8 rounded-[2.5rem] shadow-2xl shadow-indigo-100 uppercase tracking-[8px] text-2xl transition-all active:scale-[0.98] mt-10">{editingGuestId ? t.save : t.submit}</button>
       </form>
    </div>
  );
}

function WantedPersonsView({ wanted, t, setZoomImg }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 animate-in fade-in duration-1000">
       {wanted.map((w: WantedPerson) => (
         <div key={w.id} className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border-2 border-red-50 hover:border-red-600 transition-all duration-700 group relative transform hover:-translate-y-4">
            <div className="h-80 relative overflow-hidden">
              <img src={w.photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80"></div>
              <div className="absolute top-8 left-8 bg-red-600 text-white px-6 py-2.5 rounded-[1.2rem] text-[11px] font-black uppercase shadow-2xl border-2 border-white/20 tracking-[4px]">Wanted / ተፈላጊ</div>
              <button onClick={() => setZoomImg(w.photo)} className="absolute bottom-8 right-8 p-5 bg-white/10 backdrop-blur-xl rounded-2xl text-white hover:bg-white/30 transition-all border border-white/20 shadow-2xl"><Maximize2 size={32}/></button>
            </div>
            <div className="p-12 space-y-5">
              <h4 className="text-4xl font-black uppercase text-slate-800 tracking-tighter leading-none">{w.fullName}</h4>
              <p className="text-[12px] text-red-600 font-black uppercase tracking-[4px] inline-block px-4 py-2 bg-red-50 rounded-xl">CRIME: {w.crime}</p>
              <p className="text-lg text-slate-500 italic font-bold leading-relaxed border-l-[6px] border-red-600 pl-6 py-3 bg-red-50/30 rounded-r-[2rem] line-clamp-2">"{w.description}"</p>
              <div className="mt-10 pt-10 border-t border-slate-100 flex justify-between items-center">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] leading-none mb-3 opacity-60">Registry Date</span>
                    <span className="text-base font-black text-slate-700 tracking-tighter">{w.postedDate}</span>
                 </div>
                 <button onClick={() => setZoomImg(w.photo)} className="px-10 py-5 bg-[#0f172a] text-white rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl active:scale-95 border-2 border-white/10">Full Profile</button>
              </div>
            </div>
         </div>
       ))}
    </div>
  );
}

function AddWantedView({ newWanted, setNewWanted, addWanted, t, handleFileUpload, setZoomImg }: any) {
  return (
    <div className="max-w-2xl mx-auto bg-white p-16 rounded-[4rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
       <div className="text-center mb-12">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner ring-8 ring-red-50"><AlertTriangle size={48} /></div>
          <h3 className="text-3xl font-black uppercase tracking-widest text-red-600 mb-2">{t.policeNotice}</h3>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[5px] opacity-60">Digital Criminal Registry Hub</p>
       </div>
       <form onSubmit={addWanted} className="space-y-10">
          <FormInput label={t.fullName} value={newWanted.fullName} onChange={(v: string) => setNewWanted({...newWanted, fullName: v})} required icon={<Users size={26}/>} />
          <FormInput label={t.crime} value={newWanted.crime} onChange={(v: string) => setNewWanted({...newWanted, crime: v})} required icon={<AlertTriangle size={26}/>} />
          <FormInput label={t.description} value={newWanted.description} onChange={(v: string) => setNewWanted({...newWanted, description: v})} icon={<FileText size={26}/>} />
          <div className="space-y-8">
             <label className="text-[12px] font-black text-slate-400 uppercase tracking-[6px] ml-1">{t.idPhoto}</label>
             <div className="flex items-center gap-12 bg-red-50/30 p-10 rounded-[3.5rem] border-4 border-dashed border-red-100 group transition-all">
                <div className="w-32 h-32 bg-white rounded-[2rem] border-[6px] border-white shadow-2xl overflow-hidden flex items-center justify-center cursor-zoom-in group-hover:scale-105 transition-all" onClick={() => newWanted.photo && setZoomImg(newWanted.photo)}>
                  {newWanted.photo ? <img src={newWanted.photo} className="w-full h-full object-cover" /> : <ImageIcon size={56} className="text-red-100" />}
                </div>
                <label className="flex-1 block w-full text-center py-7 bg-white border-2 border-red-100 text-red-600 rounded-[2rem] font-black text-sm uppercase cursor-pointer hover:bg-red-50 transition-all shadow-sm tracking-[3px]">Upload Profile Image <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'wanted')} /></label>
             </div>
          </div>
          <button className="w-full bg-gradient-to-r from-red-700 to-red-500 text-white font-black py-8 rounded-[2.5rem] shadow-2xl shadow-red-100 uppercase tracking-[8px] text-2xl transition-all transform active:scale-95 mt-8">Publish Bulletin</button>
       </form>
    </div>
  );
}

function ReportView({ t, guests, userRole }: { t: any, guests: Guest[], userRole: UserRole }) {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
       <div className="bg-white p-16 md:p-24 rounded-[5rem] shadow-2xl border-4 border-slate-50 text-center space-y-16">
          <div className="flex flex-col items-center">
             <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-inner ring-8 ring-indigo-50/50"><FileBarChart size={56} /></div>
             <h3 className={`text-4xl uppercase tracking-[8px] text-slate-800 leading-none ${GOLDEN_TITLE_STYLE}`}>{userRole === UserRole.POLICE ? "Regional Command Oversight" : "Property Activity Audit"}</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
             <ReportButton icon={<Download size={36}/>} label="Excel (.xlsx)" color="bg-emerald-700" />
             <ReportButton icon={<FileText size={36}/>} label="Word (.docx)" color="bg-blue-800" />
             <ReportButton icon={<PieChartIcon size={36}/>} label="PPT (.pptx)" color="bg-orange-700" />
             <ReportButton icon={<Printer size={36}/>} label="Official Report" color="bg-slate-900" />
          </div>
       </div>
    </div>
  );
}

function ReportButton({ icon, label, color }: any) {
  return (
    <button className={`${color} text-white p-12 rounded-[3.5rem] flex flex-col items-center gap-8 hover:scale-[1.1] active:scale-95 transition-all duration-500 shadow-2xl relative group overflow-hidden`}>
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="bg-white/10 p-6 rounded-[1.8rem] backdrop-blur-md group-hover:rotate-12 transition-transform duration-500">{icon}</div>
      <span className="text-[11px] font-black uppercase tracking-[4px] font-black text-center leading-tight">{label}</span>
    </button>
  );
}

function NotificationsView({ notifications, setView, t }: any) {
  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-12 duration-700">
       <div className="flex items-center gap-6 mb-8 px-6">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.8rem] flex items-center justify-center shadow-inner ring-4 ring-indigo-50"><Bell size={40} /></div>
          <h3 className={`text-4xl uppercase tracking-[6px] ${GOLDEN_TITLE_STYLE}`}>Critical Alerts</h3>
       </div>
       {notifications.map((n: any) => (
         <div key={n.id} className="p-12 bg-white rounded-[4rem] border-l-[20px] border-red-600 shadow-2xl flex gap-12 group hover:-translate-x-4 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-red-600/5 rounded-bl-[10rem] -z-0"></div>
            <div className="w-24 h-24 bg-red-600 text-white rounded-[2rem] flex items-center justify-center shrink-0 shadow-2xl shadow-red-200 border-4 border-white relative z-10"><AlertTriangle size={48}/></div>
            <div className="flex-1 relative z-10">
              <div className="flex justify-between items-start mb-4">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[5px] font-black leading-none">{n.timestamp}</p>
              </div>
              <h4 className="text-3xl font-black text-red-950 uppercase leading-tight mt-2 group-hover:underline transition-all font-black">{n.title}</h4>
              <p className="text-xl text-slate-600 font-bold mt-6 leading-relaxed opacity-80">{n.message}</p>
              <div className="mt-10 flex gap-6">
                 <button onClick={() => setView('guestList')} className="px-10 py-4 bg-red-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-red-200 hover:bg-red-700 transition-all transform active:scale-95">Intercept Subject</button>
              </div>
            </div>
         </div>
       ))}
       {notifications.length === 0 && (
         <div className="text-center py-40 bg-white rounded-[5rem] border-4 border-dashed border-slate-100 flex flex-col items-center group">
            <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-12 shadow-inner group-hover:scale-110 transition-transform duration-700">
               <CheckCircle2 size={72} className="text-slate-200" />
            </div>
            <p className="text-4xl font-black uppercase tracking-[25px] text-slate-200 leading-none">All Secure</p>
         </div>
       )}
    </div>
  );
}
