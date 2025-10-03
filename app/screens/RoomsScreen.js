import React, { useState } from 'react'
import styled from 'styled-components/native'
import { FlatList, Dimensions, Vibration } from 'react-native'
import { useNavigation } from '@react-navigation/native'

const { width } = Dimensions.get('window')

const Container = styled.View`
  flex: 1;
  background-color: #1a1a2e;
`

const Header = styled.View`
  padding: 60px 20px 30px 20px;
  background-color: rgba(255, 255, 255, 0.05);
`

const HeaderTitle = styled.Text`
  font-size: 32px;
  font-weight: 800;
  color: white;
  margin-bottom: 8px;
`

const HeaderSubtitle = styled.Text`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
`

const SearchContainer = styled.View`
  margin: 20px;
  margin-top: -15px;
`

const SearchInput = styled.TextInput`
  background-color: rgba(255, 255, 255, 0.1);
  padding: 16px 20px;
  border-radius: 25px;
  font-size: 16px;
  color: white;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.2);
`

const RoomsContainer = styled.View`
  flex: 1;
  padding: 0 20px;
`

const SectionTitle = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin-bottom: 15px;
  margin-left: 5px;
`

const RoomCard = styled.TouchableOpacity`
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
`

const RoomHeader = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 12px;
`

const RoomAvatar = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: ${(props) => props.color || '#0046FF'};
  align-items: center;
  justify-content: center;
  margin-right: 16px;
`

const RoomAvatarText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: 700;
`

const RoomInfo = styled.View`
  flex: 1;
`

const RoomName = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
`

const RoomMeta = styled.View`
  flex-direction: row;
  align-items: center;
`

const MemberCount = styled.Text`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin-right: 12px;
`

const OnlineIndicator = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${(props) => (props.online ? '#4ade80' : '#6b7280')};
  margin-right: 6px;
`

const OnlineCount = styled.Text`
  font-size: 13px;
  color: ${(props) => (props.online ? '#4ade80' : '#6b7280')};
`

const NotificationBadge = styled.View`
  background-color: #ef4444;
  border-radius: 10px;
  min-width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  margin-left: 12px;
  shadow-color: #ef4444;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.4;
  shadow-radius: 4px;
  elevation: 4;
`

const NotificationText = styled.Text`
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 0 6px;
`

const LastMessage = styled.Text`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
  line-height: 18px;
`

const MessageMeta = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`

const LastMessageTime = styled.Text`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
`

const RoomTags = styled.View`
  flex-direction: row;
  gap: 6px;
`

const Tag = styled.View`
  background-color: rgba(102, 126, 234, 0.2);
  padding: 4px 8px;
  border-radius: 12px;
`

const TagText = styled.Text`
  font-size: 11px;
  color: #a5b4fc;
  font-weight: 600;
`

const FloatingAddButton = styled.TouchableOpacity`
  position: absolute;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: #0046ff;
  align-items: center;
  justify-content: center;
  shadow-color: #0046ff;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.4;
  shadow-radius: 20px;
  elevation: 12;
`

const AddButtonText = styled.Text`
  color: white;
  font-size: 28px;
  font-weight: 300;
  line-height: 28px;
`

const TabContainer = styled.View`
  flex-direction: row;
  margin: 0 20px 20px 20px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 4px;
`

const Tab = styled.TouchableOpacity`
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  align-items: center;
  background-color: ${(props) => (props.active ? '#0046FF' : 'transparent')};
`

const TabText = styled.Text`
  color: ${(props) => (props.active ? 'white' : 'rgba(255, 255, 255, 0.6)')};
  font-weight: ${(props) => (props.active ? '700' : '500')};
  font-size: 14px;
