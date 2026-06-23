'use client'

import React from 'react'
import { FileVideo, FileText, ExternalLink, AlertCircle } from 'lucide-react'

interface SmartEmbedProps {
  url: string
  title?: string
  type?: 'video' | 'pdf' | 'slide' | 'word' | 'reading' | 'other'
}

export default function SmartEmbed({ url, title, type }: SmartEmbedProps) {
  if (!url) return null

  // Phân tích URL để xác định provider và định dạng nhúng
  const getEmbedDetails = (url: string) => {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()

      // 1. Microsoft SharePoint / OneDrive
      if (hostname.includes('sharepoint.com') || hostname.includes('onedrive.live.com')) {
        // SharePoint Video thường có dạng :v: hoặc link trực tiếp
        // Thử chuyển đổi sang dạng embed nếu cần
        let embedUrl = url
        if (url.includes(':v:/')) {
          // Link chia sẻ video SharePoint thường cần tham số action=embedview
          if (!url.includes('action=embedview')) {
            embedUrl = url + (url.includes('?') ? '&' : '?') + 'action=embedview'
          }
        } else if (url.includes('personal.sharepoint.com') && !url.includes('embed')) {
          // Xử lý link tài liệu
          embedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
        }
        
        return {
          provider: 'microsoft',
          embedUrl,
          isIframe: true
        }
      }

      // 2. Microsoft Stream (Legacy)
      if (hostname.includes('stream.microsoft.com')) {
        return {
          provider: 'microsoft-stream',
          embedUrl: url.replace('/video/', '/embed/video/'),
          isIframe: true
        }
      }

      // 3. YouTube (Dự phòng cho tương lai)
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        let videoId = ''
        if (hostname.includes('youtu.be')) {
          videoId = urlObj.pathname.substring(1)
        } else {
          videoId = urlObj.searchParams.get('v') || ''
        }
        return {
          provider: 'youtube',
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          isIframe: true
        }
      }

      // 4. Vimeo (Dự phòng cho tương lai)
      if (hostname.includes('vimeo.com')) {
        const videoId = urlObj.pathname.split('/').pop()
        return {
          provider: 'vimeo',
          embedUrl: `https://player.vimeo.com/video/${videoId}`,
          isIframe: true
        }
      }

      // Mặc định: Trả về link gốc
      return {
        provider: 'external',
        embedUrl: url,
        isIframe: false
      }
    } catch (e) {
      return {
        provider: 'invalid',
        embedUrl: url,
        isIframe: false
      }
    }
  }

  const details = getEmbedDetails(url)

  // Giao diện cho Iframe (Video/Tài liệu nhúng)
  if (details.isIframe) {
    return (
      <div className="relative w-full overflow-hidden rounded-xl bg-black shadow-lg" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={details.embedUrl}
          title={title || 'Content Player'}
          className="absolute top-0 left-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    )
  }

  // Giao diện cho các link không thể nhúng (Tải về/Xem ngoài)
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-center">
      <div className="w-20 h-20 bg-[#103C11]/10 rounded-full flex items-center justify-center mb-6 text-[#103C11]">
        {type === 'video' ? <FileVideo size={40} /> : <FileText size={40} />}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title || 'Tài liệu học tập'}</h3>
      <p className="text-gray-500 mb-8 max-w-md">
        Nội dung này cần được xem trực tiếp tại nguồn hoặc tải về để học tập.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-[#103C11] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#1e5c20] transition-all shadow-lg hover:shadow-[#103C11]/20"
      >
        <ExternalLink size={20} />
        Mở tài liệu ngay
      </a>
    </div>
  )
}

