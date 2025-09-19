const Row = styled.View`
  flex-direction: row;
  align-items: center;
`

const Avatar = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: #ccc;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const AvatarText = styled.Text`
  font-weight: bold;
  color: white;
`

export default function ChatItem({ name, lastMessage, onPress }) {
  const initials = name ? name.charAt(0).toUpperCase() : '?'

  return (
    <Wrapper onPress={onPress}>
      <Row>
        <Avatar>
          <AvatarText>{initials}</AvatarText>
        </Avatar>
        <View style={{ flex: 1 }}>
          <Name>{name}</Name>
          <Message numberOfLines={1}>{lastMessage}</Message>
        </View>
      </Row>
    </Wrapper>
  )
}
