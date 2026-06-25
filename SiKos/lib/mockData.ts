// Mock Data Store with LocalStorage fallback for Demo Mode
export interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin';
  created_at: string;
}

export interface Room {
  id: string;
  room_number: string;
  status: 'empty' | 'occupied' | 'overdue';
  type: 'daily' | 'monthly' | 'both';
  daily_rent: number;
  monthly_rent: number;
  description: string;
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  room_id: string | null;
  check_in_date: string;
  check_out_date: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  room_number?: string; // virtual join
}


export interface Payment {
  id: string;
  tenant_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'transfer';
  status: 'paid' | 'pending' | 'late';
  billing_period_start: string;
  billing_period_end: string;
  proof_url: string | null;
  notes: string | null;
  created_at: string;
  tenant_name?: string; // virtual join
  room_number?: string; // virtual join
}

// Default Seed Data
const DEFAULT_PROFILES: Profile[] = [
  { id: 'usr-1', name: 'Budi Kosmas (Owner)', email: 'owner@sikos.com', role: 'owner', created_at: '2026-01-01T00:00:00Z' },
  { id: 'usr-2', name: 'Ani Admin (Admin)', email: 'admin@sikos.com', role: 'admin', created_at: '2026-01-02T00:00:00Z' }
];

const DEFAULT_ROOMS: Room[] = [
  { id: 'rm-101', room_number: '101', status: 'occupied', type: 'both', daily_rent: 150000, monthly_rent: 1500000, description: 'AC, Queen Bed, Smart TV, Bathroom Inside', created_at: '2026-01-01T00:00:00Z' },
  { id: 'rm-102', room_number: '102', status: 'empty', type: 'monthly', daily_rent: 0, monthly_rent: 1300000, description: 'AC, Single Bed, Shared Bathroom', created_at: '2026-01-01T00:00:00Z' },
  { id: 'rm-103', room_number: '103', status: 'overdue', type: 'both', daily_rent: 180000, monthly_rent: 1800000, description: 'AC, King Bed, Hot Water, Bathroom Inside', created_at: '2026-01-01T00:00:00Z' },
  { id: 'rm-201', room_number: '201', status: 'occupied', type: 'monthly', daily_rent: 0, monthly_rent: 1200000, description: 'Fan, Queen Bed, Shared Bathroom', created_at: '2026-01-01T00:00:00Z' },
  { id: 'rm-202', room_number: '202', status: 'empty', type: 'daily', daily_rent: 100000, monthly_rent: 0, description: 'Fan, Single Bed, Shared Bathroom', created_at: '2026-01-01T00:00:00Z' },
  { id: 'rm-203', room_number: '203', status: 'empty', type: 'both', daily_rent: 150000, monthly_rent: 1500000, description: 'AC, Queen Bed, Shared Bathroom', created_at: '2026-01-01T00:00:00Z' }
];

const DEFAULT_TENANTS: Tenant[] = [
  { id: 'tn-1', name: 'Rian Hidayat', email: 'rian@gmail.com', phone: '081234567890', room_id: 'rm-101', check_in_date: '2026-01-10', check_out_date: null, status: 'active', created_at: '2026-01-10T00:00:00Z' },
  { id: 'tn-2', name: 'Bob Johnson', email: 'bob@example.com', phone: '087788990011', room_id: 'rm-103', check_in_date: '2026-02-15', check_out_date: null, status: 'active', created_at: '2026-02-15T00:00:00Z' },
  { id: 'tn-3', name: 'Siti Rahma', email: 'siti@outlook.com', phone: '085233445566', room_id: 'rm-201', check_in_date: '2026-05-01', check_out_date: null, status: 'active', created_at: '2026-05-01T00:00:00Z' }
];

