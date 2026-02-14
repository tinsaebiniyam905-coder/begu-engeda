
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
  ChevronRight
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
      // Always force setup for new session to allow multi-hotel usage
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
      // Add to global directory if not exists
      const exists = allHotels.some(h => h.name.toLowerCase() === hotelProfile.name.toLowerCase() && h.address.toLowerCase() === hotelProfile.address.toLowerCase());
      if (!exists) {
        setAllHotels(prev => [...prev, hotelProfile]);
      }
      setView('dashboard');
    } else {
      alert("Please fill all details / እባክዎን ሁሉንም መረጃዎች ይሙሉ");
    }
  };

  // --- Filtering Logic ---
  const filteredGuests = guests.filter(g => 
    g.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.hotelAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.nationality.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.roomNumber.includes(searchTerm)
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
        <div className="bg-white/5 backdrop-blur-2xl rounded-[3rem] shadow-2xl p-8 w-full max-w-md border border-white/10">
          <div className="text-center mb-10">
            <img src={LOGO_PATH} alt="Police Logo" className="w-32 h-32 rounded-full mx-auto shadow-2xl border-4 border-indigo-500/50 object-contain p-1 bg-white mb-6" />
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase">{t.appName}</h1>
            <p className="text-indigo-400 font-black text-sm mb-4 leading-tight uppercase font-black">{t.developedBy}</p>
            <p className="text-gray-400 italic text-xs opacity-80 font-black">"{t.motto}"</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="text" placeholder={t.username} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-600 font-bold" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} required />
            <input type="password" placeholder={t.password} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-600 font-bold" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required />
            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all transform active:scale-95 text-lg tracking-widest uppercase">
              {t.login}
            </button>
          </form>
          <div className="mt-8 flex justify-center gap-4">
            <button onClick={() => setLang('am')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${lang === 'am' ? 'bg-white text-indigo-950' : 'text-gray-500'}`}>አማርኛ</button>
            <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${lang === 'en' ? 'bg-white text-indigo-950' : 'text-gray-500'}`}>English</button>
          </div>
        </div>
      </div>
    );
  }

  // --- Mandatory Setup View ---
  if (view === 'setupHotel' && user.role === UserRole.RECEPTION) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4">
        <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-2xl w-full max-w-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
           <div className="text-center mb-10">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Building2 size={40} />
              </div>
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-widest mb-3">{t.setupHotel}</h2>
              <p className="text-slate-500 font-bold max-w-sm mx-auto leading-relaxed">{t.setupWelcome}</p>
           </div>
           <form onSubmit={handleSetupSubmit} className="space-y-8">
              <FormInput label={t.hotel} value={hotelProfile.name} onChange={v => setHotelProfile({...hotelProfile, name: v})} icon={<Building2 size={22}/>} required />
              <FormInput label={t.hotelAddress} value={hotelProfile.address} onChange={v => setHotelProfile({...hotelProfile, address: v})} icon={<Globe size={22}/>} required />
              <FormInput label={t.receptionistName} value={hotelProfile.receptionistName} onChange={v => setHotelProfile({...hotelProfile, receptionistName: v})} icon={<Users size={22}/>} required />
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-2xl shadow-2xl shadow-indigo-100 transition-all uppercase tracking-[4px] text-lg flex items-center justify-center gap-3">
                {t.save} & {t.submit} <ChevronRight size={24} />
              </button>
           </form>
           <div className="mt-8 pt-8 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t.developedBy}</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative z-50 w-72 h-full bg-[#0f172a] text-white flex flex-col transition-transform duration-300 no-print shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-8 border-b border-white/5 text-center bg-indigo-950/20">
          <img src={LOGO_PATH} className="w-20 h-20 rounded-full mx-auto border-2 border-indigo-500/30 shadow-2xl p-1 bg-white mb-4 object-contain" alt="Logo" />
          <h1 className="font-black text-xl tracking-tight mb-1 uppercase">{t.appName}</h1>
          <p className="text-indigo-400 font-black text-[10px] uppercase font-black">{t.developedBy}</p>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          <NavItem icon={<PieChartIcon size={20} />} label={t.dashboard} active={view === 'dashboard'} onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} />
          {user.role === UserRole.RECEPTION && (
            <>
              <NavItem icon={<UserPlus size={20} />} label={t.registerGuest} active={view === 'registerGuest'} onClick={() => { setView('registerGuest'); setIsSidebarOpen(false); }} />
              <NavItem icon={<Users size={20} />} label={t.guestList} active={view === 'guestList'} onClick={() => { setView('guestList'); setIsSidebarOpen(false); }} />
              <NavItem icon={<Settings size={20} />} label={t.settings} active={view === 'settings'} onClick={() => { setView('settings'); setIsSidebarOpen(false); }} />
            </>
          )}
          {user.role === UserRole.POLICE && (
            <>
               <NavItem icon={<Plus size={20} />} label={t.policeNotice} active={view === 'addWanted'} onClick={() => { setView('addWanted'); setIsSidebarOpen(false); }} />
               <NavItem icon={<Users size={20} />} label={t.guestList} active={view === 'guestList'} onClick={() => { setView('guestList'); setIsSidebarOpen(false); }} />
               <NavItem icon={<Building2 size={20} />} label={t.hotelDirectory} active={view === 'hotelDirectory'} onClick={() => { setView('hotelDirectory'); setIsSidebarOpen(false); }} />
               <NavItem icon={<Settings size={20} />} label={t.policeSettings} active={view === 'policeSettings'} onClick={() => { setView('policeSettings'); setIsSidebarOpen(false); }} />
            </>
          )}
          <NavItem icon={<AlertTriangle size={20} />} label={t.wantedPersons} active={view === 'wantedPersons'} onClick={() => { setView('wantedPersons'); setIsSidebarOpen(false); }} />
          <NavItem icon={<FileText size={20} />} label={t.reports} active={view === 'reports'} onClick={() => { setView('reports'); setIsSidebarOpen(false); }} />
          <NavItem icon={<Info size={20} />} label={t.appUtility} active={view === 'utility'} onClick={() => { setView('utility'); setIsSidebarOpen(false); }} />
          <NavItem icon={<Bell size={20} />} label={t.notifications} active={view === 'notifications'} count={notifications.length} onClick={() => { setView('notifications'); setIsSidebarOpen(false); }} />
        </nav>
        <div className="p-6 border-t border-white/5">
           <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full py-4 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all font-black text-xs uppercase">
            <LogOut size={18} /> {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 h-screen overflow-y-auto relative bg-[#f1f5f9]">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex justify-between items-center no-print shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"><Menu size={24} /></button>
            <h2 className="text-xl font-black text-slate-800 uppercase hidden sm:block">
              {view === 'dashboard' ? t.dashboard : view === 'registerGuest' ? t.registerGuest : view === 'guestList' ? t.guestList : view === 'settings' ? t.settings : view === 'wantedPersons' ? t.wantedPersons : view === 'reports' ? t.reports : t.notifications}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setLang(lang === 'am' ? 'en' : 'am')} className="p-2 border border-slate-100 bg-white rounded-xl hover:bg-indigo-50 transition-all shadow-sm">
              <Globe size={20} className="text-slate-400" />
            </button>
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
               <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-slate-800 uppercase leading-none">{user.username}</p>
                  <p className="text-[9px] text-indigo-500 font-black uppercase mt-1">{user.role}</p>
               </div>
               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black uppercase shadow-lg">
                {user.username[0]}
               </div>
            </div>
          </div>
        </header>

        <main className="p-6 md:p-10 max-w-7xl mx-auto">
          {/* Zoom Modal */}
          {zoomImg && (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4" onClick={() => setZoomImg(null)}>
               <button className="absolute top-8 right-8 text-white bg-white/10 p-4 rounded-full"><X size={32} /></button>
               <img src={zoomImg} alt="Zoomed" className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain" />
               <p className="text-white font-black text-xl uppercase mt-8">{t.zoomImage}</p>
            </div>
          )}

          {view === 'hotelDirectory' && user.role === UserRole.POLICE && (
            <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 animate-in fade-in duration-500">
               <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-2xl font-black uppercase tracking-widest">{t.hotelDirectory}</h3>
                 <div className="flex gap-2">
                   <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-xs font-black uppercase shadow-sm"><Printer size={18}/> {t.print}</button>
                   <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-xs font-black uppercase shadow-sm"><Download size={18}/> {t.download}</button>
                 </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                      <tr>
                        <th className="px-8 py-6">{t.hotel}</th>
                        <th className="px-8 py-6">{t.hotelAddress}</th>
                        <th className="px-8 py-6">{t.receptionistName}</th>
                        <th className="px-8 py-6">Current Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allHotels.map((h, i) => (
                        <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-8 py-6 font-black text-slate-800 text-base uppercase">{h.name}</td>
                          <td className="px-8 py-6 text-sm text-slate-500 font-bold uppercase">{h.address}</td>
                          <td className="px-8 py-6 text-sm text-slate-500 font-bold uppercase">{h.receptionistName}</td>
                          <td className="px-8 py-6">
                            <span className="px-4 py-1.5 bg-emerald-100 text-emerald-600 rounded-full text-[9px] font-black uppercase border border-emerald-200">Active / ንቁ</span>
                          </td>
                        </tr>
                      ))}
                      {allHotels.length === 0 && (
                        <tr><td colSpan={4} className="p-24 text-center font-black uppercase text-slate-300 tracking-[5px]">No hotels registered yet.</td></tr>
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          )}

          {view === 'utility' && (
             <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-6">
                <div className="text-center">
                   <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Info size={32} /></div>
                   <h3 className="text-3xl font-black uppercase tracking-widest text-slate-800">{t.appUtility}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-4 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <h4 className="text-xl font-black uppercase text-indigo-600 border-b pb-2">Amharic / አማርኛ</h4>
                      <p className="text-slate-600 leading-relaxed font-bold">
                        ይህ "ቤጉ እንግዳ" አፕልኬሽን በቤንሻንጉል ጉምዝ ክልል ፖሊስ ኮሚሽን የዳበረ ሲሆን፣ በክልሉ ውስጥ ያሉ ማንኛውም ሆቴሎች እንግዶችን በዘመናዊ መልኩ እንዲመዘግቡ እና መረጃውን ለፖሊስ በቀጥታ እንዲያስተላልፉ ይረዳል። ይህም የወንጀል መከላከያ ስራን ይበልጥ ቀልጣፋ ያደርገዋል። ፖሊሱም የትኛው እንግዳ በየትኛው ሆቴል እንዳለ ወዲያውኑ ማየት ይችላል።
                      </p>
                   </div>
                   <div className="space-y-4 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <h4 className="text-xl font-black uppercase text-indigo-600 border-b pb-2">English</h4>
                      <p className="text-slate-600 leading-relaxed font-bold">
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
            <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
              <div className="text-center mb-10">
                <Settings className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-2xl font-black uppercase tracking-widest">{t.settings}</h3>
                <p className="text-slate-400 font-bold text-xs mt-2 uppercase">Configuration and Profile Update</p>
              </div>
              <form onSubmit={handleSetupSubmit} className="space-y-8">
                 <FormInput label={t.hotel} value={hotelProfile.name} onChange={v => setHotelProfile({...hotelProfile, name: v})} icon={<Building2 size={22}/>} required />
                 <FormInput label={t.hotelAddress} value={hotelProfile.address} onChange={v => setHotelProfile({...hotelProfile, address: v})} icon={<Globe size={22}/>} required />
                 <FormInput label={t.receptionistName} value={hotelProfile.receptionistName} onChange={v => setHotelProfile({...hotelProfile, receptionistName: v})} icon={<Users size={22}/>} required />
                 <button className="w-full bg-indigo-600 text-white font-black py-6 rounded-2xl shadow-xl uppercase tracking-[4px] text-lg hover:bg-indigo-700 transition-all">{t.save}</button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// --- Internal Components ---

function NavItem({ icon, label, active, onClick, count }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, count?: number }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all ${active ? 'bg-white text-indigo-950 shadow-lg scale-[1.02]' : 'text-indigo-200/60 hover:bg-white/5 hover:text-white'}`}>
      <span className={active ? 'text-indigo-600' : 'opacity-60'}>{icon}</span>
      <span className="font-black text-[11px] tracking-widest uppercase flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded-full animate-pulse ring-2 ring-red-900/20">{count}</span>
      )}
    </button>
  );
}

function FormInput({ label, value, onChange, type = "text", required, disabled, icon }: { label: string, value: string, onChange?: (v: string) => void, type?: string, required?: boolean, disabled?: boolean, icon: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-indigo-600">{icon}</div>
        <input type={type} className={`w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 outline-none transition-all font-bold text-slate-800 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} value={value} onChange={e => onChange?.(e.target.value)} required={required} disabled={disabled} />
      </div>
    </div>
  );
}

function DashboardView({ user, t, guests, wanted, notifications, setView }: { user: any, t: any, guests: Guest[], wanted: WantedPerson[], notifications: Notification[], setView: (v: string) => void }) {
  const stats = [
    { label: t.guestList, value: guests.length, icon: <Users size={24}/>, color: 'bg-indigo-600' },
    { label: t.wantedPersons, value: wanted.length, icon: <AlertTriangle size={24}/>, color: 'bg-red-600' },
    { label: t.notifications, value: notifications.length, icon: <Bell size={24}/>, color: 'bg-amber-500' },
    { label: t.reports, value: 'Live', icon: <FileBarChart size={24}/>, color: 'bg-emerald-600' },
  ];
  return (
    <div className="space-y-10 animate-in fade-in duration-700">
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
         {stats.map((s, i) => (
           <div key={i} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group" onClick={() => {
              if (s.label === t.guestList) setView('guestList');
              if (s.label === t.wantedPersons) setView('wantedPersons');
              if (s.label === t.notifications) setView('notifications');
              if (s.label === t.reports) setView('reports');
           }}>
             <div className={`${s.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg mb-8 group-hover:scale-110 transition-transform`}>{s.icon}</div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
             <p className="text-4xl font-black text-slate-800 tracking-tighter">{s.value}</p>
           </div>
         ))}
       </div>
       <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          <div className="xl:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3"><FileBarChart className="text-indigo-600" /> Activity Metrics</h3>
               <span className="text-[10px] font-black text-indigo-400 uppercase bg-indigo-50 px-3 py-1 rounded-lg">Real-time Feed</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={[ {n: 'Mon', v: 4}, {n: 'Tue', v: 7}, {n: 'Wed', v: 5}, {n: 'Thu', v: 9}, {n: 'Fri', v: 12}, {n: 'Sat', v: 15}, {n: 'Sun', v: 8} ]}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                   <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '15px', border: 'none', fontWeight: 'bold'}} />
                   <Bar dataKey="v" fill="#6366f1" radius={[10, 10, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col">
             <h3 className="text-xl font-black uppercase tracking-widest mb-8 flex items-center gap-3"><Bell className="text-red-600" /> Security Log</h3>
             <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar">
                {notifications.slice(0, 5).map(n => (
                  <div key={n.id} className="p-5 bg-red-50 rounded-[1.5rem] border border-red-100 group hover:bg-red-100 transition-colors cursor-pointer">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[9px] font-black text-red-600 uppercase">{n.timestamp}</p>
                      <AlertTriangle size={12} className="text-red-400" />
                    </div>
                    <p className="text-xs font-black text-slate-800 uppercase leading-tight group-hover:underline">{n.title}</p>
                    <p className="text-[10px] text-red-700 font-bold opacity-70 mt-1">Check Room Log</p>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center py-20 opacity-20">
                    <CheckCircle2 size={48} className="mx-auto mb-4" />
                    <p className="text-[11px] font-black uppercase tracking-[5px]">All Secure</p>
                  </div>
                )}
             </div>
             <button onClick={() => setView('registerGuest')} className="mt-8 w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-[3px] shadow-xl hover:bg-indigo-700 transition-all font-black">Register New Guest</button>
          </div>
       </div>
    </div>
  );
}

function GuestListView({ guests, t, setZoomImg, startEdit, searchTerm, setSearchTerm }: { guests: Guest[], t: any, setZoomImg: any, startEdit: any, searchTerm: string, setSearchTerm: any }) {
  return (
    <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-100 animate-in fade-in duration-700">
       <div className="p-8 md:p-12 border-b flex flex-col md:flex-row gap-6 justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-widest leading-none">{t.guestList}</h3>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[4px] mt-2">Active Surveillance Monitoring</p>
          </div>
          <div className="relative w-full md:w-[450px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder={t.searchPlaceholder} className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-400 font-bold text-sm shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
       </div>
       <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
               <tr>
                 <th className="px-10 py-7">{t.idPhoto}</th>
                 <th className="px-10 py-7">{t.fullName}</th>
                 <th className="px-10 py-7">{t.hotel}</th>
                 <th className="px-10 py-7">Status</th>
                 <th className="px-10 py-7 no-print text-center">{t.edit}</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {guests.map(g => (
                 <tr key={g.id} className="hover:bg-indigo-50/20 transition-colors group">
                    <td className="px-10 py-5">
                      <div className="w-16 h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-white ring-2 ring-slate-100 transform group-hover:scale-110 transition-transform cursor-zoom-in" onClick={() => setZoomImg(g.idPhoto)}>
                        <img src={g.idPhoto} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <p className="font-black text-slate-800 uppercase text-lg leading-tight">{g.fullName}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Globe size={12} className="text-indigo-400" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{g.nationality} • ROOM {g.roomNumber}</p>
                      </div>
                    </td>
                    <td className="px-10 py-5">
                       <div className="flex items-center gap-2 mb-1">
                          <Building2 size={14} className="text-slate-400" />
                          <p className="text-sm font-black text-slate-600 uppercase tracking-tighter">{g.hotelName}</p>
                       </div>
                       <div className="flex items-center gap-2">
                          <MapPin size={12} className="text-slate-300" />
                          <p className="text-[9px] text-slate-400 uppercase font-bold">{g.hotelAddress}</p>
                       </div>
                    </td>
                    <td className="px-10 py-5">
                       {g.isWanted ? (
                         <span className="px-5 py-2 bg-red-600 text-white text-[10px] font-black rounded-full uppercase flex items-center gap-2 w-fit animate-pulse border-2 border-white shadow-xl">
                            <AlertTriangle size={14}/> Wanted / ተፈላጊ
                         </span>
                       ) : (
                         <span className="px-5 py-2 bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase flex items-center gap-2 w-fit border-2 border-white shadow-md">
                            <CheckCircle2 size={14}/> Clear / ንፁህ
                         </span>
                       )}
                    </td>
                    <td className="px-10 py-5 no-print text-center">
                       <button onClick={() => startEdit(g)} className="p-4 bg-white border border-slate-100 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><Edit size={20}/></button>
                    </td>
                 </tr>
               ))}
             </tbody>
          </table>
          {guests.length === 0 && (
            <div className="p-24 text-center opacity-20">
               <Search size={64} className="mx-auto mb-6" />
               <p className="text-2xl font-black uppercase tracking-[10px]">No Records Found</p>
            </div>
          )}
       </div>
    </div>
  );
}

function GuestFormView({ newGuest, setNewGuest, hotelProfile, saveGuest, t, setZoomImg, handleFileUpload, editingGuestId, setEditingGuestId, setView }: any) {
  return (
    <div className="max-w-4xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
       <div className="flex justify-between items-start mb-12">
          <div>
             <h3 className="text-3xl font-black uppercase tracking-widest leading-none mb-3">{editingGuestId ? t.edit : t.registerGuest}</h3>
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Public Safety Compliance Division</p>
          </div>
          {editingGuestId && <button onClick={() => { setEditingGuestId(null); setView('guestList'); }} className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-2xl transition-all"><X size={24}/></button>}
       </div>
       <form onSubmit={saveGuest} className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <FormInput label={t.fullName} value={newGuest.fullName} onChange={(v: string) => setNewGuest({...newGuest, fullName: v})} required icon={<Users size={22}/>} />
             <FormInput label={t.nationality} value={newGuest.nationality} onChange={(v: string) => setNewGuest({...newGuest, nationality: v})} required icon={<Globe size={22}/>} />
             <FormInput label={t.roomNumber} value={newGuest.roomNumber} onChange={(v: string) => setNewGuest({...newGuest, roomNumber: v})} required icon={<Building2 size={22}/>} />
             <FormInput label={t.hotel} value={hotelProfile.name} disabled icon={<Building2 size={22}/>} />
          </div>
          <div className="space-y-6">
             <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.idPhoto}</label>
             <div className="flex flex-col sm:flex-row items-center gap-10 bg-slate-50/50 p-8 rounded-[3rem] border-2 border-dashed border-slate-200 hover:border-indigo-200 transition-colors group">
                <div className="w-32 h-44 bg-white rounded-3xl border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center cursor-zoom-in group-hover:scale-105 transition-transform" onClick={() => newGuest.idPhoto && setZoomImg(newGuest.idPhoto)}>
                  {newGuest.idPhoto ? <img src={newGuest.idPhoto} className="w-full h-full object-cover" /> : <Camera size={48} className="text-slate-100" />}
                </div>
                <div className="flex-1 w-full space-y-4">
                   <label className="block w-full text-center py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase cursor-pointer hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"><Camera className="inline mr-2" size={20}/> {t.capturePhoto} <input type="file" capture="environment" className="hidden" onChange={e => handleFileUpload(e, 'guest')} /></label>
                   <label className="block w-full text-center py-5 bg-white border-2 border-slate-200 text-slate-600 rounded-[1.5rem] font-black text-xs uppercase cursor-pointer hover:bg-slate-50 transition-all shadow-sm"><ImageIcon className="inline mr-2" size={20}/> {t.fromGallery} <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'guest')} /></label>
                </div>
             </div>
          </div>
          <button className="w-full bg-indigo-600 text-white font-black py-7 rounded-[2rem] shadow-2xl shadow-indigo-100 uppercase tracking-[6px] text-xl transition-all transform active:scale-95">{editingGuestId ? t.save : t.submit}</button>
       </form>
    </div>
  );
}

