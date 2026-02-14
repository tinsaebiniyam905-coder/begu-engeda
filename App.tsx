
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
  SearchCode
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

// Professional High-Quality Gold Police Badge Logo
const LOGO_PATH = 'https://img.icons8.com/color/512/police-badge.png';

// Enhanced Golden Gradient for the Title - More vivid and premium
const GOLDEN_TITLE_STYLE = "text-transparent bg-clip-text bg-gradient-to-b from-[#FFFDE7] via-[#FFD700] to-[#B8860B] drop-shadow-[0_4px_4px_rgba(0,0,0,0.6)] font-black italic";

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
        <div className="bg-white/5 backdrop-blur-3xl rounded-[4rem] shadow-2xl p-12 w-full max-w-md border border-white/10 text-center relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-600/20 blur-3xl rounded-full"></div>
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-yellow-500/10 blur-3xl rounded-full"></div>
          
          <div className="mb-10 relative inline-block">
            <div className="absolute inset-0 bg-yellow-500/20 blur-2xl animate-pulse rounded-full"></div>
            <img src={LOGO_PATH} alt="Police Badge" className="w-48 h-48 mx-auto relative drop-shadow-[0_10px_20px_rgba(255,215,0,0.4)] transition-transform hover:scale-105 duration-500" />
          </div>
          
          <h1 className={`text-6xl mb-4 leading-tight ${GOLDEN_TITLE_STYLE}`}>{t.appName}</h1>
          <p className="text-indigo-300 font-bold text-sm mb-6 leading-tight uppercase tracking-[3px] font-black">{t.developedBy}</p>
          <div className="h-1 w-20 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mb-6"></div>
          <p className="text-gray-400 italic text-[10px] mb-12 opacity-80 font-black tracking-widest uppercase">"{t.motto}"</p>
          
          <form onSubmit={handleLogin} className="space-y-6 text-left">
            <div className="group">
              <input type="text" placeholder={t.username} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:ring-4 focus:ring-indigo-500/30 outline-none transition-all placeholder:text-gray-600 font-bold text-lg" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} required />
            </div>
            <div className="group">
              <input type="password" placeholder={t.password} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:ring-4 focus:ring-indigo-500/30 outline-none transition-all placeholder:text-gray-600 font-bold text-lg" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required />
            </div>
            <button className="w-full bg-gradient-to-r from-[#B8860B] via-[#FFD700] to-[#B8860B] hover:scale-[1.02] active:scale-95 text-indigo-950 font-black py-5 rounded-2xl shadow-[0_10px_30px_rgba(255,215,0,0.2)] transition-all transform text-xl tracking-widest uppercase mt-6 border-b-4 border-black/20">
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

  if (view === 'setupHotel' && user.role === UserRole.RECEPTION) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4">
        <div className="bg-white p-14 md:p-20 rounded-[5rem] shadow-2xl w-full max-w-2xl border border-slate-100 animate-in zoom-in-95 duration-500 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0"></div>
           <div className="text-center mb-14 relative z-10">
              <div className="w-28 h-28 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner ring-8 ring-indigo-50">
                <Building2 size={56} />
              </div>
              <h2 className={`text-5xl font-black mb-6 ${GOLDEN_TITLE_STYLE}`}>{t.setupHotel}</h2>
              <p className="text-slate-500 font-bold max-w-sm mx-auto leading-relaxed text-lg">{t.setupWelcome}</p>
           </div>
           <form onSubmit={handleSetupSubmit} className="space-y-10 relative z-10">
              <FormInput label={t.hotel} value={hotelProfile.name} onChange={v => setHotelProfile({...hotelProfile, name: v})} icon={<Building2 size={28}/>} required />
              <FormInput label={t.hotelAddress} value={hotelProfile.address} onChange={v => setHotelProfile({...hotelProfile, address: v})} icon={<Globe size={28}/>} required />
              <FormInput label={t.receptionistName} value={hotelProfile.receptionistName} onChange={v => setHotelProfile({...hotelProfile, receptionistName: v})} icon={<Users size={28}/>} required />
              <button className="w-full bg-gradient-to-r from-[#B8860B] via-[#FFD700] to-[#B8860B] text-indigo-950 font-black py-8 rounded-[3rem] shadow-2xl shadow-yellow-100 transition-all uppercase tracking-[8px] text-2xl flex items-center justify-center gap-6 group hover:scale-[1.02] active:scale-95 border-b-4 border-black/10">
                {t.save} & {t.submit} <ChevronRight size={32} className="group-hover:translate-x-3 transition-transform" />
              </button>
           </form>
           <div className="mt-16 pt-10 border-t border-slate-100 text-center opacity-40">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[8px]">{t.developedBy}</p>
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
          <img src={LOGO_PATH} className="w-28 h-28 mx-auto mb-8 drop-shadow-[0_10px_20px_rgba(255,215,0,0.3)] hover:scale-110 transition-transform duration-500" alt="Sidebar Logo" />
          <h1 className={`text-3xl leading-tight mb-2 ${GOLDEN_TITLE_STYLE}`}>{t.appName}</h1>
          <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[4px] leading-tight opacity-70">{t.developedBy}</p>
        </div>
        <nav className="flex-1 p-8 space-y-4 overflow-y-auto custom-scrollbar">
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
        <div className="p-10 border-t border-white/5 space-y-6">
           <p className="text-[10px] text-indigo-400 font-black text-center uppercase tracking-[5px] italic opacity-40">"{t.motto}"</p>
           <button onClick={handleLogout} className="flex items-center justify-center gap-4 w-full py-5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-[1.5rem] transition-all font-black text-xs uppercase shadow-xl hover:shadow-red-900/40">
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

        <main className="p-10 md:p-16 max-w-7xl mx-auto animate-in fade-in duration-1000">
          {zoomImg && (
            <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-8 transition-opacity duration-500" onClick={() => setZoomImg(null)}>
               <button className="absolute top-12 right-12 text-white bg-white/10 p-6 rounded-full hover:bg-white/30 transition-all border-2 border-white/20 shadow-2xl"><X size={48} /></button>
               <img src={zoomImg} alt="Zoomed View" className="max-w-full max-h-[80vh] rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] border-[6px] border-white/10 object-contain transition-transform duration-500 scale-100 hover:scale-[1.02]" />
               <p className={`text-4xl mt-16 tracking-[10px] ${GOLDEN_TITLE_STYLE}`}>{t.zoomImage}</p>
            </div>
          )}

          {view === 'hotelDirectory' && user.role === UserRole.POLICE && (
            <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-10 duration-700">
               <div className="p-12 border-b flex justify-between items-center bg-slate-50/50">
                 <div>
                   <h3 className={`text-4xl uppercase tracking-[5px] ${GOLDEN_TITLE_STYLE}`}>{t.hotelDirectory}</h3>
                   <p className="text-[12px] font-black text-indigo-400 uppercase tracking-[6px] mt-4 opacity-50">Authorized Regional Security Audit Feed</p>
                 </div>
                 <div className="flex gap-6">
                   <button onClick={() => window.print()} className="flex items-center gap-4 px-8 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] text-[12px] font-black uppercase shadow-lg hover:bg-slate-50 transition-all tracking-widest"><Printer size={24}/> {t.print}</button>
                   <button className="flex items-center gap-4 px-8 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] text-[12px] font-black uppercase shadow-lg hover:bg-slate-50 transition-all tracking-widest"><Download size={24}/> {t.download}</button>
                 </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[12px] font-black uppercase text-slate-400 border-b">
                      <tr>
                        <th className="px-12 py-10 tracking-[5px]">{t.hotel}</th>
                        <th className="px-12 py-10 tracking-[5px]">{t.hotelAddress}</th>
                        <th className="px-12 py-10 tracking-[5px]">{t.receptionistName}</th>
                        <th className="px-12 py-10 tracking-[5px]">Surveillance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allHotels.map((h, i) => (
                        <tr key={i} className="hover:bg-indigo-50/20 transition-all group cursor-default">
                          <td className="px-12 py-10 font-black text-slate-800 text-2xl uppercase tracking-tighter group-hover:translate-x-3 transition-transform duration-500">{h.name}</td>
                          <td className="px-12 py-10 text-base text-slate-500 font-bold uppercase tracking-tight">{h.address}</td>
                          <td className="px-12 py-10 text-base text-slate-500 font-bold uppercase tracking-tight">{h.receptionistName}</td>
                          <td className="px-12 py-10">
                            <span className="px-8 py-3 bg-emerald-100 text-emerald-700 rounded-full text-[11px] font-black uppercase border-2 border-emerald-200 flex items-center gap-3 w-fit shadow-xl shadow-emerald-100/50">
                              <ShieldCheck size={18} /> Active / ንቁ
                            </span>
                          </td>
                        </tr>
                      ))}
                      {allHotels.length === 0 && (
                        <tr><td colSpan={4} className="p-40 text-center font-black uppercase text-slate-200 tracking-[15px] opacity-40">No Regional Digital Profile Records Found</td></tr>
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          )}

          {view === 'utility' && (
             <div className="bg-white p-20 rounded-[5rem] shadow-2xl border border-slate-100 max-w-5xl mx-auto space-y-16 animate-in slide-in-from-bottom-14 duration-1000 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-50/50 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="text-center relative z-10">
                   <div className="w-32 h-32 bg-indigo-50 text-indigo-600 rounded-[3rem] flex items-center justify-center mx-auto mb-12 shadow-inner ring-[12px] ring-indigo-50/50"><Info size={64} /></div>
                   <h3 className={`text-5xl uppercase tracking-[15px] ${GOLDEN_TITLE_STYLE}`}>{t.appUtility}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10">
                   <div className="space-y-8 p-12 bg-slate-50 rounded-[4rem] border border-slate-100 shadow-inner group hover:bg-white hover:shadow-2xl transition-all duration-700">
                      <h4 className="text-3xl font-black uppercase text-indigo-600 border-b-4 border-indigo-100 pb-4 tracking-widest italic">አማርኛ</h4>
                      <p className="text-slate-600 leading-relaxed font-bold text-xl">
                        ይህ "ቤጉ እንግዳ" አፕልኬሽን በቤንሻንጉል ጉምዝ ክልል ፖሊስ ኮሚሽን የዳበረ ሲሆን፣ በክልሉ ውስጥ ያሉ ማንኛውም ሆቴሎች እንግዶችን በዘመናዊ መልኩ እንዲመዘግቡ እና መረጃውን ለፖሊስ በቀጥታ እንዲያስተላልፉ ይረዳል። ይህም የወንጀል መከላከያ ስራን ይበልጥ ቀልጣፋ ያደርገዋል። ፖሊሱም የትኛው እንግዳ በየትኛው ሆቴል እንዳለ ወዲያውኑ ማየት ይችላል።
                      </p>
                   </div>
                   <div className="space-y-8 p-12 bg-slate-50 rounded-[4rem] border border-slate-100 shadow-inner group hover:bg-white hover:shadow-2xl transition-all duration-700">
                      <h4 className="text-3xl font-black uppercase text-indigo-600 border-b-4 border-indigo-100 pb-4 tracking-widest italic">English</h4>
                      <p className="text-slate-600 leading-relaxed font-bold text-xl">
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
            <div className="max-w-3xl mx-auto bg-white p-16 md:p-20 rounded-[5rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/50 rounded-bl-full -z-0"></div>
              <div className="text-center mb-16 relative z-10">
                <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner"><Settings size={56} /></div>
                <h3 className={`text-4xl uppercase tracking-[10px] ${GOLDEN_TITLE_STYLE}`}>{t.settings}</h3>
                <p className="text-slate-400 font-bold text-[11px] mt-4 uppercase tracking-[6px] opacity-60">System Configuration Hub</p>
              </div>
              <form onSubmit={handleSetupSubmit} className="space-y-12 relative z-10">
                 <FormInput label={t.hotel} value={hotelProfile.name} onChange={v => setHotelProfile({...hotelProfile, name: v})} icon={<Building2 size={32}/>} required />
                 <FormInput label={t.hotelAddress} value={hotelProfile.address} onChange={v => setHotelProfile({...hotelProfile, address: v})} icon={<Globe size={32}/>} required />
                 <FormInput label={t.receptionistName} value={hotelProfile.receptionistName} onChange={v => setHotelProfile({...hotelProfile, receptionistName: v})} icon={<Users size={32}/>} required />
                 <button className="w-full bg-gradient-to-r from-[#B8860B] via-[#FFD700] to-[#B8860B] text-indigo-950 font-black py-8 rounded-[3rem] shadow-2xl shadow-yellow-100 uppercase tracking-[10px] text-2xl hover:shadow-yellow-200/50 transition-all border-b-4 border-black/10 active:scale-95 transform">Update Configuration</button>
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
    <button onClick={onClick} className={`w-full flex items-center gap-6 px-10 py-6 rounded-[2rem] transition-all duration-500 group relative ${active ? 'bg-white text-indigo-950 shadow-[0_15px_40px_rgba(255,255,255,0.15)] scale-[1.08]' : 'text-indigo-200/50 hover:bg-white/5 hover:text-white'}`}>
      <span className={`${active ? 'text-indigo-600' : 'opacity-40 group-hover:scale-125 transition-transform duration-500'}`}>{icon}</span>
      <span className="font-black text-[13px] tracking-[3px] uppercase flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="px-4 py-1.5 bg-red-600 text-white text-[11px] font-black rounded-full animate-pulse ring-8 ring-red-900/10 shadow-2xl">{count}</span>
      )}
      {active && <div className="absolute right-4 w-2 h-8 bg-indigo-600 rounded-full"></div>}
    </button>
  );
}

