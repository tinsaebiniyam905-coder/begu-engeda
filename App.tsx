import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Guest, WantedPerson, Notification, Language, HotelProfile } from './types';
import { translations } from './translations';
import { 
  Users, UserPlus, AlertTriangle, FileText, LogOut, Bell, Camera, Image as ImageIcon, Download, 
  Printer, Globe, Plus, Settings, Edit, X, Maximize2, CheckCircle2, ShieldCheck, Search, MapPin, 
  Building2, FileBarChart, Menu, Info, ChevronRight, ShieldAlert, History, TrendingUp, Activity, 
  Phone, Fingerprint, Map
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

  const [newGuest, setNewGuest] = useState({ fullName: '', nationality: '', roomNumber: '', idPhoto: '' });
  const [newWanted, setNewWanted] = useState({ fullName: '', photo: '', description: '', crime: '' });

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

  const visibleGuests = useMemo(() => {
    let list = guests;
    if (user?.role === UserRole.LOCAL_POLICE && user.zone) {
      list = guests.filter(g => g.hotelZone === user.zone);
    }
    return list.filter(g => g.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [guests, user, searchTerm]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm">
          <img src={LOGO_PATH} className="w-24 h-24 mx-auto mb-6" />
          <h1 className={`text-3xl text-center mb-1 ${GOLDEN_GRADIENT}`}>{t.appName}</h1>
          <p className="text-[10px] font-bold text-gray-500 text-center uppercase mb-8">{t.developedBy}</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder={t.username} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500 font-bold" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} required />
            <input type="password" placeholder={t.password} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500 font-bold" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required />
            <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-3.5 rounded-lg transition-all shadow-lg uppercase text-sm mt-4">{t.login}</button>
          </form>
          <div className="mt-8 flex justify-center gap-4">
            <button onClick={() => setLang('am')} className={`px-4 py-1.5 rounded-full text-[10px] font-black ${lang === 'am' ? 'bg-amber-500 text-white' : 'bg-gray-100'}`}>አማርኛ</button>
            <button onClick={() => setLang('en')} className={`px-4 py-1.5 rounded-full text-[10px] font-black ${lang === 'en' ? 'bg-amber-500 text-white' : 'bg-gray-100'}`}>EN</button>
          </div>
          <p className="text-[9px] text-gray-400 text-center mt-10 font-bold italic opacity-60">"{t.motto}"</p>
          <p className="text-[8px] text-amber-600 text-center mt-2 font-black uppercase">{t.developerCredit}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      <aside className="w-64 bg-slate-800 text-white flex flex-col no-print hidden md:flex">
        <div className="p-6 border-b border-white/10 text-center">
          <img src={LOGO_PATH} className="w-16 h-16 mx-auto mb-4" />
          <h2 className={`text-xl ${GOLDEN_GRADIENT}`}>{t.appName}</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavItem icon={<TrendingUp size={18}/>} label={t.dashboard} active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          {user.role === UserRole.RECEPTION && (
            <>
              <NavItem icon={<UserPlus size={18}/>} label={t.registerGuest} active={view === 'registerGuest'} onClick={() => setView('registerGuest')} />
              <NavItem icon={<Users size={18}/>} label={t.guestList} active={view === 'guestList'} onClick={() => setView('guestList')} />
              <NavItem icon={<Settings size={18}/>} label={t.settings} active={view === 'settings'} onClick={() => setView('settings')} />
            </>
          )}
          {(user.role === UserRole.LOCAL_POLICE || user.role === UserRole.SUPER_POLICE) && (
            <>
              <NavItem icon={<Plus size={18}/>} label={t.policeNotice} active={view === 'addWanted'} onClick={() => setView('addWanted')} />
              <NavItem icon={<Users size={18}/>} label={t.guestList} active={view === 'guestList'} onClick={() => setView('guestList')} />
              <NavItem icon={<Building2 size={18}/>} label={t.hotelDirectory} active={view === 'hotelDirectory'} onClick={() => setView('hotelDirectory')} />
            </>
          )}
          <NavItem icon={<Bell size={18}/>} label={t.notifications} active={view === 'notifications'} count={notifications.filter(n => !user.zone || n.targetZone === user.zone).length} onClick={() => setView('notifications')} />
          <NavItem icon={<Info size={18}/>} label={t.appUtility} active={view === 'utility'} onClick={() => setView('utility')} />
        </nav>
        <div className="p-4 border-t border-white/10 text-center">
          <p className="text-[8px] text-gray-400 mb-4 opacity-40 uppercase">{t.developerCredit}</p>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-2 bg-red-600/20 text-red-500 rounded-lg text-xs font-bold uppercase"><LogOut size={16}/> {t.logout}</button>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto">
        <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-4">
             <button className="md:hidden" onClick={() => setIsSidebarOpen(true)}><Menu/></button>
             <h3 className="font-bold text-slate-800 uppercase text-sm tracking-widest">{t[view] || view}</h3>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right leading-none hidden sm:block">
                <p className="text-xs font-black text-slate-900 uppercase">{user.username}</p>
                <p className="text-[9px] text-amber-600 font-bold uppercase mt-1">{user.zone || "Headquarters"}</p>
             </div>
             <div className="w-8 h-8 bg-amber-100 rounded text-amber-700 flex items-center justify-center font-bold">{user.username[0]}</div>
          </div>
        </header>

        <main className="p-6 max-w-6xl mx-auto">
          {zoomImg && <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={() => setZoomImg(null)}><img src={zoomImg} className="max-w-full max-h-full rounded shadow-2xl"/></div>}
          
          {view === 'setupHotel' && <SetupForm hotelProfile={hotelProfile} setHotelProfile={setHotelProfile} onSubmit={handleSetupSubmit} t={t} />}
          {view === 'setupPolice' && <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100"><h3 className="text-xl font-bold mb-6 uppercase text-slate-800">Assigned Jurisdiction</h3><div className="space-y-4">{ZONES.map(z => <button key={z} onClick={() => { setUser({...user, zone: z}); setView('dashboard'); }} className="w-full text-left p-4 bg-gray-50 border rounded-lg font-bold text-gray-600 hover:bg-amber-50 hover:border-amber-500 transition-all">{z}</button>)}</div></div>}
          
          {view === 'dashboard' && <Dashboard user={user} t={t} guests={visibleGuests} notifications={notifications} wanted={wanted} setView={setView} />}
          {view === 'guestList' && <ListView items={visibleGuests} t={t} setZoomImg={setZoomImg} />}
          {view === 'registerGuest' && <GuestForm newGuest={newGuest} setNewGuest={setNewGuest} onSubmit={saveGuest} t={t} handleFileUpload={handleFileUpload} />}
          {view === 'addWanted' && <WantedForm wanted={wanted} setWanted={setWanted} t={t} handleFileUpload={handleFileUpload} addWanted={addWanted} newWanted={newWanted} setNewWanted={setNewWanted} />}
          {view === 'hotelDirectory' && <HotelDir hotels={allHotels} t={t} />}
          {view === 'utility' && <div className="bg-white p-10 rounded-xl shadow-sm border space-y-6"><h3 className={`text-2xl text-center ${GOLDEN_GRADIENT}`}>{t.appUtility}</h3><p className="text-gray-600 font-bold leading-relaxed">{t.utilityText}</p><p className="text-amber-700 font-black uppercase text-center mt-10">{t.developerCredit}</p></div>}
          {view === 'reports' && <ReportSection t={t} guests={visibleGuests} user={user} />}
          {view === 'notifications' && <NotifView notifications={notifications.filter(n => !user.zone || n.targetZone === user.zone)} t={t} setView={setView} />}
          {view === 'settings' && <SetupForm hotelProfile={hotelProfile} setHotelProfile={setHotelProfile} onSubmit={handleSetupSubmit} t={t} isSettings />}
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, count }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${active ? 'bg-amber-500 text-white shadow-md' : 'text-gray-400 hover:bg-white/5'}`}>
      <span>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {count > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{count}</span>}
    </button>
  );
}

function SetupForm({ hotelProfile, setHotelProfile, onSubmit, t, isSettings }: any) {
  const [needsId, setNeedsId] = useState(isSettings);
  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border">
      <h3 className="text-xl font-bold mb-6 text-slate-800 uppercase">{t.setupHotel}</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label={t.hotel} value={hotelProfile.name} onChange={v => setHotelProfile({...hotelProfile, name: v})} required />
        <Input label={t.hotelAddress} value={hotelProfile.address} onChange={v => setHotelProfile({...hotelProfile, address: v})} required />
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase">{t.zone}</label>
          <select className="w-full bg-gray-50 border rounded-lg px-4 py-2.5 font-bold" value={hotelProfile.zone} onChange={e => setHotelProfile({...hotelProfile, zone: e.target.value})} required>
            <option value="">Select Zone</option>{ZONES.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <Input label={t.receptionistName} value={hotelProfile.receptionistName} onChange={v => setHotelProfile({...hotelProfile, receptionistName: v})} required />
        <Input label={t.phoneNumber} value={hotelProfile.phoneNumber} onChange={v => setHotelProfile({...hotelProfile, phoneNumber: v})} type="tel" required />
        {needsId && <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-bold text-amber-700 uppercase">Updating requires Digital ID Photo / መታወቂያ ያስፈልጋል</div>}
        <button className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg uppercase text-sm">{t.save}</button>
      </form>
    </div>
  );
}

function Dashboard({ t, guests, notifications, wanted, setView, user }: any) {
  const stats = [
    { l: t.guestList, v: guests.length, c: 'bg-indigo-600' },
    { l: t.wantedPersons, v: wanted.length, c: 'bg-red-600' },
    { l: t.notifications, v: notifications.filter(n => !user.zone || n.targetZone === user.zone).length, c: 'bg-amber-600' }
  ];
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map(s => <div key={s.l} className="bg-white p-6 rounded-xl border flex items-center justify-between shadow-sm cursor-pointer" onClick={() => setView(s.l === t.guestList ? 'guestList' : s.l === t.wantedPersons ? 'wantedPersons' : 'notifications')}>
          <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">{s.l}</p><p className="text-3xl font-black text-gray-800">{s.v}</p></div>
          <div className={`${s.c} w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg`}><Activity size={18}/></div>
        </div>)}
      </div>
      <div className="bg-white p-6 rounded-xl border h-80 shadow-sm"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{n:'Daily', v:guests.length},{n:'Regional', v:12}]}><XAxis dataKey="n"/><YAxis/><Tooltip/><Bar dataKey="v" fill="#4f46e5" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
      <div className="bg-white p-6 rounded-xl border shadow-sm"><h4 className="font-black text-slate-800 uppercase mb-4 text-xs">Recent Regional Activity</h4><div className="overflow-x-auto"><table className="w-full text-left text-[11px] font-bold"><thead className="bg-gray-50 uppercase text-gray-400"><tr><th className="p-3">Guest Name</th><th className="p-3">Property</th><th className="p-3 text-center">Status</th></tr></thead><tbody>{guests.slice(0,5).map(g => <tr key={g.id} className="border-t hover:bg-gray-50"><td className="p-3 uppercase">{g.fullName}</td><td className="p-3 uppercase text-gray-500">{g.hotelName}</td><td className="p-3 text-center">{g.isWanted ? <span className="text-red-600">Wanted</span> : <span className="text-emerald-600">Clear</span>}</td></tr>)}</tbody></table></div></div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">{label}</label>
      <input type={type} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none" value={value} onChange={e => onChange(e.target.value)} required={required} />
    </div>
  );
}

function ListView({ items, t, setZoomImg }: any) {
  return (
    <div className="bg-white rounded-xl shadow border overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-[10px] font-bold uppercase text-gray-400"><tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">Full Name</th><th className="px-6 py-4">Property Data</th><th className="px-6 py-4">Status</th></tr></thead>
        <tbody className="divide-y text-xs font-bold uppercase text-gray-700">
          {items.map((g: any) => <tr key={g.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-3"><img src={g.idPhoto} className="w-8 h-10 rounded object-cover shadow-sm cursor-zoom-in" onClick={() => setZoomImg(g.idPhoto)} /></td>
            <td className="px-6 py-3">{g.fullName}</td>
            <td className="px-6 py-3 leading-tight">{g.hotelName}<br/><span className="text-[9px] text-gray-400">{g.hotelZone}</span></td>
            <td className="px-6 py-3">{g.isWanted ? <span className="text-red-600 animate-pulse">Wanted</span> : <span className="text-emerald-600">Clear</span>}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}

function GuestForm({ onSubmit, newGuest, setNewGuest, t, handleFileUpload }: any) {
  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto bg-white p-8 rounded-xl border shadow-lg space-y-4">
      <h3 className="text-xl font-bold mb-4 uppercase text-slate-800">{t.registerGuest}</h3>
      <Input label={t.fullName} value={newGuest.fullName} onChange={(v: string) => setNewGuest({...newGuest, fullName: v})} required />
      <Input label={t.nationality} value={newGuest.nationality} onChange={(v: string) => setNewGuest({...newGuest, nationality: v})} required />
      <Input label={t.roomNumber} value={newGuest.roomNumber} onChange={(v: string) => setNewGuest({...newGuest, roomNumber: v})} required />
      <div className="p-4 bg-gray-50 border rounded-lg text-center cursor-pointer" onClick={() => document.getElementById('idUpload')?.click()}>
        <Camera className="mx-auto mb-2 text-gray-400" size={24}/>
        <p className="text-[10px] font-black uppercase text-gray-500">{t.idPhoto}</p>
        <input type="file" id="idUpload" className="hidden" onChange={e => handleFileUpload(e, 'guest')} />
      </div>
      {newGuest.idPhoto && <img src={newGuest.idPhoto} className="w-20 h-24 mx-auto object-cover rounded shadow" />}
      <button className="w-full bg-slate-800 text-white font-black py-3 rounded-lg uppercase text-sm mt-4 shadow-xl">Submit to Registry</button>
    </form>
  );
}

function WantedForm({ addWanted, newWanted, setNewWanted, t, handleFileUpload }: any) {
  return (
    <form onSubmit={addWanted} className="max-w-md mx-auto bg-white p-8 rounded-xl border shadow-lg space-y-4">
      <h3 className="text-xl font-bold mb-4 uppercase text-red-600">{t.policeNotice}</h3>
      <Input label={t.fullName} value={newWanted.fullName} onChange={(v: string) => setNewWanted({...newWanted, fullName: v})} required />
      <Input label={t.crime} value={newWanted.crime} onChange={(v: string) => setNewWanted({...newWanted, crime: v})} required />
      <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">{t.description}</label><textarea className="w-full bg-gray-50 border rounded-lg px-4 py-2 text-sm font-bold" value={newWanted.description} onChange={e => setNewWanted({...newWanted, description: e.target.value})} /></div>
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center cursor-pointer" onClick={() => document.getElementById('wantedUpload')?.click()}><Camera className="mx-auto mb-2 text-red-300" size={24}/><p className="text-[10px] font-black text-red-400 uppercase">Upload Profile Photo</p><input type="file" id="wantedUpload" className="hidden" onChange={e => handleFileUpload(e, 'wanted')} /></div>
      {newWanted.photo && <img src={newWanted.photo} className="w-20 h-24 mx-auto object-cover rounded shadow border-2 border-red-200" />}
      <button className="w-full bg-red-600 text-white font-black py-3 rounded-lg uppercase text-sm mt-4 shadow-xl">Publish Bulletin</button>
    </form>
  );
}

function HotelDir({ hotels, t }: any) {
  return (
    <div className="bg-white rounded-xl shadow border overflow-hidden">
      <table className="w-full text-left text-[11px] font-bold uppercase"><thead className="bg-gray-50 text-gray-400"><tr><th className="p-4">Hotel Name</th><th className="p-4">Jurisdiction</th><th className="p-4">Personnel</th></tr></thead><tbody className="divide-y">{hotels.map((h: any) => <tr key={h.id} className="hover:bg-gray-50"><td className="p-4">{h.name}</td><td className="p-4 text-gray-400">{h.zone}</td><td className="p-4">{h.receptionistName}<br/><span className="text-[9px] text-indigo-500 font-black">{h.phoneNumber}</span></td></tr>)}</tbody></table>
    </div>
  );
}

function ReportSection({ t, guests, user }: any) {
  return (
    <div className="bg-white p-10 rounded-xl shadow border text-center space-y-10">
      <div className="flex flex-col items-center"><FileBarChart className="text-amber-500 mb-4" size={48} /><h3 className={`text-2xl uppercase ${GOLDEN_GRADIENT}`}>Official Oversight Ledger</h3><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.developedBy}</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["EXCEL", "WORD", "PPT", "PDF"].map(f => <button key={f} className="p-6 bg-slate-50 border rounded-xl flex flex-col items-center gap-2 hover:bg-amber-50 group transition-all"><Download className="text-gray-400 group-hover:text-amber-600" size={24}/><span className="text-[10px] font-black uppercase text-gray-600">{f}</span></button>)}
      </div>
      <div className="pt-10 border-t flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase text-left no-print">
        <div><p className="mb-6">Auditor Certification</p><div className="h-px bg-gray-100 w-32 mb-1"></div><p className="opacity-40">{t.supervisorName}</p></div>
        <div className="text-right"><p className="mb-6">Regional Seal</p><div className="h-px bg-gray-100 w-32 ml-auto mb-1"></div><p className="opacity-40">{t.signature}</p></div>
      </div>
    </div>
  );
}

function NotifView({ notifications, t, setView }: any) {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {notifications.map((n: any) => <div key={n.id} className={`p-6 bg-white border-l-[6px] rounded-xl shadow-sm flex gap-4 ${n.type === 'danger' ? 'border-red-600' : 'border-indigo-600'}`}>
        <div className={`p-3 rounded-lg ${n.type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}><ShieldAlert size={20}/></div>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2"><p className="text-[9px] font-bold text-gray-400 uppercase">{n.timestamp}</p></div>
          <h4 className="text-xs font-black uppercase text-slate-800 leading-none mb-2">{n.title}</h4>
          <p className="text-[11px] text-gray-500 font-bold leading-relaxed">{n.message}</p>
          {n.guestId && <button onClick={() => setView('guestList')} className="mt-4 px-4 py-1.5 bg-red-600 text-white text-[9px] font-bold uppercase rounded shadow">Intercept Details</button>}
        </div>
      </div>)}
      {notifications.length === 0 && <div className="text-center py-20 text-gray-300 font-black uppercase tracking-widest text-sm select-none opacity-40">System Secure</div>}
    </div>
  );
}
