import React, { useEffect, useRef } from 'react'

const OceanCanvas = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let width, height, particles = [], fishes = [], animationId

    const initCanvas = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      particles = []
      fishes = []

      for (let i = 0; i < 150; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.5 + 0.5,
          speed: Math.random() * 0.4 + 0.1,
          opacity: Math.random() * 0.3,
        })
      }

      for (let i = 0; i < 15; i++) {
        fishes.push(new SimpleFish())
      }
    }

    class SimpleFish {
      constructor() {
        this.reset()
      }

      reset() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.size = Math.random() * 20 + 10
        this.speed = Math.random() * 1.2 + 0.4
        this.opacity = Math.random() * 0.2 + 0.1
        this.angle = Math.random() > 0.5 ? 0 : Math.PI
        this.wobble = Math.random() * 10
      }

      draw() {
        this.wobble += 0.04
        this.x += this.angle === 0 ? this.speed : -this.speed
        this.y += Math.sin(this.wobble) * 0.4

        if (this.x < -100 || this.x > width + 100) {
          this.reset()
        }

        ctx.save()
        ctx.translate(this.x, this.y)
        if (this.angle !== 0) {
          ctx.scale(-1, 1)
        }

        ctx.fillStyle = `rgba(0, 242, 255, ${this.opacity})`
        ctx.shadowBlur = 10
        ctx.shadowColor = 'rgba(0, 242, 255, 0.5)'

        ctx.beginPath()
        ctx.ellipse(0, 0, this.size, this.size / 3, 0, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(-this.size + 2, 0)
        ctx.lineTo(-this.size - 8, -6 - Math.sin(this.wobble) * 3)
        ctx.lineTo(-this.size - 8, 6 + Math.sin(this.wobble) * 3)
        ctx.closePath()
        ctx.fill()

        ctx.restore()
      }
    }

    const animate = () => {
      ctx.fillStyle = '#010a11'
      ctx.fillRect(0, 0, width, height)

      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        width * 0.7
      )
      grad.addColorStop(0, 'rgba(0, 95, 115, 0.1)')
      grad.addColorStop(1, 'rgba(1, 10, 17, 1)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      particles.forEach(p => {
        ctx.fillStyle = `rgba(0, 242, 255, ${p.opacity})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        p.y -= p.speed
        if (p.y < -10) {
          p.y = height + 10
        }
      })

      fishes.forEach(f => f.draw())
      animationId = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      initCanvas()
    }

    initCanvas()
    animate()

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return <canvas ref={canvasRef} id="oceanCanvas" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} />
}

export default OceanCanvas
