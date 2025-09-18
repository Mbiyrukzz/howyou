import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import RoomsScreen from '../screens/RoomsScreen'

const Stack = createNativeStackNavigator()

export default function RoomsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RoomsHome"
        component={RoomsScreen}
        options={{ title: 'Rooms' }}
      />
    </Stack.Navigator>
  )
}
