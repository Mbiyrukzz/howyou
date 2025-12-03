import React from 'react'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

const HeaderContainer = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  padding-bottom: 12px;
`

const PostAvatar = styled.View`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: ${(props) => props.color || '#3b82f6'};
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  position: relative;
  shadow-color: ${(props) => props.color || '#3b82f6'};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
  elevation: 3;
`

const PostAvatarText = styled.Text`
  color: white;
  font-size: 22px;
  font-weight: 700;
`

const PostUserInfo = styled.View`
  flex: 1;
`

const PostUsername = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
`

const PostTimestamp = styled.Text`
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
`

const PostMenuButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: #f1f5f9;
  align-items: center;
  justify-content: center;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
`

export const PostHeader = ({
  avatarColor,
  initials,
  username,
  timestamp,
  onMenuPress,
  showMenu = false,
}) => {
  return (
    <HeaderContainer>
      <PostAvatar color={avatarColor}>
        <PostAvatarText>{initials}</PostAvatarText>
      </PostAvatar>

      <PostUserInfo>
        <PostUsername>{username}</PostUsername>
        <PostTimestamp>{timestamp}</PostTimestamp>
      </PostUserInfo>

      {showMenu && (
        <PostMenuButton onPress={onMenuPress}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#64748b" />
        </PostMenuButton>
      )}
    </HeaderContainer>
  )
}
