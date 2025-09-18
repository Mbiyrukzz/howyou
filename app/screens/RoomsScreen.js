import React from 'react'
import styled from 'styled-components/native'

const Container = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background: #f9f9f9;
`

const Title = styled.Text`
  font-size: 20px;
  font-weight: bold;
`

export default function RoomsScreen() {
  return (
    <Container>
      <Title>Rooms Screen</Title>
    </Container>
  )
}
