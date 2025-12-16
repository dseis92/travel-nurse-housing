import { useState, useRef, useEffect } from 'react'

interface PhotoCarouselProps {
  images: string[]
  alt?: string
  className?: string
  style?: React.CSSProperties
}

const PHOTO_SWIPE_THRESHOLD = 50 // Lower threshold for photo navigation

export function PhotoCarousel({ images, alt = 'Listing photo', className = '', style }: PhotoCarouselProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const hasMultiplePhotos = images.length > 1

  const handleStart = (clientX: number, clientY: number, e: React.TouchEvent | React.MouseEvent) => {
    // Stop propagation to prevent card swipe
    e.stopPropagation()
    setIsDragging(true)
    setStartPos({ x: clientX, y: clientY })
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !hasMultiplePhotos) return

    const deltaX = clientX - startPos.x
    const deltaY = clientY - startPos.y

    // Only track horizontal movement if it's primarily horizontal
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setDragOffset(deltaX)
    }
  }

  const handleEnd = (e: React.TouchEvent | React.MouseEvent) => {
    // Stop propagation to prevent card swipe
    e.stopPropagation()

    if (!isDragging) return
    setIsDragging(false)

    if (!hasMultiplePhotos) return

    // Check if swipe threshold was met
    if (Math.abs(dragOffset) > PHOTO_SWIPE_THRESHOLD) {
      if (dragOffset > 0 && currentPhotoIndex > 0) {
        // Swipe right - previous photo
        setCurrentPhotoIndex(prev => prev - 1)
      } else if (dragOffset < 0 && currentPhotoIndex < images.length - 1) {
        // Swipe left - next photo
        setCurrentPhotoIndex(prev => prev + 1)
      }
    }

    // Reset drag offset
    setDragOffset(0)
  }

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientX, e.clientY, e)
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY, e)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    handleEnd(e)
  }

  // Add global mouse listeners when dragging
  useEffect(() => {
    if (isDragging) {
      const onMouseMove = (e: MouseEvent) => {
        e.stopPropagation()
        handleMove(e.clientX, e.clientY)
      }
      const onMouseUp = (e: MouseEvent) => {
        e.stopPropagation()
        setIsDragging(false)
        handleEnd(e as any)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)

      return () => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }
    }
  }, [isDragging, startPos, dragOffset, currentPhotoIndex])

  const goToPhoto = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentPhotoIndex(index)
  }

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1)
    }
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentPhotoIndex < images.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1)
    }
  }

  // Calculate transform for drag effect
  const getTransform = () => {
    if (!hasMultiplePhotos) return 'translateX(0)'
    const offset = dragOffset
    return `translateX(${offset}px)`
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...style,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Photo display */}
      <div
        role="img"
        aria-label={alt}
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${images[currentPhotoIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: getTransform(),
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          cursor: isDragging ? 'grabbing' : (hasMultiplePhotos ? 'grab' : 'pointer'),
        }}
      />

      {/* Navigation arrows (desktop) */}
      {hasMultiplePhotos && (
        <>
          {currentPhotoIndex > 0 && (
            <button
              onClick={handlePrevious}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255,255,255,0.9)',
                color: '#1f2937',
                fontSize: 18,
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                opacity: 0.8,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
            >
              ‹
            </button>
          )}

          {currentPhotoIndex < images.length - 1 && (
            <button
              onClick={handleNext}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255,255,255,0.9)',
                color: '#1f2937',
                fontSize: 18,
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                opacity: 0.8,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
            >
              ›
            </button>
          )}
        </>
      )}

      {/* Photo counter */}
      {hasMultiplePhotos && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            padding: '4px 10px',
            borderRadius: 12,
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          {currentPhotoIndex + 1} / {images.length}
        </div>
      )}

      {/* Dot indicators */}
      {hasMultiplePhotos && images.length <= 8 && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 6,
            zIndex: 10,
          }}
        >
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => goToPhoto(index, e)}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                border: 'none',
                background: index === currentPhotoIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
              aria-label={`Go to photo ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
