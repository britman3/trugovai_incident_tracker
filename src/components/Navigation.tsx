'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Incidents', href: '/incidents' },
  { name: 'Analytics', href: '/analytics' },
  { name: 'Reports', href: '/reports' },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-navy shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="text-white font-bold text-xl">
                TruGovAI<span className="text-teal">™</span>
              </span>
              <span className="text-mint-300 text-small ml-2">Incident Tracker</span>
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'px-4 py-2 rounded-button text-small font-medium transition-colors',
                        isActive
                          ? 'bg-teal text-white'
                          : 'text-gray-300 hover:bg-navy/80 hover:text-white'
                      )}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/incidents/new"
              className="btn btn-primary text-small"
            >
              Report Incident
            </Link>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div className="md:hidden border-t border-white/10">
        <div className="px-2 py-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'block px-3 py-2 rounded-button text-base font-medium',
                  isActive
                    ? 'bg-teal text-white'
                    : 'text-gray-300 hover:bg-navy/80 hover:text-white'
                )}
              >
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
