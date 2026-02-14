
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
  ChevronRight,
  ShieldCheck,
  Search,
  Filter
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

// The logo provided in the prompt
const LOGO_PATH = 'https://raw.githubusercontent.com/Anu-Anu/Begu-Engeda/main/logo.png';

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
  
  const [hotelProfile, setHotelProfile] = useState<HotelProfile>(() => {
    const saved = localStorage.getItem('hotelProfile');
    return saved ? JSON.parse(saved) : { name: 'Assosa Grand Hotel', address: 'Assosa, Benishangul Gumuz', receptionistName: 'Default Admin' };
  });

  const t = translations[lang];

  useEffect(() => localStorage.setItem('guests', JSON.stringify(guests)), [guests]);
  useEffect(() => localStorage.setItem('wanted', JSON.stringify(wanted)), [wanted]);
  useEffect(() => localStorage.setItem('hotelProfile', JSON.stringify(hotelProfile)), [hotelProfile]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.username === 'reception' && loginData.password === '1234') {
      setUser({ role: UserRole.RECEPTION, username: 'reception' });
    } else if (loginData.username === 'police' && loginData.password === '1234') {
      setUser({ role: UserRole.POLICE, username: 'police' });
    } else alert('Invalid credentials / የተሳሳተ መረጃ');
  };

  const handleLogout = () => { setUser(null); setView('dashboard'); setIsSidebarOpen(false); };

  // --- Filtering Logic ---
  const filteredGuests = guests.filter(g => 
    g.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.hotelAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.nationality.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Guest Management ---
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

  // --- Police/Wanted ---
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
        <div className="bg-white/5 backdrop-blur-2xl rounded-[3rem] shadow-2xl p-10 w-full max-w-md border border-white/10">
          <div className="text-center mb-10">
            <div className="relative inline-block mb-6">
              <img src={LOGO_PATH} alt="Police Commission Logo" className="w-32 h-32 rounded-full mx-auto shadow-2xl border-4 border-indigo-500/50 object-contain p-1 bg-white" 
                onError={(e) => { e.currentTarget.src = "https://picsum.photos/seed/police/128/128" }} />
              <div className="absolute -bottom-2 -right-2 bg-indigo-600 p-2 rounded-full border-2 border-[#020617] text-white">
                <ShieldCheck size={20} />
              </div>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">{t.appName}</h1>
            <p className="text-indigo-400 font-black text-lg mb-2 leading-tight uppercase underline decoration-2 underline-offset-4">{t.developedBy}</p>
            <p className="text-gray-400 italic text-sm mt-4 opacity-80">"{t.motto}"</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="text" placeholder={t.username} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-600" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} required />
            <input type="password" placeholder={t.password} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-600" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required />
            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all transform active:scale-95 text-lg tracking-widest uppercase">
              {t.login}
            </button>
          </form>
          <div className="mt-10 flex justify-center gap-6">
            <button onClick={() => setLang('am')} className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${lang === 'am' ? 'bg-white text-indigo-950 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>አማርኛ</button>
            <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${lang === 'en' ? 'bg-white text-indigo-950 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>English</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans">
      {/* Zoom Modal */}
      {zoomImg && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 transition-all duration-300" onClick={() => setZoomImg(null)}>
           <button className="absolute top-8 right-8 text-white bg-white/10 p-4 rounded-full hover:bg-white/20 transition-all border border-white/10"><X size={32} /></button>
           <div className="relative p-2 bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
             <img src={zoomImg} alt="Zoomed Evidence" className="max-w-full max-h-[85vh] rounded-2xl object-contain" />
             <div className="absolute -bottom-12 left-0 right-0 text-center">
               <p className="text-white font-black text-2xl tracking-tighter uppercase drop-shadow-lg">{t.zoomImage}</p>
             </div>
           </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative z-50 w-80 h-full bg-[#0f172a] text-white flex flex-col transition-transform duration-300 no-print shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-10 border-b border-white/5 text-center bg-indigo-950/20">
          <div className="relative inline-block mb-6 group">
            <img src={LOGO_PATH} className="w-24 h-24 rounded-full mx-auto border-4 border-indigo-500/30 shadow-2xl p-1 bg-white object-contain transition-transform duration-500 group-hover:scale-110" alt="Commission Logo" 
              onError={(e) => { e.currentTarget.src = "https://picsum.photos/seed/police/128/128" }} />
            <div className="absolute bottom-0 right-0 bg-indigo-600 p-1.5 rounded-full border-2 border-[#0f172a] shadow-lg">
              <ShieldCheck size={16} />
            </div>
          </div>
          <h1 className="font-black text-2xl tracking-tight mb-2 uppercase">{t.appName}</h1>
          <p className="text-indigo-400 font-black text-sm leading-tight uppercase mb-4 px-2 font-black">{t.developedBy}</p>
          <div className="inline-block px-4 py-1.5 bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">{user.role}</div>
        </div>
        <nav className="flex-1 p-8 space-y-3 overflow-y-auto custom-scrollbar">
          <NavItem icon={<PieChartIcon size={22} />} label={t.dashboard} active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          {user.role === UserRole.RECEPTION && (
            <>
              <NavItem icon={<UserPlus size={22} />} label={t.registerGuest} active={view === 'registerGuest'} onClick={() => setView('registerGuest')} />
              <NavItem icon={<Users size={22} />} label={t.guestList} active={view === 'guestList'} onClick={() => setView('guestList')} />
              <NavItem icon={<Settings size={22} />} label={t.settings} active={view === 'settings'} onClick={() => setView('settings')} />
            </>
          )}
          {user.role === UserRole.POLICE && (
            <>
               <NavItem icon={<Plus size={22} />} label={t.policeNotice} active={view === 'addWanted'} onClick={() => setView('addWanted')} />
               <NavItem icon={<Users size={22} />} label={t.guestList} active={view === 'guestList'} onClick={() => setView('guestList')} />
            </>
          )}
          <NavItem icon={<AlertTriangle size={22} />} label={t.wantedPersons} active={view === 'wantedPersons'} onClick={() => setView('wantedPersons')} />
          <NavItem icon={<FileText size={22} />} label={t.reports} active={view === 'reports'} onClick={() => setView('reports')} />
          <NavItem icon={<Bell size={22} />} label={t.notifications} active={view === 'notifications'} count={notifications.length} onClick={() => setView('notifications')} />
        </nav>
        <div className="p-8 border-t border-white/5 space-y-6">
           <p className="text-[10px] text-indigo-400/60 font-black text-center uppercase tracking-[3px] leading-relaxed font-black">"{t.motto}"</p>
           <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full py-4 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl transition-all font-black text-xs uppercase shadow-lg shadow-red-950/20">
            <LogOut size={20} /> {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 h-screen overflow-y-auto relative bg-[#f1f5f9]">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-10 py-6 flex justify-between items-center no-print shadow-sm">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner hover:bg-indigo-100 transition-all"><Plus size={24} /></button>
          <div className="hidden md:block">
            <div className="flex flex-col">
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter leading-none uppercase">
                {view === 'dashboard' ? t.dashboard : view === 'registerGuest' ? t.registerGuest : view === 'guestList' ? t.guestList : view === 'settings' ? t.settings : view === 'wantedPersons' ? t.wantedPersons : view === 'reports' ? t.reports : t.notifications}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{hotelProfile.name} • {hotelProfile.receptionistName}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={() => setLang(lang === 'am' ? 'en' : 'am')} className="p-3.5 border-2 border-slate-100 bg-white rounded-2xl hover:bg-indigo-50 hover:border-indigo-100 transition-all shadow-sm group">
              <Globe size={22} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </button>
            <div className="h-10 w-px bg-slate-200"></div>
            <div className="flex items-center gap-4 px-5 py-2.5 bg-white rounded-2xl border-2 border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-800 leading-none uppercase">{user.username}</p>
                  <p className="text-[9px] text-indigo-500 font-black uppercase mt-1 tracking-widest">{user.role}</p>
               </div>
               <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-indigo-100 border-2 border-white ring-1 ring-indigo-50">
                {user.username[0].toUpperCase()}
               </div>
            </div>
          </div>
        </header>

        <main className="p-10 max-w-7xl mx-auto animate-in fade-in duration-700">
          {view === 'settings' && (
            <div className="max-w-3xl mx-auto bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 space-y-10 animate-in slide-in-from-bottom-6 duration-500">
              <div className="flex items-center gap-5 pb-6 border-b border-slate-100">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-inner"><Settings size={32} /></div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase tracking-widest">{t.settings}</h3>
                  <p className="text-slate-500 text-sm font-medium">Configure your property and personnel profile.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <FormInput label={t.hotel} value={hotelProfile.name} onChange={v => setHotelProfile({...hotelProfile, name: v})} icon={<ImageIcon size={20}/>} />
                <FormInput label={t.hotelAddress} value={hotelProfile.address} onChange={v => setHotelProfile({...hotelProfile, address: v})} icon={<Globe size={20}/>} />
                <FormInput label={t.receptionistName} value={hotelProfile.receptionistName} onChange={v => setHotelProfile({...hotelProfile, receptionistName: v})} icon={<Users size={20}/>} />
              </div>
              <button onClick={() => setView('dashboard')} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 rounded-2xl shadow-2xl shadow-indigo-100 transition-all uppercase tracking-[3px] text-lg flex items-center justify-center gap-3">
                <Save size={24} /> {t.save}
              </button>
            </div>
          )}

          {view === 'registerGuest' && (
            <div className="max-w-4xl mx-auto bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
               <div className="flex justify-between items-start mb-12">
                 <div className="flex items-center gap-5">
                   <div className="w-16 h-16 bg-indigo-100 rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-inner">
                     <UserPlus size={32} />
                   </div>
                   <div>
                     <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase tracking-widest">{editingGuestId ? t.edit : t.registerGuest}</h3>
                     <p className="text-slate-500 text-sm font-medium">Regional Security Compliance Registration</p>
                   </div>
                 </div>
                 {editingGuestId && <button onClick={() => { setEditingGuestId(null); setView('guestList'); }} className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-2xl transition-all"><X size={24}/></button>}
               </div>

               <form onSubmit={saveGuest} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <FormInput label={t.fullName} value={newGuest.fullName} onChange={v => setNewGuest({...newGuest, fullName: v})} required icon={<Users size={20}/>} />
                    <FormInput label={t.nationality} value={newGuest.nationality} onChange={v => setNewGuest({...newGuest, nationality: v})} required icon={<Globe size={20}/>} />
                    <FormInput label={t.roomNumber} value={newGuest.roomNumber} onChange={v => setNewGuest({...newGuest, roomNumber: v})} required icon={<Plus size={20}/>} />
                    <FormInput label={t.hotel} value={hotelProfile.name} disabled icon={<ImageIcon size={20}/>} />
                  </div>
                  <div className="space-y-6">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-[3px] ml-1">{t.idPhoto}</label>
                    <div className="flex flex-col lg:flex-row gap-10 items-center bg-slate-50/50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 transition-all hover:bg-slate-50 hover:border-indigo-300">
                      <div className="w-56 h-72 bg-white rounded-3xl border-2 border-white shadow-2xl flex items-center justify-center overflow-hidden cursor-zoom-in group relative" onClick={() => newGuest.idPhoto && setZoomImg(newGuest.idPhoto)}>
                        {newGuest.idPhoto ? (
                          <img src={newGuest.idPhoto} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="text-center p-6">
                            <Camera className="text-slate-200 mx-auto mb-4" size={56} />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">Identity Document<br/>Scan Required</p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all"></div>
                      </div>
                      <div className="flex-1 flex flex-col gap-4 w-full">
                        <label className="w-full cursor-pointer flex items-center justify-center gap-4 px-8 py-5 bg-indigo-600 text-white rounded-[1.5rem] hover:bg-indigo-700 font-black shadow-xl shadow-indigo-100 transition-all transform active:scale-[0.98] uppercase tracking-widest">
                          <Camera size={22} /> {t.capturePhoto} 
                          <input type="file" capture="environment" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'guest')} />
                        </label>
                        <label className="w-full cursor-pointer flex items-center justify-center gap-4 px-8 py-5 bg-white border-2 border-slate-200 text-slate-700 rounded-[1.5rem] hover:bg-slate-50 hover:border-slate-300 font-black transition-all transform active:scale-[0.98] uppercase tracking-widest shadow-sm">
                          <ImageIcon size={22} /> {t.fromGallery} 
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'guest')} />
                        </label>
                      </div>
                    </div>
                  </div>
                  <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 rounded-[1.5rem] shadow-2xl shadow-indigo-100 transition-all uppercase tracking-[4px] text-xl mt-6">
                    {editingGuestId ? t.save : t.submit}
                  </button>
               </form>
            </div>
          )}

          {view === 'guestList' && (
            <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in duration-700">
               <div className="p-10 border-b flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 no-print bg-slate-50/30">
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter leading-none uppercase tracking-widest">{t.guestList}</h3>
                    <p className="text-indigo-600 text-xs font-black mt-2 uppercase tracking-[3px] opacity-60">Regional Command Monitoring Feed</p>
                  </div>
                  <div className="flex gap-4 w-full lg:w-auto">
                    {/* Search Bar */}
                    <div className="relative flex-1 lg:w-80">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder={t.searchPlaceholder}
                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-400 transition-all font-bold text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <button onClick={() => window.print()} className="p-4 bg-white border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-3 font-black uppercase text-xs tracking-widest text-slate-600"><Printer size={20}/> {t.print}</button>
                  </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="bg-slate-50 text-slate-400 text-[11px] font-black uppercase tracking-[3px] border-b border-slate-100">
                       <th className="px-10 py-7">{t.idPhoto}</th>
                       <th className="px-10 py-7">{t.fullName}</th>
                       <th className="px-10 py-7">{t.roomNumber}</th>
                       <th className="px-10 py-7">{t.hotel}</th>
                       <th className="px-10 py-7">Compliance Status</th>
                       <th className="px-10 py-7 no-print">{t.edit}</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {filteredGuests.map(g => (
                       <tr key={g.id} className="group hover:bg-indigo-50/30 transition-all">
                         <td className="px-10 py-6">
                           <div className="w-16 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-xl ring-2 ring-slate-100 transform group-hover:scale-110 transition-transform cursor-zoom-in" onClick={() => setZoomImg(g.idPhoto)}>
                             <img src={g.idPhoto} className="w-full h-full object-cover" />
                           </div>
                         </td>
                         <td className="px-10 py-6">
                           <p className="font-black text-slate-800 text-lg tracking-tight leading-tight uppercase">{g.fullName}</p>
                           <div className="flex items-center gap-2 mt-2">
                             <Globe size={12} className="text-indigo-400" />
                             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{g.nationality} • {g.checkInDate}</p>
                           </div>
                         </td>
                         <td className="px-10 py-6">
                           <span className="px-4 py-1.5 bg-slate-100 rounded-xl text-xs font-black text-slate-700 shadow-sm border border-slate-200">#{g.roomNumber}</span>
                         </td>
                         <td className="px-10 py-6">
                           <p className="text-sm font-black text-slate-600 uppercase tracking-tighter leading-none mb-1">{g.hotelName}</p>
                           <p className="text-[10px] text-slate-400 font-bold opacity-60 uppercase">{g.hotelAddress}</p>
                         </td>
                         <td className="px-10 py-6">
                           {g.isWanted ? (
                             <span className="px-6 py-2.5 bg-red-600 text-white rounded-full text-[10px] font-black uppercase shadow-xl shadow-red-200 flex items-center gap-2 w-fit animate-pulse border-2 border-white">
                               <AlertTriangle size={14}/> Wanted / ተፈላጊ
                             </span>
                           ) : (
                             <span className="px-6 py-2.5 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase flex items-center gap-2 w-fit shadow-lg border-2 border-white">
                               <CheckCircle2 size={14}/> Clear / ንፁህ
                             </span>
                           )}
                         </td>
                         <td className="px-10 py-6 no-print">
                           <button onClick={() => startEdit(g)} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-inner border border-indigo-100 group-hover:rotate-12">
                             <Edit size={20}/>
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {filteredGuests.length === 0 && (
                   <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest">
                      <Search className="mx-auto mb-4 opacity-20" size={48} />
                      No matching records found.
                   </div>
                 )}
               </div>
               {/* Print Only Footer */}
               <div className="hidden print-only mt-24 p-16 border-t-4 border-double border-slate-300">
                  <div className="grid grid-cols-3 gap-16 text-[11px] font-black uppercase tracking-[4px] text-slate-400">
                    <div className="pt-6 border-t border-slate-300">
                      <p className="mb-10 text-slate-500">{t.supervisorName}</p>
                      <p className="text-slate-800 opacity-10">___________________</p>
                    </div>
                    <div className="pt-6 border-t border-slate-300 text-center">
                      <p className="mb-10 text-slate-500">{t.date}</p>
                      <p className="text-slate-900 font-black">{new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="pt-6 border-t border-slate-300 text-right">
                      <p className="mb-10 text-slate-500">{t.signature}</p>
                      <p className="text-slate-800 opacity-10">___________________</p>
                    </div>
                  </div>
                  <div className="mt-20 text-center">
                    <p className="text-[12px] font-black text-indigo-900 uppercase tracking-[10px]">{t.developedBy}</p>
                    <p className="text-[10px] font-black text-indigo-600 mt-2 uppercase tracking-[8px]">{t.motto}</p>
                  </div>
               </div>
            </div>
          )}

          {view === 'dashboard' && <DashboardView user={user} t={t} guests={guests} wanted={wanted} notifications={notifications} setView={setView} />}
          
          {view === 'addWanted' && (
             <div className="max-w-3xl mx-auto bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 space-y-10 animate-in zoom-in-95 duration-500">
                <div className="flex items-center gap-5 border-b border-slate-100 pb-8">
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-[1.5rem] flex items-center justify-center shadow-inner ring-4 ring-red-50">
                    <AlertTriangle size={36}/>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-red-600 tracking-tighter uppercase tracking-widest">{t.policeNotice}</h3>
                    <p className="text-slate-500 text-sm font-medium">Update the regional criminal watch-list.</p>
                  </div>
                </div>
                <form onSubmit={addWanted} className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <FormInput label={t.fullName} value={newWanted.fullName} onChange={v => setNewWanted({...newWanted, fullName: v})} required icon={<Users size={20}/>} />
                    <FormInput label={t.crime} value={newWanted.crime} onChange={v => setNewWanted({...newWanted, crime: v})} required icon={<AlertTriangle size={20}/>} />
                   </div>
                   <FormInput label={t.description} value={newWanted.description} onChange={v => setNewWanted({...newWanted, description: v})} icon={<FileText size={20}/>} />
                   <div className="space-y-4">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">{t.idPhoto}</label>
                      <div className="flex items-center gap-10 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                        <div className="w-28 h-28 bg-white rounded-3xl overflow-hidden border-2 border-white shadow-2xl flex items-center justify-center group cursor-zoom-in" onClick={() => newWanted.photo && setZoomImg(newWanted.photo)}>
                          {newWanted.photo ? (
                            <img src={newWanted.photo} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          ) : (
                            <ImageIcon className="text-slate-200" size={42}/>
                          )}
                        </div>
                        <label className="flex-1 cursor-pointer px-8 py-5 bg-white border-2 border-slate-200 rounded-2xl font-black flex items-center justify-center gap-4 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-700 shadow-sm uppercase tracking-widest text-xs">
                          <ImageIcon size={22}/> {t.fromGallery} 
                          <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'wanted')} />
                        </label>
                      </div>
                   </div>
                   <button className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-6 rounded-[1.5rem] shadow-2xl shadow-red-100 transition-all uppercase tracking-[4px] text-xl mt-6">
                    {t.submit}
                   </button>
                </form>
             </div>
          )}
          
          {view === 'wantedPersons' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in duration-1000">
              {wanted.map(w => (
                <div key={w.id} className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border-2 border-red-50 hover:border-red-600 transition-all duration-700 group relative transform hover:-translate-y-2">
                   <div className="relative h-80 overflow-hidden">
                      <img src={w.photo} alt={w.fullName} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity"></div>
                      <div className="absolute top-8 left-8 flex flex-col gap-3">
                        <span className="bg-red-600 text-white px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase shadow-2xl tracking-[3px] border-2 border-white/20">Wanted / ተፈላጊ</span>
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-xl border border-white/10 w-fit">
                          <AlertTriangle size={14} className="text-red-400" />
                          <span className="text-[10px] text-white font-black uppercase tracking-widest">{w.crime}</span>
                        </div>
                      </div>
                      <button onClick={() => setZoomImg(w.photo)} className="absolute bottom-8 right-8 p-4 bg-white/10 backdrop-blur-xl rounded-2xl text-white hover:bg-white/30 transition-all border border-white/20 shadow-2xl"><Maximize2 size={26}/></button>
                   </div>
                   <div className="p-10">
                      <h4 className="text-3xl font-black text-slate-800 tracking-tighter leading-none mb-3 uppercase">{w.fullName}</h4>
                      <p className="text-slate-500 text-sm italic font-medium leading-relaxed border-l-4 border-red-600 pl-4 py-2 bg-red-50/50 rounded-r-2xl">"{w.description}"</p>
                      <div className="mt-10 pt-8 border-t border-slate-100 flex justify-between items-center">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] leading-none mb-2 font-black">BULLETIN DATE</span>
                            <span className="text-sm font-black text-slate-700 tracking-tighter">{w.postedDate}</span>
                         </div>
                         <button className="px-8 py-4 bg-[#0f172a] text-white rounded-2xl text-[10px] font-black uppercase tracking-[2px] hover:bg-red-600 transition-all shadow-xl active:scale-95">Detail Profile</button>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          )}

          {view === 'reports' && <ReportView t={t} guests={guests} />}
          
          {view === 'notifications' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center gap-5 mb-4">
                <Bell size={32} className="text-indigo-600" />
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-widest">Incident Notifications</h3>
              </div>
              {notifications.map(n => (
                <div key={n.id} className="p-10 bg-white rounded-[2.5rem] border-l-[12px] border-red-600 shadow-2xl flex gap-8 transform hover:-translate-x-3 transition-all duration-300">
                   <div className="w-16 h-16 bg-red-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-2xl shadow-red-100 border-4 border-white"><AlertTriangle size={32}/></div>
                   <div className="flex-1">
                     <div className="flex justify-between items-start mb-2">
                       <h4 className="text-2xl font-black text-red-950 tracking-tighter leading-tight uppercase">{n.title}</h4>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] py-1 px-3 bg-slate-50 rounded-lg">{n.timestamp}</span>
                     </div>
                     <p className="text-lg font-bold text-red-800 leading-relaxed mb-4">{n.message}</p>
                     <div className="flex gap-4">
                        <button className="px-5 py-2 bg-red-100 text-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-200 transition-all">Dispatch Police</button>
                        <button onClick={() => setView('guestList')} className="px-5 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all">View Identity</button>
                     </div>
                   </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center p-24 bg-white rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center">
                  <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-10 shadow-inner">
                    <CheckCircle2 size={64} className="text-slate-200"/>
                  </div>
                  <h3 className="text-2xl font-black text-slate-300 uppercase tracking-[10px]">Secure Environment</h3>
                  <p className="text-slate-400 mt-4 font-bold opacity-60">System monitoring active. No suspicious activity detected.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, count }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, count?: number }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-5 px-8 py-5 rounded-[1.5rem] transition-all duration-500 group relative ${active ? 'bg-white text-indigo-950 shadow-2xl shadow-indigo-950/40 translate-x-3' : 'text-indigo-200/60 hover:bg-white/5 hover:text-white'}`}>
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-600 rounded-full"></div>}
      <span className={`${active ? 'text-indigo-600 scale-110' : 'opacity-60 group-hover:scale-110'} transition-all duration-300`}>{icon}</span>
      <span className={`font-black flex-1 text-left tracking-tight uppercase text-xs tracking-widest transition-all ${active ? 'text-indigo-950' : ''}`}>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse ring-4 ring-indigo-950/50 shadow-lg`}>{count}</span>
      )}
    </button>
  );
}

function FormInput({ label, value, onChange, type = "text", required, disabled, icon }: { label: string, value: string, onChange?: (v: string) => void, type?: string, required?: boolean, disabled?: boolean, icon: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors duration-300">{icon}</div>
        <input type={type} className={`w-full bg-slate-50 border-2 rounded-2xl pl-16 pr-8 py-5 outline-none transition-all duration-300 font-bold text-slate-800 ${disabled ? 'cursor-not-allowed border-slate-100 opacity-60 text-slate-400' : 'border-slate-100 focus:border-indigo-400 focus:bg-white focus:ring-8 focus:ring-indigo-50 group-hover:border-slate-200'}`} value={value} onChange={e => onChange?.(e.target.value)} required={required} disabled={disabled} />
      </div>
    </div>
  );
}

function DashboardView({ user, t, guests, wanted, notifications, setView }: { user: any, t: any, guests: Guest[], wanted: WantedPerson[], notifications: Notification[], setView: (v: string) => void }) {
  const stats = [
    { label: t.guestList, value: guests.length, icon: <Users size={28}/>, color: 'bg-indigo-600' },
    { label: t.wantedPersons, value: wanted.length, icon: <AlertTriangle size={28}/>, color: 'bg-red-600' },
    { label: t.notifications, value: notifications.length, icon: <Bell size={28}/>, color: 'bg-amber-500' },
    { label: t.reports, value: 'Active', icon: <FileText size={28}/>, color: 'bg-emerald-600' },
  ];
  return (
    <div className="space-y-12">
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
         {stats.map((s, i) => (
           <div key={i} className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 hover:shadow-2xl transition-all group overflow-hidden relative cursor-pointer" onClick={() => {
              if (s.label === t.guestList) setView('guestList');
              if (s.label === t.wantedPersons) setView('wantedPersons');
              if (s.label === t.notifications) setView('notifications');
           }}>
             <div className={`${s.color} absolute top-0 right-0 w-32 h-32 opacity-[0.03] group-hover:scale-150 transition-transform duration-1000 rounded-bl-[5rem]`}></div>
             <div className={`${s.color} w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl mb-8 shadow-${s.color.split('-')[1]}-200 transition-transform group-hover:scale-110`}>{s.icon}</div>
             <div>
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] mb-2 font-black">{s.label}</p>
               <p className="text-5xl font-black text-slate-800 tracking-tighter">{s.value}</p>
             </div>
           </div>
         ))}
       </div>
       <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
         <div className="xl:col-span-2 bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100">
            <div className="flex justify-between items-center mb-12">
              <h3 className="text-2xl font-black flex items-center gap-4 tracking-tighter uppercase tracking-[2px] font-black"><PieChartIcon className="text-indigo-600" size={32}/> Regional Activity Audit</h3>
              <div className="bg-slate-50 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">Live Telemetry</div>
            </div>
            <div className="h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={[ { name: 'Mon', count: 42 }, { name: 'Tue', count: 58 }, { name: 'Wed', count: 35 }, { name: 'Thu', count: 75 }, { name: 'Fri', count: 112 }, { name: 'Sat', count: 145 }, { name: 'Sun', count: 88 } ]}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 900, fill: '#64748b'}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 900, fill: '#64748b'}} />
                   <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '25px', border: 'none', boxShadow: '0 30px 60px rgba(0,0,0,0.1)', padding: '20px', fontWeight: 'bold'}} />
                   <Bar dataKey="count" fill="#6366f1" radius={[12, 12, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
         <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100 flex flex-col">
           <div className="flex justify-between items-center mb-10">
             <h3 className="text-2xl font-black flex items-center gap-4 text-red-600 tracking-tighter uppercase tracking-[2px] font-black"><AlertTriangle size={32}/> Security Feed</h3>
             <button onClick={() => setView('notifications')} className="text-[10px] font-black uppercase text-indigo-600 tracking-widest hover:underline">View All</button>
           </div>
           <div className="flex-1 space-y-8 overflow-y-auto pr-3 custom-scrollbar">
              {notifications.slice(0, 5).map(n => (
                <div key={n.id} className="p-6 bg-red-50/50 rounded-[2rem] border-2 border-red-50 space-y-3 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer group animate-in slide-in-from-right-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">Security Warning</p>
                    <p className="text-[9px] font-bold text-red-300">{n.timestamp}</p>
                  </div>
                  <p className="text-base font-black text-red-900 leading-tight group-hover:underline">{n.title}</p>
                  <p className="text-xs text-red-700 font-bold opacity-70 line-clamp-2">{n.message}</p>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-24 opacity-30">
                  <CheckCircle2 size={64} className="mx-auto mb-6 text-slate-300"/>
                  <p className="text-[11px] font-black uppercase tracking-[5px] text-slate-400 font-black">Zero Incidents</p>
                </div>
              )}
           </div>
           <button onClick={() => setView('registerGuest')} className="mt-10 w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-[3px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 font-black uppercase">Register New Guest</button>
         </div>
       </div>
    </div>
  );
}

function ReportView({ t, guests }: { t: any, guests: Guest[] }) {
  const reportData = [ { name: t.daily, v: 12 }, { name: t.weekly, v: 85 }, { name: t.monthly, v: 340 }, { name: t.threeMonth, v: 1120 }, { name: t.sixMonth, v: 2450 }, { name: t.yearly, v: 5200 } ];
  return (
    <div className="space-y-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100">
           <h3 className="text-2xl font-black mb-12 tracking-[4px] uppercase opacity-40 text-center font-black">Identity Demographics</h3>
           <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[ { name: 'Local Citizen', value: 88 }, { name: 'Foreign National', value: 12 } ]} cx="50%" cy="50%" innerRadius={100} outerRadius={130} paddingAngle={10} dataKey="value" stroke="none">
                  {COLORS.map((c, i) => <Cell key={i} fill={c} className="hover:opacity-80 transition-opacity cursor-pointer"/>)}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '20px', fontWeight: 'bold'}} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
           </div>
        </div>
        <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100">
           <h3 className="text-2xl font-black mb-12 tracking-[4px] uppercase opacity-40 text-center font-black">Growth Trajectory</h3>
           <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 900}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 900}} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'}} />
                <Line type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={6} dot={{r:10, fill:'#fff', strokeWidth:4, stroke:'#6366f1'}} activeDot={{r:12, strokeWidth:0, fill:'#4338ca', shadow:'0 0 20px #6366f1'}} />
              </LineChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>
      <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-4 border-slate-50">
        <div className="flex justify-between items-center mb-12 border-b border-slate-50 pb-8">
          <div>
            <h3 className="text-3xl font-black uppercase tracking-[5px] text-slate-800 leading-none font-black">Intelligence Command</h3>
            <p className="text-indigo-600 font-black text-[11px] uppercase tracking-[4px] mt-2 opacity-60">Generate Verified Judicial Documentation</p>
          </div>
          <div className="p-5 bg-indigo-50 text-indigo-600 rounded-[2rem] shadow-inner"><ShieldCheck size={40}/></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
           <ReportButton icon={<Download size={32}/>} label="Excel (.xlsx)" color="bg-emerald-700" />
           <ReportButton icon={<FileText size={32}/>} label="Word (.docx)" color="bg-blue-800" />
           <ReportButton icon={<PieChartIcon size={32}/>} label="PPT (.pptx)" color="bg-orange-700" />
           <ReportButton icon={<Printer size={32}/>} label="Official PDF" color="bg-slate-900" />
        </div>
      </div>
    </div>
  );
}

function ReportButton({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) {
  return (
    <button className={`${color} text-white p-10 rounded-[2.5rem] flex flex-col items-center gap-6 hover:scale-[1.05] active:scale-95 transition-all duration-300 shadow-2xl shadow-${color.split('-')[1]}-200/40 relative group overflow-hidden`}>
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md group-hover:rotate-12 transition-transform duration-500">{icon}</div>
      <span className="text-xs font-black uppercase tracking-[3px] text-center font-black">{label}</span>
    </button>
  );
}
