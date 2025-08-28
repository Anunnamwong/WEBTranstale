import withAuth from '@/utils/withAuth';
import React from 'react'

const AdminMainPage = () => {
  return (
    <div>AdminMainPage</div>
  )
}

export default withAuth(AdminMainPage, 'admin');