function FormInput({ label, value, onChange, type = "text", required, disabled, icon }: { label: string, value: string, onChange?: (v: string) => void, type?: string, required?: boolean, disabled?: boolean, icon: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <label className="text-[12px] font-black text-slate-400 uppercase tracking-[6px] ml-2">{label}</label>
      <div className="relative group">
        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-indigo-600 duration-500">{icon}</div>
        <input type={type} className={`w-full bg-slate-50 border-[3px] border-slate-100 rounded-[2rem] pl-20 pr-10 py-6 outline-none transition-all font-bold text-slate-800 text-xl focus:border-indigo-400 focus:bg-white focus:ring-[15px] focus:ring-indigo-50/50 ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`} value={value} onChange={e => onChange?.(e.target.value)} required={required} disabled={disabled} />
      </div>
    </div>
  );
}

function DashboardView({ user, t, guests, wanted, notifications, setView }: { user: any, t: any, guests: Guest[], wanted: WantedPerson[], notifications: Notification[], setView: (v: string) => void }) {
  const stats = [
    { label: t.guestList, value: guests.length, icon: <Users size={36}/>, color: 'bg-indigo-600' },
    { label: t.wantedPersons, value: wanted.length, icon: <AlertTriangle size={36}/>, color: 'bg-red-600' },
    { label: t.notifications, value: notifications.length, icon: <Bell size={36}/>, color: 'bg-amber-500' },
    { label: t.reports, value: 'Live', icon: <FileBarChart size={36}/>, color: 'bg-emerald-600' },
  ];
  return (
    <div className="space-y-16 animate-in fade-in duration-1000">
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 md:gap-14">
         {stats.map((s, i) => (
           <div key={i} className="bg-white p-12 md:p-14 rounded-[4rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-4 transition-all duration-700 cursor-pointer group overflow-hidden relative" onClick={() => {
              if (s.label === t.guestList) setView('guestList');
              if (s.label === t.wantedPersons) setView('wantedPersons');
              if (s.label === t.notifications) setView('notifications');
              if (s.label === t.reports) setView('reports');
           }}>
             <div className={`${s.color} absolute -top-16 -right-16 w-40 h-40 opacity-[0.03] group-hover:scale-150 transition-transform duration-1000`}></div>
             <div className={`${s.color} w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-2xl mb-12 group-hover:scale-125 group-hover:rotate-[10deg] transition-all duration-700`}>{s.icon}</div>
             <p className="text-[12px] font-black text-slate-400 uppercase tracking-[5px] mb-4 font-black leading-none opacity-60">{s.label}</p>
             <p className="text-6xl font-black text-slate-800 tracking-tighter leading-none">{s.value}</p>
           </div>
         ))}
       </div>
       <div className="grid grid-cols-1 xl:grid-cols-3 gap-16">
          <div className="xl:col-span-2 bg-white p-16 rounded-[5rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-16">
               <h3 className="text-3xl font-black uppercase tracking-[8px] flex items-center gap-6"><FileBarChart className="text-indigo-600" size={48} /> Command Metrics</h3>
               <span className="text-[11px] font-black text-indigo-400 uppercase bg-indigo-50 px-6 py-2.5 rounded-2xl tracking-[5px] border border-indigo-100 italic">Regional Telemetry Feed</span>
            </div>
            <div className="h-[550px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={[ {n: 'Mon', v: 4}, {n: 'Tue', v: 7}, {n: 'Wed', v: 5}, {n: 'Thu', v: 9}, {n: 'Fri', v: 12}, {n: 'Sat', v: 15}, {n: 'Sun', v: 8} ]}>
                   <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 900, fill: '#64748b'}} dy={20} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 900, fill: '#64748b'}} />
                   <Tooltip cursor={{fill: '#f8fafc', radius: 20}} contentStyle={{borderRadius: '35px', border: 'none', boxShadow: '0 40px 100px rgba(0,0,0,0.15)', padding: '30px', fontWeight: 'bold'}} />
                   <Bar dataKey="v" fill="url(#goldGradient)" radius={[25, 25, 0, 0]} />
                   <defs>
                      <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#B8860B" />
                      </linearGradient>
                   </defs>
                 </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-16 rounded-[5rem] shadow-sm border border-slate-100 flex flex-col">
             <h3 className="text-3xl font-black uppercase tracking-[8px] mb-14 flex items-center gap-6"><Bell className="text-red-600" size={48} /> Security Terminal</h3>
             <div className="flex-1 space-y-8 overflow-y-auto pr-4 custom-scrollbar">
                {notifications.slice(0, 5).map(n => (
                  <div key={n.id} className="p-8 bg-red-50/50 rounded-[3rem] border-2 border-red-50 group hover:bg-red-50 hover:border-red-300 hover:shadow-2xl transition-all duration-500 cursor-pointer relative overflow-hidden">
                    <div className="flex justify-between items-center mb-5">
                      <p className="text-[11px] font-black text-red-600 uppercase tracking-[4px]">{n.timestamp}</p>
                      <ShieldAlert size={20} className="text-red-500 group-hover:scale-150 group-hover:rotate-12 transition-transform duration-500" />
                    </div>
                    <p className="text-lg font-black text-slate-800 uppercase leading-tight group-hover:underline tracking-tight">{n.title}</p>
                    <p className="text-[11px] text-red-700 font-black opacity-60 mt-4 tracking-[6px] uppercase border-t-2 border-red-100 pt-4">Intercept Signal Detected</p>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center py-32 opacity-20 group">
                    <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner group-hover:scale-110 duration-700"><CheckCircle2 size={72} className="text-slate-200" /></div>
                    <p className="text-[13px] font-black uppercase tracking-[15px] leading-none text-slate-400">Regional Clear</p>
                  </div>
                )}
             </div>
             <button onClick={() => setView('registerGuest')} className="mt-14 w-full py-8 bg-gradient-to-r from-indigo-900 to-indigo-700 text-white rounded-[2.5rem] text-[12px] font-black uppercase tracking-[6px] shadow-2xl hover:shadow-indigo-300/50 transition-all transform active:scale-95 border-b-4 border-black/20">Digital Ingress Registry</button>
          </div>
       </div>
    </div>
  );
}

