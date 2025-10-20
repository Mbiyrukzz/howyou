import React, { useEffect, useState, useCallback } from 'react'
import ContactsContext from '../contexts/ContactsContext'
import useAuthedRequest from '../hooks/useAuthedRequest'

const API_URL = 'http://10.38.189.87:5000'

const ContactsProvider = ({ children }) => {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const { isReady, get } = useAuthedRequest()

  const loadContacts = useCallback(async () => {
    if (!isReady) return
    try {
      setLoading(true)
      const data = await get(`${API_URL}/list-contacts`)
      if (data.success) setContacts(data.contacts)
    } catch (error) {
      console.error('❌ Failed to load contacts:', error)
    } finally {
      setLoading(false)
    }
  }, [get, isReady])

  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  return (
    <ContactsContext.Provider
      value={{ contacts, loading, reloadContacts: loadContacts }}
    >
      {children}
    </ContactsContext.Provider>
  )
}

export default ContactsProvider
