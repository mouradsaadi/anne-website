
import { TimeSlot, AppointmentStatus, SessionType } from '../types';
import { supabase } from './supabaseClient';

// --- 1. THE INTERFACE (Contract) ---
export interface IAppointmentDAO {
  init(): Promise<void>;
  getSlots(): Promise<TimeSlot[]>;
  createSlot(date: string, time: string): Promise<void>;
  bookSlot(slotId: string, name: string, email: string, phone: string, note: string, type: SessionType, autoApprove: boolean): Promise<boolean>;
  updateStatus(slotId: string, status: AppointmentStatus): Promise<void>;
  rescheduleSlot(oldSlotId: string, newDate: string, newTime: string): Promise<boolean>;
  updateSummary(slotId: string, summary: string): Promise<void>;
  updatePrivateNote(slotId: string, note: string): Promise<void>;
  deleteSlot(slotId: string): Promise<void>;
  verifyPassword(password: string): Promise<boolean>;
  seedData(): Promise<void>; 
}

// --- 2. LOCAL STORAGE IMPLEMENTATION (Current / Dev) ---
export class LocalStorageDAO implements IAppointmentDAO {
  private STORAGE_KEY = 'therapy_app_slots';
  private AUTH_KEY = 'therapy_app_auth';

  private async sha256(message: string) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async init(): Promise<void> {
    const existing = localStorage.getItem(this.STORAGE_KEY);
    // AUTO-SEED: If no data exists, generate it immediately so the user sees a full app
    if (!existing || existing === '[]') {
      await this.seedData();
    }
    
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    if (!localStorage.getItem(this.AUTH_KEY)) {
      if (adminPassword) {
        const hash = await this.sha256(adminPassword);
        localStorage.setItem(this.AUTH_KEY, hash);
      } else {
        console.warn('VITE_ADMIN_PASSWORD is not set; admin login is disabled.');
      }
    }
  }