function WantedPersonsView({ wanted, t, setZoomImg }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in duration-1000">
       {wanted.map((w: WantedPerson) => (
         <div key={w.id} className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border-2 border-red-50 hover:border-red-600 transition-all duration-500 group relative transform hover:-translate-y-2">
            <div className="h-72 relative overflow-hidden">
              <img src={w.photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute top-6 left-6 bg-red-600 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase shadow-2xl border-2 border-white/20 tracking-widest">Wanted / ተፈላጊ</div>
              <button onClick={() => setZoomImg(w.photo)} className="absolute bottom-6 right-6 p-4 bg-white/10 backdrop-blur-xl rounded-2xl text-white hover:bg-white/30 transition-all border border-white/20 shadow-2xl"><Maximize2 size={24}/></button>
            </div>
            <div className="p-10 space-y-4">
              <h4 className="text-3xl font-black uppercase text-slate-800 tracking-tighter leading-none">{w.fullName}</h4>
              <p className="text-xs text-red-600 font-black uppercase tracking-widest inline-block px-3 py-1 bg-red-50 rounded-lg">{w.crime}</p>
              <p className="text-sm text-slate-500 italic font-bold leading-relaxed border-l-4 border-red-600 pl-4 py-2 bg-red-50/30 rounded-r-2xl line-clamp-2">"{w.description}"</p>
              <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] leading-none mb-2">Registry Date</span>
                    <span className="text-sm font-black text-slate-700 tracking-tighter">{w.postedDate}</span>
                 </div>
                 <button onClick={() => setZoomImg(w.photo)} className="px-8 py-4 bg-[#0f172a] text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl active:scale-95">Profile</button>
              </div>
            </div>
         </div>
       ))}
    </div>
  );
}

