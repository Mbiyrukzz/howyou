import React from 'react'
import { FlatList, TouchableOpacity, StatusBar } from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`

const Header = styled.View`
  background-color: #fff;
  padding: 60px 20px 20px 20px;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 5;
`

const HeaderTitle = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 8px;
`

const HeaderSubtitle = styled.Text`
  font-size: 16px;
  color: #7f8c8d;
`

const SearchContainer = styled.View`
  background-color: #fff;
  margin: 16px 20px;
  padding: 12px 16px;
  border-radius: 25px;
  flex-direction: row;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 3;
`

const SearchInput = styled.TextInput`
  flex: 1;
  margin-left: 12px;
  font-size: 16px;
  color: #2c3e50;
`

const ChatItem = styled.TouchableOpacity`
  background-color: #fff;
  margin: 4px 20px;
  padding: 16px;
  border-radius: 16px;
  flex-direction: row;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
`

const Avatar = styled.View`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  background-color: ${(props) => props.color || '#3498db'};
  justify-content: center;
  align-items: center;
  margin-right: 16px;
`

const AvatarText = styled.Text`
  color: #fff;
  font-size: 18px;
  font-weight: bold;
`

const ChatInfo = styled.View`
  flex: 1;
`

const ChatName = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
`

const LastMessage = styled.Text`
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 4px;
`

const ChatMeta = styled.View`
  align-items: flex-end;
`

const TimeStamp = styled.Text`
  font-size: 12px;
  color: #95a5a6;
  margin-bottom: 4px;
`

const UnreadBadge = styled.View`
  background-color: #e74c3c;
  border-radius: 10px;
  min-width: 20px;
  height: 20px;
  justify-content: center;
  align-items: center;
  padding-horizontal: 6px;
`

const UnreadText = styled.Text`
  color: #fff;
  font-size: 12px;
  font-weight: bold;
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

const EmptyStateContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
`

const EmptyStateText = styled.Text`
  font-size: 18px;
  color: #7f8c8d;
  text-align: center;
  margin-top: 16px;
`

// Mock data - replace with your actual data
const mockChats = [
  {
    id: '1',
    name: 'Sarah Johnson',
    lastMessage: 'Hey! How are you doing today?',
    timestamp: '2:30 PM',
    unreadCount: 2,
    avatarColor: '#e74c3c',
  },
  {
    id: '2',
    name: 'Team Alpha',
    lastMessage: 'Meeting scheduled for tomorrow at 10 AM',
    timestamp: '1:15 PM',
    unreadCount: 0,
    avatarColor: '#2ecc71',
  },
  {
    id: '3',
    name: 'Mike Chen',
    lastMessage: 'Thanks for the help with the project!',
    timestamp: '12:45 PM',
    unreadCount: 1,
    avatarColor: '#f39c12',
  },
  {
    id: '4',
    name: 'Design Team',
    lastMessage: 'New mockups are ready for review',
    timestamp: '11:30 AM',
    unreadCount: 5,
    avatarColor: '#9b59b6',
  },
  {
    id: '5',
    name: 'Emma Davis',
    lastMessage: "Let's catch up soon!",
    timestamp: 'Yesterday',
    unreadCount: 0,
    avatarColor: '#34495e',
  },
]

const getInitials = (name) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

const ChatItemComponent = ({ item, onPress }) => (
  <ChatItem onPress={() => onPress(item)}>
    <Avatar color={item.avatarColor}>
      <AvatarText>{getInitials(item.name)}</AvatarText>
    </Avatar>
    <ChatInfo>
      <ChatName>{item.name}</ChatName>
      <LastMessage numberOfLines={1}>{item.lastMessage}</LastMessage>
    </ChatInfo>
    <ChatMeta>
      <TimeStamp>{item.timestamp}</TimeStamp>
      {item.unreadCount > 0 && (
        <UnreadBadge>
          <UnreadText>{item.unreadCount}</UnreadText>
        </UnreadBadge>
      )}
    </ChatMeta>
  </ChatItem>
)

export default function ChatsScreen({ navigation }) {
  const handleChatPress = (chat) => {
    navigation.navigate('ChatDetail', { chat })
  }

  const handleNewChat = () => {
    // Navigate to NewChatScreen
    navigation.navigate('NewChats')
  }

  const renderEmptyState = () => (
    <EmptyStateContainer>
      <Ionicons name="chatbubbles-outline" size={80} color="#bdc3c7" />
      <EmptyStateText>
        No conversations yet{'\n'}Start a new chat to get going!
      </EmptyStateText>
    </EmptyStateContainer>
  )

  return (
    <Container>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <Header>
        <HeaderTitle>Messages</HeaderTitle>
        <HeaderSubtitle>{mockChats.length} conversations</HeaderSubtitle>
      </Header>

      <SearchContainer>
        <Ionicons name="search-outline" size={20} color="#7f8c8d" />
        <SearchInput
          placeholder="Search conversations..."
          placeholderTextColor="#bdc3c7"
        />
      </SearchContainer>

      <FlatList
        data={mockChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatItemComponent item={item} onPress={handleChatPress} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={renderEmptyState}
      />

      <FloatingActionButton onPress={handleNewChat}>
        <Ionicons name="add" size={28} color="#fff" />
      </FloatingActionButton>
    </Container>
  )
}
