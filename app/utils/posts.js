export const getInitials = (name) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

export const formatPostTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export const formatDetailedTime = (timestamp) => {
  const date = new Date(timestamp)
  return {
    date: date.toLocaleDateString([], {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
}

export const getConnectionText = (state) => {
  switch (state) {
    case 'connected':
      return 'Online'
    case 'connecting':
      return 'Connecting...'
    case 'reconnecting':
      return 'Reconnecting...'
    case 'error':
      return 'Error - Tap to retry'
    case 'failed':
      return 'Offline - Tap to retry'
    default:
      return 'Disconnected'
  }
}

export const getConnectionColor = (state) => {
  switch (state) {
    case 'connected':
      return '#28a745'
    case 'connecting':
      return '#ffc107'
    case 'reconnecting':
      return '#ffc107'
    case 'error':
      return '#dc3545'
    case 'failed':
      return '#dc3545'
    default:
      return '#6c757d'
  }
}

export const getConnectionBgColor = (state) => {
  switch (state) {
    case 'connected':
      return '#d4edda'
    case 'connecting':
      return '#fff3cd'
    case 'reconnecting':
      return '#fff3cd'
    case 'error':
      return '#f8d7da'
    case 'failed':
      return '#f8d7da'
    default:
      return '#e9ecef'
  }
}