function AddWantedView({ newWanted, setNewWanted, addWanted, t, handleFileUpload, setZoomImg }: any) {
  return (
    <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
       <div className="text-center mb-10">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner"><AlertTriangle size={36} /></div>
          <h3 className="text-2xl font-black uppercase tracking-widest text-red-600">{t.policeNotice}</h3>
          <p className="text-slate-400 font-bold text-xs mt-2 uppercase">Criminal Records Update Hub</p>
       </div>
       <form onSubmit={addWanted} className="space-y-10">
          <FormInput label={t.fullName} value={newWanted.fullName} onChange={(v: string) => setNewWanted({...newWanted, fullName: v})} required icon={<Users size={22}/>} />
          <FormInput label={t.crime} value={newWanted.crime} onChange={(v: string) => setNewWanted({...newWanted, crime: v})} required icon={<AlertTriangle size={22}/>} />
          <FormInput label={t.description} value={newWanted.description} onChange={(v: string) => setNewWanted({...newWanted, description: v})} icon={<FileText size={22}/>} />
          <div className="space-y-6">
             <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.idPhoto}</label>
             <div className="flex items-center gap-10 bg-red-50/50 p-8 rounded-[3rem] border-2 border-dashed border-red-100">
                <div className="w-28 h-28 bg-white rounded-3xl border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center cursor-zoom-in" onClick={() => newWanted.photo && setZoomImg(newWanted.photo)}>
                  {newWanted.photo ? <img src={newWanted.photo} className="w-full h-full object-cover" /> : <ImageIcon size={42} className="text-red-200" />}
                </div>
                <label className="flex-1 block w-full text-center py-6 bg-white border-2 border-red-100 text-red-600 rounded-[1.5rem] font-black text-xs uppercase cursor-pointer hover:bg-red-50 transition-all shadow-sm">Upload Evidence Photo <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'wanted')} /></label>
             </div>
          </div>
          <button className="w-full bg-red-600 text-white font-black py-7 rounded-[2rem] shadow-2xl shadow-red-100 uppercase tracking-[6px] text-xl transition-all transform active:scale-95">{t.submit}</button>
       </form>
    </div>
  );
}

