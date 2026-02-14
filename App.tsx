
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
  Activity,
  Phone,
  Fingerprint,
  Send
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

const CHART_COLORS = ['#4f46e5', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

const LOGO_PATH = 'https://img.icons8.com/color/512/police-badge.png';

// Elegant Golden Title - Professional sizing
const GOLDEN_TITLE_STYLE = "text-transparent bg-clip-text bg-gradient-to-b from-[#D4AF37] via-[#FFD700] to-[#996515] font-bold drop-shadow-sm";

export default function App() {
  const [lang, setLang] = useState<Language>('am');
  const [user, setUser] = useState<{ role: UserRole; username: string } | null>(null);
  const [guests, setGuests] = useState<Guest[]>(() => JSON.parse(localStorage.getItem('guests') || '[]'));
  const [wanted, setWanted] = useState<WantedPerson[]>(() => JSON.parse(localStorage.getItem('wanted') || JSON.stringify(INITIAL_WANTED)));
  const [notifications, setNotifications] = useState<Notification[]>(() => JSON.parse(localStorage.getItem('notifications') || '[]'));
  const [view, setView] = useState<string>('dashboard');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [allHotels, setAllHotels] = useState<HotelProfile[]>(() => JSON.parse(localStorage.getItem('allHotels') || '[]'));
  const [hotelProfile, setHotelProfile] = useState<HotelProfile>({ name: '', address: '', receptionistName: '', phoneNumber: '', digitalIdPhoto: '' });

  const t = translations[lang];

  useEffect(() => localStorage.setItem('guests', JSON.stringify(guests)), [guests]);
  useEffect(() => localStorage.setItem('wanted', JSON.stringify(wanted)), [wanted]);
  useEffect(() => localStorage.setItem('notifications', JSON.stringify(notifications)), [notifications]);
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
    setHotelProfile({ name: '', address: '', receptionistName: '', phoneNumber: '', digitalIdPhoto: '' });
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hotelProfile.name && hotelProfile.address && hotelProfile.receptionistName && hotelProfile.phoneNumber) {
      const exists = allHotels.some(h => h.name.toLowerCase() === hotelProfile.name.toLowerCase() && h.address.toLowerCase() === hotelProfile.address.toLowerCase());
      if (!exists) setAllHotels(prev => [...prev, hotelProfile]);
      setView('dashboard');
    } else alert("Please fill all details / እባክዎን ሁሉንም መረጃዎች ይሙሉ");
  };

  const filteredGuests = guests.filter(g => 
    g.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.nationality.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [newGuest, setNewGuest] = useState({ fullName: '', nationality: '', roomNumber: '', idPhoto: '' });
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);

  const saveGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuest.idPhoto) return alert(t.idPhoto + " required");

    const match = wanted.find(w => w.fullName.toLowerCase().trim() === newGuest.fullName.toLowerCase().trim());
    const isWanted = !!match;
    
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
        receptionistPhone: hotelProfile.phoneNumber,
        checkInDate: new Date().toISOString().split('T')[0],
        isWanted
      };
      setGuests([guest, ...guests]);
      
      if (isWanted) {
        const notif: Notification = {
          id: Date.now().toString(),
          title: t.alertWantedFound,
          message: `${guest.fullName} registered at ${guest.hotelName}, Room ${guest.roomNumber}. Nationality: ${guest.nationality}.`,
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
    const wantedObj: WantedPerson = { ...newWanted, id: Math.random().toString(36).substr(2, 9), postedDate: new Date().toISOString().split('T')[0] };
    setWanted([wantedObj, ...wanted]);
    
    // Notify all receptions about new wanted person
    const notif: Notification = {
      id: Date.now().toString(),
      title: "New Wanted Alert",
      message: `Police have added ${wantedObj.fullName} to the wanted list. Please monitor all registrations.`,
      type: 'info',
      timestamp: new Date().toLocaleTimeString()
    };
    setNotifications([notif, ...notifications]);
    
    setNewWanted({ fullName: '', description: '', crime: '', photo: '' });
    setView('wantedPersons');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'guest' | 'wanted' | 'digitalId') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (target === 'guest') setNewGuest(prev => ({ ...prev, idPhoto: result }));
        else if (target === 'wanted') setNewWanted(prev => ({ ...prev, photo: result }));
        else if (target === 'digitalId') setHotelProfile(prev => ({ ...prev, digitalIdPhoto: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
          <img src={LOGO_PATH} alt="Police Badge" className="w-32 h-32 mx-auto mb-6 drop-shadow-md" />
          <h1 className={`text-3xl mb-1 uppercase ${GOLDEN_TITLE_STYLE}`}>{t.appName}</h1>
          <p className="text-gray-500 font-bold text-[10px] mb-8 uppercase tracking-widest">{t.developedBy}</p>
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t.username}</label>
              <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} required />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t.password}</label>
              <input type="password" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required />
            </div>
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg uppercase text-sm mt-4">
              {t.login}
            </button>
          </form>
          <div className="mt-8 flex justify-center gap-4">
            <button onClick={() => setLang('am')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${lang === 'am' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>አማርኛ</button>
            <button onClick={() => setLang('en')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${lang === 'en' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>EN</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      <aside className={`fixed md:relative z-50 w-64 h-full bg-[#1e293b] text-white flex flex-col transition-transform duration-300 no-print ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 border-b border-white/10 text-center">
          <img src={LOGO_PATH} className="w-16 h-16 mx-auto mb-4" alt="Sidebar Logo" />
          <h1 className={`text-xl leading-none mb-1 ${GOLDEN_TITLE_STYLE}`}>{t.appName}</h1>
          <p className="text-[9px] text-gray-400 uppercase tracking-tighter opacity-60">Police Commission Terminal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem icon={<PieChartIcon size={18} />} label={t.dashboard} active={view === 'dashboard'} onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} />
          {user.role === UserRole.RECEPTION && (
            <>
              <NavItem icon={<UserPlus size={18} />} label={t.registerGuest} active={view === 'registerGuest'} onClick={() => { setView('registerGuest'); setIsSidebarOpen(false); }} />
              <NavItem icon={<Users size={18} />} label={t.guestList} active={view === 'guestList'} onClick={() => { setView('guestList'); setIsSidebarOpen(false); }} />
              <NavItem icon={<Settings size={18} />} label={t.settings} active={view === 'settings'} onClick={() => { setView('settings'); setIsSidebarOpen(false); }} />
            </>
          )}
          {user.role === UserRole.POLICE && (
            <>
               <NavItem icon={<Plus size={18} />} label={t.policeNotice} active={view === 'addWanted'} onClick={() => { setView('addWanted'); setIsSidebarOpen(false); }} />
               <NavItem icon={<Users size={18} />} label={t.guestList} active={view === 'guestList'} onClick={() => { setView('guestList'); setIsSidebarOpen(false); }} />
               <NavItem icon={<Building2 size={18} />} label={t.hotelDirectory} active={view === 'hotelDirectory'} onClick={() => { setView('hotelDirectory'); setIsSidebarOpen(false); }} />
            </>
          )}
          <NavItem icon={<AlertTriangle size={18} />} label={t.wantedPersons} active={view === 'wantedPersons'} onClick={() => { setView('wantedPersons'); setIsSidebarOpen(false); }} />
          <NavItem icon={<FileText size={18} />} label={t.reports} active={view === 'reports'} onClick={() => { setView('reports'); setIsSidebarOpen(false); }} />
          <NavItem icon={<Bell size={18} />} label={t.notifications} active={view === 'notifications'} count={notifications.length} onClick={() => { setView('notifications'); setIsSidebarOpen(false); }} />
        </nav>
        <div className="p-4 border-t border-white/10">
           <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full py-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all font-bold text-xs uppercase">
            <LogOut size={16} /> {t.logout}
          </button>
        </div>
      </aside>

      <div className="flex-1 h-screen overflow-y-auto bg-white">
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center no-print">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-gray-500"><Menu size={24} /></button>
            <h2 className={`text-xl uppercase hidden sm:block ${GOLDEN_TITLE_STYLE}`}>
              {view === 'dashboard' ? t.dashboard : view === 'registerGuest' ? t.registerGuest : view === 'guestList' ? t.guestList : view === 'settings' ? t.settings : view === 'wantedPersons' ? t.wantedPersons : view === 'reports' ? t.reports : t.notifications}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setLang(lang === 'am' ? 'en' : 'am')} className="p-2 text-gray-400 hover:text-indigo-600"><Globe size={20} /></button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
               <div className="text-right hidden sm:block leading-none">
                  <p className="text-sm font-bold text-gray-800 uppercase">{user.username}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase mt-1">{user.role}</p>
               </div>
               <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold uppercase border border-indigo-200">
                {user.username[0]}
               </div>
            </div>
          </div>
        </header>

        <main className="p-6 md:p-8 max-w-7xl mx-auto">
          {zoomImg && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4" onClick={() => setZoomImg(null)}>
               <button className="absolute top-8 right-8 text-white bg-white/20 p-2 rounded-full"><X size={32} /></button>
               <img src={zoomImg} className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border-4 border-white/10" />
            </div>
          )}

          {view === 'dashboard' && <DashboardView user={user} t={t} guests={guests} wanted={wanted} notifications={notifications} setView={setView} setZoomImg={setZoomImg} />}
          {view === 'guestList' && <GuestListView guests={filteredGuests} t={t} setZoomImg={setZoomImg} startEdit={startEdit} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />}
          {view === 'registerGuest' && <GuestFormView newGuest={newGuest} setNewGuest={setNewGuest} hotelProfile={hotelProfile} saveGuest={saveGuest} t={t} setZoomImg={setZoomImg} handleFileUpload={handleFileUpload} editingGuestId={editingGuestId} setEditingGuestId={setEditingGuestId} setView={setView} />}
          {view === 'wantedPersons' && <WantedPersonsView wanted={wanted} t={t} setZoomImg={setZoomImg} />}
          {view === 'addWanted' && <AddWantedView newWanted={newWanted} setNewWanted={setNewWanted} addWanted={addWanted} t={t} handleFileUpload={handleFileUpload} setZoomImg={setZoomImg} />}
          {view === 'reports' && <ReportView t={t} guests={guests} userRole={user.role} />}
          {view === 'notifications' && <NotificationsView notifications={notifications} setView={setView} t={t} />}
          {view === 'settings' && user.role === UserRole.RECEPTION && (
            <ReceptionSettingsView hotelProfile={hotelProfile} setHotelProfile={setHotelProfile} handleFileUpload={handleFileUpload} setZoomImg={setZoomImg} t={t} setView={setView} />
          )}
          {view === 'hotelDirectory' && user.role === UserRole.POLICE && <HotelDirectoryView allHotels={allHotels} t={t} />}
          {view === 'setupHotel' && <SetupHotelView hotelProfile={hotelProfile} setHotelProfile={setHotelProfile} handleSetupSubmit={handleSetupSubmit} t={t} />}
        </main>
      </div>
    </div>
  );
}

// --- Components ---

function NavItem({ icon, label, active, onClick, count }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, count?: number }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all group relative ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
      <span className={`${active ? 'text-white' : 'text-gray-500 group-hover:text-white'}`}>{icon}</span>
      <span className="font-semibold text-xs uppercase flex-1 text-left tracking-wider">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">{count}</span>
      )}
    </button>
  );
}

function FormInput({ label, value, onChange, type = "text", required, disabled, icon }: { label: string, value: string, onChange?: (v: string) => void, type?: string, required?: boolean, disabled?: boolean, icon: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 tracking-tight">{label}</label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
        <input type={type} className={`w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 outline-none transition-all font-medium text-gray-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} value={value} onChange={e => onChange?.(e.target.value)} required={required} disabled={disabled} />
      </div>
    </div>
  );
}

function DashboardView({ t, guests, wanted, notifications, setView, setZoomImg }: any) {
  const stats = [
    { label: t.guestList, value: guests.length, icon: <Users size={20}/>, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: t.wantedPersons, value: wanted.length, icon: <AlertTriangle size={20}/>, color: 'text-red-600', bg: 'bg-red-50' },
    { label: t.notifications, value: notifications.length, icon: <Bell size={20}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: "Active Hotels", value: 'Live', icon: <Building2 size={20}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const recentGuests = guests.slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold uppercase text-gray-800 tracking-tight">System Status Overview</h3>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date().toDateString()}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         {stats.map((s, i) => (
           <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5 hover:border-indigo-200 transition-all cursor-pointer" onClick={() => {
              if (s.label === t.guestList) setView('guestList');
              if (s.label === t.wantedPersons) setView('wantedPersons');
              if (s.label === t.notifications) setView('notifications');
           }}>
             <div className={`${s.bg} ${s.color} p-3 rounded-lg`}>{s.icon}</div>
             <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">{s.label}</p>
                <p className="text-2xl font-black text-gray-800 leading-none">{s.value}</p>
             </div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
           <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"><TrendingUp size={16} /> Performance Volume</h4>
           </div>
           <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[ {n: 'Mon', v: 4}, {n: 'Tue', v: 9}, {n: 'Wed', v: 6}, {n: 'Thu', v: 12}, {n: 'Fri', v: 15}, {n: 'Sat', v: 18}, {n: 'Sun', v: 10} ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="n" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="v" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
           <h4 className="text-sm font-bold uppercase mb-6">Critical Security Logs</h4>
           <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {notifications.slice(0, 5).map(n => (
                <div key={n.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:border-red-200 transition-all cursor-pointer">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">{n.timestamp}</p>
                    <ShieldAlert size={12} className={n.type === 'danger' ? 'text-red-500' : 'text-indigo-500'} />
                  </div>
                  <p className="text-[11px] font-bold text-gray-800 uppercase line-clamp-1">{n.title}</p>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-10 text-gray-300 font-bold text-[10px] uppercase">No Incident Logs</div>
              )}
           </div>
           <button onClick={() => setView('notifications')} className="w-full mt-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-bold rounded-lg uppercase transition-all">View All Alerts</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
         <div className="p-5 border-b flex justify-between items-center bg-gray-50/50">
            <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"><History size={16} /> Recent Activity</h4>
            <button onClick={() => setView('guestList')} className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-widest">View Full Records</button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-gray-50 text-[10px] font-bold uppercase text-gray-400">
                  <tr>
                     <th className="px-6 py-4">Profile</th>
                     <th className="px-6 py-4">Hotel Property</th>
                     <th className="px-6 py-4">Room No.</th>
                     <th className="px-6 py-4 text-center">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {recentGuests.map(g => (
                    <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-3 flex items-center gap-3">
                          <img src={g.idPhoto} className="w-8 h-10 rounded-md object-cover cursor-pointer" onClick={() => setZoomImg(g.idPhoto)} />
                          <div>
                             <p className="font-bold text-gray-800 uppercase text-xs leading-none mb-1">{g.fullName}</p>
                             <p className="text-[9px] text-gray-400 uppercase">{g.nationality}</p>
                          </div>
                       </td>
                       <td className="px-6 py-3">
                          <p className="text-[11px] font-bold text-gray-600 uppercase">{g.hotelName}</p>
                       </td>
                       <td className="px-6 py-3">
                          <p className="text-[11px] font-bold text-gray-600">{g.roomNumber}</p>
                       </td>
                       <td className="px-6 py-3 text-center">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${g.isWanted ? 'bg-red-500 text-white shadow-sm' : 'bg-emerald-100 text-emerald-700'}`}>
                            {g.isWanted ? 'Wanted' : 'Clear'}
                          </span>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}

function SetupHotelView({ hotelProfile, setHotelProfile, handleSetupSubmit, t }: any) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
       <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
          <div className="text-center mb-8">
             <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 border border-indigo-100"><Building2 size={32} /></div>
             <h2 className={`text-2xl uppercase ${GOLDEN_TITLE_STYLE}`}>{t.setupHotel}</h2>
             <p className="text-gray-400 text-[10px] font-bold mt-2 uppercase">{t.setupWelcome}</p>
          </div>
          <form onSubmit={handleSetupSubmit} className="space-y-4">
             <FormInput label={t.hotel} value={hotelProfile.name} onChange={v => setHotelProfile({...hotelProfile, name: v})} icon={<Building2 size={18}/>} required />
             <FormInput label={t.hotelAddress} value={hotelProfile.address} onChange={v => setHotelProfile({...hotelProfile, address: v})} icon={<Globe size={18}/>} required />
             <FormInput label={t.receptionistName} value={hotelProfile.receptionistName} onChange={v => setHotelProfile({...hotelProfile, receptionistName: v})} icon={<Users size={18}/>} required />
             <FormInput label={t.phoneNumber} value={hotelProfile.phoneNumber} onChange={v => setHotelProfile({...hotelProfile, phoneNumber: v})} icon={<Phone size={18}/>} type="tel" required />
             <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-lg transition-all uppercase text-sm mt-4 shadow-md flex items-center justify-center gap-2">
                {t.save} <ChevronRight size={16} />
             </button>
          </form>
       </div>
    </div>
  );
}

function GuestListView({ guests, t, setZoomImg, startEdit, searchTerm, setSearchTerm }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
       <div className="p-6 border-b flex flex-col sm:flex-row gap-6 justify-between items-center bg-gray-50/50">
          <h3 className={`text-xl leading-none ${GOLDEN_TITLE_STYLE}`}>{t.guestList}</h3>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <input type="text" placeholder={t.searchPlaceholder} className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
       </div>
       <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-gray-50 text-[10px] font-bold uppercase text-gray-400 border-b">
               <tr>
                 <th className="px-6 py-4">ID Photo</th>
                 <th className="px-6 py-4">Full Name</th>
                 <th className="px-6 py-4">Hotel Data</th>
                 <th className="px-6 py-4">Identity Status</th>
                 <th className="px-6 py-4 no-print text-center">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {guests.map(g => (
                 <tr key={g.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-3">
                      <img src={g.idPhoto} className="w-12 h-16 rounded-md object-cover shadow-sm cursor-pointer" onClick={() => setZoomImg(g.idPhoto)} />
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-bold text-gray-800 uppercase text-sm leading-none mb-1.5">{g.fullName}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{g.nationality} • RM {g.roomNumber}</p>
                    </td>
                    <td className="px-6 py-3">
                       <p className="text-[11px] font-bold text-gray-700 uppercase">{g.hotelName}</p>
                       <p className="text-[9px] text-gray-400 font-bold uppercase">{g.checkInDate}</p>
                    </td>
                    <td className="px-6 py-3">
                       {g.isWanted ? (
                         <span className="px-3 py-1 bg-red-600 text-white text-[9px] font-bold rounded-full uppercase flex items-center gap-2 w-fit animate-pulse shadow-md">
                            <AlertTriangle size={12}/> Wanted
                         </span>
                       ) : (
                         <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded-full uppercase flex items-center gap-2 w-fit">
                            <CheckCircle2 size={12}/> Clear
                         </span>
                       )}
                    </td>
                    <td className="px-6 py-3 no-print text-center">
                       <button onClick={() => startEdit(g)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit size={18}/></button>
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
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
       <div className="flex justify-between items-start mb-8">
          <div>
             <h3 className={`text-2xl leading-none ${GOLDEN_TITLE_STYLE}`}>{editingGuestId ? t.edit : t.registerGuest}</h3>
             <p className="text-[10px] font-bold text-gray-400 uppercase mt-2">Compliance Monitoring Division</p>
          </div>
          {editingGuestId && <button onClick={() => { setEditingGuestId(null); setView('guestList'); }} className="p-2 text-gray-400"><X size={24}/></button>}
       </div>
       <form onSubmit={saveGuest} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <FormInput label={t.fullName} value={newGuest.fullName} onChange={(v: string) => setNewGuest({...newGuest, fullName: v})} required icon={<Users size={16}/>} />
             <FormInput label={t.nationality} value={newGuest.nationality} onChange={(v: string) => setNewGuest({...newGuest, nationality: v})} required icon={<Globe size={16}/>} />
             <FormInput label={t.roomNumber} value={newGuest.roomNumber} onChange={(v: string) => setNewGuest({...newGuest, roomNumber: v})} required icon={<Building2 size={16}/>} />
             <FormInput label={t.hotel} value={hotelProfile.name} disabled icon={<Building2 size={16}/>} />
          </div>
          <div className="space-y-4">
             <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">{t.idPhoto}</label>
             <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="w-24 h-32 bg-white rounded-lg shadow-sm overflow-hidden flex items-center justify-center cursor-pointer border border-gray-100" onClick={() => newGuest.idPhoto && setZoomImg(newGuest.idPhoto)}>
                  {newGuest.idPhoto ? <img src={newGuest.idPhoto} className="w-full h-full object-cover" /> : <Camera size={24} className="text-gray-200" />}
                </div>
                <div className="flex-1 space-y-3">
                   <label className="block w-full text-center py-2 bg-indigo-600 text-white rounded-lg font-bold text-[10px] uppercase cursor-pointer hover:bg-indigo-700 transition-all"><Camera className="inline mr-2" size={14}/> {t.capturePhoto} <input type="file" capture="environment" className="hidden" onChange={e => handleFileUpload(e, 'guest')} /></label>
                   <label className="block w-full text-center py-2 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold text-[10px] uppercase cursor-pointer hover:bg-gray-50 transition-all shadow-sm"><ImageIcon className="inline mr-2" size={14}/> {t.fromGallery} <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'guest')} /></label>
                </div>
             </div>
          </div>
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg uppercase text-sm mt-4 transition-all active:scale-[0.98]">{editingGuestId ? t.save : t.submit}</button>
       </form>
    </div>
  );
}

function WantedPersonsView({ wanted, t, setZoomImg }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
       {wanted.map((w: WantedPerson) => (
         <div key={w.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 group">
            <div className="h-64 relative overflow-hidden">
              <img src={w.photo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
              <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase shadow-lg border border-white/20">Wanted / ተፈላጊ</div>
              <button onClick={() => setZoomImg(w.photo)} className="absolute bottom-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-lg text-white"><Maximize2 size={18}/></button>
            </div>
            <div className="p-6">
              <h4 className="text-lg font-bold uppercase text-gray-800 tracking-tight mb-2">{w.fullName}</h4>
              <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider bg-red-50 px-3 py-1 rounded-full w-fit border border-red-100 mb-4">{w.crime}</p>
              <p className="text-xs text-gray-500 leading-relaxed border-l-4 border-red-600 pl-4 py-1 italic mb-6">"{w.description}"</p>
              <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase">
                 <span>Registered: {w.postedDate}</span>
                 <button onClick={() => setZoomImg(w.photo)} className="text-indigo-600 hover:underline">View Evidence</button>
              </div>
            </div>
         </div>
       ))}
    </div>
  );
}

function AddWantedView({ newWanted, setNewWanted, addWanted, t, handleFileUpload, setZoomImg }: any) {
  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
       <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-100"><AlertTriangle size={32} /></div>
          <h3 className="text-xl font-bold uppercase text-red-600 tracking-tight mb-1">{t.policeNotice}</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Digital Criminal Registry Terminal</p>
       </div>
       <form onSubmit={addWanted} className="space-y-4">
          <FormInput label={t.fullName} value={newWanted.fullName} onChange={(v: string) => setNewWanted({...newWanted, fullName: v})} required icon={<Users size={18}/>} />
          <FormInput label={t.crime} value={newWanted.crime} onChange={(v: string) => setNewWanted({...newWanted, crime: v})} required icon={<AlertTriangle size={18}/>} />
          <div className="space-y-1">
             <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Evidence Summary</label>
             <textarea className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500/20" rows={3} value={newWanted.description} onChange={e => setNewWanted({...newWanted, description: e.target.value})} required></textarea>
          </div>
          <div className="space-y-4">
             <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Subject Photograph</label>
             <div className="flex items-center gap-6 p-6 bg-red-50/50 rounded-xl border border-dashed border-red-100">
                <div className="w-24 h-24 bg-white rounded-lg shadow-sm overflow-hidden flex items-center justify-center cursor-pointer border border-white" onClick={() => newWanted.photo && setZoomImg(newWanted.photo)}>
                  {newWanted.photo ? <img src={newWanted.photo} className="w-full h-full object-cover" /> : <ImageIcon size={28} className="text-red-100" />}
                </div>
                <label className="flex-1 block w-full text-center py-2.5 bg-white border border-red-100 text-red-600 rounded-lg font-bold text-[10px] uppercase cursor-pointer hover:bg-red-50 transition-all shadow-sm">Upload Profile Image <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'wanted')} /></label>
             </div>
          </div>
          <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-lg shadow-lg uppercase text-sm mt-4 transition-all">Publish Bulletin</button>
       </form>
    </div>
  );
}

function ReportView({ t, guests, userRole }: any) {
  return (
    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 text-center space-y-10">
       <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 border border-indigo-100"><FileBarChart size={32} /></div>
          <h3 className={`text-3xl uppercase leading-none ${GOLDEN_TITLE_STYLE}`}>Oversight Compliance Report</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase mt-4 tracking-widest italic leading-tight">Benishangul Gumuz Judicial Digital Archive Synchronization</p>
       </div>
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ReportButton icon={<Download size={24}/>} label="Excel (.xlsx)" color="bg-emerald-700" />
          <ReportButton icon={<FileText size={24}/>} label="Word (.docx)" color="bg-blue-800" />
          <ReportButton icon={<PieChartIcon size={24}/>} label="PPT (.pptx)" color="bg-orange-700" />
          <ReportButton icon={<Printer size={24}/>} label="PDF Report" color="bg-slate-900" onClick={() => window.print()} />
       </div>
       <div className="pt-10 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-8 text-left text-[10px] font-bold uppercase text-gray-400">
          <div>
             <p className="mb-8">Inspector Certification</p>
             <div className="h-px bg-gray-100 w-full mb-2"></div>
             <p className="opacity-40 tracking-wider">Assigned Supervisor</p>
          </div>
          <div className="text-center">
             <p className="mb-8">Timestamp</p>
             <p className="text-gray-800 font-black text-sm tracking-wider">{new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
             <p className="mb-8">Regional Security Seal</p>
             <div className="h-px bg-gray-100 w-full mb-2"></div>
             <p className="opacity-40 tracking-wider">Digital Signature</p>
          </div>
       </div>
    </div>
  );
}

function ReportButton({ icon, label, color, onClick }: any) {
  return (
    <button onClick={onClick} className={`${color} text-white p-6 rounded-xl flex flex-col items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-md group`}>
      <div className="bg-white/10 p-4 rounded-lg group-hover:bg-white/20 transition-all">{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function ReceptionSettingsView({ hotelProfile, setHotelProfile, handleFileUpload, setZoomImg, t, setView }: any) {
  const [tempProfile, setTempProfile] = useState({ ...hotelProfile });
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: string) => {
    setTempProfile(prev => {
      const updated = { ...prev, [field]: value };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(hotelProfile));
      return updated;
    });
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasChanges && !tempProfile.digitalIdPhoto) {
      alert(t.verificationRequired);
      return;
    }
    setHotelProfile({ ...tempProfile });
    alert("Profile Updated Successfully");
    setView('dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4"><Settings size={32} /></div>
        <h3 className={`text-2xl uppercase ${GOLDEN_TITLE_STYLE}`}>{t.settings}</h3>
        <p className="text-[10px] font-bold text-gray-400 uppercase mt-2">Identity Verification Terminal</p>
      </div>
      <form onSubmit={onSave} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label={t.hotel} value={tempProfile.name} onChange={v => handleChange('name', v)} icon={<Building2 size={16}/>} required />
          <FormInput label={t.hotelAddress} value={tempProfile.address} onChange={v => handleChange('address', v)} icon={<Globe size={16}/>} required />
          <FormInput label={t.receptionistName} value={tempProfile.receptionistName} onChange={v => handleChange('receptionistName', v)} icon={<Users size={16}/>} required />
          <FormInput label={t.phoneNumber} value={tempProfile.phoneNumber} onChange={v => handleChange('phoneNumber', v)} icon={<Phone size={16}/>} type="tel" required />
        </div>

        {hasChanges && (
          <div className="space-y-4 p-6 bg-amber-50 rounded-xl border border-amber-100">
             <div className="flex items-center gap-3 mb-2 text-amber-700">
                <ShieldAlert size={20} />
                <p className="font-bold uppercase text-[10px] tracking-wider">{t.verificationRequired}</p>
             </div>
             <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-lg border-2 border-amber-200 flex items-center justify-center cursor-pointer" onClick={() => tempProfile.digitalIdPhoto && setZoomImg(tempProfile.digitalIdPhoto)}>
                   {tempProfile.digitalIdPhoto ? <img src={tempProfile.digitalIdPhoto} className="w-full h-full object-cover" /> : <Fingerprint size={28} className="text-amber-200" />}
                </div>
                <label className="flex-1 block w-full text-center py-2 bg-white border border-amber-200 text-amber-600 rounded-lg font-bold text-[9px] uppercase cursor-pointer hover:bg-amber-100 transition-all shadow-sm">
                   Upload Digital ID (Fayda)
                   <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'digitalId')} />
                </label>
             </div>
          </div>
        )}

        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg uppercase text-sm mt-4 transition-all">Save Profile Updates</button>
      </form>
    </div>
  );
}

function HotelDirectoryView({ allHotels, t }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
       <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
         <h3 className={`text-xl leading-none ${GOLDEN_TITLE_STYLE}`}>{t.hotelDirectory}</h3>
         <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-bold uppercase hover:bg-gray-50 transition-all shadow-sm"><Printer size={14}/> {t.print}</button>
       </div>
       <div className="overflow-x-auto">
         <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-bold uppercase text-gray-400 border-b">
              <tr>
                <th className="px-6 py-4">Property Name</th>
                <th className="px-6 py-4">State Location</th>
                <th className="px-6 py-4">Assigned Personnel</th>
                <th className="px-6 py-4">Contact Terminal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allHotels.map((h: HotelProfile, i: number) => (
                <tr key={i} className="hover:bg-gray-50 transition-all">
                  <td className="px-6 py-4 font-bold text-gray-800 uppercase text-xs">{h.name}</td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-medium">{h.address}</td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-medium">{h.receptionistName}</td>
                  <td className="px-6 py-4 font-bold text-indigo-600 text-xs">{h.phoneNumber}</td>
                </tr>
              ))}
              {allHotels.length === 0 && (
                <tr><td colSpan={4} className="p-20 text-center text-gray-300 font-bold uppercase text-[10px] tracking-widest">No Regional Profiles Indexed</td></tr>
              )}
            </tbody>
         </table>
       </div>
    </div>
  );
}

function NotificationsView({ notifications, setView, t }: any) {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-in slide-in-from-bottom-8 duration-500">
       <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100"><Bell size={24} /></div>
          <h3 className={`text-2xl tracking-tight uppercase ${GOLDEN_TITLE_STYLE}`}>Regional Alerts Feed</h3>
       </div>
       {notifications.map((n: any) => (
         <div key={n.id} className={`p-6 bg-white rounded-xl border-l-[6px] shadow-sm flex gap-6 group hover:-translate-x-1 transition-all ${n.type === 'danger' ? 'border-red-600' : 'border-indigo-600'}`}>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${n.type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}><AlertTriangle size={24}/></div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase">{n.timestamp}</p>
                {n.type === 'danger' && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[9px] font-bold rounded uppercase animate-pulse">Critical Intercept</span>}
              </div>
              <h4 className="text-sm font-bold text-gray-800 uppercase leading-none mb-2">{n.title}</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed opacity-80">{n.message}</p>
              {n.guestId && (
                <button onClick={() => setView('guestList')} className="mt-4 px-4 py-1.5 bg-red-600 text-white rounded-md text-[9px] font-bold uppercase shadow-sm hover:bg-red-700 transition-all">Intercept Subject Details</button>
              )}
            </div>
         </div>
       ))}
       {notifications.length === 0 && (
         <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-100 flex flex-col items-center">
            <CheckCircle2 size={48} className="text-gray-100 mb-6" />
            <p className="text-xl font-bold uppercase tracking-widest text-gray-200">System Secure</p>
         </div>
       )}
    </div>
  );
}
