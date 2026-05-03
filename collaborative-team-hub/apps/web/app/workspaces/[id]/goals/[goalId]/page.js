"use client"
import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Layout from '../../../../../components/Layout'
import { useAuthStore } from '../../../../../store/useAuthStore'

function statusLabel(status) {
  if (status === 'INPROGRESS') return 'In Progress'
  if (status === 'DONE') return 'Done'
  return 'To Do'
}

export default function GoalDetailPage() {
  const params = useParams()
  const workspaceId = params?.id
  const goalId = params?.goalId
  const auth = useAuthStore()
  const [goal, setGoal] = useState(null)
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [activityText, setActivityText] = useState('')
  const [milestoneDrafts, setMilestoneDrafts] = useState({})
  const [milestoneSaveState, setMilestoneSaveState] = useState({})
  const [milestoneTitleDrafts, setMilestoneTitleDrafts] = useState({})
  const [editingMilestones, setEditingMilestones] = useState({})
  const [milestoneManageState, setMilestoneManageState] = useState({})
  const [loading, setLoading] = useState(true)

  const milestoneCompletion = useMemo(() => {
    const items = goal?.milestones || []
    if (items.length === 0) return 0
    return Math.round(items.reduce((sum, milestone) => sum + (Number(milestone.progress) || 0), 0) / items.length)
  }, [goal])

  async function authFetch(url, options = {}) {
    const firstRes = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.headers || {}),
        ...(auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {})
      }
    })

    if (firstRes.status !== 401) return firstRes

    const nextToken = await auth.refreshAccessToken?.()
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

  useEffect(() => {
    if (!workspaceId || !goalId || !auth.accessToken) return

    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${workspaceId}/goals/${goalId}`)
        if (!cancelled && res.ok) {
          const loadedGoal = await res.json()
          setGoal(loadedGoal)
          setMilestoneDrafts(
            (loadedGoal.milestones || []).reduce((acc, milestone) => {
              acc[milestone.id] = milestone.progress ?? 0
              return acc
            }, {})
          )
          setMilestoneTitleDrafts(
            (loadedGoal.milestones || []).reduce((acc, milestone) => {
              acc[milestone.id] = milestone.title || ''
              return acc
            }, {})
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [workspaceId, goalId, auth.accessToken])

  async function refreshGoal() {
    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${workspaceId}/goals/${goalId}`)
    if (res.ok) {
      const nextGoal = await res.json()
      setGoal(nextGoal)
      setMilestoneDrafts(
        (nextGoal.milestones || []).reduce((acc, milestone) => {
          acc[milestone.id] = milestone.progress ?? 0
          return acc
        }, {})
      )
      setMilestoneTitleDrafts(
        (nextGoal.milestones || []).reduce((acc, milestone) => {
          acc[milestone.id] = milestone.title || ''
          return acc
        }, {})
      )
    }
  }

  async function updateStatus(nextStatus) {
    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${workspaceId}/goals/${goalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: goal.title,
        description: goal.description,
        ownerId: goal.ownerId,
        dueDate: goal.dueDate,
        status: nextStatus
      })
    })
    if (res.ok) await refreshGoal()
  }

  async function addMilestone(e) {
    e.preventDefault()
    if (!milestoneTitle.trim()) return
    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${workspaceId}/goals/${goalId}/milestones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: milestoneTitle })
    })
    if (res.ok) {
      setMilestoneTitle('')
      await refreshGoal()
    }
  }

  async function updateMilestoneProgress(milestoneId) {
    setMilestoneSaveState((current) => ({ ...current, [milestoneId]: 'saving' }))
    const progress = Number(milestoneDrafts[milestoneId] ?? 0)
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${workspaceId}/goals/${goalId}/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ progress })
      })
      if (res.ok) {
        await refreshGoal()
        setMilestoneSaveState((current) => ({ ...current, [milestoneId]: 'saved' }))
      } else {
        setMilestoneSaveState((current) => ({ ...current, [milestoneId]: 'error' }))
      }
    } catch (error) {
      setMilestoneSaveState((current) => ({ ...current, [milestoneId]: 'error' }))
    }
    setTimeout(() => {
      setMilestoneSaveState((current) => ({ ...current, [milestoneId]: 'idle' }))
    }, 1500)
  }

  async function updateMilestoneTitle(milestoneId) {
    const title = String(milestoneTitleDrafts[milestoneId] || '').trim()
    if (!title) {
      setMilestoneManageState((current) => ({ ...current, [milestoneId]: 'error' }))
      return
    }

    setMilestoneManageState((current) => ({ ...current, [milestoneId]: 'saving' }))
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${workspaceId}/goals/${goalId}/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      })
      if (res.ok) {
        await refreshGoal()
        setEditingMilestones((current) => ({ ...current, [milestoneId]: false }))
        setMilestoneManageState((current) => ({ ...current, [milestoneId]: 'saved' }))
      } else {
        setMilestoneManageState((current) => ({ ...current, [milestoneId]: 'error' }))
      }
    } catch (error) {
      setMilestoneManageState((current) => ({ ...current, [milestoneId]: 'error' }))
    }

    setTimeout(() => {
      setMilestoneManageState((current) => ({ ...current, [milestoneId]: 'idle' }))
    }, 1500)
  }

  async function deleteMilestone(milestoneId) {
    const confirmed = window.confirm('Delete this milestone?')
    if (!confirmed) return

    setMilestoneManageState((current) => ({ ...current, [milestoneId]: 'deleting' }))
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${workspaceId}/goals/${goalId}/milestones/${milestoneId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        await refreshGoal()
      } else {
        setMilestoneManageState((current) => ({ ...current, [milestoneId]: 'error' }))
      }
    } catch (error) {
      setMilestoneManageState((current) => ({ ...current, [milestoneId]: 'error' }))
    }
  }

  async function addActivity(e) {
    e.preventDefault()
    if (!activityText.trim()) return
    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${workspaceId}/goals/${goalId}/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: activityText })
    })
    if (res.ok) {
      setActivityText('')
      await refreshGoal()
    }
  }

  if (loading) {
    return <Layout><div className="p-6">Loading goal...</div></Layout>
  }

  if (!goal) {
    return <Layout><div className="p-6">Goal not found.</div></Layout>
  }

  return (
    <Layout>
      <div className="max-w-5xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link href={`/workspaces/${workspaceId}`} className="text-sm text-blue-600 hover:text-blue-800">Back to workspace</Link>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">{goal.title}</h1>
            <p className="mt-1 text-sm text-gray-500">Created by {goal.owner?.name || 'Unknown'} in {goal.workspace?.name || 'this workspace'}</p>
          </div>
          <select
            value={goal.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium"
          >
            <option value="TODO">To Do</option>
            <option value="INPROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="card space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-500">Status</div>
                <div className="text-lg font-semibold text-gray-800">{statusLabel(goal.status)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Description</div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{goal.description || 'No description yet.'}</div>
              </div>
              <div className="text-sm text-gray-500">Due: {goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : '—'}</div>
            </div>

            <div className="card space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Milestones</h2>
                  <div className="text-xs text-gray-500">Average progress: {milestoneCompletion}%</div>
                </div>
                <span className="text-xs text-gray-500">{goal.milestones?.length || 0} total</span>
              </div>
              <div className="space-y-3">
                {(goal.milestones || []).map((milestone) => {
                  const draftValue = milestoneDrafts[milestone.id] ?? milestone.progress ?? 0
                  const saveState = milestoneSaveState[milestone.id] || 'idle'
                  const manageState = milestoneManageState[milestone.id] || 'idle'
                  const isEditing = Boolean(editingMilestones[milestone.id])
                  return (
                    <div key={milestone.id} className="rounded-xl border border-gray-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <input
                              value={milestoneTitleDrafts[milestone.id] ?? milestone.title ?? ''}
                              onChange={(e) => setMilestoneTitleDrafts((current) => ({ ...current, [milestone.id]: e.target.value }))}
                              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                              placeholder="Milestone title"
                            />
                          ) : (
                            <div className="font-medium text-gray-900">{milestone.title}</div>
                          )}
                          <div className="mt-1 text-xs text-gray-500">Progress: {draftValue}%</div>
                          <div className="mt-2 h-2 rounded-full bg-gray-100">
                            <div
                              className="h-2 rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${draftValue}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-gray-600">{draftValue}%</div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={draftValue}
                          onChange={(e) => {
                            setMilestoneDrafts((current) => ({ ...current, [milestone.id]: e.target.value }))
                            setMilestoneSaveState((current) => ({ ...current, [milestone.id]: 'idle' }))
                          }}
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => updateMilestoneProgress(milestone.id)}
                          disabled={saveState === 'saving'}
                          className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save'}
                        </button>
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => updateMilestoneTitle(milestone.id)}
                              disabled={manageState === 'saving'}
                              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {manageState === 'saving' ? 'Saving...' : 'Update'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMilestones((current) => ({ ...current, [milestone.id]: false }))
                                setMilestoneTitleDrafts((current) => ({ ...current, [milestone.id]: milestone.title || '' }))
                              }}
                              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditingMilestones((current) => ({ ...current, [milestone.id]: true }))}
                              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteMilestone(milestone.id)}
                              disabled={manageState === 'deleting'}
                              className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {manageState === 'deleting' ? 'Deleting...' : 'Delete'}
                            </button>
                          </>
                        )}
                        {saveState === 'error' && <span className="text-xs font-medium text-rose-600">Failed</span>}
                        {manageState === 'saved' && <span className="text-xs font-medium text-emerald-600">Updated</span>}
                        {manageState === 'error' && <span className="text-xs font-medium text-rose-600">Action failed</span>}
                      </div>
                    </div>
                  )
                })}
                {(goal.milestones || []).length === 0 && <div className="text-sm text-gray-500">No milestones yet.</div>}
              </div>
              <form onSubmit={addMilestone} className="flex gap-2">
                <input value={milestoneTitle} onChange={(e) => setMilestoneTitle(e.target.value)} className="flex-1 rounded-lg border border-gray-300 px-3 py-2" placeholder="Add a milestone" />
                <button className="btn">Add</button>
              </form>
            </div>

            <div className="card space-y-3">
              <h2 className="text-lg font-semibold">Activity</h2>
              <div className="space-y-2">
                {(goal.activities || []).map((activity) => (
                  <div key={activity.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="text-sm font-medium text-gray-800">{activity.user?.name || 'User'}</div>
                    <div className="text-sm text-gray-600">{activity.message}</div>
                    <div className="text-xs text-gray-400 mt-1">{new Date(activity.createdAt).toLocaleString()}</div>
                  </div>
                ))}
                {(goal.activities || []).length === 0 && <div className="text-sm text-gray-500">No activity yet.</div>}
              </div>
              <form onSubmit={addActivity} className="flex gap-2">
                <input value={activityText} onChange={(e) => setActivityText(e.target.value)} className="flex-1 rounded-lg border border-gray-300 px-3 py-2" placeholder="Post an update" />
                <button className="btn">Post</button>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card">
              <h2 className="text-lg font-semibold mb-3">Goal Info</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <div><span className="font-medium text-gray-700">Owner:</span> {goal.owner?.name || 'Unknown'}</div>
                <div><span className="font-medium text-gray-700">Workspace:</span> {goal.workspace?.name || 'Unknown'}</div>
                <div><span className="font-medium text-gray-700">Created:</span> {new Date(goal.createdAt).toLocaleString()}</div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold mb-3">Linked Tasks</h2>
              <div className="space-y-2">
                {(goal.actionItems || []).map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="font-medium text-gray-800">{item.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.status}{item.assignee?.name ? ` • ${item.assignee.name}` : ''}</div>
                  </div>
                ))}
                {(goal.actionItems || []).length === 0 && <div className="text-sm text-gray-500">No linked action items yet.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}