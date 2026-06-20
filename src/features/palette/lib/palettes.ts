export type Palette = {
  id: string
  label: string
  primary: string
  accent: string
}

export const PALETTES: Palette[] = [
  { id: 'ocean', label: 'Ocean', primary: '#1e4d6b', accent: '#0ea5e9' },
  { id: 'terracotta', label: 'Terracotta', primary: '#b45309', accent: '#f97316' },
  { id: 'sage', label: 'Sage', primary: '#4a7c59', accent: '#86efac' },
  { id: 'midnight', label: 'Midnight', primary: '#1e1b4b', accent: '#fbbf24' },
  { id: 'rose', label: 'Rose', primary: '#9f1239', accent: '#fb7185' },
  { id: 'forest', label: 'Forest', primary: '#14532d', accent: '#f59e0b' },
  { id: 'slate', label: 'Slate', primary: '#334155', accent: '#60a5fa' },
  { id: 'amber', label: 'Amber', primary: '#92400e', accent: '#fcd34d' },
  { id: 'violet', label: 'Violet', primary: '#5b21b6', accent: '#a78bfa' },
  { id: 'crimson', label: 'Crimson', primary: '#7f1d1d', accent: '#fca5a5' },
]
