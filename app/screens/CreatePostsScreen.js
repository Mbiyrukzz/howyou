// screens/CreatePostScreen.js
import React, { useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { usePosts } from '../providers/PostsProvider'

const Container = styled.View`
  flex: 1;
  background-color: #fff;
`

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  padding-top: 50px;
`

const HeaderButton = styled.TouchableOpacity`
  padding: 8px;
`

const HeaderButtonText = styled.Text`
  font-size: 16px;
  color: ${(props) => (props.primary ? '#3498db' : '#7f8c8d')};
  font-weight: ${(props) => (props.primary ? '600' : '400')};
`

const HeaderTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
`

const ContentContainer = styled.ScrollView`
  flex: 1;
`

const TextInputContainer = styled.View`
  padding: 20px;
`

const StyledTextInput = styled.TextInput`
  font-size: 16px;
  color: #2c3e50;
  min-height: 150px;
  text-align-vertical: top;
`

const ImagesContainer = styled.View`
  padding: 0 20px;
`

const ImageGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  margin: -4px;
`

const ImageItem = styled.View`
  width: ${(props) => (props.count === 1 ? '100%' : '48%')};
  aspect-ratio: ${(props) => (props.count === 1 ? '16/9' : '1')};
  margin: 4px;
  border-radius: 12px;
  overflow: hidden;
  background-color: #f8f9fa;
  position: relative;
`

const RemoveImageButton = styled.TouchableOpacity`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: rgba(0, 0, 0, 0.6);
  justify-content: center;
  align-items: center;
  z-index: 10;
`

const ActionBar = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 16px 20px;
  border-top-width: 1px;
  border-top-color: #e9ecef;
  background-color: #fff;
`

const ActionButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: #f8f9fa;
  margin-right: 12px;
`

const ActionButtonText = styled.Text`
  font-size: 14px;
  color: #2c3e50;
  font-weight: 500;
  margin-left: 8px;
`

const CharacterCount = styled.Text`
  font-size: 12px;
  color: ${(props) => (props.warning ? '#e74c3c' : '#95a5a6')};
  margin-left: auto;
`

const LoadingOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  z-index: 100;
`

const LoadingText = styled.Text`
  color: #fff;
  font-size: 16px;
  margin-top: 12px;
  font-weight: 500;
`

const MAX_CHAR_LIMIT = 500
const MAX_IMAGES = 10

export default function CreatePostScreen({ navigation }) {
  const { createPost } = usePosts()

  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)

  const handlePickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert(
        'Limit Reached',
        `You can only add up to ${MAX_IMAGES} images`
      )
      return
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_IMAGES - images.length,
    })

    if (!result.canceled && result.assets) {
      setImages([...images, ...result.assets])
    }
  }

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handlePost = async () => {
    if (!content.trim() && images.length === 0) {
      Alert.alert('Empty Post', 'Please add some content or images')
      return
    }

    if (content.length > MAX_CHAR_LIMIT) {
      Alert.alert(
        'Too Long',
        `Post content must be less than ${MAX_CHAR_LIMIT} characters`
      )
      return
    }

    try {
      setLoading(true)

      // Convert images to the format expected by createPost
      const fileObjects = images.map((img, index) => ({
        uri: img.uri,
        name: img.fileName || `image_${Date.now()}_${index}.jpg`,
        type: img.type || 'image/jpeg',
        file: img.file, // For web
      }))

      await createPost(content, fileObjects)

      Alert.alert('Success', 'Post created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ])
    } catch (error) {
      console.error('Failed to create post:', error)
      Alert.alert('Error', error.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  const canPost = (content.trim() || images.length > 0) && !loading

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <Container>
        <Header>
          <HeaderButton onPress={() => navigation.goBack()}>
            <HeaderButtonText>Cancel</HeaderButtonText>
          </HeaderButton>

          <HeaderTitle>Create Post</HeaderTitle>

          <HeaderButton onPress={handlePost} disabled={!canPost}>
            <HeaderButtonText primary={canPost}>Post</HeaderButtonText>
          </HeaderButton>
        </Header>

        <ContentContainer>
          <TextInputContainer>
            <StyledTextInput
              placeholder="What's on your mind?"
              placeholderTextColor="#95a5a6"
              multiline
              value={content}
              onChangeText={setContent}
              maxLength={MAX_CHAR_LIMIT}
              autoFocus
            />
          </TextInputContainer>

          {images.length > 0 && (
            <ImagesContainer>
              <ImageGrid>
                {images.map((image, index) => (
                  <ImageItem key={index} count={images.length}>
                    <Image
                      source={{ uri: image.uri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                    <RemoveImageButton onPress={() => handleRemoveImage(index)}>
                      <Ionicons name="close" size={20} color="#fff" />
                    </RemoveImageButton>
                  </ImageItem>
                ))}
              </ImageGrid>
            </ImagesContainer>
          )}
        </ContentContainer>

        <ActionBar>
          <ActionButton onPress={handlePickImages}>
            <Ionicons name="image-outline" size={20} color="#3498db" />
            <ActionButtonText>
              Photo {images.length > 0 && `(${images.length})`}
            </ActionButtonText>
          </ActionButton>

          <CharacterCount warning={content.length > MAX_CHAR_LIMIT * 0.9}>
            {content.length}/{MAX_CHAR_LIMIT}
          </CharacterCount>
        </ActionBar>

        {loading && (
          <LoadingOverlay>
            <ActivityIndicator size="large" color="#fff" />
            <LoadingText>Creating post...</LoadingText>
          </LoadingOverlay>
        )}
      </Container>
    </KeyboardAvoidingView>
  )
}
