// providers/PostsProvider.js - FIXED MOBILE FILE UPLOADS
import React, { useEffect, useState, useCallback, useContext } from 'react'
import { Platform } from 'react-native'
import useAuthedRequest from '../hooks/useAuthedRequest'
import PostsContext from '../contexts/PostsContext'
import { useUser } from '../hooks/useUser'
import useWebSocket from '../hooks/useWebSocket'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.102.223.87:5000'

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

        case 'status-viewed':
          handleStatusViewed(data)
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

  const handleStatusViewed = useCallback((data) => {
    const { statusId, viewer, viewCount } = data
    console.log(
      '👁️ Status viewed notification:',
      statusId,
      'by:',
      viewer.userName
    )

    setMyStatus((prev) =>
      (prev || []).map((status) =>
        status._id === statusId
          ? {
              ...status,
              viewCount: viewCount || (status.viewCount || 0) + 1,
              hasViewed: true,
            }
          : status
      )
    )

    setStatuses((prevStatuses) =>
      prevStatuses.map((group) => ({
        ...group,
        statuses: group.statuses.map((status) =>
          status._id === statusId ? { ...status, hasViewed: true } : status
        ),
      }))
    )
  }, [])

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
  // ✅ FIXED: Proper FormData handling for mobile image uploads
  const createPost = async (contentOrAsset, files = []) => {
    if (!isReady || !user?.uid) throw new Error('Auth not ready')

    console.log('═══════════════════════════════════')
    console.log('🔍 CREATE POST/STATUS CALLED')
    console.log('Platform:', Platform.OS)
    console.log('contentOrAsset type:', typeof contentOrAsset)
    console.log('files count:', files.length)
    console.log('═══════════════════════════════════')

    // Get auth token
    const token = await user.getIdToken()
    console.log('✅ Got auth token')

    const isMediaObject =
      typeof contentOrAsset === 'object' &&
      contentOrAsset !== null &&
      contentOrAsset.uri

    if (isMediaObject) {
      // ============================================
      // STATUS CREATION
      // ============================================
      const asset = contentOrAsset
      console.log('📸 STATUS CREATION')
      console.log('Asset URI:', asset.uri)
      console.log('Asset type:', asset.type)
      console.log('Asset fileName:', asset.fileName)

      const formData = new FormData()
      const isWeb =
        Platform.OS === 'web' || (asset.uri && asset.uri.startsWith('blob:'))

      if (isWeb) {
        console.log('🌐 Web status upload')
        // Web: Convert blob to file
        const response = await fetch(asset.uri)
        const blob = await response.blob()
        const fileType = blob.type || asset.type || 'image/jpeg'
        const extension = fileType.includes('video') ? 'mp4' : 'jpg'
        const fileName = asset.fileName || `status-${Date.now()}.${extension}`
        const file = new File([blob], fileName, { type: fileType })
        formData.append('files', file)
        console.log('Added file to FormData:', { fileName, fileType })
      } else {
        console.log('📱 Mobile status upload')
        // Mobile: Determine file type from URI or asset
        let fileType = asset.type || asset.mimeType || 'image/jpeg'

        // If no type provided, infer from URI extension
        if (!fileType || fileType === 'image') {
          if (
            asset.uri.toLowerCase().includes('.mp4') ||
            asset.uri.toLowerCase().includes('.mov')
          ) {
            fileType = 'video/mp4'
          } else if (asset.uri.toLowerCase().includes('.png')) {
            fileType = 'image/png'
          } else {
            fileType = 'image/jpeg'
          }
        }

        const extension = fileType.includes('video')
          ? 'mp4'
          : fileType.includes('png')
          ? 'png'
          : 'jpg'
        const fileName = asset.fileName || `status-${Date.now()}.${extension}`

        // Clean URI for iOS
        let cleanUri = asset.uri
        if (Platform.OS === 'ios' && cleanUri.startsWith('file://')) {
          cleanUri = cleanUri.replace('file://', '')
        }

        console.log('Mobile file details:', {
          originalUri: asset.uri,
          cleanUri,
          fileName,
          fileType,
          platform: Platform.OS,
        })

        // React Native FormData format
        formData.append('files', {
          uri: cleanUri,
          name: fileName,
          type: fileType,
        })
      }

      console.log('📤 Uploading status to:', `${API_URL}/status`)

      try {
        const response = await fetch(`${API_URL}/status`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type - let FormData set it with boundary
          },
          body: formData,
        })

        console.log('📡 Status response status:', response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Status error response:', errorText)

          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: `HTTP ${response.status}: ${errorText}` }
          }

          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const data = await response.json()
        console.log('✅ Status uploaded successfully:', data.status?._id)

        setMyStatus((prev) => [data.status, ...(prev || [])])
        return data.status
      } catch (error) {
        console.error('❌ Status upload failed:', error)
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
        })
        throw error
      }
    }

    // ============================================
    // POST CREATION
    // ============================================
    const content = contentOrAsset
    console.log('📝 POST CREATION')
    console.log('Content:', content?.substring(0, 50) + '...')
    console.log('Files count:', files.length)

    const formData = new FormData()
    formData.append('content', content)

    const isWeb = Platform.OS === 'web'

    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const fileIsBlob = f.uri?.startsWith('blob:')

      console.log(`Processing file ${i}:`, {
        uri: f.uri?.substring(0, 50) + '...',
        name: f.name,
        type: f.type,
        isBlob: fileIsBlob,
      })

      if (isWeb && fileIsBlob) {
        console.log(`🌐 Web file ${i}`)
        // Web: Convert blob to file
        const response = await fetch(f.uri)
        const blob = await response.blob()
        const fileType = blob.type || f.type || 'image/jpeg'
        const fileName = f.name || `post_${Date.now()}_${i}.jpg`
        const file = new File([blob], fileName, { type: fileType })
        formData.append('files', file)
        console.log(`Added web file ${i}:`, { fileName, fileType })
      } else {
        console.log(`📱 Mobile file ${i}`)
        // Mobile: Determine file type
        let fileType = f.type || f.mimeType || 'image/jpeg'

        // Infer from URI if needed
        if (!fileType || fileType === 'image') {
          if (f.uri.toLowerCase().includes('.png')) {
            fileType = 'image/png'
          } else {
            fileType = 'image/jpeg'
          }
        }

        const extension = fileType.includes('png') ? 'png' : 'jpg'
        const fileName = f.name || `post_${Date.now()}_${i}.${extension}`

        // Clean URI for iOS
        let cleanUri = f.uri
        if (Platform.OS === 'ios' && cleanUri.startsWith('file://')) {
          cleanUri = cleanUri.replace('file://', '')
        }

        console.log(`Mobile file ${i} details:`, {
          originalUri: f.uri,
          cleanUri,
          fileName,
          fileType,
        })

        formData.append('files', {
          uri: cleanUri,
          name: fileName,
          type: fileType,
        })
      }
    }

    console.log('📤 Creating post at:', `${API_URL}/posts`)

    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - let FormData set it with boundary
        },
        body: formData,
      })

      console.log('📡 Post response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Post error response:', errorText)

        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: `HTTP ${response.status}: ${errorText}` }
        }

        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Post created successfully:', data.post?._id)

      setPosts((p) => [data.post, ...p])
      return data.post
    } catch (error) {
      console.error('❌ Post creation failed:', error)
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      })
      throw error
    }
  }

  // ─── Update Post ────────────────────────────────
  const updatePost = async (postId, newContent) => {
    if (!isReady) throw new Error('Auth not ready')

    console.log('📝 Updating post:', postId, 'with content:', newContent)

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

      setPosts((p) => p.map((x) => (x._id === postId ? data.post : x)))

      return data.post
    } catch (e) {
      console.error('❌ Update post error:', e)
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
    if (!isReady) throw new Error('Auth not ready')

    const deletedPost = posts.find((p) => p._id === postId)
    setPosts((p) => p.filter((x) => x._id !== postId))

    try {
      const result = await del(`${API_URL}/posts/${postId}`)
      console.log('✅ Post deleted successfully')
      return result
    } catch (e) {
      console.error('❌ Delete post error:', e)
      if (deletedPost) {
        setPosts((p) => [deletedPost, ...p])
      }
      throw e
    }
  }

  // ─── Delete Status ────────────────────────────────
  const deleteStatus = async (statusId) => {
    if (!isReady) throw new Error('Auth not ready')

    const deletedStatus = (myStatus || []).find((s) => s._id === statusId)
    setMyStatus((prev) => (prev || []).filter((x) => x._id !== statusId))

    try {
      const response = await del(`${API_URL}/status/${statusId}`)
      console.log('✅ Status deleted successfully')
      return response
    } catch (e) {
      console.error('❌ Delete status error:', e)
      if (deletedStatus) {
        setMyStatus((prev) => [deletedStatus, ...(prev || [])])
      }
      throw new Error(e.message || 'Failed to delete status')
    }
  }

  // ─── Check Post Ownership ────────────────────────────────
  const isPostOwner = useCallback(
    (post) => {
      if (!user?.uid || !post) return false
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
