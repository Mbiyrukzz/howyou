// providers/PostsProvider.js - Enhanced with My Status
import React, { useEffect, useState, useCallback, useContext } from 'react'
import useAuthedRequest from '../hooks/useAuthedRequest'
import PostsContext from '../contexts/PostsContext'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'

export const PostsProvider = ({ children }) => {
  const { isReady, get, post, put, del } = useAuthedRequest()

  const [posts, setPosts] = useState([])
  const [statuses, setStatuses] = useState([])
  const [myStatus, setMyStatus] = useState(null) // Your own status
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  // ─── Fetch all statuses (excluding yours) ────────────────────────────────
  const fetchStatuses = useCallback(async () => {
    if (!isReady) return
    try {
      const data = await get(`${API_URL}/statuses`)
      setStatuses(data.statuses || [])
    } catch (e) {
      console.error('Fetch statuses error:', e)
    }
  }, [isReady, get])

  // ─── Fetch your status ────────────────────────────────
  const fetchMyStatus = useCallback(async () => {
    if (!isReady) return
    try {
      const data = await get(`${API_URL}/status/my`)
      setMyStatus(data.status || null)
      console.log('My status:', data.status ? 'exists' : 'none')
    } catch (e) {
      console.error('Fetch my status error:', e)
      setMyStatus(null)
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

    // 🧠 Detect if the argument is a media asset (for status) instead of text
    const isMediaObject =
      typeof contentOrAsset === 'object' &&
      contentOrAsset !== null &&
      contentOrAsset.uri

    if (isMediaObject) {
      // ═══════════════════════════════════════════════════════
      // STATUS CREATION (single media file)
      // ═══════════════════════════════════════════════════════
      const asset = contentOrAsset
      const formData = new FormData()

      console.log('Creating status from asset:', {
        uri: asset.uri,
        type: asset.type,
        fileName: asset.fileName,
      })

      // Check if we're in web environment
      const isWeb =
        typeof window !== 'undefined' && asset.uri.startsWith('blob:')

      if (isWeb) {
        // WEB: Fetch blob and create File object
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
        // NATIVE: Use React Native format
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

      // Upload as story/status
      const data = await post(`${API_URL}/status`, formData, true)

      console.log('Status created successfully:', data.status._id)

      // Update myStatus and add to statuses list
      setMyStatus(data.status)

      // If it's a new status, it might replace an old one
      // Refresh to get the latest list
      await fetchMyStatus()

      return data.status
    }

    // ═══════════════════════════════════════════════════════
    // POST CREATION (text + optional images)
    // ═══════════════════════════════════════════════════════
    const content = contentOrAsset
    const fd = new FormData()
    fd.append('content', content)

    console.log('Creating post with content:', content?.substring(0, 50))
    console.log('Number of files:', files.length)

    // Process files for web or native
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const isWeb = typeof window !== 'undefined' && f.uri?.startsWith('blob:')

      if (isWeb) {
        // WEB: Convert blob to File
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
        // NATIVE: Use React Native format
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

    setPosts((p) => [data.post, ...p])
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
    } catch (e) {
      // Rollback on error
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

  const deletePost = async (postId) => {
    if (!isReady) return
    await del(`${API_URL}/posts/${postId}`)
    setPosts((p) => p.filter((x) => x._id !== postId))
  }

  const deleteStatus = async (statusId) => {
    if (!isReady) return
    await del(`${API_URL}/status/${statusId}`)

    // If deleting your own status
    if (myStatus?._id === statusId) {
      setMyStatus(null)
    }

    setStatuses((p) => p.filter((x) => x._id !== statusId))
  }

  // ─── Auto Fetch on Mount ────────────────────────────────
  useEffect(() => {
    if (isReady) refetch()
  }, [isReady, refetch])

  const value = {
    posts,
    statuses,
    myStatus, // Your own status
    loading,
    error,
    createPost, // Unified: handles both posts and statuses
    toggleLike,
    deletePost,
    deleteStatus,
    refetch,
  }

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>
}

// ✅ Hook
export const usePosts = () => useContext(PostsContext)
