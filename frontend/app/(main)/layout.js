import React from 'react'
import DashboardProvider from './provider'

function DashboardLayout({children}) {
  return (
    <DashboardProvider>{children}</DashboardProvider>
  )
}

export default DashboardLayout