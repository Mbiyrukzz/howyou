// screens/PostsScreen.js
import React, { useRef, useState } from 'react'
import {
  FlatList,
  StatusBar,
  Animated,
  RefreshControl,
  Alert,
  Image,
  Dimensions,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { usePosts } from '../providers/PostsProvider' // ← Single provider

const { width: screenWidth } = Dimensions.get('window')

// ─────────────────────────────────────────────────────────────────────────────
// ─── STYLED COMPONENTS ───────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`

const Header = styled.View`
  background-color: #fff;
  padding: 50px 20px 16px 20px;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 5;
`

const HeaderTop = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`

const HeaderTitle = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
`

const HeaderButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
`

const StoriesContainer = styled.View`
  height: 100px;
  margin-bottom: 8px;
`

const StoriesList = styled.FlatList`
  padding-left: 20px;
`

const StoryItem = styled.TouchableOpacity`
  align-items: center;
  margin-right: 16px;
  width: 70px;
`

const StoryAvatar = styled.View`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: ${(props) => props.color || '#3498db'};
  justify-content: center;
  align-items: center;
  border-width: ${(props) => (props.hasStory ? '3px' : '0px')};
  border-color: #e74c3c;
  margin-bottom: 4px;
`

const StoryAvatarText = styled.Text`
  color: #fff;
  font-size: 18px;
  font-weight: bold;
`

const StoryName = styled.Text`
  font-size: 12px;
  color: #7f8c8d;
  text-align: center;
`

const PostCard = styled.View`
  background-color: #fff;
  margin: 8px 20px;
  border-radius: 16px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`

const PostHeader = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  padding-bottom: 12px;
`

const PostAvatar = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${(props) => props.color || '#3498db'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const PostAvatarText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: bold;
`

const PostUserInfo = styled.View`
  flex: 1;
`

const PostUsername = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
`

const PostTimestamp = styled.Text`
  font-size: 12px;
  color: #95a5a6;
  margin-top: 2px;
`

const PostMenuButton = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  justify-content: center;
  align-items: center;
`

const PostContent = styled.Text`
  font-size: 16px;
  line-height: 22px;
  color: #2c3e50;
  padding: 0px 16px 12px 16px;
`

const PostImage = styled.View`
  height: 250px;
  background-color: #ecf0f1;
  margin: 0px 16px 12px 16px;
  border-radius: 12px;
  overflow: hidden;
`

const PostActions = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 8px 16px 16px 16px;
  border-top-width: 1px;
  border-top-color: #f8f9fa;
`

const ActionButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  margin-right: 16px;
  border-radius: 20px;
  background-color: ${(props) => (props.active ? '#e3f2fd' : 'transparent')};
`

const ActionText = styled.Text`
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => (props.active ? '#2196f3' : '#7f8c8d')};
  margin-left: 6px;
`

const FloatingActionButton = styled.TouchableOpacity`
  position: absolute;
  right: 20px;
  bottom: 30px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: #3498db;
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 5px;
  elevation: 8;
`

// ─────────────────────────────────────────────────────────────────────────────
// ─── UTILS ───────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
const getInitials = (name) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

// ─────────────────────────────────────────────────────────────────────────────
// ─── STORY COMPONENT ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
const StoryComponent = ({ item, onPress }) => {
  const hasStory = !!item.fileUrl
  return (
    <StoryItem onPress={() => onPress(item)}>
      <StoryAvatar
        color={item.userAvatarColor || '#3498db'}
        hasStory={hasStory}
      >
        <StoryAvatarText>
          {getInitials(item.userName || item.name)}
        </StoryAvatarText>
      </StoryAvatar>
      <StoryName numberOfLines={1}>{item.userName || item.name}</StoryName>
    </StoryItem>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── POST COMPONENT ───────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
const PostComponent = ({ item, onLike, onComment, onShare, onMenuPress }) => (
  <PostCard>
    <PostHeader>
      <PostAvatar color={item.avatarColor || '#3498db'}>
        <PostAvatarText>{getInitials(item.username)}</PostAvatarText>
      </PostAvatar>
      <PostUserInfo>
        <PostUsername>{item.username}</PostUsername>
        <PostTimestamp>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </PostTimestamp>
      </PostUserInfo>
      <PostMenuButton onPress={() => onMenuPress(item)}>
        <Ionicons name="ellipsis-horizontal" size={20} color="#7f8c8d" />
      </PostMenuButton>
    </PostHeader>

    <PostContent>{item.content}</PostContent>

    {item.files?.[0] && (
      <PostImage>
        <Image
          source={{ uri: item.files[0].url }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </PostImage>
    )}

    <PostActions>
      <ActionButton
        active={item.isLiked}
        onPress={() => onLike(item._id, item.isLiked)}
      >
        <Ionicons
          name={item.isLiked ? 'heart' : 'heart-outline'}
          size={20}
          color={item.isLiked ? '#e74c3c' : '#7f8c8d'}
        />
        <ActionText active={item.isLiked}>{item.likes}</ActionText>
      </ActionButton>

      <ActionButton onPress={() => onComment(item._id)}>
        <Ionicons name="chatbubble-outline" size={18} color="#7f8c8d" />
        <ActionText>{item.comments || 0}</ActionText>
      </ActionButton>

      <ActionButton onPress={() => onShare(item._id)}>
        <Ionicons name="share-outline" size={18} color="#7f8c8d" />
        <ActionText>{item.shares || 0}</ActionText>
      </ActionButton>
    </PostActions>
  </PostCard>
)

// ─────────────────────────────────────────────────────────────────────────────
// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
export default function PostsScreen({ navigation }) {
  const {
    posts,
    statuses,
    loading,
    refetch,
    toggleLike,
    deletePost,
    createPost,
  } = usePosts()

  const [refreshing, setRefreshing] = useState(false)
  const scrollY = useRef(new Animated.Value(0)).current

  const yourStory = {
    _id: 'your-story',
    userName: 'Your Story',
    userAvatarColor: '#2ecc71',
  }

  const stories = [yourStory, ...statuses]

  const handleStoryPress = async (item) => {
    if (item._id === 'your-story') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo access to add status')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        try {
          await createPost(result.assets[0])
          Alert.alert('Success', 'Status added!')
        } catch (error) {
          console.error('Failed to add status:', error)
          Alert.alert('Error', error.message || 'Failed to add status')
        }
      }
    } else {
      navigation.navigate('StatusViewer', { status: item })
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    Promise.all([refetch()]).finally(() => setRefreshing(false))
  }

  const HeaderComponent = () => (
    <Header>
      <HeaderTop>
        <HeaderTitle>Posts</HeaderTitle>
        <HeaderButton>
          <Ionicons name="notifications-outline" size={24} color="#7f8c8d" />
        </HeaderButton>
      </HeaderTop>

      <StoriesContainer>
        <StoriesList
          data={stories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._id || 'your-story'}
          renderItem={({ item }) => (
            <StoryComponent item={item} onPress={handleStoryPress} />
          )}
        />
      </StoriesContainer>
    </Header>
  )

  return (
    <Container>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={HeaderComponent}
        renderItem={({ item }) => (
          <PostComponent
            item={item}
            onLike={toggleLike}
            onComment={(id) =>
              navigation.navigate('PostDetail', { postId: id })
            }
            onShare={() => {}}
            onMenuPress={(post) => {
              Alert.alert('Delete Post', 'Are you sure?', [
                { text: 'Cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deletePost(post._id),
                },
              ])
            }}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      />

      <FloatingActionButton onPress={() => navigation.navigate('CreatePost')}>
        <Ionicons name="add" size={28} color="#fff" />
      </FloatingActionButton>
    </Container>
  )
}