function GuestListView({ guests, t, setZoomImg, startEdit, searchTerm, setSearchTerm }: { guests: Guest[], t: any, setZoomImg: any, startEdit: any, searchTerm: string, setSearchTerm: any }) {
  return (
    <div className="bg-white rounded-[5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in duration-1000">
       <div className="p-14 md:p-20 border-b flex flex-col md:flex-row gap-12 justify-between items-center bg-slate-50/50">
          <div>
            <h3 className={`text-5xl leading-none ${GOLDEN_TITLE_STYLE}`}>{t.guestList}</h3>
            <p className="text-[13px] font-black text-indigo-400 uppercase tracking-[8px] mt-6 opacity-40 italic">State Judicial Digital Ledger</p>
          </div>
          <div className="relative w-full md:w-[600px] group">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors duration-500" size={32} />
            <input type="text" placeholder={t.searchPlaceholder} className="w-full pl-20 pr-10 py-7 bg-white border-[3px] border-slate-100 rounded-[2.5rem] outline-none focus:border-indigo-400 focus:ring-[20px] focus:ring-indigo-50/50 font-bold text-xl shadow-inner transition-all duration-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
       </div>
       <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-slate-50 text-[13px] font-black uppercase text-slate-400 border-b">
               <tr>
                 <th className="px-16 py-12 tracking-[6px]">{t.idPhoto}</th>
                 <th className="px-16 py-12 tracking-[6px]">{t.fullName}</th>
                 <th className="px-16 py-12 tracking-[6px]">{t.hotel}</th>
                 <th className="px-16 py-12 tracking-[6px]">Status</th>
                 <th className="px-16 py-12 tracking-[6px] no-print text-center">{t.edit}</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {guests.map(g => (
                 <tr key={g.id} className="hover:bg-indigo-50/40 transition-all group duration-500">
                    <td className="px-16 py-10">
                      <div className="w-28 h-36 rounded-[2.5rem] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.15)] border-[6px] border-white ring-2 ring-slate-100 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-700 cursor-zoom-in relative" onClick={() => setZoomImg(g.idPhoto)}>
                        <img src={g.idPhoto} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    </td>
                    <td className="px-16 py-10">
                      <p className="font-black text-slate-800 uppercase text-3xl tracking-tighter leading-none group-hover:translate-x-3 transition-transform duration-700">{g.fullName}</p>
                      <div className="flex items-center gap-4 mt-5">
                        <Globe size={20} className="text-indigo-400 opacity-60" />
                        <p className="text-sm font-black text-slate-400 uppercase tracking-[4px]">{g.nationality} • RM {g.roomNumber}</p>
                      </div>
                    </td>
                    <td className="px-16 py-10">
                       <div className="flex items-center gap-4 mb-3">
                          <Building2 size={24} className="text-indigo-400 opacity-40" />
                          <p className="text-xl font-black text-slate-600 uppercase tracking-tighter">{g.hotelName}</p>
                       </div>
                       <div className="flex items-center gap-4 opacity-40">
                          <MapPin size={18} className="text-slate-300" />
                          <p className="text-[12px] text-slate-400 uppercase font-bold tracking-[3px]">{g.hotelAddress}</p>
                       </div>
                    </td>
                    <td className="px-16 py-10">
                       {g.isWanted ? (
                         <span className="px-8 py-4 bg-red-600 text-white text-[12px] font-black rounded-full uppercase flex items-center gap-4 w-fit animate-pulse border-[4px] border-white shadow-2xl shadow-red-200 tracking-[3px]">
                            <AlertTriangle size={24}/> Wanted / ተፈላጊ
                         </span>
                       ) : (
                         <span className="px-8 py-4 bg-emerald-500 text-white text-[12px] font-black rounded-full uppercase flex items-center gap-4 w-fit border-[4px] border-white shadow-2xl shadow-emerald-100 tracking-[3px]">
                            <CheckCircle2 size={24}/> Clear / ንፁህ
                         </span>
                       )}
                    </td>
                    <td className="px-16 py-10 no-print text-center">
                       <button onClick={() => startEdit(g)} className="p-7 bg-white border-2 border-slate-100 text-indigo-600 rounded-[2.5rem] hover:bg-indigo-600 hover:text-white transition-all shadow-xl hover:rotate-[15deg] active:scale-90"><Edit size={32}/></button>
                    </td>
                 </tr>
               ))}
             </tbody>
          </table>
          {guests.length === 0 && (
            <div className="p-48 text-center opacity-5">
               <Search size={180} className="mx-auto mb-14" />
               <p className="text-6xl font-black uppercase tracking-[40px] leading-none">EMPTY</p>
            </div>
          )}
       </div>
    </div>
  );
}

