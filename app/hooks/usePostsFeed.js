import { useEffect, useState } from 'react'
import { Alert, Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { usePosts } from '../providers/PostsProvider'
import { useComments } from './useComments'

export const usePostsFeed = () => {
  const {
    posts,
    statuses,
    myStatus,
    loading,
    refetch,
    toggleLike,
    updatePost,
    deletePost,
    createPost,
    wsConnected,
    connectionState,
    wsReconnect,
    isPostOwner,
    currentUserId,
  } = usePosts()

  const { loadComments } = useComments()
  const [refreshing, setRefreshing] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [menuModalVisible, setMenuModalVisible] = useState(false)
  const [menuSelectedPost, setMenuSelectedPost] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (posts && posts.length > 0) {
      posts.forEach((post) => {
        loadComments(post._id)
      })
    }
  }, [posts])

  const handleRefresh = () => {
    setRefreshing(true)
    refetch().finally(() => setRefreshing(false))
  }

  // ✅ FIXED: Support both images AND videos
  const handleAddStatus = async () => {
    setModalVisible(false)

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to add status')
      return
    }

    // ✅ Allow both images and videos
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // This allows both photos and videos
      quality: 0.8,
      videoMaxDuration: 60, // Max 60 seconds for videos
      allowsEditing: false,
    })

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]

      console.log('📱 Selected media:', {
        uri: asset.uri,
        type: asset.type,
        mediaType: asset.mediaType, // This will be 'photo' or 'video'
        fileName: asset.fileName,
        width: asset.width,
        height: asset.height,
        duration: asset.duration,
      })

      try {
        await createPost(asset)

        const mediaType = asset.mediaType === 'video' ? 'Video' : 'Photo'
        if (Platform.OS === 'web') {
          alert(`${mediaType} status added!`)
        } else {
          Alert.alert('Success', `${mediaType} status added!`)
        }
      } catch (error) {
        console.error('Failed to add status:', error)
        if (error.status === 429 || error.message?.includes('Daily limit')) {
          Alert.alert(
            'Daily Limit Reached',
            'You can only post 5 statuses per day. Try again tomorrow!',
            [{ text: 'OK' }]
          )
        } else {
          Alert.alert('Error', error.message || 'Failed to add status')
        }
      }
    }
  }

  const handlePostMenu = (post) => {
    setMenuSelectedPost(post)
    setMenuModalVisible(true)
  }

  const handleUpdatePost = async (newContent) => {
    if (!editingPost) return

    try {
      await updatePost(editingPost._id, newContent)
      setEditModalVisible(false)
      setEditingPost(null)

      setTimeout(() => {
        if (Platform.OS === 'web') {
          alert('Post updated successfully!')
        } else {
          Alert.alert('Success', 'Post updated successfully')
        }
      }, 100)
    } catch (error) {
      Alert.alert('Error', 'Failed to update post. Please try again.')
      throw error
    }
  }

  const handleDeletePost = async () => {
    if (!menuSelectedPost) return

    setIsDeleting(true)
    try {
      await deletePost(menuSelectedPost._id)
      setMenuModalVisible(false)
      setMenuSelectedPost(null)

      setTimeout(() => {
        if (Platform.OS === 'web') {
          alert('Post deleted successfully!')
        } else {
          Alert.alert('Success', 'Post deleted successfully')
        }
      }, 100)
    } catch (error) {
      console.error('Delete post error:', error)
      if (Platform.OS === 'web') {
        alert('Failed to delete post: ' + (error.message || 'Unknown error'))
      } else {
        Alert.alert('Error', 'Failed to delete post. Please try again.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const yourStory = {
    _id: 'your-story',
    userName: 'Your Story',
    userAvatarColor: '#2ecc71',
    fileUrl: myStatus?.length > 0 ? myStatus[0].fileUrl : null,
    statusCount: myStatus?.length || 0,
    statuses: myStatus || [],
  }

  const stories = [yourStory, ...statuses]

  return {
    // Data
    posts,
    statuses,
    myStatus,
    loading,
    stories,
    yourStory,

    // States
    refreshing,
    modalVisible,
    editModalVisible,
    editingPost,
    menuModalVisible,
    menuSelectedPost,
    isDeleting,

    // Setters
    setModalVisible,
    setEditModalVisible,
    setEditingPost,
    setMenuModalVisible,
    setMenuSelectedPost,

    // Actions
    handleRefresh,
    handleAddStatus,
    handlePostMenu,
    handleUpdatePost,
    handleDeletePost,

    // Provider functions
    toggleLike,
    refetch,
    wsConnected,
    connectionState,
    wsReconnect,
    isPostOwner,
    currentUserId,
  }
}
