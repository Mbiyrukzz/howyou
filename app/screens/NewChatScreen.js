import React, { useState, useContext } from 'react'
import styled from 'styled-components/native'
import { FlatList, Modal, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import ContactsContext from '../contexts/ContactsContext'
import ChatsContext from '../contexts/ChatsContext'
import { useUser } from '../hooks/useUser' // Add this import

const Container = styled.View`
  flex: 1;
  background-color: #1a1a2e;
`

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 60px 20px 20px 20px;
  background-color: rgba(255, 255, 255, 0.05);
  border-bottom-width: 1px;
  border-bottom-color: rgba(255, 255, 255, 0.1);
`

const BackButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.1);
  align-items: center;
  justify-content: center;
  margin-right: 16px;
`

const BackButtonText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: 600;
`

const HeaderTitle = styled.Text`
  font-size: 24px;
  font-weight: 700;
  color: white;
  flex: 1;
`

const TabContainer = styled.View`
  flex-direction: row;
  margin: 20px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 4px;
`

const Tab = styled.TouchableOpacity`
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  align-items: center;
  background-color: ${(props) => (props.active ? '#3396D3' : 'transparent')};
`

const TabText = styled.Text`
  color: ${(props) => (props.active ? 'white' : 'rgba(255, 255, 255, 0.6)')};
  font-weight: ${(props) => (props.active ? '700' : '500')};
  font-size: 14px;
`

const SearchContainer = styled.View`
  margin: 0 20px 20px 20px;
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

const ContentContainer = styled.View`
  flex: 1;
  padding: 0 20px;
`

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin-bottom: 16px;
  margin-left: 4px;
`

const DebugContainer = styled.View`
  background-color: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin: 10px 20px;
`

const DebugText = styled.Text`
  color: #ff6b6b;
  font-size: 12px;
  font-family: monospace;
`

// Create Room Components
const CreateRoomCard = styled.TouchableOpacity`
  background-color: rgba(102, 126, 234, 0.1);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  border-width: 2px;
  border-color: rgba(102, 126, 234, 0.3);
  border-style: dashed;
  align-items: center;
`

const CreateIcon = styled.View`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: #3396d3;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
`

const CreateIconText = styled.Text`
  color: white;
  font-size: 28px;
  font-weight: 300;
`

const CreateTitle = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin-bottom: 6px;
`

const CreateSubtitle = styled.Text`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  line-height: 20px;
`

// User/Contact Components
const UserCard = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
`

const UserAvatar = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: ${(props) => props.color || '#3396D3'};
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  position: relative;
`

const UserAvatarText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: 700;
`

const OnlineIndicator = styled.View`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 7px;
  background-color: ${(props) => (props.online ? '#4ade80' : '#6b7280')};
  border-width: 2px;
  border-color: #1a1a2e;
`

const UserInfo = styled.View`
  flex: 1;
`

const UserName = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
`

const UserStatus = styled.Text`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
`

const UserActions = styled.View`
  flex-direction: row;
  gap: 8px;
`

const ActionBtn = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: rgba(255, 255, 255, 0.1);
  align-items: center;
  justify-content: center;
`

const ActionBtnText = styled.Text`
  color: white;
  font-size: 16px;
`

// Modal Components
const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.7);
  justify-content: center;
  align-items: center;
`

const ModalContainer = styled.View`
  width: 90%;
  max-width: 400px;
  background-color: #16213e;
  border-radius: 20px;
  padding: 24px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
`

const ModalTitle = styled.Text`
  font-size: 22px;
  font-weight: 700;
  color: white;
  margin-bottom: 20px;
  text-align: center;
`

const InputGroup = styled.View`
  margin-bottom: 20px;
`

const InputLabel = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
`

const Input = styled.TextInput`
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  font-size: 16px;
  color: white;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.2);
`

const TextArea = styled.TextInput`
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  font-size: 16px;
  color: white;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.2);
  height: 100px;
  text-align-vertical: top;
`

const ModalActions = styled.View`
  flex-direction: row;
  gap: 12px;