function GuestFormView({ newGuest, setNewGuest, hotelProfile, saveGuest, t, setZoomImg, handleFileUpload, editingGuestId, setEditingGuestId, setView }: any) {
  return (
    <div className="max-w-5xl mx-auto bg-white p-20 rounded-[6rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-700 relative overflow-hidden">
       <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-50/50 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2 -z-0"></div>
       <div className="flex justify-between items-start mb-20 relative z-10">
          <div>
             <h3 className={`text-5xl leading-none mb-6 ${GOLDEN_TITLE_STYLE}`}>{editingGuestId ? t.edit : t.registerGuest}</h3>
             <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[8px] opacity-40">Regional Compliance Monitoring Division</p>
          </div>
          {editingGuestId && <button onClick={() => { setEditingGuestId(null); setView('guestList'); }} className="p-6 bg-slate-50 text-slate-400 hover:bg-slate-200 rounded-[2rem] transition-all shadow-inner"><X size={40}/></button>}
       </div>
       <form onSubmit={saveGuest} className="space-y-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-14">
             <FormInput label={t.fullName} value={newGuest.fullName} onChange={(v: string) => setNewGuest({...newGuest, fullName: v})} required icon={<Users size={32}/>} />
             <FormInput label={t.nationality} value={newGuest.nationality} onChange={(v: string) => setNewGuest({...newGuest, nationality: v})} required icon={<Globe size={32}/>} />
             <FormInput label={t.roomNumber} value={newGuest.roomNumber} onChange={(v: string) => setNewGuest({...newGuest, roomNumber: v})} required icon={<Building2 size={32}/>} />
             <FormInput label={t.hotel} value={hotelProfile.name} disabled icon={<Building2 size={32}/>} />
          </div>
          <div className="space-y-10">
             <label className="text-[14px] font-black text-slate-400 uppercase tracking-[10px] ml-4">{t.idPhoto}</label>
             <div className="flex flex-col lg:flex-row items-center gap-16 bg-slate-50/50 p-16 rounded-[5rem] border-[6px] border-dashed border-slate-100 hover:border-indigo-200 hover:bg-white transition-all group duration-700">
                <div className="w-56 h-72 bg-white rounded-[4rem] border-[8px] border-white shadow-[0_30px_60px_rgba(0,0,0,0.15)] overflow-hidden flex items-center justify-center cursor-zoom-in group-hover:scale-105 group-hover:-rotate-3 transition-all duration-700" onClick={() => newGuest.idPhoto && setZoomImg(newGuest.idPhoto)}>
                  {newGuest.idPhoto ? <img src={newGuest.idPhoto} className="w-full h-full object-cover" /> : <Camera size={80} className="text-slate-100" />}
                </div>
                <div className="flex-1 w-full space-y-8">
                   <label className="block w-full text-center py-10 bg-gradient-to-r from-indigo-900 to-indigo-700 text-white rounded-[3rem] font-black text-sm uppercase cursor-pointer hover:shadow-2xl shadow-indigo-100 transition-all transform active:scale-95 border-b-4 border-black/20"><Camera className="inline mr-5" size={32}/> {t.capturePhoto} <input type="file" capture="environment" className="hidden" onChange={e => handleFileUpload(e, 'guest')} /></label>
                   <label className="block w-full text-center py-10 bg-white border-[3px] border-slate-100 text-slate-600 rounded-[3rem] font-black text-sm uppercase cursor-pointer hover:bg-slate-50 transition-all shadow-md transform active:scale-95"><ImageIcon className="inline mr-5" size={32}/> {t.fromGallery} <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'guest')} /></label>
                </div>
             </div>
          </div>
          <button className="w-full bg-gradient-to-r from-[#B8860B] via-[#FFD700] to-[#B8860B] text-indigo-950 font-black py-10 rounded-[4rem] shadow-2xl shadow-yellow-100 uppercase tracking-[15px] text-3xl transition-all transform active:scale-[0.98] mt-16 border-b-8 border-black/10">{editingGuestId ? t.save : t.submit}</button>
       </form>
    </div>
  );
}

