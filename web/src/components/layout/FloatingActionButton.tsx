import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FABProps {
  onClick: () => void
  className?: string
}

export function FloatingActionButton({ onClick, className }: FABProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg',
        'pb-[env(safe-area-inset-bottom)]',
        className
      )}
    >
      <Plus className="h-6 w-6" />
    </Button>
  )
}
