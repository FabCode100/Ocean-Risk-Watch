import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTemp(temp: number) {
  return `${temp.toFixed(1)}°C`;
}

export function formatRiskScore(score: number) {
  return score.toFixed(2);
}

export function getRiskColor(level: string) {
  switch (level.toLowerCase()) {
    case 'critical': return 'text-destructive border-destructive/30 bg-destructive/10';
    case 'attention': return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
    case 'normal': return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
    default: return 'text-muted-foreground border-border bg-muted/50';
  }
}

export function getRiskHexColor(level: string) {
  switch (level.toLowerCase()) {
    case 'critical': return '#f43f5e'; // rose-500
    case 'attention': return '#fbbf24'; // amber-400
    case 'normal': return '#34d399'; // emerald-400
    default: return '#94a3b8'; // slate-400
  }
}
