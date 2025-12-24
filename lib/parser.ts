import Papa from 'papaparse'
import { RawTransaction } from './types'
import { parseAmount, parseDate } from './utils'

interface ParseResult {
  success: boolean
  transactions: RawTransaction[]
  errors: string[]
  bankDetected?: string
}

// Common column name variations for different banks
const COLUMN_MAPPINGS = {
  date: ['date', 'transaction date', 'trans date', 'posting date', 'posted date', 'txn date', 'processed date'],
  description: ['description', 'memo', 'transaction description', 'details', 'narrative', 'merchant', 'payee', 'name', 'transaction'],
  amount: ['amount', 'transaction amount', 'trans amount', 'value', 'sum'],
  debit: ['debit', 'withdrawal', 'withdrawals', 'debits', 'money out', 'spent'],
  credit: ['credit', 'deposit', 'deposits', 'credits', 'money in', 'received'],
  balance: ['balance', 'running balance', 'available balance', 'ledger balance'],
  type: ['type', 'transaction type', 'trans type'],
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '')
}

function findColumn(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const index = headers.findIndex(h => normalizeHeader(h).includes(candidate))
    if (index !== -1) return index
  }
  return -1
}

function detectBank(headers: string[], firstRows: Record<string, string>[]): string {
  const headerStr = headers.join(' ').toLowerCase()
  const rowStr = firstRows.map(r => Object.values(r).join(' ')).join(' ').toLowerCase()

  // Bank detection based on common patterns
  if (headerStr.includes('chase') || rowStr.includes('chase')) return 'Chase'
  if (headerStr.includes('bank of america') || rowStr.includes('bank of america')) return 'Bank of America'
  if (headerStr.includes('wells fargo') || rowStr.includes('wells fargo')) return 'Wells Fargo'
  if (headerStr.includes('citi') || rowStr.includes('citi')) return 'Citi'
  if (headerStr.includes('capital one') || rowStr.includes('capital one')) return 'Capital One'
  if (headerStr.includes('discover') || rowStr.includes('discover')) return 'Discover'
  if (headerStr.includes('amex') || headerStr.includes('american express')) return 'American Express'
  if (headerStr.includes('usaa') || rowStr.includes('usaa')) return 'USAA'
  if (headerStr.includes('navy federal') || rowStr.includes('navy federal')) return 'Navy Federal'
  if (headerStr.includes('pnc') || rowStr.includes('pnc')) return 'PNC'
  if (headerStr.includes('td bank') || rowStr.includes('td bank')) return 'TD Bank'
  if (headerStr.includes('us bank') || rowStr.includes('us bank')) return 'US Bank'
  if (headerStr.includes('ally') || rowStr.includes('ally')) return 'Ally Bank'
  if (headerStr.includes('schwab') || rowStr.includes('schwab')) return 'Charles Schwab'
  if (headerStr.includes('fidelity') || rowStr.includes('fidelity')) return 'Fidelity'
  if (headerStr.includes('venmo') || rowStr.includes('venmo')) return 'Venmo'
  if (headerStr.includes('paypal') || rowStr.includes('paypal')) return 'PayPal'

  return 'Unknown Bank'
}

