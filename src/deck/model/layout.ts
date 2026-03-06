export const layoutNames = [
  "default",
  "center",
  "cover",
  "section",
  "two-cols",
  "image-right",
  "statement",
] as const

export type LayoutName = (typeof layoutNames)[number]
