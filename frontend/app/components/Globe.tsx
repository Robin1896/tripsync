'use client'
import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { Html } from '@react-three/drei'
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

const VERT = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Illustrated / hand-drawn shader: posterize + warm tint + vignette edge
const FRAG = `
  uniform sampler2D map;
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vec4 tex = texture2D(map, vUv);
    vec3 c = tex.rgb;

    // Posterize to 7 levels → flat illustrated look
    c = floor(c * 7.0) / 7.0;

    // Warm paper tint (desaturate slightly, push warm)
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(c, vec3(lum), 0.18);
    c.r = min(c.r * 1.08, 1.0);
    c.g = min(c.g * 1.02, 1.0);
    c.b = c.b * 0.88;

    // Soft edge vignette so globe "fades" into the page background
    float edge = dot(vNormal, vec3(0.0, 0.0, 1.0));
    edge = clamp(edge, 0.0, 1.0);
    float vignette = smoothstep(0.0, 0.35, edge);

    // Page background colour (#f4efe6 = 0.957, 0.937, 0.902)
    vec3 pageBg = vec3(0.957, 0.937, 0.902);
    c = mix(pageBg, c, vignette);

    gl_FragColor = vec4(c, vignette);
  }
`

function Marker({ lat, lng, score, label, globeMeshRef }: {
  lat: number; lng: number; score: number; label: string
  globeMeshRef: React.RefObject<THREE.Mesh>
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const pos     = useMemo(() => latLngToVec3(lat, lng, 2.05), [lat, lng])
  const t       = Math.min(score / 100, 1)
  const color   = useMemo(() => new THREE.Color().setHSL(0.04, 0.9, 0.40 + t * 0.15), [t])
  const size    = 0.05 + t * 0.055

  useFrame(({ clock }) => {
    if (meshRef.current)
      meshRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.2 + lat) * 0.2)
  })

  return (
    <group position={pos}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Html
        center
        occlude={globeMeshRef.current ? [globeMeshRef] : undefined}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div style={{
          background: 'rgba(255,253,249,0.92)',
          border: '1px solid rgba(26,29,46,0.18)',
          padding: '2px 7px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          fontWeight: 500,
          color: '#1a1d2e',
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
          transform: 'translateY(-18px)',
        }}>
          {label}
        </div>
      </Html>
    </group>
  )
}

function GlobeScene({ markers }: { markers: GlobeMarker[] }) {
  const groupRef    = useRef<THREE.Group>(null!)
  const globeMeshRef = useRef<THREE.Mesh>(null!)

  const dayTexture = useLoader(
    THREE.TextureLoader,
    'https://unpkg.com/three-globe/example/img/earth-day.jpg',
  )

  const uniforms = useMemo(() => ({
    map:  { value: dayTexture },
    time: { value: 0 },
  }), [dayTexture])

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(2, 64, 64), [])

  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.14
    uniforms.time.value += dt
  })

  return (
    <>
      <ambientLight intensity={2.2} />
      <directionalLight position={[5, 3, 5]} intensity={0.6} color="#fffdf9" />

      <group ref={groupRef}>
        <mesh ref={globeMeshRef} geometry={sphereGeo}>
          <shaderMaterial
            vertexShader={VERT}
            fragmentShader={FRAG}
            uniforms={uniforms}
            transparent
          />
        </mesh>

        {markers.map((m, i) => (
          <Marker
            key={i}
            lat={m.lat}
            lng={m.lng}
            score={m.score}
            label={m.label}
            globeMeshRef={globeMeshRef}
          />
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
