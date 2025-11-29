import styled from 'styled-components/native'
import { ScrollView } from 'react-native'
import { CallHistoryCard } from '../components/calls/HistoryCard'

const DetailContainer = styled.View`
  flex: 1;
  background-color: #1a1a2e;
`

const DetailHeader = styled.View`
  align-items: center;
  padding: 40px 20px;
  background-color: rgba(255, 255, 255, 0.05);
`

const ProfileAvatar = styled.View`
  width: 100px;
  height: 100px;
  border-radius: 50px;
  background-color: ${(props) => props.color || '#3396D3'};
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`

const ProfileAvatarText = styled.Text`
  color: white;
  font-size: 40px;
  font-weight: 700;
`

const ContactName = styled.Text`
  font-size: 28px;
  font-weight: 800;
  color: white;
  margin-bottom: 8px;
`

const ContactStatus = styled.Text`
  font-size: 15px;
  color: ${(props) => (props.online ? '#10b981' : 'rgba(255, 255, 255, 0.6)')};
  margin-bottom: 20px;
`

const ActionButtons = styled.View`
  flex-direction: row;
  gap: 16px;
`

const ActionWrapper = styled.View`
  align-items: center;
`

const ActionButton = styled.TouchableOpacity`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: ${(props) => props.color || '#3396D3'};
  align-items: center;
  justify-content: center;
  shadow-color: ${(props) => props.color || '#3396D3'};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 12px;
  elevation: 8;
`

const ActionIcon = styled.Text`
  font-size: 24px;
`

const ActionLabel = styled.Text`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 8px;
  text-align: center;
`

const SectionContainer = styled.View`
  padding: 20px;
`

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin-bottom: 16px;
`

const StatsContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 24px;
`

const StatCard = styled.View`
  flex: 1;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px;
  margin: 0 6px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
  align-items: center;
`

const StatValue = styled.Text`
  font-size: 24px;
  font-weight: 800;
  color: white;
  margin-bottom: 4px;
`

const StatLabel = styled.Text`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
`

const FrequentlyCalledBadge = styled.View`
  background-color: rgba(251, 191, 36, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  margin: 16px 0;
  align-self: center;
  flex-direction: row;
  align-items: center;
`

const BadgeText = styled.Text`
  font-size: 13px;
  font-weight: 600;
  color: #fbbf24;
  margin-left: 6px;
`

const FavoriteButton = styled.TouchableOpacity`
  position: absolute;
  top: 40px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: rgba(255, 255, 255, 0.1);
  align-items: center;
  justify-content: center;
`

const FavoriteIcon = styled.Text`
  font-size: 20px;
`

const DetailEmptyState = styled.View`
  align-items: center;
  padding: 40px 20px;
`

const DetailEmptyStateText = styled.Text`
  font-size: 15px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
`

