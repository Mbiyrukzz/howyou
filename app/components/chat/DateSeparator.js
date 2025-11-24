import React from 'react'
import {
  DateSeparator as DateSeparatorStyled,
  DateText,
} from '../../styles/chatStyles'

export const DateSeparator = ({ date }) => {
  return (
    <DateSeparatorStyled>
      <DateText>{date}</DateText>
    </DateSeparatorStyled>
  )
}
