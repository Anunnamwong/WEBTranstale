import withAuth from '@/utils/withAuth';
import React from 'react'

const UserMainPage = () => {
  return (
    <div>UserMainPage</div>
  )
}

export default withAuth(UserMainPage, 'user');