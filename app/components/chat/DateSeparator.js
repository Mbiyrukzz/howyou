import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import styled from 'styled-components/native'
import {
  DateSeparator as DateSeparatorStyled,
  DateText,
} from '../../styles/chatStyles'

// Enhanced styled components
const DateContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin: 24px 0 16px;
`

const DateBadge = styled.View`
  background-color: #f1f5f9;
  padding: 8px 16px;
  border-radius: 20px;
  flex-direction: row;
  align-items: center;
  shadow-color: #64748b;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`

const DateIcon = styled.View`
  margin-right: 8px;
`

const EnhancedDateText = styled.Text`
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
`

const DateLine = styled.View`
  flex: 1;
  height: 1px;
  background-color: #e2e8f0;
  margin: 0 16px;
`

const TodayBadge = styled.View`
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  padding: 4px 8px;
  border-radius: 10px;
  margin-left: 8px;
`

const TodayText = styled.Text`
  color: white;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

export const DateSeparator = ({
  date,
  showIcon = true,
  showLines = false,
  isToday = false,
}) => {
  const getDateIcon = () => {
    if (isToday) return 'today'
    return 'calendar-outline'
  }

  if (showLines) {
    return (
      <DateContainer>
        <DateLine />
        <DateBadge>
          {showIcon && (
            <DateIcon>
              <Ionicons name={getDateIcon()} size={14} color="#64748b" />
            </DateIcon>
          )}
          <EnhancedDateText>{date}</EnhancedDateText>
          {isToday && (
            <TodayBadge>
              <TodayText>Today</TodayText>
            </TodayBadge>
          )}
        </DateBadge>
        <DateLine />
      </DateContainer>
    )
  }

  return (
    <DateContainer>
      <DateBadge>
        {showIcon && (
          <DateIcon>
            <Ionicons name={getDateIcon()} size={14} color="#64748b" />
          </DateIcon>
        )}
        <EnhancedDateText>{date}</EnhancedDateText>
        {isToday && (
          <TodayBadge>
            <TodayText>Today</TodayText>
          </TodayBadge>
        )}
      </DateBadge>
    </DateContainer>
  )
}
