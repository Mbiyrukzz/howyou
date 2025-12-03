import React, { useState, useContext } from 'react'
import styled from 'styled-components/native'
import { FlatList, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import ChatsContext from '../contexts/ChatsContext'
import { useUser } from '../hooks/useUser'

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

const SearchContainer = styled.View`
  margin: 20px;
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
`

const UserCard = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: #fff;
  border-radius: 16px;
  padding: 16px;
  margin: 0 20px 12px 20px;
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

const CallActions = styled.View`
  flex-direction: row;
  gap: 8px;
`

const CallButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${(props) => props.color || '#3b82f6'};
  align-items: center;
  justify-content: center;
  shadow-color: ${(props) => props.color || '#3b82f6'};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 6;
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
  font-size: 16px;
  color: #64748b;
  text-align: center;
  line-height: 24px;
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
  ]
  return colors[userId ? userId.toString().charCodeAt(0) % colors.length : 0]
}

export default function CreateCallScreen({ navigation }) {
  const [searchText, setSearchText] = useState('')
  const chatsContext = useContext(ChatsContext)
  const { user } = useUser()

  const {
    users = [],
    chats = [],
    initiateCall,
    isUserOnline,
  } = chatsContext || {}

  const filteredUsers = users.filter((u) => {
    const userId = u.firebaseUid || u._id
    if (userId === user?.uid) return false
    const name = u.name || u.username || ''
    return name.toLowerCase().includes(searchText.toLowerCase())
  })

  const handleCall = async (selectedUser, callType) => {
    try {
      const userId = selectedUser.firebaseUid || selectedUser._id
      const chat = chats.find((c) => c.participants?.includes(userId))

      if (!chat) {
        Alert.alert('Error', 'Could not find chat with this user')
        return
      }

      const result = await initiateCall({
        chatId: chat._id || chat.id,
        callType,
        recipientId: userId,
      })

      if (result.success) {
        navigation.navigate('CallScreen', {
          chatId: chat._id || chat.id,
          callId: result.call._id,
          recipientId: userId,
          callType,
        })
      } else {
        Alert.alert('Call Failed', result.error || 'Could not initiate call')
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to start call')
    }
  }

  const renderUser = ({ item }) => {
    const userId = item.firebaseUid || item._id
    const online = isUserOnline(userId)

    return (
      <UserCard>
        <UserAvatar color={getUserColor(userId)}>
          <UserAvatarText>
            {item.name?.charAt(0)?.toUpperCase() || '?'}
          </UserAvatarText>
          <OnlineIndicator online={online} />
        </UserAvatar>

        <UserInfo>
          <UserName>{item.name || item.username || 'Unknown'}</UserName>
          <UserStatus>{online ? 'Active now' : 'Offline'}</UserStatus>
        </UserInfo>

        <CallActions>
          <CallButton color="#3b82f6" onPress={() => handleCall(item, 'audio')}>
            <Ionicons name="call" size={20} color="#fff" />
          </CallButton>
          <CallButton color="#10b981" onPress={() => handleCall(item, 'video')}>
            <Ionicons name="videocam" size={20} color="#fff" />
          </CallButton>
        </CallActions>
      </UserCard>
    )
  }

  return (
    <Container>
      <Header>
        <HeaderContent>
          <BackButton onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#64748b" />
          </BackButton>
          <HeaderTitle>New Call</HeaderTitle>
        </HeaderContent>
      </Header>

      <SearchContainer>
        <SearchInputWrapper>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <SearchInput
            placeholder="Search users..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#94a3b8"
          />
        </SearchInputWrapper>
      </SearchContainer>

      {filteredUsers.length === 0 ? (
        <EmptyContainer>
          <EmptyIcon>
            <Ionicons name="people-outline" size={40} color="#94a3b8" />
          </EmptyIcon>
          <EmptyText>
            {searchText
              ? `No users found matching "${searchText}"`
              : 'No users available to call'}
          </EmptyText>
        </EmptyContainer>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => (item._id || item.id).toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </Container>
  )
}
