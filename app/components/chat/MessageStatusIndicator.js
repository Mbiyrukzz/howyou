import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import styled from 'styled-components/native'

// Enhanced styled components
const StatusContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-left: 6px;
  gap: 2px;
`

const StatusBadge = styled.View`
  background-color: ${(props) => {
    switch (props.status) {
      case 'read':
        return 'rgba(255, 255, 255, 0.25)'
      case 'delivered':
        return 'rgba(255, 255, 255, 0.2)'
      case 'sent':
        return 'rgba(255, 255, 255, 0.15)'
      case 'sending':
        return 'rgba(251, 191, 36, 0.2)'
      case 'failed':
        return 'rgba(239, 68, 68, 0.2)'
      default:
        return 'rgba(255, 255, 255, 0.15)'
    }
  }};
  padding: 4px 6px;
  border-radius: 8px;
  flex-direction: row;
  align-items: center;
  gap: 3px;
`

const StatusText = styled.Text`
  color: ${(props) => {
    switch (props.status) {
      case 'read':
        return 'rgba(167, 243, 208, 1)'
      case 'delivered':
        return 'rgba(191, 219, 254, 1)'
      case 'sent':
        return 'rgba(255, 255, 255, 0.9)'
      case 'sending':
        return 'rgba(253, 224, 71, 1)'
      case 'failed':
        return 'rgba(254, 202, 202, 1)'
      default:
        return 'rgba(255, 255, 255, 0.8)'
    }
  }};
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const IconWrapper = styled.View`
  position: relative;
`

const AnimatedDot = styled.View`
  width: 4px;
  height: 4px;
  border-radius: 2px;
  background-color: rgba(253, 224, 71, 1);
  margin-left: 2px;
`

const ErrorBadge = styled.View`
  background-color: rgba(255, 255, 255, 0.15);
  padding: 3px 6px;
  border-radius: 10px;
  flex-direction: row;
  align-items: center;
  gap: 3px;
  border-width: 1px;
  border-color: rgba(254, 202, 202, 0.4);
`

const SimpleIconContainer = styled.View`
  margin-left: 4px;
  flex-direction: row;
  align-items: center;
  gap: 2px;
`

export const MessageStatusIndicator = React.memo(
  ({ status, isOwn, showLabel = false, animated = false, compact = true }) => {
    if (!isOwn) return null

    const getStatusColor = () => {
      switch (status) {
        case 'read':
          return 'rgba(167, 243, 208, 1)' // Light green
        case 'delivered':
          return 'rgba(191, 219, 254, 1)' // Light blue
        case 'sent':
          return 'rgba(255, 255, 255, 0.9)'
        case 'sending':
          return 'rgba(253, 224, 71, 1)' // Light yellow
        case 'failed':
          return 'rgba(254, 202, 202, 1)' // Light red
        default:
          return 'rgba(255, 255, 255, 0.7)'
      }
    }

    const getStatusIcon = () => {
      switch (status) {
        case 'read':
          return (
            <IconWrapper>
              <Ionicons name="eye" size={11} color="rgba(167, 243, 208, 1)" />
            </IconWrapper>
          )
        case 'delivered':
          return (
            <IconWrapper>
              <Ionicons
                name="checkmark-done"
                size={12}
                color="rgba(191, 219, 254, 1)"
              />
            </IconWrapper>
          )
        case 'sent':
          return (
            <IconWrapper>
              <Ionicons
                name="checkmark"
                size={12}
                color="rgba(255, 255, 255, 0.9)"
              />
            </IconWrapper>
          )
        case 'sending':
          return (
            <IconWrapper>
              <Ionicons
                name="time-outline"
                size={11}
                color="rgba(253, 224, 71, 1)"
              />
              {animated && <AnimatedDot />}
            </IconWrapper>
          )
        case 'failed':
          return (
            <IconWrapper>
              <Ionicons
                name="alert-circle"
                size={11}
                color="rgba(254, 202, 202, 1)"
              />
            </IconWrapper>
          )
        default:
          return (
            <IconWrapper>
              <Ionicons
                name="ellipse"
                size={8}
                color="rgba(255, 255, 255, 0.5)"
              />
            </IconWrapper>
          )
      }
    }

    const getStatusLabel = () => {
      switch (status) {
        case 'read':
          return 'Read'
        case 'delivered':
          return 'Delivered'
        case 'sent':
          return 'Sent'
        case 'sending':
          return 'Sending'
        case 'failed':
          return 'Failed'
        default:
          return 'Pending'
      }
    }

    // Compact mode (default - just icons)
    if (compact && !showLabel) {
      return (
        <SimpleIconContainer>
          {status === 'read' && (
            <>
              <Ionicons
                name="checkmark-done"
                size={12}
                color="rgba(167, 243, 208, 0.7)"
              />
              <Ionicons name="eye" size={11} color="rgba(167, 243, 208, 1)" />
            </>
          )}
          {status === 'delivered' && (
            <Ionicons
              name="checkmark-done"
              size={12}
              color="rgba(191, 219, 254, 1)"
            />
          )}
          {status === 'sent' && (
            <Ionicons
              name="checkmark"
              size={12}
              color="rgba(255, 255, 255, 0.9)"
            />
          )}
          {status === 'sending' && (
            <Ionicons
              name="time-outline"
              size={11}
              color="rgba(253, 224, 71, 1)"
            />
          )}
          {status === 'failed' && (
            <Ionicons
              name="alert-circle"
              size={11}
              color="rgba(254, 202, 202, 1)"
            />
          )}
        </SimpleIconContainer>
      )
    }

    // Badge mode with labels
    if (showLabel) {
      // Special handling for failed status
      if (status === 'failed') {
        return (
          <ErrorBadge>
            <Ionicons
              name="alert-circle"
              size={11}
              color="rgba(254, 202, 202, 1)"
            />
            <StatusText status={status}>Failed</StatusText>
          </ErrorBadge>
        )
      }

      return (
        <StatusBadge status={status}>
          {getStatusIcon()}
          <StatusText status={status}>{getStatusLabel()}</StatusText>
        </StatusBadge>
      )
    }

    // Icon-only mode with background
    return (
      <StatusContainer>
        <StatusBadge status={status}>{getStatusIcon()}</StatusBadge>
      </StatusContainer>
    )
  }
)

MessageStatusIndicator.displayName = 'MessageStatusIndicator'
