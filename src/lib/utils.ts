import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseBackendUTCDate(backendDateStr: string): Date {
  // If the string doesn’t already end with 'Z', append it.
  let normalized = backendDateStr.endsWith('Z') ? backendDateStr : backendDateStr + 'Z';

  // Normalize the fractional seconds to exactly 3 digits.
  // This regex replaces a dot, followed by more than 3 digits, ending with Z,
  // with a dot and the first three digits, then Z.
  normalized = normalized.replace(/\.(\d{3})\d*Z$/, '.$1Z');

  return new Date(normalized);
}
