"use client"
import React from 'react'
import AuthForm from '../../../components/AuthForm'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../../store/useAuthStore'

export default function RegisterPage() {
  const router = useRouter()
  const register = useAuthStore((s) => s.register)

  async function handleRegister(name, email, password, userRole) {
    await register(name, email, password, userRole)
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
          <h1 className="text-2xl font-bold mb-2">Create an account</h1>
          <p className="text-sm muted mb-4">Start collaborating with your team today</p>
          <div className="card w-full">
            <AuthForm mode="register" onSubmit={handleRegister} />
            <div className="mt-4 text-sm muted">
              <a href="/login" className="text-blue-600 hover:underline">Already have an account? Sign in</a>
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
