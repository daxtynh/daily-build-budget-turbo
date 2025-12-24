import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

export function parseAmount(value: string): number {
  // Remove currency symbols, commas, and handle parentheses for negative
  let cleaned = value.replace(/[$,]/g, '').trim()

  // Handle parentheses notation for negative numbers (1,234.56)
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1)
  }

  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

export function parseDate(dateStr: string): Date | null {
  // Try various date formats
  const formats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
    /(\d{1,2})\/(\d{1,2})\/(\d{2})/, // MM/DD/YY
    /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    /(\d{1,2})-(\d{1,2})-(\d{4})/, // MM-DD-YYYY
  ]

  for (const format of formats) {
    const match = dateStr.match(format)
    if (match) {
      let year = parseInt(match[3] || match[1])
      let month: number
      let day: number

      if (format.source.startsWith('(\\d{4})')) {
        // YYYY-MM-DD format
        year = parseInt(match[1])
        month = parseInt(match[2]) - 1
        day = parseInt(match[3])
      } else {
        // MM/DD/YYYY or MM-DD-YYYY format
        month = parseInt(match[1]) - 1
        day = parseInt(match[2])
        year = parseInt(match[3])
      }

      // Handle 2-digit years
      if (year < 100) {
        year += year < 50 ? 2000 : 1900
      }

      const date = new Date(year, month, day)
      if (!isNaN(date.getTime())) {
        return date
      }
    }
  }

  // Fallback to native parsing
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? null : date
}

export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0
  return Math.round((part / total) * 100)
}
