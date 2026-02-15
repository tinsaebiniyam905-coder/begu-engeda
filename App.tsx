
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

const AUTHORIZED_ACCOUNTS: UserAccount[] = [
  { username: 'police', phoneNumber: 'admin', password: '1234', role: UserRole.LOCAL_POLICE, isVerified: true, isProfileComplete: false },
  { username: 'reception', phoneNumber: '0911000000', password: 'password', role: UserRole.RECEPTION, isVerified: true, isProfileComplete: false },
  { username: 'hotel1', phoneNumber: '0922000000', password: 'pass123', role: UserRole.RECEPTION, isVerified: true, isProfileComplete: false }
];

export default function App() {
  const [lang, setLang] = useState<Language>('am');
  const [authState, setAuthState] = useState<'login' | 'setup_hotel' | 'setup_police' | 'authenticated'>('login');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('begu_active_session');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('begu_accounts');
    return saved ? JSON.parse(saved) : AUTHORIZED_ACCOUNTS;
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

  useEffect(() => localStorage.setItem('begu_accounts', JSON.stringify(accounts)), [accounts]);
  useEffect(() => localStorage.setItem('begu_guests', JSON.stringify(guests)), [guests]);
  useEffect(() => localStorage.setItem('begu_wanted', JSON.stringify(wanted)), [wanted]);
  useEffect(() => localStorage.setItem('begu_notifications', JSON.stringify(notifications)), [notifications]);
  useEffect(() => localStorage.setItem('begu_currentHotel', JSON.stringify(hotelProfile)), [hotelProfile]);
  useEffect(() => localStorage.setItem('begu_currentPolice', JSON.stringify(policeProfile)), [policeProfile]);
  
  useEffect(() => {
    if (currentUser) localStorage.setItem('begu_active_session', JSON.stringify(currentUser));
    else localStorage.removeItem('begu_active_session');
  }, [currentUser]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const acc = accounts.find(a => 
        (a.username === loginData.identifier || a.phoneNumber === loginData.identifier) && 
        a.password === loginData.password
      );
      if (acc) {
        setCurrentUser(acc);
        setAuthState(!acc.isProfileComplete ? (acc.role === UserRole.RECEPTION ? 'setup_hotel' : 'setup_police') : 'authenticated');
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
      const updatedAcc = { ...currentUser, isProfileComplete: true };
      setAccounts(accounts.map(a => a.username === currentUser.username ? updatedAcc : a));
      setCurrentUser(updatedAcc);
      setAuthState('authenticated');
    } else alert(lang === 'am' ? "እባክዎን ሁሉንም መረጃዎች ይሙሉ!" : "Please fill all details.");
  };

  const saveGuest = (e: React.FormEvent) => {
    e.preventDefault();
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

  // --- UI COMPONENTS ---

  const NavButton = ({ icon, label, active, onClick, count }: any) => (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-[1px] transition-all duration-200 group active:scale-[0.96]
      ${active ? 'bg-amber-500 text-white shadow-lg translate-x-1' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      <span>{icon}</span>
      <span className="flex-1 text-left truncate">{label}</span>
      {count > 0 && <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black ring-2 ring-[#0F172A]">{count}</span>}
    </button>
  );

  const StandardInput = ({ label, value, onChange, type = "text", required, icon }: any) => (
    <div className="space-y-1.5 w-full">
      <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors pointer-events-none">{icon}</div>
        <input 
          type={type} 
          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-semibold text-slate-900 text-left placeholder:text-slate-300 focus:border-amber-400 focus:bg-white outline-none transition-all shadow-sm" 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          required={required}
          autoComplete="off"
        />
      </div>
    </div>
  );

  // --- AUTH SCREENS ---

  if (authState !== 'authenticated') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans overflow-y-auto">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 sm:p-12 w-full max-w-md animate-in zoom-in-95 duration-300">
          <img src={LOGO_PATH} className="w-20 h-20 mx-auto mb-6" onError={(e) => { e.currentTarget.src = "https://img.icons8.com/color/512/police-badge.png" }} />
          <h1 className={`text-3xl text-center mb-1 ${GOLDEN_GRADIENT}`}>{t.appName}</h1>
          <p className="text-[10px] font-black text-gray-400 text-center uppercase mb-8 tracking-widest">{t.developedBy}</p>
          
          <div className="space-y-6">
            {authState === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <StandardInput label={t.username + " / " + t.phoneNumber} value={loginData.identifier} onChange={(v:any) => setLoginData({...loginData, identifier: v})} required icon={<UserCircle size={18}/>} />
                <StandardInput label={t.password} value={loginData.password} onChange={(v:any) => setLoginData({...loginData, password: v})} type="password" required icon={<Key size={18}/>} />
                <button disabled={isSyncing} className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.97] text-white font-black py-4 rounded-xl shadow-xl transition-all uppercase text-xs tracking-[2px] mt-4 flex items-center justify-center gap-3">
                  {isSyncing ? <Activity size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                  {isSyncing ? "Verifying..." : t.login}
                </button>
              </form>
            )}

            {authState === 'setup_hotel' && (
              <form onSubmit={(e) => handleSetupSubmit(e, 'hotel')} className="space-y-4">
                <h3 className="text-xl font-black text-slate-800 uppercase text-center mb-2">{t.setupHotel}</h3>
                <StandardInput label={t.hotel} value={hotelProfile.name} onChange={(v:any) => setHotelProfile({...hotelProfile, name: v})} required icon={<Building2 size={18}/>} />
                <StandardInput label={t.hotelAddress} value={hotelProfile.address} onChange={(v:any) => setHotelProfile({...hotelProfile, address: v})} required icon={<MapPin size={18}/>} />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">{t.zone}</label>
                  <select className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold outline-none focus:border-amber-400 appearance-none transition-all" value={hotelProfile.zone} onChange={e => setHotelProfile({...hotelProfile, zone: e.target.value})} required>
                    <option value="">Select Zone</option>
                    {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <button className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.97] text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs mt-4 shadow-lg">{t.save} & {t.submit}</button>
              </form>
            )}

            {authState === 'setup_police' && (
              <form onSubmit={(e) => handleSetupSubmit(e, 'police')} className="space-y-4">
                <h3 className="text-xl font-black text-slate-800 uppercase text-center mb-2">{t.setupPolice}</h3>
                <StandardInput label={t.policeOfficeName} value={policeProfile.name} onChange={(v:any) => setPoliceProfile({...policeProfile, name: v})} required icon={<ShieldCheck size={18}/>} />
                <StandardInput label={t.location} value={policeProfile.address} onChange={(v:any) => setPoliceProfile({...policeProfile, address: v})} required icon={<MapPin size={18}/>} />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">{t.zone}</label>
                  <select className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold outline-none focus:border-amber-400 appearance-none transition-all" value={policeProfile.zone} onChange={e => setPoliceProfile({...policeProfile, zone: e.target.value})} required>
                    <option value="">Select Jurisdiction</option>
                    {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <button className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.97] text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs mt-4 shadow-lg">{t.save}</button>
              </form>
            )}
          </div>

          <div className="mt-10 flex justify-center gap-4 pt-6 border-t border-slate-100">
            <button onClick={() => setLang('am')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${lang === 'am' ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-400'}`}>አማርኛ</button>
            <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${lang === 'en' ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-400'}`}>ENGLISH</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-900 overflow-hidden">
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-950/70 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
      
      <aside className={`fixed md:relative z-50 w-72 h-full bg-[#0F172A] text-white flex flex-col transition-all duration-300 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-10 border-b border-white/5 text-center">
          <img src={LOGO_PATH} className="w-16 h-16 mx-auto mb-4" />
          <h2 className={`text-xl font-bold ${GOLDEN_GRADIENT}`}>{t.appName}</h2>
        </div>
        <nav className="flex-1 p-5 space-y-1.5 overflow-y-auto">
          <NavButton icon={<LayoutDashboard size={18}/>} label={t.dashboard} active={view === 'dashboard'} onClick={() => {setView('dashboard'); setIsSidebarOpen(false);}} />
          {currentUser?.role === UserRole.RECEPTION && (
            <>
              <NavButton icon={<UserPlus size={18}/>} label={t.registerGuest} active={view === 'registerGuest'} onClick={() => {setView('registerGuest'); setIsSidebarOpen(false);}} />
              <NavButton icon={<Users size={18}/>} label={t.guestList} active={view === 'guestList'} onClick={() => {setView('guestList'); setIsSidebarOpen(false);}} />
            </>
          )}
          {(currentUser?.role === UserRole.LOCAL_POLICE || currentUser?.role === UserRole.SUPER_POLICE) && (
            <>
              <NavButton icon={<AlertTriangle size={18}/>} label={t.wantedPersons} active={view === 'addWanted'} onClick={() => {setView('addWanted'); setIsSidebarOpen(false);}} />
              <NavButton icon={<Users size={18}/>} label={t.guestList} active={view === 'guestList'} onClick={() => {setView('guestList'); setIsSidebarOpen(false);}} />
            </>
          )}
          <NavButton icon={<Bell size={18}/>} label={t.notifications} active={view === 'notifications'} count={notifications.length} onClick={() => {setView('notifications'); setIsSidebarOpen(false);}} />
          <NavButton icon={<Info size={18}/>} label={t.appUtility} active={view === 'utility'} onClick={() => {setView('utility'); setIsSidebarOpen(false);}} />
          <NavButton icon={<Settings size={18}/>} label={t.settings} active={view === 'settings'} onClick={() => {setView('settings'); setIsSidebarOpen(false);}} />
        </nav>
        <div className="p-6 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full py-3.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-[11px] font-black uppercase transition-all active:scale-[0.97]">
            <LogOut size={16}/> {t.logout}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-30">
          <div className="flex items-center gap-4">
             <button className="md:hidden p-2 text-slate-600 active:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}><Menu size={22}/></button>
             <h3 className="font-black text-slate-800 uppercase text-xs sm:text-lg">{t[view] || view}</h3>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setLang(lang === 'am' ? 'en' : 'am')} className="p-2.5 bg-slate-50 border rounded-xl hover:bg-slate-100 active:scale-95 transition-all"><Globe size={18} className="text-amber-600" /></button>
             <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 border rounded-xl">
                <div className="text-right hidden sm:block">
                   <p className="text-[10px] font-black text-slate-900 uppercase truncate max-w-[100px]">{currentUser?.username}</p>
                   <p className="text-[8px] text-amber-600 font-bold uppercase tracking-tighter">{currentUser?.role}</p>
                </div>
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xs">{currentUser?.username[0].toUpperCase()}</div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 sm:p-10 custom-scrollbar">
          {zoomImg && (
            <div className="fixed inset-0 bg-slate-950/95 z-[100] flex items-center justify-center p-6" onClick={() => setZoomImg(null)}>
              <div className="relative max-w-4xl w-full">
                <button className="absolute -top-12 right-0 text-white p-2 hover:bg-white/10 rounded-full"><X size={24}/></button>
                <img src={zoomImg} className="w-full h-auto max-h-[85vh] rounded-2xl shadow-2xl object-contain border border-white/20" />
              </div>
            </div>
          )}

          <div className="max-w-6xl mx-auto space-y-8">
            {view === 'dashboard' && <Dashboard user={currentUser} t={t} guests={filteredGuests} notifications={notifications} wanted={wanted} setView={setView} />}
            {view === 'registerGuest' && <GuestEntryForm newGuest={newGuest} setNewGuest={setNewGuest} onSubmit={saveGuest} t={t} />}
            
            {(view === 'guestList' || view === 'reports') && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center no-print">
                   <div className="relative w-full max-w-md">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                     <input type="text" placeholder={t.searchPlaceholder} className="w-full bg-white border-2 border-slate-100 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-amber-400 font-semibold text-sm shadow-sm transition-all text-left" 
                       value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                   </div>
                   <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={() => window.print()} className="flex-1 px-5 py-3 bg-white border rounded-xl hover:bg-slate-50 font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all"><Printer size={16} className="inline mr-2"/> {t.print}</button>
                      <button className="flex-1 px-5 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all"><Download size={16} className="inline mr-2"/> {t.download}</button>
                   </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                  <div className="p-8 border-b bg-slate-50/50">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t.fullTableRecord}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Official Judicial Surveillance Log</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        <tr>
                          <th className="px-10 py-6">ID Evidence</th>
                          <th className="px-10 py-6">Guest Name</th>
                          <th className="px-10 py-6">Bed ID</th>
                          <th className="px-10 py-6">Property Feed</th>
                          <th className="px-10 py-6 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                        {filteredGuests.map((g: any) => (
                          <tr key={g.id} className="hover:bg-slate-50/50 transition-all duration-200">
                            <td className="px-10 py-6">
                              <div className="w-16 h-24 rounded-xl overflow-hidden shadow-lg border border-slate-200 cursor-zoom-in" onClick={() => setZoomImg(g.idPhoto)}>
                                <img src={g.idPhoto} className="w-full h-full object-cover" />
                              </div>
                            </td>
                            <td className="px-10 py-6">
                              <p className="font-black text-slate-900 text-base mb-1">{g.fullName}</p>
                              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                                <Globe size={14}/> {g.nationality} • {g.checkInDate}
                              </div>
                            </td>
                            <td className="px-10 py-6">
                              <span className="px-4 py-2 bg-slate-100 rounded-lg text-slate-900 font-black border border-slate-200 text-base">#{g.roomNumber}</span>
                            </td>
                            <td className="px-10 py-6">
                              <p className="text-slate-900 font-bold">{g.hotelName}</p>
                              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">{g.hotelZone}</p>
                            </td>
                            <td className="px-10 py-6 text-center">
                              {g.isWanted ? (
                                <span className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full text-[10px] font-black shadow-lg animate-pulse">
                                  <AlertTriangle size={14}/> WANTED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-full text-[10px] font-black shadow-md">
                                  <CheckCircle2 size={14}/> CLEAR
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
              <div className="max-w-xl mx-auto bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h3 className="text-xl font-black mb-8 uppercase text-center">{t.settings}</h3>
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Active Session</p>
                    <p className="font-black text-slate-900 text-lg">{currentUser?.username}</p>
                    <p className="text-xs text-slate-500 mt-1">{currentUser?.role}</p>
                  </div>
                  <button onClick={() => alert("Settings saved!")} className="w-full py-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.97] text-white font-black rounded-xl shadow-lg transition-all uppercase tracking-[2px] text-xs flex items-center justify-center gap-3">
                    <Save size={18}/> Sync Data
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

function Dashboard({ t, guests, notifications, wanted, setView }: any) {
  const stats = [
    { l: t.guestList, v: guests.length, c: 'bg-indigo-600', icon: <Users size={24}/> },
    { l: t.wantedPersons, v: wanted.length, c: 'bg-red-600', icon: <AlertTriangle size={24}/> },
    { l: t.notifications, v: notifications.length, c: 'bg-amber-600', icon: <Bell size={24}/> }
  ];
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map(s => (
          <div key={s.l} className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer overflow-hidden relative" 
            onClick={() => setView(s.l === t.guestList ? 'guestList' : s.l === t.wantedPersons ? 'wantedPersons' : 'notifications')}>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.l}</p>
              <p className="text-4xl font-black text-slate-900">{s.v}</p>
            </div>
            <div className={`${s.c} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all group-hover:rotate-12`}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 h-[380px] flex flex-col">
          <h4 className="font-black text-slate-900 uppercase mb-8 text-[10px] tracking-widest flex items-center gap-3">
            <TrendingUp size={18} className="text-indigo-600"/> Surveillance Trend
          </h4>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{n:'Weekly', v:guests.length},{n:'Alerts', v:notifications.length}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'}} />
                <Bar dataKey="v" fill="#4f46e5" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col h-[380px]">
          <h4 className="font-black text-slate-900 uppercase mb-8 text-[10px] tracking-widest flex items-center gap-3">
            <Activity size={18} className="text-emerald-500"/> Live Feed
          </h4>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-[11px] font-bold uppercase">
              <thead className="bg-slate-50 text-slate-400 sticky top-0">
                <tr><th className="p-3">Guest Name</th><th className="p-3">Protocol</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {guests.slice(0, 10).map(g => (
                  <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-800 font-black">{g.fullName}</td>
                    <td className="p-3">
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

  const GroupInput = ({ label, value, onChange, type = "text", required, icon }: any) => (
    <div className="space-y-1.5 w-full">
      <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors pointer-events-none">{icon}</div>
        <input 
          type={type} 
          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-semibold text-slate-900 text-left focus:border-amber-400 focus:bg-white outline-none transition-all" 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          required={required} 
          autoComplete="off"
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 sm:p-14 rounded-[3rem] shadow-2xl border border-slate-100">
      <h3 className="text-2xl font-black mb-10 flex items-center gap-4 uppercase tracking-tighter"><UserPlus size={32} className="text-indigo-600" /> {t.registerGuest}</h3>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GroupInput label={t.fullName} value={newGuest.fullName} onChange={(v: string) => setNewGuest({...newGuest, fullName: v})} required icon={<Users size={20}/>} />
          <GroupInput label={t.nationality} value={newGuest.nationality} onChange={(v: string) => setNewGuest({...newGuest, nationality: v})} required icon={<Globe size={20}/>} />
        </div>
        <GroupInput label={t.roomNumber} value={newGuest.roomNumber} onChange={(v: string) => setNewGuest({...newGuest, roomNumber: v})} required icon={<Plus size={20}/>} />
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase ml-1">{t.idPhoto}</label>
          <div className="p-12 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2rem] text-center cursor-pointer hover:bg-white hover:border-indigo-400 active:scale-[0.99] transition-all group" onClick={() => document.getElementById('idUpload')?.click()}>
            <Camera size={36} className="mx-auto mb-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">{t.capturePhoto}</p>
            <input type="file" id="idUpload" className="hidden" onChange={handleFileUpload} capture="environment" />
          </div>
        </div>
        {newGuest.idPhoto && (
          <div className="relative w-40 h-56 mx-auto">
            <img src={newGuest.idPhoto} className="w-full h-full object-cover rounded-2xl shadow-xl ring-4 ring-white border" />
            <button type="button" onClick={() => setNewGuest({...newGuest, idPhoto: ''})} className="absolute -top-3 -right-3 bg-red-600 text-white p-2 rounded-full shadow-lg border-2 border-white active:scale-90 transition-all"><X size={16}/></button>
          </div>
        )}
        <button className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-black py-5 rounded-2xl shadow-xl transition-all uppercase text-sm tracking-widest mt-6">
           {t.submit}
        </button>
      </form>
    </div>
  );
}

function AppUtility({ t }: any) {
  return (
    <div className="bg-white p-10 sm:p-20 rounded-[4rem] shadow-xl border border-slate-100 text-center max-w-4xl mx-auto">
      <img src={LOGO_PATH} className="w-24 h-24 mx-auto mb-8 opacity-20" />
      <h3 className={`text-3xl leading-tight mb-8 ${GOLDEN_GRADIENT}`}>{t.appUtility}</h3>
      <p className="text-slate-700 font-bold leading-relaxed text-lg sm:text-xl text-justify border-l-8 border-amber-400 pl-8 pr-4 py-4 bg-slate-50/50 rounded-r-3xl">
        {t.utilityText}
      </p>
      <div className="mt-16 pt-8 border-t border-slate-50">
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[5px]">{t.developerCredit}</p>
      </div>
    </div>
  );
}

function NotificationsFeed({ notifications, t, setView }: any) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {notifications.map((n: any) => (
        <div key={n.id} className={`p-8 bg-white border-l-[10px] rounded-[2rem] shadow-lg flex gap-6 transition-all hover:-translate-x-1
          ${n.type === 'danger' ? 'border-red-600 bg-red-50/20' : 'border-indigo-600'}`}>
          <div className={`w-16 h-16 rounded-2xl shadow-lg flex-shrink-0 flex items-center justify-center 
            ${n.type === 'danger' ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'}`}>
            <ShieldAlert size={28}/>
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 inline-block">{n.timestamp}</span>
            <h4 className="text-xl font-black uppercase text-slate-900 mb-2">{n.title}</h4>
            <p className="text-sm font-bold text-slate-600 opacity-80">{n.message}</p>
            {n.guestId && (
              <button onClick={() => setView('guestList')} className="mt-4 px-6 py-2.5 bg-red-600 active:scale-95 text-white text-[10px] font-black uppercase rounded-lg shadow-md transition-all">Review Records</button>
            )}
          </div>
        </div>
      ))}
      {notifications.length === 0 && (
        <div className="text-center py-40 opacity-20">
          <ShieldCheck size={100} className="mx-auto mb-6 text-slate-300" />
          <h3 className="text-xl font-black uppercase tracking-widest text-slate-400">All Systems Clear</h3>
        </div>
      )}
    </div>
  );
}
