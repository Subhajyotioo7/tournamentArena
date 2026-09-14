import { Flame, Gamepad2, Trophy, Volleyball } from 'lucide-react';

const defaultTheme = {
  key: 'other',
  label: 'Tournament',
  icon: Trophy,
  gradient: 'from-slate-700 to-slate-900',
  accent: 'text-slate-700',
  soft: 'bg-slate-50',
  border: 'border-slate-200',
  filterActive: 'bg-slate-700 text-white hover:bg-slate-800',
  headerText: 'text-white',
  headerMuted: 'text-white/80',
};

export const gameThemes = {
  fifa: {
    key: 'fifa',
    label: 'FIFA',
    icon: Volleyball,
    gradient: 'from-green-600 to-emerald-700',
    accent: 'text-emerald-700',
    soft: 'bg-emerald-50',
    border: 'border-emerald-200',
    filterActive: 'bg-emerald-700 text-white hover:bg-emerald-800',
    headerText: 'text-white',
    headerMuted: 'text-white/80',
  },
  bgmi: {
    key: 'bgmi',
    label: 'BGMI',
    icon: Gamepad2,
    gradient: 'from-[#d4d4d8] to-[#a1a1aa]',
    accent: 'text-zinc-700',
    soft: 'bg-zinc-50',
    border: 'border-zinc-300',
    filterActive: 'bg-[#d4d4d8] text-zinc-900 hover:bg-[#a1a1aa]',
    headerText: 'text-zinc-900',
    headerMuted: 'text-zinc-700',
  },
  freefire: {
    key: 'freefire',
    label: 'Free Fire',
    icon: Flame,
    gradient: 'from-[#f59e0b] to-[#d97706]',
    accent: 'text-amber-700',
    soft: 'bg-amber-50',
    border: 'border-amber-200',
    filterActive: 'bg-[#f59e0b] text-white hover:bg-[#d97706]',
    headerText: 'text-white',
    headerMuted: 'text-white/80',
  },
};

export function getGameTheme(game) {
  return gameThemes[game] || defaultTheme;
}
