import { useEffect, useRef } from 'react'

/**
 * 별·유성·스크롤 지형 캔버스 배경 (원본 알고리즘 계승).
 * 콘텐츠는 이 컴포넌트 위에 `relative z-10` 등으로 올립니다.
 */
export function StarfieldTerrainBackground() {
  const rootRef = useRef<HTMLDivElement>(null)
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const host = rootRef.current
    const background = bgCanvasRef.current
    if (!host || !background) return

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      host.classList.add('starfield-static-fallback')
      return
    }

    const sky = background.getContext('2d')
    if (!sky) return
    const skyCtx: CanvasRenderingContext2D = sky

    let width = window.innerWidth
    let height = Math.max(document.documentElement.clientHeight, 400)

    background.width = width
    background.height = height

    class Terrain {
      terrain: HTMLCanvasElement
      terCtx: CanvasRenderingContext2D
      scrollDelay: number
      lastScroll: number
      fillStyle: string
      mHeight: number
      points: number[]

      constructor(
        options: {
          container: HTMLElement
          displacement?: number
          scrollDelay?: number
          fillStyle?: string
          mHeight?: number
        },
      ) {
        const o = options
        this.terrain = document.createElement('canvas')
        const ctx = this.terrain.getContext('2d')
        if (!ctx) throw new Error('2d')
        this.terCtx = ctx
        this.scrollDelay = o.scrollDelay ?? 90
        this.lastScroll = Date.now()
        this.terrain.width = width
        this.terrain.height = height
        this.terrain.style.position = 'absolute'
        this.terrain.style.top = '0'
        this.terrain.style.left = '0'
        this.terrain.style.width = '100%'
        this.terrain.style.height = '100%'
        this.terrain.setAttribute('aria-hidden', 'true')
        this.fillStyle = o.fillStyle ?? '#191D4C'
        this.mHeight = o.mHeight ?? height

        let displacement = o.displacement ?? 140
        const power = 2 ** Math.ceil(Math.log(width) / Math.LN2)

        this.points = []
        this.points[0] = this.mHeight
        this.points[power] = this.points[0]

        for (let i = 1; i < power; i *= 2) {
          for (let j = power / i / 2; j < power; j += power / i) {
            this.points[j] =
              (this.points[j - power / i / 2] + this.points[j + power / i / 2]) / 2 +
              Math.floor(Math.random() * -displacement + displacement)
          }
          displacement *= 0.6
        }

        o.container.appendChild(this.terrain)
      }

      update() {
        this.terCtx.clearRect(0, 0, width, height)
        this.terCtx.fillStyle = this.fillStyle
        if (Date.now() > this.lastScroll + this.scrollDelay) {
          this.lastScroll = Date.now()
          const first = this.points.shift()
          if (first !== undefined) this.points.push(first)
        }
        this.terCtx.beginPath()
        for (let i = 0; i <= width; i++) {
          if (i === 0) {
            this.terCtx.moveTo(0, this.points[0])
          } else if (this.points[i] !== undefined) {
            this.terCtx.lineTo(i, this.points[i])
          }
        }
        this.terCtx.lineTo(width, this.terrain.height)
        this.terCtx.lineTo(0, this.terrain.height)
        this.terCtx.lineTo(0, this.points[0])
        this.terCtx.fill()
      }
    }

    class Star {
      size: number
      speed: number
      x: number
      y: number

      constructor(
        options: { x: number; y: number },
        private readonly ctx: CanvasRenderingContext2D,
      ) {
        this.size = Math.random() * 2
        this.speed = Math.random() * 0.05
        this.x = options.x
        this.y = options.y
      }

      reset() {
        this.size = Math.random() * 2
        this.speed = Math.random() * 0.05
        this.x = width
        this.y = Math.random() * height
      }

      update() {
        this.x -= this.speed
        if (this.x < 0) {
          this.reset()
        } else {
          this.ctx.fillRect(this.x, this.y, this.size, this.size)
        }
      }
    }

    class ShootingStar {
      x = 0
      y = 0
      len = 0
      speed = 0
      size = 0
      waitTime = 0
      active = false

      constructor(private readonly ctx: CanvasRenderingContext2D) {
        this.reset()
      }

      reset() {
        this.x = Math.random() * width
        this.y = 0
        this.len = Math.random() * 80 + 10
        this.speed = Math.random() * 10 + 6
        this.size = Math.random() * 1 + 0.1
        this.waitTime = Date.now() + Math.random() * 3000 + 500
        this.active = false
      }

      update() {
        if (this.active) {
          this.x -= this.speed
          this.y += this.speed
          if (this.x < 0 || this.y >= height) {
            this.reset()
          } else {
            this.ctx.lineWidth = this.size
            this.ctx.beginPath()
            this.ctx.moveTo(this.x, this.y)
            this.ctx.lineTo(this.x + this.len, this.y - this.len)
            this.ctx.stroke()
          }
        } else if (this.waitTime < Date.now()) {
          this.active = true
        }
      }
    }

    skyCtx.fillStyle = '#05004c'
    skyCtx.fillRect(0, 0, width, height)

    const entities: Array<{ update: () => void }> = []

    for (let i = 0; i < height; i++) {
      entities.push(
        new Star(
          {
            x: Math.random() * width,
            y: Math.random() * height,
          },
          skyCtx,
        ),
      )
    }

    entities.push(new ShootingStar(skyCtx), new ShootingStar(skyCtx))
    entities.push(
      new Terrain({ container: host, mHeight: height / 2 - 120 }),
      new Terrain({
        container: host,
        displacement: 120,
        scrollDelay: 50,
        fillStyle: 'rgb(17,20,40)',
        mHeight: height / 2 - 60,
      }),
      new Terrain({
        container: host,
        displacement: 100,
        scrollDelay: 20,
        fillStyle: 'rgb(10,10,5)',
        mHeight: height / 2,
      }),
    )

    let rafId = 0

    function animate() {
      skyCtx.fillStyle = '#110E19'
      skyCtx.fillRect(0, 0, width, height)
      skyCtx.fillStyle = '#ffffff'
      skyCtx.strokeStyle = '#ffffff'

      let entLen = entities.length
      while (entLen--) {
        entities[entLen].update()
      }
      rafId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(rafId)
      for (const el of host.querySelectorAll('canvas')) {
        if (el !== background) el.remove()
      }
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className="starfield-canvas-root pointer-events-none"
      aria-hidden="true"
    >
      <canvas ref={bgCanvasRef} id="bgCanvas" className="starfield-canvas-main" />
    </div>
  )
}
