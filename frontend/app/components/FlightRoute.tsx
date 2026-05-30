'use client'
import { useEffect, useRef } from 'react'

// AMS coordinates
const AMS = { lat: 52.31, lng: 4.76 }

interface Props {
  destLat: number
  destLng: number
  destCity: string
}

export function FlightRoute({ destLat, destLng, destCity }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    // Map lat/lng to SVG coordinates (simple equirectangular)
    function project(lat: number, lng: number) {
      // Fit roughly Europe/world in 280×120 box, centred on AMS
      const x = ((lng + 20) / 200) * 280
      const y = ((70 - lat) / 80) * 120
      return { x: Math.max(4, Math.min(276, x)), y: Math.max(4, Math.min(116, y)) }
    }

    const a = project(AMS.lat, AMS.lng)
    const b = project(destLat, destLng)

    // Control point for arc (midpoint elevated)
    const mx = (a.x + b.x) / 2
    const my = (a.y + b.y) / 2 - 30

    const path  = svg.querySelector('.flight-path') as SVGPathElement
    const plane = svg.querySelector('.flight-plane') as SVGCircleElement
    const dotA  = svg.querySelector('.dot-a') as SVGCircleElement
    const dotB  = svg.querySelector('.dot-b') as SVGCircleElement

    if (!path || !plane || !dotA || !dotB) return

    const d = `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`
    path.setAttribute('d', d)
    dotA.setAttribute('cx', String(a.x)); dotA.setAttribute('cy', String(a.y))
    dotB.setAttribute('cx', String(b.x)); dotB.setAttribute('cy', String(b.y))

    const len = path.getTotalLength()
    path.style.strokeDasharray  = String(len)
    path.style.strokeDashoffset = String(len)

    // Animate path drawing
    path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
      duration: 1800, easing: 'ease-in-out', fill: 'forwards', delay: 200,
    })

    // Animate plane along path
    let start: number | null = null
    const totalMs = 1800
    const delayMs = 200
    function tick(ts: number) {
      if (!start) start = ts
      const elapsed = ts - start - delayMs
      const t = Math.min(1, Math.max(0, elapsed / totalMs))
      const pt = path.getPointAtLength(t * len)
      plane.setAttribute('cx', String(pt.x))
      plane.setAttribute('cy', String(pt.y))
      plane.style.opacity = t > 0.02 ? '1' : '0'
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [destLat, destLng])

  return (
    <div className="border border-dark/[.1] bg-card mb-4">
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted px-4 pt-3 pb-1">
        Amsterdam → {destCity}
      </p>
      <svg ref={svgRef} viewBox="0 0 280 120" className="w-full" style={{ height: 120 }}>
        <path className="flight-path" stroke="#c14a1f" strokeWidth="1.5" strokeDasharray="4 3" fill="none" opacity="0.7" />
        <circle className="dot-a" r="4" fill="#1a1d2e" />
        <circle className="dot-b" r="4" fill="#c14a1f" />
        <circle className="flight-plane" r="5" fill="#c14a1f" opacity="0" />
        <text className="dot-a-label" x="0" y="0" fontSize="8" fontFamily="monospace" fill="#8a8478">
          <textPath href="#no">AMS</textPath>
        </text>
      </svg>
    </div>
  )
}
