// screens/CreatePostScreen.js
import { useState } from 'react'
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
  Animated,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { usePosts } from '../providers/PostsProvider'
import { LinearGradient } from 'expo-linear-gradient'

const Container = styled.View`
  flex: 1;
  background-color: #f8fafc;
`

const Header = styled.View`
  background-color: #fff;
  padding-top: 50px;
  padding-bottom: 16px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 8px;
  elevation: 4;
`

const HeaderContent = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
`

const HeaderButton = styled.TouchableOpacity`
  padding: 8px 12px;
  border-radius: 8px;
  background-color: ${(props) => (props.cancel ? '#f1f5f9' : 'transparent')};
`

const HeaderButtonText = styled.Text`
  font-size: 16px;
  color: ${(props) => (props.primary ? '#3498db' : '#64748b')};
  font-weight: ${(props) => (props.primary ? '700' : '600')};
`

const HeaderTitle = styled.Text`
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
`

const ContentContainer = styled.ScrollView`
  flex: 1;
`

const UserSection = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 20px;
  background-color: #fff;
  margin-bottom: 2px;
`

const UserAvatar = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: #3498db;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const UserAvatarText = styled.Text`
  color: #fff;
  font-size: 18px;
  font-weight: bold;
`

const UserInfo = styled.View`
  flex: 1;
`

const UserName = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
`

const PostVisibility = styled.View`
  flex-direction: row;
  align-items: center;
`

const VisibilityText = styled.Text`
  font-size: 13px;
  color: #64748b;
  margin-left: 4px;
`

const TextInputContainer = styled.View`
  background-color: #fff;
  padding: 20px;
  min-height: 200px;
`

const StyledTextInput = styled.TextInput`
  font-size: 17px;
  color: #1e293b;
  line-height: 24px;
  text-align-vertical: top;
  border-width: 0;
  outline-width: 0;
`

const ImagesContainer = styled.View`
  background-color: #fff;
  padding: 0 16px 16px 16px;
  margin-top: 2px;
`

const ImageGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  margin: -6px;
`

const ImageItem = styled.View`
  width: ${(props) => {
    if (props.count === 1) return '100%'
    if (props.count === 2) return '48%'
    return '31%'
  }};
  aspect-ratio: ${(props) => (props.count === 1 ? '16/9' : '1')};
  margin: 6px;
  border-radius: 16px;
  overflow: hidden;
  background-color: #f1f5f9;
  position: relative;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`

const RemoveImageButton = styled.TouchableOpacity`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background-color: rgba(0, 0, 0, 0.7);
  justify-content: center;
  align-items: center;
  z-index: 10;
`

const ImageCountBadge = styled.View`
  position: absolute;
  top: 8px;
  left: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 4px 10px;
  border-radius: 12px;
`

const ImageCountText = styled.Text`
  color: #fff;
  font-size: 12px;
  font-weight: 600;
`

const ActionBarContainer = styled.View`
  background-color: #fff;
  border-top-width: 1px;
  border-top-color: #f1f5f9;
  shadow-color: #000;
  shadow-offset: 0px -2px;
  shadow-opacity: 0.05;
  shadow-radius: 8px;
  elevation: 4;
`

const ActionBar = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 16px 20px;
`

const ActionButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  border-radius: 12px;
  background-color: ${(props) => (props.active ? '#e0f2fe' : '#f8fafc')};
  margin-right: 12px;
  border-width: 1px;
  border-color: ${(props) => (props.active ? '#3498db' : '#e2e8f0')};
`

const ActionButtonText = styled.Text`
  font-size: 14px;
  color: ${(props) => (props.active ? '#3498db' : '#64748b')};
  font-weight: 600;
  margin-left: 8px;
`

const PostButtonWrapper = styled.View`
  margin-left: auto;
`

const PostButton = styled.TouchableOpacity`
  padding: 12px 32px;
  border-radius: 12px;
  background-color: ${(props) => (props.disabled ? '#cbd5e1' : '#3498db')};
  shadow-color: ${(props) => (props.disabled ? 'transparent' : '#3498db')};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 6px;
  elevation: ${(props) => (props.disabled ? 0 : 6)};
`

const PostButtonText = styled.Text`
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  text-align: center;
`

const CharacterCountContainer = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 8px 20px;
  background-color: ${(props) => (props.warning ? '#fef2f2' : '#f8fafc')};
`

const CharacterCount = styled.Text`
  font-size: 13px;
  color: ${(props) => (props.warning ? '#ef4444' : '#64748b')};
  font-weight: 600;
`

const ProgressBar = styled.View`
  height: 3px;
  background-color: #e2e8f0;
  margin-left: 8px;
  flex: 1;
  border-radius: 2px;
  overflow: hidden;
`

const ProgressFill = styled.View`
  height: 100%;
  background-color: ${(props) => {
    if (props.percentage > 90) return '#ef4444'
    if (props.percentage > 75) return '#f59e0b'
    return '#3498db'
  }};
  width: ${(props) => props.percentage}%;
`

const LoadingOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  justify-content: center;
  align-items: center;
  z-index: 100;
