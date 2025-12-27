import { useState, useEffect } from 'react'
import { getDeviceContext, DeviceContext } from '@/lib/device'

export function useDeviceContext(): DeviceContext {
  const [context, setContext] = useState<DeviceContext>(getDeviceContext)

  useEffect(() => {
    const handleChange = () => setContext(getDeviceContext())

    window.addEventListener('resize', handleChange)
    window.addEventListener('orientationchange', handleChange)

    const portraitQuery = window.matchMedia('(orientation: portrait)')
    const pointerQuery = window.matchMedia('(pointer: coarse)')

    portraitQuery.addEventListener('change', handleChange)
    pointerQuery.addEventListener('change', handleChange)

    return () => {
      window.removeEventListener('resize', handleChange)
      window.removeEventListener('orientationchange', handleChange)
      portraitQuery.removeEventListener('change', handleChange)
      pointerQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return context
}