`

const ModalButton = styled.TouchableOpacity`
  flex: 1;
  padding: 16px;
  border-radius: 12px;
  align-items: center;
  background-color: ${(props) =>
    props.primary ? '#3396D3' : 'rgba(255, 255, 255, 0.1)'};
`

const ModalButtonText = styled.Text`
  color: white;
  font-weight: 600;
  font-size: 16px;
`

const CategoryContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
`

const CategoryChip = styled.TouchableOpacity`
  background-color: ${(props) =>
    props.selected ? '#3396D3' : 'rgba(255, 255, 255, 0.1)'};
  padding: 8px 16px;
  border-radius: 20px;
  border-width: 1px;
  border-color: ${(props) =>
    props.selected ? '#3396D3' : 'rgba(255, 255, 255, 0.2)'};
`

const CategoryText = styled.Text`
  color: white;
  font-size: 12px;
  font-weight: 600;
`

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`

const LoadingText = styled.Text`
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
`

const EmptyContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
`

const EmptyText = styled.Text`
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  text-align: center;
`

// Helper function to generate consistent user colors
const getUserColor = (userId) => {
  const colors = [
    '#3396D3',
    '#f59e0b',
    '#10b981',
    '#8b5cf6',
    '#ef4444',
    '#06b6d4',
    '#84cc16',
    '#f97316',
    '#ec4899',
    '#6366f1',
    '#14b8a6',
    '#f59e0b',
  ]
  const index = userId ? userId.toString().charCodeAt(0) % colors.length : 0
  return colors[index]
}

