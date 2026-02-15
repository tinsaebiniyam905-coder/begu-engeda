import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Guest, WantedPerson, Notification, Language, HotelProfile, UserAccount, PoliceProfile } from './types';
import { translations } from './translations';
import { db, ref, push, onValue, set } from './firebaseConfig'; // Firebase ግንኙነት
import { 
  Users, UserPlus, AlertTriangle, FileText, LogOut, Bell, Camera, Image as ImageIcon, Download, 
  Printer, Globe, Plus, Settings, Edit, X, Maximize2, CheckCircle2, ShieldCheck, Search, MapPin, 
  Building2, FileBarChart, Menu, Info, ShieldAlert, TrendingUp, Activity, 
  Phone, Fingerprint, Map, LayoutDashboard, Save, UserCircle, Key, ChevronRight, Cloud, User, 
  Wifi, Server, RefreshCw, Smartphone, Monitor, Cpu
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const LOGO_PATH = 'https://img.icons8.com/fluency/512/police-badge.png';
const GOLDEN_GRADIENT = "text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-700 font-black drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.2)]";

const ZONES_AM = [
  "መተከል ዞን", "አሶሳ ዞን", "ካማሽ ዞን", "አሶሳ ከተማ አስ/ር", 
  "ግልገል በለስ ከተማ አስተዳደር", "ካማሽ ከተማ አስተዳደር", "ባምባሲ ከተማ አስተዳደር", "ማዖና ኮሞ ልዩ ወረዳ"
];

// --- UI COMPONENTS ---
const NavButton = ({ icon, label, active, onClick, count }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wide transition-all duration-200 
    ${active ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
    <span>{icon}</span>
    <span className="flex-1 text-left truncate">{label}</span>
    {count > 0 && <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black">{count}</span>}
  </button>
);

const StandardInput = ({ label, value, onChange, type = "text", required, icon, placeholder }: any) => (
  <div className="space-y-1 w-full">
    <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</div>
      <input 
        type={type} placeholder={placeholder}
        className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 focus:border-amber-500 outline-none transition-all text-left" 
        value={value} onChange={e => onChange(e.target.value)} required={required}
      />
    </div>
  </div>
);

export default function App() {
  const [lang, setLang] = useState<Language>('am');
  const [authState, setAuthState] = useState<'login' | 'setup_hotel' | 'setup_police' | 'authenticated'>('login');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('begu_active_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [guests, setGuests] = useState<Guest[]>([]);
  const [wanted, setWanted] = useState<WantedPerson[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [view, setView] = useState<string>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [hotelProfile, setHotelProfile] = useState<HotelProfile>(() => JSON.parse(localStorage.getItem('begu_hotel_profile') || '{"name":"","address":"","zone":"","receptionistName":"","phoneNumber":""}'));
  const [policeProfile, setPoliceProfile] = useState<PoliceProfile>(() => JSON.parse(localStorage.getItem('begu_police_profile') || '{"name":"","address":"","zone":""}'));

  const t = translations[lang];

  // --- 1. CLOUD SYNC: FETCH DATA FROM FIREBASE ---
  useEffect(() => {
    if (!currentUser) return;

    const guestsRef = ref(db, 'guests');
    const wantedRef = ref(db, 'wanted_persons');
    const notifyRef = ref(db, 'notifications');

    // Listen for Guests
    const unsubGuests = onValue(guestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setGuests(list.reverse());
      }
    });

    // Listen for Wanted Persons
    const unsubWanted = onValue(wantedRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setWanted(list);
      }
    });

    // Listen for Notifications
    const unsubNotify = onValue(notifyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setNotifications(list.reverse());
      }
    });

    return () => { unsubGuests(); unsubWanted(); unsubNotify(); };
  }, [currentUser]);

  // --- 2. CLOUD SAVE: REGISTER GUEST TO FIREBASE ---
  const saveGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuest.fullName || !newGuest.nationality) return;

    setIsSyncing(true);
    const guestData = {
      ...newGuest,
      hotelName: hotelProfile.name,
      hotelZone: hotelProfile.zone,
      checkInDate: new Date().toISOString(),
      isWanted: wanted.some(w => w.fullName.toLowerCase() === newGuest.fullName.toLowerCase()),
      device: window.innerWidth < 768 ? 'Mobile' : 'Desktop'
    };

    try {
      const newGuestRef = push(ref(db, 'guests'));
      await set(newGuestRef, guestData);

      if (guestData.isWanted) {
        const notifyRef = push(ref(db, 'notifications'));
        await set(notifyRef, {
          title: t.alertWantedFound,
          message: `${guestData.fullName} በ ${guestData.hotelName} ተገኝቷል!`,
          type: 'danger',
          timestamp: new Date().toLocaleTimeString(),
          targetZone: guestData.hotelZone
        });
      }

      setNewGuest({ fullName: '', nationality: '', roomNumber: '', idPhoto: '' });
      setView('guestList');
    } catch (err) {
      alert("Error syncing with Cloud!");
    } finally {
      setIsSyncing(false);
    }
  };

  const [newGuest, setNewGuest] = useState({ fullName: '', nationality: '', roomNumber: '', idPhoto: '' });

  // --- LOGIN & SETUP LOGIC ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const id = (e.target as any)[0].value;
    const pw = (e.target as any)[1].value;

    let role: UserRole | null = null;
    if (id === 'reception' && pw === '1234') role = UserRole.RECEPTION;
    else if (id === 'police' && pw === '1234') role = UserRole.LOCAL_POLICE;
    else if (id === 'admin' && pw === 'admin123') role = UserRole.SUPER_POLICE;

    if (role) {
      const user = { username: id, role: role, isVerified: true };
      setCurrentUser(user as any);
      localStorage.setItem('begu_active_session', JSON.stringify(user));
      setAuthState(role === UserRole.RECEPTION ? 'setup_hotel' : 'setup_police');
    } else {
      alert("Invalid login!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('begu_active_session');
    setCurrentUser(null);
    setAuthState('login');
  };

  const filteredGuests = useMemo(() => {
    let list = guests;
    if (currentUser?.role === UserRole.LOCAL_POLICE) list = guests.filter(g => g.hotelZone === policeProfile.zone);
    else if (currentUser?.role === UserRole.RECEPTION) list = guests.filter(g => g.hotelName === hotelProfile.name);
    return list.filter(g => g.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [guests, searchTerm, currentUser, policeProfile, hotelProfile]);

  if (authState !== 'authenticated' && authState !== 'login') {
      // Simple Setup View
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl w-full max-w-md">
                <h2 className="text-xl font-black mb-4 uppercase">{authState === 'setup_hotel' ? t.setupHotel : t.setupPolice}</h2>
                <form onSubmit={(e) => { e.preventDefault(); setAuthState('authenticated'); }} className="space-y-4">
                    {authState === 'setup_hotel' ? (
                        <>
                            <StandardInput label={t.hotel} value={hotelProfile.name} onChange={(v:any) => setHotelProfile({...hotelProfile, name: v})} icon={<Building2 size={16}/>} />
                            <select className="w-full p-3 border-2 rounded-lg" onChange={(e) => setHotelProfile({...hotelProfile, zone: e.target.value})} required>
                                <option value="">Select Zone</option>
                                {ZONES_AM.map(z => <option key={z} value={z}>{z}</option>)}
                            </select>
                        </>
                    ) : (
                        <select className="w-full p-4 border-2 rounded-lg font-bold" onChange={(e) => setPoliceProfile({...policeProfile, zone: e.target.value})} required>
                            <option value="">Select Assigned Zone</option>
                            {ZONES_AM.map(z => <option key={z} value={z}>{z}</option>)}
                        </select>
                    )}
                    <button type="submit" className="w-full bg-slate-900 text-white p-4 rounded-xl font-black uppercase">Start System</button>
                </form>
            </div>
        </div>
      )
  }

  if (authState === 'login') {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <form onSubmit={handleLogin} className="bg-white p-10 rounded-[2.5rem] w-full max-w-md text-center">
                <img src={LOGO_PATH} className="w-20 h-20 mx-auto mb-4" />
                <h1 className={`text-2xl mb-8 ${GOLDEN_GRADIENT}`}>{t.appName}</h1>
                <StandardInput label="Username" icon={<User size={16}/>} />
                <div className="h-4" />
                <StandardInput label="Password" type="password" icon={<Key size={16}/>} />
                <button className="w-full bg-slate-900 text-white p-4 rounded-xl font-black uppercase mt-6">Login</button>
            </form>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F172A] text-white p-6 hidden md:flex flex-col">
        <h2 className={`text-lg mb-10 ${GOLDEN_GRADIENT}`}>{t.appName}</h2>
        <nav className="space-y-2 flex-1">
          <NavButton icon={<LayoutDashboard size={18}/>} label={t.dashboard} active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          {currentUser?.role === UserRole.RECEPTION && (
            <NavButton icon={<UserPlus size={18}/>} label={t.registerGuest} active={view === 'registerGuest'} onClick={() => setView('registerGuest')} />
          )}
          <NavButton icon={<Users size={18}/>} label={t.guestList} active={view === 'guestList'} onClick={() => setView('guestList')} />
          <NavButton icon={<Bell size={18}/>} label={t.notifications} active={view === 'notifications'} count={notifications.length} onClick={() => setView('notifications')} />
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 font-bold uppercase text-xs p-4 hover:bg-red-500/10 rounded-xl">
          <LogOut size={16}/> {t.logout}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto p-4 sm:p-8">
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border">
            <h3 className="font-black uppercase text-slate-800">{t[view] || view}</h3>
            <div className="flex items-center gap-4">
                {isSyncing && <RefreshCw size={16} className="animate-spin text-amber-500" />}
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase">{currentUser?.role.replace('_', ' ')}</p>
                    <p className="text-[9px] text-slate-400">{hotelProfile.name || policeProfile.zone}</p>
                </div>
            </div>
        </header>

        {view === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
                <Users className="text-indigo-500 mb-2" />
                <h4 className="text-3xl font-black">{guests.length}</h4>
                <p className="text-xs text-slate-400 uppercase font-bold">Total Guests Recorded</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
                <AlertTriangle className="text-red-500 mb-2" />
                <h4 className="text-3xl font-black">{guests.filter(g => g.isWanted).length}</h4>
                <p className="text-xs text-slate-400 uppercase font-bold">Wanted Hits Detected</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
                <Wifi className="text-emerald-500 mb-2" />
                <h4 className="text-3xl font-black">Active</h4>
                <p className="text-xs text-slate-400 uppercase font-bold">Cloud Sync Status</p>
            </div>
          </div>
        )}

        {view === 'registerGuest' && (
            <div className="max-w-xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-xl border">
                <form onSubmit={saveGuest} className="space-y-4">
                    <StandardInput label={t.guestName} value={newGuest.fullName} onChange={(v:any) => setNewGuest({...newGuest, fullName: v})} required icon={<User size={16}/>} />
                    <StandardInput label={t.nationality} value={newGuest.nationality} onChange={(v:any) => setNewGuest({...newGuest, nationality: v})} required icon={<Globe size={16}/>} />
                    <StandardInput label={t.roomNumber} value={newGuest.roomNumber} onChange={(v:any) => setNewGuest({...newGuest, roomNumber: v})} required icon={<Key size={16}/>} />
                    <button type="submit" disabled={isSyncing} className="w-full bg-slate-900 text-white p-4 rounded-xl font-black uppercase shadow-lg active:scale-95 transition-all">
                        {isSyncing ? "Syncing..." : t.save}
                    </button>
                </form>
            </div>
        )}

        {view === 'guestList' && (
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500">
                        <tr>
                            <th className="p-6">Guest Info</th>
                            <th className="p-6">Location</th>
                            <th className="p-6">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredGuests.map(g => (
                            <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-6">
                                    <p className="font-black uppercase text-sm">{g.fullName}</p>
                                    <p className="text-[10px] text-slate-400">{g.nationality} | Room {g.roomNumber}</p>
                                </td>
                                <td className="p-6">
                                    <p className="text-xs font-bold uppercase">{g.hotelName}</p>
                                    <p className="text-[10px] text-slate-400">{g.hotelZone}</p>
                                </td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black ${g.isWanted ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500 text-white'}`}>
                                        {g.isWanted ? 'WANTED' : 'SECURE'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </main>
    </div>
  );
}
