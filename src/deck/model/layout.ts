export const layoutNames = [
  "default",
  "center",
  "cover",
  "section",
  "two-cols",
  "image-right",
  "statement",
] as const;

export type BuiltinLayoutName = (typeof layoutNames)[number];
export type LayoutName = BuiltinLayoutName | (string & {});
