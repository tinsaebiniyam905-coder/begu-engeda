import React, { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { UserRole, Guest, WantedPerson, Notification, Language, HotelProfile } from './types';
import { translations } from './translations';
import { 
  Users, UserPlus, AlertTriangle, FileText, LogOut, Bell, Camera, Image as ImageIcon, Download, 
  Printer, Globe, Plus, Settings, Edit, X, Maximize2, CheckCircle2, ShieldCheck, Search, MapPin, 
  Building2, FileBarChart, Menu, Info, ChevronRight, ShieldAlert, History, TrendingUp, Activity, 
  Phone, Fingerprint, Map, Moon, Sun, ChevronDown, ArrowRight, AlertCircle, Clock, User as UserIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png?url';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png?url';
import markerShadow from 'leaflet/dist/images/marker-shadow.png?url';

const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIconRetina,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;
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
  GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, User as FirebaseUser,
  signInWithEmailAndPassword, createUserWithEmailAndPassword
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
  const [loginData, setLoginData] = useState({ username: '', password: '', role: UserRole.RECEPTION });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [allHotels, setAllHotels] = useState<HotelProfile[]>([]);
  const [hotelProfile, setHotelProfile] = useState<HotelProfile>({id:"",name:"",address:"",zone:"",receptionistName:"",phoneNumber:""});
  const [hasAgreed, setHasAgreed] = useState(localStorage.getItem('begu_engeda_agreed') === 'true');
  const [activeAlert, setActiveAlert] = useState<Notification | null>(null);
  const [activePoliceZone, setActivePoliceZone] = useState<string>('All');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'reconnecting' | 'error'>('connected');
  const [selectedHotelOnMap, setSelectedHotelOnMap] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Shared Account Session Context
  const [currentHotelId, setCurrentHotelId] = useState<string | null>(localStorage.getItem('begu_engeda_hotel_id'));
  const [currentPoliceZone, setCurrentPoliceZone] = useState<string | null>(localStorage.getItem('begu_engeda_police_zone'));

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
        // system_health is publicly readable in rules, so this should succeed if online
        await getDocFromServer(doc(db, 'system_health', 'status'));
        console.log("Firestore connectivity verified.");
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          console.log("Firestore reached (Security rules active).");
        } else {
          console.warn("Firestore connectivity check:", error.message);
          if(error.message.includes('offline') || error.message.includes('failed-precondition')) {
            console.error("Firestore is offline or configuration is invalid.");
          }
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
            if (userData.role === UserRole.LOCAL_POLICE) {
              if (firebaseUser.email?.endsWith('@shared.com')) {
                const zone = localStorage.getItem('begu_engeda_police_zone');
                if (!zone) setView('setupPolice');
              } else if (!userData.zone) {
                setView('setupPolice');
              }
            } else if (userData.role === UserRole.RECEPTION) {
              if (firebaseUser.email?.endsWith('@shared.com')) {
                const hId = localStorage.getItem('begu_engeda_hotel_id');
                if (!hId) setView('setupHotel');
              } else {
                const hotelDoc = await getDocFromServer(doc(db, 'hotels', firebaseUser.uid));
                if (!hotelDoc.exists()) setView('setupHotel');
              }
            }
          } else {
            const pendingRole = localStorage.getItem('pendingRole') as UserRole | null;
            let role: UserRole = pendingRole || UserRole.RECEPTION;
            let username = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
            
            if (firebaseUser.email === 'tinsaebiniyam905@gmail.com' || firebaseUser.email === 'admin@begu-engeda.com' || firebaseUser.email === 'admin@shared.com') {
              role = UserRole.SUPER_POLICE;
              username = 'Police Commission';
            } else if (firebaseUser.email === 'reception@shared.com') {
              role = UserRole.RECEPTION;
              username = 'Receptionist';
            } else if (firebaseUser.email === 'police@shared.com') {
              role = UserRole.LOCAL_POLICE;
              username = 'Local Police';
            }

            const newUser = { 
              role, 
              username, 
              uid: firebaseUser.uid,
              email: firebaseUser.email || undefined,
              lastLogin: new Date().toISOString()
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser({ ...newUser, email: newUser.email || undefined });
            
            localStorage.removeItem('pendingRole');

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
        const myHotelId = user.email?.endsWith('@shared.com') ? localStorage.getItem('begu_engeda_hotel_id') : user.uid;
        const myHotel = data.find(h => h.id === myHotelId);
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
    setIsLoading(true);
    localStorage.setItem('pendingRole', loginData.role);
    try {
      const result = await signInWithPopup(auth, provider);
      // Auth listener will handle the rest
      setView('dashboard');
      } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/popup-blocked') {
        alert('The login popup was blocked by your browser. Please allow popups for this site and try again. / የመግቢያ መስኮቱ በብሮውዘርዎ ተዘግቷል። እባክዎ ለዚህ ሳይት ፖፕ-አፕ ይፍቀዱ እና እንደገና ይሞክሩ።');
      } else if (error.code === 'auth/operation-not-allowed') {
        alert('Login method not enabled. Please enable "Email/Password" and "Google" in your Firebase Console: https://console.firebase.google.com/project/gen-lang-client-0183085526/authentication/providers');
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log("Popup request cancelled by user or another request.");
      } else {
        alert('Login failed / መግባት አልተቻለም: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      alert('Please enter both username and password / እባክዎ የተጠቃሚ ስም እና የይለፍ ቃል ያስገቡ');
      return;
    }

    setIsLoading(true);
    
    // Hardcoded credentials mapping
    let email = '';
    const username = loginData.username.toLowerCase().trim();
    const password = loginData.password;
    let targetRole = loginData.role;

    if (username === 'police' && password === 'police1234') {
      email = 'admin@shared.com';
      targetRole = UserRole.SUPER_POLICE;
    } else if (username === 'reception' && password === '1234') {
      email = 'reception@shared.com';
      targetRole = UserRole.RECEPTION;
    } else if (username === 'police' && password === '1234@') {
      email = 'police@shared.com';
      targetRole = UserRole.LOCAL_POLICE;
    } else {
      // Fallback to standard email/password or append domain
      email = username.includes('@') ? username : `${username}@begu-engeda.com`;
    }

    localStorage.setItem('pendingRole', targetRole);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // View will be updated by onAuthStateChanged
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        // Auto-create shared accounts if they don't exist
        if (email.endsWith('@shared.com')) {
          try {
            await createUserWithEmailAndPassword(auth, email, password);
            return;
          } catch (regError: any) {
            if (regError.code === 'auth/email-already-in-use') {
              showToast('Incorrect password for shared account / የተሳሳተ የይለፍ ቃል', 'error');
            } else {
              console.error("Shared account creation failed:", regError);
              showToast('Account creation failed / መለያ መፍጠር አልተቻለም', 'error');
            }
          }
        } else {
          showToast('User not found or incorrect credentials / ተጠቃሚው አልተገኘም ወይም የተሳሳተ መረጃ', 'error');
        }
      } else if (error.code === 'auth/wrong-password') {
        showToast('Incorrect password / የተሳሳተ የይለፍ ቃል', 'error');
      } else if (error.code === 'auth/operation-not-allowed') {
        showToast('CRITICAL: Email/Password login is not enabled in your Firebase Console. Please enable it at: https://console.firebase.google.com/project/gen-lang-client-0183085526/authentication/providers', 'error');
      } else {
        showToast('Login failed / መግባት አልተቻለም: ' + error.message, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (username: string, pass: string, role: UserRole) => {
    setLoginData({ username, password: pass, role });
    // We'll trigger the login in a small timeout to ensure state is updated
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 100);
  };

  const handleLogout = async () => { 
    await signOut(auth);
    setUser(null); 
    setView('dashboard'); 
    setIsSidebarOpen(false); 
    setHasAgreed(false);
    // Note: We don't clear session context from localStorage on logout 
    // to allow the device to remember its hotel/zone if it's a shared terminal.
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hotelProfile.name && hotelProfile.zone && user) {
      // For shared accounts, we use a random ID for the hotel so multiple hotels can share one login
      const hotelId = user.email?.endsWith('@shared.com') ? Math.random().toString(36).substr(2, 9) : user.uid;
      const updatedProfile = { ...hotelProfile, id: hotelId };
      try {
        await setDoc(doc(db, 'hotels', hotelId), updatedProfile);
        setHotelProfile(updatedProfile);
        if (user.email?.endsWith('@shared.com')) {
          localStorage.setItem('begu_engeda_hotel_id', hotelId);
          setCurrentHotelId(hotelId);
        }
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
      hotelId: hotelProfile.id || currentHotelId || user.uid,
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
    } else if (user?.role === UserRole.LOCAL_POLICE) {
      const zone = currentPoliceZone || user.zone;
      if (zone) filtered = guests.filter(g => g.hotelZone === zone);
    } else if (user?.role === UserRole.RECEPTION) {
      const hId = currentHotelId || hotelProfile.id || user.uid;
      if (hId) filtered = guests.filter(g => g.hotelId === hId);
    }
    
    return filtered.filter(g => g.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [guests, searchTerm, user, hotelProfile, activePoliceZone, currentHotelId, currentPoliceZone]);

  const filteredNotifs = useMemo(() => {
    let filtered = notifications;
    if (user?.role === UserRole.SUPER_POLICE) {
      if (activePoliceZone !== 'All') {
        filtered = notifications.filter(n => n.targetZone === activePoliceZone);
      }
    } else if (user?.role === UserRole.LOCAL_POLICE) {
      const zone = currentPoliceZone || user.zone;
      if (zone) filtered = notifications.filter(n => n.targetZone === zone);
    } else if (user?.role === UserRole.RECEPTION) {
      const zone = hotelProfile.zone;
      if (zone) filtered = notifications.filter(n => n.targetZone === zone);
    }
    return filtered;
  }, [notifications, user, hotelProfile, activePoliceZone, currentPoliceZone]);

  if (!user && view !== 'utility') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Immersive background with subtle motion */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-amber-900/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }}></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
        </div>

        <div className="w-full max-w-[500px] bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 border border-white/10">
          {toast && (
            <div className={`absolute top-0 left-0 right-0 p-4 text-white text-center text-xs font-black uppercase tracking-widest z-50 animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'error' ? 'bg-red-600' : toast.type === 'success' ? 'bg-green-600' : 'bg-indigo-600'}`}>
              {toast.message}
            </div>
          )}
          <div className="p-10 md:p-12 flex flex-col items-center bg-white">
            {/* Logo and Title */}
            <div className="flex flex-col items-center mb-10">
              <div className="p-4 bg-slate-50 rounded-3xl mb-4 shadow-inner border border-slate-100">
                <img src={LOGO_PATH} className="w-20 h-20 object-contain" alt="Logo" />
              </div>
              <h1 className={`text-4xl font-black tracking-tighter text-center ${GOLDEN_GRADIENT}`}>{t.appName}</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">{t.policeCommission}</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="w-full space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t.username}</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <Users size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Enter username" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold transition-all text-sm focus:bg-white disabled:opacity-50" 
                    value={loginData.username} 
                    onChange={e => setLoginData({...loginData, username: e.target.value})} 
                    required 
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t.password}</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <Fingerprint size={18} />
                  </div>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold transition-all text-sm focus:bg-white disabled:opacity-50" 
                    value={loginData.password} 
                    onChange={e => setLoginData({...loginData, password: e.target.value})} 
                    required 
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Type / የመለያ አይነት</label>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setLoginData({...loginData, role: UserRole.RECEPTION})}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${loginData.role === UserRole.RECEPTION ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    Reception / ሪሰፕሽን
                  </button>
                  <button 
                    type="button"
                    onClick={() => setLoginData({...loginData, role: UserRole.LOCAL_POLICE})}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${loginData.role === UserRole.LOCAL_POLICE ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    Police / ፖሊስ
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-slate-900/20 uppercase tracking-widest text-xs flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <ShieldCheck size={18} className="text-amber-500" />
                    {t.login}
                  </>
                )}
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                  <span className="bg-white px-4 text-slate-400">Or / ወይም</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white hover:bg-slate-50 border-2 border-slate-100 text-slate-700 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] text-xs uppercase tracking-widest"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                Login with Google / በጎግል ይግቡ
              </button>
            </form>

            <div className="mt-8 w-full p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 text-center">Shared Credentials / የጋራ መግቢያ</p>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  type="button"
                  onClick={() => handleDemoLogin('police', 'police1234', UserRole.SUPER_POLICE)}
                  className="p-3 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase hover:border-indigo-500 transition-all text-slate-600 flex justify-between items-center"
                >
                  <span>Admin (Super Police)</span>
                  <span className="text-amber-600">police / police1234</span>
                </button>
                <button 
                  type="button"
                  onClick={() => handleDemoLogin('police', '1234@', UserRole.LOCAL_POLICE)}
                  className="p-3 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase hover:border-indigo-500 transition-all text-slate-600 flex justify-between items-center"
                >
                  <span>Local Police</span>
                  <span className="text-amber-600">police / 1234@</span>
                </button>
                <button 
                  type="button"
                  onClick={() => handleDemoLogin('reception', '1234', UserRole.RECEPTION)}
                  className="p-3 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase hover:border-indigo-500 transition-all text-slate-600 flex justify-between items-center"
                >
                  <span>Reception</span>
                  <span className="text-amber-600">reception / 1234</span>
                </button>
              </div>
            </div>

            <div className="mt-10 flex justify-center gap-3">
              <button onClick={() => handleLangChange('am')} className={`px-5 py-2 rounded-full text-[10px] font-black transition-all ${lang === 'am' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>አማርኛ</button>
              <button onClick={() => handleLangChange('en')} className={`px-5 py-2 rounded-full text-[10px] font-black transition-all ${lang === 'en' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>ENGLISH</button>
            </div>

            <div className="mt-12 text-center border-t border-slate-100 pt-8 w-full">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.25em] leading-relaxed">
                {t.developerCredit}
              </p>
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
              onClick={() => { 
                setHasAgreed(true); 
                localStorage.setItem('begu_engeda_agreed', 'true');
                setView('dashboard'); 
              }}
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
          {user?.role === UserRole.RECEPTION && (
            <>
              <NavItem icon={<UserPlus size={18}/>} label={t.registerGuest} active={view === 'registerGuest'} onClick={() => setView('registerGuest')} />
              <NavItem icon={<Users size={18}/>} label={t.guestList} active={view === 'guestList'} onClick={() => setView('guestList')} />
              <NavItem icon={<Settings size={18}/>} label={t.settings} active={view === 'settings'} onClick={() => setView('settings')} />
            </>
          )}
          {(user?.role === UserRole.LOCAL_POLICE || user?.role === UserRole.SUPER_POLICE) && (
            <>
              <NavItem icon={<Map size={18}/>} label={t.mapView} active={view === 'map'} onClick={() => setView('map')} />
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
                <p className={`text-xs font-black uppercase ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{user?.username}</p>
                {user?.role === UserRole.SUPER_POLICE ? (
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
                  <p className="text-[9px] text-amber-600 font-bold uppercase mt-1">{user?.zone || hotelProfile.zone || "Headquarters"}</p>
                )}
             </div>
             <div className="w-8 h-8 bg-amber-100 rounded text-amber-700 flex items-center justify-center font-bold shadow-sm">{user?.username[0]}</div>
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
          {view === 'setupPolice' && (
            <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold mb-6 uppercase text-slate-800">Assigned Jurisdiction / የሥራ ክልል ይምረጡ</h3>
              <div className="space-y-4">
                {ZONES.map(z => (
                  <button 
                    key={z} 
                    onClick={async () => { 
                      if (user) {
                        try {
                          if (user.email?.endsWith('@shared.com')) {
                            localStorage.setItem('begu_engeda_police_zone', z);
                            setCurrentPoliceZone(z);
                          } else {
                            const updatedUser = {...user, zone: z};
                            setUser(updatedUser);
                            await setDoc(doc(db, 'users', user.uid), { zone: z }, { merge: true });
                          }
                          setView('agreement'); 
                        } catch (error) {
                          console.error("Failed to save zone:", error);
                          alert("Failed to save jurisdiction. Please try again.");
                        }
                      }
                    }} 
                    className="w-full text-left p-4 bg-gray-50 border rounded-lg font-bold text-gray-600 hover:bg-amber-50 hover:border-amber-500 transition-all"
                  >
                    {z}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {view === 'dashboard' && <Dashboard user={user} t={t} guests={visibleGuests} notifications={filteredNotifs} wanted={wanted} setView={setView} hotelProfile={hotelProfile} activePoliceZone={activePoliceZone} />}
          {view === 'guestList' && <ListView items={visibleGuests} t={t} setZoomImg={setZoomImg} user={user} />}
          {view === 'registerGuest' && <GuestForm newGuest={newGuest} setNewGuest={setNewGuest} onSubmit={saveGuest} t={t} handleFileUpload={handleFileUpload} />}
          {view === 'addWanted' && <WantedForm wanted={wanted} setWanted={setWanted} t={t} handleFileUpload={handleFileUpload} addWanted={addWanted} newWanted={newWanted} setNewWanted={setNewWanted} />}
          {view === 'wantedPersons' && <WantedList wanted={wanted} t={t} setZoomImg={setZoomImg} />}
          {view === 'hotelDirectory' && <HotelDir hotels={allHotels} t={t} user={user} />}
          {view === 'map' && <MapView hotels={allHotels} guests={visibleGuests} t={t} user={user} selectedHotel={selectedHotelOnMap} setSelectedHotel={setSelectedHotelOnMap} />}
          {view === 'utility' && <div className="bg-white p-10 rounded-xl shadow-sm border space-y-6"><h3 className={`text-2xl text-center ${GOLDEN_GRADIENT}`}>{t.appUtility}</h3><p className="text-gray-600 font-bold leading-relaxed">{t.utilityText}</p><p className="text-amber-700 font-black uppercase text-center mt-10">{t.developerCredit}</p></div>}
          {view === 'reports' && <ReportSection t={t} guests={visibleGuests} user={user} hotelProfile={hotelProfile} />}
          {view === 'notifications' && <NotifView notifications={filteredNotifs} t={t} setView={setView} user={user} hotelProfile={hotelProfile} />}
          {view === 'settings' && <SetupForm hotelProfile={hotelProfile} setHotelProfile={setHotelProfile} onSubmit={handleSetupSubmit} t={t} handleFileUpload={handleFileUpload} isSettings user={user} />}
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
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 group relative overflow-hidden ${
        active 
          ? 'bg-amber-500 text-slate-900 shadow-[0_10px_20px_-5px_rgba(245,158,11,0.4)] scale-[1.02]' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {count > 0 && (
        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
          active ? 'bg-slate-900 text-white' : 'bg-red-500 text-white animate-pulse'
        }`}>
          {count}
        </span>
      )}
      {active && <div className="absolute left-0 top-0 w-1 h-full bg-slate-900/20"></div>}
    </button>
  );
}