`

export default function RoomsScreen() {
  const [searchText, setSearchText] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const navigation = useNavigation()

  const rooms = [
    {
      id: 1,
      name: 'React Developers',
      description: 'Discuss React, hooks, and best practices',
      members: 1247,
      onlineMembers: 89,
      lastMessage:
        'Sarah: Just released a new component library! Check it out 🚀',
      lastMessageTime: '2m ago',
      unreadCount: 5,
      tags: ['React', 'Frontend'],
      color: '#0046FF',
      isOnline: true,
    },
    {
      id: 2,
      name: 'Design System',
      description: 'UI/UX design discussions and resources',
      members: 823,
      onlineMembers: 34,
      lastMessage: 'Alex: New Figma templates are ready for review',
      lastMessageTime: '15m ago',
      unreadCount: 0,
      tags: ['Design', 'UI/UX'],
      color: '#10b981',
      isOnline: true,
    },
    {
      id: 3,
      name: 'Mobile Dev Hub',
      description: 'React Native, Flutter, and native development',
      members: 956,
      onlineMembers: 0,
      lastMessage: 'Mike: Anyone tried the new RN 0.73 release?',
      lastMessageTime: '2h ago',
      unreadCount: 12,
      tags: ['Mobile', 'React Native'],
      color: '#f59e0b',
      isOnline: false,
    },
    {
      id: 4,
      name: 'Backend Engineers',
      description: 'Server-side development, APIs, and databases',
      members: 2103,
      onlineMembers: 156,
      lastMessage: "Emma: GraphQL vs REST - what's your take?",
      lastMessageTime: '45m ago',
      unreadCount: 3,
      tags: ['Backend', 'API'],
      color: '#8b5cf6',
      isOnline: true,
    },
    {
      id: 5,
      name: 'Freelancers Unite',
      description: 'Tips, projects, and networking for freelancers',
      members: 445,
      onlineMembers: 23,
      lastMessage:
        'David: Just landed a 6-month contract! Thanks for the tips 💪',
      lastMessageTime: '1h ago',
      unreadCount: 0,
      tags: ['Freelance', 'Networking'],
      color: '#ef4444',
      isOnline: true,
    },
  ]

  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchText.toLowerCase()) ||
      room.tags.some((tag) =>
        tag.toLowerCase().includes(searchText.toLowerCase())
      )
  )

  const renderRoom = ({ item }) => (
    <RoomCard
      onPress={() => {
        Vibration.vibrate(10)
        navigation.navigate('RoomsDetail', { room: item })
      }}
    >
      <RoomHeader>
        <RoomAvatar color={item.color}>
          <RoomAvatarText>{item.name.charAt(0)}</RoomAvatarText>
        </RoomAvatar>
        <RoomInfo>
          <RoomName>{item.name}</RoomName>
          <RoomMeta>
            <MemberCount>{item.members} members</MemberCount>
            <OnlineIndicator online={item.isOnline} />
            <OnlineCount online={item.isOnline}>
              {item.onlineMembers} online
            </OnlineCount>
          </RoomMeta>
        </RoomInfo>
        {item.unreadCount > 0 && (
          <NotificationBadge>
            <NotificationText>{item.unreadCount}</NotificationText>
          </NotificationBadge>
        )}
      </RoomHeader>

      <LastMessage numberOfLines={2}>{item.lastMessage}</LastMessage>

      <MessageMeta>
        <RoomTags>
          {item.tags.map((tag) => (
            <Tag key={tag}>
              <TagText>{tag}</TagText>
            </Tag>
          ))}
        </RoomTags>
        <LastMessageTime>{item.lastMessageTime}</LastMessageTime>
      </MessageMeta>
    </RoomCard>
  )

  return (
    <Container>
      <Header>
        <HeaderTitle>Chat Rooms</HeaderTitle>
        <HeaderSubtitle>Connect with your communities</HeaderSubtitle>
      </Header>

      <SearchContainer>
        <SearchInput
          placeholder="Search rooms or topics..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
        />
      </SearchContainer>

      <TabContainer>
        <Tab active={activeTab === 'all'} onPress={() => setActiveTab('all')}>
          <TabText active={activeTab === 'all'}>All Rooms</TabText>
        </Tab>
        <Tab
          active={activeTab === 'joined'}
          onPress={() => setActiveTab('joined')}
        >
          <TabText active={activeTab === 'joined'}>Joined</TabText>
        </Tab>
        <Tab
          active={activeTab === 'trending'}
          onPress={() => setActiveTab('trending')}
        >
          <TabText active={activeTab === 'trending'}>Trending</TabText>
        </Tab>
      </TabContainer>

      <RoomsContainer>
        <SectionTitle>
          {activeTab === 'all'
            ? 'All Rooms'
            : activeTab === 'joined'
            ? 'Your Rooms'
            : 'Trending Now'}{' '}
          ({filteredRooms.length})
        </SectionTitle>

        <FlatList
          data={filteredRooms}
          renderItem={renderRoom}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </RoomsContainer>

      <FloatingAddButton
        onPress={() => {
          Vibration.vibrate(10)
          navigation.navigate('CreateRoom')
        }}
      >
        <AddButtonText>+</AddButtonText>
      </FloatingAddButton>
    </Container>
  )
}
