'use client'

import { useState, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import ThemeToggle from '@/components/ThemeToggle'

export default function Home() {
  const { data: session, status } = useSession()
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

  // 未登录状态
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors">
        {/* Header */}
        <header className="border-b border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm bg-white/50 dark:bg-slate-900/50">
          <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <span className="text-3xl">🖼️</span>
                Image Background Remover
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Remove image backgrounds with AI</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => signIn('google')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <span>🔐</span>
                Sign in
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
              <span>✨</span>
              <span>AI-Powered Background Removal</span>
            </div>
            <h2 className="text-5xl font-bold text-slate-800 dark:text-white mb-6">
              Remove Image Backgrounds
              <span className="block text-blue-600">In Seconds</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
              Upload any image and get a transparent background instantly. 
              Perfect for product photos, portraits, and creative projects.
            </p>
            <button
              onClick={() => signIn('google')}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors inline-flex items-center gap-3 text-lg shadow-lg shadow-blue-600/25"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Get Started Free
            </button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Fast Processing</h3>
              <p className="text-slate-600 dark:text-slate-400">Get your transparent images in seconds. No waiting, no hassle.</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">High Quality</h3>
              <p className="text-slate-600 dark:text-slate-400">AI-powered precision that handles complex edges and details.</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Privacy First</h3>
              <p className="text-slate-600 dark:text-slate-400">Your images are processed securely and never stored on our servers.</p>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-8">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl mx-auto mb-4">1</div>
                <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Upload Image</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Drag and drop or click to select any JPG, PNG, or WebP image</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl mx-auto mb-4">2</div>
                <h4 className="font-semibold text-slate-800 dark:text-white mb-2">AI Processing</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Our AI automatically removes the background in seconds</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl mx-auto mb-4">3</div>
                <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Download Result</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Get your transparent PNG and use it anywhere you like</p>
              </div>
            </div>
          </div>
        </main>

        <footer className="fixed bottom-0 left-0 right-0 py-4 text-center text-slate-500 dark:text-slate-500 text-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          Powered by remove.bg API
        </footer>
      </div>
    )
  }

  // 加载状态
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-slate-600 dark:text-white text-xl">Loading...</div>
      </div>
    )
  }

  // 已登录状态
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors">
      {/* Header */}
      <header className="border-b border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <span className="text-3xl">🖼️</span>
              Image Background Remover
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Remove image backgrounds with AI</p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="w-10 h-10 rounded-full border-2 border-slate-300 dark:border-slate-600"
              />
            )}
            <div className="text-right">
              <p className="text-slate-800 dark:text-white text-sm font-medium">{session?.user?.name}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white text-sm rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Upload Area */}
        {!originalImage && (
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 bg-white/50 dark:bg-slate-800/50'
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
            <p className="text-slate-600 dark:text-slate-300 text-lg mb-2">
              Drag & drop your image here
            </p>
            <p className="text-slate-500 dark:text-slate-400">or click to browse</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-4">
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
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                <h3 className="text-slate-600 dark:text-slate-400 text-sm mb-3 text-center">Original</h3>
                <div className="aspect-square bg-slate-100 dark:bg-slate-700/30 rounded-xl overflow-hidden flex items-center justify-center">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>

              {/* Result */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                <h3 className="text-slate-600 dark:text-slate-400 text-sm mb-3 text-center">Result</h3>
                <div className="aspect-square bg-slate-100 dark:bg-slate-700/30 rounded-xl overflow-hidden flex items-center justify-center relative">
                  {resultImage ? (
                    <img
                      src={resultImage}
                      alt="No background"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-slate-500 dark:text-slate-400 text-center">
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
                    <div className="absolute inset-0 -z-10 opacity-20 dark:opacity-30"
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
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white font-medium rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/25"
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
                    className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-green-600/25"
                  >
                    <span>⬇️</span>
                    Download PNG
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-8 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-medium rounded-xl transition-colors"
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
      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center text-slate-500 dark:text-slate-500 text-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        Powered by remove.bg API
      </footer>
    </div>
  )
}
