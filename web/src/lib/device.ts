export interface DeviceContext {
  isIOS: boolean
  isAndroid: boolean
  isMobile: boolean
  isHighDPI: boolean
  hasTouchScreen: boolean
  hasCoarsePointer: boolean
  hasFinePointer: boolean
  isPortrait: boolean
  isLandscape: boolean
}

export function getDeviceContext(): DeviceContext {
  if (typeof window === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isMobile: false,
      isHighDPI: false,
      hasTouchScreen: false,
      hasCoarsePointer: false,
      hasFinePointer: true,
      isPortrait: true,
      isLandscape: false,
    }
  }

  const ua = navigator.userAgent

  return {
    isIOS: /iPad|iPhone|iPod/.test(ua),
    isAndroid: /Android/.test(ua),
    isMobile: /Mobi|Android|iPhone|iPad|iPod/.test(ua),
    isHighDPI: window.devicePixelRatio >= 2,
    hasTouchScreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    hasCoarsePointer: window.matchMedia('(pointer: coarse)').matches,
    hasFinePointer: window.matchMedia('(pointer: fine)').matches,
    isPortrait: window.matchMedia('(orientation: portrait)').matches,
    isLandscape: window.matchMedia('(orientation: landscape)').matches,
  }
}
