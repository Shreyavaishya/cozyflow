/** 25 -> "25m", 90 -> "1.5h", 0 -> "0m" */
export const fmtFocus = (minutes: number) =>
  minutes < 60 ? `${Math.round(minutes)}m` : `${(minutes / 60).toFixed(1)}h`;
