import React, { useContext, useState, useEffect } from 'react'
import { View, Platform, StatusBar, Alert } from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

import { CallDetailScreen } from './CallDetailScreen'
import ChatsContext from '../contexts/ChatsContext'
import { useUser } from '../hooks/useUser'
import WebSidebarLayout, {
  shouldShowSidebar,
} from '../components/WebSidebarLayout'
import { useWebNavigation } from '../navigation/WebNavigationHandler'
import LoadingIndicator from '../components/LoadingIndicator'
import { CallCard } from '../components/calls/CallCard'
import { CallHistoryCard } from '../components/calls/HistoryCard'
import { ContactCard } from '../components/calls/ContactCard'
import { getUserColor, getInitials } from '../utils/chatHelpers'

/* =================== Styled Components =================== */
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

const HeaderTitle = styled.Text`
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
`

const HeaderActions = styled.View`
  flex-direction: row;
  gap: 8px;
`

const HeaderButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #f1f5f9;
  align-items: center;
  justify-content: center;
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
  background-color: ${(props) => (props.active ? '#3498db' : 'transparent')};
`

const TabText = styled.Text`
  color: ${(props) => (props.active ? '#fff' : '#64748b')};
  font-weight: ${(props) => (props.active ? '700' : '500')};
  font-size: 14px;
`

const SectionTitle = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 20px 20px 12px 20px;
`

const EmptyStateTitle = styled.Text`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
  text-align: center;
`

const EmptyStateText = styled.Text`
  font-size: 16px;
  color: #64748b;
  text-align: center;
  line-height: 24px;
`

const CallsList = styled.ScrollView`
  flex: 1;
  padding: 0 20px;
`