function SetupForm({ hotelProfile, setHotelProfile, onSubmit, t, isSettings, handleFileUpload, user }: any) {
  const [needsId, setNeedsId] = useState(isSettings);
  return (
    <div className="max-w-xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.05)] border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-4 border border-amber-100">
          <Building2 size={32}/>
        </div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t.setupHotel}</h3>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Establishment Registration</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label={t.hotel} value={hotelProfile.name} onChange={(v: string) => setHotelProfile({...hotelProfile, name: v})} required />
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.zone}</label>
            <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black uppercase text-[11px] tracking-widest focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" value={hotelProfile.zone} onChange={e => setHotelProfile({...hotelProfile, zone: e.target.value})} required>
              <option value="">Select Jurisdiction</option>
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>

        <Input label={t.hotelAddress} value={hotelProfile.address} onChange={(v: string) => setHotelProfile({...hotelProfile, address: v})} required />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label={t.receptionistName} value={hotelProfile.receptionistName} onChange={(v: string) => setHotelProfile({...hotelProfile, receptionistName: v})} required />
          <Input label={t.phoneNumber} value={hotelProfile.phoneNumber} onChange={(v: string) => setHotelProfile({...hotelProfile, phoneNumber: v})} type="tel" required />
        </div>

        {needsId && (
          <div className="space-y-6 pt-4">
            <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck size={18} className="text-amber-600" />
                <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest">{t.verificationRequired}</p>
              </div>
              <p className="text-[10px] font-bold text-amber-600/70 uppercase leading-relaxed">Please provide a valid digital ID for security verification.</p>
            </div>
            
            <div 
              className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] text-center cursor-pointer hover:bg-slate-100 hover:border-indigo-400 transition-all group" 
              onClick={() => document.getElementById('hotelIdUpload')?.click()}
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Camera size={24}/>
              </div>
              <p className="text-[11px] font-black uppercase text-slate-500 tracking-widest">{t.digitalId}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Click to upload or drag & drop</p>
              <input type="file" id="hotelIdUpload" className="hidden" onChange={e => handleFileUpload(e, 'hotel')} />
            </div>
            {hotelProfile.digitalIdPhoto && (
              <div className="relative w-32 h-40 mx-auto group">
                <img src={hotelProfile.digitalIdPhoto} className="w-full h-full object-cover rounded-2xl shadow-2xl border-4 border-white" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                  <Edit size={20} className="text-white" />
                </div>
              </div>
            )}
          </div>
        )}

        {isSettings && user.email?.endsWith('@shared.com') && (
          <div className="pt-6 border-t border-slate-100">
            <div className="p-5 bg-red-50 border border-red-100 rounded-2xl mb-6">
              <p className="text-[11px] font-black text-red-700 uppercase tracking-widest mb-1">Shared Terminal Session</p>
              <p className="text-[10px] font-bold text-red-600/70 uppercase leading-relaxed">Resetting the session will allow you to select or register a different hotel on this device.</p>
            </div>
            <button 
              type="button"
              onClick={() => {
                localStorage.removeItem('begu_engeda_hotel_id');
                window.location.reload();
              }}
              className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-lg"
            >
              Reset Hotel Selection
            </button>
          </div>
        )}

        <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
          <CheckCircle2 size={18} className="text-amber-500" />
          {isSettings ? 'Update Profile' : 'Complete Setup'}
        </button>
      </form>
    </div>
  );
}

