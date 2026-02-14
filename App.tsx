
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
  ShieldAlert
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const INITIAL_WANTED: WantedPerson[] = [
  { id: 'w1', fullName: 'Abebe Kebede', photo: 'https://picsum.photos/seed/abebe/200/200', description: 'Medium build, height 1.75m', crime: 'Robbery', postedDate: '2023-10-15' },
  { id: 'w2', fullName: 'Mulugeta Tadesse', photo: 'https://picsum.photos/seed/mulu/200/200', description: 'Scar on left cheek', crime: 'Fraud', postedDate: '2023-11-01' }
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Professional Security/Police Logo URL
const LOGO_PATH = 'https://img.icons8.com/fluency/240/shield-with-crown.png';

// Golden Gradient for the Title
const GOLDEN_TITLE_STYLE = "text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] via-[#FDB931] to-[#9f7928] drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]";

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
  
  // Global Hotel Directory for Police monitoring
  const [allHotels, setAllHotels] = useState<HotelProfile[]>(() => JSON.parse(localStorage.getItem('allHotels') || '[]'));

  // Current session's hotel identity
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
        <div className="bg-white/5 backdrop-blur-2xl rounded-[3rem] shadow-2xl p-10 w-full max-w-md border border-white/10 text-center">
          <div className="mb-10 relative inline-block">
            <img src={LOGO_PATH} alt="Police Logo" className="w-40 h-40 mx-auto drop-shadow-[0_0_25px_rgba(255,215,0,0.3)] animate-pulse" />
          </div>
          <h1 className={`text-5xl font-black mb-4 uppercase tracking-tight ${GOLDEN_TITLE_STYLE}`}>{t.appName}</h1>
          <p className="text-indigo-400 font-bold text-sm mb-6 leading-tight uppercase font-black">{t.developedBy}</p>
          <p className="text-gray-400 italic text-xs mb-10 opacity-70 font-black">"{t.motto}"</p>
          
          <form onSubmit={handleLogin} className="space-y-6 text-left">
            <input type="text" placeholder={t.username} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-600 font-bold" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} required />
            <input type="password" placeholder={t.password} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-600 font-bold" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required />
            <button className="w-full bg-gradient-to-r from-indigo-700 to-indigo-500 hover:from-indigo-600 hover:to-indigo-400 text-white font-black py-5 rounded-2xl shadow-xl transition-all transform active:scale-95 text-lg tracking-widest uppercase mt-4">
              {t.login}
            </button>
          </form>
          <div className="mt-10 flex justify-center gap-6">
            <button onClick={() => setLang('am')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${lang === 'am' ? 'bg-white text-indigo-950 shadow-lg' : 'text-gray-500'}`}>አማርኛ</button>
            <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${lang === 'en' ? 'bg-white text-indigo-950 shadow-lg' : 'text-gray-500'}`}>English</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'setupHotel' && user.role === UserRole.RECEPTION) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4">
        <div className="bg-white p-12 md:p-16 rounded-[4rem] shadow-2xl w-full max-w-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
           <div className="text-center mb-12">
              <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner ring-4 ring-indigo-50">
                <Building2 size={48} />
              </div>
              <h2 className={`text-4xl font-black uppercase tracking-widest mb-4 ${GOLDEN_TITLE_STYLE}`}>{t.setupHotel}</h2>
              <p className="text-slate-500 font-bold max-w-sm mx-auto leading-relaxed">{t.setupWelcome}</p>
           </div>
           <form onSubmit={handleSetupSubmit} className="space-y-8">
              <FormInput label={t.hotel} value={hotelProfile.name} onChange={v => setHotelProfile({...hotelProfile, name: v})} icon={<Building2 size={24}/>} required />
              <FormInput label={t.hotelAddress} value={hotelProfile.address} onChange={v => setHotelProfile({...hotelProfile, address: v})} icon={<Globe size={24}/>} required />
              <FormInput label={t.receptionistName} value={hotelProfile.receptionistName} onChange={v => setHotelProfile({...hotelProfile, receptionistName: v})} icon={<Users size={24}/>} required />
              <button className="w-full bg-gradient-to-r from-indigo-700 to-indigo-500 text-white font-black py-7 rounded-[2rem] shadow-2xl shadow-indigo-100 transition-all uppercase tracking-[5px] text-xl flex items-center justify-center gap-4 group">
                {t.save} & {t.submit} <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform" />
              </button>
           </form>
           <div className="mt-12 pt-8 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">{t.developedBy}</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <aside className={`fixed md:relative z-50 w-80 h-full bg-[#0f172a] text-white flex flex-col transition-transform duration-300 no-print shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-10 border-b border-white/5 text-center bg-indigo-950/20">
          <img src={LOGO_PATH} className="w-24 h-24 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(255,215,0,0.2)]" alt="Logo" />
          <h1 className={`font-black text-2xl tracking-tighter mb-1 uppercase ${GOLDEN_TITLE_STYLE}`}>{t.appName}</h1>
          <p className="text-indigo-400 font-black text-[10px] uppercase tracking-widest leading-tight">{t.developedBy}</p>
        </div>
        <nav className="flex-1 p-8 space-y-3 overflow-y-auto custom-scrollbar">
          <NavItem icon={<PieChartIcon size={22} />} label={t.dashboard} active={view === 'dashboard'} onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} />
          {user.role === UserRole.RECEPTION && (
            <>
              <NavItem icon={<UserPlus size={22} />} label={t.registerGuest} active={view === 'registerGuest'} onClick={() => { setView('registerGuest'); setIsSidebarOpen(false); }} />
              <NavItem icon={<Users size={22} />} label={t.guestList} active={view === 'guestList'} onClick={() => { setView('guestList'); setIsSidebarOpen(false); }} />
              <NavItem icon={<Settings size={22} />} label={t.settings} active={view === 'settings'} onClick={() => { setView('settings'); setIsSidebarOpen(false); }} />
            </>
          )}
          {user.role === UserRole.POLICE && (
            <>
               <NavItem icon={<Plus size={22} />} label={t.policeNotice} active={view === 'addWanted'} onClick={() => { setView('addWanted'); setIsSidebarOpen(false); }} />
               <NavItem icon={<Users size={22} />} label={t.guestList} active={view === 'guestList'} onClick={() => { setView('guestList'); setIsSidebarOpen(false); }} />
               <NavItem icon={<Building2 size={22} />} label={t.hotelDirectory} active={view === 'hotelDirectory'} onClick={() => { setView('hotelDirectory'); setIsSidebarOpen(false); }} />
               <NavItem icon={<Settings size={22} />} label={t.policeSettings} active={view === 'policeSettings'} onClick={() => { setView('policeSettings'); setIsSidebarOpen(false); }} />
            </>
          )}
          <NavItem icon={<AlertTriangle size={22} />} label={t.wantedPersons} active={view === 'wantedPersons'} onClick={() => { setView('wantedPersons'); setIsSidebarOpen(false); }} />
          <NavItem icon={<FileText size={22} />} label={t.reports} active={view === 'reports'} onClick={() => { setView('reports'); setIsSidebarOpen(false); }} />
          <NavItem icon={<Info size={22} />} label={t.appUtility} active={view === 'utility'} onClick={() => { setView('utility'); setIsSidebarOpen(false); }} />
          <NavItem icon={<Bell size={22} />} label={t.notifications} active={view === 'notifications'} count={notifications.length} onClick={() => { setView('notifications'); setIsSidebarOpen(false); }} />
        </nav>
        <div className="p-8 border-t border-white/5 space-y-4">
           <p className="text-[10px] text-indigo-400 font-black text-center uppercase tracking-widest italic opacity-50">"{t.motto}"</p>
           <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full py-4 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl transition-all font-black text-xs uppercase shadow-lg shadow-red-900/10">
            <LogOut size={20} /> {t.logout}
          </button>
        </div>
      </aside>

      <div className="flex-1 h-screen overflow-y-auto relative bg-[#f1f5f9]">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-8 py-5 flex justify-between items-center no-print shadow-sm">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"><Menu size={24} /></button>
            <h2 className={`text-2xl font-black uppercase tracking-widest hidden sm:block ${GOLDEN_TITLE_STYLE}`}>
              {view === 'dashboard' ? t.dashboard : view === 'registerGuest' ? t.registerGuest : view === 'guestList' ? t.guestList : view === 'settings' ? t.settings : view === 'wantedPersons' ? t.wantedPersons : view === 'reports' ? t.reports : t.notifications}
            </h2>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={() => setLang(lang === 'am' ? 'en' : 'am')} className="p-3 border border-slate-100 bg-white rounded-2xl hover:bg-indigo-50 transition-all shadow-sm group">
              <Globe size={22} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </button>
            <div className="flex items-center gap-4 px-5 py-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-800 uppercase leading-none tracking-tighter">{user.username}</p>
                  <p className="text-[10px] text-indigo-500 font-black uppercase mt-1.5 tracking-widest">{user.role}</p>
               </div>
               <div className="w-12 h-12 bg-gradient-to-br from-indigo-700 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-black uppercase shadow-xl shadow-indigo-100 text-xl border-2 border-white">
                {user.username[0]}
               </div>
            </div>
          </div>
        </header>

        <main className="p-8 md:p-12 max-w-7xl mx-auto animate-in fade-in duration-700">
          {zoomImg && (
            <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-2xl flex flex-col items-center justify-center p-6" onClick={() => setZoomImg(null)}>
               <button className="absolute top-10 right-10 text-white bg-white/10 p-5 rounded-full hover:bg-white/20 transition-all border border-white/10"><X size={40} /></button>
               <img src={zoomImg} alt="Zoomed" className="max-w-full max-h-[80vh] rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] border-4 border-white/10 object-contain" />
               <p className={`text-3xl font-black uppercase mt-12 tracking-[5px] ${GOLDEN_TITLE_STYLE}`}>{t.zoomImage}</p>
            </div>
          )}

          {view === 'hotelDirectory' && user.role === UserRole.POLICE && (
            <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-6 duration-500">
               <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
                 <div>
                   <h3 className={`text-3xl font-black uppercase tracking-widest ${GOLDEN_TITLE_STYLE}`}>{t.hotelDirectory}</h3>
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[4px] mt-2">Regional Property Audit</p>
                 </div>
                 <div className="flex gap-4">
                   <button onClick={() => window.print()} className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-[1.2rem] text-[11px] font-black uppercase shadow-sm hover:bg-slate-50 transition-all tracking-widest"><Printer size={20}/> {t.print}</button>
                   <button className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-[1.2rem] text-[11px] font-black uppercase shadow-sm hover:bg-slate-50 transition-all tracking-widest"><Download size={20}/> {t.download}</button>
                 </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 border-b">
                      <tr>
                        <th className="px-10 py-8 tracking-[3px]">{t.hotel}</th>
                        <th className="px-10 py-8 tracking-[3px]">{t.hotelAddress}</th>
                        <th className="px-10 py-8 tracking-[3px]">{t.receptionistName}</th>
                        <th className="px-10 py-8 tracking-[3px]">Audit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allHotels.map((h, i) => (
                        <tr key={i} className="hover:bg-indigo-50/20 transition-all group">
                          <td className="px-10 py-8 font-black text-slate-800 text-lg uppercase tracking-tight group-hover:translate-x-2 transition-transform">{h.name}</td>
                          <td className="px-10 py-8 text-sm text-slate-500 font-bold uppercase tracking-tight">{h.address}</td>
                          <td className="px-10 py-8 text-sm text-slate-500 font-bold uppercase tracking-tight">{h.receptionistName}</td>
                          <td className="px-10 py-8">
                            <span className="px-6 py-2 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase border-2 border-emerald-200 flex items-center gap-2 w-fit shadow-lg shadow-emerald-100">
                              <ShieldCheck size={14} /> Active / ንቁ
                            </span>
                          </td>
                        </tr>
                      ))}
                      {allHotels.length === 0 && (
                        <tr><td colSpan={4} className="p-32 text-center font-black uppercase text-slate-300 tracking-[10px] opacity-40">No Regional Records Registered</td></tr>
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          )}

          {view === 'utility' && (
             <div className="bg-white p-16 rounded-[4rem] shadow-2xl border border-slate-100 max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-10 duration-700">
                <div className="text-center">
                   <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner ring-8 ring-indigo-50/50"><Info size={48} /></div>
                   <h3 className={`text-4xl font-black uppercase tracking-[10px] ${GOLDEN_TITLE_STYLE}`}>{t.appUtility}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-6 p-10 bg-slate-50 rounded-[3rem] border border-slate-100 shadow-inner group hover:bg-white hover:shadow-xl transition-all duration-500">
                      <h4 className="text-2xl font-black uppercase text-indigo-600 border-b-2 border-indigo-100 pb-3 tracking-widest">አማርኛ</h4>
                      <p className="text-slate-600 leading-relaxed font-bold text-lg">
                        ይህ "ቤጉ እንግዳ" አፕልኬሽን በቤንሻንጉል ጉምዝ ክልል ፖሊስ ኮሚሽን የዳበረ ሲሆን፣ በክልሉ ውስጥ ያሉ ማንኛውም ሆቴሎች እንግዶችን በዘመናዊ መልኩ እንዲመዘግቡ እና መረጃውን ለፖሊስ በቀጥታ እንዲያስተላልፉ ይረዳል። ይህም የወንጀል መከላከያ ስራን ይበልጥ ቀልጣፋ ያደርገዋል። ፖሊሱም የትኛው እንግዳ በየትኛው ሆቴል እንዳለ ወዲያውኑ ማየት ይችላል።
                      </p>
                   </div>
                   <div className="space-y-6 p-10 bg-slate-50 rounded-[3rem] border border-slate-100 shadow-inner group hover:bg-white hover:shadow-xl transition-all duration-500">
                      <h4 className="text-2xl font-black uppercase text-indigo-600 border-b-2 border-indigo-100 pb-3 tracking-widest">English</h4>
                      <p className="text-slate-600 leading-relaxed font-bold text-lg">
                        Developed by the Benishangul Gumuz Region Police Commission, "Begu Engeda" enables hotels to digitize guest registration and share data instantly with law enforcement. This ensures real-time monitoring of all property stays across the region, enhancing security and rapid criminal identification through integrated wanted-person alerts.
                      </p>
                   </div>
                </div>
             </div>
          )}

          {view === 'dashboard' && <DashboardView user={user} t={t} guests={guests} wanted={wanted} notifications={notifications} setView={setView} />}
          {view === 'guestList' && <GuestListView guests={filteredGuests} t={t} setZoomImg={setZoomImg} startEdit={startEdit} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />}
          {view === 'registerGuest' && <GuestFormView newGuest={newGuest} setNewGuest={setNewGuest} hotelProfile={hotelProfile} saveGuest={saveGuest} t={t} setZoomImg={setZoomImg} handleFileUpload={handleFileUpload} editingGuestId={editingGuestId} setEditingGuestId={setEditingGuestId} setView={setView} />}
          {view === 'wantedPersons' && <WantedPersonsView wanted={wanted} t={t} setZoomImg={setZoomImg} />}
          {view === 'addWanted' && <AddWantedView newWanted={newWanted} setNewWanted={setNewWanted} addWanted={addWanted} t={t} handleFileUpload={handleFileUpload} setZoomImg={setZoomImg} />}
          {view === 'reports' && <ReportView t={t} guests={guests} userRole={user.role} />}
          {view === 'notifications' && <NotificationsView notifications={notifications} setView={setView} t={t} />}
          
          {(view === 'settings' || view === 'policeSettings') && (
            <div className="max-w-2xl mx-auto bg-white p-14 rounded-[4rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
              <div className="text-center mb-12">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><Settings size={40} /></div>
                <h3 className={`text-3xl font-black uppercase tracking-widest ${GOLDEN_TITLE_STYLE}`}>{t.settings}</h3>
                <p className="text-slate-400 font-bold text-xs mt-3 uppercase tracking-[4px]">Configuration Terminal</p>
              </div>
              <form onSubmit={handleSetupSubmit} className="space-y-10">
                 <FormInput label={t.hotel} value={hotelProfile.name} onChange={v => setHotelProfile({...hotelProfile, name: v})} icon={<Building2 size={24}/>} required />
                 <FormInput label={t.hotelAddress} value={hotelProfile.address} onChange={v => setHotelProfile({...hotelProfile, address: v})} icon={<Globe size={24}/>} required />
                 <FormInput label={t.receptionistName} value={hotelProfile.receptionistName} onChange={v => setHotelProfile({...hotelProfile, receptionistName: v})} icon={<Users size={24}/>} required />
                 <button className="w-full bg-gradient-to-r from-indigo-700 to-indigo-500 text-white font-black py-7 rounded-[2rem] shadow-2xl shadow-indigo-100 uppercase tracking-[5px] text-xl hover:shadow-indigo-200/50 transition-all">{t.save}</button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, count }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, count?: number }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-5 px-8 py-5 rounded-[1.5rem] transition-all duration-300 group ${active ? 'bg-white text-indigo-950 shadow-2xl scale-[1.05]' : 'text-indigo-200/60 hover:bg-white/5 hover:text-white'}`}>
      <span className={`${active ? 'text-indigo-600' : 'opacity-60 group-hover:scale-110 transition-transform'}`}>{icon}</span>
      <span className="font-black text-[12px] tracking-[2px] uppercase flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-full animate-pulse ring-4 ring-red-900/10 shadow-lg">{count}</span>
      )}
    </button>
  );
}

