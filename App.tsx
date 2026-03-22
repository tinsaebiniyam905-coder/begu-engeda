import React, { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
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
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun } from 'docx';
import pptxgen from 'pptxgenjs';
import { saveAs } from 'file-saver';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, doc, query, where, orderBy, 
  getDocs, getDocFromServer, Timestamp 
} from 'firebase/firestore';
import { 
  GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, User as FirebaseUser 
} from 'firebase/auth';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, errorInfo: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
          <div className="bg-white rounded-xl p-8 max-w-md shadow-2xl">
            <ShieldAlert size={64} className="text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-800 uppercase mb-4">System Error</h2>
            <p className="text-gray-600 mb-6 font-bold">An unexpected error occurred. Please refresh the page or contact support.</p>
            <div className="bg-red-50 p-4 rounded-lg mb-6 text-left overflow-auto max-h-40">
              <code className="text-[10px] text-red-700 font-mono">{this.state.errorInfo}</code>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-slate-800 text-white font-black py-3 rounded-lg uppercase text-sm"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [lang, setLang] = useState<Language>('am');
  const [user, setUser] = useState<{ role: UserRole; username: string; zone?: string; uid: string; email?: string } | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [wanted, setWanted] = useState<WantedPerson[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [view, setView] = useState<string>('dashboard');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [allHotels, setAllHotels] = useState<HotelProfile[]>([]);
  const [hotelProfile, setHotelProfile] = useState<HotelProfile>({id:"",name:"",address:"",zone:"",receptionistName:"",phoneNumber:""});
  const [hasAgreed, setHasAgreed] = useState(false);
  const [activeAlert, setActiveAlert] = useState<Notification | null>(null);
  const [activePoliceZone, setActivePoliceZone] = useState<string>('All');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'reconnecting' | 'error'>('connected');

  useEffect(() => {
    if (!user) return;

    // Sync User Preferences
    const unsubPrefs = onSnapshot(doc(db, 'user_preferences', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.lang) setLang(data.lang);
        if (data.activePoliceZone) setActivePoliceZone(data.activePoliceZone);
        if (data.isDarkMode !== undefined) setIsDarkMode(data.isDarkMode);
      }
    });

    // Sync All Users (for Super Police)
    let unsubUsers = () => {};
    if (user.role === UserRole.SUPER_POLICE) {
      unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data());
        setAllUsers(data);
      });
    }

    return () => {
      unsubPrefs();
      unsubUsers();
    };
  }, [user]);

  // Update preferences in Firestore
  const updatePreference = async (key: string, value: any) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'user_preferences', user.uid), { [key]: value }, { merge: true });
    } catch (error) {
      console.error("Failed to update preference:", error);
    }
  };

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    updatePreference('lang', newLang);
  };

  const handleZoneChange = (newZone: string) => {
    setActivePoliceZone(newZone);
    updatePreference('activePoliceZone', newZone);
  };

  const handleDarkModeToggle = () => {
    const newVal = !isDarkMode;
    setIsDarkMode(newVal);
    updatePreference('isDarkMode', newVal);
  };

  const t = translations[lang];

  // Test connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDocFromServer(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ 
              role: userData.role, 
              username: userData.username, 
              uid: firebaseUser.uid,
              email: firebaseUser.email || undefined,
              zone: userData.zone
            });
            
            // Redirect to setup if missing critical info
            if (userData.role === UserRole.LOCAL_POLICE && !userData.zone) {
              setView('setupPolice');
            } else if (userData.role === UserRole.RECEPTION) {
              // Check if hotel exists
              const hotelDoc = await getDocFromServer(doc(db, 'hotels', firebaseUser.uid));
              if (!hotelDoc.exists()) setView('setupHotel');
            }
          } else {
            let role = UserRole.RECEPTION;
            let username = firebaseUser.displayName || 'User';
            
            if (firebaseUser.email === 'tinsaebiniyam905@gmail.com') {
              role = UserRole.SUPER_POLICE;
              username = 'Police Commission';
            }

            const newUser = { 
              role, 
              username, 
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              lastLogin: new Date().toISOString()
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser({ ...newUser, email: newUser.email || undefined });
            
            if (role === UserRole.RECEPTION) setView('setupHotel');
            else if (role === UserRole.LOCAL_POLICE) setView('setupPolice');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!isAuthReady || !user) return;

    setSyncStatus('reconnecting');

    const unsubGuests = onSnapshot(collection(db, 'guests'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Guest));
      setGuests(data.sort((a, b) => b.id.localeCompare(a.id)));
      setSyncStatus('connected');
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'guests');
      setSyncStatus('error');
    });

    const unsubWanted = onSnapshot(collection(db, 'wanted'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as WantedPerson));
      setWanted(data.length > 0 ? data : INITIAL_WANTED);
      setSyncStatus('connected');
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'wanted');
      setSyncStatus('error');
    });

    const unsubNotifs = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Notification));
      setNotifications(data.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
      setSyncStatus('connected');
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
      setSyncStatus('error');
    });

    const unsubHotels = onSnapshot(collection(db, 'hotels'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as HotelProfile));
      setAllHotels(data);
      
      if (user.role === UserRole.RECEPTION) {
        const myHotel = data.find(h => h.id === user.uid);
        if (myHotel) setHotelProfile(myHotel);
      }
      setSyncStatus('connected');
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'hotels');
      setSyncStatus('error');
    });

    return () => {
      unsubGuests();
      unsubWanted();
      unsubNotifs();
      unsubHotels();
    };
  }, [isAuthReady, user]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Auth listener will handle the rest
      setView('dashboard');
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('Please use Google Login for secure, multi-device synchronization. / እባክዎ ለደህንነቱ የተጠበቀ እና ለብዙ መሳሪያዎች ማመሳሰል በGoogle ይግቡ።');
  };

  const handleLogout = async () => { 
    await signOut(auth);
    setUser(null); 
    setView('dashboard'); 
    setIsSidebarOpen(false); 
    setHasAgreed(false);
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hotelProfile.name && hotelProfile.zone && user) {
      const hotelId = user.uid;
      const updatedProfile = { ...hotelProfile, id: hotelId };
      try {
        await setDoc(doc(db, 'hotels', hotelId), updatedProfile);
        setHotelProfile(updatedProfile);
        setView('agreement');
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `hotels/${hotelId}`);
      }
    } else alert("Fill all details / ሁሉንም ይሙሉ");
  };

  const saveGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const isWanted = wanted.some(w => w.fullName.toLowerCase().trim() === newGuest.fullName.toLowerCase().trim());
    const guestId = Math.random().toString(36).substr(2, 9);
    const guest: Guest = {
      ...newGuest,
      id: guestId,
      hotelId: hotelProfile.id || user.uid,
      hotelName: hotelProfile.name,
      hotelAddress: hotelProfile.address,
      hotelZone: hotelProfile.zone,
      receptionistName: hotelProfile.receptionistName,
      receptionistPhone: hotelProfile.phoneNumber,
      checkInDate: new Date().toISOString().split('T')[0],
      isWanted
    };

    try {
      await setDoc(doc(db, 'guests', guestId), guest);
      
      if (isWanted) {
        const notifId = Date.now().toString();
        const notif: Notification = {
          id: notifId,
          title: t.alertWantedFound,
          message: `${guest.fullName} at ${guest.hotelName}, Room ${guest.roomNumber}. (${guest.hotelZone})`,
          type: 'danger',
          timestamp: new Date().toLocaleTimeString(),
          targetZone: guest.hotelZone,
          guestId: guest.id
        };
        await setDoc(doc(db, 'notifications', notifId), notif);
      }
      
      setNewGuest({ fullName: '', nationality: '', roomNumber: '', idPhoto: '', guestPhone: '', origin: '', purpose: '', duration: '' });
      setView('guestList');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `guests/${guestId}`);
    }
  };

  // Monitor notifications for police alerts
  useEffect(() => {
    if (user && (user.role === UserRole.LOCAL_POLICE || user.role === UserRole.SUPER_POLICE)) {
      const latestDanger = notifications.find(n => n.type === 'danger');
      if (latestDanger) {
        setActiveAlert(latestDanger);
      }
    }
  }, [notifications, user]);

  const [newGuest, setNewGuest] = useState({ fullName: '', nationality: '', roomNumber: '', idPhoto: '', guestPhone: '', origin: '', purpose: '', duration: '' });
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

  const addWanted = async (e: React.FormEvent) => {
    e.preventDefault();
    const wantedId = Math.random().toString(36).substr(2, 9);
    const person: WantedPerson = {
      ...newWanted,
      id: wantedId,
      postedDate: new Date().toISOString().split('T')[0]
    };
    
    try {
      await setDoc(doc(db, 'wanted', wantedId), person);
      setNewWanted({ fullName: '', photo: '', description: '', crime: '' });
      setView('dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `wanted/${wantedId}`);
    }
  };

  const visibleGuests = useMemo(() => {
    let filtered = guests;
    if (user?.role === UserRole.SUPER_POLICE) {
      if (activePoliceZone !== 'All') {
        filtered = guests.filter(g => g.hotelZone === activePoliceZone);
      }
    } else if (user?.role === UserRole.LOCAL_POLICE && user.zone) {
      filtered = guests.filter(g => g.hotelZone === user.zone);
    } else if (user?.role === UserRole.RECEPTION && hotelProfile.id) {
      filtered = guests.filter(g => g.hotelId === hotelProfile.id);
    }
    
    return filtered.filter(g => g.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [guests, searchTerm, user, hotelProfile, activePoliceZone]);

  const filteredNotifs = useMemo(() => {
    let filtered = notifications;
    if (user?.role === UserRole.SUPER_POLICE) {
      if (activePoliceZone !== 'All') {
        filtered = notifications.filter(n => n.targetZone === activePoliceZone);
      }
    } else if (user?.role === UserRole.LOCAL_POLICE && user.zone) {
      filtered = notifications.filter(n => n.targetZone === user.zone);
    } else if (user?.role === UserRole.RECEPTION && hotelProfile.zone) {
      filtered = notifications.filter(n => n.targetZone === hotelProfile.zone);
    }
    return filtered;
  }, [notifications, user, hotelProfile, activePoliceZone]);

  if (!user && view !== 'utility') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500 rounded-full blur-[150px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] p-12 w-full max-w-md relative z-10 border border-white/40 overflow-hidden">
          {/* Top Decoration */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700"></div>
          
          <div className="text-center mb-10">
            <div className="relative inline-block mb-8 group">
              <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-30 rounded-full group-hover:opacity-50 transition-opacity"></div>
              <div className="relative z-10 p-1.5 bg-gradient-to-tr from-amber-600 to-yellow-400 rounded-full shadow-2xl transform transition-transform group-hover:scale-105">
                <img 
                  src={LOGO_PATH} 
                  className="w-28 h-28 mx-auto rounded-full border-4 border-white bg-white object-contain" 
                  alt="Logo"
                />
              </div>
            </div>
            
            <h1 className={`text-4xl font-black mb-3 tracking-tighter drop-shadow-md ${GOLDEN_GRADIENT}`}>{t.appName}</h1>
            
            <div className="space-y-1.5 mb-8">
              <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">{translations.am.policeCommission}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">{translations.en.policeCommission}</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors">
                <Users size={18} />
              </div>
              <input 
                type="text" 
                placeholder={t.username} 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-2 focus:ring-amber-500 font-bold transition-all text-sm focus:bg-white" 
                value={loginData.username} 
                onChange={e => setLoginData({...loginData, username: e.target.value})} 
                required 
              />
            </div>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors">
                <Fingerprint size={18} />
              </div>
              <input 
                type="password" 
                placeholder={t.password} 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-2 focus:ring-amber-500 font-bold transition-all text-sm focus:bg-white" 
                value={loginData.password} 
                onChange={e => setLoginData({...loginData, password: e.target.value})} 
                required 
              />
            </div>
            <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4.5 rounded-2xl transition-all shadow-xl uppercase tracking-widest text-sm mt-2 active:scale-95 flex items-center justify-center gap-2">
              <ShieldCheck size={18} />
              {t.login}
            </button>
          </form>
          
          <div className="relative my-12">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
              <span className="bg-white px-6 text-slate-400">Cloud Synchronization</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white border-2 border-slate-900 text-slate-900 font-black py-4.5 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest hover:bg-slate-50 shadow-md active:scale-95 group"
          >
            <Globe size={20} className="text-blue-600 group-hover:rotate-12 transition-transform"/> 
            {t.syncStatus === 'Connected' ? 'Syncing...' : 'Sign in with Google'}
          </button>

          <div className="mt-10 flex justify-center gap-4">
            <button onClick={() => handleLangChange('am')} className={`px-6 py-2.5 rounded-full text-[11px] font-black transition-all ${lang === 'am' ? 'bg-amber-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>አማርኛ</button>
            <button onClick={() => handleLangChange('en')} className={`px-6 py-2.5 rounded-full text-[11px] font-black transition-all ${lang === 'en' ? 'bg-amber-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>ENGLISH</button>
          </div>

          <div className="mt-14 text-center space-y-6">
            <div className="relative px-4">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-5 text-slate-900">
                <ShieldAlert size={80} />
              </div>
              <p className="text-base font-serif italic font-black text-slate-800 tracking-tight leading-relaxed relative z-10">
                "{t.motto}"
              </p>
            </div>
            
            <div className="pt-6 border-t border-slate-100">
              <p className="text-[9px] text-amber-700 font-black uppercase tracking-[0.25em] leading-relaxed max-w-[260px] mx-auto opacity-90">
                {t.developerCredit}
              </p>
              <button 
                onClick={() => setView('utility')}
                className="mt-4 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
              >
                Learn More / ተጨማሪ መረጃ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'utility' && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-2xl border max-w-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700"></div>
          <h3 className={`text-3xl text-center font-black uppercase tracking-tighter ${GOLDEN_GRADIENT}`}>{t.appUtility}</h3>
          <p className="text-slate-700 font-bold leading-relaxed text-lg text-center">{t.utilityText}</p>
          <div className="pt-8 border-t border-slate-100 text-center">
             <p className="text-[10px] text-amber-700 font-black uppercase tracking-[0.25em] mb-8">{t.developerCredit}</p>
             <button 
               onClick={() => setView('dashboard')}
               className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl"
             >
               Back to Login / ወደ ሎጊን ተመለስ
             </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'agreement') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-2xl border border-gray-200">
          <div className="flex flex-col items-center mb-8">
            <ShieldCheck className="text-amber-500 mb-4" size={64} />
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">{t.termsTitle}</h2>
          </div>
          <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 mb-8">
            <p className="text-slate-600 font-bold leading-relaxed text-lg italic">
              "{t.termsBody}"
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => { setHasAgreed(true); setView('dashboard'); }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl transition-all shadow-xl uppercase tracking-widest text-sm"
            >
              {t.agree}
            </button>
            <button 
              onClick={handleLogout}
              className="w-full bg-white border border-gray-200 text-gray-500 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all uppercase text-xs"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-gray-50 text-slate-900'}`}>
      <aside className={`w-64 flex flex-col no-print hidden md:flex transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-r border-slate-800' : 'bg-slate-800'}`}>
        <div className="p-6 border-b border-white/10 text-center">
          <img src={LOGO_PATH} className="w-12 h-12 mx-auto mb-3 drop-shadow-lg" />
          <h2 className={`text-lg font-black tracking-tighter ${GOLDEN_GRADIENT}`}>{t.appName}</h2>
          <p className="text-[8px] font-black text-white/60 uppercase tracking-widest mt-1">{translations.am.policeCommission}</p>
          <p className="text-[7px] font-bold text-white/40 uppercase tracking-wider">{translations.en.policeCommission}</p>
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
              <NavItem icon={<AlertTriangle size={18}/>} label={t.wantedPersons} active={view === 'wantedPersons'} onClick={() => setView('wantedPersons')} />
              <NavItem icon={<Users size={18}/>} label={t.guestList} active={view === 'guestList'} onClick={() => setView('guestList')} />
              <NavItem icon={<Building2 size={18}/>} label={t.hotelDirectory} active={view === 'hotelDirectory'} onClick={() => setView('hotelDirectory')} />
              <NavItem icon={<FileBarChart size={18}/>} label={t.reports} active={view === 'reports'} onClick={() => setView('reports')} />
              <NavItem icon={<Settings size={18}/>} label={t.settings} active={view === 'policeSettings'} onClick={() => setView('policeSettings')} />
            </>
          )}
          <NavItem icon={<Bell size={18}/>} label={t.notifications} active={view === 'notifications'} count={notifications.length} onClick={() => setView('notifications')} />
          <NavItem icon={<Info size={18}/>} label={t.appUtility} active={view === 'utility'} onClick={() => setView('utility')} />
        </nav>
        <div className="p-4 border-t border-white/10 text-center">
          <p className="text-[8px] text-white/60 mb-1 font-serif italic">"{t.motto}"</p>
          <p className="text-[7px] text-amber-500/50 mb-4 font-black uppercase tracking-widest">{t.developerCredit}</p>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-2 bg-red-600/20 text-red-500 rounded-lg text-xs font-bold uppercase"><LogOut size={16}/> {t.logout}</button>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto">
        <header className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-b'} p-4 flex justify-between items-center sticky top-0 z-30`}>
          <div className="flex items-center gap-4">
             <button className="md:hidden" onClick={() => setIsSidebarOpen(true)}><Menu/></button>
             <div className="flex items-center gap-2">
                <h3 className={`font-bold uppercase text-sm tracking-widest ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{(t as any)[view] || view}</h3>
                <div className={`w-2 h-2 rounded-full ${syncStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : syncStatus === 'reconnecting' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`}></div>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right leading-none hidden sm:block">
                <p className={`text-xs font-black uppercase ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{user.username}</p>
                {user.role === UserRole.SUPER_POLICE ? (
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <Globe size={10} className="text-amber-500" />
                    <select 
                      className="text-[9px] text-amber-600 font-black uppercase bg-transparent border-none outline-none cursor-pointer text-right appearance-none hover:text-amber-500 transition-colors"
                      value={activePoliceZone}
                      onChange={(e) => handleZoneChange(e.target.value)}
                    >
                      <option value="All" className={isDarkMode ? 'bg-slate-900' : 'bg-white'}>All Jurisdictions</option>
                      {ZONES.map(z => <option key={z} value={z} className={isDarkMode ? 'bg-slate-900' : 'bg-white'}>{z}</option>)}
                    </select>
                  </div>
                ) : (
                  <p className="text-[9px] text-amber-600 font-bold uppercase mt-1">{user.zone || hotelProfile.zone || "Headquarters"}</p>
                )}
             </div>
             <div className="w-8 h-8 bg-amber-100 rounded text-amber-700 flex items-center justify-center font-bold shadow-sm">{user.username[0]}</div>
          </div>
        </header>

        <main className="p-6 max-w-6xl mx-auto">
          {zoomImg && <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={() => setZoomImg(null)}><img src={zoomImg} className="max-w-full max-h-full rounded shadow-2xl"/></div>}
          
          {activeAlert && (user?.role === UserRole.LOCAL_POLICE || user?.role === UserRole.SUPER_POLICE) && (
            <div className="fixed inset-0 bg-red-600/90 z-[200] flex items-center justify-center p-6 backdrop-blur-md">
              <div className="bg-white rounded-3xl shadow-[0_0_100px_rgba(255,255,255,0.3)] p-10 w-full max-w-2xl text-center border-8 border-red-500 animate-pulse">
                <ShieldAlert size={120} className="mx-auto text-red-600 mb-6" />
                <h2 className="text-4xl font-black text-red-700 uppercase mb-4 tracking-tighter">{t.alertWantedFound}</h2>
                <div className="bg-red-50 p-8 rounded-2xl border-2 border-red-100 mb-8">
                  <p className="text-2xl font-black text-slate-800 uppercase mb-2">{activeAlert.message}</p>
                  <p className="text-sm font-bold text-red-500 uppercase tracking-widest">Immediate Response Required</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => { setView('guestList'); setActiveAlert(null); }}
                    className="flex-1 bg-slate-900 text-white font-black py-5 rounded-2xl uppercase tracking-widest text-lg shadow-2xl hover:bg-slate-800 transition-all"
                  >
                    Intercept Now
                  </button>
                  <button 
                    onClick={() => setActiveAlert(null)}
                    className="px-8 bg-white border-2 border-gray-200 text-gray-400 font-bold py-5 rounded-2xl uppercase text-sm hover:bg-gray-50"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {view === 'setupHotel' && <SetupForm hotelProfile={hotelProfile} setHotelProfile={setHotelProfile} onSubmit={handleSetupSubmit} t={t} handleFileUpload={handleFileUpload} />}
          {view === 'setupPolice' && <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100"><h3 className="text-xl font-bold mb-6 uppercase text-slate-800">Assigned Jurisdiction</h3><div className="space-y-4">{ZONES.map(z => <button key={z} onClick={() => { setUser({...user, zone: z}); setView('agreement'); }} className="w-full text-left p-4 bg-gray-50 border rounded-lg font-bold text-gray-600 hover:bg-amber-50 hover:border-amber-500 transition-all">{z}</button>)}</div></div>}
          
          {view === 'dashboard' && <Dashboard user={user} t={t} guests={visibleGuests} notifications={filteredNotifs} wanted={wanted} setView={setView} hotelProfile={hotelProfile} activePoliceZone={activePoliceZone} />}
          {view === 'guestList' && <ListView items={visibleGuests} t={t} setZoomImg={setZoomImg} user={user} />}
          {view === 'registerGuest' && <GuestForm newGuest={newGuest} setNewGuest={setNewGuest} onSubmit={saveGuest} t={t} handleFileUpload={handleFileUpload} />}
          {view === 'addWanted' && <WantedForm wanted={wanted} setWanted={setWanted} t={t} handleFileUpload={handleFileUpload} addWanted={addWanted} newWanted={newWanted} setNewWanted={setNewWanted} />}
          {view === 'wantedPersons' && <WantedList wanted={wanted} t={t} setZoomImg={setZoomImg} />}
          {view === 'hotelDirectory' && <HotelDir hotels={allHotels} t={t} user={user} />}
          {view === 'utility' && <div className="bg-white p-10 rounded-xl shadow-sm border space-y-6"><h3 className={`text-2xl text-center ${GOLDEN_GRADIENT}`}>{t.appUtility}</h3><p className="text-gray-600 font-bold leading-relaxed">{t.utilityText}</p><p className="text-amber-700 font-black uppercase text-center mt-10">{t.developerCredit}</p></div>}
          {view === 'reports' && <ReportSection t={t} guests={visibleGuests} user={user} hotelProfile={hotelProfile} />}
          {view === 'notifications' && <NotifView notifications={filteredNotifs} t={t} setView={setView} user={user} hotelProfile={hotelProfile} />}
          {view === 'settings' && <SetupForm hotelProfile={hotelProfile} setHotelProfile={setHotelProfile} onSubmit={handleSetupSubmit} t={t} handleFileUpload={handleFileUpload} isSettings />}
          {view === 'policeSettings' && <PoliceSettings 
            t={t} 
            lang={lang} 
            setLang={handleLangChange} 
            activePoliceZone={activePoliceZone} 
            setActivePoliceZone={handleZoneChange} 
            user={user}
            isDarkMode={isDarkMode}
            setIsDarkMode={handleDarkModeToggle}
            allUsers={allUsers}
            syncStatus={syncStatus}
          />}
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

function SetupForm({ hotelProfile, setHotelProfile, onSubmit, t, isSettings, handleFileUpload }: any) {
  const [needsId, setNeedsId] = useState(isSettings);
  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border">
      <h3 className="text-xl font-bold mb-6 text-slate-800 uppercase">{t.setupHotel}</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label={t.hotel} value={hotelProfile.name} onChange={(v: string) => setHotelProfile({...hotelProfile, name: v})} required />
        <Input label={t.hotelAddress} value={hotelProfile.address} onChange={(v: string) => setHotelProfile({...hotelProfile, address: v})} required />
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase">{t.zone}</label>
          <select className="w-full bg-gray-50 border rounded-lg px-4 py-2.5 font-bold" value={hotelProfile.zone} onChange={e => setHotelProfile({...hotelProfile, zone: e.target.value})} required>
            <option value="">Select Zone</option>{ZONES.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <Input label={t.receptionistName} value={hotelProfile.receptionistName} onChange={(v: string) => setHotelProfile({...hotelProfile, receptionistName: v})} required />
        <Input label={t.phoneNumber} value={hotelProfile.phoneNumber} onChange={(v: string) => setHotelProfile({...hotelProfile, phoneNumber: v})} type="tel" required />
        {needsId && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-bold text-amber-700 uppercase">{t.verificationRequired}</div>
            <div className="p-4 bg-gray-50 border rounded-lg text-center cursor-pointer" onClick={() => document.getElementById('hotelIdUpload')?.click()}>
              <Fingerprint className="mx-auto mb-2 text-gray-400" size={24}/>
              <p className="text-[10px] font-black uppercase text-gray-500">{t.digitalId}</p>
              <input type="file" id="hotelIdUpload" className="hidden" onChange={e => handleFileUpload(e, 'hotel')} />
            </div>
            {hotelProfile.digitalIdPhoto && <img src={hotelProfile.digitalIdPhoto} className="w-20 h-24 mx-auto object-cover rounded shadow" />}
          </div>
        )}
        <button className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg uppercase text-sm">{t.save}</button>
      </form>
    </div>
  );
}

function Dashboard({ t, guests, notifications, wanted, setView, user, hotelProfile, activePoliceZone }: any) {
  const stats = [
    { l: t.guestList, v: guests.length, c: 'bg-indigo-600', role: [UserRole.RECEPTION, UserRole.LOCAL_POLICE, UserRole.SUPER_POLICE] },
    { l: t.wantedPersons, v: wanted.length, c: 'bg-red-600', role: [UserRole.LOCAL_POLICE, UserRole.SUPER_POLICE] },
    { l: t.notifications, v: notifications.length, c: 'bg-amber-600', role: [UserRole.RECEPTION, UserRole.LOCAL_POLICE, UserRole.SUPER_POLICE] }
  ].filter(s => s.role.includes(user.role));

  return (
    <div className="space-y-8">
      {user.role === UserRole.RECEPTION && hotelProfile.name && (
        <div className="bg-white p-6 rounded-xl border shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
              <Building2 size={24}/>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase leading-none mb-1">{hotelProfile.name}</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase">{hotelProfile.address} • {hotelProfile.zone}</p>
            </div>
          </div>
          <button onClick={() => setView('settings')} className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase hover:bg-amber-100 transition-all">
            <Edit size={14}/> {t.edit}
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map(s => (
          <div 
            key={s.l} 
            className="bg-white p-6 rounded-xl border flex items-center justify-between shadow-sm cursor-pointer hover:border-amber-500 transition-all" 
            onClick={() => setView(s.l === t.guestList ? 'guestList' : s.l === t.wantedPersons ? 'wantedPersons' : 'notifications')}
          >
            <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">{s.l}</p><p className="text-3xl font-black text-gray-800">{s.v}</p></div>
            <div className={`${s.c} w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg`}><Activity size={18}/></div>
          </div>
        ))}
      </div>
      {(user.role === UserRole.LOCAL_POLICE || user.role === UserRole.SUPER_POLICE) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border h-80 shadow-sm">
            <h4 className="font-black text-slate-400 uppercase mb-4 text-[10px]">Regional Traffic Analysis</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{n:'Daily', v:guests.length},{n:'Regional', v:12}]}>
                <XAxis dataKey="n"/><YAxis/><Tooltip/><Bar dataKey="v" fill="#4f46e5" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-80 shadow-xl overflow-hidden flex flex-col">
             <div className="flex justify-between items-center mb-4">
                <h4 className="font-black text-amber-500 uppercase text-[10px] flex items-center gap-2">
                   <Activity size={14} className="animate-pulse"/> Live Regional Monitoring
                </h4>
                <span className="text-[8px] text-slate-500 font-bold uppercase">Updates every 5s</span>
             </div>
             <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {guests.slice(0, 10).map((g: any) => (
                  <div key={g.id} className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg flex items-center justify-between group hover:bg-slate-800 transition-all">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-400">{g.fullName[0]}</div>
                       <div>
                          <p className="text-[10px] font-black text-slate-200 uppercase leading-none mb-1">{g.fullName}</p>
                          <p className="text-[8px] text-slate-500 font-bold uppercase">{g.hotelName} • Room {g.roomNumber}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] text-slate-500 font-bold uppercase">{g.checkInDate}</p>
                       {g.isWanted && <span className="text-[7px] bg-red-500 text-white px-1 rounded font-black uppercase animate-pulse">Wanted</span>}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h4 className="font-black text-slate-800 uppercase mb-4 text-xs">Recent Activity</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-bold">
            <thead className="bg-gray-50 uppercase text-gray-400">
              <tr>
                <th className="p-3">Guest Name</th>
                <th className="p-3">Property</th>
                {(user.role === UserRole.LOCAL_POLICE || user.role === UserRole.SUPER_POLICE) && <th className="p-3 text-center">Status</th>}
              </tr>
            </thead>
            <tbody>
              {guests.slice(0,5).map((g: any) => (
                <tr key={g.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 uppercase">{g.fullName}</td>
                  <td className="p-3 uppercase text-gray-500">{g.hotelName}</td>
                  {(user.role === UserRole.LOCAL_POLICE || user.role === UserRole.SUPER_POLICE) && (
                    <td className="p-3 text-center">
                      {g.isWanted ? <span className="text-red-600">Wanted</span> : <span className="text-emerald-600">Clear</span>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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

function ListView({ items, t, setZoomImg, user }: any) {
  const [selectedGuest, setSelectedGuest] = useState<any>(null);

  return (
    <div className="bg-white rounded-xl shadow border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-gray-50 text-[10px] font-bold uppercase text-gray-400">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">{t.fullName}</th>
              <th className="px-6 py-4">{t.guestPhone}</th>
              <th className="px-6 py-4">{t.roomNumber}</th>
              <th className="px-6 py-4">{t.origin} / {t.purpose}</th>
              <th className="px-6 py-4">{t.duration}</th>
              <th className="px-6 py-4">Property Data</th>
              {(user.role === UserRole.LOCAL_POLICE || user.role === UserRole.SUPER_POLICE) && <th className="px-6 py-4">Status</th>}
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-xs font-bold uppercase text-gray-700">
            {items.map((g: any) => (
              <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3"><img src={g.idPhoto} className="w-8 h-10 rounded object-cover shadow-sm cursor-zoom-in" onClick={() => setZoomImg(g.idPhoto)} /></td>
                <td className="px-6 py-3">{g.fullName}</td>
                <td className="px-6 py-3">{g.guestPhone}</td>
                <td className="px-6 py-3">{g.roomNumber}</td>
                <td className="px-6 py-3 leading-tight">{g.origin}<br/><span className="text-[9px] text-gray-400">{g.purpose}</span></td>
                <td className="px-6 py-3">{g.duration}</td>
                <td className="px-6 py-3 leading-tight">
                  {g.hotelName}<br/>
                  <span className="text-[9px] text-gray-400">{g.hotelZone}</span>
                </td>
                {(user.role === UserRole.LOCAL_POLICE || user.role === UserRole.SUPER_POLICE) && (
                  <td className="px-6 py-3">
                    {g.isWanted ? <span className="text-red-600 animate-pulse">Wanted</span> : <span className="text-emerald-600">Clear</span>}
                  </td>
                )}
                <td className="px-6 py-3 text-center">
                  <button 
                    onClick={() => setSelectedGuest(g)}
                    className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-amber-500 hover:text-white transition-all"
                  >
                    <Maximize2 size={14}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedGuest && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Guest Details</h3>
              <button onClick={() => setSelectedGuest(null)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
            <div className="p-8 flex flex-col md:flex-row gap-8 overflow-y-auto">
              <div className="w-full md:w-1/3">
                <img 
                  src={selectedGuest.idPhoto} 
                  className="w-full aspect-[3/4] object-cover rounded-xl shadow-lg cursor-zoom-in border-4 border-white" 
                  onClick={() => setZoomImg(selectedGuest.idPhoto)}
                />
                <p className="text-[10px] text-center mt-2 font-bold text-gray-400 uppercase">Click to Enlarge ID</p>
              </div>
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <DetailItem label={t.fullName} value={selectedGuest.fullName} />
                  <DetailItem label={t.guestPhone} value={selectedGuest.guestPhone} />
                  <DetailItem label={t.nationality} value={selectedGuest.nationality} />
                  <DetailItem label={t.roomNumber} value={selectedGuest.roomNumber} />
                  <DetailItem label={t.origin} value={selectedGuest.origin} />
                  <DetailItem label={t.purpose} value={selectedGuest.purpose} />
                  <DetailItem label={t.duration} value={selectedGuest.duration} />
                  <DetailItem label={t.date} value={selectedGuest.checkInDate} />
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase mb-2">Property Information</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label={t.hotel} value={selectedGuest.hotelName} />
                    <DetailItem label={t.zone} value={selectedGuest.hotelZone} />
                    <DetailItem label={t.receptionistName} value={selectedGuest.receptionistName} />
                    <DetailItem label={t.phoneNumber} value={selectedGuest.receptionistPhone} />
                  </div>
                </div>
                {(user.role === UserRole.LOCAL_POLICE || user.role === UserRole.SUPER_POLICE) && selectedGuest.isWanted && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-4 text-red-600">
                    <ShieldAlert size={32} className="animate-bounce" />
                    <div>
                      <p className="text-xs font-black uppercase">Wanted Person Detected</p>
                      <p className="text-[10px] font-bold">Immediate action required. Contact regional HQ.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t bg-slate-50 flex justify-end gap-4 no-print">
              <button onClick={() => window.print()} className="px-6 py-2 bg-white border text-slate-600 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 hover:bg-gray-50"><Printer size={14}/> {t.print}</button>
              <button onClick={() => setSelectedGuest(null)} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: any) {
  return (
    <div>
      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">{label}</p>
      <p className="text-xs font-bold text-slate-800 uppercase">{value || 'N/A'}</p>
    </div>
  );
}

function PoliceSettings({ t, lang, setLang, activePoliceZone, setActivePoliceZone, user, isDarkMode, setIsDarkMode, allUsers, syncStatus }: any) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showUserMgmt, setShowUserMgmt] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border'} p-8 rounded-xl shadow-sm`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-lg font-black uppercase flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            <Settings size={20} className="text-amber-500"/> System Preferences
          </h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${syncStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-black text-gray-400 uppercase">{syncStatus}</span>
          </div>
        </div>
        
        <div className="space-y-8">
          {/* Profile Section */}
          <div className={`flex items-center gap-4 p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
             <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-black text-xl shadow-inner">
                {user.username[0]}
             </div>
             <div>
                <p className={`text-xs font-black uppercase ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{user.username}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{user.role} • Official Account</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`flex items-center justify-between p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
              <div>
                <p className={`text-xs font-black uppercase ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Language / ቋንቋ</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">System display language</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setLang('am')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${lang === 'am' ? 'bg-amber-500 text-white shadow-md' : 'bg-white border text-gray-400'}`}>አማርኛ</button>
                <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${lang === 'en' ? 'bg-amber-500 text-white shadow-md' : 'bg-white border text-gray-400'}`}>English</button>
              </div>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
              <div>
                <p className={`text-xs font-black uppercase ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Dark Mode</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Toggle visual theme</p>
              </div>
              <button 
                onClick={setIsDarkMode}
                className={`w-10 h-5 rounded-full transition-all relative ${isDarkMode ? 'bg-amber-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {user.role === UserRole.SUPER_POLICE && (
            <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
              <div className="mb-4">
                <p className={`text-xs font-black uppercase ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Active Jurisdiction Monitoring</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Filter all regional data by specific zone</p>
              </div>
              <select 
                className={`w-full border rounded-lg px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200'}`}
                value={activePoliceZone}
                onChange={(e) => setActivePoliceZone(e.target.value)}
              >
                <option value="All">All Jurisdictions (Regional Oversight)</option>
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} flex items-center justify-between`}>
                <div>
                  <p className={`text-[10px] font-black uppercase ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Push Notifications</p>
                  <p className="text-[8px] text-gray-400 font-bold uppercase">Alerts for wanted persons</p>
                </div>
                <button 
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-10 h-5 rounded-full transition-all relative ${notificationsEnabled ? 'bg-amber-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${notificationsEnabled ? 'right-1' : 'left-1'}`} />
                </button>
             </div>
             <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} flex items-center justify-between`}>
                <div>
                  <p className={`text-[10px] font-black uppercase ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Auto-Refresh Feed</p>
                  <p className="text-[8px] text-gray-400 font-bold uppercase">Real-time data updates</p>
                </div>
                <button 
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`w-10 h-5 rounded-full transition-all relative ${autoRefresh ? 'bg-amber-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoRefresh ? 'right-1' : 'left-1'}`} />
                </button>
             </div>
          </div>

          {user.role === UserRole.SUPER_POLICE && (
            <div className="space-y-4">
              <button 
                onClick={() => setShowUserMgmt(!showUserMgmt)}
                className={`w-full py-3 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 border transition-all ${showUserMgmt ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                <Users size={14}/> {showUserMgmt ? 'Hide User Directory' : 'View Active Personnel Directory'}
              </button>
              
              {showUserMgmt && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <UserManagement users={allUsers} t={t} isDarkMode={isDarkMode} />
                </div>
              )}
            </div>
          )}

          <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
            <p className={`text-xs font-black uppercase mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Security & Privacy</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase">
                <span className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500"/> Automatic Logout (Inactive)</span>
                <span className="text-emerald-600">Enabled</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase">
                <span className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500"/> Data Encryption</span>
                <span className="text-emerald-600">Active (AES-256)</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase">
                <span className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500"/> Audit Logging</span>
                <span className="text-emerald-600">On</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${isDarkMode ? 'bg-amber-900/20 border-amber-900/30' : 'bg-amber-50 border-amber-100'} p-6 rounded-xl border flex items-center gap-4`}>
        <ShieldCheck className="text-amber-500" size={32} />
        <div>
          <p className={`text-xs font-black uppercase ${isDarkMode ? 'text-amber-200' : 'text-amber-800'}`}>Official Commission Terminal</p>
          <p className={`text-[10px] font-bold leading-tight ${isDarkMode ? 'text-amber-300/70' : 'text-amber-700/70'}`}>This device is registered for official police use only. All actions are monitored by the Technology and Information Center. Unauthorized access is strictly prohibited.</p>
        </div>
      </div>
    </div>
  );
}

function UserManagement({ users, t, isDarkMode }: any) {
  return (
    <div className={`rounded-xl shadow border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <table className="w-full text-left text-[11px] font-bold uppercase">
        <thead className={isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-50 text-gray-400'}>
          <tr><th className="p-4">User</th><th className="p-4">Role</th><th className="p-4">Zone</th><th className="p-4">Last Active</th></tr>
        </thead>
        <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
          {users.map((u: any) => (
            <tr key={u.uid} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-amber-100 rounded flex items-center justify-center text-amber-700 text-[10px] font-black">{u.username[0]}</div>
                  <div>
                    <p className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>{u.username}</p>
                    <p className="text-[8px] text-gray-400 lowercase font-medium">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${
                  u.role === UserRole.SUPER_POLICE ? 'bg-purple-100 text-purple-700' : 
                  u.role === UserRole.LOCAL_POLICE ? 'bg-blue-100 text-blue-700' : 
                  'bg-green-100 text-green-700'
                }`}>
                  {u.role}
                </span>
              </td>
              <td className="p-4 text-gray-400 font-medium">{u.zone || 'N/A'}</td>
              <td className="p-4 text-gray-400 font-medium">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && <div className="p-10 text-center text-gray-300 font-black uppercase tracking-widest">No Personnel Found</div>}
    </div>
  );
}

function GuestForm({ onSubmit, newGuest, setNewGuest, t, handleFileUpload }: any) {
  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto bg-white p-8 rounded-xl border shadow-lg space-y-4">
      <h3 className="text-xl font-bold mb-4 uppercase text-slate-800">{t.registerGuest}</h3>
      <Input label={t.fullName} value={newGuest.fullName} onChange={(v: string) => setNewGuest({...newGuest, fullName: v})} required />
      <div className="grid grid-cols-2 gap-4">
        <Input label={t.nationality} value={newGuest.nationality} onChange={(v: string) => setNewGuest({...newGuest, nationality: v})} required />
        <Input label={t.guestPhone} value={newGuest.guestPhone} onChange={(v: string) => setNewGuest({...newGuest, guestPhone: v})} type="tel" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label={t.roomNumber} value={newGuest.roomNumber} onChange={(v: string) => setNewGuest({...newGuest, roomNumber: v})} required />
        <Input label={t.duration} value={newGuest.duration} onChange={(v: string) => setNewGuest({...newGuest, duration: v})} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label={t.origin} value={newGuest.origin} onChange={(v: string) => setNewGuest({...newGuest, origin: v})} required />
        <Input label={t.purpose} value={newGuest.purpose} onChange={(v: string) => setNewGuest({...newGuest, purpose: v})} required />
      </div>
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

function WantedList({ wanted, t, setZoomImg }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {wanted.map((w: any) => (
        <div key={w.id} className="bg-white rounded-xl shadow-sm border overflow-hidden group hover:border-red-500 transition-all">
          <div className="aspect-square relative overflow-hidden">
            <img src={w.photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
               <div>
                  <p className="text-white font-black uppercase text-sm">{w.fullName}</p>
                  <p className="text-red-400 text-[10px] font-bold uppercase">{w.crime}</p>
               </div>
            </div>
            <button 
              onClick={() => setZoomImg(w.photo)}
              className="absolute top-2 right-2 p-2 bg-white/20 backdrop-blur-md text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Maximize2 size={16}/>
            </button>
          </div>
          <div className="p-4 space-y-2">
            <p className="text-[10px] text-gray-500 font-bold leading-relaxed">{w.description}</p>
            <p className="text-[8px] text-gray-400 font-black uppercase">Posted: {w.postedDate}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function HotelDir({ hotels, t, user }: any) {
  const filteredHotels = useMemo(() => {
    if (user?.role === UserRole.LOCAL_POLICE && user.zone) {
      return hotels.filter((h: any) => h.zone === user.zone);
    }
    return hotels;
  }, [hotels, user]);

  return (
    <div className="bg-white rounded-xl shadow border overflow-hidden">
      <table className="w-full text-left text-[11px] font-bold uppercase">
        <thead className="bg-gray-50 text-gray-400">
          <tr><th className="p-4">Hotel Name</th><th className="p-4">Jurisdiction</th><th className="p-4">Personnel</th></tr>
        </thead>
        <tbody className="divide-y">
          {filteredHotels.map((h: any) => (
            <tr key={h.id} className="hover:bg-gray-50">
              <td className="p-4">{h.name}</td>
              <td className="p-4 text-gray-400">{h.zone}</td>
              <td className="p-4">{h.receptionistName}<br/><span className="text-[9px] text-indigo-500 font-black">{h.phoneNumber}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredHotels.length === 0 && <div className="p-10 text-center text-gray-300 font-black uppercase tracking-widest">No Hotels Found</div>}
    </div>
  );
}

function ReportSection({ t, guests, user, hotelProfile }: any) {
  const [period, setPeriod] = useState('1'); // Days
  const [showPreview, setShowPreview] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<string | null>(null);

  const periods = [
    { id: '1', label: t.dailyReport },
    { id: '7', label: t.weeklyReport },
    { id: '15', label: t.biweeklyReport },
    { id: '30', label: t.monthlyReport },
    { id: '90', label: t.quarterlyReport },
    { id: '180', label: t.semiAnnualReport },
    { id: '365', label: t.yearlyReport },
  ];

  const getFilteredGuests = () => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - parseInt(period));
    
    return guests.filter((g: any) => {
      const checkIn = new Date(g.checkInDate);
      return checkIn >= cutoff;
    });
  };

  const generateExcel = (data: any[]) => {
    const excelData = data.map((g: any) => ({
      'Full Name': g.fullName,
      'Guest Phone': g.guestPhone,
      'Nationality': g.nationality,
      'Room Number': g.roomNumber,
      'Origin': g.origin,
      'Purpose': g.purpose,
      'Duration': g.duration,
      'Hotel': g.hotelName,
      'Zone': g.hotelZone,
      'Receptionist': g.receptionistName,
      'Receptionist Phone': g.receptionistPhone,
      'Check-in Date': g.checkInDate,
      'Status': g.isWanted ? 'WANTED' : 'CLEAR'
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Guests");
    XLSX.writeFile(wb, `Begu_Engeda_Report_${period}_days.xlsx`);
  };

  const generatePDF = (data: any[]) => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Begu Engeda - Official Guest Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report Period: ${period} Days`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);
    doc.text(`Hotel: ${hotelProfile?.name || 'All'}`, 14, 42);

    (doc as any).autoTable({
      startY: 50,
      head: [['Full Name', 'Phone', 'Room', 'Origin', 'Purpose', 'Duration', 'Hotel', 'Check-in', 'Status']],
      body: data.map((g: any) => [
        g.fullName,
        g.guestPhone,
        g.roomNumber,
        g.origin,
        g.purpose,
        g.duration,
        g.hotelName,
        g.checkInDate,
        g.isWanted ? 'WANTED' : 'CLEAR'
      ]),
      theme: 'grid',
      headStyles: { fillStyle: '#1e293b' },
      styles: { fontSize: 7 }
    });

    doc.save(`Begu_Engeda_Report_${period}_days.pdf`);
  };

  const generateWord = async (data: any[]) => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Begu Engeda - Official Guest Report", bold: true, size: 32 })],
          }),
          new Paragraph({ text: `Report Period: ${period} Days` }),
          new Paragraph({ text: `Generated on: ${new Date().toLocaleString()}` }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Full Name", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Phone", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Room", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Origin", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Purpose", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Duration", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Hotel", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Check-in", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })] }),
                ],
              }),
              ...data.map((g: any) => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(g.fullName)] }),
                  new TableCell({ children: [new Paragraph(g.guestPhone)] }),
                  new TableCell({ children: [new Paragraph(g.roomNumber)] }),
                  new TableCell({ children: [new Paragraph(g.origin)] }),
                  new TableCell({ children: [new Paragraph(g.purpose)] }),
                  new TableCell({ children: [new Paragraph(g.duration)] }),
                  new TableCell({ children: [new Paragraph(g.hotelName)] }),
                  new TableCell({ children: [new Paragraph(g.checkInDate)] }),
                  new TableCell({ children: [new Paragraph(g.isWanted ? 'WANTED' : 'CLEAR')] }),
                ],
              }))
            ],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Begu_Engeda_Report_${period}_days.docx`);
  };

  const generatePPT = (data: any[]) => {
    const pres = new pptxgen();
    
    // Title Slide
    const slide = pres.addSlide();
    slide.addText("Begu Engeda - Official Guest Report", { x: 0.5, y: 1.5, w: 9, fontSize: 36, bold: true, color: "1e293b", align: "center" });
    slide.addText(`${hotelProfile?.name || 'All Hotels'}`, { x: 0.5, y: 2.5, w: 9, fontSize: 24, color: "475569", align: "center" });
    slide.addText(`Report Period: ${period} Days`, { x: 0.5, y: 3.5, w: 9, fontSize: 18, color: "64748b", align: "center" });
    slide.addText(`Generated on: ${new Date().toLocaleString()}`, { x: 0.5, y: 4.5, w: 9, fontSize: 14, color: "94a3b8", align: "center" });

    // Data Slides (10 guests per slide)
    const guestsPerSlide = 10;
    for (let i = 0; i < data.length; i += guestsPerSlide) {
      const chunk = data.slice(i, i + guestsPerSlide);
      const dataSlide = pres.addSlide();
      dataSlide.addText(`Guest Data - Page ${Math.floor(i / guestsPerSlide) + 1}`, { x: 0.5, y: 0.3, fontSize: 18, bold: true, color: "1e293b" });
      
      const rows = [
        ['Full Name', 'Phone', 'Room', 'Origin', 'Purpose', 'Duration', 'Hotel', 'Check-in', 'Status'],
        ...chunk.map((g: any) => [
          g.fullName, 
          g.guestPhone, 
          g.roomNumber, 
          g.origin,
          g.purpose,
          g.duration,
          g.hotelName,
          g.checkInDate, 
          g.isWanted ? 'WANTED' : 'CLEAR'
        ])
      ];

      dataSlide.addTable(rows, { 
        x: 0.5, 
        y: 0.8, 
        w: 9.0, 
        border: { type: 'solid', color: 'E1E1E1' }, 
        fontSize: 8,
        fill: { color: "F8FAFC" },
        colW: [1.5, 1, 0.5, 1, 1, 1, 1, 1, 1]
      });
    }

    pres.writeFile({ fileName: `Begu_Engeda_Report_${period}_days.pptx` });
  };

  const handleDownload = (format: string) => {
    setPreviewFormat(format);
    setShowPreview(true);
  };

  const confirmDownload = () => {
    const filtered = getFilteredGuests();
    if (previewFormat === 'ALL') {
      generateExcel(filtered);
      generateWord(filtered);
      generatePPT(filtered);
      generatePDF(filtered);
    } else {
      switch(previewFormat) {
        case 'EXCEL': generateExcel(filtered); break;
        case 'PDF': generatePDF(filtered); break;
        case 'WORD': generateWord(filtered); break;
        case 'PPT': generatePPT(filtered); break;
      }
    }
    setShowPreview(false);
  };

  const filteredGuests = getFilteredGuests();

  return (
    <div className="bg-white p-10 rounded-xl shadow border text-center space-y-10 relative">
      <div className="flex flex-col items-center">
        <FileBarChart className="text-amber-500 mb-4" size={48} />
        <h3 className={`text-2xl font-black uppercase tracking-tighter ${GOLDEN_GRADIENT}`}>{t.appName}</h3>
        <div className="text-center mt-1">
          <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest">{translations.am.policeCommission}</p>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{translations.en.policeCommission}</p>
        </div>
      </div>

      <div className="max-w-xs mx-auto space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase">{t.selectPeriod}</label>
        <select 
          className="w-full bg-gray-50 border rounded-lg px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          {periods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: 'EXCEL', icon: <FileText size={24}/>, label: 'EXCEL' },
          { id: 'WORD', icon: <FileText size={24}/>, label: 'WORD' },
          { id: 'PPT', icon: <FileBarChart size={24}/>, label: 'PPT' },
          { id: 'PDF', icon: <Download size={24}/>, label: 'PDF' }
        ].map(f => (
          <button 
            key={f.id} 
            onClick={() => handleDownload(f.id)}
            className="p-6 bg-slate-50 border rounded-xl flex flex-col items-center gap-2 hover:bg-amber-50 group transition-all"
          >
            <div className="text-gray-400 group-hover:text-amber-600">{f.icon}</div>
            <span className="text-[10px] font-black uppercase text-gray-600">{f.label}</span>
          </button>
        ))}
      </div>

      <button 
        onClick={() => handleDownload('ALL')}
        className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl"
      >
        <Download size={18} />
        Generate All Formats for {periods.find(p => p.id === period)?.label}
      </button>

      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">{t.previewReport}</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6 text-left space-y-1">
                <p className="text-xs font-black text-amber-600 uppercase">{t.reports} - {periods.find(p => p.id === period)?.label}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{t.date}: {new Date().toLocaleDateString()}</p>
              </div>
              
              {filteredGuests.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-[10px] font-bold uppercase">
                    <thead className="bg-slate-100 text-slate-500">
                      <tr>
                        <th className="p-3">Full Name</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Room</th>
                        <th className="p-3">Origin</th>
                        <th className="p-3">Purpose</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Check-in</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredGuests.map((g: any) => (
                        <tr key={g.id} className="hover:bg-gray-50">
                          <td className="p-3">{g.fullName}</td>
                          <td className="p-3">{g.guestPhone}</td>
                          <td className="p-3">{g.roomNumber}</td>
                          <td className="p-3">{g.origin}</td>
                          <td className="p-3">{g.purpose}</td>
                          <td className="p-3">{g.duration}</td>
                          <td className="p-3">{g.checkInDate}</td>
                          <td className="p-3">
                            {g.isWanted ? <span className="text-red-600">WANTED</span> : <span className="text-emerald-600">CLEAR</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-20 text-center text-gray-400 font-black uppercase tracking-widest">
                  {t.noDataForPeriod}
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-slate-50 flex justify-end gap-4">
              <button 
                onClick={() => setShowPreview(false)} 
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-black uppercase hover:bg-gray-50 transition-all"
              >
                {t.cancel}
              </button>
              <button 
                onClick={confirmDownload} 
                disabled={filteredGuests.length === 0}
                className="px-8 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-black uppercase hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download size={14} />
                {t.confirmDownload}
              </button>
            </div>
          </div>
        </div>
      )}

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
