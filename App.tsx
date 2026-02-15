
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Guest, WantedPerson, Notification, Language, HotelProfile, UserAccount, PoliceProfile } from './types';
import { translations } from './translations';
import { 
  Users, UserPlus, AlertTriangle, FileText, LogOut, Bell, Camera, Image as ImageIcon, Download, 
  Printer, Globe, Plus, Settings, Edit, X, Maximize2, CheckCircle2, ShieldCheck, Search, MapPin, 
  Building2, FileBarChart, Menu, Info, ShieldAlert, TrendingUp, Activity, 
  Phone, Fingerprint, Map, LayoutDashboard, Save, UserCircle, Key, ChevronRight, Cloud
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const LOGO_PATH = 'https://raw.githubusercontent.com/Anu-Anu/Begu-Engeda/main/logo.png';
const GOLDEN_GRADIENT = "text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 font-black drop-shadow-sm";
const ZONES = ["Assosa Zone", "Kamashi Zone", "Metekel Zone", "Mao Komo Special Woreda", "Assosa City Administration", "Gilgel Beles City Administration"];

// Fixed Credentials as requested
const AUTHORIZED_ACCOUNTS: UserAccount[] = [
  { username: 'police', phoneNumber: '0900000000', password: '1234', role: UserRole.LOCAL_POLICE, isVerified: true, isProfileComplete: false },
  { username: 'reception', phoneNumber: '0911111111', password: '1234', role: UserRole.RECEPTION, isVerified: true, isProfileComplete: false }
];

// --- REFINED UI COMPONENTS (Moved outside for performance) ---

const NavButton = ({ icon, label, active, onClick, count }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wide transition-all duration-200 group active:scale-[0.98]
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
        type={type} 
        placeholder={placeholder}
        className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 focus:border-amber-500 focus:bg-white outline-none transition-all shadow-sm text-left" 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        required={required}
        autoComplete="off"
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
  
  const [guests, setGuests] = useState<Guest[]>(() => JSON.parse(localStorage.getItem('begu_guests') || '[]'));
  const [wanted, setWanted] = useState<WantedPerson[]>(() => JSON.parse(localStorage.getItem('begu_wanted') || '[]'));
  const [notifications, setNotifications] = useState<Notification[]>(() => JSON.parse(localStorage.getItem('begu_notifications') || '[]'));
  
  const [view, setView] = useState<string>('dashboard');
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const [hotelProfile, setHotelProfile] = useState<HotelProfile>(() => JSON.parse(localStorage.getItem('begu_currentHotel') || '{"name":"","address":"","zone":"","receptionistName":"","phoneNumber":""}'));
  const [policeProfile, setPoliceProfile] = useState<PoliceProfile>(() => JSON.parse(localStorage.getItem('begu_currentPolice') || '{"name":"","address":"","zone":""}'));

  const t = translations[lang];

  useEffect(() => {
    if (currentUser) {
      if (!currentUser.isProfileComplete) {
        setAuthState(currentUser.role === UserRole.RECEPTION ? 'setup_hotel' : 'setup_police');
      } else {
        setAuthState('authenticated');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('begu_guests', JSON.stringify(guests));
    localStorage.setItem('begu_wanted', JSON.stringify(wanted));
    localStorage.setItem('begu_notifications', JSON.stringify(notifications));
    localStorage.setItem('begu_currentHotel', JSON.stringify(hotelProfile));
    localStorage.setItem('begu_currentPolice', JSON.stringify(policeProfile));
    if (currentUser) localStorage.setItem('begu_active_session', JSON.stringify(currentUser));
    else localStorage.removeItem('begu_active_session');
  }, [guests, wanted, notifications, hotelProfile, policeProfile, currentUser]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.identifier || !loginData.password) return;
    setIsSyncing(true);
    // Mimic API delay
    setTimeout(() => {
      setIsSyncing(false);
      const acc = AUTHORIZED_ACCOUNTS.find(a => 
        (a.username === loginData.identifier.toLowerCase()) && 
        a.password === loginData.password
      );
      if (acc) {
        // Load existing profile from storage if available
        const savedHotel = JSON.parse(localStorage.getItem(`begu_hotel_${acc.username}`) || 'null');
        const savedPolice = JSON.parse(localStorage.getItem(`begu_police_${acc.username}`) || 'null');
        
        if (savedHotel) setHotelProfile(savedHotel);
        if (savedPolice) setPoliceProfile(savedPolice);

        setCurrentUser({
          ...acc,
          isProfileComplete: acc.role === UserRole.RECEPTION ? !!savedHotel : !!savedPolice
        });
        
        setAuthState(!(acc.role === UserRole.RECEPTION ? !!savedHotel : !!savedPolice) 
          ? (acc.role === UserRole.RECEPTION ? 'setup_hotel' : 'setup_police') 
          : 'authenticated');
      } else {
        alert(lang === 'am' ? "የተሳሳተ ተጠቃሚ ስም ወይም የይለፍ ቃል!" : "Invalid username or password!");
      }
    }, 600);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthState('login');
    setView('dashboard');
    setLoginData({ identifier: '', password: '' });
  };

  const handleSetupSubmit = (e: React.FormEvent, type: 'hotel' | 'police') => {
    e.preventDefault();
    const isComplete = type === 'hotel' ? (hotelProfile.name && hotelProfile.zone) : (policeProfile.name && policeProfile.zone);
    if (isComplete && currentUser) {
      const updatedUser = { ...currentUser, isProfileComplete: true };
      setCurrentUser(updatedUser);
      // Save profile specifically for this account
      if (type === 'hotel') localStorage.setItem(`begu_hotel_${currentUser.username}`, JSON.stringify(hotelProfile));
      else localStorage.setItem(`begu_police_${currentUser.username}`, JSON.stringify(policeProfile));
      setAuthState('authenticated');
    } else alert(lang === 'am' ? "እባክዎን ሁሉንም መረጃዎች ይሙሉ!" : "Please fill all details.");
  };

  const saveGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuest.fullName || !newGuest.nationality || !newGuest.roomNumber) return;
    const guest: Guest = {
      ...newGuest,
      id: Math.random().toString(36).substr(2, 9),
      hotelId: hotelProfile.name,
      hotelName: hotelProfile.name,
      hotelAddress: hotelProfile.address,
      hotelZone: hotelProfile.zone,
      receptionistName: currentUser?.username || '',
      receptionistPhone: currentUser?.phoneNumber || '',
      checkInDate: new Date().toISOString().split('T')[0],
      isWanted: wanted.some(w => w.fullName.toLowerCase() === newGuest.fullName.toLowerCase())
    };
    setGuests([guest, ...guests]);
    if (guest.isWanted) {
      setNotifications([{
        id: Date.now().toString(),
        title: t.alertWantedFound,
        message: `${guest.fullName} checked into ${guest.hotelName}`,
        type: 'danger',
        timestamp: new Date().toLocaleTimeString(),
        targetZone: guest.hotelZone
      }, ...notifications]);
    }
    setNewGuest({ fullName: '', nationality: '', roomNumber: '', idPhoto: '' });
    setView('guestList');
  };

  const [newGuest, setNewGuest] = useState({ fullName: '', nationality: '', roomNumber: '', idPhoto: '' });

  const filteredGuests = useMemo(() => {
    let list = guests;
    if (currentUser?.role === UserRole.LOCAL_POLICE) list = guests.filter(g => g.hotelZone === policeProfile.zone);
    else if (currentUser?.role === UserRole.RECEPTION) list = guests.filter(g => g.hotelName === hotelProfile.name);
    return list.filter(g => g.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [guests, currentUser, hotelProfile, policeProfile, searchTerm]);

  // --- AUTH SCREENS ---

  if (authState !== 'authenticated') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-[2rem] shadow-2xl p-8 sm:p-10 w-full max-w-md animate-in zoom-in-95 duration-200">
          <img src={LOGO_PATH} className="w-16 h-16 mx-auto mb-4" onError={(e) => { e.currentTarget.src = "https://img.icons8.com/color/512/police-badge.png" }} />
          <h1 className={`text-2xl text-center mb-1 ${GOLDEN_GRADIENT}`}>{t.appName}</h1>
          <p className="text-[10px] font-black text-gray-400 text-center uppercase mb-8 tracking-widest">{t.developedBy}</p>
          
          {authState === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <StandardInput label={t.username} value={loginData.identifier} onChange={(v:any) => setLoginData({...loginData, identifier: v})} required icon={<UserCircle size={16}/>} placeholder="Username" />
              <StandardInput label={t.password} value={loginData.password} onChange={(v:any) => setLoginData({...loginData, password: v})} type="password" required icon={<Key size={16}/>} placeholder="Password" />
              <button 
                type="submit"
                disabled={isSyncing || !loginData.identifier || !loginData.password} 
                className={`w-full font-black py-4 rounded-lg shadow-lg transition-all uppercase text-xs tracking-widest mt-4 flex items-center justify-center gap-3 active:scale-[0.98] 
                ${(!loginData.identifier || !loginData.password) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}>
                {isSyncing ? <Activity size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                {isSyncing ? "Verifying..." : t.login}
              </button>
            </form>
          )}

          {(authState === 'setup_hotel' || authState === 'setup_police') && (
            <form onSubmit={(e) => handleSetupSubmit(e, authState === 'setup_hotel' ? 'hotel' : 'police')} className="space-y-4">
              <h3 className="text-lg font-black text-slate-800 uppercase text-center mb-2">{authState === 'setup_hotel' ? t.setupHotel : t.setupPolice}</h3>
              <StandardInput 
                label={authState === 'setup_hotel' ? t.hotel : t.policeOfficeName} 
                value={authState === 'setup_hotel' ? hotelProfile.name : policeProfile.name} 
                onChange={(v:any) => authState === 'setup_hotel' ? setHotelProfile({...hotelProfile, name: v}) : setPoliceProfile({...policeProfile, name: v})} 
                required icon={authState === 'setup_hotel' ? <Building2 size={16}/> : <ShieldCheck size={16}/>} 
              />
              <StandardInput 
                label={authState === 'setup_hotel' ? t.hotelAddress : t.location} 
                value={authState === 'setup_hotel' ? hotelProfile.address : policeProfile.address} 
                onChange={(v:any) => authState === 'setup_hotel' ? setHotelProfile({...hotelProfile, address: v}) : setPoliceProfile({...policeProfile, address: v})} 
                required icon={<MapPin size={16}/>} 
              />
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">{t.zone}</label>
                <select className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg px-4 py-3 text-sm font-semibold outline-none focus:border-amber-500 appearance-none" value={authState === 'setup_hotel' ? hotelProfile.zone : policeProfile.zone} onChange={e => authState === 'setup_hotel' ? setHotelProfile({...hotelProfile, zone: e.target.value}) : setPoliceProfile({...policeProfile, zone: e.target.value})} required>
                  <option value="">Select Zone</option>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <button 
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-lg uppercase tracking-widest text-xs mt-4 shadow-lg active:scale-[0.98]">
                {t.save}
              </button>
            </form>
          )}

          <div className="mt-8 flex justify-center gap-4 pt-4 border-t border-slate-100">
            <button onClick={() => setLang('am')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${lang === 'am' ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-400'}`}>አማርኛ</button>
            <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${lang === 'en' ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-400'}`}>ENGLISH</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-900 overflow-hidden">
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/80 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
      
      <aside className={`fixed md:relative z-50 w-64 h-full bg-[#0F172A] text-white flex flex-col transition-all duration-300 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 border-b border-white/5 text-center">
          <img src={LOGO_PATH} className="w-12 h-12 mx-auto mb-3" />
          <h2 className={`text-lg font-bold ${GOLDEN_GRADIENT}`}>{t.appName}</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavButton icon={<LayoutDashboard size={16}/>} label={t.dashboard} active={view === 'dashboard'} onClick={() => {setView('dashboard'); setIsSidebarOpen(false);}} />
          {currentUser?.role === UserRole.RECEPTION && (
            <>
              <NavButton icon={<UserPlus size={16}/>} label={t.registerGuest} active={view === 'registerGuest'} onClick={() => {setView('registerGuest'); setIsSidebarOpen(false);}} />
              <NavButton icon={<Users size={16}/>} label={t.guestList} active={view === 'guestList'} onClick={() => {setView('guestList'); setIsSidebarOpen(false);}} />
            </>
          )}
          {(currentUser?.role === UserRole.LOCAL_POLICE || currentUser?.role === UserRole.SUPER_POLICE) && (
            <>
              <NavButton icon={<AlertTriangle size={16}/>} label={t.wantedPersons} active={view === 'addWanted'} onClick={() => {setView('addWanted'); setIsSidebarOpen(false);}} />
              <NavButton icon={<Users size={16}/>} label={t.guestList} active={view === 'guestList'} onClick={() => {setView('guestList'); setIsSidebarOpen(false);}} />
            </>
          )}
          <NavButton icon={<Bell size={16}/>} label={t.notifications} active={view === 'notifications'} count={notifications.length} onClick={() => {setView('notifications'); setIsSidebarOpen(false);}} />
          <NavButton icon={<Info size={16}/>} label={t.appUtility} active={view === 'utility'} onClick={() => {setView('utility'); setIsSidebarOpen(false);}} />
          <NavButton icon={<Settings size={16}/>} label={t.settings} active={view === 'settings'} onClick={() => {setView('settings'); setIsSidebarOpen(false);}} />
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all active:scale-[0.98]">
            <LogOut size={14}/> {t.logout}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm z-30">
          <div className="flex items-center gap-3">
             <button className="md:hidden p-2 text-slate-600 active:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}><Menu size={20}/></button>
             <h3 className="font-black text-slate-800 uppercase text-[11px] sm:text-base">{t[view] || view}</h3>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setLang(lang === 'am' ? 'en' : 'am')} className="p-2 bg-slate-50 border rounded-lg active:scale-95 transition-all"><Globe size={16} className="text-amber-600" /></button>
             <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border rounded-lg">
                <div className="text-right hidden sm:block">
                   <p className="text-[10px] font-black text-slate-900 uppercase truncate max-w-[80px] text-left">{currentUser?.username}</p>
                   <p className="text-[8px] text-amber-600 font-bold uppercase text-left">{currentUser?.role}</p>
                </div>
                <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center text-white font-black text-xs">{currentUser?.username[0].toUpperCase()}</div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          {zoomImg && (
            <div className="fixed inset-0 bg-slate-950/95 z-[100] flex items-center justify-center p-4" onClick={() => setZoomImg(null)}>
              <div className="relative max-w-2xl w-full">
                <button className="absolute -top-10 right-0 text-white p-2"><X size={20}/></button>
                <img src={zoomImg} className="w-full h-auto max-h-[80vh] rounded-lg shadow-2xl object-contain border border-white/20" />
              </div>
            </div>
          )}

          <div className="max-w-5xl mx-auto space-y-6">
            {view === 'dashboard' && <DashboardView user={currentUser} t={t} guests={filteredGuests} notifications={notifications} wanted={wanted} setView={setView} />}
            {view === 'registerGuest' && <GuestEntryForm newGuest={newGuest} setNewGuest={setNewGuest} onSubmit={saveGuest} t={t} />}
            
            {(view === 'guestList' || view === 'reports') && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center no-print">
                   <div className="relative w-full max-w-sm">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                     <input type="text" placeholder={t.searchPlaceholder} className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-amber-500 font-semibold text-sm shadow-sm transition-all text-left" 
                       value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                   </div>
                   <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={() => window.print()} className="flex-1 px-4 py-2.5 bg-white border rounded-lg hover:bg-slate-50 font-bold uppercase text-[10px] active:scale-[0.98] transition-all"><Printer size={14} className="inline mr-2"/> {t.print}</button>
                      <button className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold uppercase text-[10px] active:scale-[0.98] transition-all"><Download size={14} className="inline mr-2"/> {t.download}</button>
                   </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b bg-slate-50/30">
                    <h3 className="text-lg font-black text-slate-900 uppercase text-left">{t.fullTableRecord}</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 text-left">Official Surveillance Feed</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-500">
                        <tr>
                          <th className="px-6 py-4">Evidence</th>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Bed ID</th>
                          <th className="px-6 py-4">Property</th>
                          <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                        {filteredGuests.map((g: any) => (
                          <tr key={g.id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-4">
                              <div className="w-12 h-16 rounded border border-slate-200 cursor-zoom-in overflow-hidden shadow-sm" onClick={() => setZoomImg(g.idPhoto)}>
                                <img src={g.idPhoto} className="w-full h-full object-cover" />
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-black text-slate-900 mb-0.5 text-left">{g.fullName}</p>
                              <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-bold text-left">
                                <Globe size={12}/> {g.nationality}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-slate-100 rounded text-slate-900 font-black border border-slate-200 text-sm">#{g.roomNumber}</span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-slate-900 font-bold text-left">{g.hotelName}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5 uppercase text-left">{g.hotelZone}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {g.isWanted ? (
                                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-full text-[9px] font-black shadow-lg animate-pulse">
                                  <AlertTriangle size={12}/> WANTED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-full text-[9px] font-black">
                                  <CheckCircle2 size={12}/> CLEAR
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {view === 'utility' && <AppUtility t={t} />}
            {view === 'notifications' && <NotificationsFeed notifications={notifications} t={t} setView={setView} />}
            
            {view === 'settings' && (
              <div className="max-w-md mx-auto bg-white p-10 rounded-[2rem] shadow-xl border border-slate-100">
                <h3 className="text-lg font-black mb-6 uppercase text-center">{t.settings}</h3>
                <div className="space-y-4">
                  <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1 text-left">Active User</p>
                    <p className="font-black text-slate-900 text-left">{currentUser?.username}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 text-left">{currentUser?.role}</p>
                  </div>
                  <button onClick={() => alert("Profile Synced!")} className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-lg shadow-md transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-[0.98]">
                    <Save size={14}/> Sync Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardView({ t, guests, notifications, wanted, setView }: any) {
  const stats = [
    { l: t.guestList, v: guests.length, c: 'bg-indigo-600', icon: <Users size={20}/> },
    { l: t.wantedPersons, v: wanted.length, c: 'bg-red-600', icon: <AlertTriangle size={20}/> },
    { l: t.notifications, v: notifications.length, c: 'bg-amber-600', icon: <Bell size={20}/> }
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.l} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer overflow-hidden" 
            onClick={() => setView(s.l === t.guestList ? 'guestList' : s.l === t.wantedPersons ? 'wantedPersons' : 'notifications')}>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5 text-left">{s.l}</p>
              <p className="text-3xl font-black text-slate-900 text-left">{s.v}</p>
            </div>
            <div className={`${s.c} w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-md group-hover:rotate-6 transition-all`}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 h-[300px] flex flex-col">
          <h4 className="font-black text-slate-900 uppercase mb-6 text-[10px] flex items-center gap-2 text-left">
            <TrendingUp size={14} className="text-indigo-600"/> Surveillance Stats
          </h4>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{n:'Weekly', v:guests.length},{n:'Alerts', v:notifications.length}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700}} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="v" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col h-[300px]">
          <h4 className="font-black text-slate-900 uppercase mb-6 text-[10px] flex items-center gap-2 text-left">
            <Activity size={14} className="text-emerald-500"/> Activity Feed
          </h4>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-[10px] font-bold uppercase">
              <thead className="bg-slate-50 text-slate-400 sticky top-0">
                <tr><th className="p-2">Name</th><th className="p-2">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {guests.slice(0, 8).map(g => (
                  <tr key={g.id} className="hover:bg-slate-50">
                    <td className="p-2 text-slate-800 font-black truncate max-w-[120px] text-left">{g.fullName}</td>
                    <td className="p-2 text-left">
                      {g.isWanted ? <span className="text-red-600">ALERT</span> : <span className="text-emerald-600">SECURE</span>}
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

function GuestEntryForm({ onSubmit, newGuest, setNewGuest, t }: any) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewGuest({...newGuest, idPhoto: reader.result as string});
      reader.readAsDataURL(file);
    }
  };

  const isFormValid = newGuest.fullName && newGuest.nationality && newGuest.roomNumber;

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
      <h3 className="text-xl font-black mb-8 flex items-center gap-3 uppercase text-left"><UserPlus size={24} className="text-indigo-600" /> {t.registerGuest}</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StandardInput label={t.fullName} value={newGuest.fullName} onChange={(v: string) => setNewGuest({...newGuest, fullName: v})} required icon={<Users size={16}/>} placeholder="Full Name" />
          <StandardInput label={t.nationality} value={newGuest.nationality} onChange={(v: string) => setNewGuest({...newGuest, nationality: v})} required icon={<Globe size={16}/>} placeholder="Nationality" />
        </div>
        <StandardInput label={t.roomNumber} value={newGuest.roomNumber} onChange={(v: string) => setNewGuest({...newGuest, roomNumber: v})} required icon={<Plus size={16}/>} placeholder="Bed ID #" />
        
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase ml-1 text-left">{t.idPhoto}</label>
          <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-center cursor-pointer hover:bg-white hover:border-indigo-400 transition-all active:scale-[0.99] group" onClick={() => document.getElementById('idUpload')?.click()}>
            <Camera size={28} className="mx-auto mb-2 text-slate-300 group-hover:text-indigo-500" />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t.capturePhoto}</p>
            <input type="file" id="idUpload" className="hidden" onChange={handleFileUpload} capture="environment" />
          </div>
        </div>

        {newGuest.idPhoto && (
          <div className="relative w-32 h-44 mx-auto mt-2">
            <img src={newGuest.idPhoto} className="w-full h-full object-cover rounded shadow border" />
            <button type="button" onClick={() => setNewGuest({...newGuest, idPhoto: ''})} className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full shadow active:scale-90 transition-all"><X size={14}/></button>
          </div>
        )}

        <button 
          type="submit"
          disabled={!isFormValid}
          className={`w-full font-black py-4 rounded-xl shadow-lg transition-all uppercase text-[11px] tracking-widest mt-6 active:scale-[0.98] 
          ${isFormValid ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
           {t.submit}
        </button>
      </form>
    </div>
  );
}

function AppUtility({ t }: any) {
  return (
    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 text-center max-w-3xl mx-auto">
      <img src={LOGO_PATH} className="w-20 h-20 mx-auto mb-6 opacity-30" />
      <h3 className={`text-2xl leading-tight mb-6 ${GOLDEN_GRADIENT} text-center`}>{t.appUtility}</h3>
      <p className="text-slate-700 font-bold leading-relaxed text-base sm:text-lg text-justify border-l-4 border-amber-400 pl-6 py-2 bg-slate-50/50 rounded-r-2xl">
        {t.utilityText}
      </p>
      <div className="mt-12 pt-6 border-t border-slate-100">
        <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[4px] text-center">{t.developerCredit}</p>
      </div>
    </div>
  );
}

function NotificationsFeed({ notifications, t, setView }: any) {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {notifications.map((n: any) => (
        <div key={n.id} className={`p-6 bg-white border-l-[8px] rounded-xl shadow-md flex gap-5 transition-all text-left
          ${n.type === 'danger' ? 'border-red-600 bg-red-50/20' : 'border-indigo-600'}`}>
          <div className={`w-12 h-12 rounded-xl shadow-md flex-shrink-0 flex items-center justify-center 
            ${n.type === 'danger' ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'}`}>
            <ShieldAlert size={20}/>
          </div>
          <div className="flex-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 inline-block text-left">{n.timestamp}</span>
            <h4 className="text-base font-black uppercase text-slate-900 mb-1 text-left">{n.title}</h4>
            <p className="text-xs font-bold text-slate-600 opacity-80 text-left">{n.message}</p>
            {n.guestId && (
              <button onClick={() => setView('guestList')} className="mt-3 px-5 py-2 bg-red-600 active:scale-95 text-white text-[9px] font-black uppercase rounded shadow transition-all">Review Records</button>
            )}
          </div>
        </div>
      ))}
      {notifications.length === 0 && (
        <div className="text-center py-32 opacity-20">
          <ShieldCheck size={80} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-base font-black uppercase tracking-widest text-slate-400 text-center">Security Online</h3>
        </div>
      )}
    </div>
  );
}