function ReportView({ t, guests, userRole }: { t: any, guests: Guest[], userRole: UserRole }) {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
       <div className="bg-white p-12 md:p-16 rounded-[4rem] shadow-2xl border-4 border-slate-50 text-center space-y-12">
          <div className="flex flex-col items-center">
             <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner"><FileBarChart size={48} /></div>
             <h3 className="text-3xl font-black uppercase tracking-[6px] text-slate-800 leading-none">{userRole === UserRole.POLICE ? "Regional Command Oversight" : "Property Activity Audit"}</h3>
             <p className="text-indigo-400 font-black text-[11px] uppercase tracking-[5px] mt-3 opacity-60">Benishangul Gumuz Judicial Documentation Feed</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
             <ReportButton icon={<Download size={32}/>} label="Excel (.xlsx)" color="bg-emerald-700" />
             <ReportButton icon={<FileText size={32}/>} label="Word (.docx)" color="bg-blue-800" />
             <ReportButton icon={<PieChartIcon size={32}/>} label="PPT (.pptx)" color="bg-orange-700" />
             <ReportButton icon={<Printer size={32}/>} label="Official Report" color="bg-slate-900" />
          </div>
          
          <div className="mt-20 pt-16 border-t-2 border-dashed border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-16 text-left no-print">
             <div className="space-y-6">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[4px] leading-none mb-2">Authority Inspector</p>
                <div className="h-px bg-slate-200 w-full mb-1"></div>
                <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">{t.supervisorName}</p>
             </div>
             <div className="space-y-6 text-center">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[4px] leading-none mb-2">{t.date}</p>
                <p className="font-black text-slate-800 text-lg uppercase tracking-widest">{new Date().toLocaleDateString()}</p>
             </div>
             <div className="space-y-6 text-right">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[4px] leading-none mb-2">Oversight Seal / Signature</p>
                <div className="h-px bg-slate-200 w-full mb-1"></div>
                <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">{t.signature}</p>
             </div>
          </div>
          
          {/* Print Exclusive Section */}
          <div className="hidden print:block mt-24 p-16 border-t-4 border-double border-slate-300">
             <div className="grid grid-cols-3 gap-16 text-[11px] font-black uppercase tracking-[4px] text-slate-400">
               <div className="pt-8 border-t border-slate-300">
                 <p className="mb-12 text-slate-500 font-black">{t.supervisorName}</p>
                 <div className="h-px w-full bg-slate-100"></div>
               </div>
               <div className="pt-8 border-t border-slate-300 text-center">
                 <p className="mb-12 text-slate-500 font-black">{t.date}</p>
                 <p className="text-slate-900 font-black text-base">{new Date().toLocaleDateString()}</p>
               </div>
               <div className="pt-8 border-t border-slate-300 text-right">
                 <p className="mb-12 text-slate-500 font-black">{t.signature}</p>
                 <div className="h-px w-full bg-slate-100"></div>
               </div>
             </div>
             <div className="mt-20 text-center opacity-30">
               <p className="text-[12px] font-black text-indigo-950 uppercase tracking-[10px] mb-2">{t.developedBy}</p>
               <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[8px]">Official Judicial Property Monitoring Report</p>
             </div>
          </div>
       </div>
    </div>
  );
}

