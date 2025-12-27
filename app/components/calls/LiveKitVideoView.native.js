import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { VideoView } from '@livekit/react-native'

export const LiveKitVideoView = ({
  localVideoTrack,
  remoteVideoTrack,
  callType,
  isVideoEnabled,
  remoteUserName,
  callStatus,
  isConnected,
}) => {
  const initials = remoteUserName?.[0]?.toUpperCase() ?? '?'

  if (callType === 'voice') {
    return (
      <View style={styles.center}>
        <Text style={styles.avatar}>{initials}</Text>
        <Text style={styles.status}>
          {isConnected ? 'Connected' : callStatus}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {remoteVideoTrack ? (
        <VideoView track={remoteVideoTrack} style={styles.remote} />
      ) : (
        <View style={styles.center}>
          <Text style={styles.avatar}>{initials}</Text>
          <Text style={styles.status}>Waiting for video…</Text>
        </View>
      )}

      {localVideoTrack && isVideoEnabled && (
        <VideoView track={localVideoTrack} mirror style={styles.local} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  remote: {
    flex: 1,
  },
  local: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 120,
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3b82f6',
    color: '#fff',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 32,
    fontWeight: '600',
  },
  status: {
    color: '#94a3b8',
    marginTop: 12,
  },
})
