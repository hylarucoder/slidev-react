export const Z_LAYERS = {
  stage: 0,
  slideChrome: 10,
  timeline: 30,
  navbar: 40,
  overlay: 50,
  toast: 60,
  debug: 90,
} as const

export type ZLayerKey = keyof typeof Z_LAYERS
