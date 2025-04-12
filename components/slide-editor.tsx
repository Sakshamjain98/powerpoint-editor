"use client"

import { useEffect, useRef } from "react"
import * as fabric from "fabric"
import { usePresentation } from "@/lib/presentation-context"
import { useIsMobile } from "@/hooks/use-mobile"

export default function SlideEditor() {
  const { 
    currentSlideIndex, 
    fabricCanvas, 
    setFabricCanvas,
    presentation
  } = usePresentation()
  
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isMobile = useIsMobile()
  const canvasInitialized = useRef(false)

  // Initialize canvas only once
  useEffect(() => {
    if (!canvasRef.current || canvasInitialized.current) return
  
    const initCanvas = () => {
      try {
        // Dispose previous canvas if exists
        if (fabricCanvas) {
          fabricCanvas.dispose()
        }
  
        const newCanvas = new fabric.Canvas(canvasRef.current!, {
          width: 960,
          height: 540,
          backgroundColor: "#ffffff",
          preserveObjectStacking: true,
          stopContextMenu: true // Prevent context menu for better user experience
        })
  
        // Enable selection and other behaviors
        newCanvas.selection = true
        newCanvas.hoverCursor = 'pointer'
        newCanvas.defaultCursor = 'default'
        
        // Add keyboard event handlers
        document.addEventListener('keydown', (e) => {
          // Handle delete key
          if (e.key === 'Delete' && newCanvas.getActiveObjects().length > 0) {
            newCanvas.getActiveObjects().forEach(obj => newCanvas.remove(obj))
            newCanvas.discardActiveObject()
            newCanvas.requestRenderAll()
          }
          
          // Handle Ctrl+Z for undo
          if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            // You can add undo logic here if needed
          }
        })
  
        setFabricCanvas(newCanvas)
        canvasInitialized.current = true
      } catch (error) {
        console.error("Error initializing canvas:", error)
        // Retry with a delay
        setTimeout(initCanvas, 100)
      }
    }
  
    initCanvas()
  
    return () => {
      // Cleanup on component unmount
      if (fabricCanvas) {
        fabricCanvas.dispose()
        setFabricCanvas(null)
        canvasInitialized.current = false
      }
    }
  }, []) // Empty dependency array ensures this runs only once

  // Handle resize with less frequent updates
  useEffect(() => {
    if (!fabricCanvas || !containerRef.current) return

    let resizeTimeout: NodeJS.Timeout | null = null
    
    const handleResize = () => {
      const container = containerRef.current!
      if (!container) return
      
      const slideWidth = 960
      const slideHeight = 540

      const scale = Math.min(
        container.clientWidth / slideWidth,
        container.clientHeight / slideHeight,
        isMobile ? 0.8 : 1
      )

      fabricCanvas.setZoom(scale)
      fabricCanvas.setDimensions({
        width: slideWidth * scale,
        height: slideHeight * scale,
      })
      fabricCanvas.renderAll()
    }

    // Throttle resize for better performance
    const throttledResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        handleResize()
      }, 100)
    }

    // Initial size
    handleResize()
    
    // Add event listener
    window.addEventListener("resize", throttledResize)
    
    return () => {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      window.removeEventListener("resize", throttledResize)
    }
  }, [fabricCanvas, isMobile])

  return (
    <div 
      ref={containerRef} 
      className="relative flex items-center justify-center w-full h-full bg-gray-50"
    >
      <div className="shadow-lg rounded-sm overflow-hidden">
        <canvas ref={canvasRef} id="fabric-canvas" width="960" height="540" />
      </div>
      
      {/* Optional loading indicator */}
      {/* {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      )} */}
    </div>
  )
}