function WantedPersonsView({ wanted, t, setZoomImg }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16 animate-in fade-in duration-1000">
       {wanted.map((w: WantedPerson) => (
         <div key={w.id} className="bg-white rounded-[5rem] shadow-[0_30px_80px_rgba(0,0,0,0.08)] overflow-hidden border-2 border-red-50 hover:border-red-600 transition-all duration-1000 group relative transform hover:-translate-y-6">
            <div className="h-[450px] relative overflow-hidden">
              <img src={w.photo} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-[2000ms]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent opacity-90"></div>
              <div className="absolute top-10 left-10 bg-red-600 text-white px-8 py-3.5 rounded-[1.8rem] text-[12px] font-black uppercase shadow-2xl border-2 border-white/20 tracking-[6px] italic">WANTED / ተፈላጊ</div>
              <button onClick={() => setZoomImg(w.photo)} className="absolute bottom-10 right-10 p-6 bg-white/10 backdrop-blur-2xl rounded-[1.8rem] text-white hover:bg-white/40 transition-all border-2 border-white/20 shadow-2xl"><Maximize2 size={40}/></button>
            </div>
            <div className="p-14 space-y-8">
              <h4 className="text-5xl font-black uppercase text-slate-800 tracking-tighter leading-none group-hover:text-red-700 transition-colors duration-500">{w.fullName}</h4>
              <p className="text-[14px] text-red-600 font-black uppercase tracking-[6px] inline-block px-6 py-3 bg-red-50 rounded-2xl border-2 border-red-100 italic shadow-sm">INCIDENT: {w.crime}</p>
              <p className="text-xl text-slate-500 italic font-bold leading-relaxed border-l-[10px] border-red-600 pl-8 py-5 bg-red-50/40 rounded-r-[3rem] line-clamp-3 shadow-inner">"{w.description}"</p>
              <div className="mt-14 pt-14 border-t border-slate-100 flex justify-between items-center">
                 <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[5px] leading-none mb-4 opacity-40">State Inscription Date</span>
                    <span className="text-xl font-black text-slate-700 tracking-tighter">{w.postedDate}</span>
                 </div>
                 <button onClick={() => setZoomImg(w.photo)} className="px-12 py-6 bg-[#020617] text-white rounded-[2.5rem] text-[12px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-2xl active:scale-95 border-b-4 border-white/10 italic">Audit Profile</button>
              </div>
            </div>
         </div>
       ))}
    </div>
  );
}

