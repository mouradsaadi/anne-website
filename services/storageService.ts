
import { TimeSlot, SessionType, AppointmentStatus } from '../types';
import { LocalStorageDAO, SupabaseDAO, IAppointmentDAO } from './dao';
import { config } from '../config';

let dao: IAppointmentDAO | null = null;

const getDAO = async (): Promise<IAppointmentDAO> => {
    if (dao) return dao;

    const chosenDAO: IAppointmentDAO = config.useSupabase ? new SupabaseDAO() : new LocalStorageDAO();
    await chosenDAO.init();
    dao = chosenDAO;
    return dao;
};

export const verifyPassword = async (input: string): Promise<boolean> => {
    const provider = await getDAO();
    return await provider.verifyPassword(input);
};

export const fetchSlotsAsync = async (): Promise<TimeSlot[]> => {
    const provider = await getDAO();
    return await provider.getSlots();
};

export const createSlot = async (date: string, time: string) => {
    const provider = await getDAO();
    await provider.createSlot(date, time);
};

export const bookSlotAsync = async (slotId: string, name: string, email: string, phone: string, note: string, type: SessionType): Promise<{success: boolean, status: AppointmentStatus}> => {
    const settings = getAdminSettings();
    const autoApprove = settings.autoApprove !== undefined ? settings.autoApprove : true;
    
    const provider = await getDAO();
    const success = await provider.bookSlot(slotId, name, email, phone, note, type, autoApprove);
    return { 
        success, 
        status: autoApprove ? AppointmentStatus.BOOKED : AppointmentStatus.PENDING_APPROVAL 
    };
}

export const updateSlotStatus = async (slotId: string, status: AppointmentStatus) => {
    const provider = await getDAO();
    await provider.updateStatus(slotId, status);
};

export const rescheduleSlot = async (oldSlotId: string, newDate: string, newTime: string) => {
    const provider = await getDAO();
    return await provider.rescheduleSlot(oldSlotId, newDate, newTime);
};

export const updateSlotWithSummary = async (slotId: string, summary: string) => {
    const provider = await getDAO();
    await provider.updateSummary(slotId, summary);
};

export const updatePrivateNote = async (slotId: string, note: string) => {
    const provider = await getDAO();
    await provider.updatePrivateNote(slotId, note);
};

export const deleteSlot = async (slotId: string) => {
    const provider = await getDAO();
    await provider.deleteSlot(slotId);
};

export const seedDatabase = async () => {
    const provider = await getDAO();
    await provider.seedData();
}

// --- Utilities ---

const SETTINGS_KEY = 'therapy_app_settings';

export interface AdminSettings {
    notificationEmail: string;
    receiveAlerts: boolean;
    autoApprove: boolean;
    // Billing Info
    pricePerSession: number;
    siret: string;
    address: string;
    city: string;
    // Advanced Notification Settings
    alertFrequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY';
    alertChannel: 'EMAIL' | 'SMS' | 'BOTH';
    pendingRequestsThreshold: number; // e.g. Notify if > 5 pending
    upcomingAppointmentsThreshold: number; // e.g. Daily recap if > 3 appointments
}

export const getAdminSettings = (): AdminSettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    // Default values including billing info and notification preferences
    const defaults: AdminSettings = { 
        notificationEmail: 'annerobinccf@outlook.fr', 
        receiveAlerts: true, 
        autoApprove: true,
        pricePerSession: 150,
        siret: '123 456 789 00012',
        address: '109 ter, Rue Pierre Loti',
        city: '17300 Rochefort',
        alertFrequency: 'IMMEDIATE',
        alertChannel: 'EMAIL',
        pendingRequestsThreshold: 1,
        upcomingAppointmentsThreshold: 1
    };

    if (!data) return defaults;
    
    const parsed = JSON.parse(data);
    return { ...defaults, ...parsed }; // Merge to ensure new fields exist
};

export const saveAdminSettings = (settings: AdminSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export interface RecentActivity {
    id: string;
    type: 'booking' | 'email' | 'sms' | 'system';
    message: string;
    timestamp: string;
}

export const getRecentActivity = (): RecentActivity[] => {
    const data = localStorage.getItem('therapy_app_activity');
    return data ? JSON.parse(data) : [];
};

export const logActivity = (type: 'booking' | 'email' | 'sms' | 'system', message: string) => {
    const activities = getRecentActivity();
    activities.unshift({
        id: Date.now().toString(),
        type,
        message,
        timestamp: new Date().toISOString()
    });
    if (activities.length > 30) activities.pop();
    localStorage.setItem('therapy_app_activity', JSON.stringify(activities));
};

export const simulateEmailNotification = (date: string, time: string, clientEmail: string, clientName: string, type: 'REQUEST' | 'CONFIRM' | 'CANCEL' | 'RESCHEDULE' | 'INVOICE') => {
    let msg = '';
    let logMsg = '';

    switch (type) {
        case 'REQUEST':
            msg = `Nouvelle demande de RDV : ${clientName} le ${date} à ${time}`;
            logMsg = `Email de réception demande envoyé à ${clientEmail}`;
            break;
        case 'CONFIRM':
            msg = `Réservation confirmée : ${clientName} le ${date} à ${time}`;
            logMsg = `Email de confirmation envoyé à ${clientEmail}`;
            break;
        case 'CANCEL':
            msg = `RDV annulé : ${clientName} le ${date} à ${time}`;
            logMsg = `Email d'annulation envoyé à ${clientEmail}`;
            break;
        case 'RESCHEDULE':
            msg = `RDV reporté : ${clientName}, nouveau créneau le ${date} à ${time}`;
            logMsg = `Email de report envoyé à ${clientEmail}`;
            break;
        case 'INVOICE':
            msg = `Facture générée : ${clientName}`;
            logMsg = `Facture envoyée par email à ${clientEmail}`;
            break;
    }
        
    if (type === 'REQUEST' || type === 'CONFIRM') {
        logActivity('booking', msg);
    }
    logActivity('email', logMsg);
};

export const simulateSMSNotification = (clientName: string, type: 'reminder' | 'confirm') => {
    const message = type === 'reminder' 
        ? `Rappel envoyé par SMS à ${clientName}.` 
        : `Confirmation SMS envoyée à ${clientName}.`;
    logActivity('sms', message);
    return true;
};

export const getDashboardStatsAsync = async () => {
    const provider = await getDAO();
    const slots = await provider.getSlots();
    const booked = slots.filter(s => s.status === AppointmentStatus.BOOKED);
    const pending = slots.filter(s => s.status === AppointmentStatus.PENDING_APPROVAL);
    
    // Get current price setting for accurate revenue calculation
    const settings = getAdminSettings();
    
    return {
        totalAppointments: booked.length,
        totalRevenue: booked.length * settings.pricePerSession,
        totalClients: new Set(booked.map(s => s.clientEmail)).size,
        upcoming: booked.filter(s => new Date(s.date) >= new Date()).length,
        pendingRequests: pending.length
    };
};
