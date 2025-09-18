import React, { useState, useRef } from 'react'
import {
  FlatList,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

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
  justify-content: center;
  align-items: center;
`

const PostImagePlaceholder = styled.Text`
  color: #95a5a6;
  font-size: 16px;
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

// Mock data
const mockStories = [
  { id: '1', name: 'Your Story', color: '#2ecc71', hasStory: false },
  { id: '2', name: 'Emma', color: '#e74c3c', hasStory: true },
  { id: '3', name: 'Alex', color: '#f39c12', hasStory: true },
  { id: '4', name: 'Sarah', color: '#9b59b6', hasStory: true },
  { id: '5', name: 'Mike', color: '#34495e', hasStory: true },
  { id: '6', name: 'Lisa', color: '#1abc9c', hasStory: false },
]

const mockPosts = [
  {
    id: '1',
    username: 'Emma Davis',
    timestamp: '2 hours ago',
    content:
      'Just finished an amazing hike in the mountains! The view was absolutely breathtaking. Nature has a way of putting everything into perspective. 🏔️',
    avatarColor: '#e74c3c',
    hasImage: true,
    likes: 42,
    comments: 8,
    shares: 3,
    isLiked: true,
  },
  {
    id: '2',
    username: 'Alex Chen',
    timestamp: '4 hours ago',
    content:
      'Working on a new design project and loving every minute of it! Sometimes the best ideas come when you least expect them.',
    avatarColor: '#f39c12',
    hasImage: false,
    likes: 28,
    comments: 12,
    shares: 2,
    isLiked: false,
  },
  {
    id: '3',
    username: 'Sarah Johnson',
    timestamp: '6 hours ago',
    content:
      "Coffee shop vibes and good conversations make for the perfect afternoon. What's everyone up to today?",
    avatarColor: '#9b59b6',
    hasImage: true,
    likes: 35,
    comments: 15,
    shares: 1,
    isLiked: true,
  },
  {
    id: '4',
    username: 'Mike Wilson',
    timestamp: '8 hours ago',
    content:
      "Finally launched our new app! It's been months of hard work but seeing it come together is incredibly rewarding. Thanks to everyone who supported us along the way! 🚀",
    avatarColor: '#34495e',
    hasImage: false,
    likes: 67,
    comments: 23,
    shares: 8,
    isLiked: false,
  },
]

const getInitials = (name) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

const StoryComponent = ({ item, onPress }) => (
  <StoryItem onPress={() => onPress(item)}>
    <StoryAvatar color={item.color} hasStory={item.hasStory}>
      <StoryAvatarText>{getInitials(item.name)}</StoryAvatarText>
    </StoryAvatar>
    <StoryName numberOfLines={1}>{item.name}</StoryName>
  </StoryItem>
)

const PostComponent = ({ item, onLike, onComment, onShare, onMenuPress }) => (
  <PostCard>
    <PostHeader>
      <PostAvatar color={item.avatarColor}>
        <PostAvatarText>{getInitials(item.username)}</PostAvatarText>
      </PostAvatar>
      <PostUserInfo>
        <PostUsername>{item.username}</PostUsername>
        <PostTimestamp>{item.timestamp}</PostTimestamp>
      </PostUserInfo>
      <PostMenuButton onPress={() => onMenuPress(item)}>
        <Ionicons name="ellipsis-horizontal" size={20} color="#7f8c8d" />
      </PostMenuButton>
    </PostHeader>

    <PostContent>{item.content}</PostContent>

    {item.hasImage && (
      <PostImage>
        <Ionicons name="image-outline" size={40} color="#95a5a6" />
        <PostImagePlaceholder>Photo</PostImagePlaceholder>
      </PostImage>
    )}

    <PostActions>
      <ActionButton active={item.isLiked} onPress={() => onLike(item.id)}>
        <Ionicons
          name={item.isLiked ? 'heart' : 'heart-outline'}
          size={20}
          color={item.isLiked ? '#e74c3c' : '#7f8c8d'}
        />
        <ActionText active={item.isLiked}>{item.likes}</ActionText>
      </ActionButton>

      <ActionButton onPress={() => onComment(item.id)}>
        <Ionicons name="chatbubble-outline" size={18} color="#7f8c8d" />
        <ActionText>{item.comments}</ActionText>
      </ActionButton>

      <ActionButton onPress={() => onShare(item.id)}>
        <Ionicons name="share-outline" size={18} color="#7f8c8d" />
        <ActionText>{item.shares}</ActionText>
      </ActionButton>
    </PostActions>
  </PostCard>
)

export default function PostsScreen({ navigation }) {
  const [posts, setPosts] = useState(mockPosts)
  const [refreshing, setRefreshing] = useState(false)
  const scrollY = useRef(new Animated.Value(0)).current

  const handleStoryPress = (story) => {
    console.log('Story pressed:', story.name)
  }

  const handleLike = (postId) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    )
  }

  const handleComment = (postId) => {
    console.log('Comment on post:', postId)
    // Navigate to comments screen or show comment modal
  }

  const handleShare = (postId) => {
    console.log('Share post:', postId)
    // Handle sharing functionality
  }

  const handleMenuPress = (post) => {
    console.log('Menu pressed for post:', post.id)
    // Show options menu
  }

  const handleCreatePost = () => {
    console.log('Create new post')
    // Navigate to create post screen
  }

  const handleRefresh = () => {
    setRefreshing(true)
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }

  const HeaderComponent = () => (
    <>
      <Header>
        <HeaderTop>
          <HeaderTitle>Posts</HeaderTitle>
          <HeaderButton>
            <Ionicons name="notifications-outline" size={24} color="#7f8c8d" />
          </HeaderButton>
        </HeaderTop>

        <StoriesContainer>
          <StoriesList
            data={mockStories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <StoryComponent item={item} onPress={handleStoryPress} />
            )}
          />
        </StoriesContainer>
      </Header>
    </>
  )

  return (
    <Container>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={HeaderComponent}
        renderItem={({ item }) => (
          <PostComponent
            item={item}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onMenuPress={handleMenuPress}
          />
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      />

      <FloatingActionButton onPress={handleCreatePost}>
        <Ionicons name="add" size={28} color="#fff" />
      </FloatingActionButton>
    </Container>
  )
}