function AddWantedView({ newWanted, setNewWanted, addWanted, t, handleFileUpload, setZoomImg }: any) {
  return (
    <div className="max-w-3xl mx-auto bg-white p-20 rounded-[5.5rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-700 relative overflow-hidden">
       <div className="absolute top-0 right-0 w-64 h-64 bg-red-50/50 blur-[80px] rounded-full -translate-x-1/2 -translate-y-1/2 -z-0"></div>
       <div className="text-center mb-16 relative z-10">
          <div className="w-24 h-24 bg-red-100 text-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner ring-[12px] ring-red-50"><AlertTriangle size={64} /></div>
          <h3 className="text-4xl font-black uppercase tracking-[6px] text-red-600 mb-4">{t.policeNotice}</h3>
          <p className="text-slate-400 font-bold text-[12px] uppercase tracking-[8px] opacity-40 italic">Digital Criminal Registry Hub</p>
       </div>
       <form onSubmit={addWanted} className="space-y-12 relative z-10">
          <FormInput label={t.fullName} value={newWanted.fullName} onChange={(v: string) => setNewWanted({...newWanted, fullName: v})} required icon={<Users size={32}/>} />
          <FormInput label={t.crime} value={newWanted.crime} onChange={(v: string) => setNewWanted({...newWanted, crime: v})} required icon={<AlertTriangle size={32}/>} />
          <FormInput label={t.description} value={newWanted.description} onChange={(v: string) => setNewWanted({...newWanted, description: v})} icon={<FileText size={32}/>} />
          <div className="space-y-10">
             <label className="text-[14px] font-black text-slate-400 uppercase tracking-[10px] ml-4">{t.idPhoto}</label>
             <div className="flex items-center gap-16 bg-red-50/30 p-14 rounded-[4.5rem] border-[6px] border-dashed border-red-100 group transition-all duration-700">
                <div className="w-40 h-40 bg-white rounded-[3rem] border-[10px] border-white shadow-2xl overflow-hidden flex items-center justify-center cursor-zoom-in group-hover:scale-110 transition-all duration-700" onClick={() => newWanted.photo && setZoomImg(newWanted.photo)}>
                  {newWanted.photo ? <img src={newWanted.photo} className="w-full h-full object-cover" /> : <ImageIcon size={72} className="text-red-100" />}
                </div>
                <label className="flex-1 block w-full text-center py-9 bg-white border-4 border-red-100 text-red-600 rounded-[2.5rem] font-black text-sm uppercase cursor-pointer hover:bg-red-100 transition-all shadow-md tracking-[5px] active:scale-95">Upload Evidence Image <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'wanted')} /></label>
             </div>
          </div>
          <button className="w-full bg-gradient-to-r from-red-800 to-red-600 text-white font-black py-10 rounded-[3.5rem] shadow-2xl shadow-red-200 uppercase tracking-[12px] text-3xl transition-all transform active:scale-95 mt-12 border-b-8 border-black/20">Publish Judicial Bulletin</button>
       </form>
    </div>
  );
}

