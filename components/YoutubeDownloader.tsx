'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertCircle, Download, Youtube, Loader2, Github, Twitter } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Quality {
  itag: number
  qualityLabel: string | null
  container: string
  codecs: string
}

interface VideoInfo {
  title: string
  qualities: Quality[]
}

const preferredCodecs: { [key: string]: { [key: string]: string[] } } = {
  '2160p': { webm: ['vp9'] },
  '1440p': { webm: ['vp9'] },
  '1080p': { mp4: ['avc1.640028'], webm: ['vp9'] },
  '720p': { mp4: ['avc1.4d401f'], webm: ['vp9'] },
  '480p': { mp4: ['avc1.4d401e'], webm: ['vp9'] },
  '360p': { mp4: ['avc1.42001E'], webm: ['vp9'] },
  '240p': { mp4: ['avc1.4d4015'], webm: ['vp9'] },
  '144p': { mp4: ['avc1.4d400c'], webm: ['vp9'] }
};

export default function YouTubeDownloader() {
  const [url, setUrl] = useState<string>('')
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [selectedQuality, setSelectedQuality] = useState<number | null>(null)
  const [downloadLink, setDownloadLink] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

  const handleGetInfo = async () => {
    setIsLoading(true)
    setError('')
    setVideoInfo(null)
    setSelectedQuality(null)
    setDownloadLink('')

    try {
      const response = await fetch('/api/youtube-downloader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getInfo', url })
      })
      if (!response.ok) {
        throw new Error('Failed to fetch video info')
      }
      const data: VideoInfo = await response.json()
      setVideoInfo(data)
    } catch (error) {
      console.error('Failed to fetch video info:', error)
      setError('Failed to fetch video info. Please check the URL and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateLink = async () => {
    if (!selectedQuality) return

    setIsLoading(true)
    setError('')
    setDownloadLink('')

    try {
      const response = await fetch('/api/youtube-downloader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getDownloadLink', url, quality: selectedQuality })
      })
      if (!response.ok) {
        throw new Error('Failed to generate download link')
      }
      const data = await response.json()
      setDownloadLink(data.downloadUrl)
      setIsDialogOpen(true)
    } catch (error) {
      console.error('Failed to generate download link:', error)
      setError('Failed to generate download link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white ">
      <header className="bg-card py-4 border border-b-muted-forground">
        <div className="container mx-4 px-4 flex justify-start items-center">
          <div className="flex items-center">
            <Youtube className="w-8 h-8 text-red-600 mr-2" />
            <span className="text-xl font-bold">youtube4kdownloader</span>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">YouTube Video Downloader</h1>
          <p className="text-xl text-gray-300">Download high-quality YouTube videos up to 4K resolution</p>
        </div>

        <Card className="bg-card border-muted mb-12">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-white">Download Video</CardTitle>
            <CardDescription className="text-gray-400">Enter a YouTube URL to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-card text-white border-muted-forground focus:border-gray-600 focus:ring-0"
              />
              <Button 
                onClick={handleGetInfo} 
                disabled={isLoading || !url} 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>
                ) : (
                  'Get Video Info'
                )}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-900 border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {videoInfo && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">{videoInfo.title}</h2>
                <RadioGroup 
                  onValueChange={(value) => setSelectedQuality(parseInt(value))}
                  className="space-y-2"
                >
                  {videoInfo.qualities
                    .filter(q => q.qualityLabel && preferredCodecs[q.qualityLabel]?.[q.container])
                    .sort((a, b) => {
                      const aNumber = parseInt(a.qualityLabel || '0');
                      const bNumber = parseInt(b.qualityLabel || '0');
                      return bNumber - aNumber || a.itag - b.itag;
                    })
                    .filter((quality, index, self) => 
                      index === self.findIndex((t) => t.qualityLabel === quality.qualityLabel && t.container === quality.container)
                    )
                    .map((quality) => (
                      <div key={quality.itag} className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value={quality.itag.toString()} 
                          id={quality.itag.toString()} 
                          className="border-gray-600 text-red-500"
                        />
                        <Label htmlFor={quality.itag.toString()} className="text-sm text-gray-300">
                          {quality.qualityLabel} ({quality.container})
                        </Label>
                      </div>
                    ))}
                </RadioGroup>
                <Button 
                  onClick={handleGenerateLink} 
                  disabled={isLoading || !selectedQuality} 
                  className="w-full bg-white hover:bg-gray-300 "
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    'Generate Download Link'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-lg border border-muted">
              <h3 className="text-xl font-semibold mb-2">1. Enter URL</h3>
              <p className="text-gray-300">Paste the YouTube video URL you want to download.</p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-muted">
              <h3 className="text-xl font-semibold mb-2">2. Choose Quality</h3>
              <p className="text-gray-300">Select your preferred video quality and format.</p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-muted">
              <h3 className="text-xl font-semibold mb-2">3. Download</h3>
              <p className="text-gray-300">Click the download button and save your video.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Features</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Download videos in qualities up to 4K</li>
            <li>Support for various video formats</li>
            <li>Fast and easy to use</li>
            <li>No registration required</li>
            <li>Free to use</li>
          </ul>
        </section>
      </main>

      <footer className="bg-card py-6 border border-t-muted">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p>&copy; 2024 youtube4kdownloader. All rights reserved.</p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white">
                <Github className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <Twitter className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card text-white border-muted">
          <DialogHeader>
            <DialogTitle>Download Link Generated</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input
              readOnly
              value={downloadLink}
              className="flex-1 bg-card text-white border-gray-700"
            />
            <Button 
              size="sm" 
              className="px-3 bg-white hover:bg-gray-300 " 
              onClick={() => window.open(downloadLink, '_blank')}
            >
              <span className="sr-only">Download</span>
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDialogOpen(false)}
              className="bg-muted text-white hover:bg-muted-forground"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}