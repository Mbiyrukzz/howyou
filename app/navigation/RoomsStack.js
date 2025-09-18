import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import RoomsScreen from '../screens/RoomsScreen'
import RoomsDetailScreen from '../screens/RoomsDetailScreen'
import CreateRoomScreen from '../screens/CreateRoomScreen'

const Stack = createNativeStackNavigator()

export default function RoomsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RoomsHome"
        component={RoomsScreen}
        options={{ title: 'Rooms' }}
      />
      <Stack.Screen
        name="RoomsDetail"
        component={RoomsDetailScreen}
        options={({ route }) => ({
          title: route.params?.room?.name ?? 'Room Detail',
        })}
      />
      <Stack.Screen
        name="CreateRoom"
        component={CreateRoomScreen}
        options={{ title: 'Create Room' }}
      />
    </Stack.Navigator>
  )
}
