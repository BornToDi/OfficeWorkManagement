"use client"
import React from 'react'
import AuthForm from '../../../components/AuthForm'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../../store/useAuthStore'

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)

  async function handleLogin(email, password) {
    await login(email, password)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      <header className="p-4">
        <div className="container">
          <div className="text-sm font-semibold text-slate-700">Collaborative Team Hub</div>
        </div>
      </header>

      <main className="container pt-8">
        <div className="max-w-lg">
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-sm muted mb-4">Sign in to continue to Collaborative Team Hub</p>
          <div className="card w-full">
            <AuthForm mode="login" onSubmit={handleLogin} />
            <div className="mt-4 text-sm muted">
              <a href="/register" className="text-blue-600 hover:underline">Don't have an account? Create one</a>
            </div>
          </div>
        </div>
      </main>

      <div className="absolute -right-40 bottom-0 w-[160%] h-[60%] -z-10 pointer-events-none">
        <svg viewBox="0 0 1200 400" className="w-full h-full">
          <rect x="50" y="220" width="900" height="120" rx="60" transform="rotate(-20 50 220)" fill="#000" />
          <rect x="400" y="220" width="900" height="120" rx="60" transform="rotate(20 400 220)" fill="#000" />
        </svg>
      </div>
    </div>
  )
}
