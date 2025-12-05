// providers/UserProfileProvider.js
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'
import { Platform } from 'react-native'
import { auth } from '../firebase/setUpFirebase'
import { updateEmail as firebaseUpdateEmail } from 'firebase/auth'
import useAuthedRequest from '../hooks/useAuthedRequest'

// ==============================
// CONTEXT
// ==============================
const UserProfileContext = createContext(null)

// ==============================
// CUSTOM HOOK
// ==============================
export const useUserProfile = () => {
  const context = useContext(UserProfileContext)
  if (!context) {
    throw new Error('useUserProfile must be used within UserProfileProvider')
  }
  return context
}

// ==============================
// PROVIDER COMPONENT
// ==============================
export const UserProfileProvider = ({ children }) => {
  // Use authenticated request hook
  const { isReady: isAuthReady, get, put, del } = useAuthedRequest()

  // State
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  // ==============================
  // HELPER FUNCTIONS
  // ==============================
  const getCurrentUserId = useCallback(() => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      console.error('❌ [UserProfile] No authenticated user')
      return null
    }
    return currentUser.uid
  }, [])

  const getExtensionFromMimeType = (mimeType) => {
    const mimeToExt = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/bmp': 'bmp',
      'image/heic': 'heic',
      'image/heif': 'heif',
    }
    return mimeToExt[mimeType] || 'jpg'
  }

  // ==============================
  // FETCH USER PROFILE
  // ==============================
  const fetchUserProfile = useCallback(
    async (forceRefresh = false) => {
      const userId = getCurrentUserId()
      if (!userId) {
        console.log('⏳ [UserProfile] No authenticated user')
        setIsInitializing(false)
        return
      }

      if (!isAuthReady) {
        console.log('⏳ [UserProfile] Waiting for auth to be ready...')
        return
      }

      try {
        console.log('📥 [UserProfile] Fetching user profile for:', userId)

        if (forceRefresh && auth.currentUser) {
          await auth.currentUser.getIdToken(true)
        }

        const data = await get(
          `http://10.156.197.87:5000/users/${userId}/profile`
        )

        if (data.success) {
          console.log('✅ [UserProfile] User profile loaded:', {
            name: data.user.name,
            email: data.user.email,
            hasProfilePicture: !!data.user.profilePicture,
          })
          setUser(data.user)
        } else {
          console.error('❌ [UserProfile] Failed to load profile:', data.error)
        }
      } catch (error) {
        console.error(
          '❌ [UserProfile] Error fetching user profile:',
          error.message
        )
      } finally {
        setIsInitializing(false)
      }
    },
    [isAuthReady, get, getCurrentUserId]
  )

  // ==============================
  // UPDATE PROFILE (NAME & EMAIL)
  // ==============================
  const updateProfile = useCallback(
    async ({ name, email }) => {
      const userId = getCurrentUserId()
      if (!userId) {
        throw new Error('No authenticated user')
      }

      setIsLoading(true)
      try {
        console.log('📝 [UserProfile] Updating profile for:', userId, {
          name,
          email,
        })

        const updateData = {}
        if (name && name.trim()) updateData.name = name.trim()
        if (email && email.trim()) updateData.email = email.trim().toLowerCase()

        if (Object.keys(updateData).length === 0) {
          throw new Error('At least one field (name or email) is required')
        }

        const result = await put(
          `http://10.156.197.87:5000/users/${userId}/profile`,
          updateData
        )

        if (!result.success) {
          throw new Error(result.error || 'Failed to update profile')
        }

        const currentUser = auth.currentUser
        if (email && email !== user?.email && currentUser) {
          try {
            await firebaseUpdateEmail(currentUser, email.trim().toLowerCase())
            console.log('✅ [UserProfile] Firebase email updated')
          } catch (firebaseError) {
            console.error(
              '❌ [UserProfile] Firebase email update failed:',
              firebaseError
            )
          }
        }

        setUser((prev) => ({
          ...prev,
          ...result.user,
        }))

        console.log('✅ [UserProfile] Profile updated successfully')

        return { success: true, user: result.user }
      } catch (error) {
        console.error('❌ [UserProfile] Profile update error:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [user?.email, put, getCurrentUserId]
  )

  // ==============================
  // UPDATE PROFILE PICTURE
  // ==============================
  const updateProfilePicture = useCallback(
    async (imageFile) => {
      const userId = getCurrentUserId()
      if (!userId) throw new Error('No authenticated user')

      setIsLoading(true)
      try {
        console.log('📸 [UserProfile] Starting profile picture update')
        console.log('📸 Image details:', {
          uri: imageFile.uri?.substring(0, 60),
          type: imageFile.type || imageFile.mimeType,
          name: imageFile.name,
        })

        // Get auth token (same as posts)
        const token = await auth.currentUser?.getIdToken()
        if (!token) throw new Error('No auth token available')

        const formData = new FormData()
        const timestamp = Date.now()
        const mimeType = imageFile.mimeType || imageFile.type || 'image/jpeg'
        const extension = getExtensionFromMimeType(mimeType)
        const filename = `profile_${timestamp}.${extension}`

        const isWeb =
          Platform.OS === 'web' || imageFile.uri?.startsWith('blob:')

        if (isWeb) {
          console.log('🌐 Web profile picture upload')
          // Web: Convert blob to file
          const response = await fetch(imageFile.uri)
          const blob = await response.blob()
          const file = new File([blob], filename, { type: mimeType })
          formData.append('file', file)
          console.log('Added file to FormData:', { filename, type: mimeType })
        } else {
          console.log('📱 Mobile profile picture upload')
          // Mobile: Clean URI for iOS
          let cleanUri = imageFile.uri
          if (Platform.OS === 'ios' && cleanUri.startsWith('file://')) {
            cleanUri = cleanUri.replace('file://', '')
          }

          formData.append('file', {
            uri: cleanUri,
            name: filename,
            type: mimeType,
          })
          console.log('Added mobile file:', { cleanUri, filename, mimeType })
        }

        console.log(
          '📤 Uploading to:',
          `http://10.156.197.87:5000/users/${userId}/profile-picture`
        )

        // Use fetch instead of put() - SAME AS POSTS
        const response = await fetch(
          `http://10.156.197.87:5000/users/${userId}/profile-picture`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              // Don't set Content-Type - let FormData set it with boundary
            },
            body: formData,
          }
        )

        console.log('📡 Response status:', response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Error response:', errorText)

          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: `HTTP ${response.status}: ${errorText}` }
          }

          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to update profile picture')
        }

        console.log('✅ [UserProfile] Profile picture updated successfully')
        setUser((prev) => ({ ...prev, ...result.user }))
        return { success: true, user: result.user }
      } catch (error) {
        console.error('❌ [UserProfile] Profile picture update error:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [getCurrentUserId]
  )
  // ==============================
  // DELETE PROFILE PICTURE
  // ==============================
  const deleteProfilePicture = useCallback(async () => {
    const userId = getCurrentUserId()
    if (!userId) {
      throw new Error('No authenticated user')
    }

    setIsLoading(true)
    try {
      console.log('🗑️ [UserProfile] Deleting profile picture for:', userId)

      const result = await del(
        `http://10.156.197.87:5000/users/${userId}/profile-picture`
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete profile picture')
      }

      setUser((prev) => ({
        ...prev,
        ...result.user,
        profilePicture: null,
      }))

      console.log('✅ [UserProfile] Profile picture deleted successfully')

      return { success: true, user: result.user }
    } catch (error) {
      console.error('❌ [UserProfile] Profile picture deletion error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [del, getCurrentUserId])

  // ==============================
  // CHANGE PASSWORD
  // ==============================
  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      const userId = getCurrentUserId()
      if (!userId) {
        throw new Error('No authenticated user')
      }

      if (!currentPassword || !newPassword) {
        throw new Error('Both current and new password are required')
      }

      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long')
      }

      setIsLoading(true)
      try {
        console.log('🔐 [UserProfile] Changing password for:', userId)

        const result = await put(
          `http://10.156.197.87:5000/users/${userId}/password`,
          {
            currentPassword,
            newPassword,
          }
        )

        if (!result.success) {
          throw new Error(result.error || 'Failed to change password')
        }

        console.log('✅ [UserProfile] Password changed successfully')

        if (result.user) {
          setUser((prev) => ({
            ...prev,
            ...result.user,
          }))
        }

        return { success: true, message: 'Password changed successfully' }
      } catch (error) {
        console.error('❌ [UserProfile] Password change error:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [put, getCurrentUserId]
  )

  // ==============================
  // REFRESH PROFILE
  // ==============================
  const refreshProfile = useCallback(async () => {
    console.log('🔄 [UserProfile] Refreshing user profile...')
    return fetchUserProfile(true)
  }, [fetchUserProfile])

  // ==============================
  // INITIAL LOAD
  // ==============================
  useEffect(() => {
    if (isAuthReady) {
      fetchUserProfile()
    }
  }, [isAuthReady, fetchUserProfile])

  // ==============================
  // CONTEXT VALUE
  // ==============================
  const contextValue = {
    // State
    user,
    isLoading,
    isInitializing,

    // Methods
    updateProfile,
    updateProfilePicture,
    deleteProfilePicture,
    changePassword,
    refreshProfile,
    fetchUserProfile,
  }

  return (
    <UserProfileContext.Provider value={contextValue}>
      {children}
    </UserProfileContext.Provider>
  )
}

export default UserProfileProvider
