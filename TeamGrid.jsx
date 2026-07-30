// Whole-dollar money formatting — no cents anywhere in the app.
export function money(n) {
  return '$' + Math.round(Number(n) || 0).toLocaleString('en-US')
}

// Bare rounded number, no dollar sign.
export function whole(n) {
  return Math.round(Number(n) || 0).toLocaleString('en-US')
}
