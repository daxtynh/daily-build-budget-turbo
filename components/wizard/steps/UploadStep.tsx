"use client"

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useBudgetStore } from '@/lib/store'
import { parseFile, mergeTransactions } from '@/lib/parser'
import { categorizeTransactions } from '@/lib/categorizer'
import { analyzeSpending } from '@/lib/analyzer'
import { cn, formatDate } from '@/lib/utils'

export function UploadStep() {
  const {
    uploadedFiles,
    addFiles,
    removeFile,
    rawTransactions,
    setRawTransactions,
    setCategorizedTransactions,
    setAnalysis
  } = useBudgetStore()

  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [bankDetected, setBankDetected] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const processFiles = useCallback(async (files: File[]) => {
    setIsProcessing(true)
    setErrors([])
    const allErrors: string[] = []
    let allTransactions = [...rawTransactions]

    for (const file of files) {
      const result = await parseFile(file)

      if (result.bankDetected && result.bankDetected !== 'Unknown Bank') {
        setBankDetected(result.bankDetected)
      }

      if (result.errors.length > 0) {
        allErrors.push(...result.errors.map(e => `${file.name}: ${e}`))
      }

      if (result.transactions.length > 0) {
        allTransactions = mergeTransactions(allTransactions, result.transactions)
      }
    }

    if (allTransactions.length > 0) {
      setRawTransactions(allTransactions)

      // Categorize transactions
      const categorized = categorizeTransactions(allTransactions)
      setCategorizedTransactions(categorized)

      // Analyze spending
      const analysis = analyzeSpending(categorized)
      setAnalysis(analysis)
    }

    if (allErrors.length > 0) {
      setErrors(allErrors)
    }

    setIsProcessing(false)
  }, [rawTransactions, setRawTransactions, setCategorizedTransactions, setAnalysis])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      addFiles(files)
      processFiles(files)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter(
      f => f.name.endsWith('.csv') || f.name.endsWith('.ofx') || f.name.endsWith('.qfx')
    )

    if (files.length > 0) {
      addFiles(files)
      processFiles(files)
    }
  }, [addFiles, processFiles])

  return (
    <div className="py-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Upload Your Bank Statement
        </h2>
        <p className="text-gray-600">
          Export a CSV or OFX file from your bank's website. We support most major banks.
        </p>
      </div>

      {/* Upload Area */}
      <Card className="mb-6">
        <CardContent className="p-8">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all",
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300",
              "hover:border-blue-400 hover:bg-blue-50"
            )}
          >
            <input
              type="file"
              accept=".csv,.ofx,.qfx"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drop your bank statement here
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  or click to browse your files
                </p>
                <Button variant="outline" size="sm" asChild>
                  <span>Choose File</span>
                </Button>
              </div>
            </label>
          </div>

          {/* Supported Banks */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 mb-2">Supported formats: CSV, OFX, QFX</p>
            <p className="text-xs text-gray-400">
              Works with Chase, Bank of America, Wells Fargo, Citi, Capital One, and most other banks
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Uploaded Files</CardTitle>
            {bankDetected && (
              <CardDescription className="text-green-600">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Detected: {bankDetected}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(i)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-6 flex items-center gap-4">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <div>
              <p className="font-medium text-blue-900">Processing your transactions...</p>
              <p className="text-sm text-blue-700">This may take a few seconds</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 mb-2">Some issues found</p>
                <ul className="text-sm text-amber-700 space-y-1">
                  {errors.slice(0, 5).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
                {errors.length > 5 && (
                  <p className="text-sm text-amber-600 mt-2">
                    + {errors.length - 5} more issues
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Summary */}
      {rawTransactions.length > 0 && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-900 text-lg mb-1">
                    Successfully imported {rawTransactions.length} transactions!
                  </p>
                  <p className="text-sm text-green-700 mb-3">
                    Date range: {formatDate(rawTransactions[0].date)} - {formatDate(rawTransactions[rawTransactions.length - 1].date)}
                  </p>
                  <p className="text-sm text-green-600">
                    Click "Continue" to review and verify the categories
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* How to Export Guide */}
      {rawTransactions.length === 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-base">Need help exporting?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-3">
            <p>
              <strong>Chase:</strong> Statements & Documents → Download account activity → CSV
            </p>
            <p>
              <strong>Bank of America:</strong> Activity → Download → Spreadsheet (CSV)
            </p>
            <p>
              <strong>Wells Fargo:</strong> Account Activity → Download → Spreadsheet (CSV)
            </p>
            <p>
              <strong>Capital One:</strong> Transactions → Download → CSV
            </p>
            <p className="text-gray-500 italic">
              Most banks have a "Download" or "Export" option in the transactions or statements section.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
