// Whole-dollar money formatting — no cents anywhere in the app.
export function money(n) {
  return '$' + Math.round(Number(n) || 0).toLocaleString('en-US')
}

// Bare rounded number, no dollar sign.
export function whole(n) {
  return Math.round(Number(n) || 0).toLocaleString('en-US')
}

/**
 * A result row is a target hit if it carries any result_type other than the
 * week-18 guaranteed payout. Stored as 'hit33' or 'hit25' depending on pool.
 */
export function isTargetHit(row) {
  return !!row.result_type && row.result_type !== 'week18_payout'
}
