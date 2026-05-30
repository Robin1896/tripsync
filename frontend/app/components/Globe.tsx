'use client'
import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'

export interface GlobeMarker {
  lat: number
  lng: number
  label: string
  score: number
}

function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  )
}

function Marker({ lat, lng, score }: { lat: number; lng: number; score: number }) {
  const ref  = useRef<THREE.Mesh>(null)
  const pos  = useMemo(() => latLngToVec3(lat, lng, 2.05), [lat, lng])
  const t    = Math.min(score / 100, 1)
  const color = useMemo(() => new THREE.Color().setHSL(0.04, 0.9, 0.45 + t * 0.15), [t])
  const size  = 0.05 + t * 0.06

  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2 + lat) * 0.18)
  })

  return (
    <mesh ref={ref} position={pos}>
      <sphereGeometry args={[size, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

function GlobeScene({ markers }: { markers: GlobeMarker[] }) {
  const groupRef = useRef<THREE.Group>(null)

  const dayTexture = useLoader(
    THREE.TextureLoader,
    'https://unpkg.com/three-globe/example/img/earth-day.jpg',
  )

  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.15
  })

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(2, 64, 64), [])

  return (
    <>
      <ambientLight intensity={1.6} />
      <directionalLight position={[5, 3, 5]}   intensity={1.0} color="#fffdf9" />
      <directionalLight position={[-4, -2, -2]} intensity={0.3} color="#c8d8f0" />

      <group ref={groupRef}>
        <mesh geometry={sphereGeo}>
          <meshStandardMaterial map={dayTexture} roughness={0.8} metalness={0} />
        </mesh>

        {markers.map((m, i) => (
          <Marker key={i} lat={m.lat} lng={m.lng} score={m.score} />
        ))}
      </group>
    </>
  )
}

export function Globe({ markers = [] }: { markers?: GlobeMarker[] }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 42 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
    >
      <Suspense fallback={null}>
        <GlobeScene markers={markers} />
      </Suspense>
    </Canvas>
  )
}
