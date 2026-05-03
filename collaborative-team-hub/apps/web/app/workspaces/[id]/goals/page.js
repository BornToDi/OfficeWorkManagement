"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Layout from '../../../../components/Layout'
import { useAuthStore } from '../../../../store/useAuthStore'

function statusLabel(status) {
  if (status === 'INPROGRESS') return 'In Progress'
  if (status === 'DONE') return 'Done'
  return 'To Do'
}

export default function WorkspaceGoalsPage() {
  const params = useParams()
  const workspaceId = params?.id
  const auth = useAuthStore()
  const [workspace, setWorkspace] = useState(null)
  const [goals, setGoals] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingGoalId, setEditingGoalId] = useState(null)
  const [goalDraft, setGoalDraft] = useState({ title: '', description: '', dueDate: '', status: 'TODO' })
  const [goalActionState, setGoalActionState] = useState({})

  useEffect(() => {
    if (!workspaceId || !auth.accessToken) return

    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [workspaceRes, goalsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${workspaceId}`, {
            headers: { Authorization: `Bearer ${auth.accessToken}` },
            credentials: 'include'
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${workspaceId}/goals`, {
            headers: { Authorization: `Bearer ${auth.accessToken}` },
            credentials: 'include'
          })
        ])

        if (cancelled) return

        if (workspaceRes.ok) setWorkspace(await workspaceRes.json())
        if (goalsRes.ok) setGoals(await goalsRes.json())
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [workspaceId, auth.accessToken])

  async function refreshGoals() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${workspaceId}/goals`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      credentials: 'include'
    })
    if (res.ok) setGoals(await res.json())
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${workspaceId}/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`
        },
        credentials: 'include',
        body: JSON.stringify(goalDraft)
      })
      if (!res.ok) throw new Error('Failed to update goal')
      setEditingGoalId(null)
      await refreshGoals()
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${workspaceId}/goals/${goalId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${auth.accessToken}` },
        credentials: 'include'
      })
      if (!res.ok) throw new Error('Failed to delete goal')
      if (editingGoalId === goalId) setEditingGoalId(null)
      await refreshGoals()
    } catch (error) {
      setGoalActionState((current) => ({ ...current, [goalId]: 'error' }))
    }
  }

  async function createGoal(e) {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${workspaceId}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`
        },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          dueDate: dueDate || null
        })
      })

      if (res.ok) {
        setTitle('')
        setDescription('')
        setDueDate('')
        await refreshGoals()
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-6 text-slate-600">Loading workspace goals...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl space-y-6">
        <div className="shell-panel p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link href={`/workspaces/${workspaceId}`} className="text-sm font-medium text-blue-700 hover:text-blue-900">
                Back to workspace
              </Link>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">{workspace?.name || 'Workspace'} Goals</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Keep the workspace roadmap visible. Create goals here, then open a goal to update status, milestones, and activity.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              {goals.length} goal{goals.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="card space-y-4">
            <div>
              <div className="section-title">Create goal</div>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">New workspace goal</h2>
            </div>
            <form onSubmit={createGoal} className="space-y-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="Goal title" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[120px]" placeholder="Goal description" />
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
              <button className="btn w-full" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Goal'}
              </button>
            </form>
          </div>

          <div className="space-y-3">
            {goals.length === 0 ? (
              <div className="card text-sm text-slate-600">No goals yet. Add the first one to start tracking this workspace.</div>
            ) : (
              goals.map((goal) => (
                <div key={goal.id} className="card">
                  {editingGoalId === goal.id ? (
                    <div className="space-y-3">
                      <input value={goalDraft.title} onChange={(e) => setGoalDraft((current) => ({ ...current, title: e.target.value }))} className="input" placeholder="Goal title" />
                      <textarea value={goalDraft.description} onChange={(e) => setGoalDraft((current) => ({ ...current, description: e.target.value }))} className="input min-h-[120px]" placeholder="Goal description" />
                      <div className="grid gap-2 md:grid-cols-2">
                        <input type="date" value={goalDraft.dueDate} onChange={(e) => setGoalDraft((current) => ({ ...current, dueDate: e.target.value }))} className="input" />
                        <select value={goalDraft.status} onChange={(e) => setGoalDraft((current) => ({ ...current, status: e.target.value }))} className="input">
                          <option value="TODO">To Do</option>
                          <option value="INPROGRESS">In Progress</option>
                          <option value="DONE">Done</option>
                        </select>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => saveGoal(goal.id)} className="btn">Save</button>
                        <button type="button" onClick={() => setEditingGoalId(null)} className="btn bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
                        <button type="button" onClick={() => deleteGoal(goal.id)} className="btn bg-red-600 hover:bg-red-700">Delete</button>
                        {goalActionState[goal.id] === 'saving' && <span className="text-sm text-gray-500 self-center">Saving...</span>}
                        {goalActionState[goal.id] === 'saved' && <span className="text-sm text-green-600 self-center">Saved</span>}
                        {goalActionState[goal.id] === 'error' && <span className="text-sm text-red-600 self-center">Failed</span>}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="text-base font-semibold text-slate-950">{goal.title}</div>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{statusLabel(goal.status)}</span>
                        </div>
                        {goal.description && <div className="mt-2 text-sm leading-6 text-slate-600">{goal.description}</div>}
                        <div className="mt-2 text-xs text-slate-400">
                          By {goal.owner?.name || 'Unknown'} • Due: {goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : '—'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => startEditGoal(goal)} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
                        <button type="button" onClick={() => deleteGoal(goal.id)} className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">Delete</button>
                        <Link href={`/workspaces/${workspaceId}/goals/${goal.id}`} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700">
                          View
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}