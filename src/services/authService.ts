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
      setLoading(true);

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (session) {
        setSession(session);
        setUser(session.user);

        // Fetch user profile
        const profile = await this.fetchProfile(session.user.id);
        setProfile(profile);
      }

      setInitialized(true);
    } catch (error) {
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
          emailRedirectTo: window.location.origin,
          data: {
            name: data.name,
            role: data.role,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from sign up');

      // 2. Check if email confirmation is required
      if (!authData.session) {
        // Email confirmation required - just return success
        // User will need to check their email and click the confirmation link
        return {
          success: true,
          error: 'Please check your email to confirm your account before signing in.'
        };
      }

      // 3. Session exists - set it and create profile
      await supabase.auth.setSession({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      });

      // 3. Create profile (using snake_case for database columns)
      console.log('Creating profile for user:', authData.user.id);
      const profileData: any = {
        id: authData.user.id,
        email: data.email,
        name: data.name,
        role: data.role,
      };

      if (data.phone) {
        profileData.phone = data.phone;
      }

      if (data.role === 'nurse') {
        profileData.license_status = 'unverified';
      }

      if (data.role === 'host') {
        profileData.host_verification_status = 'unverified';
      }

      const { error: profileError } = await supabase.from('profiles').insert(profileData);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      console.log('Profile created successfully');

      // 3. Update store
      const { setUser, setSession } = useAuthStore.getState();
      setUser(authData.user);
      if (authData.session) {
        setSession(authData.session);
      }

      // 4. Fetch and set profile with retry
      let profile = await this.fetchProfile(authData.user.id);

      // Retry if profile not found immediately
      if (!profile) {
        console.log('Profile not found, retrying...');
        await new Promise(resolve => setTimeout(resolve, 500));
        profile = await this.fetchProfile(authData.user.id);
      }

      if (!profile) {
        throw new Error('Failed to load profile after creation');
      }

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
      console.log('🔐 Step 1: Authenticating with Supabase...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        console.error('🔐 Auth error:', authError);
        throw authError;
      }
      if (!authData.user) throw new Error('No user returned from sign in');

      console.log('🔐 Step 2: User authenticated:', authData.user.id);
      console.log('🔐 User metadata:', authData.user.user_metadata);

      // Update store
      const { setUser, setSession, setProfile } = useAuthStore.getState();
      setUser(authData.user);
      setSession(authData.session);

      // Fetch profile - retry if it fails
      console.log('🔐 Step 3: Fetching profile...');
      let profile = await this.fetchProfile(authData.user.id);

      // If profile doesn't exist, wait a bit and try again (race condition with sign up)
      if (!profile) {
        console.log('🔐 Profile not found, retrying in 500ms...');
        await new Promise(resolve => setTimeout(resolve, 500));
        profile = await this.fetchProfile(authData.user.id);
      }

      // If still no profile, create it from user metadata (for email confirmation flow)
      if (!profile && authData.user.user_metadata) {
        const metadata = authData.user.user_metadata;
        console.log('🔐 Step 4: No profile found, checking metadata...');
        console.log('🔐 Metadata role:', metadata.role, 'name:', metadata.name);

        if (metadata.role && metadata.name) {
          console.log('🔐 Creating profile from metadata...');
          const profileData: any = {
            id: authData.user.id,
            email: authData.user.email!,
            name: metadata.name,
            role: metadata.role,
          };

          if (metadata.role === 'nurse') {
            profileData.license_status = 'unverified';
          }
          if (metadata.role === 'host') {
            profileData.host_verification_status = 'unverified';
          }

          const { error: createError } = await supabase.from('profiles').insert(profileData);
          if (createError) {
            console.error('🔐 Failed to create profile:', createError);
            throw new Error(`Failed to create profile: ${createError.message}`);
          }

          console.log('🔐 Profile created, fetching...');
          // Fetch the newly created profile
          profile = await this.fetchProfile(authData.user.id);
        } else {
          console.error('🔐 No role/name in metadata!');
        }
      }

      if (!profile) {
        console.error('🔐 FATAL: Profile not found after all attempts');
        throw new Error('Profile not found. Please try signing up again or contact support.');
      }

      console.log('🔐 Step 5: Setting profile in store:', profile.role);
      setProfile(profile);

      console.log('🔐 Sign in complete!');
      return { success: true };
    } catch (error: any) {
      console.error('🔐 Sign in error:', error);
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }

      if (!data) {
        console.error('No profile data returned for user:', userId);
        return null;
      }

      console.log('Profile fetched successfully:', data.role);

      // Transform snake_case database fields to camelCase TypeScript fields
      const profile: UserProfile = {
        id: data.id,
        role: data.role,
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        licenseStatus: data.license_status || undefined,
        hostVerificationStatus: data.host_verification_status || undefined,
        avatarUrl: data.avatar_url || undefined,
        specialties: data.specialties || undefined,
        preferredCities: data.preferred_cities || undefined,
        bio: data.bio || undefined,
      };

      return profile;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
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
      // Transform camelCase to snake_case for database
      const dbUpdates: any = {};

      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.licenseStatus !== undefined) dbUpdates.license_status = updates.licenseStatus;
      if (updates.hostVerificationStatus !== undefined) dbUpdates.host_verification_status = updates.hostVerificationStatus;
      if (updates.specialties !== undefined) dbUpdates.specialties = updates.specialties;
      if (updates.preferredCities !== undefined) dbUpdates.preferred_cities = updates.preferredCities;

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
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

    supabase.auth.onAuthStateChange(async (_event, session) => {
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
