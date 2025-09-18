import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function CreateRoomScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Create Room Screen (coming soon)</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
  },
})
