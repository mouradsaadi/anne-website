
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, MessageSquare, Wand2, Calendar as CalIcon, 
  Lock, Bell, Mail, LogOut, User, Search, Send, Clock, MapPin,
  CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Home,
  TrendingUp, Users, EuroIcon, Activity, Menu, X, Video, MessageCircle, Database, Layers, Check, XCircle, ArrowRightLeft, Phone, UserX, FileText, Printer, Download, CalendarDays, Settings
} from 'lucide-react';
import { TimeSlot, AppointmentStatus } from '../types';
import { 
    createSlot, deleteSlot, updateSlotWithSummary, verifyPassword, 
    getAdminSettings, getDashboardStatsAsync, getRecentActivity, RecentActivity,
    fetchSlotsAsync, simulateSMSNotification, updatePrivateNote, seedDatabase,
    saveAdminSettings, updateSlotStatus, logActivity, rescheduleSlot, simulateEmailNotification, AdminSettings
} from '../services/storageService';
import { generateClientResponse, summarizeClientNote, generateReminderEmail } from '../services/aiService';

const AdminDashboard: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Dashboard State
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'availability' | 'clients' | 'billing' | 'settings'>('overview');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [stats, setStats] = useState<any>({});
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(getAdminSettings());
  
  // Availability State
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('10:00');
  const [isBulkAdd, setIsBulkAdd] = useState(false);
  const [bulkStartTime, setBulkStartTime] = useState('09:00');
  const [bulkEndTime, setBulkEndTime] = useState('18:00');
  
  // Billing State
  const [billingClientEmail, setBillingClientEmail] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Mobile Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // AI & Modals
  const [loadingAi, setLoadingAi] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<{id: string, text: string, type: 'response' | 'reminder' | 'summary'} | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  
  // Modals
  const [rescheduleModal, setRescheduleModal] = useState<{isOpen: boolean, slot: TimeSlot | null, newDate: string, newTime: string}>({isOpen: false, slot: null, newDate: '', newTime: ''});
  const [rescheduleViewDate, setRescheduleViewDate] = useState(new Date()); // For calendar navigation in modal
  
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, slotId: string | null}>({isOpen: false, slotId: null});

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const dayDetailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
        refreshData();
        setNewDate(new Date().toISOString().split('T')[0]);
        setAdminSettings(getAdminSettings());
    }
  }, [isAuthenticated, activeTab]);

  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      const isValid = await verifyPassword(passwordInput);
      if (isValid) {
          setIsAuthenticated(true);
          setLoginError(false);
      } else {
          setLoginError(true);
      }
  };

  const refreshData = async () => {
    const all = await fetchSlotsAsync();
    all.sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
    setSlots(all);
    setStats(await getDashboardStatsAsync());
    setActivities(getRecentActivity());
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;

    if (isBulkAdd) {
        const startHour = parseInt(bulkStartTime.split(':')[0]);
        const endHour = parseInt(bulkEndTime.split(':')[0]);
        let count = 0;
        for (let h = startHour; h <= endHour; h++) {
            const timeStr = `${h.toString().padStart(2, '0')}:00`;
            await createSlot(newDate, timeStr);
            count++;
        }
        showToast(`${count} créneaux ajoutés`);
    } else {
        if (newTime) {
            await createSlot(newDate, newTime);
            showToast('Disponibilité ajoutée');
        }
    }
    await refreshData();
  };

  const handleDelete = (id: string) => {
    setDeleteModal({isOpen: true, slotId: id});
  };

  const confirmDelete = async () => {
    if (deleteModal.slotId) {
      await deleteSlot(deleteModal.slotId);
      showToast('Créneau supprimé');
      await refreshData();
      setDeleteModal({isOpen: false, slotId: null});
    }
  };

  const handleStatusChange = async (slot: TimeSlot, status: AppointmentStatus) => {
      // Si on passe à AVAILABLE, cela signifie une annulation/rejet
      await updateSlotStatus(slot.id, status);
      
      if (status === AppointmentStatus.BOOKED) {
          simulateEmailNotification(slot.date, slot.time, slot.clientEmail || '', slot.clientName || '', 'CONFIRM');
          showToast('Demande Acceptée');
      } else if (status === AppointmentStatus.AVAILABLE) {
           simulateEmailNotification(slot.date, slot.time, slot.clientEmail || '', slot.clientName || '', 'CANCEL');
           showToast(slot.status === AppointmentStatus.BOOKED ? 'RDV Annulé (Créneau libéré)' : 'Demande Refusée');
      }
      await refreshData();
  };

  const openReschedule = (slot: TimeSlot) => {
      setRescheduleModal({
          isOpen: true,
          slot,
          newDate: '',
          newTime: ''
      });
      // Initialize view date to today or slot date
      setRescheduleViewDate(new Date());
  };

  const confirmReschedule = async () => {
      if (rescheduleModal.slot && rescheduleModal.newDate && rescheduleModal.newTime) {
         const success = await rescheduleSlot(rescheduleModal.slot.id, rescheduleModal.newDate, rescheduleModal.newTime);
         if (success) {
             simulateEmailNotification(rescheduleModal.newDate, rescheduleModal.newTime, rescheduleModal.slot.clientEmail || '', rescheduleModal.slot.clientName || '', 'RESCHEDULE');
             showToast('RDV Reporté avec succès');
             setRescheduleModal({isOpen: false, slot: null, newDate: '', newTime: ''});
             await refreshData();
         } else {
             alert("Impossible de reporter : Ce créneau est peut-être déjà occupé ou invalide.");
         }
      }
  };

  const handleSeedData = async () => {
      if(window.confirm("Attention : Cela va écraser les données. Continuer ?")) {
          showToast("Génération en cours...");
          try {
            await seedDatabase();
            await refreshData(); 
            showToast("Données de démonstration générées !");
          } catch (error) {
            console.error(error);
            showToast("Erreur lors de la génération");
          }
      }
  };

  const toggleAutoApprove = () => {
      const newSettings = { ...adminSettings, autoApprove: !adminSettings.autoApprove };
      setAdminSettings(newSettings);
      saveAdminSettings(newSettings);
      showToast("Paramètres sauvegardés");
  };

  const handleBillingSettingChange = (field: keyof AdminSettings, value: any) => {
      const newSettings = { ...adminSettings, [field]: value };
      setAdminSettings(newSettings);
      saveAdminSettings(newSettings);
  };
  
  const handleSettingChange = (field: keyof AdminSettings, value: any) => {
    const newSettings = { ...adminSettings, [field]: value };
    setAdminSettings(newSettings);
    saveAdminSettings(newSettings);
    showToast("Paramètres sauvegardés");
  };

  const handleSendInvoiceEmail = () => {
      if(billingClientEmail) {
          simulateEmailNotification(
              new Date().toISOString().split('T')[0], 
              "00:00", 
              billingClientEmail, 
              slots.find(s => s.clientEmail === billingClientEmail)?.clientName || "Client", 
              'INVOICE'
          );
          showToast('Facture envoyée par email');
          setShowInvoiceModal(false);
      }
  };

  const handleInvoicePrint = () => {
    window.print();
  };

  // AI & Note Handlers
  const handleGenerateResponse = async (slot: TimeSlot) => {
    if (!slot.clientName) return;
    setLoadingAi(slot.id);
    const response = await generateClientResponse(slot.clientName, slot.clientNote || "", slot.date, slot.time);
    setGeneratedText({ id: slot.id, text: response, type: 'response' });
    setLoadingAi(null);
  };
  const handleGenerateReminder = async (slot: TimeSlot) => {
    if (!slot.clientName) return;
    setLoadingAi(slot.id);
    const response = await generateReminderEmail(slot.clientName, slot.date, slot.time);
    setGeneratedText({ id: slot.id, text: response, type: 'reminder' });
    setLoadingAi(null);
  };
  const handleSummarize = async (slot: TimeSlot) => {
     if (!slot.clientNote) return;
     setLoadingAi(slot.id);
     const summary = await summarizeClientNote(slot.clientNote);
     await updateSlotWithSummary(slot.id, summary);
     await refreshData(); 
     setLoadingAi(null);
  };
  const handleSavePrivateNote = async (slotId: string) => {
      await updatePrivateNote(slotId, tempNote);
      setEditingNoteId(null);
      await refreshData();
      showToast('Note privée sauvegardée');
  };

  // --- Calendar Rendering Helper ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
      const day = new Date(year, month, 1).getDay();
      return day === 0 ? 6 : day - 1; 
  };

  // Main Dashboard Calendar Renderer
  const renderCalendar = () => {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);
      const days = [];

      for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-16 md:h-24 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-700"></div>);

      for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const daySlots = slots.filter(s => s.date === dateStr);
          const bookedCount = daySlots.filter(s => s.status === AppointmentStatus.BOOKED).length;
          const pendingCount = daySlots.filter(s => s.status === AppointmentStatus.PENDING_APPROVAL).length;
          const availableCount = daySlots.filter(s => s.status === AppointmentStatus.AVAILABLE).length;
          const isSelected = selectedDateStr === dateStr;

          days.push(
              <div 
                  key={d} 
                  onClick={() => { setSelectedDateStr(dateStr); if(window.innerWidth < 1024 && dayDetailsRef.current) dayDetailsRef.current.scrollIntoView({behavior:'smooth'}); }}
                  className={`h-16 md:h-24 border border-stone-100 dark:border-stone-700 p-1 md:p-2 cursor-pointer transition-colors relative
                      ${isSelected ? 'bg-sage-50 dark:bg-stone-800 ring-2 ring-sage-500 inset-0 z-10' : 'bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800'}
                  `}
              >
                  <span className="text-xs font-medium text-stone-700 dark:text-stone-400">{d}</span>
                  <div className="mt-1 space-y-0.5">
                      {bookedCount > 0 && <div className="text-[10px] bg-sage-100 dark:bg-sage-900/50 text-sage-800 dark:text-sage-300 px-1 rounded truncate">{bookedCount} Confirmé</div>}
                      {pendingCount > 0 && <div className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-1 rounded truncate font-bold">{pendingCount} En attente</div>}
                      {availableCount > 0 && <div className="text-[10px] bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 px-1 rounded truncate">{availableCount} Dispo</div>}
                  </div>
              </div>
          );
      }
      return days;
  };

  // Reschedule Modal Calendar Renderer
  const renderRescheduleCalendar = () => {
    const year = rescheduleViewDate.getFullYear();
    const month = rescheduleViewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const todayStr = new Date().toISOString().split('T')[0];
    const days = [];

    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isPast = dateStr < todayStr;
        const daySlots = slots.filter(s => s.date === dateStr);
        const hasAvailableSlots = daySlots.some(s => s.status === AppointmentStatus.AVAILABLE);
        const isSelected = rescheduleModal.newDate === dateStr;

        days.push(
            <button
                key={d}
                disabled={isPast || !hasAvailableSlots}
                type="button"
                onClick={() => setRescheduleModal({ ...rescheduleModal, newDate: dateStr, newTime: '' })}
                className={`
                    h-10 w-full rounded-full flex flex-col items-center justify-center relative transition-all
                    ${isSelected 
                        ? 'bg-sage-600 text-white shadow-md font-bold' 
                        : isPast 
                            ? 'text-stone-300 dark:text-stone-700 cursor-not-allowed' 
                            : hasAvailableSlots 
                                ? 'text-stone-700 dark:text-stone-200 hover:bg-sage-100 dark:hover:bg-stone-700 font-medium' 
                                : 'text-stone-400 dark:text-stone-600 cursor-default'}
                `}
            >
                <span className="text-sm">{d}</span>
                {hasAvailableSlots && !isSelected && !isPast && (
                    <span className="h-1.5 w-1.5 bg-green-500 rounded-full absolute bottom-1"></span>
                )}
            </button>
        );
    }
    return days;
  };

  const selectedDaySlots = slots.filter(s => s.date === selectedDateStr);
  const pendingSlots = slots.filter(s => s.status === AppointmentStatus.PENDING_APPROVAL);
  
  // Unique clients calculation
  const uniqueClients = Array.from(new Set(slots.filter(s => s.clientEmail).map(s => s.clientEmail)))
      .map(email => {
          const clientSlots = slots.filter(s => s.clientEmail === email);
          const latestInfo = clientSlots[clientSlots.length - 1];
          return {
              name: latestInfo.clientName || 'Inconnu',
              email: latestInfo.clientEmail || '',
              phone: latestInfo.clientPhone,
              history: clientSlots.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
              notes: clientSlots.map(s => s.clientNote).filter(Boolean).join('. ')
          };
      }).filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.email?.toLowerCase().includes(searchTerm.toLowerCase()));

  // Billing: Filter sessions for selected client
  const billingClientSessions = billingClientEmail 
      ? slots.filter(s => s.clientEmail === billingClientEmail && s.status === AppointmentStatus.BOOKED)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : [];

  const NavButton = ({ tab, icon: Icon, label }: any) => (
    <button 
        onClick={() => { setActiveTab(tab); setIsMobileMenuOpen(false); }} 
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab ? 'bg-sage-50 dark:bg-stone-800 text-sage-700 dark:text-sage-300 font-medium' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
    >
        <Icon className="h-5 w-5" /> <span>{label}</span>
    </button>
  );

  // --- Logic for "Today's Schedule" vs "Next Schedule" ---
  const getOverviewSchedule = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const todaySlots = slots.filter(s => s.date === todayStr && s.status === AppointmentStatus.BOOKED);
      
      // If we have appointments today, show them
      if (todaySlots.length > 0) {
          return {
              title: "Rappels pour Aujourd'hui",
              dateStr: todayStr,
              dateDisplay: new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
              displaySlots: todaySlots.sort((a,b) => a.time.localeCompare(b.time)),
              isToday: true
          };
      }

      // Otherwise, find the next day with BOOKED slots
      const futureDates = Array.from(new Set(
          slots
            .filter(s => s.status === AppointmentStatus.BOOKED && s.date > todayStr)
            .map(s => s.date)
      )).sort();

      if (futureDates.length > 0) {
          const nextDate = futureDates[0];
          const nextSlots = slots.filter(s => s.date === nextDate && s.status === AppointmentStatus.BOOKED);
          return {
              title: "Prochains RDV",
              dateStr: nextDate,
              dateDisplay: new Date(nextDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
              displaySlots: nextSlots.sort((a,b) => a.time.localeCompare(b.time)),
              isToday: false
          };
      }

      // No future appointments at all
      return {
          title: "Rappels pour Aujourd'hui",
          dateStr: todayStr,
          dateDisplay: new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
          displaySlots: [],
          isToday: true
      };
  };

  if (!isAuthenticated) return (
      <div className="min-h-screen flex items-center justify-center bg-sand-50 dark:bg-stone-950 px-4">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-xl shadow-lg p-8 border border-stone-100 dark:border-stone-800">
              <h2 className="text-2xl font-serif font-bold text-center text-stone-800 dark:text-stone-100 mb-6">Accès Praticien</h2>
              <form onSubmit={handleLogin} className="space-y-6">
                  <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="block w-full border border-stone-300 dark:border-stone-600 rounded-md p-2 bg-white dark:bg-stone-800 text-stone-900 dark:text-white" placeholder="Mot de passe" />
                  <button type="submit" className="w-full py-2 bg-sage-600 text-white rounded-md">Se connecter</button>
              </form>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col lg:flex-row font-sans text-stone-800 dark:text-stone-100 transition-colors">
      
      {toastMessage && (
          <div className="fixed bottom-4 right-4 bg-stone-800 dark:bg-white text-white dark:text-stone-900 px-6 py-3 rounded-lg shadow-xl z-50 animate-bounce flex items-center print:hidden">
              <CheckCircle className="h-4 w-4 mr-2 text-green-400 dark:text-green-600" /> {toastMessage}
          </div>
      )}

      {/* Sidebar */}
      <div className="lg:w-64 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 lg:h-screen lg:sticky lg:top-0 flex-shrink-0 flex flex-col z-30 print:hidden">
          <div className="p-4 flex justify-between items-center border-b border-stone-100 dark:border-stone-800">
              <h1 className="text-xl font-serif font-bold">Therapy Connect</h1>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2"><Menu /></button>
          </div>
          <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} lg:block flex-1 flex flex-col`}>
              <nav className="p-4 space-y-2 flex-1">
                  <NavButton tab="overview" icon={Home} label="Vue d'ensemble" />
                  <NavButton tab="calendar" icon={CalIcon} label="Mon Agenda" />
                  <NavButton tab="availability" icon={Clock} label="Disponibilités" />
                  <NavButton tab="clients" icon={Users} label="Patients" />
                  <NavButton tab="billing" icon={FileText} label="Facturation" />
                  <NavButton tab="settings" icon={Settings} label="Paramètres" />
              </nav>
              <div className="p-4"><button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg"><LogOut className="h-5 w-5" /> <span>Déconnexion</span></button></div>
          </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-8 overflow-y-auto bg-stone-50 dark:bg-stone-950 print:bg-white print:p-0">
          
          {/* --- OVERVIEW --- */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
                
                {/* PENDING ACTIONS CENTER */}
                {pendingSlots.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 shadow-sm">
                         <h3 className="font-bold text-lg text-amber-800 dark:text-amber-200 flex items-center mb-4">
                             <AlertCircle className="h-5 w-5 mr-2" />
                             Actions Requises ({pendingSlots.length})
                         </h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                             {pendingSlots.map(slot => (
                                 <div key={slot.id} className="bg-white dark:bg-stone-900 p-4 rounded-lg shadow border border-amber-100 dark:border-stone-800">
                                     <div className="flex justify-between items-start mb-2">
                                         <div>
                                             <p className="font-bold text-stone-900 dark:text-white">{slot.clientName}</p>
                                             <p className="text-sm text-stone-500">{slot.date} à {slot.time}</p>
                                         </div>
                                         <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">En attente</span>
                                     </div>
                                     {slot.clientNote && <p className="text-xs text-stone-600 dark:text-stone-400 italic mb-3 bg-stone-50 dark:bg-stone-800 p-2 rounded">"{slot.clientNote}"</p>}
                                     
                                     <div className="flex space-x-2">
                                         <button onClick={() => handleStatusChange(slot, AppointmentStatus.BOOKED)} className="flex-1 bg-sage-600 text-white text-xs py-2 rounded hover:bg-sage-700">Accepter</button>
                                         <button onClick={() => openReschedule(slot)} className="flex-1 bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs py-2 rounded hover:bg-stone-300">Reporter</button>
                                         <button onClick={() => handleStatusChange(slot, AppointmentStatus.AVAILABLE)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><X className="h-4 w-4" /></button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-stone-900 p-5 rounded-xl shadow-sm border border-stone-100 dark:border-stone-800">
                        <p className="text-xs uppercase text-stone-500">En Attente</p>
                        <p className="text-2xl font-bold text-amber-600">{stats.pendingRequests || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-stone-900 p-5 rounded-xl shadow-sm border border-stone-100 dark:border-stone-800">
                        <p className="text-xs uppercase text-stone-500">Confirmés (Futur)</p>
                        <p className="text-2xl font-bold">{stats.upcoming}</p>
                    </div>
                    <div className="bg-white dark:bg-stone-900 p-5 rounded-xl shadow-sm border border-stone-100 dark:border-stone-800">
                        <p className="text-xs uppercase text-stone-500">Patients Total</p>
                        <p className="text-2xl font-bold">{stats.totalClients}</p>
                    </div>
                    <div className="bg-white dark:bg-stone-900 p-5 rounded-xl shadow-sm border border-stone-100 dark:border-stone-800">
                        <p className="text-xs uppercase text-stone-500">Revenu Est.</p>
                        <p className="text-2xl font-bold">{stats.totalRevenue} €</p>
                    </div>
                </div>

                {/* Intelligent Schedule Section */}
                {(() => {
                    const scheduleData = getOverviewSchedule();
                    return (
                        <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm p-6 border border-stone-100 dark:border-stone-800">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold flex items-center">
                                        {scheduleData.title}
                                        {!scheduleData.isToday && <CalendarDays className="h-5 w-5 ml-2 text-sage-600" />}
                                    </h3>
                                    <span className="text-sm text-stone-500 capitalize">{scheduleData.dateDisplay}</span>
                                </div>
                                {!scheduleData.isToday && scheduleData.displaySlots.length > 0 && (
                                    <span className="text-xs bg-sage-100 dark:bg-sage-900 text-sage-700 dark:text-sage-300 px-2 py-1 rounded-full">
                                        Prochaine journée d'activité
                                    </span>
                                )}
                            </div>
                            
                            {scheduleData.displaySlots.length === 0 ? (
                                <div className="text-center py-8 text-stone-500 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-dashed border-stone-200 dark:border-stone-700">
                                    <CalIcon className="h-8 w-8 mx-auto mb-2 text-stone-400" />
                                    <p>Aucun rendez-vous confirmé.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {scheduleData.displaySlots.map(slot => (
                                        <div key={slot.id} className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-4 rounded-xl shadow-sm relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-sage-500"></div>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="bg-sage-100 dark:bg-sage-900 text-sage-700 dark:text-sage-300 p-2 rounded-full">
                                                        <User className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-lg">{slot.time}</p>
                                                        <p className="font-medium text-stone-900 dark:text-stone-100 leading-none">{slot.clientName}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded border ${slot.sessionType === 'VIDEO' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                    {slot.sessionType === 'VIDEO' ? 'Visio' : 'Cabinet'}
                                                </span>
                                            </div>
                                            
                                            <div className="pl-10 space-y-1 mb-4">
                                                {slot.clientPhone && (
                                                    <p className="text-sm text-stone-500 flex items-center">
                                                        <Phone className="h-3 w-3 mr-2" /> {slot.clientPhone}
                                                    </p>
                                                )}
                                                {slot.clientNote && (
                                                    <p className="text-sm text-stone-500 italic bg-stone-50 dark:bg-stone-900/50 p-2 rounded border border-stone-100 dark:border-stone-700 mt-2">
                                                        "{slot.clientNote}"
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex space-x-2 pl-10">
                                                <button
                                                    onClick={() => handleGenerateReminder(slot)}
                                                    disabled={loadingAi === slot.id}
                                                    className={`flex-1 text-xs py-2 rounded transition-colors flex justify-center items-center ${loadingAi === slot.id ? 'opacity-60 cursor-not-allowed' : 'bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200'}`}
                                                >
                                                    {loadingAi === slot.id ? (
                                                        <span className="text-xs">Génération...</span>
                                                    ) : (
                                                        <>
                                                            <Send className="h-3 w-3 mr-1" /> Email Rappel
                                                        </>
                                                    )}
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if(window.confirm('Voulez-vous vraiment annuler ce RDV et libérer le créneau ?')) {
                                                            handleStatusChange(slot, AppointmentStatus.AVAILABLE);
                                                        }
                                                    }}
                                                    className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                                    title="Annuler le RDV"
                                                >
                                                    <UserX className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>
          )}

          {/* --- CALENDAR --- */}
          {activeTab === 'calendar' && (
            <div className="flex flex-col xl:flex-row gap-8">
              <div className="flex-1 bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 p-4">
                  <div className="flex justify-between mb-4">
                      <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))}><ChevronLeft /></button>
                      <h3 className="font-bold capitalize">{viewDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
                      <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))}><ChevronRight /></button>
                  </div>
                  <div className="grid grid-cols-7 text-center text-xs uppercase text-stone-500 mb-2">
                      {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => <div key={d}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-px bg-stone-200 dark:bg-stone-700 border border-stone-200 dark:border-stone-700">
                      {renderCalendar()}
                  </div>
              </div>

              <div ref={dayDetailsRef} className="w-full xl:w-96 bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 h-full min-h-[400px]">
                  <h3 className="font-bold text-lg mb-4 capitalize border-b pb-2 border-stone-100 dark:border-stone-800">
                      {new Date(selectedDateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  
                  {selectedDaySlots.length === 0 && <p className="text-stone-500">Rien de prévu.</p>}
                  
                  <div className="space-y-4">
                      {selectedDaySlots.map(slot => (
                          <div key={slot.id} className={`p-4 rounded-lg border shadow-sm transition-all ${
                              slot.status === AppointmentStatus.AVAILABLE ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700' : 
                              slot.status === AppointmentStatus.PENDING_APPROVAL ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' :
                              'bg-sage-50 dark:bg-sage-900/10 border-sage-200 dark:border-sage-800'
                          }`}>
                              <div className="flex justify-between items-start mb-2">
                                  <div className="font-bold text-lg">{slot.time}</div>
                                  {slot.status === AppointmentStatus.AVAILABLE && (
                                      <button onClick={() => handleDelete(slot.id)} className="text-red-500 hover:bg-red-50 p-1 rounded" title="Supprimer disponibilité">
                                          <Trash2 className="h-4 w-4" />
                                      </button>
                                  )}
                                  {slot.status === AppointmentStatus.PENDING_APPROVAL && (
                                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded font-bold">En Attente</span>
                                  )}
                              </div>

                              {slot.status === AppointmentStatus.AVAILABLE ? (
                                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Créneau Disponible</p>
                              ) : (
                                  <>
                                      <p className="font-bold">{slot.clientName}</p>
                                      <div className="text-xs text-stone-500 mb-2 space-y-1">
                                          <p>{slot.clientEmail}</p>
                                          {slot.clientPhone && <p className="flex items-center"><Phone className="h-3 w-3 mr-1"/> {slot.clientPhone}</p>}
                                      </div>
                                      <div className="bg-stone-100 dark:bg-stone-800 p-2 rounded text-xs italic mb-2">"{slot.clientNote}"</div>
                                      
                                      {slot.status === AppointmentStatus.PENDING_APPROVAL ? (
                                          <div className="flex space-x-2 mt-3">
                                              <button onClick={() => handleStatusChange(slot, AppointmentStatus.BOOKED)} className="flex-1 bg-green-600 text-white text-xs py-2 rounded flex justify-center items-center hover:bg-green-700">
                                                  <Check className="h-3 w-3 mr-1" /> Accepter
                                              </button>
                                              <button onClick={() => handleStatusChange(slot, AppointmentStatus.AVAILABLE)} className="flex-1 bg-red-100 text-red-700 text-xs py-2 rounded flex justify-center items-center hover:bg-red-200">
                                                  <XCircle className="h-3 w-3 mr-1" /> Refuser
                                              </button>
                                          </div>
                                      ) : (
                                          <div className="flex space-x-2 mt-3">
                                              <button onClick={() => openReschedule(slot)} className="flex-1 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs py-2 rounded flex justify-center items-center hover:bg-stone-200">
                                                  <ArrowRightLeft className="h-3 w-3 mr-1" /> Reporter
                                              </button>
                                              <button 
                                                onClick={() => {
                                                    if(window.confirm("Annuler le RDV et rendre le créneau disponible ?")) {
                                                        handleStatusChange(slot, AppointmentStatus.AVAILABLE);
                                                    }
                                                }} 
                                                className="px-2 text-red-400 hover:text-red-600 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded"
                                                title="Annuler le RDV"
                                              >
                                                  <UserX className="h-4 w-4" />
                                              </button>
                                              <button onClick={() => handleDelete(slot.id)} className="px-2 text-stone-400 hover:text-red-600" title="Supprimer le créneau">
                                                  <Trash2 className="h-4 w-4" />
                                              </button>
                                          </div>
                                      )}
                                  </>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
            </div>
          )}

          {/* --- CLIENTS --- */}
          {activeTab === 'clients' && (
              <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg">Liste des Patients ({uniqueClients.length})</h3>
                      <div className="relative">
                          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" />
                          <input 
                              type="text" 
                              placeholder="Rechercher..." 
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                              className="pl-10 pr-4 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800 dark:border-stone-700 w-64" 
                          />
                      </div>
                  </div>

                  <div className="space-y-6">
                      {uniqueClients.map((client, idx) => (
                          <div key={idx} className="border border-stone-100 dark:border-stone-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-stone-50 dark:bg-stone-900/50">
                              <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                                  <div className="flex items-start space-x-4">
                                      <div className="bg-sage-100 dark:bg-sage-900 text-sage-600 dark:text-sage-400 p-3 rounded-full">
                                          <User className="h-6 w-6" />
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-lg">{client.name}</h4>
                                          <div className="text-sm text-stone-500 space-y-1">
                                              <p className="flex items-center"><Mail className="h-3 w-3 mr-2"/> {client.email}</p>
                                              {client.phone && <p className="flex items-center"><Phone className="h-3 w-3 mr-2"/> {client.phone}</p>}
                                          </div>
                                      </div>
                                  </div>
                                  <div className="mt-4 md:mt-0 flex space-x-2">
                                      <button className="flex items-center px-3 py-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded text-sm font-medium hover:bg-stone-50">
                                          <Activity className="h-4 w-4 mr-2" /> Historique
                                      </button>
                                      <button
                                        onClick={() => {
                                            const upcoming = client.history.find(h => new Date(h.date) >= new Date());
                                            if (upcoming) handleGenerateReminder(upcoming);
                                            else showToast("Aucun RDV futur pour ce patient");
                                        }}
                                        disabled={loadingAi === (client.history.find(h => new Date(h.date) >= new Date())?.id)}
                                        className={`flex items-center px-3 py-1 rounded text-sm font-medium ${loadingAi === (client.history.find(h => new Date(h.date) >= new Date())?.id) ? 'bg-sage-300 text-white opacity-70 cursor-not-allowed' : 'bg-sage-600 text-white hover:bg-sage-700'}`}
                                      >
                                          {loadingAi === (client.history.find(h => new Date(h.date) >= new Date())?.id) ? (
                                              <span className="text-sm">Génération...</span>
                                          ) : (
                                              <><Send className="h-4 w-4 mr-2" /> Rappel</>
                                          )}
                                      </button>
                                  </div>
                              </div>
                              
                              {/* Client History Teaser */}
                              <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
                                  <p className="text-xs font-bold uppercase text-stone-400 mb-2">Derniers RDV</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      {client.history.slice(0, 3).map(h => (
                                          <div key={h.id} className={`text-xs p-2 rounded border ${h.status === AppointmentStatus.BOOKED ? 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-600' : 'bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800 opacity-60'}`}>
                                              <span className="font-bold">{h.date}</span> à {h.time}
                                              <span className={`ml-2 px-1 rounded ${h.status === AppointmentStatus.BOOKED ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                  {h.status === AppointmentStatus.BOOKED ? 'Confirmé' : 'Attente'}
                                              </span>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      ))}
                      {uniqueClients.length === 0 && <div className="text-center py-10 text-stone-500">Aucun patient trouvé.</div>}
                  </div>
              </div>
          )}

          {/* --- BILLING --- */}
          {activeTab === 'billing' && (
              <div className="space-y-8">
                  <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 p-6">
                       <h3 className="font-bold text-lg mb-4 flex items-center">
                           <EuroIcon className="h-5 w-5 mr-2 text-sage-600" /> 
                           Paramètres de Facturation
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                           <div>
                               <label className="text-xs text-stone-500 uppercase font-bold">Prix Consultation</label>
                               <input 
                                  type="number" 
                                  value={adminSettings.pricePerSession} 
                                  onChange={e => handleBillingSettingChange('pricePerSession', Number(e.target.value))}
                                  className="w-full mt-1 border rounded p-2 bg-stone-50 dark:bg-stone-800"
                               />
                           </div>
                           <div>
                               <label className="text-xs text-stone-500 uppercase font-bold">SIRET</label>
                               <input 
                                  type="text" 
                                  value={adminSettings.siret} 
                                  onChange={e => handleBillingSettingChange('siret', e.target.value)}
                                  className="w-full mt-1 border rounded p-2 bg-stone-50 dark:bg-stone-800"
                               />
                           </div>
                           <div>
                               <label className="text-xs text-stone-500 uppercase font-bold">Adresse Cabinet</label>
                               <input 
                                  type="text" 
                                  value={adminSettings.address} 
                                  onChange={e => handleBillingSettingChange('address', e.target.value)}
                                  className="w-full mt-1 border rounded p-2 bg-stone-50 dark:bg-stone-800"
                               />
                           </div>
                           <div>
                               <label className="text-xs text-stone-500 uppercase font-bold">Ville</label>
                               <input 
                                  type="text" 
                                  value={adminSettings.city} 
                                  onChange={e => handleBillingSettingChange('city', e.target.value)}
                                  className="w-full mt-1 border rounded p-2 bg-stone-50 dark:bg-stone-800"
                               />
                           </div>
                       </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-8">
                       {/* Client Selector List */}
                       <div className="w-full lg:w-1/3 bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 p-6">
                           <h4 className="font-bold mb-4">Sélectionner un Patient</h4>
                           <div className="relative mb-4">
                               <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" />
                               <input 
                                    type="text" 
                                    placeholder="Rechercher..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 p-2 text-sm border rounded bg-stone-50 dark:bg-stone-800"
                               />
                           </div>
                           <div className="space-y-2 max-h-96 overflow-y-auto">
                               {uniqueClients.map((client, idx) => (
                                   <button 
                                      key={idx} 
                                      onClick={() => { setBillingClientEmail(client.email); setSelectedSessions([]); }}
                                      className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${billingClientEmail === client.email ? 'bg-sage-600 text-white' : 'hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                                   >
                                       <span className="font-medium text-sm truncate">{client.name}</span>
                                       <span className="text-xs opacity-70 ml-2">{client.history.filter(h => h.status === AppointmentStatus.BOOKED).length} RDV</span>
                                   </button>
                               ))}
                           </div>
                       </div>

                       {/* Session List */}
                       <div className="w-full lg:w-2/3 bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 p-6 flex flex-col">
                           {billingClientEmail ? (
                               <>
                                 <div className="flex justify-between items-center mb-6">
                                     <h4 className="font-bold text-lg">Séances à Facturer</h4>
                                     <button 
                                        disabled={selectedSessions.length === 0}
                                        onClick={() => setShowInvoiceModal(true)}
                                        className="px-4 py-2 bg-stone-800 dark:bg-stone-700 text-white rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-700"
                                     >
                                         <FileText className="h-4 w-4 mr-2" /> Générer Facture
                                     </button>
                                 </div>
                                 
                                 {billingClientSessions.length === 0 ? (
                                     <p className="text-stone-500 italic">Aucune séance confirmée pour ce patient.</p>
                                 ) : (
                                     <div className="flex-1 overflow-y-auto">
                                         <table className="w-full text-sm">
                                             <thead className="bg-stone-50 dark:bg-stone-800 text-stone-500">
                                                 <tr>
                                                     <th className="p-3 text-left w-10">
                                                         <input 
                                                            type="checkbox" 
                                                            onChange={(e) => {
                                                                if(e.target.checked) setSelectedSessions(billingClientSessions.map(s => s.id));
                                                                else setSelectedSessions([]);
                                                            }}
                                                            checked={selectedSessions.length === billingClientSessions.length && billingClientSessions.length > 0}
                                                         />
                                                     </th>
                                                     <th className="p-3 text-left">Date</th>
                                                     <th className="p-3 text-left">Horaire</th>
                                                     <th className="p-3 text-left">Type</th>
                                                     <th className="p-3 text-right">Montant</th>
                                                 </tr>
                                             </thead>
                                             <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                                                 {billingClientSessions.map(slot => (
                                                     <tr key={slot.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                                                         <td className="p-3">
                                                             <input 
                                                                type="checkbox" 
                                                                checked={selectedSessions.includes(slot.id)}
                                                                onChange={(e) => {
                                                                    if(e.target.checked) setSelectedSessions([...selectedSessions, slot.id]);
                                                                    else setSelectedSessions(selectedSessions.filter(id => id !== slot.id));
                                                                }}
                                                             />
                                                         </td>
                                                         <td className="p-3">{slot.date}</td>
                                                         <td className="p-3">{slot.time}</td>
                                                         <td className="p-3">
                                                             <span className={`px-2 py-0.5 rounded text-xs ${slot.sessionType === 'VIDEO' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                                 {slot.sessionType === 'VIDEO' ? 'Visio' : 'Cabinet'}
                                                             </span>
                                                         </td>
                                                         <td className="p-3 text-right font-medium">{adminSettings.pricePerSession.toFixed(2)} €</td>
                                                     </tr>
                                                 ))}
                                             </tbody>
                                         </table>
                                     </div>
                                 )}
                                 
                                 {selectedSessions.length > 0 && (
                                     <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 flex justify-end">
                                         <div className="text-right">
                                             <p className="text-sm text-stone-500">Total Sélectionné ({selectedSessions.length} séances)</p>
                                             <p className="text-2xl font-bold text-sage-600">{selectedSessions.length * adminSettings.pricePerSession} €</p>
                                         </div>
                                     </div>
                                 )}
                               </>
                           ) : (
                               <div className="flex flex-col items-center justify-center h-64 text-stone-400">
                                   <User className="h-12 w-12 mb-4" />
                                   <p>Sélectionnez un patient à gauche pour voir ses séances.</p>
                               </div>
                           )}
                       </div>
                  </div>
              </div>
          )}

          {/* --- AVAILABILITY --- */}
          {activeTab === 'availability' && (
              <div className="max-w-4xl mx-auto">
                  <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 mb-8">
                      <h3 className="font-bold mb-4">Ajouter Disponibilité</h3>
                      <form onSubmit={handleAddSlot} className="flex flex-col md:flex-row gap-4 items-end">
                          <div className="flex-1 w-full">
                              <label className="text-sm">Date</label>
                              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full border rounded p-2 bg-white dark:bg-stone-800" />
                          </div>
                          <div className="flex items-center mb-2">
                             <input type="checkbox" checked={isBulkAdd} onChange={() => setIsBulkAdd(!isBulkAdd)} className="mr-2" />
                             <span className="text-sm">Journée complète</span>
                          </div>
                          {isBulkAdd ? (
                              <>
                                <div className="flex-1"><label className="text-sm">De</label><select value={bulkStartTime} onChange={e => setBulkStartTime(e.target.value)} className="w-full border rounded p-2 bg-white dark:bg-stone-800">{['08:00','09:00','10:00'].map(t=><option key={t}>{t}</option>)}</select></div>
                                <div className="flex-1"><label className="text-sm">À</label><select value={bulkEndTime} onChange={e => setBulkEndTime(e.target.value)} className="w-full border rounded p-2 bg-white dark:bg-stone-800">{['16:00','17:00','18:00'].map(t=><option key={t}>{t}</option>)}</select></div>
                              </>
                          ) : (
                              <div className="flex-1"><label className="text-sm">Heure</label><input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full border rounded p-2 bg-white dark:bg-stone-800" /></div>
                          )}
                          <button type="submit" className="px-6 py-2 bg-stone-800 text-white rounded">Ajouter</button>
                      </form>
                  </div>
              </div>
          )}

           {/* --- SETTINGS --- */}
           {activeTab === 'settings' && (
              <div className="max-w-2xl mx-auto space-y-8">
                  <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm p-6 border border-stone-200 dark:border-stone-800">
                    <h3 className="font-bold text-lg mb-6">Paramètres Généraux</h3>
                    
                    {/* Auto Approve Toggle */}
                    <div className="flex items-center justify-between py-4 border-b border-stone-100 dark:border-stone-800">
                        <div>
                            <p className="font-medium">Acceptation Automatique</p>
                            <p className="text-xs text-stone-500">Si désactivé, vous devrez valider manuellement chaque demande de RDV.</p>
                        </div>
                        <button 
                            onClick={toggleAutoApprove}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${adminSettings.autoApprove ? 'bg-sage-600' : 'bg-stone-200 dark:bg-stone-700'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${adminSettings.autoApprove ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                  </div>

                  {/* Notification Preferences */}
                  <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm p-6 border border-stone-200 dark:border-stone-800">
                    <h3 className="font-bold text-lg mb-6 flex items-center">
                        <Bell className="h-5 w-5 mr-2 text-sage-600" /> Préférences de Notification
                    </h3>

                    <div className="space-y-6">
                        {/* Frequency */}
                        <div>
                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Fréquence des alertes</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['IMMEDIATE', 'DAILY', 'WEEKLY'].map(freq => (
                                    <button
                                        key={freq}
                                        onClick={() => handleSettingChange('alertFrequency', freq)}
                                        className={`px-3 py-2 text-sm rounded-md border ${
                                            adminSettings.alertFrequency === freq 
                                            ? 'bg-sage-50 border-sage-500 text-sage-700 dark:bg-sage-900 dark:text-sage-200' 
                                            : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                                        }`}
                                    >
                                        {freq === 'IMMEDIATE' ? 'Immédiat' : freq === 'DAILY' ? 'Quotidien' : 'Hebdo'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Channel */}
                        <div>
                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Canal de notification</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['EMAIL', 'SMS', 'BOTH'].map(channel => (
                                    <button
                                        key={channel}
                                        onClick={() => handleSettingChange('alertChannel', channel)}
                                        className={`px-3 py-2 text-sm rounded-md border ${
                                            adminSettings.alertChannel === channel 
                                            ? 'bg-sage-50 border-sage-500 text-sage-700 dark:bg-sage-900 dark:text-sage-200' 
                                            : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                                        }`}
                                    >
                                        {channel === 'EMAIL' ? 'Email' : channel === 'SMS' ? 'SMS' : 'Les deux'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Thresholds */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-100 dark:border-stone-800">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                                    Seuil demandes en attente
                                </label>
                                <p className="text-xs text-stone-500 mb-2">Alerter si plus de X demandes</p>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={adminSettings.pendingRequestsThreshold}
                                    onChange={(e) => handleSettingChange('pendingRequestsThreshold', parseInt(e.target.value))}
                                    className="block w-full rounded-md border-stone-300 dark:border-stone-600 shadow-sm focus:border-sage-500 focus:ring-sage-500 sm:text-sm bg-stone-50 dark:bg-stone-800 p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                                    Seuil prochains RDV
                                </label>
                                <p className="text-xs text-stone-500 mb-2">Récapitulatif si plus de X RDV demain</p>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={adminSettings.upcomingAppointmentsThreshold}
                                    onChange={(e) => handleSettingChange('upcomingAppointmentsThreshold', parseInt(e.target.value))}
                                    className="block w-full rounded-md border-stone-300 dark:border-stone-600 shadow-sm focus:border-sage-500 focus:ring-sage-500 sm:text-sm bg-stone-50 dark:bg-stone-800 p-2"
                                />
                            </div>
                        </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm p-6 border border-stone-200 dark:border-stone-800">
                      <h4 className="font-bold text-purple-700 mb-2">Zone de Test</h4>
                      <p className="text-sm text-stone-500 mb-4">Générer des données pour voir à quoi ressemble l'application remplie.</p>
                      <button onClick={handleSeedData} className="px-4 py-2 bg-purple-600 text-white rounded shadow hover:bg-purple-700">Générer Données de Démo</button>
                  </div>
              </div>
          )}

      </div>

      {/* NEW Reschedule Modal with Visual Calendar */}
      {rescheduleModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4 print:hidden">
              <div className="bg-white dark:bg-stone-900 rounded-xl shadow-lg w-full max-w-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
                  {/* ... Reschedule Modal Content (unchanged) ... */}
                  <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-900">
                      <div>
                          <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100">Reporter le RDV</h3>
                          <p className="text-sm text-stone-500 dark:text-stone-400">Patient : <span className="font-semibold">{rescheduleModal.slot?.clientName}</span></p>
                      </div>
                      <div className="text-right">
                          <p className="text-xs text-stone-500 uppercase">Actuel</p>
                          <p className="text-sm font-bold text-sage-600">{rescheduleModal.slot?.date} à {rescheduleModal.slot?.time}</p>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Calendar Side */}
                          <div>
                               <div className="flex justify-between items-center mb-4">
                                  <button onClick={() => setRescheduleViewDate(new Date(rescheduleViewDate.setMonth(rescheduleViewDate.getMonth() - 1)))} className="p-1 hover:bg-stone-100 rounded-full"><ChevronLeft className="h-5 w-5"/></button>
                                  <h4 className="font-bold capitalize">{rescheduleViewDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h4>
                                  <button onClick={() => setRescheduleViewDate(new Date(rescheduleViewDate.setMonth(rescheduleViewDate.getMonth() + 1)))} className="p-1 hover:bg-stone-100 rounded-full"><ChevronRight className="h-5 w-5"/></button>
                               </div>
                               <div className="grid grid-cols-7 gap-1 mb-2">
                                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="text-center text-xs font-medium text-stone-400">{d}</div>)}
                               </div>
                               <div className="grid grid-cols-7 gap-1">
                                   {renderRescheduleCalendar()}
                               </div>
                          </div>

                          {/* Time Slot Side */}
                          <div>
                              <h4 className="font-bold mb-4 flex items-center text-stone-800 dark:text-stone-100">
                                  <Clock className="h-4 w-4 mr-2 text-sage-500"/> 
                                  {rescheduleModal.newDate ? `Horaires le ${new Date(rescheduleModal.newDate).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long'})}` : 'Sélectionnez une date'}
                              </h4>
                              
                              {!rescheduleModal.newDate && (
                                  <div className="flex flex-col items-center justify-center h-48 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-dashed border-stone-200 dark:border-stone-700">
                                      <CalIcon className="h-8 w-8 text-stone-300 mb-2" />
                                      <p className="text-sm text-stone-400">Veuillez choisir un jour sur le calendrier</p>
                                  </div>
                              )}

                              {rescheduleModal.newDate && (
                                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                                      {slots
                                        .filter(s => s.date === rescheduleModal.newDate && s.status === AppointmentStatus.AVAILABLE)
                                        .sort((a,b) => a.time.localeCompare(b.time))
                                        .map(slot => (
                                          <button
                                              key={slot.id}
                                              onClick={() => setRescheduleModal({...rescheduleModal, newTime: slot.time})}
                                              className={`py-2 px-3 rounded text-sm font-medium border transition-all ${
                                                  rescheduleModal.newTime === slot.time
                                                  ? 'bg-sage-600 text-white border-sage-600 ring-2 ring-sage-200'
                                                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-sage-50 dark:hover:bg-stone-700'
                                              }`}
                                          >
                                              {slot.time}
                                          </button>
                                        ))}
                                      {slots.filter(s => s.date === rescheduleModal.newDate && s.status === AppointmentStatus.AVAILABLE).length === 0 && (
                                          <p className="col-span-3 text-center text-sm text-stone-500 italic py-4">Aucun créneau libre.</p>
                                      )}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
                  
                  <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 flex justify-end space-x-3">
                      <button onClick={() => setRescheduleModal({isOpen: false, slot: null, newDate:'', newTime:''})} className="px-4 py-2 text-stone-500 hover:text-stone-700 dark:text-stone-400">Annuler</button>
                      <button 
                        onClick={confirmReschedule} 
                        disabled={!rescheduleModal.newDate || !rescheduleModal.newTime}
                        className="px-6 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Confirmer le report
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* INVOICE MODAL */}
      {showInvoiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in p-4 print:p-0 print:bg-white print:static">
              {/* Modal Wrapper with explicit dark mode background for the modal frame, but keeping light settings for print */}
              <div className="bg-white dark:bg-stone-900 w-full max-w-3xl h-[90vh] print:h-auto rounded-xl shadow-2xl overflow-hidden flex flex-col relative print:shadow-none print:w-full">
                  
                  {/* Modal Header */}
                  <div className="bg-stone-900 text-white p-4 flex justify-between items-center print:hidden">
                      <h3 className="font-bold flex items-center"><FileText className="mr-2" /> Prévisualisation Facture</h3>
                      <div className="flex space-x-3">
                           <button onClick={handleSendInvoiceEmail} className="px-3 py-1 bg-sage-600 text-white rounded text-sm font-medium hover:bg-sage-700 flex items-center"><Mail className="h-4 w-4 mr-1" /> Email</button>
                          <button onClick={handleInvoicePrint} className="px-3 py-1 bg-white text-stone-900 rounded text-sm font-medium hover:bg-stone-100 flex items-center"><Printer className="h-4 w-4 mr-1" /> Imprimer / PDF</button>
                          <button onClick={() => setShowInvoiceModal(false)} className="px-3 py-1 text-stone-300 hover:text-white"><X /></button>
                      </div>
                  </div>
                  
                  {/* Invoice Content - FORCED LIGHT MODE */}
                  {/* We deliberately use bg-white and text-stone-900 and avoid dark: classes here to simulate paper */}
                  <div className="flex-1 overflow-y-auto p-8 md:p-12 print:p-0 print:overflow-visible bg-stone-100 dark:bg-stone-800">
                      <div className="bg-white text-stone-900 border border-stone-300 p-8 min-h-[800px] shadow-lg max-w-[210mm] mx-auto print:border-none print:shadow-none print:p-0">
                          {/* Invoice Header */}
                          <div className="flex justify-between items-start mb-12">
                              <div>
                                  <h1 className="text-2xl font-serif font-bold text-stone-900 mb-2">Anne Robin</h1>
                                  <p className="text-sm text-stone-500">Conseillère Conjugale et Familiale</p>
                                  <p className="text-sm text-stone-500 mt-2">{adminSettings.address}</p>
                                  <p className="text-sm text-stone-500">{adminSettings.city}</p>
                                  <p className="text-sm text-stone-500 mt-2">SIRET: {adminSettings.siret}</p>
                              </div>
                              <div className="text-right">
                                  <h2 className="text-4xl font-light text-stone-300 mb-4">FACTURE</h2>
                                  <p className="text-sm font-bold">N° FACT-{new Date().getFullYear()}-{Math.floor(Math.random() * 1000).toString().padStart(3, '0')}</p>
                                  <p className="text-sm text-stone-500">Date: {new Date().toLocaleDateString('fr-FR')}</p>
                              </div>
                          </div>

                          {/* Client Info */}
                          <div className="mb-12 border-b pb-8 border-stone-100">
                              <p className="text-xs font-bold uppercase text-stone-400 mb-2">Facturé à</p>
                              {billingClientEmail && slots.find(s => s.clientEmail === billingClientEmail) && (
                                  <>
                                      <p className="font-bold text-lg">{slots.find(s => s.clientEmail === billingClientEmail)?.clientName}</p>
                                      <p className="text-stone-500">{billingClientEmail}</p>
                                      <p className="text-stone-500">{slots.find(s => s.clientEmail === billingClientEmail)?.clientPhone}</p>
                                  </>
                              )}
                          </div>

                          {/* Items Table - Explicitly light styling */}
                          <table className="w-full mb-8">
                              <thead>
                                  <tr className="border-b-2 border-stone-900">
                                      <th className="text-left py-3 font-bold uppercase text-xs text-stone-900">Description</th>
                                      <th className="text-left py-3 font-bold uppercase text-xs text-stone-900">Date</th>
                                      <th className="text-right py-3 font-bold uppercase text-xs text-stone-900">Prix Unitaire</th>
                                      <th className="text-right py-3 font-bold uppercase text-xs text-stone-900">Total</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {billingClientSessions.filter(s => selectedSessions.includes(s.id)).map(slot => (
                                      <tr key={slot.id} className="border-b border-stone-100">
                                          <td className="py-4 text-sm text-stone-800">
                                              Séance de Thérapie {slot.sessionType === 'VIDEO' ? '(Visio)' : '(Cabinet)'}
                                          </td>
                                          <td className="py-4 text-sm text-stone-800">{slot.date} à {slot.time}</td>
                                          <td className="py-4 text-right text-sm text-stone-800">{adminSettings.pricePerSession.toFixed(2)} €</td>
                                          <td className="py-4 text-right text-sm font-medium text-stone-900">{adminSettings.pricePerSession.toFixed(2)} €</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>

                          {/* Total */}
                          <div className="flex justify-end">
                              <div className="w-64">
                                  <div className="flex justify-between py-2 text-stone-500">
                                      <span>Sous-total</span>
                                      <span>{(selectedSessions.length * adminSettings.pricePerSession).toFixed(2)} €</span>
                                  </div>
                                  <div className="flex justify-between py-2 border-t border-stone-900 mt-2 font-bold text-xl text-stone-900">
                                      <span>Total</span>
                                      <span>{(selectedSessions.length * adminSettings.pricePerSession).toFixed(2)} €</span>
                                  </div>
                              </div>
                          </div>

                          {/* Footer */}
                          <div className="mt-20 pt-8 border-t border-stone-100 text-center text-xs text-stone-400">
                              <p>TVA non applicable, art. 293 B du CGI.</p>
                              <p>Merci de votre confiance.</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in print:hidden">
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-lg w-full max-w-sm border border-stone-200 dark:border-stone-800">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mb-4">
                    <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-stone-900 dark:text-stone-100">Confirmer la suppression</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
                    Êtes-vous sûr de vouloir supprimer ce créneau ? Cette action est irréversible.
                  </p>
                  <div className="flex w-full space-x-3">
                    <button 
                      onClick={() => setDeleteModal({isOpen: false, slotId: null})} 
                      className="flex-1 px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                    >
                      Annuler
                    </button>
                    <button 
                      onClick={confirmDelete} 
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
