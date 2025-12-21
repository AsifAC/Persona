import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './BackgroundScene.css'

export default function BackgroundScene() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 0, 9)

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)

    const ambient = new THREE.AmbientLight(0xffffff, 0.35)
    scene.add(ambient)
    const key = new THREE.DirectionalLight(0xffffff, 0.9)
    key.position.set(6, 8, 6)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.4)
    fill.position.set(-6, -4, 5)
    scene.add(fill)

    const dark = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0d0d0d'),
      metalness: 0.65,
      roughness: 0.25,
    })
    const charcoal = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2a2a2a'),
      metalness: 0.8,
      roughness: 0.2,
    })
    const steel = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#3a3a3a'),
      metalness: 0.55,
      roughness: 0.3,
    })

    const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.35, 0.45, 200, 24), charcoal)
    knot.position.set(-2.2, 0.8, 0)
    scene.add(knot)

    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), dark)
    orb.position.set(2.5, -0.4, -1.2)
    scene.add(orb)

    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.14, 24, 180), steel)
    ring.rotation.x = Math.PI / 3
    ring.rotation.y = Math.PI / 4
    ring.position.set(0.2, -1.6, -2)
    scene.add(ring)

    const points = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.PointsMaterial({ color: '#4a4a4a', size: 0.02, transparent: true, opacity: 0.7 })
    )
    const pointCount = 900
    const positions = new Float32Array(pointCount * 3)
    for (let i = 0; i < pointCount; i += 1) {
      const radius = 6 + Math.random() * 5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
    }
    points.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    scene.add(points)

    let frameId
    const animate = () => {
      knot.rotation.x += 0.0028
      knot.rotation.y += 0.0036
      orb.rotation.y -= 0.0022
      ring.rotation.z += 0.0018
      points.rotation.y -= 0.0008
      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(animate)
    }
    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.cancelAnimationFrame(frameId)
      renderer.dispose()
      knot.geometry.dispose()
      orb.geometry.dispose()
      ring.geometry.dispose()
      points.geometry.dispose()
    }
  }, [])

  return (
    <div className="background-scene" aria-hidden="true">
      <canvas ref={canvasRef} />
      <div className="background-overlay" />
    </div>
  )
}