function Dashboard({ t, guests, notifications, wanted, setView, user, hotelProfile, activePoliceZone }: any) {
  const stats = [
    { l: t.guestList, v: guests.length, c: 'bg-indigo-600', icon: <Users size={20}/>, role: [UserRole.RECEPTION, UserRole.LOCAL_POLICE, UserRole.SUPER_POLICE] },
    { l: 'Flagged Guests', v: guests.filter((g: any) => g.verificationStatus === 'flagged').length, c: 'bg-red-500', icon: <AlertCircle size={20}/>, role: [UserRole.LOCAL_POLICE, UserRole.SUPER_POLICE] },
    { l: t.wantedPersons, v: wanted.length, c: 'bg-red-600', icon: <AlertTriangle size={20}/>, role: [UserRole.LOCAL_POLICE, UserRole.SUPER_POLICE] },
    { l: t.notifications, v: notifications.length, c: 'bg-amber-600', icon: <Bell size={20}/>, role: [UserRole.RECEPTION, UserRole.LOCAL_POLICE, UserRole.SUPER_POLICE] }
  ].filter(s => s.role.includes(user.role));

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
            {user.role === UserRole.RECEPTION ? 'Reception Dashboard' : 
             user.role === UserRole.SUPER_POLICE ? 'Admin Commission Dashboard' : 
             'Police Jurisdiction Dashboard'}
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">
            {user.role === UserRole.RECEPTION ? 'Hotel Management Terminal' : 
             user.role === UserRole.SUPER_POLICE ? 'Regional Security Oversight' : 
             `Local Enforcement: ${user.zone || 'Unassigned'}`}
          </p>
        </div>
      </div>

      {user.role === UserRole.RECEPTION && hotelProfile.name && (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-inner">
              <Building2 size={32}/>
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">{hotelProfile.name}</h4>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-2 py-1 rounded border border-slate-100">{hotelProfile.zone}</span>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{hotelProfile.address}</span>
              </div>
            </div>
          </div>
          <button onClick={() => setView('settings')} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95">
            <Edit size={14} className="text-amber-500"/> {t.edit} Profile
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {stats.map(s => (
          <div 
            key={s.l} 
            className="bg-white p-8 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.04)] cursor-pointer hover:border-amber-500 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] transition-all duration-300 group" 
            onClick={() => setView(s.l === t.guestList ? 'guestList' : s.l === t.wantedPersons ? 'wantedPersons' : 'notifications')}
          >
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 group-hover:text-amber-600 transition-colors">{s.l}</p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{s.v}</p>
            </div>
            <div className={`${s.c} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transform group-hover:rotate-12 transition-transform duration-300`}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {(user.role === UserRole.LOCAL_POLICE || user.role === UserRole.SUPER_POLICE) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] h-[400px]">
            <div className="flex justify-between items-center mb-8">
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Regional Traffic Analysis</h4>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guest Volume</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={[{n:'Mon', v:guests.length},{n:'Tue', v:12},{n:'Wed', v:18},{n:'Thu', v:15},{n:'Fri', v:25},{n:'Sat', v:30},{n:'Sun', v:22}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontWeight: 900, fontSize: '12px'}}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar dataKey="v" fill="#4f46e5" radius={[6,6,0,0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.2)] h-[400px] overflow-hidden flex flex-col relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-yellow-400"></div>
             <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-white uppercase text-[10px] tracking-widest flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                   Live Monitoring
                </h4>
                <span className="text-[9px] text-white/40 font-black uppercase tracking-widest">Real-time Feed</span>
             </div>
             <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {guests.length > 0 ? guests.slice(0, 10).map((g: any) => (
                  <div key={g.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-black text-amber-500 border border-white/5">{g.fullName[0]}</div>
                       <div>
                          <p className="text-[11px] font-black text-white uppercase leading-none mb-1.5">{g.fullName}</p>
                          <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider">{g.hotelName}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] text-white/40 font-bold uppercase mb-1">{g.checkInDate}</p>
                       {g.isWanted && <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black uppercase shadow-lg shadow-red-900/40">Wanted</span>}
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                    <Activity size={48} className="text-slate-700" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No active traffic detected</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
        <div className="flex justify-between items-center mb-8">
          <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Recent Activity Log</h4>
          <button onClick={() => setView('guestList')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All Records</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 uppercase text-slate-400 text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-6 py-4 rounded-l-2xl">Guest Identity</th>
                <th className="px-6 py-4">Establishment</th>
                <th className="px-6 py-4">Check-in Time</th>
                {(user.role === UserRole.LOCAL_POLICE || user.role === UserRole.SUPER_POLICE) && <th className="px-6 py-4 text-center rounded-r-2xl">Security Status</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {guests.slice(0,5).map((g: any) => (
                <tr key={g.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">{g.fullName[0]}</div>
                      <span className="text-[11px] font-black text-slate-900 uppercase">{g.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase">{g.hotelName}</td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase">{g.checkInDate}</td>
                  {(user.role === UserRole.LOCAL_POLICE || user.role === UserRole.SUPER_POLICE) && (
                    <td className="px-6 py-5 text-center">
                      {g.isWanted ? (
                        <span className="inline-flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                          <ShieldAlert size={10}/> Wanted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                          <ShieldCheck size={10}/> Verified
                        </span>
                      )}
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

function Input({ label, value, onChange, type = "text", required, icon: Icon }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors">
            <Icon size={16} />
          </div>
        )}
        <input 
          type={type} 
          className={`w-full bg-slate-50 border border-slate-200 rounded-xl ${Icon ? 'pl-12' : 'px-4'} py-3.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-300`} 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          required={required} 
        />
      </div>
    </div>
  );
}

function ListView({ items, t, setZoomImg, user }: any) {
  const [selectedGuest, setSelectedGuest] = useState<any>(null);

  return (
    <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
            <tr>
              <th className="px-8 py-6">ID Document</th>
              <th className="px-6 py-6">{t.fullName}</th>
              <th className="px-6 py-6">{t.guestPhone}</th>
              <th className="px-6 py-6">{t.roomNumber}</th>
              <th className="px-6 py-6">{t.origin} / {t.purpose}</th>
              <th className="px-6 py-6">{t.duration}</th>
              <th className="px-6 py-6">Establishment</th>
              {(user.role === UserRole.LOCAL_POLICE || user.role === UserRole.SUPER_POLICE) && <th className="px-6 py-6">Security Status</th>}
              <th className="px-8 py-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-[11px] font-bold uppercase text-slate-600">
            {items.map((g: any) => (
              <tr key={g.id} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-8 py-4">
                  <div className="relative w-12 h-16 rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-all border-2 border-white">
                    <img 
                      src={g.idPhoto} 
                      className="w-full h-full object-cover cursor-zoom-in" 
                      onClick={() => setZoomImg(g.idPhoto)} 
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <Maximize2 size={16} className="text-white" />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-black text-slate-900">{g.fullName}</td>
                <td className="px-6 py-4 tracking-tighter">{g.guestPhone}</td>
                <td className="px-6 py-4">
                  <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black">{g.roomNumber}</span>
                </td>
                <td className="px-6 py-4 leading-tight">
                  <p className="mb-1">{g.origin}</p>
                  <span className="text-[9px] text-slate-400 font-black tracking-widest">{g.purpose}</span>
                </td>
                <td className="px-6 py-4">{g.duration}</td>
                <td className="px-6 py-4 leading-tight">
                  <p className="mb-1 text-slate-900">{g.hotelName}</p>
                  <span className="text-[9px] text-slate-400 font-black tracking-widest">{g.hotelZone}</span>
                </td>
                <td className="px-6 py-4">
                  {g.isWanted ? (
                    <span className="inline-flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1 rounded-full text-[9px] font-black uppercase animate-pulse">
                      <ShieldAlert size={10}/> Wanted
                    </span>
                  ) : g.verificationStatus === 'flagged' ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                      <AlertCircle size={10}/> Flagged
                    </span>
                  ) : g.verificationStatus === 'verified' ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                      <ShieldCheck size={10}/> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-slate-400 bg-slate-50 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                      <Clock size={10}/> Pending
                    </span>
                  )}
                </td>
                <td className="px-8 py-4 text-center">
                  <button 
                    onClick={() => setSelectedGuest(g)}
                    className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-90"
                  >
                    <Maximize2 size={16}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedGuest && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] w-full max-w-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Guest Dossier</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Record ID: {selectedGuest.id.slice(0,8)}</p>
              </div>
              <button 
                onClick={() => setSelectedGuest(null)} 
                className="w-10 h-10 flex items-center justify-center bg-white text-slate-400 hover:text-red-500 rounded-full shadow-sm border border-slate-100 transition-colors"
              >
                <X size={20}/>
              </button>
            </div>
            <div className="p-10 flex flex-col md:flex-row gap-10 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="w-full md:w-2/5">
                <div className="relative group">
                  <img 
                    src={selectedGuest.idPhoto} 
                    className="w-full aspect-[3/4] object-cover rounded-3xl shadow-2xl cursor-zoom-in border-8 border-white group-hover:scale-[1.02] transition-transform duration-500" 
                    onClick={() => setZoomImg(selectedGuest.idPhoto)}
                  />
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl whitespace-nowrap">
                    Digital ID Scan
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <DetailItem label={t.fullName} value={selectedGuest.fullName} />
                  <DetailItem label={t.guestPhone} value={selectedGuest.guestPhone} />
                  <DetailItem label={t.nationality} value={selectedGuest.nationality} />
                  <DetailItem label={t.roomNumber} value={selectedGuest.roomNumber} />
                  <DetailItem label={t.origin} value={selectedGuest.origin} />
                  <DetailItem label={t.purpose} value={selectedGuest.purpose} />
                  <DetailItem label={t.duration} value={selectedGuest.duration} />
                  <DetailItem label={t.date} value={selectedGuest.checkInDate} />
                </div>
                
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Property Information</p>
                  <div className="grid grid-cols-2 gap-6">
                    <DetailItem label={t.hotel} value={selectedGuest.hotelName} />
                    <DetailItem label={t.zone} value={selectedGuest.hotelZone} />
                    <DetailItem label={t.receptionistName} value={selectedGuest.receptionistName} />
                    <DetailItem label={t.phoneNumber} value={selectedGuest.receptionistPhone} />
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Security Clearance</p>
                  <div className="flex flex-col gap-4">
                    {selectedGuest.isWanted ? (
                      <div className="flex items-center gap-4 p-5 bg-red-50 border border-red-100 rounded-2xl text-red-600">
                        <ShieldAlert size={32} className="animate-bounce" />
                        <div>
                          <p className="text-sm font-black uppercase tracking-tighter">Wanted Individual Detected</p>
                          <p className="text-[10px] font-bold uppercase opacity-70">Immediate local police notification required</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600">
                        <ShieldCheck size={32} />
                        <div>
                          <p className="text-sm font-black uppercase tracking-tighter">Identity Verified</p>
                          <p className="text-[10px] font-bold uppercase opacity-70">No active security alerts found</p>
                        </div>
                      </div>
                    )}

                    {(user.role === UserRole.LOCAL_POLICE || user.role === UserRole.SUPER_POLICE) && (
                      <div className="flex gap-2">
                        <button 
                          onClick={async () => {
                            try {
                              await setDoc(doc(db, 'guests', selectedGuest.id), { verificationStatus: 'verified' }, { merge: true });
                              setSelectedGuest({...selectedGuest, verificationStatus: 'verified'});
                            } catch (e) { console.error(e); }
                          }}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedGuest.verificationStatus === 'verified' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50'}`}
                        >
                          Mark Verified
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              await setDoc(doc(db, 'guests', selectedGuest.id), { verificationStatus: 'flagged' }, { merge: true });
                              setSelectedGuest({...selectedGuest, verificationStatus: 'flagged'});
                            } catch (e) { console.error(e); }
                          }}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedGuest.verificationStatus === 'flagged' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-red-50'}`}
                        >
                          Flag for Investigation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4 no-print">
              <button onClick={() => window.print()} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-100 transition-all shadow-sm active:scale-95">
                <Printer size={16} className="text-indigo-600"/> {t.print} Record
              </button>
              <button onClick={() => setSelectedGuest(null)} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95">
                {t.cancel}
              </button>
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
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
      <p className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-tight">{value || 'N/A'}</p>
    </div>
  );
}

function PoliceSettings({ t, lang, setLang, activePoliceZone, setActivePoliceZone, user, isDarkMode, setIsDarkMode, allUsers, syncStatus }: any) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showUserMgmt, setShowUserMgmt] = useState(false);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-[0_30px_60px_rgba(0,0,0,0.3)]' : 'bg-white border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)]'} p-10 rounded-[2.5rem] border transition-all duration-500`}>
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className={`text-2xl font-black uppercase tracking-tighter flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <Settings size={28} className="text-amber-500 animate-[spin_4s_linear_infinite]"/> System Configuration
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Terminal ID: {user.uid.slice(0,12)}</p>
          </div>
          <div className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
            <div className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`}></div>
            {syncStatus === 'synced' ? 'Cloud Synchronized' : 'Syncing...'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div className={`p-6 rounded-3xl border transition-all ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50/50 border-slate-100'} flex items-center justify-between group hover:border-amber-500/30`}>
              <div>
                <p className={`text-xs font-black uppercase tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Language / ቋንቋ</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">System display language</p>
              </div>
              <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                <button onClick={() => setLang('am')} className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${lang === 'am' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-600'}`}>አማርኛ</button>
                <button onClick={() => setLang('en')} className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${lang === 'en' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-600'}`}>English</button>
              </div>
            </div>

            <div className={`p-6 rounded-3xl border transition-all ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50/50 border-slate-100'} flex items-center justify-between group hover:border-amber-500/30`}>
              <div>
                <p className={`text-xs font-black uppercase tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Visual Theme</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Dark mode interface</p>
              </div>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-14 h-7 rounded-full transition-all relative p-1 ${isDarkMode ? 'bg-amber-500' : 'bg-slate-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all transform ${isDarkMode ? 'translate-x-7' : 'translate-x-0'} flex items-center justify-center`}>
                   {isDarkMode ? <Moon size={10} className="text-amber-600"/> : <Sun size={10} className="text-slate-400"/>}
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-8">
            <div className={`p-6 rounded-3xl border transition-all ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50/50 border-slate-100'} flex items-center justify-between group hover:border-amber-500/30`}>
              <div>
                <p className={`text-xs font-black uppercase tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Push Notifications</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Alerts for wanted persons</p>
              </div>
              <button 
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-14 h-7 rounded-full transition-all relative p-1 ${notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all transform ${notificationsEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className={`p-6 rounded-3xl border transition-all ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50/50 border-slate-100'} flex items-center justify-between group hover:border-amber-500/30`}>
              <div>
                <p className={`text-xs font-black uppercase tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Auto-Refresh Feed</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Real-time data updates</p>
              </div>
              <button 
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`w-14 h-7 rounded-full transition-all relative p-1 ${autoRefresh ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all transform ${autoRefresh ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {user.role === UserRole.SUPER_POLICE && (
          <div className="mt-10 space-y-10">
            <div className={`mt-10 p-8 rounded-[2rem] border transition-all ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
              <div className="mb-6">
                <p className={`text-sm font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Active Jurisdiction Oversight</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Filter all regional data by specific zone</p>
              </div>
              <div className="relative">
                <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  className={`w-full border rounded-2xl pl-12 pr-6 py-4 font-black text-sm outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all appearance-none ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                  value={activePoliceZone}
                  onChange={(e) => setActivePoliceZone(e.target.value)}
                >
                  <option value="All">All Jurisdictions (Regional Oversight)</option>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                   <ChevronDown size={20} />
                </div>
              </div>
            </div>

            {user.email?.endsWith('@shared.com') && (
              <div className={`p-8 rounded-[2rem] border transition-all ${isDarkMode ? 'bg-red-900/10 border-red-900/20' : 'bg-red-50 border-red-100'}`}>
                <div className="mb-6">
                  <p className={`text-sm font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Shared Account Session</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Reset your jurisdiction selection for this device</p>
                </div>
                <button 
                  onClick={() => {
                    localStorage.removeItem('begu_engeda_police_zone');
                    window.location.reload();
                  }}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-lg"
                >
                  Reset Jurisdiction Selection
                </button>
              </div>
            )}

            <div className="space-y-6">
              <button 
                onClick={() => setShowUserMgmt(!showUserMgmt)}
                className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 border transition-all duration-300 shadow-lg active:scale-95 ${showUserMgmt ? 'bg-slate-900 text-white border-slate-900 shadow-slate-200' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50 shadow-slate-100'}`}
              >
                <Users size={18} className={showUserMgmt ? 'text-amber-500' : 'text-slate-400'}/> {showUserMgmt ? 'Hide Personnel Directory' : 'Access Personnel Directory'}
              </button>
              
              {showUserMgmt && (
                <div className="animate-in fade-in zoom-in-95 duration-500">
                  <UserManagement users={allUsers} t={t} isDarkMode={isDarkMode} />
                </div>
              )}
            </div>
          </div>
        )}

        <div className={`mt-10 p-8 rounded-[2rem] border transition-all ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
          <p className={`text-sm font-black uppercase tracking-tighter mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Security & Protocol Compliance</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <SecurityBadge label="Automatic Logout" status="Enabled" active={true} isDarkMode={isDarkMode} />
            <SecurityBadge label="Data Encryption" status="AES-256 Active" active={true} isDarkMode={isDarkMode} />
            <SecurityBadge label="Audit Logging" status="Continuous" active={true} isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>

      <div className={`${isDarkMode ? 'bg-amber-900/10 border-amber-900/20' : 'bg-amber-50 border-amber-100'} p-10 rounded-[2.5rem] border flex items-center gap-8 shadow-xl shadow-amber-500/5`}>
        <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-amber-500/40 shrink-0">
           <ShieldCheck size={40} />
        </div>
        <div>
          <p className={`text-lg font-black uppercase tracking-tighter ${isDarkMode ? 'text-amber-200' : 'text-amber-800'}`}>Official Commission Terminal</p>
          <p className={`text-[11px] font-bold leading-relaxed mt-2 ${isDarkMode ? 'text-amber-300/60' : 'text-amber-700/60'}`}>
            This device is registered for official police use only. All actions are monitored by the Technology and Information Center. 
            Unauthorized access, data tampering, or protocol violation is strictly prohibited and punishable by law.
          </p>
        </div>
      </div>
    </div>
  );
}

function SecurityBadge({ label, status, active, isDarkMode }: any) {
  return (
    <div className={`p-5 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-[10px] font-black uppercase ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{status}</p>
      </div>
      <CheckCircle2 size={16} className={active ? 'text-emerald-500' : 'text-slate-300'} />
    </div>
  );
}

function UserManagement({ users, t, isDarkMode }: any) {
  return (
    <div className={`rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.1)] border overflow-hidden transition-all duration-500 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
            <tr>
              <th className="px-8 py-6">Personnel Identity</th>
              <th className="px-6 py-6">Designation</th>
              <th className="px-6 py-6">Jurisdiction</th>
              <th className="px-8 py-6 text-right">Last Active Session</th>
            </tr>
          </thead>
          <tbody className={`divide-y text-[11px] font-bold uppercase ${isDarkMode ? 'divide-slate-800 text-slate-400' : 'divide-slate-50 text-slate-600'}`}>
            {users.map((u: any) => (
              <tr key={u.uid} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/50'}`}>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 text-xs font-black border border-slate-200 shadow-inner">{u.username[0]}</div>
                    <div>
                      <p className={`font-black tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{u.username}</p>
                      <p className="text-[9px] text-slate-400 lowercase font-bold tracking-wider">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest ${
                    u.role === UserRole.SUPER_POLICE ? 'bg-purple-50 text-purple-600 border border-purple-100' : 
                    u.role === UserRole.LOCAL_POLICE ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                    'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-5 text-[10px] font-black text-slate-400 tracking-widest">{u.zone || 'Global Oversight'}</td>
                <td className="px-8 py-5 text-right text-[10px] font-black text-slate-400 tracking-widest">
                   {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'No Session History'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <div className="p-20 text-center space-y-4 opacity-30">
           <Users size={64} className="mx-auto text-slate-300" />
           <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">No Personnel Records Found</p>
        </div>
      )}
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
      'Status': g.isWanted ? 'WANTED' : g.verificationStatus?.toUpperCase() || 'PENDING'
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
        g.isWanted ? 'WANTED' : g.verificationStatus?.toUpperCase() || 'PENDING'
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

function MapView({ hotels, guests, t, user, selectedHotel, setSelectedHotel }: any) {
  const center: [number, number] = useMemo(() => [9.03, 38.74], []); // Addis Ababa center
  
  // Mock coordinates for hotels if they don't have them
  const hotelsWithCoords = useMemo(() => {
    return hotels.map((h: any) => ({
      ...h,
      lat: h.lat || center[0] + (Math.random() - 0.5) * 0.1,
      lng: h.lng || center[1] + (Math.random() - 0.5) * 0.1
    }));
  }, [hotels, center]);

  const filteredHotels = useMemo(() => {
    if (user?.role === UserRole.LOCAL_POLICE && user.zone) {
      return hotelsWithCoords.filter((h: any) => h.zone === user.zone);
    }
    return hotelsWithCoords;
  }, [hotelsWithCoords, user]);

  return (
    <div className="h-[calc(100vh-200px)] bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">
      <div className="flex-1 relative z-10">
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredHotels.map((h: any) => (
            <Marker 
              key={h.id} 
              position={[h.lat, h.lng]} 
              eventHandlers={{
                click: () => setSelectedHotel(h),
              }}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-black text-slate-900 uppercase text-xs mb-1">{h.name}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{h.address}</p>
                  <p className="text-[9px] text-amber-600 font-black uppercase mt-1">{h.zone}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      <div className="w-full md:w-80 bg-slate-50 border-l border-slate-100 p-6 overflow-y-auto custom-scrollbar">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Building2 size={18} className="text-amber-500" />
          Establishment Registry
        </h3>
        
        <div className="space-y-4">
          {filteredHotels.map((h: any) => (
            <div 
              key={h.id} 
              onClick={() => setSelectedHotel(h)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedHotel?.id === h.id ? 'bg-white border-amber-500 shadow-lg scale-[1.02]' : 'bg-white/50 border-slate-100 hover:bg-white hover:border-slate-200'}`}
            >
              <p className="text-[11px] font-black text-slate-900 uppercase leading-tight mb-1">{h.name}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{h.zone}</p>
              {selectedHotel?.id === h.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <UserIcon size={12} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase">{h.receptionistName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase">{h.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={12} className="text-slate-400" />
                    <span className="text-[10px] font-black text-indigo-600 uppercase">
                      {guests.filter((g: any) => g.hotelId === h.id).length} Active Guests
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
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
