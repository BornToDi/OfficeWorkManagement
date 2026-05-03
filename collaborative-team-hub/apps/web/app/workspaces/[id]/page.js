"use client"
import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '../../../store/useAuthStore'

export default function WorkspaceDetail() {
  const params = useParams()
  const workspaceId = params?.id
  const apiBaseUrl = 'http://localhost:5000'
  const { user, accessToken, setActiveWorkspace } = useAuthStore()
  const [workspace, setWorkspace] = useState(null)
  const [members, setMembers] = useState([])
  const [messages, setMessages] = useState([])
  const [files, setFiles] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [pendingFile, setPendingFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  function resolveFileUrl(fileUrl) {
    if (!fileUrl) return ''
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl
    return `${apiBaseUrl}${fileUrl}`
  }

  useEffect(() => {
    if (!workspaceId || !accessToken) return

    let cancelled = false

    async function loadWorkspace() {
      try {
        const [workspaceRes, membersRes, messagesRes, filesRes] = await Promise.all([
          fetch(`http://localhost:5000/api/workspaces/${workspaceId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            credentials: 'include'
          }),
          fetch(`http://localhost:5000/api/workspaces/${workspaceId}/members`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            credentials: 'include'
          }),
          fetch(`http://localhost:5000/api/workspaces/${workspaceId}/messages?limit=50`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            credentials: 'include'
          }),
          fetch(`http://localhost:5000/api/workspaces/${workspaceId}/files`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            credentials: 'include'
          })
        ])

        if (cancelled) return

        if (workspaceRes.ok) setWorkspace(await workspaceRes.json())
        if (membersRes.ok) setMembers(await membersRes.json())
        if (messagesRes.ok) setMessages(await messagesRes.json())
        if (filesRes.ok) setFiles(await filesRes.json())
      } catch (err) {
        console.error('Failed to load workspace detail:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadWorkspace()
    setActiveWorkspace(workspaceId)

    return () => {
      cancelled = true
    }
  }, [workspaceId, accessToken, setActiveWorkspace])

  async function handleSendMessage() {
    if (!newMessage.trim()) return

    try {
      const res = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ content: newMessage }),
        credentials: 'include'
      })

      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => [...prev, msg])
        setNewMessage('')
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setPendingFile(file)
    setSelectedFileName(file.name)
  }

  async function submitSelectedFile() {
    if (!pendingFile) return

    const formData = new FormData()
    formData.append('file', pendingFile)

    try {
      const res = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}/files`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: formData,
        credentials: 'include'
      })

        if (res.ok) {
        const uploadedFile = await res.json()
        setFiles(prev => [uploadedFile, ...prev])
        if (fileInputRef.current) fileInputRef.current.value = ''
        setSelectedFileName('')
        setPendingFile(null)
      }
    } catch (err) {
      console.error('Failed to upload file:', err)
    }
  }


  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  if (!user || !workspace) {
    return <div className="p-6">Workspace not found or access denied.</div>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Members</h2>
          <p className="text-xs text-gray-500 mt-1">{members.length} members</p>
        </div>
        <div className="p-4 space-y-3">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div>
                <div className="text-sm font-medium text-gray-800">{m.user.name}</div>
                <div className="text-xs text-gray-500">{m.role}</div>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full" />
            </div>
          ))}
        </div>

        
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">{workspace.name}</h1>
          <p className="text-sm text-gray-600 mt-1">{workspace.description}</p>
        </div>

        <div className="bg-slate-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Workspace</h2>
              <p className="text-xs text-gray-500">Use the dedicated goals and announcements pages from the workspace list.</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : null}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.authorId === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.authorId === user.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                <div className="text-xs font-semibold mb-1">{msg.author?.name || 'Unknown'}</div>
                <p className="break-words">{msg.content}</p>
                <div className={`text-xs mt-1 ${msg.authorId === user.id ? 'text-blue-100' : 'text-gray-500'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" accept="*/*" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium"
              title="Upload file"
            >
              📎
            </button>
            {selectedFileName ? (
              <div className="hidden md:flex items-center px-3 py-2 text-xs text-gray-600 bg-gray-100 rounded-lg border border-gray-200 max-w-[220px] truncate" title={selectedFileName}>
                {selectedFileName}
              </div>
            ) : null}
            <button
              onClick={submitSelectedFile}
              disabled={!pendingFile}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              Upload
            </button>
            <button
              onClick={handleSendMessage}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Files</h2>
          <p className="text-xs text-gray-500 mt-1">{files.length} files</p>
        </div>
        <div className="p-4 space-y-2">
          {files.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No files uploaded yet</p>
          ) : null}
          {files.map(file => (
            <div key={file.id} className="space-y-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {file.type?.startsWith('image/') && '🖼️'}
                  {file.type?.startsWith('video/') && '🎥'}
                  {file.type?.startsWith('audio/') && '🎵'}
                  {file.type === 'application/pdf' && '📄'}
                  {file.type?.includes('word') && '📝'}
                  {!file.type?.startsWith('image/') && !file.type?.startsWith('video/') && !file.type?.startsWith('audio/') && file.type !== 'application/pdf' && !file.type?.includes('word') && '📎'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate" title={file.name}>{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                  {file.user ? <p className="text-xs text-gray-500 mt-1">by {file.user.name}</p> : null}
                </div>
                {file.url ? (
                  <a href={resolveFileUrl(file.url)} target="_blank" rel="noreferrer" className="flex-shrink-0 text-blue-600 hover:text-blue-700 font-medium text-xs" title="Open file">
                    Open
                  </a>
                ) : null}
              </div>

              {file.url && file.type?.startsWith('image/') ? (
                <a href={resolveFileUrl(file.url)} target="_blank" rel="noreferrer" className="block">
                  <img
                    src={resolveFileUrl(file.url)}
                    alt={file.name}
                    className="w-full max-h-40 object-cover rounded-md border border-gray-200 bg-white"
                  />
                </a>
              ) : null}

              {file.url && file.type === 'application/pdf' ? (
                <a href={resolveFileUrl(file.url)} target="_blank" rel="noreferrer" className="block text-xs text-blue-600 hover:text-blue-700">
                  Preview PDF in browser
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
