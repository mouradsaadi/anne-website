
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Video, MapPin, Hourglass, Phone, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { TimeSlot, AppointmentStatus, SessionType } from '../types';
import { bookSlotAsync, simulateEmailNotification, fetchSlotsAsync } from '../services/storageService';

const BookingCalendar: React.FC = () => {
  const assetBaseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', note: '', type: 'IN_PERSON' as SessionType });
  const [consent, setConsent] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<'IDLE' | 'SUCCESS_CONFIRMED' | 'SUCCESS_PENDING'>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Calendar Navigation State
  const [viewDate, setViewDate] = useState(new Date());

  // Load slots
  const loadData = async () => {
      const data = await fetchSlotsAsync();
      setSlots(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!consent) {
        setError("Veuillez accepter la politique de confidentialité pour continuer.");
        return;
    }

    setLoading(true);

    if (selectedSlot && formData.name && formData.email) {
      try {
          const result = await bookSlotAsync(selectedSlot.id, formData.name, formData.email, formData.phone, formData.note, formData.type);
          
          if (result.success) {
            simulateEmailNotification(
                selectedSlot.date, 
                selectedSlot.time, 
                formData.email, 
                formData.name, 
                result.status === AppointmentStatus.PENDING_APPROVAL ? 'REQUEST' : 'CONFIRM'
            );
            setBookingStatus(result.status === AppointmentStatus.BOOKED ? 'SUCCESS_CONFIRMED' : 'SUCCESS_PENDING');
            await loadData();
          } else {
              setError("Ce créneau n'est plus disponible.");
          }
      } catch (err) {
          setError("Une erreur est survenue.");
      } finally {
          setLoading(false);
      }
    }
  };

  // --- Calendar Logic ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
      const day = new Date(year, month, 1).getDay();
      return day === 0 ? 6 : day - 1; // Adjust for Monday start
  };

  const renderCalendar = () => {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);
      const todayStr = new Date().toISOString().split('T')[0];
      const days = [];

      // Empty slots for days before the 1st
      for (let i = 0; i < firstDay; i++) {
          days.push(<div key={`empty-${i}`} className="h-10 sm:h-12"></div>);
      }

      // Days of the month
      for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const isPast = dateStr < todayStr;
          
          // Check availability for this specific day
          const daySlots = slots.filter(s => s.date === dateStr);
          const hasAvailableSlots = daySlots.some(s => s.status === AppointmentStatus.AVAILABLE);
          const isSelected = selectedDate === dateStr;

          days.push(
              <button
                  key={d}
                  disabled={isPast || !hasAvailableSlots}
                  onClick={() => { setSelectedDate(dateStr); setSelectedSlot(null); }}
                  className={`
                      h-10 sm:h-12 w-full rounded-full flex flex-col items-center justify-center relative transition-all
                      ${isSelected 
                          ? 'bg-sage-600 text-white shadow-md transform scale-105 font-bold' 
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

  if (bookingStatus !== 'IDLE') {
    const isPending = bookingStatus === 'SUCCESS_PENDING';
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-stone-800 p-8 rounded-xl shadow-lg text-center my-12 border border-sage-100 dark:border-stone-700 animate-fade-in">
        {isPending ? (
             <Hourglass className="h-16 w-16 text-amber-500 mx-auto mb-4 animate-pulse" />
        ) : (
             <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        )}
        
        <h2 className="text-2xl font-bold text-stone-800 dark:text-white mb-2">
            {isPending ? 'Demande Envoyée' : 'Réservation Confirmée'}
        </h2>
        <p className="text-stone-600 dark:text-stone-300 mb-6">
          {isPending 
            ? `Merci, ${formData.name}. Votre demande pour le ${selectedSlot?.date} à ${selectedSlot?.time} a été transmise à Anne Robin. Vous recevrez une confirmation dès validation.`
            : `Merci, ${formData.name}. Votre rendez-vous pour le ${selectedSlot?.date} à ${selectedSlot?.time} est confirmé.`
          }
        </p>
        <div className="inline-flex items-center px-3 py-1 bg-sage-100 dark:bg-sage-900 text-sage-800 dark:text-sage-200 rounded-full text-sm font-medium mb-6">
            {formData.type === 'VIDEO' ? <Video className="h-4 w-4 mr-2"/> : <MapPin className="h-4 w-4 mr-2"/>}
            {formData.type === 'VIDEO' ? 'Consultation Vidéo' : 'Au Cabinet'}
        </div>
        <button 
          onClick={() => {
              setBookingStatus('IDLE');
              setSelectedSlot(null);
              setFormData({name: '', email: '', phone: '', note: '', type: 'IN_PERSON'});
              setConsent(false);
          }}
          className="mt-2 w-full px-6 py-2 bg-sage-600 text-white rounded-md hover:bg-sage-700 transition-colors"
        >
          Réserver un autre créneau
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 bg-sand-50 dark:bg-stone-950 transition-colors duration-200" id="booking">
      <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between mb-10 gap-6">
        <div className="text-center lg:text-left">
          <h2 className="text-3xl font-serif font-bold text-stone-800 dark:text-white">Prendre Rendez-vous</h2>
          <p className="mt-2 text-stone-600 dark:text-stone-400">Sélectionnez une date et une heure pour votre séance.</p>
        </div>
        <div className="w-full max-w-xs lg:max-w-sm">
          <img
            src={`${assetBaseUrl}assets/images/therapy-couple.png`}
            alt="Illustration séance de couple"
            className="w-full h-auto rounded-lg shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Calendar Date Picker */}
        <div className="lg:col-span-5 bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 transition-colors duration-200 h-fit">
          <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-sage-500" /> Choisir une date
          </h3>
          
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-4 px-2">
              <button 
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full text-stone-600 dark:text-stone-300"
              >
                  <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="font-bold text-stone-800 dark:text-stone-100 capitalize">
                  {viewDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full text-stone-600 dark:text-stone-300"
              >
                  <ChevronRight className="h-5 w-5" />
              </button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 mb-2">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-stone-400 dark:text-stone-500 py-1">
                      {day}
                  </div>
              ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
              {renderCalendar()}
          </div>
          
          <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-stone-500 dark:text-stone-400">
             <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> Disponible</div>
             <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-700 mr-2"></span> Complet</div>
          </div>
        </div>

        {/* Middle/Right Column: Time Slots & Form */}
        <div className="lg:col-span-7 space-y-6">
            
            {/* Time Slot Selection */}
            {selectedDate && (
                <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 animate-fade-in transition-colors duration-200">
                <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-sage-500" /> 
                    Créneaux pour le {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {slots
                    .filter(s => s.date === selectedDate)
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map(slot => (
                        <button
                        key={slot.id}
                        disabled={slot.status !== AppointmentStatus.AVAILABLE}
                        onClick={() => { setSelectedSlot(slot); setError(null); }}
                        className={`py-3 px-2 rounded-md text-sm font-medium border transition-all ${
                            slot.status !== AppointmentStatus.AVAILABLE
                            ? 'hidden' 
                            : selectedSlot?.id === slot.id
                                ? 'bg-sage-600 text-white border-sage-600 shadow-md ring-2 ring-sage-300 ring-offset-1 dark:ring-offset-stone-900 scale-105'
                                : 'bg-white dark:bg-stone-800 text-sage-700 dark:text-sage-400 border-sage-200 dark:border-stone-600 hover:border-sage-400 hover:bg-sage-50 dark:hover:bg-stone-700'
                        }`}
                        >
                        {slot.time}
                        </button>
                    ))}
                    {slots.filter(s => s.date === selectedDate && s.status === AppointmentStatus.AVAILABLE).length === 0 && (
                        <p className="col-span-3 text-sm text-stone-500 italic py-2">Aucun créneau libre pour cette date.</p>
                    )}
                </div>
                </div>
            )}

            {/* Booking Form */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 relative flex flex-col transition-colors duration-200 min-h-[400px]">
                {!selectedSlot ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-stone-900 bg-opacity-80 dark:bg-opacity-80 backdrop-blur-[2px] rounded-xl z-10 p-6 text-center">
                        <Calendar className="h-12 w-12 text-stone-300 dark:text-stone-600 mb-4" />
                        <p className="text-stone-500 dark:text-stone-400 font-medium text-lg">
                            {selectedDate ? "Veuillez sélectionner un horaire ci-dessus." : "Veuillez sélectionner une date dans le calendrier."}
                        </p>
                    </div>
                ) : null}
            
                <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-6">Informations Personnelles</h3>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md flex items-center text-red-700 dark:text-red-200 text-sm">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleBook} className="space-y-5 flex-grow">
                    <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Nom complet</label>
                    <input
                        type="text"
                        required
                        className="block w-full rounded-md border border-stone-300 dark:border-stone-600 shadow-sm focus:border-sage-500 focus:ring-sage-500 p-2.5 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Adresse Email</label>
                            <input
                                type="email"
                                required
                                className="block w-full rounded-md border border-stone-300 dark:border-stone-600 shadow-sm focus:border-sage-500 focus:ring-sage-500 p-2.5 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Mobile</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-4 w-4 text-stone-400" />
                                </div>
                                <input
                                    type="tel"
                                    placeholder="06 12 34 56 78"
                                    className="block w-full rounded-md border border-stone-300 dark:border-stone-600 shadow-sm focus:border-sage-500 focus:ring-sage-500 p-2.5 pl-10 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Type de séance</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, type: 'IN_PERSON'})}
                                className={`flex items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all ${
                                    formData.type === 'IN_PERSON' 
                                    ? 'bg-sage-50 dark:bg-sage-900/50 border-sage-500 text-sage-700 dark:text-sage-200 ring-1 ring-sage-500' 
                                    : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700'
                                }`}
                            >
                                <MapPin className="h-4 w-4 mr-2" />
                                Au Cabinet
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, type: 'VIDEO'})}
                                className={`flex items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all ${
                                    formData.type === 'VIDEO' 
                                    ? 'bg-sage-50 dark:bg-sage-900/50 border-sage-500 text-sage-700 dark:text-sage-200 ring-1 ring-sage-500' 
                                    : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700'
                                }`}
                            >
                                <Video className="h-4 w-4 mr-2" />
                                Visio
                            </button>
                        </div>
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Message (Optionnel)</label>
                    <textarea
                        rows={3}
                        className="block w-full rounded-md border border-stone-300 dark:border-stone-600 shadow-sm focus:border-sage-500 focus:ring-sage-500 p-2.5 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                        value={formData.note}
                        onChange={e => setFormData({...formData, note: e.target.value})}
                    />
                    </div>
                    
                    {/* GDPR Consent */}
                    <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="consent"
                                    type="checkbox"
                                    required
                                    checked={consent}
                                    onChange={(e) => setConsent(e.target.checked)}
                                    className="focus:ring-sage-500 h-4 w-4 text-sage-600 border-stone-300 rounded bg-white dark:bg-stone-800"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="consent" className="font-medium text-stone-700 dark:text-stone-300">
                                    Consentement RGPD
                                </label>
                                <p className="text-stone-500 dark:text-stone-400 text-xs mt-1">
                                    J'accepte que mes données personnelles soient traitées pour la gestion de mon rendez-vous, conformément à la <span className="underline cursor-pointer">politique de confidentialité</span>.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            type="submit"
                            disabled={!selectedSlot || loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-md text-base font-medium text-white bg-sage-600 hover:bg-sage-700 dark:bg-sage-700 dark:hover:bg-sage-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Traitement...' : 'Confirmer la demande'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
