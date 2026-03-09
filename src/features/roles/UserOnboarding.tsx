import { useState } from 'react'

const COLOR_OPTIONS = [
  '#2563eb',
  '#16a34a',
  '#9333ea',
  '#dc2626',
  '#0891b2',
  '#ca8a04',
  '#db2777',
  '#0d9488',
  '#ea580c',
  '#4f46e5',
]

const normalizeColor = (color: string): string => color.trim().toLowerCase()

interface UserOnboardingProps {
  usedColors: string[]
  onJoin: (name: string, color: string) => void
}

export const UserOnboarding = ({ usedColors, onJoin }: UserOnboardingProps) => {
  const usedColorSet = new Set(usedColors.map(normalizeColor))
  const defaultColor =
    COLOR_OPTIONS.find((color) => !usedColorSet.has(normalizeColor(color))) ?? '#000000'

  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState(defaultColor)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    if (usedColorSet.has(normalizeColor(selectedColor))) return
    onJoin(trimmedName, selectedColor)
  }

  const isColorTaken = usedColorSet.has(normalizeColor(selectedColor))

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-slate-900">Join Collaborative Editor</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your profile name. New users start as <strong>editor</strong> by default.
        </p>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Profile Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Alex"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
          />
        </label>
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-700">Profile Color</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((color) => {
              const taken = usedColorSet.has(normalizeColor(color))
              return (
                <button
                  key={color}
                  type="button"
                  disabled={taken}
                  onClick={() => setSelectedColor(color)}
                  title={taken ? `${color} already in use` : color}
                  className={`h-7 w-7 rounded-full border-2 ${
                    normalizeColor(selectedColor) === normalizeColor(color)
                      ? 'border-slate-900'
                      : 'border-transparent'
                  } ${taken ? 'cursor-not-allowed opacity-30' : 'hover:scale-105'}`}
                  style={{ backgroundColor: color }}
                />
              )
            })}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <label className="text-xs text-slate-600">Custom color</label>
            <input
              type="color"
              value={selectedColor}
              onChange={(event) => setSelectedColor(event.target.value)}
              className="h-8 w-12 cursor-pointer rounded border border-slate-300 bg-white p-1"
            />
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {selectedColor}
            </span>
          </div>
          {isColorTaken && (
            <p className="mt-2 text-xs text-red-600">
              This color is already used by another profile. Pick a different color.
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isColorTaken}
          className="mt-4 w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Enter Editor
        </button>
      </form>
    </main>
  )
}