const DEFAULT_PAYMENTS: Payment[] = [
  // Rian Hidayat (101) Payments
  { id: 'pm-1', tenant_id: 'tn-1', amount: 1500000, payment_date: '2026-05-10', payment_method: 'transfer', status: 'paid', billing_period_start: '2026-05-10', billing_period_end: '2026-06-09', proof_url: '/receipt-mock.jpg', notes: 'BCA Transfer from Rian', created_at: '2026-05-10T10:00:00Z' },
  { id: 'pm-2', tenant_id: 'tn-1', amount: 1500000, payment_date: '2026-06-09', payment_method: 'transfer', status: 'paid', billing_period_start: '2026-06-10', billing_period_end: '2026-07-09', proof_url: '/receipt-mock.jpg', notes: 'BCA Transfer from Rian early', created_at: '2026-06-09T09:00:00Z' },
  
  // Bob Johnson (103) - Overdue/Late
  { id: 'pm-3', tenant_id: 'tn-2', amount: 1800000, payment_date: '2026-04-15', payment_method: 'cash', status: 'paid', billing_period_start: '2026-04-15', billing_period_end: '2026-05-14', proof_url: null, notes: 'Paid in cash to Admin Ani', created_at: '2026-04-15T15:00:00Z' },
  { id: 'pm-4', tenant_id: 'tn-2', amount: 1800000, payment_date: '2026-06-01', payment_method: 'cash', status: 'pending', billing_period_start: '2026-05-15', billing_period_end: '2026-06-14', proof_url: null, notes: 'Promised to pay next week', created_at: '2026-05-15T00:00:00Z' },
  { id: 'pm-5', tenant_id: 'tn-2', amount: 1800000, payment_date: '2026-06-11', payment_method: 'transfer', status: 'late', billing_period_start: '2026-06-15', billing_period_end: '2026-07-14', proof_url: null, notes: 'Unpaid and overdue', created_at: '2026-06-11T00:00:00Z' },
  
  // Siti Rahma (201)
  { id: 'pm-6', tenant_id: 'tn-3', amount: 1200000, payment_date: '2026-05-01', payment_method: 'transfer', status: 'paid', billing_period_start: '2026-05-01', billing_period_end: '2026-05-31', proof_url: '/receipt-mock.jpg', notes: 'Mandiri Transfer', created_at: '2026-05-01T08:00:00Z' },
  { id: 'pm-7', tenant_id: 'tn-3', amount: 1200000, payment_date: '2026-06-01', payment_method: 'transfer', status: 'paid', billing_period_start: '2026-06-01', billing_period_end: '2026-06-30', proof_url: '/receipt-mock.jpg', notes: 'Mandiri Transfer', created_at: '2026-06-01T08:30:00Z' }
];

// Helper to initialize local storage
function getStorageItem<T>(key: string, defaultData: T[]): T[] {
  if (typeof window === 'undefined') return defaultData;
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    return JSON.parse(item);
  } catch {
    return defaultData;
  }
}

