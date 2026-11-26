/** 25 -> "25m", 90 -> "1.5h", 0 -> "0m" */
export const fmtFocus = (minutes: number) =>
  minutes < 60 ? `${Math.round(minutes)}m` : `${(minutes / 60).toFixed(1)}h`;

/** Goal-style minutes: 45 -> "45m", 60 -> "1h", 90 -> "90m", 120 -> "2h". */
export const fmtGoal = (minutes: number) =>
  minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60}h` : `${Math.round(minutes)}m`;