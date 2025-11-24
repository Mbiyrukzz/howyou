import { Alert, Platform } from 'react-native'
import { useState } from 'react'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { Camera } from 'expo-camera'

export const useMediaPicker = () => {
  const [selectedFiles, setSelectedFiles] = useState([])

  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await Camera.requestCameraPermissionsAsync()
    const { status: libraryStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync()

    return {
      camera: cameraStatus === 'granted',
      library: libraryStatus === 'granted',
    }
  }

  const takePhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Camera Unavailable',
          'Taking photos is not supported in the web browser.'
        )
        return null
      }

      const permissions = await Camera.requestCameraPermissionsAsync()
      if (permissions.status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required')
        return null
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (result.canceled || !result.assets?.[0]) return null

      const asset = result.assets[0]
      return {
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      }
    } catch (error) {
      console.error('Take photo error:', error)
      Alert.alert('Error', 'Failed to take photo')
      return null
    }
  }

  const recordVideo = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Video Recording Unavailable',
          'Video recording is not supported in browser.'
        )
        return null
      }

      const permissions = await Camera.requestCameraPermissionsAsync()
      if (permissions.status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required')
        return null
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60,
      })

      if (result.canceled || !result.assets?.[0]) return null

      const asset = result.assets[0]
      return {
        uri: asset.uri,
        name: asset.fileName || `video_${Date.now()}.mp4`,
        type: 'video/mp4',
      }
    } catch (error) {
      console.error('Record video error:', error)
      Alert.alert('Error', 'Failed to record video')
      return null
    }
  }

  const pickImageFromLibrary = async () => {
    try {
      const permissions = await requestPermissions()
      if (!permissions.library) {
        Alert.alert('Permission denied', 'Media library permission is required')
        return null
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        videoMaxDuration: 60,
      })

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0]
        let fileType = asset.type || 'image/jpeg'
        let fileName = asset.fileName || `file_${Date.now()}`

        if (asset.type === 'video') {
          fileType = 'video/mp4'
          fileName = fileName.includes('.mp4') ? fileName : `${fileName}.mp4`
        }

        return {
          uri: asset.uri,
          name: fileName,
          type: fileType,
        }
      }
      return null
    } catch (error) {
      console.error('Pick media error:', error)
      Alert.alert('Error', 'Failed to pick media')
      return null
    }
  }

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*', 'audio/*', 'application/pdf'],
        multiple: false,
      })

      if (result.canceled || !result.assets?.length) return null

      const asset = result.assets[0]
      return {
        uri: asset.uri,
        name: asset.name || `file_${Date.now()}`,
        type: asset.mimeType || 'application/octet-stream',
      }
    } catch (err) {
      console.error('File picker error:', err)
      Alert.alert('Error', 'Failed to pick file')
      return null
    }
  }

  const pickMultipleFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*', 'audio/*', 'application/pdf'],
        multiple: true,
      })

      if (result.canceled || !result.assets?.length) return []

      return result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name || `file_${Date.now()}`,
        type: asset.mimeType || 'application/octet-stream',
      }))
    } catch (err) {
      console.error('File picker error:', err)
      Alert.alert('Error', 'Failed to pick files')
      return []
    }
  }

  const addFiles = (files) => {
    setSelectedFiles((prev) => [...prev, ...files])
  }

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const clearFiles = () => {
    setSelectedFiles([])
  }

  return {
    selectedFiles,
    takePhoto,
    recordVideo,
    pickImageFromLibrary,
    pickFile,
    pickMultipleFiles,
    addFiles,
    removeFile,
    clearFiles,
  }
}
