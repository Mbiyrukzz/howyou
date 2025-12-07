import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components/native'
import {
  FlatList,
  Modal,
  Alert,
  TouchableWithoutFeedback,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { useUser } from '../hooks/useUser'
import { useContacts } from '../providers/ContactsProvider'
import { useChats } from '../hooks/useChats'

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
  padding: 0 20px;
`

const BackButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #f1f5f9;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
`

const HeaderTitle = styled.Text`
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
  flex: 1;
`

const HeaderActions = styled.View`
  flex-direction: row;
  gap: 8px;
`

const AddContactHeaderButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #3b82f6;
  align-items: center;
  justify-content: center;
  shadow-color: #3b82f6;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
  elevation: 3;
`

const ReloadButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #f1f5f9;
  align-items: center;
  justify-content: center;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
`

const TabContainer = styled.View`
  flex-direction: row;
  margin: 20px;
  background-color: #fff;
  border-radius: 12px;
  padding: 4px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`

const Tab = styled.TouchableOpacity`
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  align-items: center;
  background-color: ${(props) => (props.active ? '#3b82f6' : 'transparent')};
`

const TabText = styled.Text`
  color: ${(props) => (props.active ? '#fff' : '#64748b')};
  font-weight: ${(props) => (props.active ? '700' : '500')};
  font-size: 14px;
`

const SearchContainer = styled.View`
  margin: 0 20px 20px 20px;
`

const SearchInputWrapper = styled.View`
  background-color: #fff;
  border-radius: 12px;
  flex-direction: row;
  align-items: center;
  padding: 14px 16px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`

const SearchInput = styled.TextInput`
  flex: 1;
  font-size: 16px;
  color: #1e293b;
  margin-left: 12px;
  border-width: 0;
  outline-width: 0;
`

const ContentContainer = styled.View`
  flex: 1;
  padding: 0 20px;
`

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
`

const CreateRoomCard = styled.TouchableOpacity`
  background-color: #fff;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  border-width: 2px;
  border-color: #e0f2fe;
  border-style: dashed;
  align-items: center;
  shadow-color: #3b82f6;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  elevation: 3;
`

const CreateIcon = styled.View`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background-color: #3b82f6;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  shadow-color: #3b82f6;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 6px;
  elevation: 4;
`

const CreateTitle = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
`

const CreateSubtitle = styled.Text`
  font-size: 14px;
  color: #64748b;
  text-align: center;
  line-height: 20px;
`

const UserCard = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: #fff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`

const UserAvatar = styled.View`
  width: 52px;
  height: 52px;
  border-radius: 26px;
  background-color: ${(props) => props.color || '#3b82f6'};
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  position: relative;
`

const UserAvatarText = styled.Text`
  color: #fff;
  font-size: 18px;
  font-weight: 700;
`

const OnlineIndicator = styled.View`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  border-radius: 8px;
  background-color: ${(props) => (props.online ? '#10b981' : '#94a3b8')};
  border-width: 3px;
  border-color: #fff;
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

const UserStatus = styled.Text`
  font-size: 13px;
  color: #64748b;
`

const UserBadge = styled.View`
  background-color: #fef3c7;
  padding: 2px 8px;
  border-radius: 8px;
  margin-left: 8px;
`

const UserBadgeText = styled.Text`
  color: #f59e0b;
  font-size: 11px;
  font-weight: 700;
`

const UserActions = styled.View`
  flex-direction: row;
  gap: 8px;
`

const ActionBtn = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #f1f5f9;
  align-items: center;
  justify-content: center;
`

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`

const ModalContainer = styled.View`
  width: 90%;
  max-width: 400px;
  background-color: #fff;
  border-radius: 20px;
  padding: 24px;
  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.3;
  shadow-radius: 16px;
  elevation: 10;
`

const ModalTitle = styled.Text`
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 20px;
  text-align: center;
`

const InputGroup = styled.View`
  margin-bottom: 20px;
`

const InputLabel = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
`

const Input = styled.TextInput`
  background-color: #f8fafc;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 16px;
  color: #1e293b;
  border-width: 1px;
  border-color: #e2e8f0;
`

const TextArea = styled.TextInput`
  background-color: #f8fafc;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 16px;
  color: #1e293b;
  border-width: 1px;
  border-color: #e2e8f0;
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
  background-color: ${(props) => (props.primary ? '#3b82f6' : '#f1f5f9')};
  shadow-color: ${(props) => (props.primary ? '#3b82f6' : 'transparent')};
  shadow-offset: 0px 4px;
  shadow-opacity: ${(props) => (props.primary ? 0.3 : 0)};
  shadow-radius: 6px;
  elevation: ${(props) => (props.primary ? 4 : 0)};
`

const ModalButtonText = styled.Text`
  color: ${(props) => (props.primary ? '#fff' : '#64748b')};
  font-weight: 700;
  font-size: 16px;
`

const CategoryContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
`

const CategoryChip = styled.TouchableOpacity`
  background-color: ${(props) => (props.selected ? '#e0f2fe' : '#f8fafc')};
  padding: 10px 16px;
  border-radius: 20px;
  border-width: 1px;
  border-color: ${(props) => (props.selected ? '#3b82f6' : '#e2e8f0')};
`

const CategoryText = styled.Text`
  color: ${(props) => (props.selected ? '#3b82f6' : '#64748b')};
  font-size: 13px;
  font-weight: 600;
`

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #f8fafc;
`

const LoadingCard = styled.View`
  background-color: #fff;
  padding: 32px;
  border-radius: 20px;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  elevation: 4;
`

const LoadingText = styled.Text`
  color: #64748b;
  font-size: 16px;
  margin-top: 12px;
  font-weight: 600;
`

const EmptyContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
`

const EmptyIcon = styled.View`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: #f1f5f9;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
`

const EmptyText = styled.Text`
  color: #64748b;
  font-size: 16px;
  text-align: center;
  line-height: 24px;
`

const UserNameContainer = styled.View`
  flex-direction: row;
  align-items: center;
`

const AddContactButton = styled.TouchableOpacity`
  background-color: #3b82f6;
  padding: 12px 20px;
  border-radius: 12px;
  margin-top: 16px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  shadow-color: #3b82f6;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 6px;
  elevation: 4;
`

const AddContactText = styled.Text`
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  margin-left: 8px;
`

const getUserColor = (userId) => {
  const colors = [
    '#3b82f6',
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
  const [refreshing, setRefreshing] = useState(false)

  const { contacts, loading: contactsLoading, loadContacts } = useContacts()

  let chatsContext
  try {
    chatsContext = useChats?.() || {
      chats: [],
      createChat: () => Promise.resolve({ success: false }),
    }
  } catch {
    chatsContext = {
      chats: [],
      createChat: () => Promise.resolve({ success: false }),
    }
  }

  const { user } = useUser()
  const nav = useNavigation()

  const createChat =
    chatsContext?.createChat || (() => Promise.resolve({ success: false }))
  const chats = chatsContext?.chats || []

  useEffect(() => {
    const unsubscribe = nav.addListener('focus', () => {
      console.log('🔄 NewChatScreen focused, loading contacts')
      if (loadContacts) {
        loadContacts()
      }
    })

    return unsubscribe
  }, [nav, loadContacts])

  useEffect(() => {
    console.log('🔄 Initial mount, loading contacts')
    if (loadContacts) {
      loadContacts()
    }
  }, [loadContacts])

  const contactsWithType = React.useMemo(() => {
    if (!contacts || contacts.length === 0) {
      return []
    }

    return contacts.map((c) => {
      const name = c.userDetails?.name || c.contactName || 'Unknown User'
      const email = c.userDetails?.email || ''
      const online = c.userDetails?.online || false
      const color = getUserColor(c.contactUserId)

      return {
        ...c,
        type: 'contact',
        name,
        email,
        online,
        color,
        firebaseUid: c.contactUserId,
      }
    })
  }, [contacts])

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

  const filteredContacts = contactsWithType.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchText.toLowerCase())
  )

  const startDirectChat = async (contact) => {
    if (!user?.uid) {
      Alert.alert(
        'Authentication Error',
        'You need to be logged in to start a chat. Please log in and try again.',
        [{ text: 'OK' }]
      )
      return
    }

    try {
      const contactUid = contact.contactUserId || contact.firebaseUid

      if (!contactUid) {
        Alert.alert('Error', 'Invalid contact ID', [{ text: 'OK' }])
        return
      }

      const existingChat = chats.find(
        (chat) =>
          chat.participants?.length === 2 &&
          chat.participants.includes(contactUid) &&
          chat.participants.includes(user?.uid)
      )

      if (existingChat) {
        nav.navigate('ChatDetail', {
          chatId: existingChat._id || existingChat.id,
        })
        return
      }

      const data = await createChat([contactUid], contact.name)

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
      console.error('❌ Error starting direct chat:', error)
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

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      if (loadContacts) {
        await loadContacts()
      }
    } catch (error) {
      console.error('Error refreshing contacts:', error)
      Alert.alert('Error', 'Failed to refresh contacts', [{ text: 'OK' }])
    } finally {
      setRefreshing(false)
    }
  }

  const navigateToAddContacts = () => {
    nav.navigate('Contacts')
  }

  const renderContact = ({ item }) => (
    <UserCard onPress={() => startDirectChat(item)}>
      <UserAvatar color={item.color}>
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
        <UserNameContainer>
          <UserName>{item.name}</UserName>
          <UserBadge>
            <UserBadgeText>Contact</UserBadgeText>
          </UserBadge>
        </UserNameContainer>
        <UserStatus>
          {item.email || 'No email'}
          {item.online && ' • Online'}
        </UserStatus>
      </UserInfo>
      <UserActions>
        <ActionBtn onPress={() => startDirectChat(item)}>
          <Ionicons name="chatbubble" size={18} color="#3b82f6" />
        </ActionBtn>
        <ActionBtn>
          <Ionicons name="call" size={18} color="#64748b" />
        </ActionBtn>
      </UserActions>
    </UserCard>
  )

  const renderEmptyContacts = () => (
    <EmptyContainer>
      <EmptyIcon>
        <Ionicons name="people-outline" size={40} color="#94a3b8" />
      </EmptyIcon>
      <EmptyText>
        {searchText
          ? `No contacts found matching "${searchText}"`
          : contactsLoading
          ? 'Loading contacts...'
          : 'No contacts yet.\nAdd contacts to start chatting!'}
      </EmptyText>
      {!searchText && !contactsLoading && (
        <AddContactButton onPress={navigateToAddContacts}>
          <Ionicons name="person-add" size={16} color="#fff" />
          <AddContactText>Add Contacts</AddContactText>
        </AddContactButton>
      )}
    </EmptyContainer>
  )

  const renderContactList = () => {
    if (contactsLoading && !refreshing) {
      return (
        <LoadingContainer>
          <LoadingCard>
            <Ionicons name="people" size={40} color="#3b82f6" />
            <LoadingText>Loading contacts...</LoadingText>
          </LoadingCard>
        </LoadingContainer>
      )
    }

    return (
      <>
        <SectionTitle>Contacts ({filteredContacts.length})</SectionTitle>
        {filteredContacts.length === 0 ? (
          renderEmptyContacts()
        ) : (
          <FlatList
            data={filteredContacts}
            renderItem={renderContact}
            keyExtractor={(item) => (item._id || item.contactUserId).toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#3b82f6']}
                tintColor="#3b82f6"
              />
            }
          />
        )}
      </>
    )
  }

  if (contactsLoading && !refreshing) {
    return (
      <Container>
        <Header>
          <HeaderContent>
            <BackButton onPress={() => nav?.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#64748b" />
            </BackButton>
            <HeaderTitle>New Chat</HeaderTitle>
            <HeaderActions>
              <AddContactHeaderButton onPress={navigateToAddContacts}>
                <Ionicons name="person-add" size={20} color="#fff" />
              </AddContactHeaderButton>
              <ReloadButton
                onPress={() => loadContacts?.()}
                disabled={contactsLoading}
              >
                <Ionicons
                  name="reload"
                  size={20}
                  color={contactsLoading ? '#94a3b8' : '#3b82f6'}
                />
              </ReloadButton>
            </HeaderActions>
          </HeaderContent>
        </Header>
        <LoadingContainer>
          <LoadingCard>
            <Ionicons name="people" size={40} color="#3b82f6" />
            <LoadingText>Loading contacts...</LoadingText>
          </LoadingCard>
        </LoadingContainer>
      </Container>
    )
  }

  return (
    <Container>
      <Header>
        <HeaderContent>
          <BackButton onPress={() => nav?.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#64748b" />
          </BackButton>
          <HeaderTitle>New Chat</HeaderTitle>
          <HeaderActions>
            <AddContactHeaderButton onPress={navigateToAddContacts}>
              <Ionicons name="person-add" size={20} color="#fff" />
            </AddContactHeaderButton>
            <ReloadButton
              onPress={() => loadContacts?.()}
              disabled={contactsLoading}
            >
              <Ionicons
                name="reload"
                size={20}
                color={contactsLoading ? '#94a3b8' : '#3b82f6'}
              />
            </ReloadButton>
          </HeaderActions>
        </HeaderContent>
      </Header>

      <TabContainer>
        <Tab
          active={activeTab === 'contacts'}
          onPress={() => setActiveTab('contacts')}
        >
          <TabText active={activeTab === 'contacts'}>Contacts</TabText>
        </Tab>
        <Tab
          active={activeTab === 'rooms'}
          onPress={() => setActiveTab('rooms')}
        >
          <TabText active={activeTab === 'rooms'}>Create Room</TabText>
        </Tab>
      </TabContainer>

      <SearchContainer>
        <SearchInputWrapper>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <SearchInput
            placeholder={
              activeTab === 'contacts'
                ? 'Search contacts...'
                : 'Search public rooms...'
            }
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#94a3b8"
          />
        </SearchInputWrapper>
      </SearchContainer>

      <ContentContainer>
        {activeTab === 'contacts' ? (
          renderContactList()
        ) : (
          <>
            <CreateRoomCard onPress={() => setShowCreateModal(true)}>
              <CreateIcon>
                <Ionicons name="add" size={32} color="#fff" />
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
                      <Ionicons name="add" size={20} color="#3b82f6" />
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
        <TouchableWithoutFeedback onPress={() => setShowCreateModal(false)}>
          <ModalOverlay>
            <TouchableWithoutFeedback>
              <ModalContainer>
                <ModalTitle>Create New Room</ModalTitle>

                <InputGroup>
                  <InputLabel>Room Name</InputLabel>
                  <Input
                    placeholder="Enter room name..."
                    value={roomName}
                    onChangeText={setRoomName}
                    placeholderTextColor="#94a3b8"
                  />
                </InputGroup>

                <InputGroup>
                  <InputLabel>Description (Optional)</InputLabel>
                  <TextArea
                    placeholder="What's this room about?..."
                    value={roomDescription}
                    onChangeText={setRoomDescription}
                    placeholderTextColor="#94a3b8"
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
                        <CategoryText
                          selected={selectedCategories.includes(category)}
                        >
                          {category}
                        </CategoryText>
                      </CategoryChip>
                    ))}
                  </CategoryContainer>
                </InputGroup>

                <ModalActions>
                  <ModalButton onPress={() => setShowCreateModal(false)}>
                    <ModalButtonText>Cancel</ModalButtonText>
                  </ModalButton>
                  <ModalButton primary onPress={createRoom}>
                    <ModalButtonText primary>Create Room</ModalButtonText>
                  </ModalButton>
                </ModalActions>
              </ModalContainer>
            </TouchableWithoutFeedback>
          </ModalOverlay>
        </TouchableWithoutFeedback>
      </Modal>
    </Container>
  )
}