`

const LoadingCard = styled.View`
  background-color: #fff;
  padding: 32px;
  border-radius: 20px;
  align-items: center;
  min-width: 200px;
  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.3;
  shadow-radius: 16px;
  elevation: 10;
`

const LoadingText = styled.Text`
  color: #1e293b;
  font-size: 17px;
  margin-top: 16px;
  font-weight: 600;
`

const LoadingSubtext = styled.Text`
  color: #64748b;
  font-size: 13px;
  margin-top: 4px;
`

const AddMoreButton = styled.TouchableOpacity`
  width: 100%;
  aspect-ratio: ${(props) => (props.count === 1 ? '16/9' : '1')};
  border-radius: 16px;
  background-color: #f8fafc;
  border-width: 2px;
  border-color: #cbd5e1;
  border-style: dashed;
  justify-content: center;
  align-items: center;
`

const AddMoreText = styled.Text`
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  margin-top: 8px;
`

const EmptyStateContainer = styled.View`
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background-color: #fff;
  margin-top: 2px;
`

const EmptyStateIcon = styled.View`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: #f1f5f9;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
`

const EmptyStateText = styled.Text`
  font-size: 15px;
  color: #64748b;
  text-align: center;
  line-height: 22px;
`

const MAX_CHAR_LIMIT = 500
const MAX_IMAGES = 10

export default function CreatePostScreen({ navigation, route }) {
  const { createPost } = usePosts()
  const userName = route?.params?.userName || 'You'

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
  const characterPercentage = (content.length / MAX_CHAR_LIMIT) * 100
  const isNearLimit = characterPercentage > 75

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <Container>
        <Header>
          <HeaderContent>
            <HeaderButton cancel onPress={() => navigation.goBack()}>
              <HeaderButtonText>Cancel</HeaderButtonText>
            </HeaderButton>

            <HeaderTitle>Create Post</HeaderTitle>

            <View style={{ width: 70 }} />
          </HeaderContent>
        </Header>

        <ContentContainer showsVerticalScrollIndicator={false}>
          <UserSection>
            <UserAvatar>
              <UserAvatarText>
                {userName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2)}
              </UserAvatarText>
            </UserAvatar>
            <UserInfo>
              <UserName>{userName}</UserName>
              <PostVisibility>
                <Ionicons name="globe-outline" size={14} color="#64748b" />
                <VisibilityText>Public</VisibilityText>
              </PostVisibility>
            </UserInfo>
          </UserSection>

          <TextInputContainer>
            <StyledTextInput
              placeholder="What's on your mind?"
              placeholderTextColor="#94a3b8"
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
                    {index === 0 && images.length > 1 && (
                      <ImageCountBadge>
                        <ImageCountText>{images.length} photos</ImageCountText>
                      </ImageCountBadge>
                    )}
                    <RemoveImageButton onPress={() => handleRemoveImage(index)}>
                      <Ionicons name="close" size={16} color="#fff" />
                    </RemoveImageButton>
                  </ImageItem>
                ))}
                {images.length < MAX_IMAGES && (
                  <ImageItem count={images.length}>
                    <AddMoreButton
                      onPress={handlePickImages}
                      count={images.length}
                    >
                      <Ionicons name="add" size={32} color="#94a3b8" />
                      <AddMoreText>Add More</AddMoreText>
                    </AddMoreButton>
                  </ImageItem>
                )}
              </ImageGrid>
            </ImagesContainer>
          )}

          {images.length === 0 && !content && (
            <EmptyStateContainer>
              <EmptyStateIcon>
                <Ionicons name="create-outline" size={36} color="#94a3b8" />
              </EmptyStateIcon>
              <EmptyStateText>
                Share your thoughts, photos, or updates{'\n'}with your community
              </EmptyStateText>
            </EmptyStateContainer>
          )}
        </ContentContainer>

        <ActionBarContainer>
          {content.length > 0 && (
            <CharacterCountContainer warning={isNearLimit}>
              <CharacterCount warning={isNearLimit}>
                {content.length}/{MAX_CHAR_LIMIT}
              </CharacterCount>
              <ProgressBar>
                <ProgressFill percentage={characterPercentage} />
              </ProgressBar>
            </CharacterCountContainer>
          )}

          <ActionBar>
            <ActionButton onPress={handlePickImages} active={images.length > 0}>
              <Ionicons
                name="image"
                size={20}
                color={images.length > 0 ? '#3498db' : '#64748b'}
              />
              <ActionButtonText active={images.length > 0}>
                {images.length > 0
                  ? `${images.length} Photo${images.length > 1 ? 's' : ''}`
                  : 'Photo'}
              </ActionButtonText>
            </ActionButton>

            <PostButtonWrapper>
              <PostButton onPress={handlePost} disabled={!canPost}>
                <PostButtonText>Post</PostButtonText>
              </PostButton>
            </PostButtonWrapper>
          </ActionBar>
        </ActionBarContainer>

        {loading && (
          <LoadingOverlay>
            <LoadingCard>
              <ActivityIndicator size="large" color="#3498db" />
              <LoadingText>Creating post...</LoadingText>
              <LoadingSubtext>Please wait</LoadingSubtext>
            </LoadingCard>
          </LoadingOverlay>
        )}
      </Container>
    </KeyboardAvoidingView>
  )
}
