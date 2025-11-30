import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

const HistoryCard = styled.TouchableOpacity`
  background-color: #fff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  border-width: 1px;
  border-color: #e2e8f0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 2;
`

const HistoryHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`

const HistoryLeft = styled.View`
  flex: 1;
`

const HistoryCallType = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 6px;
`

const IconWrapper = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: ${(props) => props.bgColor || '#f1f5f9'};
  align-items: center;
  justify-content: center;
  margin-right: 12px;
`

const HistoryTypeText = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
`

const HistoryDateTime = styled.Text`
  font-size: 13px;
  color: #64748b;
  margin-left: 48px;
`

const HistoryDuration = styled.View`
  background-color: #dcfce7;
  padding: 6px 12px;
  border-radius: 12px;
  align-self: flex-start;
`

const HistoryDurationText = styled.Text`
  font-size: 13px;
  font-weight: 700;
  color: #16a34a;
`

const HistoryStatusBadge = styled.View`
  background-color: ${(props) => {
    switch (props.type) {
      case 'missed':
        return '#fee2e2'
      case 'rejected':
        return '#fef3c7'
      case 'ended':
        return '#dbeafe'
      default:
        return '#dcfce7'
    }
  }};
  padding: 6px 12px;
  border-radius: 12px;
  margin-top: 8px;
  align-self: flex-start;
  flex-direction: row;
  align-items: center;
`

const StatusDot = styled.View`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  margin-right: 6px;
  background-color: ${(props) => {
    switch (props.type) {
      case 'missed':
        return '#ef4444'
      case 'rejected':
        return '#f59e0b'
      case 'ended':
        return '#3b82f6'
      default:
        return '#10b981'
    }
  }};
`

const HistoryStatusText = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: ${(props) => {
    switch (props.type) {
      case 'missed':
        return '#dc2626'
      case 'rejected':
        return '#d97706'
      case 'ended':
        return '#2563eb'
      default:
        return '#16a34a'
    }
  }};
`

export function CallHistoryCard({ call, onLongPress }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'

    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    if (days < 7) return `${days}d ago`

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const getCallTypeDisplay = () => {
    const type = call.callType || 'voice'
    return type.charAt(0).toUpperCase() + type.slice(1) + ' Call'
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'missed':
        return 'Missed'
      case 'rejected':
        return 'Declined'
      case 'completed':
        return 'Completed'
      case 'ended':
        return 'Ended'
      default:
        return status
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : 'Unknown'
    }
  }

  const getIconColor = () => {
    if (call.status === 'missed') return '#ef4444'
    if (call.status === 'rejected') return '#f59e0b'
    if (call.callType === 'video') return '#10b981'
    return '#3b82f6'
  }

  const getIconBgColor = () => {
    if (call.status === 'missed') return '#fee2e2'
    if (call.status === 'rejected') return '#fef3c7'
    if (call.callType === 'video') return '#dcfce7'
    return '#dbeafe'
  }

  const hasDuration = call.duration !== undefined && call.duration !== null

  return (
    <HistoryCard onLongPress={() => onLongPress?.(call)} activeOpacity={0.7}>
      <HistoryHeader>
        <HistoryLeft>
          <HistoryCallType>
            <IconWrapper bgColor={getIconBgColor()}>
              <Ionicons
                name={call.callType === 'video' ? 'videocam' : 'call'}
                size={20}
                color={getIconColor()}
              />
            </IconWrapper>
            <HistoryTypeText>{getCallTypeDisplay()}</HistoryTypeText>
          </HistoryCallType>
          <HistoryDateTime>
            {formatDate(call.createdAt || call.date)}
          </HistoryDateTime>
        </HistoryLeft>

        {hasDuration && (
          <HistoryDuration>
            <HistoryDurationText>{call.duration || '0:00'}</HistoryDurationText>
          </HistoryDuration>
        )}
      </HistoryHeader>

      {call.status && (
        <HistoryStatusBadge type={call.status}>
          <StatusDot type={call.status} />
          <HistoryStatusText type={call.status}>
            {getStatusText(call.status)}
          </HistoryStatusText>
        </HistoryStatusBadge>
      )}
    </HistoryCard>
  )
}