export default function NewChatScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('contacts')
  const [searchText, setSearchText] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [roomDescription, setRoomDescription] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])

  // Get contexts with error handling
  const contactsContext = useContext(ContactsContext)
  const chatsContext = useContext(ChatsContext)
  const { user } = useUser() // Add this to get user data
  const nav = useNavigation()

  // Handle case where contexts might not be available
  const contacts = contactsContext?.contacts || []
  const contactsLoading = contactsContext?.loading || false

  // Get users from ChatsContext
  const users = chatsContext?.users || []
  const usersLoading = chatsContext?.loading || false

  const createChat =
    chatsContext?.createChat || (() => Promise.resolve({ success: false }))
  const chats = chatsContext?.chats || []

  // Combine contacts and users, prioritizing contacts
  const allPeople = React.useMemo(() => {
    const contactIds = new Set(contacts.map((c) => c._id || c.id))
    const contactsWithType = contacts.map((c) => ({ ...c, type: 'contact' }))
    const usersWithType = users
      .filter((u) => !contactIds.has(u._id || u.id))
      .map((u) => ({
        ...u,
        type: 'user',
        // Ensure consistent data structure
        name: u.name || u.username || 'Unknown User',
        status: u.status || 'User',
        online: u.online || false,
        color: u.color || getUserColor(u._id || u.id),
      }))

    return [...contactsWithType, ...usersWithType]
  }, [contacts, users])

  const loading = contactsLoading || usersLoading

  // Categories for room creation
  const categories = [
    'Technology',
    'Business',
    'Social',
    'Gaming',
    'Education',
    'Health',
    'Entertainment',
    'Sports',
    'Travel',
    'Food',
  ]

  const filteredPeople = allPeople.filter(
    (person) =>
      person.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      person.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      person.username?.toLowerCase().includes(searchText.toLowerCase())
  )

  const startDirectChat = async (person) => {
    // Debug user state
    console.log('Current user:', user)
    console.log('User UID:', user?.uid)

    if (!user?.uid) {
      Alert.alert(
        'Authentication Error',
        'You need to be logged in to start a chat. Please log in and try again.',
        [{ text: 'OK' }]
      )
      return
    }

    try {
      const personUid = person.firebaseUid || person._id || person.id
      const existingChat = chats.find(
        (chat) =>
          chat.participants.length === 2 &&
          chat.participants.includes(personUid) &&
          chat.participants.includes(user?.uid)
      )

      if (existingChat) {
        nav.navigate('ChatDetail', {
          chatId: existingChat._id || existingChat.id,
        })
        return
      }

      // Otherwise create new chat
      console.log('Creating chat with:', person)
      // Use firebaseUid for Firebase users, _id for other users
      const participantId = person.firebaseUid || person._id || person.id
      console.log('Using participant ID:', participantId)
      const data = await createChat([participantId], person.name)
      console.log('Create chat response:', data)

      if (data.success && data.chat) {
        nav.navigate('ChatDetail', { chatId: data.chat._id || data.chat.id })
      } else {
        Alert.alert(
          'Error',
          data.error || 'Failed to create chat. Please try again.',
          [{ text: 'OK' }]
        )
      }
    } catch (error) {
      console.error('Error starting direct chat:', error)
      Alert.alert('Error', 'Failed to start chat. Please try again.', [
        { text: 'OK' },
      ])
    }
  }

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  const createRoom = async () => {
    if (!roomName.trim()) {
      Alert.alert('Error', 'Please enter a room name', [{ text: 'OK' }])
      return
    }

    if (!user?.uid) {
      Alert.alert(
        'Authentication Error',
        'You need to be logged in to create a room. Please log in and try again.',
        [{ text: 'OK' }]
      )
      return
    }

    try {
      const data = await createChat([], roomName)

      if (data.success && data.chat) {
        setShowCreateModal(false)
        setRoomName('')
        setRoomDescription('')
        setSelectedCategories([])

        nav.navigate('ChatDetail', { chatId: data.chat._id || data.chat.id })
      } else {
        Alert.alert(
          'Error',
          data.error || 'Failed to create room. Please try again.',
          [{ text: 'OK' }]
        )
      }
    } catch (error) {
      console.error('Error creating room:', error)
      Alert.alert('Error', 'Failed to create room. Please try again.', [
        { text: 'OK' },
      ])
    }
  }

  const renderPerson = ({ item }) => (
    <UserCard onPress={() => startDirectChat(item)}>
      <UserAvatar color={item.color || getUserColor(item._id || item.id)}>
        <UserAvatarText>
          {item.name
            .split(' ')
            .map((n) => n.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase()}
        </UserAvatarText>
        <OnlineIndicator online={item.online} />
      </UserAvatar>
      <UserInfo>
        <UserName>
          {item.name}
          {item.type === 'contact' && ' ★'}
        </UserName>
        <UserStatus>
          {item.type === 'contact'
            ? item.status || 'Contact'
            : item.status || 'User'}
        </UserStatus>
      </UserInfo>
      <UserActions>
        <ActionBtn onPress={() => startDirectChat(item)}>
          <ActionBtnText>💬</ActionBtnText>
        </ActionBtn>
        <ActionBtn>
          <ActionBtnText>📞</ActionBtnText>
        </ActionBtn>
      </UserActions>
    </UserCard>
  )

  const renderEmptyPeople = () => (
    <EmptyContainer>
      <EmptyText>
        {searchText
          ? `No people found matching "${searchText}"`
          : 'No people available to chat with.'}
      </EmptyText>
    </EmptyContainer>
  )

  if (loading) {
    return (
      <Container>
        <Header>
          <BackButton onPress={() => nav?.goBack()}>
            <BackButtonText>←</BackButtonText>
          </BackButton>
          <HeaderTitle>New Chat</HeaderTitle>
        </Header>
        <LoadingContainer>
          <LoadingText>Loading people...</LoadingText>
        </LoadingContainer>
      </Container>
    )
  }

  return (
    <Container>
      <Header>
        <BackButton onPress={() => nav?.goBack()}>
          <BackButtonText>←</BackButtonText>
        </BackButton>
        <HeaderTitle>New Chat</HeaderTitle>
      </Header>

      {/* Debug Panel - Remove in production */}
      <DebugContainer>
        <DebugText>
          Debug: User:{' '}
          {user
            ? `${user.displayName || 'No name'} (${user.uid})`
            : 'Not logged in'}
        </DebugText>
        <DebugText>
          Users loaded: {users.length} | Contacts: {contacts.length}
        </DebugText>
      </DebugContainer>

      <TabContainer>
        <Tab
          active={activeTab === 'contacts'}
          onPress={() => setActiveTab('contacts')}
        >
          <TabText active={activeTab === 'contacts'}>People</TabText>
        </Tab>
        <Tab
          active={activeTab === 'rooms'}
          onPress={() => setActiveTab('rooms')}
        >
          <TabText active={activeTab === 'rooms'}>Create Room</TabText>
        </Tab>
      </TabContainer>

      <SearchContainer>
        <SearchInput
          placeholder={
            activeTab === 'contacts'
              ? 'Search people...'
              : 'Search public rooms...'
          }
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
        />
      </SearchContainer>

      <ContentContainer>
        {activeTab === 'contacts' ? (
          <>
            <SectionTitle>People ({filteredPeople.length})</SectionTitle>
            {filteredPeople.length === 0 ? (
              renderEmptyPeople()
            ) : (
              <FlatList
                data={filteredPeople}
                renderItem={renderPerson}
                keyExtractor={(item) => (item._id || item.id).toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </>
        ) : (
          <>
            <CreateRoomCard onPress={() => setShowCreateModal(true)}>
              <CreateIcon>
                <CreateIconText>+</CreateIconText>
              </CreateIcon>
              <CreateTitle>Create New Room</CreateTitle>
              <CreateSubtitle>
                Start a new community discussion around topics you care about
              </CreateSubtitle>
            </CreateRoomCard>

            <SectionTitle>Suggested Public Rooms</SectionTitle>
            <FlatList
              data={[
                {
                  id: 1,
                  name: 'Web3 Developers',
                  members: 2341,
                  color: '#f59e0b',
                },
                {
                  id: 2,
                  name: 'Remote Workers',
                  members: 5632,
                  color: '#10b981',
                },
                {
                  id: 3,
                  name: 'Startup Founders',
                  members: 1205,
                  color: '#8b5cf6',
                },
              ]}
              renderItem={({ item }) => (
                <UserCard>
                  <UserAvatar color={item.color}>
                    <UserAvatarText>{item.name.charAt(0)}</UserAvatarText>
                  </UserAvatar>
                  <UserInfo>
                    <UserName>{item.name}</UserName>
                    <UserStatus>
                      {item.members.toLocaleString()} members
                    </UserStatus>
                  </UserInfo>
                  <UserActions>
                    <ActionBtn>
                      <ActionBtnText>+</ActionBtnText>
                    </ActionBtn>
                  </UserActions>
                </UserCard>
              )}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </>
        )}
      </ContentContainer>

      <Modal visible={showCreateModal} transparent animationType="fade">
        <ModalOverlay>
          <ModalContainer>
            <ModalTitle>Create New Room</ModalTitle>

            <InputGroup>
              <InputLabel>Room Name</InputLabel>
              <Input
                placeholder="Enter room name..."
                value={roomName}
                onChangeText={setRoomName}
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
            </InputGroup>

            <InputGroup>
              <InputLabel>Description</InputLabel>
              <TextArea
                placeholder="What's this room about?..."
                value={roomDescription}
                onChangeText={setRoomDescription}
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                multiline
              />
            </InputGroup>

            <InputGroup>
              <InputLabel>Categories</InputLabel>
              <CategoryContainer>
                {categories.map((category) => (
                  <CategoryChip
                    key={category}
                    selected={selectedCategories.includes(category)}
                    onPress={() => toggleCategory(category)}
                  >
                    <CategoryText>{category}</CategoryText>
                  </CategoryChip>
                ))}
              </CategoryContainer>
            </InputGroup>

            <ModalActions>
              <ModalButton onPress={() => setShowCreateModal(false)}>
                <ModalButtonText>Cancel</ModalButtonText>
              </ModalButton>
              <ModalButton primary onPress={createRoom}>
                <ModalButtonText>Create Room</ModalButtonText>
              </ModalButton>
            </ModalActions>
          </ModalContainer>
        </ModalOverlay>
      </Modal>
    </Container>
  )
}