function ReportView({ t, guests, userRole }: { t: any, guests: Guest[], userRole: UserRole }) {
  return (
    <div className="space-y-16 animate-in fade-in duration-1000">
       <div className="bg-white p-20 md:p-32 rounded-[6rem] shadow-2xl border-[10px] border-slate-50 text-center space-y-20 relative overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-50/50 blur-[150px] rounded-full"></div>
          <div className="flex flex-col items-center relative z-10">
             <div className="w-32 h-32 bg-indigo-50 text-indigo-600 rounded-[3.5rem] flex items-center justify-center mb-12 shadow-inner ring-[15px] ring-indigo-50/50"><FileBarChart size={72} /></div>
             <h3 className={`text-5xl uppercase tracking-[12px] leading-tight ${GOLDEN_TITLE_STYLE}`}>{userRole === UserRole.POLICE ? "Regional Command Oversight Feed" : "Property Activity Audit Ledger"}</h3>
             <p className="text-indigo-400 font-black text-[13px] uppercase tracking-[8px] mt-6 opacity-40 italic">State Judicial Digital Archive Synchronization</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
             <ReportButton icon={<Download size={48}/>} label="Excel (.xlsx)" color="bg-emerald-800" />
             <ReportButton icon={<FileText size={48}/>} label="Word (.docx)" color="bg-blue-900" />
             <ReportButton icon={<PieChartIcon size={48}/>} label="PPT (.pptx)" color="bg-orange-800" />
             <ReportButton icon={<Printer size={48}/>} label="Judicial PDF" color="bg-slate-900" />
          </div>
          
          <div className="mt-32 pt-24 border-t-[8px] border-double border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-24 text-left no-print relative z-10">
             <div className="space-y-10">
                <p className="text-[14px] font-black text-slate-400 uppercase tracking-[6px] leading-none mb-4 opacity-50">Authority Inspector</p>
                <div className="h-0.5 bg-slate-200 w-full mb-3 shadow-inner"></div>
                <p className="text-base text-slate-400 font-black uppercase tracking-[4px] opacity-30 italic leading-none">{t.supervisorName}</p>
             </div>
             <div className="space-y-10 text-center">
                <p className="text-[14px] font-black text-slate-400 uppercase tracking-[6px] leading-none mb-4 opacity-50">{t.date}</p>
                <p className={`text-3xl font-black italic tracking-[6px] ${GOLDEN_TITLE_STYLE}`}>{new Date().toLocaleDateString()}</p>
             </div>
             <div className="space-y-10 text-right">
                <p className="text-[14px] font-black text-slate-400 uppercase tracking-[6px] leading-none mb-4 opacity-50">State Oversight Seal</p>
                <div className="h-0.5 bg-slate-200 w-full mb-3 shadow-inner"></div>
                <p className="text-base text-slate-400 font-black uppercase tracking-[4px] opacity-30 italic leading-none">{t.signature}</p>
             </div>
          </div>
       </div>
    </div>
  );
}

