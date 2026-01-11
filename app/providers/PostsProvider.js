// providers/PostsProvider.js - FIXED: Contact filtering + Mobile video uploads
import React, { useEffect, useState, useCallback, useContext } from 'react'
import { Platform } from 'react-native'
import useAuthedRequest from '../hooks/useAuthedRequest'
import PostsContext from '../contexts/PostsContext'
import { useUser } from '../hooks/useUser'
import useWebSocket from '../hooks/useWebSocket'
import { useContacts } from './ContactsProvider'

const API_URL = process.env.EXPO_PUBLIC_API_URL

export const PostsProvider = ({ children }) => {
  const { isReady, get, post, put, del } = useAuthedRequest()
  const { user } = useUser()
  const { contacts } = useContacts() // ✅ Get contacts

  const [posts, setPosts] = useState([])
  const [statuses, setStatuses] = useState([])
  const [myStatus, setMyStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  // ✅ Create contact IDs set for filtering
  const contactIds = useCallback(() => {
    const ids = new Set(contacts.map((c) => c.contactUserId))
    // Always include current user
    if (user?.uid) ids.add(user.uid)
    return ids
  }, [contacts, user?.uid])

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

      // ✅ Filter: Only add if from contact or self
      const allowedIds = contactIds()
      if (!allowedIds.has(senderId)) {
        console.log('⏭️ Skipping post from non-contact:', senderId)
        return
      }

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
    [user?.uid, contactIds]
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

      // ✅ Filter: Only add if from contact or self
      const allowedIds = contactIds()
      if (!allowedIds.has(senderId)) {
        console.log('⏭️ Skipping status from non-contact:', senderId)
        return
      }

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
    [user?.uid, contactIds]
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
      // ✅ Filter posts by contacts
      const allowedIds = contactIds()
      const filteredPosts = (data.posts || []).filter((p) =>
        allowedIds.has(p.userId)
      )
      setPosts(filteredPosts)
      console.log(
        `✅ Loaded ${filteredPosts.length}/${
          data.posts?.length || 0
        } posts from contacts`
      )
    } catch (e) {
      console.error('Fetch posts error:', e)
    }
  }, [isReady, get, contactIds])

  const fetchStatuses = useCallback(async () => {
    if (!isReady) return
    try {
      const data = await get(`${API_URL}/statuses`)
      // ✅ Filter statuses by contacts
      const allowedIds = contactIds()
      const filteredStatuses = (data.statuses || []).filter((s) =>
        allowedIds.has(s.userId)
      )
      setStatuses(filteredStatuses)
      console.log(
        `✅ Loaded ${filteredStatuses.length}/${
          data.statuses?.length || 0
        } statuses from contacts`
      )
    } catch (e) {
      console.error('Fetch statuses error:', e)
    }
  }, [isReady, get, contactIds])

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
  // ✅ FIXED: Proper video support for mobile
  const createPost = async (contentOrAsset, files = []) => {
    if (!isReady || !user?.uid) throw new Error('Auth not ready')

    console.log('═══════════════════════════════════')
    console.log('🔍 CREATE POST/STATUS CALLED')
    console.log('Platform:', Platform.OS)
    console.log('contentOrAsset type:', typeof contentOrAsset)
    console.log('files count:', files.length)
    console.log('═══════════════════════════════════')

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

        // ✅ FIXED: Better video type detection
        let fileType = asset.mimeType || asset.type || 'image/jpeg'

        // Check asset.type first (ImagePicker returns 'video' or 'image')
        if (asset.type === 'video' || fileType === 'video') {
          fileType = 'video/mp4'
        } else if (asset.mediaType === 'video') {
          fileType = 'video/mp4'
        } else if (!fileType || fileType === 'image') {
          // Infer from URI
          const uriLower = asset.uri.toLowerCase()
          if (
            uriLower.includes('.mp4') ||
            uriLower.includes('.mov') ||
            uriLower.includes('.avi')
          ) {
            fileType = 'video/mp4'
          } else if (uriLower.includes('.png')) {
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

        console.log('Mobile file details:', {
          originalUri: asset.uri,
          fileName,
          fileType,
          type: asset.type,
          mediaType: asset.mediaType,
          platform: Platform.OS,
          duration: asset.duration,
          fileSize: asset.fileSize,
        })

        // ✅ React Native FormData format - use original URI
        // Important: On Android, this might be a content:// URI
        // React Native's FormData implementation handles this internally
        formData.append('files', {
          uri: asset.uri,
          name: fileName,
          type: fileType,
        })

        console.log('✅ File appended to FormData')
      }

      console.log('📤 Uploading status to:', `${API_URL}/status`)
      console.log('📦 FormData prepared, starting upload...')

      try {
        // ✅ Add timeout for large video uploads
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          console.log('⏱️ Upload timeout after 2 minutes')
          controller.abort()
        }, 120000) // 2 minute timeout

        console.log('🚀 Starting fetch request...')
        const response = await fetch(`${API_URL}/status`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type - FormData sets it with boundary
          },
          body: formData,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
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

        // ✅ Provide more specific error messages
        if (error.name === 'AbortError') {
          throw new Error(
            'Upload timeout - video file may be too large. Try a shorter video.'
          )
        } else if (error.message.includes('Network request failed')) {
          throw new Error('Network error - check your connection and try again')
        }

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
        mediaType: f.mediaType,
        isBlob: fileIsBlob,
      })

      if (isWeb && fileIsBlob) {
        console.log(`🌐 Web file ${i}`)
        const response = await fetch(f.uri)
        const blob = await response.blob()
        const fileType = blob.type || f.type || 'image/jpeg'
        const fileName = f.name || `post_${Date.now()}_${i}.jpg`
        const file = new File([blob], fileName, { type: fileType })
        formData.append('files', file)
        console.log(`Added web file ${i}:`, { fileName, fileType })
      } else {
        console.log(`📱 Mobile file ${i}`)

        // ✅ FIXED: Better type detection for videos
        let fileType = f.mimeType || f.type || 'image/jpeg'

        // Check f.type first (ImagePicker returns 'video' or 'image')
        if (f.type === 'video' || fileType === 'video') {
          fileType = 'video/mp4'
        } else if (f.mediaType === 'video') {
          fileType = 'video/mp4'
        } else if (!fileType || fileType === 'image') {
          const uriLower = f.uri.toLowerCase()
          if (
            uriLower.includes('.mp4') ||
            uriLower.includes('.mov') ||
            uriLower.includes('.avi')
          ) {
            fileType = 'video/mp4'
          } else if (uriLower.includes('.png')) {
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
        const fileName = f.name || `post_${Date.now()}_${i}.${extension}`

        // ✅ React Native FormData - use original URI without modification
        console.log(`Mobile file ${i} details:`, {
          originalUri: f.uri,
          fileName,
          fileType,
          type: f.type,
          mediaType: f.mediaType,
        })

        formData.append('files', {
          uri: f.uri, // Use original URI
          name: fileName,
          type: fileType,
        })
      }
    }

    console.log('📤 Creating post at:', `${API_URL}/posts`)

    try {
      // ✅ Add timeout for large uploads
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout

      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
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

      // ✅ Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Upload timeout - files may be too large')
      } else if (error.message.includes('Network request failed')) {
        throw new Error('Network error - check your connection and try again')
      }

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

  // ✅ Refetch when contacts change
  useEffect(() => {
    if (isReady && contacts.length > 0) {
      console.log('🔄 Contacts changed, refetching posts/statuses...')
      refetch()
    }
  }, [contacts.length, isReady])

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