/* =================== Main CallsScreen =================== */
export default function CallsScreen({ navigation, route }) {
  const [selectedCallId, setSelectedCallId] = useState(null)
  const [selectedTab, setSelectedTab] = useState('recent')

  const chatsContext = useContext(ChatsContext)
  const { user } = useUser()

  const {
    calls = {},
    users = [],
    chats = [],
    loading,
    deleteCallLog,
    initiateCall,
    onlineUsers,
    getCallHistory,
  } = chatsContext || {}

  console.log('📞 All calls from ChatsContext:', calls)
  console.log('📞 Chats:', chats)
  console.log('📞 Users:', users)

  useWebNavigation((type, id) => {
    if (type === 'call') {
      setSelectedCallId(id || null)
    }
  })

  useEffect(() => {
    if (!chats?.length) return

    chats.forEach((chat) => {
      const chatId = chat._id || chat.id
      getCallHistory(chatId)
    })
  }, [chats])

  // Get all calls from all chats
  const allCalls = Object.entries(calls)
    .flatMap(([chatId, chatCalls]) =>
      chatCalls.map((call) => {
        // Find the chat and other user
        const chat = chats.find((c) => (c._id || c.id) === chatId)
        const otherUserId = chat?.participants?.find((p) => p !== user?.uid)
        const otherUser = users.find(
          (u) => (u.firebaseUid || u._id) === otherUserId
        )

        return {
          ...call,
          chatId,
          participantId: otherUserId, // ✅ Store the actual participant ID from chat
          name: otherUser?.name || 'Unknown User',
          color: getUserColor(otherUserId),
          isOnline: onlineUsers.has(otherUserId),
        }
      })
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  // Get contacts (users with chats)
  const contacts = chats
    .filter((chat) => !chat.isGroup)
    .map((chat) => {
      const otherUserId = chat.participants?.find((p) => p !== user?.uid)
      const otherUser = users.find(
        (u) => (u.firebaseUid || u._id) === otherUserId
      )

      if (!otherUser) return null

      return {
        ...otherUser,
        chatId: chat._id || chat.id,
        participantId: otherUserId, // ✅ Store the actual participant ID from chat
        color: getUserColor(otherUserId),
        isOnline: onlineUsers.has(otherUserId),
        status: onlineUsers.has(otherUserId) ? 'Online' : 'Offline',
      }
    })
    .filter(Boolean)

  const recentCalls = allCalls.slice(0, 5)
  const missedCalls = allCalls.filter((call) => call.status === 'missed')

  const handleStartCall = async (contact, callType) => {
    if (!contact?.chatId) {
      Alert.alert('Error', 'Cannot start call')
      return
    }

    // ✅ Use participantId which comes from chat.participants
    const recipientId =
      contact.participantId || contact.firebaseUid || contact._id

    console.log('📞 Starting call with:', {
      chatId: contact.chatId,
      callType,
      recipientId,
      contactName: contact.name,
    })

    try {
      const result = await initiateCall({
        chatId: contact.chatId,
        callType,
        recipientId: recipientId,
      })

      if (result.success) {
        // ✅ Cross-stack navigation to CallScreen in ChatsStack
        const rootNavigation = navigation.getParent() || navigation

        try {
          rootNavigation.navigate('Chats', {
            screen: 'CallScreen',
            params: {
              chatId: contact.chatId,
              remoteUserId: recipientId,
              remoteUserName: contact.name,
              callType,
              isIncoming: false,
              callId: result.call._id.toString(),
            },
          })
        } catch (navError) {
          console.error('Navigation error:', navError)
          Alert.alert(
            'Navigation Error',
            'Call initiated but could not open call screen. Please check the Chats tab.'
          )
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to start call')
      }
    } catch (error) {
      console.error('Start call error:', error)
      Alert.alert('Error', 'Failed to start call')
    }
  }

  const handleCallPress = (call) => {
    const callId = call._id || call.id

    if (shouldShowSidebar) {
      setSelectedCallId(callId)
      if (Platform.OS === 'web') {
        window.history.pushState({}, '', `/calls/${callId}`)
      }
    } else {
      navigation.navigate('CallDetail', { call })
    }
  }

  const handleDeleteCall = async (call) => {
    const callId = call._id || call.id

    const confirmed =
      Platform.OS === 'web'
        ? window.confirm('Delete this call log?')
        : await new Promise((resolve) => {
            Alert.alert('Delete Call Log', 'Are you sure?', [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => resolve(false),
              },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => resolve(true),
              },
            ])
          })

    if (!confirmed) return

    const result = await deleteCallLog(callId)
    if (result.success) {
      Alert.alert('Success', 'Call log deleted')
    } else {
      Alert.alert('Error', result.error || 'Failed to delete call log')
    }
  }

  const handleNewCall = () => {
    navigation.navigate('CreateCall')
  }

  const renderCallsList = () => {
    if (loading && allCalls.length === 0) {
      return (
        <Container>
          <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
          <LoadingIndicator
            type="pulse"
            size="large"
            showText
            text="Loading calls..."
            showCard
            subtext="Please wait while we sync your call history"
          />
        </Container>
      )
    }

    if (!chatsContext) {
      return (
        <Container>
          <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 48,
            }}
          >
            <Ionicons name="alert-circle-outline" size={50} color="#dc2626" />
            <EmptyStateTitle style={{ color: '#dc2626', marginTop: 16 }}>
              Connection Error
            </EmptyStateTitle>
            <EmptyStateText>
              Unable to load your calls. Please check your internet connection.
            </EmptyStateText>
          </View>
        </Container>
      )
    }

    return (
      <Container>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

        <Header>
          <HeaderContent>
            <HeaderTitle>Calls</HeaderTitle>
            <HeaderActions>
              <HeaderButton onPress={handleNewCall}>
                <Ionicons name="add" size={20} color="#64748b" />
              </HeaderButton>
            </HeaderActions>
          </HeaderContent>
        </Header>

        <TabContainer>
          <Tab
            active={selectedTab === 'recent'}
            onPress={() => setSelectedTab('recent')}
          >
            <TabText active={selectedTab === 'recent'}>Recent</TabText>
          </Tab>
          <Tab
            active={selectedTab === 'missed'}
            onPress={() => setSelectedTab('missed')}
          >
            <TabText active={selectedTab === 'missed'}>Missed</TabText>
          </Tab>
          <Tab
            active={selectedTab === 'contacts'}
            onPress={() => setSelectedTab('contacts')}
          >
            <TabText active={selectedTab === 'contacts'}>Contacts</TabText>
          </Tab>
        </TabContainer>

        <CallsList showsVerticalScrollIndicator={false}>
          {selectedTab === 'recent' && (
            <>
              {recentCalls.length === 0 ? (
                <View style={{ padding: 48, alignItems: 'center' }}>
                  <Ionicons name="call-outline" size={64} color="#94a3b8" />
                  <EmptyStateTitle style={{ marginTop: 16 }}>
                    No recent calls
                  </EmptyStateTitle>
                  <EmptyStateText>
                    Start calling your contacts to see your call history here
                  </EmptyStateText>
                </View>
              ) : (
                <>
                  <SectionTitle>Recent Calls</SectionTitle>
                  {allCalls.map((call) => (
                    <CallCard
                      key={call._id || call.id}
                      call={call}
                      onPress={() => handleCallPress(call)}
                      onAudioCall={() => handleStartCall(call, 'voice')}
                      onVideoCall={() => handleStartCall(call, 'video')}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {selectedTab === 'missed' && (
            <>
              {missedCalls.length === 0 ? (
                <View style={{ padding: 48, alignItems: 'center' }}>
                  <Ionicons name="call-outline" size={64} color="#94a3b8" />
                  <EmptyStateTitle style={{ marginTop: 16 }}>
                    No missed calls
                  </EmptyStateTitle>
                  <EmptyStateText>You have no missed calls</EmptyStateText>
                </View>
              ) : (
                <>
                  <SectionTitle>Missed Calls</SectionTitle>
                  {missedCalls.map((call) => (
                    <CallCard
                      key={call._id || call.id}
                      call={call}
                      onPress={() => handleCallPress(call)}
                      onAudioCall={() => handleStartCall(call, 'voice')}
                      onVideoCall={() => handleStartCall(call, 'video')}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {selectedTab === 'contacts' && (
            <>
              {contacts.length === 0 ? (
                <View style={{ padding: 48, alignItems: 'center' }}>
                  <Ionicons name="people-outline" size={64} color="#94a3b8" />
                  <EmptyStateTitle style={{ marginTop: 16 }}>
                    No contacts
                  </EmptyStateTitle>
                  <EmptyStateText>Start a chat to add contacts</EmptyStateText>
                </View>
              ) : (
                <>
                  <SectionTitle>Your Contacts</SectionTitle>
                  {contacts.map((contact) => (
                    <ContactCard
                      key={contact.firebaseUid || contact._id}
                      contact={contact}
                      onPress={() => {}}
                      onAudioCall={() => handleStartCall(contact, 'voice')}
                      onVideoCall={() => handleStartCall(contact, 'video')}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </CallsList>
      </Container>
    )
  }

  const renderCallDetail = () => {
    if (!selectedCallId) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 32,
            backgroundColor: '#f8fafc',
          }}
        >
          <Ionicons name="call-outline" size={64} color="#94a3b8" />
          <EmptyStateTitle style={{ marginTop: 16 }}>
            Select a call
          </EmptyStateTitle>
          <EmptyStateText>
            Choose a call from the list to view details
          </EmptyStateText>
        </View>
      )
    }

    const selectedCall = allCalls.find(
      (c) => (c._id || c.id) === selectedCallId
    )

    return (
      <CallDetailScreen
        navigation={navigation}
        route={{ params: { call: selectedCall } }}
        isInSidebar={true}
      />
    )
  }

  if (!shouldShowSidebar) {
    return renderCallsList()
  }

  return (
    <WebSidebarLayout
      sidebar={renderCallsList()}
      main={renderCallDetail()}
      sidebarWidth={380}
      emptyStateType="call"
    />
  )
}
