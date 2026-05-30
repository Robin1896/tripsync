'use client'
import { useEffect, useRef } from 'react'
import { type GlobeMarker } from './Globe'

interface Props {
  markers: GlobeMarker[]
}

export function MapView({ markers }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || markers.length === 0) return

    let map: import('leaflet').Map | null = null

    async function init() {
      const L = (await import('leaflet')).default
      // Fix default icon paths broken by webpack
      // @ts-expect-error leaflet internal
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (!ref.current) return
      map = L.map(ref.current, { zoomControl: false, attributionControl: false })
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      }).addTo(map)

      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
      map.fitBounds(bounds, { padding: [40, 40] })

      const maxScore = Math.max(...markers.map(m => m.score), 1)

      markers.forEach((m, i) => {
        const rel = m.score / maxScore
        const size = Math.round(10 + rel * 14)
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:${size}px;height:${size}px;
            border-radius:50%;
            background:rgba(193,74,31,${0.35 + rel * 0.65});
            border:2px solid #c14a1f;
            box-shadow:0 0 0 ${Math.round(rel * 6)}px rgba(193,74,31,.15);
            display:flex;align-items:center;justify-content:center;
          "></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })

        const marker = L.marker([m.lat, m.lng], { icon })
        marker.bindTooltip(`<b>#${i + 1} ${m.label}</b><br/>${m.score}% match`, {
          permanent: false, direction: 'top', className: 'ts-tooltip',
        })
        marker.addTo(map!)
      })
    }

    init()
    return () => { map?.remove() }
  }, [markers])

  return (
    <>
      <style>{`
        .ts-tooltip {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          background: rgba(255,253,249,0.96);
          border: 1px solid rgba(26,29,46,0.18);
          border-radius: 0;
          box-shadow: none;
          padding: 4px 8px;
          color: #1a1d2e;
        }
        .ts-tooltip::before { display: none; }
      `}</style>
      <div ref={ref} className="w-full h-full" />
    </>
  )
}
