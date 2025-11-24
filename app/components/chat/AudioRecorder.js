import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import {
  AudioRecordingContainer,
  RecordingIndicator,
  RecordingDot,
  RecordingText,
  RecordingTime,
  RecordingActions,
  RecordButton,
  CancelRecordButton,
  SendRecordButton,
} from '../../styles/chatStyles'
import { SoundWaveAnimation } from './SoundWaveAnimation'

export const AudioRecorder = ({ duration, onCancel, onStop, onSend }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <AudioRecordingContainer>
      <RecordingIndicator>
        <RecordingDot />
        <RecordingText>Recording</RecordingText>
        <RecordingTime>{formatTime(duration)}</RecordingTime>
      </RecordingIndicator>

      <SoundWaveAnimation />

      <RecordingActions>
        <CancelRecordButton onPress={onCancel}>
          <Ionicons name="close" size={28} color="white" />
        </CancelRecordButton>
        <RecordButton recording={true}>
          <Ionicons name="stop" size={28} color="white" />
        </RecordButton>
        <SendRecordButton onPress={onSend}>
          <Ionicons name="send" size={24} color="white" />
        </SendRecordButton>
      </RecordingActions>
    </AudioRecordingContainer>
  )
}