function ReportButton({ icon, label, color }: any) {
  return (
    <button className={`${color} text-white p-14 rounded-[4rem] flex flex-col items-center gap-10 hover:scale-[1.15] active:scale-95 transition-all duration-700 shadow-[0_30px_60px_rgba(0,0,0,0.1)] relative group overflow-hidden border-b-8 border-black/20`}>
      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      <div className="bg-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl group-hover:rotate-[20deg] transition-transform duration-700 border border-white/10">{icon}</div>
      <span className="text-[13px] font-black uppercase tracking-[5px] font-black text-center leading-tight">{label}</span>
    </button>
  );
}

function NotificationsView({ notifications, setView, t }: any) {
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-bottom-16 duration-1000">
       <div className="flex items-center gap-8 mb-12 px-8">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center shadow-inner ring-[10px] ring-indigo-50 group hover:scale-110 transition-transform duration-700"><Bell size={48} /></div>
          <h3 className={`text-5xl tracking-[8px] ${GOLDEN_TITLE_STYLE}`}>Critical Alerts</h3>
       </div>
       {notifications.map((n: any) => (
         <div key={n.id} className="p-14 bg-white rounded-[5rem] border-l-[30px] border-red-600 shadow-[0_30px_100px_rgba(0,0,0,0.1)] flex gap-14 group hover:-translate-x-6 transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-60 h-60 bg-red-600/5 rounded-bl-[15rem] -z-0"></div>
            <div className="w-28 h-28 bg-red-600 text-white rounded-[2.5rem] flex items-center justify-center shrink-0 shadow-2xl shadow-red-200 border-[6px] border-white relative z-10 group-hover:scale-110 transition-transform duration-700"><AlertTriangle size={56}/></div>
            <div className="flex-1 relative z-10">
              <div className="flex justify-between items-start mb-6">
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-[6px] font-black leading-none opacity-60">{n.timestamp}</p>
                <span className="px-6 py-2 bg-red-50 text-red-600 text-[11px] font-black rounded-full uppercase border-2 border-red-100 shadow-sm animate-pulse tracking-widest italic">Action Required</span>
              </div>
              <h4 className="text-4xl font-black text-red-950 uppercase leading-tight mt-3 group-hover:underline transition-all font-black tracking-tight">{n.title}</h4>
              <p className="text-2xl text-slate-600 font-bold mt-8 leading-relaxed opacity-70">Detection Log: {n.message}</p>
              <div className="mt-12 flex gap-8">
                 <button onClick={() => setView('guestList')} className="px-12 py-5 bg-red-600 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[5px] shadow-2xl shadow-red-200 hover:bg-red-700 transition-all transform active:scale-95 italic border-b-4 border-black/20">Intercept Target</button>
                 <button className="px-12 py-5 bg-slate-50 text-slate-500 rounded-[2rem] text-[12px] font-black uppercase tracking-[5px] hover:bg-slate-200 transition-all border-2 border-slate-100 transform active:scale-95 italic">Dispatch Patrol Unit</button>
              </div>
            </div>
         </div>
       ))}
       {notifications.length === 0 && (
         <div className="text-center py-56 bg-white rounded-[6rem] border-[8px] border-dashed border-slate-50 flex flex-col items-center group relative overflow-hidden">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-50/20 blur-[150px] rounded-full"></div>
            <div className="w-40 h-40 bg-slate-50 rounded-full flex items-center justify-center mb-16 shadow-inner group-hover:scale-110 transition-transform duration-1000 relative z-10">
               <CheckCircle2 size={80} className="text-slate-200 group-hover:text-emerald-200 transition-colors" />
            </div>
            <p className="text-5xl font-black uppercase tracking-[35px] text-slate-200 leading-none relative z-10 select-none">ALL SECURE</p>
            <p className="text-slate-400 font-bold text-lg uppercase mt-12 opacity-30 tracking-[10px] relative z-10 select-none italic">Continuous State Surveillance Active</p>
         </div>
       )}
    </div>
  );
}
