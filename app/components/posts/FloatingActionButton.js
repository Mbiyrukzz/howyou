import React from 'react'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

const FAB = styled.TouchableOpacity`
  position: absolute;
  right: 30px;
  bottom: 30px;
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background-color: #3b82f6;
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 8;
  border-width: 3px;
  border-color: #fff;
`

export const FloatingActionButton = ({ onPress }) => {
  return (
    <FAB onPress={onPress}>
      <Ionicons name="add" size={32} color="#fff" />
    </FAB>
  )
}
