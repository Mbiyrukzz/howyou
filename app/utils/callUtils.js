export const formatCallDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`
}

export const getCallEndMessage = (reason) => {
  switch (reason) {
    case 'timeout':
      return 'Call was not answered'
    case 'rejected':
      return 'Call was declined'
    case 'user_ended':
      return 'Call ended by other user'
    default:
      return 'The call has ended'
  }
}
