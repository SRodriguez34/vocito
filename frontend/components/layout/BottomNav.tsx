'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { href: '/record', label: 'Mi voz', icon: '🎙' },
  { href: '/stories/new', label: 'Nuevo cuento', icon: '✨' },
  { href: '/dashboard', label: 'Biblioteca', icon: '📚' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-[#16121F] border-t border-[#2A2240] flex safe-area-pb z-50">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              active ? 'text-[#C4A35A]' : 'text-[#8A7FA0]'
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
