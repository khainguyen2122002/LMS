'use client'

import React from 'react'

interface VideoPlayerProps {
  url: string
  title: string
}

export default function VideoPlayer({ url, title }: VideoPlayerProps) {
  // Helper to parse and convert YouTube link to embed format
  const getEmbedUrl = (link: string) => {
    if (!link) return ''
    
    // YouTube watch link
    if (link.includes('youtube.com/watch')) {
      try {
        const urlObj = new URL(link)
        const videoId = urlObj.searchParams.get('v')
        return `https://www.youtube.com/embed/${videoId}`
      } catch (e) {
        return link
      }
    }
    // YouTube short link
    if (link.includes('youtu.be/')) {
      try {
        const parts = link.split('/')
        const videoId = parts[parts.length - 1].split('?')[0]
        return `https://www.youtube.com/embed/${videoId}`
      } catch (e) {
        return link
      }
    }
    return link
  }

  const embedUrl = getEmbedUrl(url)
  const isDirectFile = url && (url.endsWith('.mp4') || url.endsWith('.webm') || url.startsWith('/uploads/'))

  return (
    <div className="w-full bg-black rounded-2xl overflow-hidden shadow-lg border border-gray-800 relative pt-[56.25%]">
      {/* 16:9 Aspect Ratio Container */}
      <div className="absolute top-0 left-0 w-full h-full">
        {url ? (
          isDirectFile ? (
            <video
              src={url}
              controls
              className="w-full h-full object-contain"
              preload="metadata"
            />
          ) : (
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full border-0"
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture"
            ></iframe>
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 font-medium bg-gray-900">
            <p>Đang chuẩn bị nội dung video...</p>
          </div>
        )}
      </div>
    </div>
  )
}