  async getSlots(): Promise<TimeSlot[]> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  async createSlot(date: string, time: string): Promise<void> {
    const slots = await this.getSlots();
    const id = `${date}-${time}`;
    if (!slots.find(s => s.id === id)) {
      slots.push({ id, date, time, status: AppointmentStatus.AVAILABLE, sessionType: 'IN_PERSON' });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(slots));
    }
  }

  async bookSlot(slotId: string, name: string, email: string, phone: string, note: string, type: SessionType, autoApprove: boolean): Promise<boolean> {
    const slots = await this.getSlots();
    const index = slots.findIndex(s => s.id === slotId);
    
    // Allow booking if AVAILABLE
    if (index !== -1 && slots[index].status === AppointmentStatus.AVAILABLE) {
      slots[index].status = autoApprove ? AppointmentStatus.BOOKED : AppointmentStatus.PENDING_APPROVAL;
      slots[index].clientName = name;
      slots[index].clientEmail = email;
      slots[index].clientPhone = phone;
      slots[index].clientNote = note;
      slots[index].sessionType = type;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(slots));
      return true;
    }
    return false;
  }

  async updateStatus(slotId: string, status: AppointmentStatus): Promise<void> {
    const slots = await this.getSlots();
    const index = slots.findIndex(s => s.id === slotId);
    if (index !== -1) {
        // If rejecting (making available again), clear client data
        if (status === AppointmentStatus.AVAILABLE) {
            slots[index].status = status;
            delete slots[index].clientName;
            delete slots[index].clientEmail;
            delete slots[index].clientPhone;
            delete slots[index].clientNote;
            delete slots[index].aiSummary;
            delete slots[index].privateNotes;
        } else {
            slots[index].status = status;
        }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(slots));
    }
  }

  async rescheduleSlot(oldSlotId: string, newDate: string, newTime: string): Promise<boolean> {
      const slots = await this.getSlots();
      const oldIndex = slots.findIndex(s => s.id === oldSlotId);
      if (oldIndex === -1) return false;

      const oldSlot = slots[oldIndex];
      const newId = `${newDate}-${newTime}`;

      // Check if new slot already exists
      const targetIndex = slots.findIndex(s => s.id === newId);
      
      // If target exists and is BOOKED/PENDING, we can't move there
      // Exception: If we are moving to a slot that exists but is AVAILABLE, we overwrite it.
      if (targetIndex !== -1 && slots[targetIndex].status !== AppointmentStatus.AVAILABLE) {
          return false; 
      }

      // Create new slot data preserving client info
      const newSlot: TimeSlot = {
          ...oldSlot,
          id: newId,
          date: newDate,
          time: newTime,
          // If the old slot was pending, keep it pending, otherwise keep booked
          status: oldSlot.status 
      };

      // Remove old slot. If target existed (available), filter it out too.
      let updatedSlots = slots.filter(s => s.id !== oldSlotId && s.id !== newId);
      updatedSlots.push(newSlot);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSlots));
      return true;
  }

  async updateSummary(slotId: string, summary: string): Promise<void> {
    const slots = await this.getSlots();
    const index = slots.findIndex(s => s.id === slotId);
    if (index !== -1) {
      slots[index].aiSummary = summary;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(slots));
    }
  }

  async updatePrivateNote(slotId: string, note: string): Promise<void> {
    const slots = await this.getSlots();
    const index = slots.findIndex(s => s.id === slotId);
    if (index !== -1) {
      slots[index].privateNotes = note;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(slots));
    }
  }

  async deleteSlot(slotId: string): Promise<void> {
    const slots = await this.getSlots();
    const newSlots = slots.filter(s => s.id !== slotId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSlots));
  }

  async verifyPassword(input: string): Promise<boolean> {
    const storedHash = localStorage.getItem(this.AUTH_KEY);
    const inputHash = await this.sha256(input);
    return storedHash === inputHash;
  }

  async seedData(): Promise<void> {
    console.log("Seeding data started...");
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('therapy_app_activity');

    const today = new Date();
    const slots: TimeSlot[] = [];
    
    const clients = [
        { name: "Sophie Martin", email: "sophie.m@email.com", phone: "06 12 34 56 78", note: "Problèmes de communication." },
        { name: "Thomas Dubois", email: "thomas.d@email.com", phone: "06 98 76 54 32", note: "Préparation mariage." },
        { name: "Marc Lefebvre", email: "marc.l@email.com", phone: "07 11 22 33 44", note: "Stress au travail." },
        { name: "Alice Vidal", email: "alice.v@email.com", phone: "06 55 44 33 22", note: "Demande de suivi." },
        { name: "Lucas Bernard", email: "l.bernard@email.com", phone: "07 99 88 77 66", note: "Confiance en soi." },
        { name: "Emma Petit", email: "emma.p@email.com", phone: "06 22 33 44 55", note: "Anxiété sociale." },
        { name: "Hugo Moreau", email: "hugo.m@email.com", phone: "06 44 55 66 77", note: "Thérapie de couple." }
    ];

    // Generate Slots for 30 days (-10 to +20)
    for (let i = -10; i < 20; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        if (d.getDay() === 0) continue; // Skip Sundays
        
        const dateStr = d.toISOString().split('T')[0];
        const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
        
        times.forEach(time => {
             const rand = Math.random();
             const isPast = i < 0;
             
             let status = AppointmentStatus.AVAILABLE;
             let client = undefined;

             if (isPast) {
                 if (rand > 0.6) status = AppointmentStatus.BOOKED; 
             } else {
                 if (rand > 0.85) status = AppointmentStatus.BOOKED;
                 else if (rand > 0.80) status = AppointmentStatus.PENDING_APPROVAL;
             }

             if (status !== AppointmentStatus.AVAILABLE) {
                 client = clients[Math.floor(Math.random() * clients.length)];
             }

             slots.push({
                 id: `${dateStr}-${time}`,
                 date: dateStr,
                 time: time,
                 status: status,
                 sessionType: Math.random() > 0.7 ? 'VIDEO' : 'IN_PERSON',
                 clientName: client?.name,
                 clientEmail: client?.email,
                 clientPhone: client?.phone,
                 clientNote: client?.note,
                 privateNotes: (status === AppointmentStatus.BOOKED && Math.random() > 0.5) ? "Séance importante." : undefined
             });
        });
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(slots));
    
    const activities = [
        { id: '1', type: 'booking', message: 'Nouvelle demande : Alice Vidal', timestamp: new Date().toISOString() },
        { id: '2', type: 'email', message: 'Rappel envoyé à Marc Lefebvre', timestamp: new Date(Date.now() - 3600000).toISOString() }
    ];
    localStorage.setItem('therapy_app_activity', JSON.stringify(activities));
    console.log("Seeding complete. Slots:", slots.length);
  }
}