export function CallDetailScreen({ route, navigation }) {
  const { contact } = route?.params || {}
  const [isFavorite, setIsFavorite] = useState(contact?.isFavorite || false)
  const [callHistory, setCallHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const {
    chats,
    calls,
    initiateCall,
    getCallHistory,
    deleteCallLog,
    findUserById,
    isUserOnline,
    getLastSeen,
  } = useChats()

  useEffect(() => {
    if (contact?.id || contact?.participantId) {
      loadCallHistory()
    }
  }, [contact, calls])

  const loadCallHistory = async () => {
    setLoading(true)
    try {
      const userId = contact.id || contact.participantId

      const userChats = chats.filter((chat) =>
        chat.participants?.includes(userId)
      )

      let allCalls = []

      for (const chat of userChats) {
        const chatId = chat._id || chat.id
        const chatCalls = calls[chatId] || []
        allCalls = [...allCalls, ...chatCalls]
      }

      allCalls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      setCallHistory(allCalls)
    } catch (error) {
      console.error('Error loading call history:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    if (callHistory.length === 0) {
      return {
        totalCalls: 0,
        totalDuration: '0m',
        averageDuration: '0m',
      }
    }

    const totalCalls = callHistory.length
    let totalSeconds = 0

    callHistory.forEach((call) => {
      if (call.duration) {
        const parts = call.duration.split(':')
        if (parts.length === 2) {
          totalSeconds += parseInt(parts[0]) * 60 + parseInt(parts[1])
        }
      }
    })

    const totalMinutes = Math.floor(totalSeconds / 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    const totalDuration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

    const avgSeconds = Math.floor(totalSeconds / totalCalls)
    const avgMinutes = Math.floor(avgSeconds / 60)
    const avgSecs = avgSeconds % 60
    const averageDuration = `${avgMinutes}m ${avgSecs}s`

    return { totalCalls, totalDuration, averageDuration }
  }

  const stats = calculateStats()
  const user = findUserById(contact?.id || contact?.participantId)
  const online = isUserOnline(contact?.id || contact?.participantId)
  const lastSeen = getLastSeen(contact?.id || contact?.participantId)

  const handleCall = async (callType) => {
    Vibration.vibrate(10)

    const userId = contact.id || contact.participantId
    const chat = chats.find((c) => c.participants?.includes(userId))

    if (!chat) {
      Alert.alert('Error', 'Could not find chat with this user')
      return
    }

    try {
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

  const handleMessage = () => {
    Vibration.vibrate(10)
    const userId = contact.id || contact.participantId
    const chat = chats.find((c) => c.participants?.includes(userId))

    if (chat) {
      navigation.navigate('Chat', {
        chatId: chat._id || chat.id,
      })
    } else {
      Alert.alert('Error', 'Could not find chat with this user')
    }
  }

  const toggleFavorite = () => {
    Vibration.vibrate(10)
    setIsFavorite(!isFavorite)
  }

  const handleDeleteCall = async (call) => {
    Alert.alert(
      'Delete Call',
      'Are you sure you want to delete this call from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Vibration.vibrate(10)
            try {
              const result = await deleteCallLog(call._id || call.id)
              if (result.success) {
                loadCallHistory()
              } else {
                Alert.alert('Error', result.error || 'Could not delete call')
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete call')
            }
          },
        },
      ]
    )
  }

  const renderCallHistoryItem = ({ item }) => (
    <CallHistoryCard call={item} onLongPress={handleDeleteCall} />
  )

  const getStatusText = () => {
    if (online) return 'Active now'
    if (lastSeen) {
      const lastSeenDate = new Date(lastSeen)
      const now = new Date()
      const diff = now - lastSeenDate
      const minutes = Math.floor(diff / (1000 * 60))
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)

      if (minutes < 1) return 'Active just now'
      if (minutes < 60) return `Active ${minutes}m ago`
      if (hours < 24) return `Active ${hours}h ago`
      return `Active ${days}d ago`
    }
    return 'Offline'
  }

  return (
    <DetailContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DetailHeader>
          <FavoriteButton onPress={toggleFavorite}>
            <FavoriteIcon>{isFavorite ? '⭐' : '☆'}</FavoriteIcon>
          </FavoriteButton>

          <ProfileAvatar color={contact?.color || '#3396D3'}>
            <ProfileAvatarText>
              {contact?.name?.charAt(0) || user?.name?.charAt(0) || '?'}
            </ProfileAvatarText>
          </ProfileAvatar>

          <ContactName>{contact?.name || user?.name || 'Unknown'}</ContactName>
          <ContactStatus online={online}>{getStatusText()}</ContactStatus>

          <ActionButtons>
            <ActionWrapper>
              <ActionButton color="#3396D3" onPress={() => handleCall('audio')}>
                <ActionIcon>📞</ActionIcon>
              </ActionButton>
              <ActionLabel>Audio</ActionLabel>
            </ActionWrapper>

            <ActionWrapper>
              <ActionButton color="#10b981" onPress={() => handleCall('video')}>
                <ActionIcon>📹</ActionIcon>
              </ActionButton>
              <ActionLabel>Video</ActionLabel>
            </ActionWrapper>

            <ActionWrapper>
              <ActionButton color="#8b5cf6" onPress={handleMessage}>
                <ActionIcon>💬</ActionIcon>
              </ActionButton>
              <ActionLabel>Message</ActionLabel>
            </ActionWrapper>
          </ActionButtons>

          {stats.totalCalls > 20 && (
            <FrequentlyCalledBadge>
              <ActionIcon>🔥</ActionIcon>
              <BadgeText>Frequently Called Contact</BadgeText>
            </FrequentlyCalledBadge>
          )}
        </DetailHeader>

        <SectionContainer>
          <SectionTitle>Call Statistics</SectionTitle>
          <StatsContainer>
            <StatCard>
              <StatValue>{stats.totalCalls}</StatValue>
              <StatLabel>Total Calls</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{stats.totalDuration}</StatValue>
              <StatLabel>Total Time</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{stats.averageDuration}</StatValue>
              <StatLabel>Avg Duration</StatLabel>
            </StatCard>
          </StatsContainer>

          <SectionTitle>Call History</SectionTitle>
          {callHistory.length > 0 ? (
            <FlatList
              data={callHistory}
              renderItem={renderCallHistoryItem}
              keyExtractor={(item) => (item._id || item.id).toString()}
              scrollEnabled={false}
            />
          ) : (
            <DetailEmptyState>
              <DetailEmptyStateText>
                {loading ? 'Loading call history...' : 'No call history yet'}
              </DetailEmptyStateText>
            </DetailEmptyState>
          )}
        </SectionContainer>
      </ScrollView>
    </DetailContainer>
  )
}
