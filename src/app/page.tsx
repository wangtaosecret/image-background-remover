'use client'

import { useState, useRef } from 'react'

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setError(null)
    setResultImage(null)
    setUploadedFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  const handleSubmit = async () => {
    if (!originalImage || !uploadedFile) return

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', uploadedFile)

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove background')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setResultImage(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultImage) return
    const link = document.createElement('a')
    link.href = resultImage
    link.download = 'no-bg.png'
    link.click()
  }

  const handleReset = () => {
    setOriginalImage(null)
    setResultImage(null)
    setError(null)
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">🖼️</span>
            Image Background Remover
          </h1>
          <p className="text-slate-400 mt-1">Remove image backgrounds with AI</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Upload Area */}
        {!originalImage && (
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="text-5xl mb-4">📁</div>
            <p className="text-slate-300 text-lg mb-2">
              Drag & drop your image here
            </p>
            <p className="text-slate-500">or click to browse</p>
            <p className="text-slate-600 text-sm mt-4">
              Supports JPG, PNG, WebP • Max 10MB
            </p>
          </div>
        )}

        {/* Preview & Process */}
        {originalImage && (
          <div className="space-y-6">
            {/* Images Display */}
            <div className="grid grid-cols-2 gap-6">
              {/* Original */}
              <div className="bg-slate-800/50 rounded-2xl p-4">
                <h3 className="text-slate-400 text-sm mb-3 text-center">Original</h3>
                <div className="aspect-square bg-slate-700/30 rounded-xl overflow-hidden flex items-center justify-center">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>

              {/* Result */}
              <div className="bg-slate-800/50 rounded-2xl p-4">
                <h3 className="text-slate-400 text-sm mb-3 text-center">Result</h3>
                <div className="aspect-square bg-slate-700/30 rounded-xl overflow-hidden flex items-center justify-center relative">
                  {resultImage ? (
                    <img
                      src={resultImage}
                      alt="No background"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-slate-500 text-center">
                      {isProcessing ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <span>Click process to remove background</span>
                      )}
                    </div>
                  )}
                  {/* Checkerboard pattern for transparency */}
                  {resultImage && (
                    <div className="absolute inset-0 -z-10 opacity-20"
                      style={{
                        backgroundImage: `
                          linear-gradient(45deg, #666 25%, transparent 25%),
                          linear-gradient(-45deg, #666 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #666 75%),
                          linear-gradient(-45deg, transparent 75%, #666 75%)
                        `,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              {!resultImage ? (
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      Remove Background
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleDownload}
                    className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                  >
                    <span>⬇️</span>
                    Download PNG
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-8 py-3 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-xl transition-colors"
                  >
                    Upload New
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center text-slate-500 text-sm">
        Powered by remove.bg API
      </footer>
    </div>
  )
}
