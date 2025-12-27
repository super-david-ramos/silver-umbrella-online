import { NavLink } from 'react-router-dom'
import { FileText, Search, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 h-16 border-t bg-background flex items-center justify-around pb-[env(safe-area-inset-bottom)]">
      <NavLink
        to="/app"
        end
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center gap-1 p-2 touch-target',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )
        }
      >
        <FileText className="h-5 w-5" />
        <span className="text-xs">Notes</span>
      </NavLink>
      <NavLink
        to="/app/search"
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center gap-1 p-2 touch-target',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )
        }
      >
        <Search className="h-5 w-5" />
        <span className="text-xs">Search</span>
      </NavLink>
      <NavLink
        to="/app/settings"
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center gap-1 p-2 touch-target',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )
        }
      >
        <Settings className="h-5 w-5" />
        <span className="text-xs">Settings</span>
      </NavLink>
    </nav>
  )
}