export async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const transactions: RawTransaction[] = []
        const errors: string[] = []

        if (!results.data || results.data.length === 0) {
          resolve({
            success: false,
            transactions: [],
            errors: ['No data found in file'],
          })
          return
        }

        const headers = results.meta.fields || []
        const rows = results.data as Record<string, string>[]

        // Detect bank
        const bankDetected = detectBank(headers, rows.slice(0, 5))

        // Find column indices
        const dateCol = findColumn(headers, COLUMN_MAPPINGS.date)
        const descCol = findColumn(headers, COLUMN_MAPPINGS.description)
        const amountCol = findColumn(headers, COLUMN_MAPPINGS.amount)
        const debitCol = findColumn(headers, COLUMN_MAPPINGS.debit)
        const creditCol = findColumn(headers, COLUMN_MAPPINGS.credit)
        const balanceCol = findColumn(headers, COLUMN_MAPPINGS.balance)
        const typeCol = findColumn(headers, COLUMN_MAPPINGS.type)

        // Validate required columns
        if (dateCol === -1) {
          errors.push('Could not find a date column')
        }
        if (descCol === -1) {
          errors.push('Could not find a description column')
        }
        if (amountCol === -1 && (debitCol === -1 || creditCol === -1)) {
          errors.push('Could not find amount columns')
        }

        if (errors.length > 0) {
          resolve({ success: false, transactions: [], errors, bankDetected })
          return
        }

        // Parse rows
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]
          const values = Object.values(row)

          try {
            const dateStr = values[dateCol]
            const date = parseDate(dateStr)

            if (!date) {
              errors.push(`Row ${i + 1}: Invalid date "${dateStr}"`)
              continue
            }

            const description = values[descCol]?.trim() || ''

            let amount: number
            let type: 'credit' | 'debit' | undefined

            if (amountCol !== -1) {
              amount = parseAmount(values[amountCol])
              // Determine type based on sign or type column
              if (typeCol !== -1) {
                const typeVal = values[typeCol]?.toLowerCase() || ''
                type = typeVal.includes('credit') || typeVal.includes('deposit') ? 'credit' : 'debit'
              } else {
                type = amount >= 0 ? 'credit' : 'debit'
              }
            } else {
              // Separate debit/credit columns
              const debit = parseAmount(values[debitCol] || '0')
              const credit = parseAmount(values[creditCol] || '0')

              if (credit > 0) {
                amount = credit
                type = 'credit'
              } else if (debit > 0) {
                amount = -Math.abs(debit)
                type = 'debit'
              } else {
                amount = 0
                type = undefined
              }
            }

            // Skip zero-amount transactions
            if (amount === 0) continue

            const transaction: RawTransaction = {
              date: date.toISOString(),
              description,
              amount,
              type,
            }

            if (balanceCol !== -1) {
              transaction.balance = parseAmount(values[balanceCol])
            }

            transactions.push(transaction)
          } catch (e) {
            errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`)
          }
        }

        // Sort by date
        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        resolve({
          success: transactions.length > 0,
          transactions,
          errors: errors.slice(0, 10), // Limit errors
          bankDetected,
        })
      },
      error: (error) => {
        resolve({
          success: false,
          transactions: [],
          errors: [error.message],
        })
      },
    })
  })
}

// For OFX/QFX files (common bank export format)
export async function parseOFX(content: string): Promise<ParseResult> {
  const transactions: RawTransaction[] = []
  const errors: string[] = []

  try {
    // Extract bank ID if available
    const bankIdMatch = content.match(/<BANKID>([^<]+)/)
    const orgMatch = content.match(/<ORG>([^<]+)/)
    let bankDetected = 'Unknown Bank'
    if (orgMatch) {
      bankDetected = orgMatch[1].trim()
    }

    // Find all transaction blocks
    const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g
    let match

    while ((match = transactionRegex.exec(content)) !== null) {
      const block = match[1]

      const dateMatch = block.match(/<DTPOSTED>(\d{8})/)
      const amountMatch = block.match(/<TRNAMT>([-\d.]+)/)
      const descMatch = block.match(/<NAME>([^<]+)/) || block.match(/<MEMO>([^<]+)/)
      const typeMatch = block.match(/<TRNTYPE>([^<]+)/)

      if (dateMatch && amountMatch) {
        const dateStr = dateMatch[1]
        const year = dateStr.substring(0, 4)
        const month = dateStr.substring(4, 6)
        const day = dateStr.substring(6, 8)
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))

        const amount = parseFloat(amountMatch[1])
        const description = descMatch ? descMatch[1].trim() : 'Unknown Transaction'
        const type = typeMatch ? (typeMatch[1].toLowerCase() === 'credit' ? 'credit' : 'debit') : (amount >= 0 ? 'credit' : 'debit')

        transactions.push({
          date: date.toISOString(),
          description,
          amount,
          type,
        })
      }
    }

    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return {
      success: transactions.length > 0,
      transactions,
      errors: transactions.length === 0 ? ['No transactions found in OFX file'] : [],
      bankDetected,
    }
  } catch (e) {
    return {
      success: false,
      transactions: [],
      errors: [e instanceof Error ? e.message : 'Failed to parse OFX file'],
    }
  }
}

export async function parseFile(file: File): Promise<ParseResult> {
  const fileName = file.name.toLowerCase()
  const content = await file.text()

  if (fileName.endsWith('.csv')) {
    return parseCSV(file)
  } else if (fileName.endsWith('.ofx') || fileName.endsWith('.qfx')) {
    return parseOFX(content)
  } else {
    // Try CSV parsing as fallback
    return parseCSV(file)
  }
}

export function mergeTransactions(existing: RawTransaction[], newTxns: RawTransaction[]): RawTransaction[] {
  // Simple deduplication based on date, amount, and description
  const existingSet = new Set(
    existing.map(t => `${t.date}|${t.amount}|${t.description.substring(0, 20)}`)
  )

  const merged = [...existing]

  for (const txn of newTxns) {
    const key = `${txn.date}|${txn.amount}|${txn.description.substring(0, 20)}`
    if (!existingSet.has(key)) {
      merged.push(txn)
      existingSet.add(key)
    }
  }

  return merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
