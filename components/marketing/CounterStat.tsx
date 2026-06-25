"use client"

import { useEffect, useRef, useState } from "react"

interface CounterStatProps {
  prefix?: string
  value: number
  suffix?: string
  decimals?: number
  className?: string
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function CounterStat({ prefix = "", value, suffix = "", decimals = 0, className = "" }: CounterStatProps) {
  const [display, setDisplay] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    const duration = 2000
    const startTime = performance.now()
    let raf: number

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      setDisplay(easeOut(progress) * value)
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setDisplay(value)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [started, value])

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.floor(display).toLocaleString()

  return (
    <div ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </div>
  )
}
