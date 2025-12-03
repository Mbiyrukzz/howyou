import React from 'react'
import styled from 'styled-components/native'
import { Image } from 'react-native'

const ImageContainer = styled.View`
  height: 300px;
  margin: 0 16px 12px;
  border-radius: 12px;
  overflow: hidden;
  background-color: #f1f5f9;
`

export const PostImage = ({ url }) => (
  <ImageContainer>
    <Image
      source={{ uri: url }}
      style={{ width: '100%', height: '100%' }}
      resizeMode="cover"
    />
  </ImageContainer>
)
