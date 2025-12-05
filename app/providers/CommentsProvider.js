// providers/CommentsProvider.js - FIXED FILE UPLOADS
import React, { useEffect, useState, useCallback, useRef } from 'react'
import CommentsContext from '../contexts/CommentsContext'
import useAuthedRequest from '../hooks/useAuthedRequest'
import { useUser } from '../hooks/useUser'
import useWebSocket from '../hooks/useWebSocket'
import { Platform } from 'react-native'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.68.138.87:5000'

const CommentsProvider = ({ children }) => {
  const [comments, setComments] = useState({})
  const [loading, setLoading] = useState({})
  const [sending, setSending] = useState(false)

  const { isReady, get, post, put, del } = useAuthedRequest()
  const { user } = useUser()

  // Handle WebSocket messages for comments
  const handleWebSocketMessage = useCallback(
    (data) => {
      console.log('\n===== FRONTEND WEBSOCKET MESSAGE =====')
      console.log('📨 Received:', data.type)
      console.log('📦 Full data:', JSON.stringify(data, null, 2))
      console.log('🆔 My UID:', user?.uid)
      console.log('🆔 Sender ID:', data.senderId || data.userId)
      console.log('=======================================\n')

      switch (data.type) {
        case 'new-comment':
          handleNewComment(data)
          break

        case 'comment-updated':
          handleCommentUpdated(data)
          break

        case 'comment-deleted':
          handleCommentDeleted(data)
          break

        case 'comment-liked':
        case 'comment-unliked':
          handleCommentLikeUpdate(data)
          break

        default:
          console.warn('⚠️ Unknown comment message type:', data.type)
          break
      }
    },
    [user?.uid]
  )

  // Initialize WebSocket for posts endpoint
  const { isConnected: wsConnected, send: wsSend } = useWebSocket({
    userId: user?.uid,
    endpoint: '/comments',
    onMessage: handleWebSocketMessage,
    enabled: !!user?.uid && isReady,
  })

  const handleNewComment = useCallback(
    (data) => {
      const { comment, postId, senderId, userId } = data
      const actualSenderId = senderId || userId

      console.log('📥 Received new comment:', {
        comment,
        postId,
        senderId: actualSenderId,
        myUid: user?.uid,
        hasPostId: !!postId,
        currentCommentsForPost: comments[postId]?.length || 0,
      })

      if (!postId) {
        console.error('❌ No postId in new-comment message!')
        return
      }

      // Skip if it's our own comment (already added optimistically)
      if (actualSenderId === user?.uid) {
        console.log('⏭️ Skipping own comment (already in state)')
        return
      }

      setComments((prev) => {
        const postComments = prev[postId] || []
        const isDuplicate = postComments.some((c) => c._id === comment._id)

        if (isDuplicate) {
          console.log('⚠️ Duplicate comment detected, skipping')
          return prev
        }

        // If it's a reply, find the parent and add to its replies
        if (comment.parentId) {
          console.log('💬 Adding reply to parent:', comment.parentId)
          const updatedComments = addReplyToTree(postComments, comment)
          return { ...prev, [postId]: updatedComments }
        }

        // It's a top-level comment
        console.log('✅ Adding top-level comment')
        const newComments = [comment, ...postComments]

        return {
          ...prev,
          [postId]: newComments,
        }
      })
    },
    [user?.uid, comments]
  )

  const handleCommentUpdated = useCallback((data) => {
    const { commentId, postId, content } = data

    setComments((prev) => {
      const postComments = prev[postId] || []
      const updatedComments = updateCommentInTree(postComments, commentId, {
        content,
        updatedAt: new Date(),
      })

      return { ...prev, [postId]: updatedComments }
    })
  }, [])

  const handleCommentDeleted = useCallback((data) => {
    const { commentId, postId } = data

    setComments((prev) => {
      const postComments = prev[postId] || []
      const updatedComments = removeCommentFromTree(postComments, commentId)

      return { ...prev, [postId]: updatedComments }
    })
  }, [])

  const handleCommentLikeUpdate = useCallback((data) => {
    const { commentId, postId, newLikeCount } = data

    setComments((prev) => {
      const postComments = prev[postId] || []
      const updatedComments = updateCommentInTree(postComments, commentId, {
        likes: newLikeCount,
      })

      return { ...prev, [postId]: updatedComments }
    })
  }, [])

  // Tree manipulation helpers
  const addReplyToTree = (comments, reply) => {
    return comments.map((comment) => {
      if (comment._id === reply.parentId) {
        return {
          ...comment,
          replies: [reply, ...(comment.replies || [])],
        }
      }

      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: addReplyToTree(comment.replies, reply),
        }
      }

      return comment
    })
  }

  const updateCommentInTree = (comments, commentId, updates) => {
    return comments.map((comment) => {
      if (comment._id === commentId) {
        return { ...comment, ...updates }
      }

      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentInTree(comment.replies, commentId, updates),
        }
      }

      return comment
    })
  }

  const removeCommentFromTree = (comments, commentId) => {
    return comments
      .filter((comment) => comment._id !== commentId)
      .map((comment) => {
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: removeCommentFromTree(comment.replies, commentId),
          }
        }
        return comment
      })
  }

  // API Methods
  const loadComments = useCallback(
    async (postId, page = 1) => {
      if (!isReady || !postId) {
        console.warn('⚠️ loadComments called but not ready:', {
          isReady,
          postId,
        })
        return []
      }

      try {
        setLoading((prev) => ({ ...prev, [postId]: true }))

        console.log('📥 Loading comments for post:', postId)

        const data = await get(
          `${API_URL}/posts/${postId}/comments?page=${page}&limit=15`
        )

        console.log('✅ Comments loaded:', data)

        if (data.success) {
          setComments((prev) => ({
            ...prev,
            [postId]:
              page === 1
                ? data.comments
                : [...(prev[postId] || []), ...data.comments],
          }))

          return data.comments
        }

        return []
      } catch (error) {
        console.error('❌ Failed to load comments:', error)
        return []
      } finally {
        setLoading((prev) => ({ ...prev, [postId]: false }))
      }
    },
    [get, isReady]
  )

  const createComment = useCallback(
    async ({ postId, content, files = [], parentId = null }) => {
      console.log('📤 createComment called:', {
        postId,
        content,
        filesCount: files.length,
        parentId,
        files: files.map((f) => ({ uri: f.uri, name: f.name, type: f.type })),
      })

      if (!isReady || !user?.uid) {
        console.error('❌ Auth not ready:', { isReady, hasUser: !!user?.uid })
        return { success: false, error: 'Auth not ready' }
      }

      if (!content?.trim() && files.length === 0) {
        console.error('❌ No content or files')
        return { success: false, error: 'Comment must have content or files' }
      }

      try {
        setSending(true)

        let data

        if (files.length > 0) {
          console.log('📎 Creating comment with files...')

          // Get auth token
          const token = await user.getIdToken()

          // Create FormData
          const formData = new FormData()

          // Add content
          formData.append('content', content?.trim() || '')

          // Add parentId if exists (convert ObjectId to string)
          if (parentId) {
            const parentIdStr =
              typeof parentId === 'object' && parentId._id
                ? parentId._id
                : parentId
            formData.append('parentId', String(parentIdStr))
            console.log('📎 Parent ID being sent:', parentIdStr)
          }

          // Add files with proper React Native format
          for (let i = 0; i < files.length; i++) {
            const file = files[i]

            console.log('📎 Processing file:', {
              uri: file.uri,
              name: file.name,
              type: file.type,
            })

            // For React Native, we need to create a proper file object
            const fileToUpload = {
              uri:
                Platform.OS === 'ios'
                  ? file.uri.replace('file://', '')
                  : file.uri,
              name: file.name || `image_${Date.now()}_${i}.jpg`,
              type: file.type || 'image/jpeg',
            }

            console.log('📎 File to upload:', fileToUpload)

            formData.append('files', fileToUpload)
          }

          console.log(
            '📡 Sending FormData to:',
            `${API_URL}/posts/${postId}/comments`
          )

          // Make fetch request with FormData
          const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              // Don't set Content-Type - let the browser set it with boundary
            },
            body: formData,
          })

          console.log('📡 Response status:', response.status)

          if (!response.ok) {
            const errorText = await response.text()
            console.error('❌ API error response:', errorText)

            let errorData
            try {
              errorData = JSON.parse(errorText)
            } catch {
              errorData = { error: `HTTP ${response.status}: ${errorText}` }
            }

            throw new Error(errorData.error || `HTTP ${response.status}`)
          }

          data = await response.json()
          console.log('✅ Comment with files created:', data)
        } else {
          console.log('💬 Creating text-only comment...')

          // Text-only comment - use regular POST
          const payload = {
            content: content.trim(),
          }

          if (parentId) {
            const parentIdStr =
              typeof parentId === 'object' && parentId._id
                ? parentId._id
                : parentId
            payload.parentId = String(parentIdStr)
            console.log('💬 Parent ID being sent:', parentIdStr)
          }

          data = await post(`${API_URL}/posts/${postId}/comments`, payload)
        }

        console.log('✅ Comment created:', data)

        if (data.success && data.comment) {
          // Optimistically add comment to state
          setComments((prev) => {
            const postComments = prev[postId] || []

            if (parentId) {
              // It's a reply - add to parent's replies
              const updatedComments = addReplyToTree(postComments, data.comment)
              return { ...prev, [postId]: updatedComments }
            }

            // It's a top-level comment
            return {
              ...prev,
              [postId]: [data.comment, ...postComments],
            }
          })

          // Broadcast via WebSocket
          console.log('📡 Broadcasting new comment via WebSocket...', {
            wsConnected,
            hasSend: !!wsSend,
          })

          if (wsSend && typeof wsSend === 'function') {
            const wsMessage = {
              type: 'new-comment',
              postId: postId,
              comment: data.comment,
              parentId: parentId || null,
              senderId: user.uid,
            }
            console.log('📡 Sending WebSocket message:', wsMessage)
            wsSend(wsMessage)
            console.log('✅ WebSocket broadcast sent')
          }
        }

        return data
      } catch (error) {
        console.error('❌ createComment error:', error)
        console.error('❌ Error stack:', error.stack)
        return {
          success: false,
          error: error.message || 'Failed to create comment',
        }
      } finally {
        setSending(false)
      }
    },
    [isReady, post, user, wsSend, wsConnected]
  )

  const updateComment = useCallback(
    async (commentId, postId, content) => {
      if (!isReady || !user?.uid) {
        return { success: false, error: 'Auth not ready' }
      }

      if (!content?.trim()) {
        return { success: false, error: 'Content cannot be empty' }
      }

      try {
        const data = await put(`${API_URL}/comments/${commentId}`, {
          content: content.trim(),
        })

        if (data.success) {
          // Update local state
          setComments((prev) => {
            const postComments = prev[postId] || []
            const updatedComments = updateCommentInTree(
              postComments,
              commentId,
              {
                content: content.trim(),
                updatedAt: new Date(),
              }
            )

            return { ...prev, [postId]: updatedComments }
          })

          // Broadcast via WebSocket
          if (wsSend && typeof wsSend === 'function') {
            wsSend({
              type: 'comment-updated',
              commentId,
              postId,
              content: content.trim(),
            })
          }
        }

        return data
      } catch (error) {
        console.error('updateComment error:', error)
        return {
          success: false,
          error: error.message || 'Failed to update comment',
        }
      }
    },
    [isReady, put, user?.uid, wsSend]
  )

  const deleteComment = useCallback(
    async (commentId, postId) => {
      if (!isReady || !user?.uid) {
        return { success: false, error: 'Auth not ready' }
      }

      try {
        const data = await del(`${API_URL}/comments/${commentId}`)

        if (data.success) {
          // Update local state
          setComments((prev) => {
            const postComments = prev[postId] || []
            const updatedComments = removeCommentFromTree(
              postComments,
              commentId
            )

            return { ...prev, [postId]: updatedComments }
          })

          // Broadcast via WebSocket
          if (wsSend && typeof wsSend === 'function') {
            wsSend({
              type: 'comment-deleted',
              commentId,
              postId,
            })
          }
        }

        return data
      } catch (error) {
        console.error('deleteComment error:', error)
        return {
          success: false,
          error: error.message || 'Failed to delete comment',
        }
      }
    },
    [isReady, del, user?.uid, wsSend]
  )

  const toggleLike = useCallback(
    async (commentId, postId, currentlyLiked) => {
      if (!isReady || !user?.uid) {
        return { success: false, error: 'Auth not ready' }
      }

      try {
        // Optimistic update
        setComments((prev) => {
          const postComments = prev[postId] || []

          // Find the comment in the tree
          const findComment = (comments) => {
            for (const c of comments) {
              if (c._id === commentId) return c
              if (c.replies?.length > 0) {
                const found = findComment(c.replies)
                if (found) return found
              }
            }
            return null
          }

          const comment = findComment(postComments)
          const currentLikes = comment?.likes || 0

          const updatedComments = updateCommentInTree(postComments, commentId, {
            isLiked: !currentlyLiked,
            likes: currentlyLiked ? currentLikes - 1 : currentLikes + 1,
          })

          return { ...prev, [postId]: updatedComments }
        })

        const data = await put(`${API_URL}/comments/${commentId}/like`)

        if (data.success) {
          // Update with server response
          setComments((prev) => {
            const postComments = prev[postId] || []
            const updatedComments = updateCommentInTree(
              postComments,
              commentId,
              {
                likes: data.comment.likes,
                isLiked: data.liked,
              }
            )

            return { ...prev, [postId]: updatedComments }
          })

          // Broadcast via WebSocket
          if (wsSend && typeof wsSend === 'function') {
            wsSend({
              type: data.liked ? 'comment-liked' : 'comment-unliked',
              commentId,
              postId,
              newLikeCount: data.comment.likes,
            })
          }
        }

        return data
      } catch (error) {
        console.error('toggleLike error:', error)

        // Revert optimistic update on error
        setComments((prev) => {
          const postComments = prev[postId] || []
          const updatedComments = updateCommentInTree(postComments, commentId, {
            isLiked: currentlyLiked,
          })

          return { ...prev, [postId]: updatedComments }
        })

        return {
          success: false,
          error: error.message || 'Failed to toggle like',
        }
      }
    },
    [isReady, put, user?.uid, wsSend]
  )

  // Utility functions
  const getCommentsForPost = useCallback(
    (postId) => comments[postId] || [],
    [comments]
  )

  const getCommentCount = useCallback(
    (postId) => {
      const postComments = comments[postId] || []

      // Count all comments including nested replies
      const countReplies = (commentList) => {
        return commentList.reduce((count, comment) => {
          return (
            count + 1 + (comment.replies ? countReplies(comment.replies) : 0)
          )
        }, 0)
      }

      return countReplies(postComments)
    },
    [comments]
  )

  const isLoadingComments = useCallback(
    (postId) => loading[postId] || false,
    [loading]
  )

  const contextValue = {
    comments,
    loading,
    sending,
    wsConnected,

    loadComments,
    createComment,
    updateComment,
    deleteComment,
    toggleLike,

    getCommentsForPost,
    getCommentCount,
    isLoadingComments,
  }

  return (
    <CommentsContext.Provider value={contextValue}>
      {children}
    </CommentsContext.Provider>
  )
}

export default CommentsProvider
