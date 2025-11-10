// providers/PostsProvider.js - Fixed version
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
        case 'pong':
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

  // ─── Initialize WebSocket ────────────────────────────────
  const {
    isConnected: wsConnected,
    connectionState,
    send: wsSend,
    reconnect: wsReconnect,
  } = useWebSocket({
    userId: user?.uid,
    endpoint: '/posts',
    onMessage: handleWebSocketMessage,
    enabled: !!user?.uid && isReady,
  })

  // ─── Real-time Event Handlers ────────────────────────────────

  const handleNewPost = useCallback(
    (data) => {
      const { post: newPost, senderId } = data

      if (senderId === user?.uid) {
        console.log('⏭️ Skipping own post (already in state)')
        return
      }

      setPosts((prevPosts) => {
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
              ),
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

      if (senderId === user?.uid) {
        console.log('⏭️ Skipping own status (already in state)')
        setMyStatus((prev) => {
          const isDuplicate = (prev || []).some((s) => s._id === newStatus._id)
          if (isDuplicate) return prev
          return [newStatus, ...(prev || [])]
        })
        return
      }

      setStatuses((prevStatuses) => {
        const existingUserIndex = prevStatuses.findIndex(
          (group) => group.userId === senderId
        )

        if (existingUserIndex >= 0) {
          const existingGroup = prevStatuses[existingUserIndex]
          const isDuplicate = existingGroup.statuses.some(
            (s) => s._id === newStatus._id
          )

          if (isDuplicate) {
            console.log('⚠️ Duplicate status detected, skipping')
            return prevStatuses
          }

          const updated = [...prevStatuses]
          updated[existingUserIndex] = {
            ...updated[existingUserIndex],
            statuses: [newStatus, ...updated[existingUserIndex].statuses],
            statusCount: updated[existingUserIndex].statusCount + 1,
            fileUrl: newStatus.fileUrl,
            createdAt: newStatus.createdAt,
          }
          return updated
        } else {
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

      if (senderId === user?.uid) {
        setMyStatus((prev) => (prev || []).filter((s) => s._id !== statusId))
      }

      setStatuses((prevStatuses) => {
        return prevStatuses
          .map((group) => {
            if (group.userId === senderId) {
              const updatedStatuses = group.statuses.filter(
                (s) => s._id !== statusId
              )

              if (updatedStatuses.length === 0) {
                return null
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

  // ─── Fetch functions ────────────────────────────────
  const fetchPosts = useCallback(async () => {
    if (!isReady) return
    try {
      const data = await get(`${API_URL}/posts`)
      setPosts(data.posts || [])
    } catch (e) {
      console.error('Fetch posts error:', e)
    }
  }, [isReady, get])

  const fetchStatuses = useCallback(async () => {
    if (!isReady) return
    try {
      const data = await get(`${API_URL}/statuses`)
      setStatuses(data.statuses || [])
    } catch (e) {
      console.error('Fetch statuses error:', e)
    }
  }, [isReady, get])

  const fetchMyStatus = useCallback(async () => {
    if (!isReady) return
    try {
      const data = await get(`${API_URL}/status/my`)
      setMyStatus(data.statuses || [])
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

  // ─── Create Post or Status ────────────────────────────────
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

      const isWeb =
        typeof window !== 'undefined' && asset.uri.startsWith('blob:')

      if (isWeb) {
        const response = await fetch(asset.uri)
        const blob = await response.blob()
        const fileType = blob.type || asset.type || 'image/jpeg'
        const extension = fileType.includes('video') ? 'mp4' : 'jpg'
        const fileName = asset.fileName || `status-${Date.now()}.${extension}`
        const file = new File([blob], fileName, { type: fileType })
        formData.append('files', file)
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

      const data = await post(`${API_URL}/status`, formData, true)
      setMyStatus((prev) => [data.status, ...(prev || [])])
      return data.status
    }

    // POST CREATION
    const content = contentOrAsset
    const fd = new FormData()
    fd.append('content', content)

    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const isWeb = typeof window !== 'undefined' && f.uri?.startsWith('blob:')

      if (isWeb) {
        const response = await fetch(f.uri)
        const blob = await response.blob()
        const fileType = blob.type || f.type || 'image/jpeg'
        const fileName = f.name || `post_${Date.now()}_${i}.jpg`
        const file = new File([blob], fileName, { type: fileType })
        fd.append('files', file)
      } else {
        fd.append('files', {
          uri: f.uri,
          name: f.name || `post_${Date.now()}_${i}`,
          type: f.type || f.mimeType || 'image/jpeg',
        })
      }
    }

    const data = await post(`${API_URL}/posts`, fd, true)
    setPosts((p) => [data.post, ...p])
    return data.post
  }

  // ─── Update Post ────────────────────────────────
  const updatePost = async (postId, newContent) => {
    if (!isReady) throw new Error('Auth not ready')

    console.log('📝 Updating post:', postId, 'with content:', newContent)

    // Optimistic update
    setPosts((p) =>
      p.map((x) =>
        x._id === postId
          ? { ...x, content: newContent, updatedAt: new Date() }
          : x
      )
    )

    try {
      const data = await put(`${API_URL}/posts/${postId}`, {
        content: newContent,
      })

      console.log('✅ Post updated successfully')

      // Update with server response
      setPosts((p) => p.map((x) => (x._id === postId ? data.post : x)))

      return data.post
    } catch (e) {
      console.error('❌ Update post error:', e)
      // Rollback on error
      await refetch()
      throw e
    }
  }

  // ─── Toggle Like ────────────────────────────────
  const toggleLike = async (postId, currentIsLiked) => {
    if (!isReady) return

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
    } catch (e) {
      console.error('Toggle like error:', e)
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

  // ─── Delete Post ────────────────────────────────
  const deletePost = async (postId) => {
    console.log('═══════════════════════════════════')
    console.log('🔍 DELETE POST CALLED')
    console.log('═══════════════════════════════════')
    console.log('postId:', postId)
    console.log('isReady:', isReady)
    console.log('API_URL:', API_URL)
    console.log('Full URL:', `${API_URL}/posts/${postId}`)
    console.log('del function type:', typeof del)
    console.log('posts count:', posts.length)

    if (!isReady) {
      console.log('❌ Auth not ready!')
      throw new Error('Auth not ready')
    }

    // Optimistic update
    const deletedPost = posts.find((p) => p._id === postId)
    console.log('Found post to delete:', !!deletedPost)

    setPosts((p) => p.filter((x) => x._id !== postId))
    console.log('Optimistically removed from state')

    try {
      console.log('📡 Calling del() function...')
      const result = await del(`${API_URL}/posts/${postId}`)
      console.log('✅ API Response:', result)
      console.log('✅ Post deleted successfully')
      console.log('═══════════════════════════════════')
      return result
    } catch (e) {
      console.log('❌ DELETE FAILED')
      console.error('Error:', e)
      console.error('Error type:', e.constructor.name)
      console.error('Error message:', e.message)
      console.error('Error stack:', e.stack)
      console.log('═══════════════════════════════════')

      // Rollback on error
      if (deletedPost) {
        console.log('Rolling back...')
        setPosts((p) => [deletedPost, ...p])
      }
      throw e
    }
  }

  // ─── Delete Status ────────────────────────────────
  const deleteStatus = async (statusId) => {
    console.log('═══════════════════════════════════')
    console.log('🔍 DELETE STATUS CALLED')
    console.log('═══════════════════════════════════')
    console.log('statusId:', statusId)
    console.log('isReady:', isReady)
    console.log('API_URL:', API_URL)
    console.log('Full URL:', `${API_URL}/status/${statusId}`)
    console.log('del function type:', typeof del)
    console.log('myStatus count:', myStatus?.length || 0)

    if (!isReady) {
      console.log('❌ Auth not ready!')
      throw new Error('Auth not ready')
    }

    // Optimistic update
    const deletedStatus = (myStatus || []).find((s) => s._id === statusId)
    console.log('Found status to delete:', !!deletedStatus)

    setMyStatus((prev) => (prev || []).filter((x) => x._id !== statusId))
    console.log('Optimistically removed from state')

    try {
      console.log('📡 Calling del() function...')
      const response = await del(`${API_URL}/status/${statusId}`)
      console.log('✅ API Response:', response)
      console.log('✅ Status deleted successfully')
      console.log('═══════════════════════════════════')
      return response
    } catch (e) {
      console.log('❌ DELETE FAILED')
      console.error('Error:', e)
      console.error('Error type:', e.constructor.name)
      console.error('Error message:', e.message)
      console.error('Error stack:', e.stack)
      console.log('═══════════════════════════════════')

      // Rollback on error
      if (deletedStatus) {
        console.log('Rolling back...')
        setMyStatus((prev) => [deletedStatus, ...(prev || [])])
      }
      throw new Error(e.message || 'Failed to delete status')
    }
  }

  // ─── Check Post Ownership ────────────────────────────────
  const isPostOwner = useCallback(
    (post) => {
      if (!user?.uid || !post) return false
      // Check both userId and user._id fields for compatibility
      return post.userId === user.uid || post.user?._id === user.uid
    },
    [user?.uid]
  )

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
    updatePost,
    toggleLike,
    deletePost,
    deleteStatus,
    refetch,
    wsConnected,
    connectionState,
    onlineUsers,
    wsReconnect,
    wsSend,
    isUserOnline: (userId) => onlineUsers.has(userId),
    isPostOwner,
    currentUserId: user?.uid,
  }

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>
}

export const usePosts = () => useContext(PostsContext)
