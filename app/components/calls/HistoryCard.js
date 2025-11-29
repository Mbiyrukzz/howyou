import styled from 'styled-components/native'

const HistoryCard = styled.TouchableOpacity`
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border-width: 1px;
  border-color: #e2e8f0;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.05;
  shadow-radius: 2px;
  elevation: 1;
`

const HistoryHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`

const HistoryCallType = styled.View`
  flex-direction: row;
  align-items: center;
`

const HistoryTypeIcon = styled.Text`
  font-size: 16px;
  margin-right: 8px;
`

const HistoryTypeText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
`

const HistoryDuration = styled.Text`
  font-size: 15px;
  font-weight: 700;
  color: #10b981;
`

const HistoryDateTime = styled.Text`
  font-size: 13px;
  color: #94a3b8;
`

const HistoryStatusBadge = styled.View`
  background-color: ${(props) => {
    switch (props.type) {
      case 'missed':
        return '#fee2e2'
      case 'rejected':
        return '#fef3c7'
      default:
        return '#d1fae5'
    }
  }};
  padding: 4px 12px;
  border-radius: 12px;
  margin-top: 8px;
  align-self: flex-start;
`

const HistoryStatusText = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: ${(props) => {
    switch (props.type) {
      case 'missed':
        return '#ef4444'
      case 'rejected':
        return '#f59e0b'
      default:
        return '#10b981'
    }
  }};
`

export function CallHistoryCard({ call, onLongPress }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'missed':
        return 'Missed Call'
      case 'rejected':
        return 'Call Rejected'
      case 'completed':
        return 'Completed'
      default:
        return status
    }
  }

  return (
    <HistoryCard onLongPress={() => onLongPress?.(call)}>
      <HistoryHeader>
        <HistoryCallType>
          <HistoryTypeIcon>
            {call.callType === 'video' ? '📹' : '📞'}
          </HistoryTypeIcon>
          <HistoryTypeText>
            {call.type?.charAt(0).toUpperCase() + call.type?.slice(1)}{' '}
            {call.callType}
          </HistoryTypeText>
        </HistoryCallType>
        {call.duration && call.duration !== '0:00' && (
          <HistoryDuration>{call.duration}</HistoryDuration>
        )}
      </HistoryHeader>
      <HistoryDateTime>
        {formatDate(call.createdAt || call.date)}
      </HistoryDateTime>
      {(call.status === 'missed' || call.status === 'rejected') && (
        <HistoryStatusBadge type={call.status}>
          <HistoryStatusText type={call.status}>
            {getStatusText(call.status)}
          </HistoryStatusText>
        </HistoryStatusBadge>
      )}
    </HistoryCard>
  )
}
