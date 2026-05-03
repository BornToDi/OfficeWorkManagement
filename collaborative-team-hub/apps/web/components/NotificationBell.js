"use client"
import React, { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'

export default function NotificationBell() {
  const [notes, setNotes] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshAccessToken = useAuthStore((s) => s.refreshAccessToken)
  const dropdownRef = useRef(null)
  const unreadCount = notes.filter((note) => !note.isRead).length

  useEffect(() => {
    if (!accessToken) {
      setNotes([])
      return
    }

    async function authFetch(url, options = {}) {
      const firstRes = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (firstRes.status !== 401) return firstRes

      const nextToken = await refreshAccessToken()
      if (!nextToken) return firstRes

      return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${nextToken}`
        }
      })
    }

    async function load() {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notifications`)
        if (!res.ok) return
        const data = await res.json()
        setNotes(data)
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }
    }

    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [accessToken])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function markRead(id) {
    try {
      let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      })
      if (res.status === 401) {
        const nextToken = await refreshAccessToken()
        if (nextToken) {
          res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notifications/${id}/read`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { Authorization: `Bearer ${nextToken}` }
          })
        }
      }
      if (!res.ok) return
      setNotes((current) => current.map((note) => (note.id === id ? { ...note, isRead: true } : note)))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10 hover:text-white"
        title="Notifications"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white shadow">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            <p className="text-xs text-slate-500">{unreadCount} unread</p>
          </div>

          <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {notes.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet</div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={`px-4 py-3 transition ${note.isRead ? 'bg-white' : 'bg-blue-50/70'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-sm ${note.isRead ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>
                        {note.message}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">{new Date(note.createdAt).toLocaleString()}</p>
                    </div>
                    {!note.isRead && (
                      <button
                        onClick={() => markRead(note.id)}
                        className="whitespace-nowrap text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
