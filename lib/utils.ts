import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Merge Tailwind CSS class names without conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a Date (or ISO string) as DD/MM/AAAA.
 * Example: formatDate(new Date('2024-03-15')) → "15/03/2024"
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'dd/MM/yyyy', { locale: es });
  } catch {
    return '—';
  }
}

/**
 * Format a Date as a full localized string (day, month name, year).
 * Example: "15 de marzo de 2024"
 */
export function formatDateLong(date: Date | string | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return '—';
  }
}

/**
 * Format a numeric value as a percentage string.
 * Example: formatPercent(0.875) → "87.5%"
 *          formatPercent(87.5, false) → "87.5%"  (already a percentage)
 *
 * @param value      Numeric value.
 * @param isDecimal  When true (default) value is 0–1 and will be multiplied by 100.
 * @param decimals   Number of decimal places (default 1).
 */
export function formatPercent(
  value: number | null | undefined,
  isDecimal = true,
  decimals = 1,
): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const pct = isDecimal ? value * 100 : value;
  return `${pct.toFixed(decimals)}%`;
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Return initials from a full name (up to 2 chars).
 * Example: "Ana García López" → "AG"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}