function setStorageItem<T>(key: string, data: T[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

export const mockDb = {
  // Profiles CRUD
  getProfiles: async (): Promise<Profile[]> => {
    return getStorageItem('sikos_profiles', DEFAULT_PROFILES);
  },
  saveProfile: async (profile: Profile): Promise<Profile> => {
    const list = getStorageItem('sikos_profiles', DEFAULT_PROFILES);
    const idx = list.findIndex(p => p.id === profile.id);
    if (idx >= 0) {
      list[idx] = profile;
    } else {
      list.push(profile);
    }
    setStorageItem('sikos_profiles', list);
    return profile;
  },
  deleteProfile: async (id: string): Promise<boolean> => {
    const list = getStorageItem('sikos_profiles', DEFAULT_PROFILES);
    const updated = list.filter(p => p.id !== id);
    setStorageItem('sikos_profiles', updated);
    return true;
  },

  // Rooms CRUD
  getRooms: async (): Promise<Room[]> => {
    return getStorageItem('sikos_rooms', DEFAULT_ROOMS);
  },
  saveRoom: async (room: Omit<Room, 'id' | 'created_at'> & { id?: string }): Promise<Room> => {
    const list = getStorageItem('sikos_rooms', DEFAULT_ROOMS);
    const now = new Date().toISOString();
    const finalRoom: Room = {
      id: room.id || `rm-${Date.now()}`,
      room_number: room.room_number,
      status: room.status,
      type: room.type,
      daily_rent: Number(room.daily_rent),
      monthly_rent: Number(room.monthly_rent),
      description: room.description || '',
      created_at: now
    };

    const idx = list.findIndex(r => r.id === finalRoom.id);
    if (idx >= 0) {
      finalRoom.created_at = list[idx].created_at; // preserve date
      list[idx] = finalRoom;
    } else {
      list.push(finalRoom);
    }
    setStorageItem('sikos_rooms', list);
    return finalRoom;
  },
  deleteRoom: async (id: string): Promise<boolean> => {
    const list = getStorageItem('sikos_rooms', DEFAULT_ROOMS);
    const updated = list.filter(r => r.id !== id);
    setStorageItem('sikos_rooms', updated);
    
    // Also disconnect tenants from this room
    const tenants = getStorageItem('sikos_tenants', DEFAULT_TENANTS);
    const updatedTenants = tenants.map(t => t.room_id === id ? { ...t, room_id: null } : t);
    setStorageItem('sikos_tenants', updatedTenants);
    return true;
  },

  // Tenants CRUD
  getTenants: async (): Promise<Tenant[]> => {
    const tenants = getStorageItem('sikos_tenants', DEFAULT_TENANTS);
    const rooms = getStorageItem('sikos_rooms', DEFAULT_ROOMS);
    return tenants.map(t => {
      const room = rooms.find(r => r.id === t.room_id);
      return {
        ...t,
        room_number: room ? room.room_number : undefined
      };
    });
  },
  saveTenant: async (tenant: Omit<Tenant, 'id' | 'created_at'> & { id?: string }): Promise<Tenant> => {
    const list = getStorageItem('sikos_tenants', DEFAULT_TENANTS);
    const rooms = getStorageItem('sikos_rooms', DEFAULT_ROOMS);
    const now = new Date().toISOString();
    const finalTenant: Tenant = {
      id: tenant.id || `tn-${Date.now()}`,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      room_id: tenant.room_id,
      check_in_date: tenant.check_in_date,
      check_out_date: tenant.check_out_date,
      status: tenant.status,
      created_at: now
    };

    // Auto-update room status if room is linked and tenant is active
    if (finalTenant.room_id) {
      const roomIdx = rooms.findIndex(r => r.id === finalTenant.room_id);
      if (roomIdx >= 0) {
        // If tenant is active, room is occupied. If not active, room is unchanged (or check if anyone else is inside)
        rooms[roomIdx].status = finalTenant.status === 'active' ? 'occupied' : 'empty';
        setStorageItem('sikos_rooms', rooms);
      }
    }

    const idx = list.findIndex(t => t.id === finalTenant.id);
    if (idx >= 0) {
      // If the room changed, empty the old room
      const oldTenant = list[idx];
      if (oldTenant.room_id && oldTenant.room_id !== finalTenant.room_id) {
        const oldRoomIdx = rooms.findIndex(r => r.id === oldTenant.room_id);
        if (oldRoomIdx >= 0) {
          rooms[oldRoomIdx].status = 'empty';
          setStorageItem('sikos_rooms', rooms);
        }
      }
      finalTenant.created_at = oldTenant.created_at;
      list[idx] = finalTenant;
    } else {
      list.push(finalTenant);
    }
    setStorageItem('sikos_tenants', list);
    return finalTenant;
  },
  deleteTenant: async (id: string): Promise<boolean> => {
    const list = getStorageItem('sikos_tenants', DEFAULT_TENANTS);
    const rooms = getStorageItem('sikos_rooms', DEFAULT_ROOMS);
    
    const tenantToDelete = list.find(t => t.id === id);
    if (tenantToDelete && tenantToDelete.room_id) {
      // Free the room
      const roomIdx = rooms.findIndex(r => r.id === tenantToDelete.room_id);
      if (roomIdx >= 0) {
        rooms[roomIdx].status = 'empty';
        setStorageItem('sikos_rooms', rooms);
      }
    }

    const updated = list.filter(t => t.id !== id);
    setStorageItem('sikos_tenants', updated);
    return true;
  },

  // Payments CRUD
  getPayments: async (): Promise<Payment[]> => {
    const payments = getStorageItem('sikos_payments', DEFAULT_PAYMENTS);
    const tenants = getStorageItem('sikos_tenants', DEFAULT_TENANTS);
    const rooms = getStorageItem('sikos_rooms', DEFAULT_ROOMS);

    return payments.map(p => {
      const tenant = tenants.find(t => t.id === p.tenant_id);
      const room = tenant ? rooms.find(r => r.id === tenant.room_id) : null;
      return {
        ...p,
        tenant_name: tenant ? tenant.name : 'Unknown Tenant',
        room_number: room ? room.room_number : 'N/A'
      };
    });
  },
  savePayment: async (payment: Omit<Payment, 'id' | 'created_at'> & { id?: string }): Promise<Payment> => {
    const list = getStorageItem('sikos_payments', DEFAULT_PAYMENTS);
    const now = new Date().toISOString();
    const finalPayment: Payment = {
      id: payment.id || `pm-${Date.now()}`,
      tenant_id: payment.tenant_id,
      amount: Number(payment.amount),
      payment_date: payment.payment_date,
      payment_method: payment.payment_method,
      status: payment.status,
      billing_period_start: payment.billing_period_start,
      billing_period_end: payment.billing_period_end,
      proof_url: payment.proof_url || null,
      notes: payment.notes || '',
      created_at: now
    };

    const idx = list.findIndex(p => p.id === finalPayment.id);
    if (idx >= 0) {
      finalPayment.created_at = list[idx].created_at;
      list[idx] = finalPayment;
    } else {
      list.push(finalPayment);
    }
    setStorageItem('sikos_payments', list);

    // If payment status is late/pending, we may trigger room status to overdue
    if (finalPayment.status === 'late') {
      const tenants = getStorageItem('sikos_tenants', DEFAULT_TENANTS);
      const rooms = getStorageItem('sikos_rooms', DEFAULT_ROOMS);
      const tenant = tenants.find(t => t.id === finalPayment.tenant_id);
      if (tenant && tenant.room_id) {
        const roomIdx = rooms.findIndex(r => r.id === tenant.room_id);
        if (roomIdx >= 0) {
          rooms[roomIdx].status = 'overdue';
          setStorageItem('sikos_rooms', rooms);
        }
      }
    } else if (finalPayment.status === 'paid') {
      const tenants = getStorageItem('sikos_tenants', DEFAULT_TENANTS);
      const rooms = getStorageItem('sikos_rooms', DEFAULT_ROOMS);
      const tenant = tenants.find(t => t.id === finalPayment.tenant_id);
      if (tenant && tenant.room_id) {
        const roomIdx = rooms.findIndex(r => r.id === tenant.room_id);
        if (roomIdx >= 0) {
          // Reset to occupied since they paid
          rooms[roomIdx].status = 'occupied';
          setStorageItem('sikos_rooms', rooms);
        }
      }
    }

    return finalPayment;
  },
  deletePayment: async (id: string): Promise<boolean> => {
    const list = getStorageItem('sikos_payments', DEFAULT_PAYMENTS);
    const updated = list.filter(p => p.id !== id);
    setStorageItem('sikos_payments', updated);
    return true;
  },

  // Auth operations
  login: async (email: string): Promise<{ user: Profile | null; error: string | null }> => {
    const profiles = getStorageItem('sikos_profiles', DEFAULT_PROFILES);
    const user = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sikos_session', JSON.stringify(user));
      }
      return { user, error: null };
    }
    return { user: null, error: 'User profile not found. Try owner@sikos.com or admin@sikos.com' };
  },
  getCurrentUser: (): Profile | null => {
    if (typeof window === 'undefined') return null;
    const session = localStorage.getItem('sikos_session');
    if (!session) return null;
    try {
      return JSON.parse(session);
    } catch {
      return null;
    }
  },
  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sikos_session');
    }
  },
  resetDemoData: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sikos_profiles', JSON.stringify(DEFAULT_PROFILES));
      localStorage.setItem('sikos_rooms', JSON.stringify(DEFAULT_ROOMS));
      localStorage.setItem('sikos_tenants', JSON.stringify(DEFAULT_TENANTS));
      localStorage.setItem('sikos_payments', JSON.stringify(DEFAULT_PAYMENTS));
    }
  }
};
