import React from 'react'
import styled from 'styled-components/native'

const AvatarContainer = styled.View`
  width: ${(props) => props.size || 40}px;
  height: ${(props) => props.size || 40}px;
  border-radius: ${(props) => (props.size || 40) / 2}px;
  background-color: ${(props) => props.color || '#3b82f6'};
  justify-content: center;
  align-items: center;
  position: relative;
  shadow-color: ${(props) => props.color || '#3b82f6'};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
  elevation: 3;
`

const AvatarText = styled.Text`
  color: white;
  font-size: ${(props) => (props.size > 50 ? 22 : 16)}px;
  font-weight: 700;
`

const OnlineIndicator = styled.View`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: #10b981;
  position: absolute;
  bottom: -2px;
  right: -2px;
  border-width: 2px;
  border-color: #fff;
`

export const Avatar = ({ name, color, size = 40, online = false }) => {
  const initials = name?.charAt(0).toUpperCase() || '?'

  return (
    <AvatarContainer size={size} color={color}>
      <AvatarText size={size}>{initials}</AvatarText>
      {online && <OnlineIndicator />}
    </AvatarContainer>
  )
}
