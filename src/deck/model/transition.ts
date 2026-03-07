export const transitionNames = ["fade", "slide-left", "slide-up", "zoom"] as const;

export type TransitionName = (typeof transitionNames)[number];
