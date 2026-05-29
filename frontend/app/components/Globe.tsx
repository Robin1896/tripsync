'use client'
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
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
  const ref = useRef<THREE.Mesh>(null)
  const pos = useMemo(() => latLngToVec3(lat, lng, 2.05), [lat, lng])
  const t   = Math.min(score / 100, 1)
  const color = new THREE.Color().setHSL(0.08 - t * 0.08, 0.85, 0.45 + t * 0.2)
  const size  = 0.04 + t * 0.06

  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2 + lat) * 0.15)
  })

  return (
    <mesh ref={ref} position={pos}>
      <sphereGeometry args={[size, 10, 10]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

function GlobeScene({ markers }: { markers: GlobeMarker[] }) {
  const groupRef = useRef<THREE.Group>(null)
  const atmRef   = useRef<THREE.Mesh>(null)

  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.18
    if (atmRef.current)   (atmRef.current.material as THREE.MeshBasicMaterial).opacity = 0.07 + Math.sin(Date.now() * 0.001) * 0.02
  })

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(2, 64, 64), [])
  const atmGeo    = useMemo(() => new THREE.SphereGeometry(2.15, 32, 32), [])

  return (
    <>
      <Stars radius={120} depth={60} count={4000} factor={3} fade />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]}   intensity={1.2} color="#fffdf9" />
      <directionalLight position={[-5, -2, -3]} intensity={0.25} color="#c14a1f" />
      <pointLight position={[0, 0, 6]} intensity={0.15} color="#4a8fb5" />

      <group ref={groupRef}>
        {/* Main sphere */}
        <mesh geometry={sphereGeo}>
          <meshPhongMaterial
            color={new THREE.Color('#14253d')}
            emissive={new THREE.Color('#0a1520')}
            specular={new THREE.Color('#4a8fb5')}
            shininess={60}
          />
        </mesh>

        {/* Grid lines */}
        {[-60, -30, 0, 30, 60].map(lat => {
          const points: THREE.Vector3[] = []
          for (let lng = 0; lng <= 360; lng += 4) points.push(latLngToVec3(lat, lng - 180, 2.01))
          const geo = new THREE.BufferGeometry().setFromPoints(points)
          return (
            <line key={`lat-${lat}`} geometry={geo}>
              <lineBasicMaterial color="#2a4060" transparent opacity={0.4} />
            </line>
          )
        })}
        {[-120, -60, 0, 60, 120].map(lng => {
          const points: THREE.Vector3[] = []
          for (let lat = -90; lat <= 90; lat += 4) points.push(latLngToVec3(lat, lng, 2.01))
          const geo = new THREE.BufferGeometry().setFromPoints(points)
          return (
            <line key={`lng-${lng}`} geometry={geo}>
              <lineBasicMaterial color="#2a4060" transparent opacity={0.4} />
            </line>
          )
        })}

        {markers.map((m, i) => (
          <Marker key={i} lat={m.lat} lng={m.lng} score={m.score} />
        ))}
      </group>

      {/* Atmosphere glow */}
      <mesh ref={atmRef} geometry={atmGeo}>
        <meshBasicMaterial
          color={new THREE.Color('#4a8fb5')}
          transparent
          opacity={0.07}
          side={THREE.BackSide}
        />
      </mesh>
    </>
  )
}

export function Globe({ markers = [] }: { markers?: GlobeMarker[] }) {
  return (
    <Canvas camera={{ position: [0, 0, 5.5], fov: 42 }} dpr={[1, 2]}>
      <GlobeScene markers={markers} />
    </Canvas>
  )
}
