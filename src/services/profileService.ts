import { supabase } from '../lib/supabaseClient'
import type { UserProfile, UserRole } from '../types'

export interface UpdateProfileInput {
  name?: string
  phone?: string
  bio?: string
  specialties?: string[]
  preferredCities?: string[]
  licenseNumber?: string
  licenseState?: string
  showEmail?: boolean
  showPhone?: boolean
  allowMessages?: boolean
}

export const profileService = {
  /**
   * Get user's own profile
   */
  async getMyProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    if (!data) return null

    return {
      id: data.id,
      role: data.role as UserRole,
      name: data.name,
      email: data.email,
      phone: data.phone,
      bio: data.bio,
      avatarUrl: data.avatar_url,
      specialties: data.specialties,
      preferredCities: data.preferred_cities,
      licenseStatus: data.license_status,
      hostVerificationStatus: data.host_verification_status,
      createdAt: data.created_at,
      lastActiveAt: data.last_active_at,
    }
  },

  /**
   * Get public profile by ID
   */
  async getPublicProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profile_public')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    if (!data) return null

    return {
      id: data.id,
      role: data.role as UserRole,
      name: data.name,
      email: data.email,
      phone: data.phone,
      bio: data.bio,
      avatarUrl: data.avatar_url,
      specialties: data.specialties,
      licenseStatus: data.license_status,
      hostVerificationStatus: data.host_verification_status,
      createdAt: data.created_at,
      lastActiveAt: data.last_active_at,
    }
  },

  /**
   * Update profile
   */
  async updateProfile(updates: UpdateProfileInput): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const updateData: any = {}

    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.phone !== undefined) updateData.phone = updates.phone
    if (updates.bio !== undefined) updateData.bio = updates.bio
    if (updates.specialties !== undefined) updateData.specialties = updates.specialties
    if (updates.preferredCities !== undefined) updateData.preferred_cities = updates.preferredCities
    if (updates.licenseNumber !== undefined) updateData.license_number = updates.licenseNumber
    if (updates.licenseState !== undefined) updateData.license_state = updates.licenseState
    if (updates.showEmail !== undefined) updateData.show_email = updates.showEmail
    if (updates.showPhone !== undefined) updateData.show_phone = updates.showPhone
    if (updates.allowMessages !== undefined) updateData.allow_messages = updates.allowMessages

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (error) throw error
  },

  /**
   * Upload avatar
   */
  async uploadAvatar(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image must be less than 5MB')
    }

    // Upload to storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) throw updateError

    return publicUrl
  },

  /**
   * Delete avatar
   */
  async deleteAvatar(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get current avatar URL to extract file path
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (profile?.avatar_url) {
      // Extract file path from URL
      const fileName = `${user.id}/avatar.${profile.avatar_url.split('.').pop()}`

      // Delete from storage
      await supabase.storage
        .from('avatars')
        .remove([fileName])
    }

    // Update profile to remove avatar URL
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id)

    if (error) throw error
  },

  /**
   * Update last active timestamp
   */
  async updateLastActive(): Promise<void> {
    await supabase.rpc('update_last_active')
  },

  /**
   * Complete onboarding
   */
  async completeOnboarding(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id)

    if (error) throw error
  },

  /**
   * Switch role
   */
  async switchRole(newRole: UserRole): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', user.id)

    if (error) throw error
  },
}
