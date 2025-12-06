// providers/ContactsProvider.js
import React, { createContext, useContext, useState, useCallback } from 'react'
import { auth } from '../firebase/setUpFirebase'
import useAuthedRequest from '../hooks/useAuthedRequest'
import { useUser } from '../hooks/useUser'

// ==============================
// CONTEXT
// ==============================
const ContactsContext = createContext(null)

const API_URL = process.env.EXPO_PUBLIC_API_URL

// ==============================
// CUSTOM HOOK
// ==============================
export const useContacts = () => {
  const context = useContext(ContactsContext)
  if (!context) {
    throw new Error('useContacts must be used within ContactsProvider')
  }
  return context
}

// ==============================
// PROVIDER COMPONENT
// ==============================
export const ContactsProvider = ({ children }) => {
  const { isReady: isAuthReady, get, post, put, del } = useAuthedRequest()

  const { user } = useUser()

  // State
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [isRemovingContact, setIsRemovingContact] = useState(false)

  // ==============================
  // HELPER FUNCTIONS
  // ==============================
  const getCurrentUserId = useCallback(() => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      console.error('❌ [Contacts] No authenticated user')
      return null
    }
    return currentUser.uid
  }, [])

  // ==============================
  // LOAD CONTACTS
  // ==============================
  const loadContacts = useCallback(async () => {
    if (!isAuthReady) {
      console.log('⏳ [Contacts] Waiting for auth to be ready...')
      return
    }

    setLoading(true)
    try {
      console.log('📥 [Contacts] Loading contacts...')

      const data = await get(`${API_URL}/contacts`)

      if (data.success) {
        console.log(
          '✅ [Contacts] Contacts loaded:',
          data.contacts?.length || 0
        )
        setContacts(data.contacts || [])
      } else {
        console.error('❌ [Contacts] Failed to load contacts:', data.error)
      }
    } catch (error) {
      console.error('❌ [Contacts] Error loading contacts:', error.message)
    } finally {
      setLoading(false)
    }
  }, [isAuthReady, get])

  // ==============================
  // ADD CONTACT
  // ==============================
  const addContact = useCallback(
    async ({ phoneNumber, email, name }) => {
      if (!isAuthReady) {
        throw new Error('Authentication not ready')
      }

      setIsAddingContact(true)
      try {
        console.log('➕ [Contacts] Adding contact:', {
          phoneNumber,
          email,
          name,
        })

        if (!phoneNumber && !email) {
          throw new Error('Phone number or email is required')
        }

        const result = await post(`${API_URL}/contacts/add`, {
          phoneNumber,
          email,
          name,
        })

        if (!result.success) {
          if (result.userExists === false) {
            // User doesn't exist - return invite data
            return {
              success: false,
              userExists: false,
              inviteData: result.inviteData,
              message: result.message || 'User not found. Send an invite?',
            }
          } else if (result.error === 'Contact already exists') {
            return {
              success: false,
              userExists: true,
              error: 'Contact already exists',
              contact: result.contact,
            }
          } else if (result.error === 'Cannot add yourself as a contact') {
            throw new Error('You cannot add yourself as a contact')
          } else {
            throw new Error(result.error || 'Failed to add contact')
          }
        }

        // Contact added successfully
        console.log('✅ [Contacts] Contact added successfully')

        // Add to local state
        setContacts((prevContacts) => [...prevContacts, result.contact])

        return {
          success: true,
          userExists: true,
          contact: result.contact,
          message: 'Contact added successfully',
        }
      } catch (error) {
        console.error('❌ [Contacts] Error adding contact:', error)
        throw error
      } finally {
        setIsAddingContact(false)
      }
    },
    [isAuthReady, post]
  )

  // ==============================
  // REMOVE CONTACT
  // ==============================
  const removeContact = useCallback(
    async (contactId) => {
      if (!isAuthReady) {
        throw new Error('Authentication not ready')
      }

      setIsRemovingContact(true)
      try {
        console.log('🗑️ [Contacts] Removing contact:', contactId)

        const result = await del(`${API_URL}/contacts/${contactId}`)

        if (!result.success) {
          throw new Error(result.error || 'Failed to remove contact')
        }

        // Remove from local state
        setContacts((prevContacts) =>
          prevContacts.filter((contact) => contact.contactUserId !== contactId)
        )

        console.log('✅ [Contacts] Contact removed successfully')

        return {
          success: true,
          message: 'Contact removed successfully',
        }
      } catch (error) {
        console.error('❌ [Contacts] Error removing contact:', error)
        throw error
      } finally {
        setIsRemovingContact(false)
      }
    },
    [isAuthReady, del]
  )

  // ==============================
  // SEARCH USERS
  // ==============================
  const searchUsers = useCallback(
    async (query) => {
      if (!isAuthReady) {
        throw new Error('Authentication not ready')
      }

      if (!query || query.length < 2) {
        return { success: true, users: [] }
      }

      try {
        console.log('🔍 [Contacts] Searching users for:', query)

        const result = await post(`${API_URL}/contacts/search`, { query })

        if (!result.success) {
          throw new Error(result.error || 'Failed to search users')
        }

        return {
          success: true,
          users: result.users || [],
        }
      } catch (error) {
        console.error('❌ [Contacts] Error searching users:', error)
        throw error
      }
    },
    [isAuthReady, post]
  )

  // ==============================
  // TOGGLE FAVORITE
  // ==============================
  const toggleFavorite = useCallback(
    async (contactId) => {
      if (!isAuthReady) {
        throw new Error('Authentication not ready')
      }

      try {
        console.log('⭐ [Contacts] Toggling favorite for:', contactId)

        const result = await put(`${API_URL}/contacts/${contactId}/favorite`)

        if (!result.success) {
          throw new Error(result.error || 'Failed to toggle favorite')
        }

        // Update local state
        setContacts((prevContacts) =>
          prevContacts.map((contact) =>
            contact.contactUserId === contactId
              ? { ...contact, favorite: result.favorite }
              : contact
          )
        )

        console.log('✅ [Contacts] Favorite toggled:', result.favorite)

        return {
          success: true,
          favorite: result.favorite,
        }
      } catch (error) {
        console.error('❌ [Contacts] Error toggling favorite:', error)
        throw error
      }
    },
    [isAuthReady, put]
  )

  // ==============================
  // GET CONTACT BY ID
  // ==============================
  const getContactById = useCallback(
    (contactId) => {
      return contacts.find((contact) => contact.contactUserId === contactId)
    },
    [contacts]
  )

  // ==============================
  // SEND INVITE
  // ==============================
  const sendInvite = useCallback(async (inviteData) => {
    // This is where you'd integrate with your invite service
    // For now, we'll return a mock response
    console.log('📧 [Contacts] Sending invite:', inviteData)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      success: true,
      message: `Invite sent to ${inviteData.name || 'Friend'} at ${
        inviteData.phoneNumber || inviteData.email
      }`,
    }
  }, [])

  // ==============================
  // INITIAL LOAD
  // ==============================
  React.useEffect(() => {
    if (isAuthReady) {
      loadContacts()
    }
  }, [isAuthReady, loadContacts])

  // ==============================
  // CONTEXT VALUE
  // ==============================
  const contextValue = {
    // State
    contacts,
    loading,
    isAddingContact,
    isRemovingContact,

    // Methods
    loadContacts,
    addContact,
    removeContact,
    searchUsers,
    toggleFavorite,
    getContactById,
    sendInvite,

    // Convenience getters
    favoriteContacts: contacts.filter((contact) => contact.favorite),
    regularContacts: contacts.filter((contact) => !contact.favorite),
    onlineContacts: contacts.filter(
      (contact) => contact.userDetails?.online === true
    ),
    offlineContacts: contacts.filter(
      (contact) => contact.userDetails?.online !== true
    ),
  }

  return (
    <ContactsContext.Provider value={contextValue}>
      {children}
    </ContactsContext.Provider>
  )
}

export default ContactsProvider
