import { useEffect, useRef, memo } from 'react'
import { useTheme } from '../contexts/ThemeContext'

interface LiquidGlassProps {
  width?: string
  height?: string
  position?: 'fixed' | 'absolute' | 'relative'
  top?: string
  left?: string
  right?: string
  bottom?: string
  transform?: string
  glassFrost?: number
  glassSaturation?: number
  borderRadius?: string
  className?: string
}

const LiquidGlass = memo(function LiquidGlass({
  width = '400px',
  height = '400px',
  position = 'absolute',
  top = '50%',
  left = '50%',
  right,
  bottom,
  transform = 'translate(-50%, -50%)',
  glassFrost = 0.2,
  glassSaturation = 1.4,
  borderRadius = '24px',
  className = ''
}: LiquidGlassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { colors, accentColor } = useTheme()
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { 
      alpha: true,
      willReadFrequently: false,
      desynchronized: true // Better performance
    })
    if (!ctx) return

    // Set canvas size with lower resolution for better performance
    const dpr = Math.min(window.devicePixelRatio || 1, 2) // Cap at 2x
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Color mapping based on accent color
    const colorMap: Record<string, { hue: number, saturation: number }> = {
      caramel: { hue: 30, saturation: 0.4 },
      purple: { hue: 270, saturation: 0.6 },
      blue: { hue: 210, saturation: 0.7 },
      green: { hue: 140, saturation: 0.6 },
      orange: { hue: 25, saturation: 0.8 },
      pink: { hue: 330, saturation: 0.7 },
      red: { hue: 0, saturation: 0.7 },
      yellow: { hue: 50, saturation: 0.8 },
      teal: { hue: 175, saturation: 0.6 },
      indigo: { hue: 240, saturation: 0.7 },
      rose: { hue: 350, saturation: 0.7 },
      cyan: { hue: 190, saturation: 0.7 },
      lime: { hue: 80, saturation: 0.7 },
      amber: { hue: 40, saturation: 0.8 },
      violet: { hue: 260, saturation: 0.7 },
      emerald: { hue: 150, saturation: 0.6 },
      fuchsia: { hue: 300, saturation: 0.8 },
      sky: { hue: 200, saturation: 0.7 },
      slate: { hue: 215, saturation: 0.2 },
      stone: { hue: 30, saturation: 0.1 },
      crimson: { hue: 350, saturation: 0.85 },
      coral: { hue: 10, saturation: 0.75 },
      lavender: { hue: 280, saturation: 0.5 },
      mint: { hue: 160, saturation: 0.55 },
      peach: { hue: 20, saturation: 0.6 },
      navy: { hue: 215, saturation: 0.9 },
      burgundy: { hue: 345, saturation: 0.8 },
      gold: { hue: 45, saturation: 0.95 },
      chocolate: { hue: 25, saturation: 0.7 },
      olive: { hue: 75, saturation: 0.5 },
    }

    const colorConfig = colorMap[accentColor] || { hue: 30, saturation: 0.4 }

    // Animation parameters - optimized for maximum smoothness
    let time = 0
    let animationId: number
    let lastFrameTime = 0
    const targetFPS = 60
    const frameInterval = 1000 / targetFPS
    
    const blobs: Array<{
      x: number
      y: number
      radius: number
      speed: number
      angle: number
      hue: number
    }> = []

    // Only 2 small blobs for maximum performance
    for (let i = 0; i < 2; i++) {
      blobs.push({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        radius: 100 + Math.random() * 60, // Smaller blobs
        speed: 0.1 + Math.random() * 0.15, // Slower movement
        angle: Math.random() * Math.PI * 2,
        hue: colorConfig.hue + (Math.random() - 0.5) * 30
      })
    }

    function animate(currentTime: number) {
      if (!ctx || !canvas) return
      
      const deltaTime = currentTime - lastFrameTime
      
      // Limit to target FPS
      if (deltaTime < frameInterval) {
        animationId = requestAnimationFrame(animate)
        return
      }
      
      lastFrameTime = currentTime - (deltaTime % frameInterval)
      
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      time += 0.0008 // Very slow animation

      // Update and draw blobs
      blobs.forEach((blob, index) => {
        // Move blob very slowly
        blob.angle += blob.speed * 0.004
        blob.x += Math.cos(blob.angle) * blob.speed * 0.6
        blob.y += Math.sin(blob.angle) * blob.speed * 0.6

        // Bounce off edges
        if (blob.x < -blob.radius) blob.x = rect.width + blob.radius
        if (blob.x > rect.width + blob.radius) blob.x = -blob.radius
        if (blob.y < -blob.radius) blob.y = rect.height + blob.radius
        if (blob.y > rect.height + blob.radius) blob.y = -blob.radius

        // Pulsating size
        const pulse = Math.sin(time * 2 + index) * 0.1 + 0.9
        const currentRadius = blob.radius * pulse

        // Create gradient with theme color
        const gradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, currentRadius
        )
        
        gradient.addColorStop(0, `hsla(${blob.hue}, ${colorConfig.saturation * 100}%, 60%, 0.15)`)
        gradient.addColorStop(0.5, `hsla(${blob.hue}, ${colorConfig.saturation * 100}%, 55%, 0.06)`)
        gradient.addColorStop(1, `hsla(${blob.hue}, ${colorConfig.saturation * 100}%, 50%, 0)`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(blob.x, blob.y, currentRadius, 0, Math.PI * 2)
        ctx.fill()
      })

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [glassFrost, glassSaturation, accentColor, colors])

  return (
    <canvas
      ref={canvasRef}
      className={`liquid-glass ${className}`}
      style={{
        width,
        height,
        position,
        top,
        left,
        right,
        bottom,
        transform,
        borderRadius,
        filter: `blur(${glassFrost * 60}px) saturate(${glassSaturation})`,
        opacity: 0.35,
        pointerEvents: 'none',
        zIndex: 1,
        willChange: 'transform',
        imageRendering: 'auto',
      }}
    />
  )
})

export default LiquidGlass