function ReportButton({ icon, label, color }: any) {
  return (
    <button className={`${color} text-white p-10 rounded-[2.5rem] flex flex-col items-center gap-6 hover:scale-[1.08] active:scale-95 transition-all duration-300 shadow-2xl relative group overflow-hidden`}>
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md group-hover:rotate-12 transition-transform">{icon}</div>
      <span className="text-[11px] font-black uppercase tracking-[4px] font-black text-center leading-tight">{label}</span>
    </button>
  );
}

function NotificationsView({ notifications, setView, t }: any) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
       <div className="flex items-center gap-5 mb-4 px-4">
          <Bell size={36} className="text-indigo-600" />
          <h3 className="text-3xl font-black uppercase tracking-[4px] text-slate-800">Critical Alerts</h3>
       </div>
       {notifications.map((n: any) => (
         <div key={n.id} className="p-10 bg-white rounded-[3rem] border-l-[15px] border-red-600 shadow-2xl flex gap-10 group hover:-translate-x-3 transition-all duration-300">
            <div className="w-20 h-20 bg-red-600 text-white rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-2xl shadow-red-200 border-4 border-white"><AlertTriangle size={40}/></div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] font-black leading-none">{n.timestamp}</p>
                <span className="px-3 py-1 bg-red-50 text-red-600 text-[9px] font-black rounded-full uppercase border border-red-100">Action Required</span>
              </div>
              <h4 className="text-2xl font-black text-red-950 uppercase leading-tight mt-1 group-hover:underline font-black">{n.title}</h4>
              <p className="text-lg text-slate-600 font-bold mt-4 leading-relaxed">{n.message}</p>
              <div className="mt-8 flex gap-5">
                 <button onClick={() => setView('guestList')} className="px-8 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 transition-all">Intercept Guest</button>
                 <button className="px-8 py-3 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200">Dispatch Unit</button>
              </div>
            </div>
         </div>
       ))}
       {notifications.length === 0 && (
         <div className="text-center py-32 bg-white rounded-[4rem] border-4 border-dashed border-slate-50 flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-10 shadow-inner">
               <CheckCircle2 size={56} className="text-slate-200" />
            </div>
            <p className="text-3xl font-black uppercase tracking-[15px] text-slate-200 leading-none">All Secure</p>
            <p className="text-slate-400 font-bold text-sm uppercase mt-6 opacity-60">Continuous regional monitoring active.</p>
         </div>
       )}
    </div>
  );
}
