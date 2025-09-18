import React from 'react'
import styled from 'styled-components/native'

const Wrapper = styled.TouchableOpacity`
  background: white;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  elevation: 2;
`

const Name = styled.Text`
  font-size: 16px;
  font-weight: bold;
`

const Message = styled.Text`
  font-size: 14px;
  color: #666;
`

export default function ChatItem({ name, lastMessage }) {
  return (
    <Wrapper>
      <Name>{name}</Name>
      <Message>{lastMessage}</Message>
    </Wrapper>
  )
}
