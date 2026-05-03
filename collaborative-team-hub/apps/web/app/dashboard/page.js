"use client"
import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import WorkspaceList from '../../components/WorkspaceList'
import Link from 'next/link'
import { useAuthStore } from '../../store/useAuthStore'

export default function DashboardPage() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const [stats, setStats] = useState({ totalGoals: 0, completedThisWeek: 0, overdueCount: 0 })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadStats() {
      try {
        setLoadingStats(true)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/stats/dashboard`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          credentials: 'include'
        })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          setStats({
            totalGoals: data.totalGoals || 0,
            completedThisWeek: data.completedThisWeek || 0,
            overdueCount: data.overdueCount || 0
          })
        }
      } catch (error) {
        console.error('Failed to load dashboard stats:', error)
      } finally {
        if (!cancelled) setLoadingStats(false)
      }
    }

    loadStats()

    return () => {
      cancelled = true
    }
  }, [accessToken])

  return (
    <Layout>
      <div className="max-w-6xl space-y-6">
        <div className="shell-panel overflow-hidden">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
            <div>
              <div className="section-title">Dashboard</div>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Workspace command center</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Pick a workspace, jump into goals, update tasks, review announcements, and keep execution in one place.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/workspaces" className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="text-sm font-semibold text-slate-900">Create or join</div>
                <div className="mt-1 text-sm text-slate-600">Manage workspaces and switch context.</div>
              </Link>
              <Link href="/goals" className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="text-sm font-semibold text-slate-900">Goals</div>
                <div className="mt-1 text-sm text-slate-600">Track objectives and progress.</div>
              </Link>
              <Link href="/action-items" className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="text-sm font-semibold text-slate-900">Action items</div>
                <div className="mt-1 text-sm text-slate-600">Execution and status updates.</div>
              </Link>
              <Link href="/announcements" className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="text-sm font-semibold text-slate-900">Announcements</div>
                <div className="mt-1 text-sm text-slate-600">Company-wide updates and comments.</div>
              </Link>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Total goals</div>
            <div className="mt-2 text-3xl font-black text-slate-950">
              {loadingStats ? '…' : stats.totalGoals}
            </div>
            <p className="mt-2 text-sm text-slate-600">All goals in workspaces you can access.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Completed this week</div>
            <div className="mt-2 text-3xl font-black text-emerald-600">
              {loadingStats ? '…' : stats.completedThisWeek}
            </div>
            <p className="mt-2 text-sm text-slate-600">Action items marked done in the last 7 days.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Overdue</div>
            <div className="mt-2 text-3xl font-black text-rose-600">
              {loadingStats ? '…' : stats.overdueCount}
            </div>
            <p className="mt-2 text-sm text-slate-600">Open action items past their due date.</p>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <div className="section-title">Your Workspaces</div>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Open the workspace hub</h2>
            </div>
            <Link href="/workspaces" className="text-sm font-medium text-blue-700 hover:text-blue-900">View all</Link>
          </div>
          <div className="card">
            <WorkspaceList />
          </div>
        </section>
      </div>
    </Layout>
  )
}
