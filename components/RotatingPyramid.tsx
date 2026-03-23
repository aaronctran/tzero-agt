'use client'

import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useRef } from 'react'

export default function RotatingPyramid() {
  const theme = useTheme()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Rotation angles for all three axes
    let rotationX = 0
    let rotationY = 0
    let rotationZ = 0

    // 3D rotation functions
    const rotateX = (point: { x: number; y: number; z: number }, angle: number) => {
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const y = point.y * cos - point.z * sin
      const z = point.y * sin + point.z * cos
      return { x: point.x, y, z }
    }

    const rotateY = (point: { x: number; y: number; z: number }, angle: number) => {
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const x = point.x * cos + point.z * sin
      const z = -point.x * sin + point.z * cos
      return { x, y: point.y, z }
    }

    const rotateZ = (point: { x: number; y: number; z: number }, angle: number) => {
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const x = point.x * cos - point.y * sin
      const y = point.x * sin + point.y * cos
      return { x, y, z: point.z }
    }

    const drawTetrahedron = () => {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const size = Math.min(canvas.width, canvas.height) * 0.5

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update rotation on all three axes
      rotationX += 0.003
      rotationY += 0.004
      rotationZ += 0.002

      // Calculate tetrahedron vertices (symmetric, centered at origin)
      // A regular tetrahedron has 4 vertices, all equidistant from center
      const sqrt2 = Math.sqrt(2)
      const sqrt3 = Math.sqrt(3)
      const sqrt6 = Math.sqrt(6)
      
      // Regular tetrahedron vertices (normalized)
      const vertices = [
        { x: size / sqrt3, y: size / sqrt3, z: size / sqrt3 },
        { x: size / sqrt3, y: -size / sqrt3, z: -size / sqrt3 },
        { x: -size / sqrt3, y: size / sqrt3, z: -size / sqrt3 },
        { x: -size / sqrt3, y: -size / sqrt3, z: size / sqrt3 },
      ]

      // Apply rotations in order: X, Y, Z
      let rotatedVertices = vertices.map((v) => {
        let point = { ...v }
        point = rotateX(point, rotationX)
        point = rotateY(point, rotationY)
        point = rotateZ(point, rotationZ)
        return point
      })

      // Translate to center of canvas
      rotatedVertices = rotatedVertices.map((v) => ({
        x: v.x + centerX,
        y: v.y + centerY,
        z: v.z,
      }))

      // Project 3D to 2D with perspective
      const distance = 1000
      const projected = rotatedVertices.map((v) => {
        const scale = distance / (distance + v.z)
        return {
          x: v.x,
          y: v.y * scale + (1 - scale) * centerY,
          z: v.z,
        }
      })

      // Tetrahedron faces (4 triangular faces)
      const faces = [
        { indices: [0, 1, 2] },
        { indices: [0, 1, 3] },
        { indices: [0, 2, 3] },
        { indices: [1, 2, 3] },
      ]

      // Calculate face depths and normals for proper rendering order
      const facesWithDepth = faces.map((face) => {
        const faceVertices = face.indices.map((i) => rotatedVertices[i])
        const avgZ = faceVertices.reduce((sum, v) => sum + v.z, 0) / 3
        
        // Calculate face normal for lighting
        const v1 = {
          x: faceVertices[1].x - faceVertices[0].x,
          y: faceVertices[1].y - faceVertices[0].y,
          z: faceVertices[1].z - faceVertices[0].z,
        }
        const v2 = {
          x: faceVertices[2].x - faceVertices[0].x,
          y: faceVertices[2].y - faceVertices[0].y,
          z: faceVertices[2].z - faceVertices[0].z,
        }
        
        // Cross product for normal
        const normal = {
          x: v1.y * v2.z - v1.z * v2.y,
          y: v1.z * v2.x - v1.x * v2.z,
          z: v1.x * v2.y - v1.y * v2.x,
        }
        
        // Normalize
        const length = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2)
        const normalizedNormal = {
          x: normal.x / length,
          y: normal.y / length,
          z: normal.z / length,
        }
        
        return { ...face, avgZ, normal: normalizedNormal }
      })

      // Sort faces by depth (back to front)
      const sortedFaces = facesWithDepth.sort((a, b) => b.avgZ - a.avgZ)

      // Convert theme color to RGB (bright green #00FF88)
      const color = theme.palette.primary.main
      const r = parseInt(color.slice(1, 3), 16) // 0
      const g = parseInt(color.slice(3, 5), 16) // 255
      const b = parseInt(color.slice(5, 7), 16) // 136

      // Dynamic light direction that changes with rotation (simulates light reflection)
      const lightAngle = rotationY * 2
      const lightDir = { 
        x: Math.cos(lightAngle) * 0.7, 
        y: -0.8, 
        z: Math.sin(lightAngle) * 0.7 - 0.5 
      }
      const lightLength = Math.sqrt(lightDir.x ** 2 + lightDir.y ** 2 + lightDir.z ** 2)
      const normalizedLight = {
        x: lightDir.x / lightLength,
        y: lightDir.y / lightLength,
        z: lightDir.z / lightLength,
      }

      // Calculate center of tetrahedron for glow effect
      const tetraCenter = {
        x: projected.reduce((sum, p) => sum + p.x, 0) / 4,
        y: projected.reduce((sum, p) => sum + p.y, 0) / 4,
      }

      // Draw glow effect behind the tetrahedron
      const glowGradient = ctx.createRadialGradient(
        tetraCenter.x,
        tetraCenter.y,
        0,
        tetraCenter.x,
        tetraCenter.y,
        size * 1.5
      )
      glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.15)`)
      glowGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.08)`)
      glowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
      ctx.fillStyle = glowGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Define all edges with their depth information
      const edges = [
        { indices: [0, 1], vertices: [rotatedVertices[0], rotatedVertices[1]] },
        { indices: [0, 2], vertices: [rotatedVertices[0], rotatedVertices[2]] },
        { indices: [0, 3], vertices: [rotatedVertices[0], rotatedVertices[3]] },
        { indices: [1, 2], vertices: [rotatedVertices[1], rotatedVertices[2]] },
        { indices: [1, 3], vertices: [rotatedVertices[1], rotatedVertices[3]] },
        { indices: [2, 3], vertices: [rotatedVertices[2], rotatedVertices[3]] },
      ]

      // Calculate edge depths and sort (back to front)
      const edgesWithDepth = edges.map((edge) => {
        const avgZ = (edge.vertices[0].z + edge.vertices[1].z) / 2
        return { ...edge, avgZ }
      }).sort((a, b) => b.avgZ - a.avgZ)

      // Draw edges first (back to front) - darker edges behind, brighter in front
      edgesWithDepth.forEach((edge) => {
        const p1 = projected[edge.indices[0]]
        const p2 = projected[edge.indices[1]]
        const edgeZ = edge.avgZ
        
        // Determine if edge is behind (darker) or in front (brighter)
        const isBackEdge = edgeZ < 0
        const depthFactor = Math.max(0.3, Math.min(1, (edgeZ + 400) / 800))
        
        // Darker color for back edges, brighter for front
        const edgeBrightness = isBackEdge ? depthFactor * 0.5 : depthFactor
        const edgeR = Math.round(r * edgeBrightness)
        const edgeG = Math.round(g * edgeBrightness)
        const edgeB = Math.round(b * edgeBrightness)
        
        // Draw edge with appropriate darkness
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        
        // Back edges are darker and thicker to show through translucent material
        if (isBackEdge) {
          ctx.strokeStyle = `rgba(${edgeR}, ${edgeG}, ${edgeB}, 0.6)`
          ctx.lineWidth = 4
        } else {
          ctx.strokeStyle = `rgba(${edgeR}, ${edgeG}, ${edgeB}, 0.9)`
          ctx.lineWidth = 3
        }
        ctx.stroke()
      })

      // Draw faces with translucent gem-like material (so back edges show through)
      sortedFaces.forEach((face) => {
        const projectedPoints = face.indices.map((i) => projected[i])
        const faceVertices = face.indices.map((i) => rotatedVertices[i])
        
        // Calculate lighting based on face normal
        const dotProduct = 
          face.normal.x * normalizedLight.x + 
          face.normal.y * normalizedLight.y + 
          face.normal.z * normalizedLight.z
        
        // Enhanced brightness range for better depth perception
        const baseBrightness = Math.max(0.5, Math.min(1, 0.6 + dotProduct * 0.4))
        
        // Strong specular highlight for gem-like shine
        const specular = Math.max(0, dotProduct) ** 6 // Sharp, bright highlight
        const specularBrightness = baseBrightness + specular * 0.8
        
        // Additional rim light for extra shine
        const rimLight = Math.max(0, -dotProduct) ** 3
        const rimBrightness = rimLight * 0.3
        
        // Calculate face center for gradient
        const center = {
          x: projectedPoints.reduce((sum, p) => sum + p.x, 0) / 3,
          y: projectedPoints.reduce((sum, p) => sum + p.y, 0) / 3,
        }
        
        // Calculate distance from center for gradient
        const maxDist = Math.max(
          ...projectedPoints.map(p => 
            Math.sqrt((p.x - center.x) ** 2 + (p.y - center.y) ** 2)
          )
        )
        
        // Create gradient with bright green and glow
        const gradient = ctx.createRadialGradient(
          center.x,
          center.y,
          0,
          center.x,
          center.y,
          maxDist * 1.2
        )
        
        // Bright green gradient with intense highlights for gem shine
        const highlightR = Math.min(255, Math.round(r * specularBrightness + specular * 150 + rimBrightness * 50))
        const highlightG = Math.min(255, Math.round(g * specularBrightness + specular * 80 + rimBrightness * 30))
        const highlightB = Math.min(255, Math.round(b * specularBrightness + specular * 50 + rimBrightness * 20))
        
        // Add white specular highlight for extra shine
        const whiteSpecular = specular * 0.6
        const finalR = Math.min(255, highlightR + whiteSpecular * 200)
        const finalG = Math.min(255, highlightG + whiteSpecular * 200)
        const finalB = Math.min(255, highlightB + whiteSpecular * 200)
        
        // Translucent gem material - opacity varies based on face orientation
        const faceOpacity = dotProduct > 0 ? 0.8 : 0.7 // More opaque when facing light for better shine
        
        // Create gradient with strong center highlight for gem shine
        gradient.addColorStop(0, `rgba(${finalR}, ${finalG}, ${finalB}, ${faceOpacity})`)
        gradient.addColorStop(0.15, `rgba(${highlightR}, ${highlightG}, ${highlightB}, ${faceOpacity * 0.95})`)
        gradient.addColorStop(0.4, `rgba(${Math.round(r * baseBrightness)}, ${Math.round(g * baseBrightness)}, ${Math.round(b * baseBrightness)}, ${faceOpacity * 0.9})`)
        gradient.addColorStop(0.7, `rgba(${Math.round(r * baseBrightness * 0.9)}, ${Math.round(g * baseBrightness * 0.9)}, ${Math.round(b * baseBrightness * 0.9)}, ${faceOpacity * 0.85})`)
        gradient.addColorStop(1, `rgba(${Math.round(r * baseBrightness * 0.75)}, ${Math.round(g * baseBrightness * 0.75)}, ${Math.round(b * baseBrightness * 0.75)}, ${faceOpacity * 0.75})`)
        
        // Draw filled face with translucency
        ctx.beginPath()
        ctx.moveTo(projectedPoints[0].x, projectedPoints[0].y)
        ctx.lineTo(projectedPoints[1].x, projectedPoints[1].y)
        ctx.lineTo(projectedPoints[2].x, projectedPoints[2].y)
        ctx.closePath()
        
        ctx.fillStyle = gradient
        ctx.fill()
        
        // Add extra specular highlight overlay for gem shine
        if (specular > 0.3) {
          const highlightGradient = ctx.createRadialGradient(
            center.x,
            center.y,
            0,
            center.x,
            center.y,
            maxDist * 0.6
          )
          
          const specularIntensity = specular * 0.4
          highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${specularIntensity})`)
          highlightGradient.addColorStop(0.5, `rgba(255, 255, 255, ${specularIntensity * 0.5})`)
          highlightGradient.addColorStop(1, `rgba(255, 255, 255, 0)`)
          
          ctx.fillStyle = highlightGradient
          ctx.fill()
        }
      })
      
      // Draw faceted pattern on top of faces (similar to logo)
      sortedFaces.forEach((face) => {
        const projectedPoints = face.indices.map((i) => projected[i])
        
        // Calculate face center
        const center = {
          x: projectedPoints.reduce((sum, p) => sum + p.x, 0) / 3,
          y: projectedPoints.reduce((sum, p) => sum + p.y, 0) / 3,
        }
        
        // Calculate midpoints of edges
        const mid01 = {
          x: (projectedPoints[0].x + projectedPoints[1].x) / 2,
          y: (projectedPoints[0].y + projectedPoints[1].y) / 2,
        }
        const mid12 = {
          x: (projectedPoints[1].x + projectedPoints[2].x) / 2,
          y: (projectedPoints[1].y + projectedPoints[2].y) / 2,
        }
        const mid20 = {
          x: (projectedPoints[2].x + projectedPoints[0].x) / 2,
          y: (projectedPoints[2].y + projectedPoints[0].y) / 2,
        }
        
        // Calculate inner center (centroid)
        const innerCenter = {
          x: (projectedPoints[0].x + projectedPoints[1].x + projectedPoints[2].x) / 3,
          y: (projectedPoints[0].y + projectedPoints[1].y + projectedPoints[2].y) / 3,
        }
        
        // Draw faceted pattern lines - darker and more visible
        ctx.strokeStyle = `rgba(0, 0, 0, 0.6)` // Darker, more visible
        ctx.lineWidth = 1.5
        
        // Lines from center to edge midpoints
        ctx.beginPath()
        ctx.moveTo(center.x, center.y)
        ctx.lineTo(mid01.x, mid01.y)
        ctx.stroke()
        
        ctx.beginPath()
        ctx.moveTo(center.x, center.y)
        ctx.lineTo(mid12.x, mid12.y)
        ctx.stroke()
        
        ctx.beginPath()
        ctx.moveTo(center.x, center.y)
        ctx.lineTo(mid20.x, mid20.y)
        ctx.stroke()
        
        // Lines connecting midpoints (inner triangle)
        ctx.beginPath()
        ctx.moveTo(mid01.x, mid01.y)
        ctx.lineTo(mid12.x, mid12.y)
        ctx.lineTo(mid20.x, mid20.y)
        ctx.closePath()
        ctx.stroke()
        
        // Lines from vertices to inner center
        ctx.beginPath()
        ctx.moveTo(projectedPoints[0].x, projectedPoints[0].y)
        ctx.lineTo(innerCenter.x, innerCenter.y)
        ctx.stroke()
        
        ctx.beginPath()
        ctx.moveTo(projectedPoints[1].x, projectedPoints[1].y)
        ctx.lineTo(innerCenter.x, innerCenter.y)
        ctx.stroke()
        
        ctx.beginPath()
        ctx.moveTo(projectedPoints[2].x, projectedPoints[2].y)
        ctx.lineTo(innerCenter.x, innerCenter.y)
        ctx.stroke()
        
        // Additional subdivision lines for more faceted look
        // Lines from midpoints to inner center
        ctx.beginPath()
        ctx.moveTo(mid01.x, mid01.y)
        ctx.lineTo(innerCenter.x, innerCenter.y)
        ctx.stroke()
        
        ctx.beginPath()
        ctx.moveTo(mid12.x, mid12.y)
        ctx.lineTo(innerCenter.x, innerCenter.y)
        ctx.stroke()
        
        ctx.beginPath()
        ctx.moveTo(mid20.x, mid20.y)
        ctx.lineTo(innerCenter.x, innerCenter.y)
        ctx.stroke()
      })

      // Draw front edges on top for clarity with enhanced shine
      edgesWithDepth.forEach((edge) => {
        const p1 = projected[edge.indices[0]]
        const p2 = projected[edge.indices[1]]
        const edgeZ = edge.avgZ
        
        // Only draw front edges on top
        if (edgeZ >= 0) {
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          
          // Bright front edges with glow
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 1)`
          ctx.lineWidth = 3.5
          ctx.stroke()
          
          // Strong inner highlight for gem-like shine
          ctx.strokeStyle = `rgba(255, 255, 255, 0.7)`
          ctx.lineWidth = 1.5
          ctx.stroke()
          
          // Extra bright center highlight
          ctx.strokeStyle = `rgba(255, 255, 255, 0.9)`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      })
    }

    const animate = () => {
      drawTetrahedron()
      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [theme.palette.primary.main])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  )
}
