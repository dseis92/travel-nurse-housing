import { useState, useRef, useEffect } from 'react'

interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
}

const SWIPE_THRESHOLD = 100 // Reduced from 150 for quicker response
const ROTATION_FACTOR = 20 // Increased for more dramatic effect

export function SwipeableCard({ children, onSwipeLeft, onSwipeRight, className = '' }: SwipeableCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // Calculate rotation based on horizontal drag
  const rotation = (dragOffset.x / window.innerWidth) * ROTATION_FACTOR

  // Calculate opacity indicators with smoother curve
  const progressRatio = Math.abs(dragOffset.x) / SWIPE_THRESHOLD
  const leftOpacity = Math.min(Math.max(-dragOffset.x / SWIPE_THRESHOLD, 0), 1)
  const rightOpacity = Math.min(Math.max(dragOffset.x / SWIPE_THRESHOLD, 0), 1)

  // Scale effect when dragging
  const scale = 1 - Math.min(Math.abs(dragOffset.x) / window.innerWidth, 0.05)

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true)
    setStartPos({ x: clientX, y: clientY })
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return
    const x = clientX - startPos.x
    const y = clientY - startPos.y
    setDragOffset({ x, y })
  }

  const handleEnd = () => {
    setIsDragging(false)

    // Check if swipe threshold was met
    if (Math.abs(dragOffset.x) > SWIPE_THRESHOLD) {
      // Trigger swipe animation
      setIsAnimatingOut(true)
      setExitDirection(dragOffset.x > 0 ? 'right' : 'left')

      // Call appropriate callback after animation
      setTimeout(() => {
        if (dragOffset.x > 0) {
          onSwipeRight?.()
        } else {
          onSwipeLeft?.()
        }
        // Reset state
        setDragOffset({ x: 0, y: 0 })
        setIsAnimatingOut(false)
        setExitDirection(null)
      }, 200) // Faster animation
    } else {
      // Bounce back to center with spring animation
      setDragOffset({ x: 0, y: 0 })
    }
  }

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientX, e.clientY)
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = () => {
    handleEnd()
  }

  // Add/remove global mouse listeners when dragging
  useEffect(() => {
    if (isDragging) {
      const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY)
      const onMouseUp = () => handleEnd()

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)

      return () => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }
    }
  }, [isDragging, startPos])

  // Calculate transform for animating out
  const getTransform = () => {
    if (isAnimatingOut && exitDirection) {
      const exitX = exitDirection === 'right' ? window.innerWidth * 1.5 : -window.innerWidth * 1.5
      const exitRotation = exitDirection === 'right' ? ROTATION_FACTOR * 3 : -ROTATION_FACTOR * 3
      return `translate(${exitX}px, ${dragOffset.y}px) rotate(${exitRotation}deg) scale(0.8)`
    }
    return `translate(${dragOffset.x}px, ${dragOffset.y * 0.2}px) rotate(${rotation}deg) scale(${scale})`
  }

  const getTransition = () => {
    if (isDragging) return 'none'
    if (isAnimatingOut) return 'all 0.2s cubic-bezier(0.4, 0, 1, 1)' // Fast exit
    return 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' // Bouncy return
  }

  return (
    <div
      ref={cardRef}
      className={`swipeable-card ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: getTransform(),
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: getTransition(),
        touchAction: 'none',
        userSelect: 'none',
        willChange: 'transform',
      }}
    >
      {/* Large swipe indicators with glow */}
      {isDragging && progressRatio > 0.3 && (
        <>
          {/* Right swipe (like) indicator */}
          {rightOpacity > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) scale(1.2)',
                padding: '20px 40px',
                borderRadius: 12,
                background: 'rgba(255,56,92,0.95)',
                color: '#fff',
                fontWeight: 900,
                fontSize: 40,
                opacity: rightOpacity,
                pointerEvents: 'none',
                zIndex: 10,
                boxShadow: `0 0 ${40 * rightOpacity}px rgba(255,56,92,${0.6 * rightOpacity})`,
                letterSpacing: '0.05em',
              }}
            >
              LIKE
            </div>
          )}

          {/* Left swipe (pass) indicator */}
          {leftOpacity > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) scale(1.2)',
                padding: '20px 40px',
                borderRadius: 12,
                background: 'rgba(34,34,34,0.95)',
                color: '#fff',
                fontWeight: 900,
                fontSize: 40,
                opacity: leftOpacity,
                pointerEvents: 'none',
                zIndex: 10,
                boxShadow: `0 0 ${40 * leftOpacity}px rgba(34,34,34,${0.6 * leftOpacity})`,
                letterSpacing: '0.05em',
              }}
            >
              NOPE
            </div>
          )}
        </>
      )}

      {children}
    </div>
  )
}
