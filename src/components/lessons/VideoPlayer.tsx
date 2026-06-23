'use client'

interface VideoPlayerProps {
  url: string
  title: string
  onProgress?: (currentTime: number, duration: number) => void
}

export default function VideoPlayer({ url, title, onProgress }: VideoPlayerProps) {
  // Đối với iframe (Teams/Stream), rất khó để track chính xác currentTime.
  // Giải pháp: Sử dụng một timer đơn giản để ghi nhận thời gian học viên ở trên trang này.
  
  return (
    <div className="w-full bg-black rounded-xl overflow-hidden shadow-lg border border-gray-800 relative pt-[56.25%]">
      {/* 16:9 Aspect Ratio Container */}
      {url ? (
        <iframe
          src={url}
          title={title}
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
        ></iframe>
      ) : (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-gray-500 font-medium">
          Đang chuẩn bị nội dung video...
        </div>
      )}
    </div>
  )
}
