import React from 'react'
import styled from 'styled-components/native'

const Container = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background: #fff;
`

const Title = styled.Text`
  font-size: 20px;
  font-weight: bold;
`

export default function PostDetailScreen() {
  return (
    <Container>
      <Title>Post Detail Screen</Title>
    </Container>
  )
}
