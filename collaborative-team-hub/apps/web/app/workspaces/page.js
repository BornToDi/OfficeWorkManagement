"use client"
import React from 'react'
import Layout from '../../components/Layout'
import WorkspaceList from '../../components/WorkspaceList'
import NewWorkspaceForm from '../../components/NewWorkspaceForm'
import { useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'

export default function WorkspacesPage() {
  const [showNew, setShowNew] = useState(false)
  const accessToken = useAuthStore((s) => s.accessToken)
  return (
    <Layout>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-4">Workspaces</h1>
        <div className="flex items-center justify-between mb-4">
          <div />
          <button className="btn" onClick={() => setShowNew((s) => !s)}>{showNew ? 'Close' : 'New Workspace'}</button>
        </div>
        {showNew && (
          <div className="card mb-4">
            <NewWorkspaceForm accessToken={accessToken} onCreated={() => { setShowNew(false); }} />
          </div>
        )}
        <div className="card">
          <WorkspaceList />
        </div>
      </div>
    </Layout>
  )
}