function FormInput({ label, value, onChange, type = "text", required, disabled, icon }: { label: string, value: string, onChange?: (v: string) => void, type?: string, required?: boolean, disabled?: boolean, icon: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[4px] ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-indigo-600">{icon}</div>
        <input type={type} className={`w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] pl-16 pr-8 py-5 outline-none transition-all font-bold text-slate-800 text-lg focus:border-indigo-400 focus:bg-white focus:ring-8 focus:ring-indigo-50 ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`} value={value} onChange={e => onChange?.(e.target.value)} required={required} disabled={disabled} />
      </div>
    </div>
  );
}

function DashboardView({ user, t, guests, wanted, notifications, setView }: { user: any, t: any, guests: Guest[], wanted: WantedPerson[], notifications: Notification[], setView: (v: string) => void }) {
  const stats = [
    { label: t.guestList, value: guests.length, icon: <Users size={28}/>, color: 'bg-indigo-600' },
    { label: t.wantedPersons, value: wanted.length, icon: <AlertTriangle size={28}/>, color: 'bg-red-600' },
    { label: t.notifications, value: notifications.length, icon: <Bell size={28}/>, color: 'bg-amber-500' },
    { label: t.reports, value: 'Live', icon: <FileBarChart size={28}/>, color: 'bg-emerald-600' },
  ];
  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
         {stats.map((s, i) => (
           <div key={i} className="bg-white p-10 md:p-12 rounded-[3rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group overflow-hidden relative" onClick={() => {
              if (s.label === t.guestList) setView('guestList');
              if (s.label === t.wantedPersons) setView('wantedPersons');
              if (s.label === t.notifications) setView('notifications');
              if (s.label === t.reports) setView('reports');
           }}>
             <div className={`${s.color} absolute -top-10 -right-10 w-24 h-24 opacity-5 group-hover:scale-150 transition-transform duration-700`}></div>
             <div className={`${s.color} w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl mb-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>{s.icon}</div>
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-[4px] mb-2 font-black leading-none">{s.label}</p>
             <p className="text-5xl font-black text-slate-800 tracking-tighter leading-none">{s.value}</p>
           </div>
         ))}
       </div>
       <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-2 bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-12">
               <h3 className="text-2xl font-black uppercase tracking-[5px] flex items-center gap-4"><FileBarChart className="text-indigo-600" size={32} /> Activity Metrics</h3>
               <span className="text-[10px] font-black text-indigo-400 uppercase bg-indigo-50 px-4 py-1.5 rounded-xl tracking-widest border border-indigo-100">Real-time Telemetry</span>
            </div>
            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={[ {n: 'Mon', v: 4}, {n: 'Tue', v: 7}, {n: 'Wed', v: 5}, {n: 'Thu', v: 9}, {n: 'Fri', v: 12}, {n: 'Sat', v: 15}, {n: 'Sun', v: 8} ]}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 900, fill: '#64748b'}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 900, fill: '#64748b'}} />
                   <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '25px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '20px', fontWeight: 'bold'}} />
                   <Bar dataKey="v" fill="#6366f1" radius={[15, 15, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 flex flex-col">
             <h3 className="text-2xl font-black uppercase tracking-[5px] mb-10 flex items-center gap-4"><Bell className="text-red-600" size={32} /> Security Logs</h3>
             <div className="flex-1 space-y-6 overflow-y-auto pr-3 custom-scrollbar">
                {notifications.slice(0, 5).map(n => (
                  <div key={n.id} className="p-6 bg-red-50/50 rounded-[2.5rem] border-2 border-red-50 group hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer relative overflow-hidden">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{n.timestamp}</p>
                      <ShieldAlert size={14} className="text-red-400 group-hover:scale-125 transition-transform" />
                    </div>
                    <p className="text-sm font-black text-slate-800 uppercase leading-tight group-hover:underline">{n.title}</p>
                    <p className="text-[10px] text-red-700 font-bold opacity-70 mt-2 tracking-widest uppercase">Immediate Action Required</p>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center py-24 opacity-30">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><CheckCircle2 size={48} className="text-slate-200" /></div>
                    <p className="text-[11px] font-black uppercase tracking-[10px] leading-none">Regional Clear</p>
                  </div>
                )}
             </div>
             <button onClick={() => setView('registerGuest')} className="mt-10 w-full py-6 bg-gradient-to-r from-indigo-700 to-indigo-500 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[4px] shadow-2xl shadow-indigo-100 hover:shadow-indigo-300/50 transition-all transform active:scale-95">Register New Ingress</button>
          </div>
       </div>
    </div>
  );
}

function GuestListView({ guests, t, setZoomImg, startEdit, searchTerm, setSearchTerm }: { guests: Guest[], t: any, setZoomImg: any, startEdit: any, searchTerm: string, setSearchTerm: any }) {
  return (
    <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in duration-700">
       <div className="p-10 md:p-14 border-b flex flex-col md:flex-row gap-8 justify-between items-center bg-slate-50/50">
          <div>
            <h3 className={`text-4xl font-black uppercase tracking-widest leading-none ${GOLDEN_TITLE_STYLE}`}>{t.guestList}</h3>
            <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[5px] mt-3 opacity-60">Digital Surveillance Ledger</p>
          </div>
          <div className="relative w-full md:w-[500px] group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={24} />
            <input type="text" placeholder={t.searchPlaceholder} className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-[1.8rem] outline-none focus:border-indigo-400 focus:ring-8 focus:ring-indigo-50 font-bold text-lg shadow-sm transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
               {guests.map(g => (
                 <tr key={g.id} className="hover:bg-indigo-50/30 transition-all group">
                    <td className="px-12 py-7">
                      <div className="w-20 h-24 rounded-[1.8rem] overflow-hidden shadow-2xl border-4 border-white ring-2 ring-slate-100 transform group-hover:scale-110 group-hover:rotate-2 transition-all cursor-zoom-in" onClick={() => setZoomImg(g.idPhoto)}>
                        <img src={g.idPhoto} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-12 py-7">
                      <p className="font-black text-slate-800 uppercase text-2xl tracking-tighter leading-none group-hover:translate-x-1 transition-transform">{g.fullName}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <Globe size={16} className="text-indigo-400" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{g.nationality} • ROOM {g.roomNumber}</p>
                      </div>
                    </td>
                    <td className="px-12 py-7">
                       <div className="flex items-center gap-3 mb-2">
                          <Building2 size={18} className="text-slate-400" />
                          <p className="text-base font-black text-slate-600 uppercase tracking-tighter">{g.hotelName}</p>
                       </div>
                       <div className="flex items-center gap-3 opacity-60">
                          <MapPin size={14} className="text-slate-300" />
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{g.hotelAddress}</p>
                       </div>
                    </td>
                    <td className="px-12 py-7">
                       {g.isWanted ? (
                         <span className="px-6 py-3 bg-red-600 text-white text-[11px] font-black rounded-full uppercase flex items-center gap-3 w-fit animate-pulse border-4 border-white shadow-2xl shadow-red-200">
                            <AlertTriangle size={18}/> Wanted / ተፈላጊ
                         </span>
                       ) : (
                         <span className="px-6 py-3 bg-emerald-500 text-white text-[11px] font-black rounded-full uppercase flex items-center gap-3 w-fit border-4 border-white shadow-xl shadow-emerald-100">
                            <CheckCircle2 size={18}/> Clear / ንፁህ
                         </span>
                       )}
                    </td>
                    <td className="px-12 py-7 no-print text-center">
                       <button onClick={() => startEdit(g)} className="p-5 bg-white border border-slate-100 text-indigo-600 rounded-[1.8rem] hover:bg-indigo-600 hover:text-white transition-all shadow-sm group-hover:rotate-12 group-hover:scale-110"><Edit size={24}/></button>
                    </td>
                 </tr>
               ))}
             </tbody>
          </table>
          {guests.length === 0 && (
            <div className="p-32 text-center opacity-10">
               <Search size={120} className="mx-auto mb-10" />
               <p className="text-4xl font-black uppercase tracking-[25px]">No Records</p>
            </div>
          )}
       </div>
    </div>
  );
}

function GuestFormView({ newGuest, setNewGuest, hotelProfile, saveGuest, t, setZoomImg, handleFileUpload, editingGuestId, setEditingGuestId, setView }: any) {
  return (
    <div className="max-w-4xl mx-auto bg-white p-16 rounded-[4.5rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
       <div className="flex justify-between items-start mb-16">
          <div>
             <h3 className={`text-4xl font-black uppercase tracking-widest leading-none mb-4 ${GOLDEN_TITLE_STYLE}`}>{editingGuestId ? t.edit : t.registerGuest}</h3>
             <p className="text-slate-400 font-bold text-xs uppercase tracking-[5px] opacity-60">Public Safety Compliance Division</p>
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
                <div className="w-40 h-56 bg-white rounded-[2.5rem] border-[6px] border-white shadow-2xl overflow-hidden flex items-center justify-center cursor-zoom-in group-hover:scale-105 group-hover:-rotate-2 transition-all" onClick={() => newGuest.idPhoto && setZoomImg(newGuest.idPhoto)}>
                  {newGuest.idPhoto ? <img src={newGuest.idPhoto} className="w-full h-full object-cover" /> : <Camera size={64} className="text-slate-100" />}
                </div>
                <div className="flex-1 w-full space-y-6">
                   <label className="block w-full text-center py-7 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase cursor-pointer hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all transform active:scale-95"><Camera className="inline mr-3" size={24}/> {t.capturePhoto} <input type="file" capture="environment" className="hidden" onChange={e => handleFileUpload(e, 'guest')} /></label>
                   <label className="block w-full text-center py-7 bg-white border-2 border-slate-200 text-slate-600 rounded-[2rem] font-black text-xs uppercase cursor-pointer hover:bg-slate-50 transition-all shadow-sm transform active:scale-95"><ImageIcon className="inline mr-3" size={24}/> {t.fromGallery} <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'guest')} /></label>
                </div>
             </div>
          </div>
          <button className="w-full bg-gradient-to-r from-indigo-700 to-indigo-500 text-white font-black py-8 rounded-[2.5rem] shadow-2xl shadow-indigo-100 uppercase tracking-[8px] text-2xl transition-all transform active:scale-[0.98] mt-10">{editingGuestId ? t.save : t.submit}</button>
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
              <h4 className="text-4xl font-black uppercase text-slate-800 tracking-tighter leading-none group-hover:text-red-700 transition-colors">{w.fullName}</h4>
              <p className="text-[12px] text-red-600 font-black uppercase tracking-[4px] inline-block px-4 py-2 bg-red-50 rounded-xl border border-red-100">CRIME: {w.crime}</p>
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
                <label className="flex-1 block w-full text-center py-7 bg-white border-2 border-red-100 text-red-600 rounded-[2rem] font-black text-xs uppercase cursor-pointer hover:bg-red-50 transition-all shadow-sm tracking-[3px]">Upload Profile Image <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'wanted')} /></label>
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
             <h3 className={`text-4xl font-black uppercase tracking-[8px] text-slate-800 leading-none ${GOLDEN_TITLE_STYLE}`}>{userRole === UserRole.POLICE ? "Regional Command Oversight" : "Property Activity Audit"}</h3>
             <p className="text-indigo-400 font-black text-[11px] uppercase tracking-[6px] mt-4 opacity-50">Benishangul Gumuz Judicial Digital Archive Feed</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
             <ReportButton icon={<Download size={36}/>} label="Excel (.xlsx)" color="bg-emerald-700" />
             <ReportButton icon={<FileText size={36}/>} label="Word (.docx)" color="bg-blue-800" />
             <ReportButton icon={<PieChartIcon size={36}/>} label="PPT (.pptx)" color="bg-orange-700" />
             <ReportButton icon={<Printer size={36}/>} label="Official Report" color="bg-slate-900" />
          </div>
          
          <div className="mt-24 pt-20 border-t-4 border-double border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-20 text-left no-print">
             <div className="space-y-8">
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-[5px] leading-none mb-3">Authority Inspector</p>
                <div className="h-px bg-slate-200 w-full mb-2"></div>
                <p className="text-sm text-slate-400 font-black uppercase tracking-[3px] opacity-40">{t.supervisorName}</p>
             </div>
             <div className="space-y-8 text-center">
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-[5px] leading-none mb-3">{t.date}</p>
                <p className={`font-black text-2xl uppercase tracking-[4px] ${GOLDEN_TITLE_STYLE}`}>{new Date().toLocaleDateString()}</p>
             </div>
             <div className="space-y-8 text-right">
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-[5px] leading-none mb-3">Oversight Seal / Signature</p>
                <div className="h-px bg-slate-200 w-full mb-2"></div>
                <p className="text-sm text-slate-400 font-black uppercase tracking-[3px] opacity-40">{t.signature}</p>
             </div>
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
          <h3 className={`text-4xl font-black uppercase tracking-[6px] ${GOLDEN_TITLE_STYLE}`}>Critical Alerts</h3>
       </div>
       {notifications.map((n: any) => (
         <div key={n.id} className="p-12 bg-white rounded-[4rem] border-l-[20px] border-red-600 shadow-2xl flex gap-12 group hover:-translate-x-4 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-red-600/5 rounded-bl-[10rem] -z-0"></div>
            <div className="w-24 h-24 bg-red-600 text-white rounded-[2rem] flex items-center justify-center shrink-0 shadow-2xl shadow-red-200 border-4 border-white relative z-10"><AlertTriangle size={48}/></div>
            <div className="flex-1 relative z-10">
              <div className="flex justify-between items-start mb-4">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[5px] font-black leading-none">{n.timestamp}</p>
                <span className="px-5 py-1.5 bg-red-50 text-red-600 text-[10px] font-black rounded-full uppercase border-2 border-red-100 shadow-sm">Immediate Action Required</span>
              </div>
              <h4 className="text-3xl font-black text-red-950 uppercase leading-tight mt-2 group-hover:underline transition-all font-black">{n.title}</h4>
              <p className="text-xl text-slate-600 font-bold mt-6 leading-relaxed opacity-80">{n.message}</p>
              <div className="mt-10 flex gap-6">
                 <button onClick={() => setView('guestList')} className="px-10 py-4 bg-red-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-red-200 hover:bg-red-700 transition-all transform active:scale-95">Intercept Subject</button>
                 <button className="px-10 py-4 bg-slate-50 text-slate-500 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border-2 border-slate-100 transform active:scale-95">Dispatch Patrol</button>
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
            <p className="text-slate-400 font-bold text-base uppercase mt-8 opacity-40 tracking-[6px]">Continuous Regional Vigilance Active</p>
         </div>
       )}
    </div>
  );
}
