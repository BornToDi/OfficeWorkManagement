"use client"
import React from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import ProtectedRoute from './ProtectedRoute'
import { usePathname } from 'next/navigation'

export default function Layout({ children, protect = true }){
  const pathname = usePathname()
  const isChatPage = pathname === '/chat'

  const content = (
    <div className="min-h-screen hero-glow">
      <Navbar />
      <div className={isChatPage ? 'container flex gap-0 py-0 lg:py-0' : 'container flex gap-6 py-6 lg:py-8'}>
        <Sidebar />
        <div className={isChatPage ? 'flex-1 min-w-0 py-0' : 'flex-1 min-w-0'}>
          {children}
        </div>
      </div>
    </div>
  )

  if (protect) return <ProtectedRoute>{content}</ProtectedRoute>
  return content
}
