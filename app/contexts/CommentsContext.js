import { createContext } from 'react'

const CommentsContext = createContext({
  comments: {},
  loading: {},
  sending: false,
  wsConnected: false,

  loadComments: async () => {},
  createComment: async () => {},
  updateComment: async () => {},
  deleteComment: async () => {},
  toggleLike: async () => {},

  getCommentsForPost: () => [],
  getCommentCount: () => 0,
  isLoadingComments: () => false,
})

export default CommentsContext