// --- 3. SUPABASE IMPLEMENTATION (Placeholder update) ---
export class SupabaseDAO implements IAppointmentDAO {
    private ensureClient(): NonNullable<typeof supabase> {
        if (!supabase) throw new Error('Supabase client is not configured. Set VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY and VITE_USE_SUPABASE=true.');
        return supabase;
    }

    async init(): Promise<void> {
        if (!supabase) {
            console.warn('Supabase not configured; falling back to no-op DAO.');
        }
    }

    async getSlots(): Promise<TimeSlot[]> {
        const client = this.ensureClient();
        const { data, error } = await client.from('appointments').select('*');
        if (error) throw error;
        return (data || []).map((row: any) => ({
            id: row.id,
            date: row.date,
            time: row.time,
            status: row.status as AppointmentStatus,
            clientName: row.client_name,
            clientEmail: row.client_email,
            clientPhone: row.client_phone,
            clientNote: row.client_note,
            aiSummary: row.ai_summary,
            sessionType: row.session_type as SessionType,
            privateNotes: row.private_notes
        }));
    }

    async createSlot(date: string, time: string): Promise<void> {
        const client = this.ensureClient();
        const { error } = await client.from('appointments').insert({
            id: `${date}-${time}`,
            date,
            time,
            status: AppointmentStatus.AVAILABLE,
            session_type: 'IN_PERSON'
        });
        if (error) throw error;
    }

    async bookSlot(slotId: string, name: string, email: string, phone: string, note: string, type: SessionType, autoApprove: boolean): Promise<boolean> {
        const client = this.ensureClient();
        const { error, count } = await client.from('appointments')
            .update({
                status: autoApprove ? AppointmentStatus.BOOKED : AppointmentStatus.PENDING_APPROVAL,
                client_name: name,
                client_email: email,
                client_phone: phone,
                client_note: note,
                session_type: type
            })
            .eq('id', slotId)
            .eq('status', AppointmentStatus.AVAILABLE)
            .select('id', { count: 'exact', head: true });
        if (error) throw error;
        return Boolean(count && count > 0);
    }

    async updateStatus(slotId: string, status: AppointmentStatus): Promise<void> {
        const client = this.ensureClient();
        const payload: any = { status };
        if (status === AppointmentStatus.AVAILABLE) {
            payload.client_name = null;
            payload.client_email = null;
            payload.client_phone = null;
            payload.client_note = null;
            payload.ai_summary = null;
            payload.private_notes = null;
        }
        const { error } = await client.from('appointments').update(payload).eq('id', slotId);
        if (error) throw error;
    }

    async rescheduleSlot(oldSlotId: string, newDate: string, newTime: string): Promise<boolean> {
        const client = this.ensureClient();
        const newId = `${newDate}-${newTime}`;

        const { data: target } = await client.from('appointments').select('status').eq('id', newId).maybeSingle();
        if (target && target.status !== AppointmentStatus.AVAILABLE) return false;

        const { error } = await client.rpc('reschedule_appointment', {
            old_id: oldSlotId,
            new_id: newId,
            new_date: newDate,
            new_time: newTime
        });

        if (error) throw error;
        return true;
    }

    async updateSummary(slotId: string, summary: string): Promise<void> {
        const client = this.ensureClient();
        const { error } = await client.from('appointments').update({ ai_summary: summary }).eq('id', slotId);
        if (error) throw error;
    }

    async updatePrivateNote(slotId: string, note: string): Promise<void> {
        const client = this.ensureClient();
        const { error } = await client.from('appointments').update({ private_notes: note }).eq('id', slotId);
        if (error) throw error;
    }

    async deleteSlot(slotId: string): Promise<void> {
        const client = this.ensureClient();
        const { error } = await client.from('appointments').delete().eq('id', slotId);
        if (error) throw error;
    }

    async verifyPassword(_input: string): Promise<boolean> {
        // TODO: replace with a secure auth flow (Supabase Auth or server-side validation)
        throw new Error('Password verification not implemented for Supabase DAO. Use Supabase Auth instead.');
    }

    async seedData(): Promise<void> {
        throw new Error('Seed is only supported for LocalStorageDAO. Use SQL/seed scripts for Supabase.');
    }
}
