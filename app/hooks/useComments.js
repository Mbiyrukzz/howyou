import { useContext } from 'react'
import CommentContext from '../contexts/CommentsContext'

export const useComments = () => {
  const context = useContext(CommentContext)

  if (!context) {
    throw new Error('useComments must be used within CommentsProvider')
  }

  return context
}
