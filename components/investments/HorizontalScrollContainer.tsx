'use client'

import { ReactNode, useRef } from 'react'
import styles from './HorizontalScrollContainer.module.css'

interface HorizontalScrollContainerProps {
  children: ReactNode
  gap?: number
}

export default function HorizontalScrollContainer({ children, gap = 3 }: HorizontalScrollContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={scrollRef}
      className={styles.container}
      style={{ gap: `${gap * 8}px` }}
    >
      {children}
    </div>
  )
}
