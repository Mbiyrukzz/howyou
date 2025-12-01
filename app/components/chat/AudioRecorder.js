import React, { useState } from 'react'
import { Vibration } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import styled from 'styled-components/native'
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

// Additional styled components for enhanced features
const RecordingStatus = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #fee2e2;
  padding: 8px 16px;
  border-radius: 12px;
  margin-bottom: 16px;
`

const StatusText = styled.Text`
  color: #dc2626;
  font-size: 13px;
  font-weight: 600;
  margin-left: 8px;
`

const ActionLabel = styled.Text`
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
  margin-top: 8px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const ButtonWrapper = styled.View`
  align-items: center;
`

export const AudioRecorder = ({
  duration,
  onCancel,
  onStop,
  onSend,
  isRecording = true,
  showLabels = true,
  maxDuration = 300, // 5 minutes default
}) => {
  const [isPaused, setIsPaused] = useState(false)

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleCancel = () => {
    Vibration.vibrate(10)
    onCancel()
  }

  const handleStop = () => {
    Vibration.vibrate(10)
    onStop()
  }

  const handleSend = () => {
    Vibration.vibrate(10)
    onSend()
  }

  // Calculate if approaching max duration (last 30 seconds)
  const isApproachingMax = duration >= maxDuration - 30
  const hasReachedMax = duration >= maxDuration

  return (
    <AudioRecordingContainer>
      {/* Recording Status */}
      <RecordingIndicator>
        <RecordingDot />
        <RecordingText>
          {hasReachedMax ? 'Max Duration Reached' : 'Recording'}
        </RecordingText>
        <RecordingTime
          style={{
            color: isApproachingMax ? '#ef4444' : '#64748b',
          }}
        >
          {formatTime(duration)}
          {maxDuration && ` / ${formatTime(maxDuration)}`}
        </RecordingTime>
      </RecordingIndicator>

      {/* Warning for max duration */}
      {isApproachingMax && !hasReachedMax && (
        <RecordingStatus>
          <Ionicons name="warning" size={16} color="#dc2626" />
          <StatusText>
            Recording will stop in {maxDuration - duration}s
          </StatusText>
        </RecordingStatus>
      )}

      {/* Sound Wave Animation */}
      <SoundWaveAnimation isRecording={isRecording && !isPaused} />

      {/* Action Buttons */}
      <RecordingActions>
        <ButtonWrapper>
          <CancelRecordButton onPress={handleCancel} activeOpacity={0.7}>
            <Ionicons name="close" size={28} color="white" />
          </CancelRecordButton>
          {showLabels && <ActionLabel>Cancel</ActionLabel>}
        </ButtonWrapper>

        <ButtonWrapper>
          <RecordButton
            recording={isRecording}
            onPress={handleStop}
            activeOpacity={0.8}
          >
            <Ionicons name="stop" size={28} color="white" />
          </RecordButton>
          {showLabels && <ActionLabel>Stop</ActionLabel>}
        </ButtonWrapper>

        <ButtonWrapper>
          <SendRecordButton
            onPress={handleSend}
            activeOpacity={0.7}
            disabled={duration < 1}
            style={{
              opacity: duration < 1 ? 0.5 : 1,
            }}
          >
            <Ionicons name="send" size={24} color="white" />
          </SendRecordButton>
          {showLabels && <ActionLabel>Send</ActionLabel>}
        </ButtonWrapper>
      </RecordingActions>

      {/* Hint Text */}
      {duration < 2 && (
        <RecordingStatus style={{ backgroundColor: '#dbeafe', marginTop: 16 }}>
          <Ionicons name="information-circle" size={16} color="#2563eb" />
          <StatusText style={{ color: '#2563eb' }}>
            Tap stop when done, or send to share
          </StatusText>
        </RecordingStatus>
      )}
    </AudioRecordingContainer>
  )
}
