import { createClient } from '@supabase/supabase-js';
import { mockDb, Room, Tenant, Payment, Profile } from './mockData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Detect if we should run in demo mode (missing or default placeholder keys)
export const isDemoMode =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes('your-supabase-project') ||
  supabaseAnonKey.includes('your-supabase-anon-key');

// Initialize the real Supabase client only if not in demo mode
export const supabase = !isDemoMode ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Export tables CRUD mapped dynamically to Supabase or local mock
export const db = {
  isDemo: () => isDemoMode,

  auth: {
    login: async (email: string): Promise<{ user: Profile | null; error: string | null }> => {
      if (isDemoMode) {
        return mockDb.login(email);
      }
      try {
        // Sign in using Supabase OTP or password or simply fetch user metadata
        // For a simple Boarding House management app, we will support signing in using Supabase password auth
        // or a simulated flow. Let's do standard Supabase Auth signInWithPassword:
        const { data, error } = await supabase!.auth.signInWithPassword({
          email,
          password: 'password123' // default password for testing, or we can use magic link/password
        });
        
        if (error) {
          // If password auth is not set up, let's try to fetch user details to see if user exists,
          // or return the error.
          return { user: null, error: error.message };
        }

        if (data.user) {
          // Fetch user profile from the profiles table
          const { data: profile, error: pError } = await supabase!
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (pError || !profile) {
            return {
              user: {
                id: data.user.id,
                name: data.user.user_metadata?.name || 'Supabase User',
                email: data.user.email || email,
                role: (data.user.user_metadata?.role as 'owner' | 'admin') || 'admin',
                created_at: data.user.created_at
              },
              error: null
            };
          }
          return { user: profile as Profile, error: null };
        }
        return { user: null, error: 'Auth failed' };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Connection error';
        return { user: null, error: errorMsg };
      }
    },

    getCurrentUser: async (): Promise<Profile | null> => {
      if (isDemoMode) {
        return mockDb.getCurrentUser();
      }
      try {
        const { data: { user } } = await supabase!.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase!
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) return profile as Profile;

        return {
          id: user.id,
          name: user.user_metadata?.name || 'Supabase User',
          email: user.email || '',
          role: (user.user_metadata?.role as 'owner' | 'admin') || 'admin',
          created_at: user.created_at
        };
      } catch {
        return null;
      }
    },

    logout: async (): Promise<void> => {
      if (isDemoMode) {
        return mockDb.logout();
      }
      await supabase!.auth.signOut();
    }
  },

  rooms: {
    list: async (): Promise<Room[]> => {
      if (isDemoMode) return mockDb.getRooms();
      const { data, error } = await supabase!
        .from('rooms')
        .select('*')
        .order('room_number', { ascending: true });
      if (error) throw error;
      return data as Room[];
    },
    upsert: async (room: Omit<Room, 'id' | 'created_at'> & { id?: string }): Promise<Room> => {
      if (isDemoMode) return mockDb.saveRoom(room);
      const isNew = !room.id;
      const payload = {
        room_number: room.room_number,
        status: room.status,
        type: room.type,
        daily_rent: Number(room.daily_rent),
        monthly_rent: Number(room.monthly_rent),
        description: room.description
      };
      
      let res;
      if (isNew) {
        res = await supabase!.from('rooms').insert([payload]).select().single();
      } else {
        res = await supabase!.from('rooms').update(payload).eq('id', room.id).select().single();
      }
      if (res.error) throw res.error;
      return res.data as Room;
    },
    delete: async (id: string): Promise<boolean> => {
      if (isDemoMode) return mockDb.deleteRoom(id);
      const { error } = await supabase!.from('rooms').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  tenants: {
    list: async (): Promise<Tenant[]> => {
      if (isDemoMode) return mockDb.getTenants();
      // Let's do a join to fetch room_number
      const { data, error } = await supabase!
        .from('tenants')
        .select('*, rooms(room_number)')
        .order('name', { ascending: true });
      if (error) throw error;
      
      interface TenantRow {
        id: string;
        name: string;
        email: string | null;
        phone: string;
        room_id: string | null;
        check_in_date: string;
        check_out_date: string | null;
        status: 'active' | 'inactive';
        created_at: string;
        rooms?: { room_number: string } | { room_number: string }[] | null;
      }
      
      return ((data as unknown as TenantRow[]) || []).map((t) => {
        const room = t.rooms ? (Array.isArray(t.rooms) ? t.rooms[0] : t.rooms) : null;
        return {
          ...t,
          room_number: room ? room.room_number : undefined
        };
      }) as Tenant[];
    },
    upsert: async (tenant: Omit<Tenant, 'id' | 'created_at'> & { id?: string }): Promise<Tenant> => {
      if (isDemoMode) return mockDb.saveTenant(tenant);
      const isNew = !tenant.id;
      const payload = {
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        room_id: tenant.room_id,
        check_in_date: tenant.check_in_date,
        check_out_date: tenant.check_out_date,
        status: tenant.status
      };

      // In Supabase, if room is linked and tenant is active, we should update the room status as well.
      // This logic can be driven client-side or database trigger. We'll do it client-side here.
      if (tenant.room_id && tenant.status === 'active') {
        await supabase!.from('rooms').update({ status: 'occupied' }).eq('id', tenant.room_id);
      } else if (tenant.room_id && tenant.status === 'inactive') {
        await supabase!.from('rooms').update({ status: 'empty' }).eq('id', tenant.room_id);
      }

      let res;
      if (isNew) {
        res = await supabase!.from('tenants').insert([payload]).select().single();
      } else {
        // If room changed, free old room in real DB
        const { data: oldTenant } = await supabase!.from('tenants').select('room_id').eq('id', tenant.id).single();
        if (oldTenant && oldTenant.room_id && oldTenant.room_id !== tenant.room_id) {
          await supabase!.from('rooms').update({ status: 'empty' }).eq('id', oldTenant.room_id);
        }
        res = await supabase!.from('tenants').update(payload).eq('id', tenant.id).select().single();
      }
      if (res.error) throw res.error;
      return res.data as Tenant;
    },
    delete: async (id: string): Promise<boolean> => {
      if (isDemoMode) return mockDb.deleteTenant(id);
      
      // Free the room first
      const { data: tenant } = await supabase!.from('tenants').select('room_id').eq('id', id).single();
      if (tenant && tenant.room_id) {
        await supabase!.from('rooms').update({ status: 'empty' }).eq('id', tenant.room_id);
      }

      const { error } = await supabase!.from('tenants').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  payments: {
    list: async (): Promise<Payment[]> => {
      if (isDemoMode) return mockDb.getPayments();
      // Join tenant name and room number
      const { data, error } = await supabase!
        .from('payments')
        .select('*, tenants(*, rooms(*))')
        .order('payment_date', { ascending: false });
      if (error) throw error;

      interface PaymentRow {
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
        tenants?: {
          name: string;
          rooms?: {
            room_number: string;
          } | {
            room_number: string;
          }[] | null;
        } | {
          name: string;
          rooms?: {
            room_number: string;
          } | {
            room_number: string;
          }[] | null;
        }[] | null;
      }

      return ((data as unknown as PaymentRow[]) || []).map((p) => {
        const tenant = p.tenants ? (Array.isArray(p.tenants) ? p.tenants[0] : p.tenants) : null;
        const room = tenant && tenant.rooms ? (Array.isArray(tenant.rooms) ? tenant.rooms[0] : tenant.rooms) : null;
        return {
          ...p,
          tenant_name: tenant ? tenant.name : 'Unknown Tenant',
          room_number: room ? room.room_number : 'N/A'
        };
      }) as Payment[];
    },
    upsert: async (payment: Omit<Payment, 'id' | 'created_at'> & { id?: string }): Promise<Payment> => {
      if (isDemoMode) return mockDb.savePayment(payment);
      const isNew = !payment.id;
      const payload = {
        tenant_id: payment.tenant_id,
        amount: Number(payment.amount),
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        status: payment.status,
        billing_period_start: payment.billing_period_start,
        billing_period_end: payment.billing_period_end,
        proof_url: payment.proof_url,
        notes: payment.notes
      };

      // Update room status client-side based on payment status
      if (payment.status === 'late') {
        const { data: tenant } = await supabase!.from('tenants').select('room_id').eq('id', payment.tenant_id).single();
        if (tenant && tenant.room_id) {
          await supabase!.from('rooms').update({ status: 'overdue' }).eq('id', tenant.room_id);
        }
      } else if (payment.status === 'paid') {
        const { data: tenant } = await supabase!.from('tenants').select('room_id').eq('id', payment.tenant_id).single();
        if (tenant && tenant.room_id) {
          await supabase!.from('rooms').update({ status: 'occupied' }).eq('id', tenant.room_id);
        }
      }

      let res;
      if (isNew) {
        res = await supabase!.from('payments').insert([payload]).select().single();
      } else {
        res = await supabase!.from('payments').update(payload).eq('id', payment.id).select().single();
      }
      if (res.error) throw res.error;
      return res.data as Payment;
    },
    delete: async (id: string): Promise<boolean> => {
      if (isDemoMode) return mockDb.deletePayment(id);
      const { error } = await supabase!.from('payments').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  profiles: {
    list: async (): Promise<Profile[]> => {
      if (isDemoMode) return mockDb.getProfiles();
      const { data, error } = await supabase!
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Profile[];
    },
    upsert: async (profile: Profile): Promise<Profile> => {
      if (isDemoMode) return mockDb.saveProfile(profile);
      const { data, error } = await supabase!
        .from('profiles')
        .upsert(profile)
        .select()
        .single();
      if (error) throw error;
      return data as Profile;
    },
    delete: async (id: string): Promise<boolean> => {
      if (isDemoMode) return mockDb.deleteProfile(id);
      
      // Delete in profiles
      const { error } = await supabase!.from('profiles').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  }
};
