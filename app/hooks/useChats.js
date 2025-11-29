import { useContext } from 'react'
import ChatsContext from '../contexts/ChatsContext'

export function useChats() {
  const context = useContext(ChatsContext)

  if (!context) {
    throw new Error('useChats must be used within a ChatsProvider')
  }

  return context
}
