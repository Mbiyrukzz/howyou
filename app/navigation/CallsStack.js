import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import CreateCallScreen from '../screens/CreateCallScreen'
import CallsScreen from '../screens/CallsScreen'
import { CallDetailScreen } from '../screens/CallDetailScreen'

const Stack = createNativeStackNavigator()

export default function CallsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="CallsScreen"
        component={CallsScreen}
        options={{ title: 'Calls' }}
      />
      <Stack.Screen
        name="CallDetail"
        component={CallDetailScreen}
        options={({ route }) => ({
          title: route.params?.contact?.name ?? 'Call Details',
          headerShown: true,
        })}
      />
      <Stack.Screen
        name="CreateCall"
        component={CreateCallScreen}
        options={{
          title: 'New Call',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  )
}
