import { useMemo, useState, useEffect } from 'react'

export default function Scene3D() {
  const [reducedMotion, setReducedMotion] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  if (reducedMotion) return <div className="grid-floor" />
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 15}s`,
      duration: `${8 + Math.random() * 12}s`,
      size: `${2 + Math.random() * 3}px`,
      color: ['#6c5ce7', '#00cec9', '#fd79a8', '#a29bfe'][Math.floor(Math.random() * 4)],
    })),
    []
  )

  const cubes = useMemo(() => [
    { top: '10%', left: '5%', size: 50, delay: '0s', duration: '12s' },
    { top: '20%', right: '8%', size: 40, delay: '2s', duration: '15s' },
    { top: '60%', left: '3%', size: 35, delay: '4s', duration: '10s' },
    { top: '75%', right: '5%', size: 45, delay: '1s', duration: '14s' },
    { top: '40%', left: '90%', size: 30, delay: '3s', duration: '11s' },
  ], [])

  return (
    <>
      <div className="scene-3d">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 10px ${p.color}40`,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}

        {cubes.map((cube, i) => (
          <div
            key={i}
            className="cube-3d"
            style={{
              top: cube.top,
              left: cube.left,
              right: cube.right,
              width: cube.size,
              height: cube.size,
              animationDelay: cube.delay,
              animationDuration: cube.duration,
            }}
          >
            <div className="face front" style={{ width: cube.size, height: cube.size }} />
            <div className="face back" style={{ width: cube.size, height: cube.size }} />
            <div className="face left" style={{ width: cube.size, height: cube.size }} />
            <div className="face right" style={{ width: cube.size, height: cube.size }} />
            <div className="face top" style={{ width: cube.size, height: cube.size }} />
            <div className="face bottom" style={{ width: cube.size, height: cube.size }} />
          </div>
        ))}
      </div>
      <div className="grid-floor" />
    </>
  )
}
