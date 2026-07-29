import { useState } from 'react'

/**
 * A textarea for pasting tab- or comma-separated rows, parsed into an
 * array of objects keyed by `columns`, with a preview before saving.
 *
 * This is the single input pattern used by every data-entry screen in
 * the app (season assignments + historical record book rows), per the
 * request to avoid file uploads or spreadsheet integrations.
 */
export default function PasteTable({ columns, onParsed, placeholder }) {
  const [raw, setRaw] = useState('')
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState([])

  function parse(text) {
    setRaw(text)
    setError(null)
    if (!text.trim()) {
      setPreview([])
      return
    }
    try {
      const lines = text.trim().split('\n').filter(Boolean)
      const delimiter = lines[0].includes('\t') ? '\t' : ','
      const rows = lines.map((line) => {
        const cells = line.split(delimiter).map((c) => c.trim())
        if (cells.length !== columns.length) {
          throw new Error(
            `Expected ${columns.length} columns (${columns.join(', ')}) but found ${cells.length} in: "${line}"`
          )
        }
        const obj = {}
        columns.forEach((col, i) => (obj[col] = cells[i]))
        return obj
      })
      setPreview(rows)
      onParsed(rows)
    } catch (e) {
      setError(e.message)
      setPreview([])
      onParsed([])
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-xs uppercase tracking-wide text-mustard/80">
        Columns: {columns.join(' | ')}
      </div>
      <textarea
        className="w-full h-40 rounded-md bg-felt-dark/60 border border-mustard/30 p-3 font-mono text-sm text-chalk placeholder:text-chalk/40"
        placeholder={placeholder || 'Paste rows copied from a spreadsheet (tab or comma separated)...'}
        value={raw}
        onChange={(e) => parse(e.target.value)}
      />
      {error && <div className="text-brick-light text-sm">{error}</div>}
      {preview.length > 0 && !error && (
        <div className="overflow-x-auto felt-panel rounded-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-mustard text-left">
                {columns.map((c) => (
                  <th key={c} className="px-2 py-1 whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 8).map((row, i) => (
                <tr key={i} className="border-t border-mustard/10">
                  {columns.map((c) => (
                    <td key={c} className="px-2 py-1 whitespace-nowrap">{row[c]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {preview.length > 8 && (
            <div className="px-2 py-1 text-xs text-chalk/60">
              +{preview.length - 8} more row(s)
            </div>
          )}
        </div>
      )}
    </div>
  )
}
