import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import type { UserRole, UserProfile } from '../types';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  /**
   * Initialize auth state - check for existing session
   */
  async initialize() {
    const { setLoading, setUser, setProfile, setSession, setInitialized } = useAuthStore.getState();

    try {
      console.log('🔐 Starting auth initialization...');
      setLoading(true);

      // Get current session
      console.log('🔐 Checking for existing session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('🔐 Session error:', sessionError);
        throw sessionError;
      }

      if (session) {
        console.log('🔐 Session found, fetching profile...');
        setSession(session);
        setUser(session.user);

        // Fetch user profile
        const profile = await this.fetchProfile(session.user.id);
        console.log('🔐 Profile fetched:', profile);
        setProfile(profile);
      } else {
        console.log('🔐 No session found');
      }

      console.log('🔐 Auth initialization complete');
      setInitialized(true);
    } catch (error) {
      console.error('🔐 Error initializing auth:', error);
      // Still mark as initialized even if there's an error
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  },

  /**
   * Sign up a new user
   */
  async signUp(data: SignUpData): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: data.role,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from sign up');

      // 2. Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: data.email,
        name: data.name,
        role: data.role,
        phone: data.phone,
        license_status: data.role === 'nurse' ? 'unverified' : undefined,
        host_verification_status: data.role === 'host' ? 'unverified' : undefined,
      });

      if (profileError) throw profileError;

      // 3. Update store
      const { setUser, setSession } = useAuthStore.getState();
      setUser(authData.user);
      if (authData.session) {
        setSession(authData.session);
      }

      // 4. Fetch and set profile
      const profile = await this.fetchProfile(authData.user.id);
      useAuthStore.getState().setProfile(profile);

      return { success: true };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign up. Please try again.',
      };
    }
  },

  /**
   * Sign in existing user
   */
  async signIn(data: SignInData): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from sign in');

      // Update store
      const { setUser, setSession, setProfile } = useAuthStore.getState();
      setUser(authData.user);
      setSession(authData.session);

      // Fetch profile
      const profile = await this.fetchProfile(authData.user.id);
      setProfile(profile);

      return { success: true };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign in. Please check your credentials.',
      };
    }
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Reset store
      useAuthStore.getState().reset();

      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign out.',
      };
    }
  },

  /**
   * Fetch user profile from database
   */
  async fetchProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log('🔐 Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('🔐 Profile fetch error:', error);
        throw error;
      }

      console.log('🔐 Profile data:', data);
      return data as UserProfile;
    } catch (error) {
      console.error('🔐 Error fetching profile:', error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      // Refresh profile in store
      const profile = await this.fetchProfile(userId);
      useAuthStore.getState().setProfile(profile);

      return { success: true };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update profile.',
      };
    }
  },

  /**
   * Upload avatar image
   */
  async uploadAvatar(
    userId: string,
    file: File
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Upload to storage
      const fileName = `${userId}/${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

      // Update profile with new avatar URL
      await this.updateProfile(userId, { avatarUrl: urlData.publicUrl });

      return { success: true, url: urlData.publicUrl };
    } catch (error: any) {
      console.error('Upload avatar error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload avatar.',
      };
    }
  },

  /**
   * Set up auth state change listener
   */
  setupAuthListener() {
    const { setUser, setSession, setProfile, reset } = useAuthStore.getState();

    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (session) {
        setSession(session);
        setUser(session.user);

        // Fetch profile
        const profile = await this.fetchProfile(session.user.id);
        setProfile(profile);
      } else {
        reset();
      }
    });
  },
};
