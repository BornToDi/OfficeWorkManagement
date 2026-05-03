"use client"
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar(){
  const pathname = usePathname()
  const items = [
    { href: '/dashboard', label: 'Dashboard', hint: 'Overview' },
    { href: '/workspaces', label: 'Workspaces', hint: 'Teams & spaces' },
    { href: '/announcements', label: 'Announcements', hint: 'Updates' },
    { href: '/chat', label: 'Chat', hint: 'All employee chat' }
  ]
  return (
    <aside className="hidden w-full max-w-[260px] md:block">
      <div className="shell-panel sticky top-24 p-3">
        <div className="px-3 py-2">
          <div className="section-title">Navigation</div>
          <div className="mt-1 text-sm text-slate-500">Move through workspaces and delivery views</div>
        </div>
        {items.map(i=> (
          <Link
            key={`${i.href}-${i.label}`}
            href={i.href}
            className={`mb-1 block rounded-2xl px-3 py-3 transition ${pathname === i.href ? 'bg-slate-900 text-white shadow-lg' : 'bg-white/60 text-slate-700 hover:bg-white hover:text-slate-950'}`}
          >
            <div className="text-sm font-semibold">{i.label}</div>
            <div className={`text-xs ${pathname === i.href ? 'text-slate-300' : 'text-slate-500'}`}>{i.hint}</div>
          </Link>
        ))}
      </div>
    </aside>
  )
}
