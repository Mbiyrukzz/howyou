import React from 'react'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

const Status = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 6px 12px;
  border-radius: 20px;
  background-color: ${({ state }) =>
    state === 'connected'
      ? '#dcfce7'
      : state === 'reconnecting'
      ? '#fef3c7'
      : '#fee2e2'};
`

const Dot = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${({ state }) =>
    state === 'connected'
      ? '#16a34a'
      : state === 'reconnecting'
      ? '#f59e0b'
      : '#ef4444'};
  margin-right: 6px;
`

const Text = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: ${({ state }) =>
    state === 'connected'
      ? '#166534'
      : state === 'reconnecting'
      ? '#9a3412'
      : '#991b1b'};
`

export const ConnectionStatus = ({ state, onPress }) => (
  <Status state={state} onPress={onPress}>
    <Dot state={state} />
    <Text state={state}>
      {state === 'connected'
        ? 'Online'
        : state === 'reconnecting'
        ? 'Reconnecting...'
        : 'Offline'}
    </Text>
  </Status>
)
