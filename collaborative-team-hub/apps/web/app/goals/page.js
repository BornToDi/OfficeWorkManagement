"use client"
import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Link from 'next/link'
import { useAuthStore } from '../../store/useAuthStore'

function NewGoalForm({ workspaceId, accessToken, onCreated }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (!title) return setError('Title required')
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${workspaceId}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        credentials: 'include',
        body: JSON.stringify({ title, description, dueDate: dueDate || undefined })
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Create failed')
      }
      setTitle('')
      setDescription('')
      setDueDate('')
      if (onCreated) onCreated()
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-2 mb-4">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Goal title" className="w-full border p-2" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full border p-2" />
      <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="border p-2" />
      <div className="flex justify-end">
        <button className="btn" disabled={loading}>{loading ? 'Creating...' : 'Create Goal'}</button>
      </div>
      {error && <div className="text-red-600">{error}</div>}
    </form>
  )
}

export default function GoalsPage() {
  const auth = useAuthStore()
  const [goals, setGoals] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [editingGoalId, setEditingGoalId] = useState(null)
  const [goalDraft, setGoalDraft] = useState({ title: '', description: '', dueDate: '', status: 'TODO' })
  const [goalActionState, setGoalActionState] = useState({})

  useEffect(() => { fetchGoals() }, [auth.activeWorkspace, auth.accessToken])

  async function fetchGoals() {
    if (!auth.activeWorkspace) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${auth.activeWorkspace}/goals`, { credentials: 'include', headers: auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {} })
      if (!res.ok) return
      const data = await res.json()
      setGoals(data)
    } catch (e) {}
  }

  function startEditGoal(goal) {
    setEditingGoalId(goal.id)
    setGoalDraft({
      title: goal.title || '',
      description: goal.description || '',
      dueDate: goal.dueDate ? String(goal.dueDate).slice(0, 10) : '',
      status: goal.status || 'TODO'
    })
  }

  async function saveGoal(goalId) {
    setGoalActionState((current) => ({ ...current, [goalId]: 'saving' }))
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${auth.activeWorkspace}/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(goalDraft)
      })
      if (!res.ok) throw new Error('Failed to update goal')
      setEditingGoalId(null)
      await fetchGoals()
      setGoalActionState((current) => ({ ...current, [goalId]: 'saved' }))
    } catch (error) {
      setGoalActionState((current) => ({ ...current, [goalId]: 'error' }))
    }
    setTimeout(() => setGoalActionState((current) => ({ ...current, [goalId]: 'idle' })), 1500)
  }

  async function deleteGoal(goalId) {
    if (!window.confirm('Delete this goal?')) return
    setGoalActionState((current) => ({ ...current, [goalId]: 'deleting' }))
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${auth.activeWorkspace}/goals/${goalId}`, {
        method: 'DELETE',
        headers: auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {},
        credentials: 'include'
      })
      if (!res.ok) throw new Error('Failed to delete goal')
      if (editingGoalId === goalId) setEditingGoalId(null)
      await fetchGoals()
    } catch (error) {
      setGoalActionState((current) => ({ ...current, [goalId]: 'error' }))
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold mb-4">Goals</h1>
          <button className="btn" onClick={() => setShowNew(s => !s)}>{showNew ? 'Close' : 'New Goal'}</button>
        </div>
        {showNew && <div className="card mb-4"><NewGoalForm workspaceId={auth.activeWorkspace} accessToken={auth.accessToken} onCreated={fetchGoals} /></div>}

        <div className="space-y-3">
          {goals.length === 0 && <div className="text-gray-500">No goals yet.</div>}
          {goals.map(g => (
            <div key={g.id} className="card">
              {editingGoalId === g.id ? (
                <div className="space-y-3">
                  <input value={goalDraft.title} onChange={(e) => setGoalDraft((current) => ({ ...current, title: e.target.value }))} className="input" placeholder="Goal title" />
                  <textarea value={goalDraft.description} onChange={(e) => setGoalDraft((current) => ({ ...current, description: e.target.value }))} className="input min-h-[100px]" placeholder="Goal description" />
                  <div className="grid gap-2 md:grid-cols-2">
                    <input type="date" value={goalDraft.dueDate} onChange={(e) => setGoalDraft((current) => ({ ...current, dueDate: e.target.value }))} className="input" />
                    <select value={goalDraft.status} onChange={(e) => setGoalDraft((current) => ({ ...current, status: e.target.value }))} className="input">
                      <option value="TODO">To Do</option>
                      <option value="INPROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => saveGoal(g.id)} className="btn">Save</button>
                    <button type="button" onClick={() => setEditingGoalId(null)} className="btn bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
                    <button type="button" onClick={() => deleteGoal(g.id)} className="btn bg-red-600 hover:bg-red-700">Delete</button>
                    {goalActionState[g.id] === 'saving' && <span className="text-sm text-gray-500 self-center">Saving...</span>}
                    {goalActionState[g.id] === 'saved' && <span className="text-sm text-green-600 self-center">Saved</span>}
                    {goalActionState[g.id] === 'error' && <span className="text-sm text-red-600 self-center">Failed</span>}
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center gap-3">
                  <div>
                    <div className="font-semibold">{g.title}</div>
                    {g.description && <div className="text-sm text-gray-500">{g.description}</div>}
                    <div className="text-xs text-gray-400 mt-1">By {g.owner?.name || 'Unknown'} • Due: {g.dueDate ? new Date(g.dueDate).toLocaleDateString() : '—'}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-500">{g.status}</div>
                    <button type="button" className="text-sm text-blue-600" onClick={() => startEditGoal(g)}>Edit</button>
                    <button type="button" className="text-sm text-red-600" onClick={() => deleteGoal(g.id)}>Delete</button>
                    <Link className="text-sm text-blue-600" href={`/workspaces/${auth.activeWorkspace}/goals/${g.id}`}>View</Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
