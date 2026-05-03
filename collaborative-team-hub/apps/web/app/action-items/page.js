"use client"
import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import ActionItemForm from '../../components/ActionItemForm'
import { useAuthStore } from '../../store/useAuthStore'

export default function ActionItemsPage() {
  const auth = useAuthStore()
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all') // all, todo, inprogress, done
  const [loading, setLoading] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)
  const [itemDraft, setItemDraft] = useState({ title: '', description: '', assigneeId: '', priority: 'MEDIUM', dueDate: '' })
  const [members, setMembers] = useState([])
  const [goals, setGoals] = useState([])
  const [actionState, setActionState] = useState({})

  useEffect(() => {
    async function loadWorkspaceData() {
      if (!auth.activeWorkspace) return
      try {
        const [membersRes, goalsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${auth.activeWorkspace}/members`, {
            headers: auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {},
            credentials: 'include'
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${auth.activeWorkspace}/goals`, {
            headers: auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {},
            credentials: 'include'
          })
        ])
        if (membersRes.ok) setMembers(await membersRes.json())
        if (goalsRes.ok) setGoals(await goalsRes.json())
      } catch (e) {
        console.error(e)
      }
    }

    loadWorkspaceData()
  }, [auth.activeWorkspace, auth.accessToken])

  useEffect(() => {
    if (auth.activeWorkspace) {
      fetchItems()
    }
  }, [auth.activeWorkspace, auth.accessToken])

  async function fetchItems() {
    if (!auth.activeWorkspace) return
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${auth.activeWorkspace}/action-items`, {
        headers: auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {},
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${auth.activeWorkspace}/action-items/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        fetchItems()
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this action item?')) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${auth.activeWorkspace}/action-items/${id}`, {
        method: 'DELETE',
        headers: auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {},
        credentials: 'include'
      })
      if (res.ok) {
        fetchItems()
      }
    } catch (e) {
      console.error(e)
    }
  }

  function startEditItem(item) {
    setEditingItemId(item.id)
    setItemDraft({
      title: item.title || '',
      description: item.description || '',
      assigneeId: item.assigneeId || '',
      priority: item.priority || 'MEDIUM',
      dueDate: item.dueDate ? String(item.dueDate).slice(0, 10) : ''
    })
  }

  async function saveItem(id) {
    setActionState((current) => ({ ...current, [id]: 'saving' }))
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${auth.activeWorkspace}/action-items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(itemDraft)
      })
      if (!res.ok) throw new Error('Failed to update item')
      setEditingItemId(null)
      await fetchItems()
      setActionState((current) => ({ ...current, [id]: 'saved' }))
    } catch (error) {
      setActionState((current) => ({ ...current, [id]: 'error' }))
    }
    setTimeout(() => setActionState((current) => ({ ...current, [id]: 'idle' })), 1500)
  }

  const filteredItems = filter === 'all' ? items : items.filter(i => i.status === filter.toUpperCase())

  const priorityColor = {
    LOW: 'bg-blue-100 text-blue-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800'
  }

  const statusColor = {
    TODO: 'bg-gray-100 text-gray-800',
    INPROGRESS: 'bg-blue-100 text-blue-800',
    DONE: 'bg-green-100 text-green-800'
  }

  return (
    <Layout>
      <div className="container">
        {!auth.activeWorkspace && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded mb-4">
            <p className="text-yellow-800">Please select a workspace from the workspace switcher to view action items</p>
          </div>
        )}
        <div className="flex items-center justify-between py-4">
          <h2 className="text-2xl font-semibold">Action Items</h2>
          <button className="btn" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : 'New Action Item'}
          </button>
        </div>

        {showForm && (
          <div className="mb-4">
            <ActionItemForm workspaceId={auth.activeWorkspace} onSuccess={() => { setShowForm(false); fetchItems() }} />
          </div>
        )}

        <div className="flex gap-2 mb-4">
          {['all', 'TODO', 'INPROGRESS', 'DONE'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s.toLowerCase())}
              className={`px-3 py-1 rounded text-sm ${
                filter === s.toLowerCase() ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {s === 'INPROGRESS' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-gray-500">No action items yet</div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div key={item.id} className="card">
                {editingItemId === item.id ? (
                  <div className="space-y-3">
                    <input value={itemDraft.title} onChange={(e) => setItemDraft((current) => ({ ...current, title: e.target.value }))} className="input" placeholder="Task title" />
                    <textarea value={itemDraft.description} onChange={(e) => setItemDraft((current) => ({ ...current, description: e.target.value }))} className="input min-h-[100px]" placeholder="Description" />
                    <div className="grid gap-2 md:grid-cols-2">
                      <select value={itemDraft.assigneeId} onChange={(e) => setItemDraft((current) => ({ ...current, assigneeId: e.target.value }))} className="input">
                        <option value="">Unassigned</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.userId}>{member.user?.email || member.user?.name || member.userId}</option>
                        ))}
                      </select>
                      <select value={itemDraft.priority} onChange={(e) => setItemDraft((current) => ({ ...current, priority: e.target.value }))} className="input">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                      <select value={itemDraft.goalId || ''} onChange={() => {}} className="input" disabled>
                        <option value="">Goal stays unchanged</option>
                        {goals.map((goal) => (
                          <option key={goal.id} value={goal.id}>{goal.title}</option>
                        ))}
                      </select>
                      <input type="date" value={itemDraft.dueDate} onChange={(e) => setItemDraft((current) => ({ ...current, dueDate: e.target.value }))} className="input" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => saveItem(item.id)} className="btn">Save</button>
                      <button type="button" onClick={() => setEditingItemId(null)} className="btn bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
                      <button type="button" onClick={() => handleDelete(item.id)} className="btn bg-red-600 hover:bg-red-700">Delete</button>
                      {actionState[item.id] === 'saving' && <span className="text-sm text-gray-500 self-center">Saving...</span>}
                      {actionState[item.id] === 'saved' && <span className="text-sm text-green-600 self-center">Saved</span>}
                      {actionState[item.id] === 'error' && <span className="text-sm text-red-600 self-center">Failed</span>}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded text-xs ${priorityColor[item.priority] || 'bg-gray-100'}`}>
                          {item.priority || 'MEDIUM'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${statusColor[item.status] || 'bg-gray-100'}`}>
                          {item.status === 'INPROGRESS' ? 'In Progress' : item.status}
                        </span>
                        {item.assignee && <span className="text-xs text-gray-600">👤 {item.assignee.name}</span>}
                        {item.dueDate && (
                          <span className="text-xs text-gray-600">
                            📅 {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="text-xs border p-1 rounded"
                      >
                        <option value="TODO">To Do</option>
                        <option value="INPROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </select>
                      <button
                        onClick={() => startEditItem(item)}
                        className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
