import React, { useEffect, useState, useCallback, useContext } from 'react'
import useAuthedRequest from '../hooks/useAuthedRequest'
import PostsContext from '../contexts/PostsContext'
import { useUser } from '../hooks/useUser'
import useWebSocket from '../hooks/useWebSocket'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'

export const PostsProvider = ({ children }) => {
  const { isReady, get, post, put, del } = useAuthedRequest()
  const { user } = useUser()

  const [posts, setPosts] = useState([])
  const [statuses, setStatuses] = useState([])
  const [myStatus, setMyStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  // ─── WebSocket Message Handler ────────────────────────────────
  const handleWebSocketMessage = useCallback(
    (data) => {
      console.log(
        '📨 Posts WebSocket message:',
        data.type,
        'from:',
        data.senderId || data.userId
      )

      switch (data.type) {
        case 'connected':
          console.log('✅ Posts WebSocket connected')
          if (data.onlineUsers) {
            setOnlineUsers(new Set(data.onlineUsers))
          }
          break

        case 'new-post':
          handleNewPost(data)
          break

        case 'post-updated':
          handlePostUpdated(data)
          break

        case 'post-deleted':
          handlePostDeleted(data)
          break

        case 'post-liked':
          handlePostLiked(data)
          break

        case 'post-unliked':
          handlePostUnliked(data)
          break

        case 'new-status':
          handleNewStatus(data)
          break

        case 'status-deleted':
          handleStatusDeleted(data)
          break

        case 'user-online':
          handleUserOnline(data)
          break

        case 'user-offline':
          handleUserOffline(data)
          break

        case 'ping':
          // Handled by useWebSocket
          break

        case 'pong':
          // Handled by useWebSocket
          break

        case 'error':
          console.error('❌ WebSocket error:', data.message)
          break

        default:
          console.log('⚠️ Unknown WebSocket message:', data.type)
      }
    },
    [user?.uid]
  )

  // ─── Initialize WebSocket with dedicated /posts endpoint ────────────────────────────────
  const {
    isConnected: wsConnected,
    connectionState,
    send: wsSend,
    reconnect: wsReconnect,
  } = useWebSocket({
    userId: user?.uid,
    endpoint: '/posts', // Use dedicated posts endpoint
    onMessage: handleWebSocketMessage,
    enabled: !!user?.uid && isReady,
  })

  // ─── Real-time Event Handlers ────────────────────────────────

  const handleNewPost = useCallback(
    (data) => {
      const { post: newPost, senderId } = data

      console.log('📝 Received new-post event:', {
        postId: newPost._id,
        senderId,
        currentUserId: user?.uid,
        isSelf: senderId === user?.uid,
      })

      // Skip if it's your own post (already in state)
      if (senderId === user?.uid) {
        console.log('⏭️ Skipping own post (already in state)')
        return
      }

      setPosts((prevPosts) => {
        // Check for duplicates
        const isDuplicate = prevPosts.some((p) => p._id === newPost._id)
        if (isDuplicate) {
          console.log('⚠️ Duplicate post detected, skipping')
          return prevPosts
        }

        console.log('✅ Adding new post to state:', newPost._id)
        return [newPost, ...prevPosts]
      })
    },
    [user?.uid]
  )

  const handlePostUpdated = useCallback((data) => {
    const { postId, post: updatedPost } = data

    console.log('✏️ Post updated:', postId)

    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p._id === postId
          ? {
              ...p,
              content: updatedPost.content,
              updatedAt: updatedPost.updatedAt || new Date(),
            }
          : p
      )
    )
  }, [])

  const handlePostDeleted = useCallback((data) => {
    const { postId } = data

    console.log('🗑️ Post deleted:', postId)

    setPosts((prevPosts) => prevPosts.filter((p) => p._id !== postId))
  }, [])

  const handlePostLiked = useCallback(
    (data) => {
      const { postId, userId, newLikeCount } = data

      console.log('❤️ Post liked:', postId, 'by:', userId)

      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p._id === postId) {
            const isCurrentUser = userId === user?.uid
            return {
              ...p,
              likes: newLikeCount,
              isLiked: isCurrentUser ? true : p.isLiked,
              likedBy: [...(p.likedBy || []), userId].filter(
                (id, idx, arr) => arr.indexOf(id) === idx
              ), // Remove duplicates
            }
          }
          return p
        })
      )
    },
    [user?.uid]
  )

  const handlePostUnliked = useCallback(
    (data) => {
      const { postId, userId, newLikeCount } = data

      console.log('💔 Post unliked:', postId, 'by:', userId)

      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p._id === postId) {
            const isCurrentUser = userId === user?.uid
            return {
              ...p,
              likes: newLikeCount,
              isLiked: isCurrentUser ? false : p.isLiked,
              likedBy: (p.likedBy || []).filter((id) => id !== userId),
            }
          }
          return p
        })
      )
    },
    [user?.uid]
  )

  const handleNewStatus = useCallback(
    (data) => {
      const { status: newStatus, userId: senderId } = data

      console.log('📸 Received new-status event:', {
        statusId: newStatus._id,
        senderId,
        currentUserId: user?.uid,
        isSelf: senderId === user?.uid,
      })

      // If it's your status (shouldn't happen due to server exclusion)
      if (senderId === user?.uid) {
        console.log('⏭️ Skipping own status (already in state)')
        setMyStatus((prev) => {
          const isDuplicate = (prev || []).some((s) => s._id === newStatus._id)
          if (isDuplicate) return prev
          return [newStatus, ...(prev || [])]
        })
        return
      }

      // Update statuses list (grouped by user)
      setStatuses((prevStatuses) => {
        // Check if user already has statuses in the list
        const existingUserIndex = prevStatuses.findIndex(
          (group) => group.userId === senderId
        )

        if (existingUserIndex >= 0) {
          // Check for duplicate status
          const existingGroup = prevStatuses[existingUserIndex]
          const isDuplicate = existingGroup.statuses.some(
            (s) => s._id === newStatus._id
          )

          if (isDuplicate) {
            console.log('⚠️ Duplicate status detected, skipping')
            return prevStatuses
          }

          // Add to existing user's statuses
          const updated = [...prevStatuses]
          updated[existingUserIndex] = {
            ...updated[existingUserIndex],
            statuses: [newStatus, ...updated[existingUserIndex].statuses],
            statusCount: updated[existingUserIndex].statusCount + 1,
            fileUrl: newStatus.fileUrl, // Update preview to latest
            createdAt: newStatus.createdAt,
          }
          console.log('✅ Added status to existing user group:', senderId)
          return updated
        } else {
          // Create new group for this user
          const newGroup = {
            _id: newStatus._id,
            userId: senderId,
            userName: newStatus.userName,
            userAvatarColor: newStatus.userAvatarColor,
            fileUrl: newStatus.fileUrl,
            fileType: newStatus.fileType,
            statusCount: 1,
            statuses: [newStatus],
            createdAt: newStatus.createdAt,
          }
          console.log('✅ Created new status group for user:', senderId)
          return [newGroup, ...prevStatuses]
        }
      })
    },
    [user?.uid]
  )

  const handleStatusDeleted = useCallback(
    (data) => {
      const { statusId, userId: senderId } = data

      console.log('🗑️ Status deleted:', statusId, 'by:', senderId)

      // If it's your status
      if (senderId === user?.uid) {
        setMyStatus((prev) => (prev || []).filter((s) => s._id !== statusId))
      }

      // Update statuses list
      setStatuses((prevStatuses) => {
        return prevStatuses
          .map((group) => {
            if (group.userId === senderId) {
              const updatedStatuses = group.statuses.filter(
                (s) => s._id !== statusId
              )

              if (updatedStatuses.length === 0) {
                return null // Remove group if no statuses left
              }

              return {
                ...group,
                statuses: updatedStatuses,
                statusCount: updatedStatuses.length,
                fileUrl: updatedStatuses[0].fileUrl,
                _id: updatedStatuses[0]._id,
              }
            }
            return group
          })
          .filter(Boolean)
      })
    },
    [user?.uid]
  )

  const handleUserOnline = useCallback((data) => {
    setOnlineUsers((prev) => new Set([...prev, data.userId]))
  }, [])

  const handleUserOffline = useCallback((data) => {
    setOnlineUsers((prev) => {
      const updated = new Set(prev)
      updated.delete(data.userId)
      return updated
    })
  }, [])

  // ─── Fetch posts ────────────────────────────────
  const fetchPosts = useCallback(async () => {
    if (!isReady) return
    try {
      const data = await get(`${API_URL}/posts`)
      setPosts(data.posts || [])
    } catch (e) {
      console.error('Fetch posts error:', e)
    }
  }, [isReady, get])

  // ─── Fetch all statuses (grouped by user, excluding yours) ────────────────
  const fetchStatuses = useCallback(async () => {
    if (!isReady) return
    try {
      const data = await get(`${API_URL}/statuses`)
      setStatuses(data.statuses || [])
    } catch (e) {
      console.error('Fetch statuses error:', e)
    }
  }, [isReady, get])

  // ─── Fetch your statuses (all of them) ────────────────────────────────
  const fetchMyStatus = useCallback(async () => {
    if (!isReady) return
    try {
      const data = await get(`${API_URL}/status/my`)
      setMyStatus(data.statuses || [])
      console.log('My statuses:', data.statuses?.length || 0)
    } catch (e) {
      console.error('Fetch my status error:', e)
      setMyStatus([])
    }
  }, [isReady, get])

  const refetch = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchPosts(), fetchStatuses(), fetchMyStatus()])
    setLoading(false)
  }, [fetchPosts, fetchStatuses, fetchMyStatus])

  // ─── Create Post or Status (unified) ────────────────────────────────
  const createPost = async (contentOrAsset, files = []) => {
    if (!isReady) throw new Error('Auth not ready')

    const isMediaObject =
      typeof contentOrAsset === 'object' &&
      contentOrAsset !== null &&
      contentOrAsset.uri

    if (isMediaObject) {
      // STATUS CREATION
      const asset = contentOrAsset
      const formData = new FormData()

      console.log('Creating status from asset:', {
        uri: asset.uri,
        type: asset.type,
        fileName: asset.fileName,
      })

      const isWeb =
        typeof window !== 'undefined' && asset.uri.startsWith('blob:')

      if (isWeb) {
        try {
          const response = await fetch(asset.uri)
          const blob = await response.blob()

          const fileType = blob.type || asset.type || 'image/jpeg'
          const extension = fileType.includes('video') ? 'mp4' : 'jpg'
          const fileName = asset.fileName || `status-${Date.now()}.${extension}`

          const file = new File([blob], fileName, { type: fileType })

          console.log('Created File for web:', {
            name: file.name,
            type: file.type,
            size: file.size,
          })

          formData.append('files', file)
        } catch (error) {
          console.error('Failed to process blob:', error)
          throw new Error('Failed to process image')
        }
      } else {
        const fileType =
          asset.type ||
          (asset.uri.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg')

        formData.append('files', {
          uri: asset.uri,
          name:
            asset.fileName ||
            `status-${Date.now()}.${
              fileType.includes('video') ? 'mp4' : 'jpg'
            }`,
          type: fileType,
        })
      }

      console.log('Sending status to API...')

      const data = await post(`${API_URL}/status`, formData, true)

      console.log('Status created successfully:', data.status._id)

      // Update local state immediately
      setMyStatus((prev) => [data.status, ...(prev || [])])

      // Server will broadcast to others automatically
      console.log('✅ Status created, server will broadcast to others')

      return data.status
    }

    // POST CREATION
    const content = contentOrAsset
    const fd = new FormData()
    fd.append('content', content)

    console.log('Creating post with content:', content?.substring(0, 50))
    console.log('Number of files:', files.length)

    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const isWeb = typeof window !== 'undefined' && f.uri?.startsWith('blob:')

      if (isWeb) {
        try {
          const response = await fetch(f.uri)
          const blob = await response.blob()

          const fileType = blob.type || f.type || 'image/jpeg'
          const fileName = f.name || `post_${Date.now()}_${i}.jpg`

          const file = new File([blob], fileName, { type: fileType })

          console.log(`Web file ${i}:`, {
            name: file.name,
            type: file.type,
            size: file.size,
          })

          fd.append('files', file)
        } catch (error) {
          console.error(`Failed to process file ${i}:`, error)
        }
      } else {
        fd.append('files', {
          uri: f.uri,
          name: f.name || `post_${Date.now()}_${i}`,
          type: f.type || f.mimeType || 'image/jpeg',
        })
      }
    }

    console.log('Sending post to API...')
    const data = await post(`${API_URL}/posts`, fd, true)

    console.log('Post created successfully:', data.post._id)

    // Update local state immediately
    setPosts((p) => [data.post, ...p])

    // Server will broadcast to others automatically
    console.log('✅ Post created, server will broadcast to others')

    return data.post
  }

  // ─── Like / Delete ────────────────────────────────
  const toggleLike = async (postId, currentIsLiked) => {
    if (!isReady) return

    // Optimistic update
    setPosts((p) =>
      p.map((x) =>
        x._id === postId
          ? {
              ...x,
              isLiked: !currentIsLiked,
              likes: currentIsLiked ? x.likes - 1 : x.likes + 1,
            }
          : x
      )
    )

    try {
      await put(`${API_URL}/posts/${postId}/like`)

      console.log('✅ Like toggled, server will broadcast to others')
    } catch (e) {
      console.error('Toggle like error:', e)
      // Rollback on error
      setPosts((p) =>
        p.map((x) =>
          x._id === postId
            ? {
                ...x,
                isLiked: currentIsLiked,
                likes: currentIsLiked ? x.likes + 1 : x.likes - 1,
              }
            : x
        )
      )
    }
  }

  const deletePost = async (postId) => {
    if (!isReady) return
    await del(`${API_URL}/posts/${postId}`)
    setPosts((p) => p.filter((x) => x._id !== postId))

    console.log('✅ Post deleted, server will broadcast to others')
  }

  const deleteStatus = async (statusId) => {
    if (!isReady) return
    await del(`${API_URL}/status/${statusId}`)

    setMyStatus((prev) => (prev || []).filter((x) => x._id !== statusId))
    setStatuses((p) => p.filter((x) => x._id !== statusId))

    console.log('✅ Status deleted, server will broadcast to others')
  }

  // ─── Auto Fetch on Mount ────────────────────────────────
  useEffect(() => {
    if (isReady) refetch()
  }, [isReady, refetch])

  const value = {
    posts,
    statuses,
    myStatus,
    loading,
    error,
    createPost,
    toggleLike,
    deletePost,
    deleteStatus,
    refetch,

    // WebSocket state
    wsConnected,
    connectionState,
    onlineUsers,
    wsReconnect,
    wsSend,

    // Utility functions
    isUserOnline: (userId) => onlineUsers.has(userId),
  }

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>
}

// ✅ Hook
export const usePosts = () => useContext(PostsContext)
