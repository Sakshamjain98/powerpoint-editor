"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import * as fabric from "fabric"
import type { Slide } from "@/lib/types"
import { useIsMobile } from "@/hooks/use-mobile"

interface SlideEditorProps {
  slide: Slide
  updateSlide: (slide: Slide) => void
  setFabricCanvas: (canvas: fabric.Canvas) => void
  canvasRef: React.RefObject<HTMLCanvasElement>
  currentSlideIndex: number
}

export default function SlideEditor({
  slide,
  updateSlide,
  setFabricCanvas,
  canvasRef,
  currentSlideIndex,
}: SlideEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)
  const [isCanvasReady, setIsCanvasReady] = useState(false)
  const prevSlideIdRef = useRef<string | null>(null)

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return

    // Dispose of any existing canvas to prevent memory leaks
    if (canvas) {
      try {
        canvas.dispose()
      } catch (error) {
        console.error("Error disposing canvas:", error)
      }
    }

    const initCanvas = () => {
      try {
        const newCanvas = new fabric.Canvas(canvasRef.current, {
          width: 960,
          height: 540,
          backgroundColor: "#ffffff",
          preserveObjectStacking: true,
        })

        setCanvas(newCanvas)
        setFabricCanvas(newCanvas)
        setIsCanvasReady(true)
      } catch (error) {
        console.error("Error initializing canvas:", error)
        // Try again after a short delay
        setTimeout(initCanvas, 100)
      }
    }

    // Use requestAnimationFrame to ensure the DOM is ready
    requestAnimationFrame(initCanvas)

    // Cleanup
    return () => {
      if (canvas) {
        try {
          canvas.dispose()
        } catch (error) {
          console.error("Error disposing canvas:", error)
        }
      }
    }
  }, [canvasRef]) // Only re-initialize when canvasRef changes

  // Load slide content when slide changes
  useEffect(() => {
    if (!canvas || !slide || !isCanvasReady) return

    // Only update if the slide has changed
    if (prevSlideIdRef.current === slide.id && prevSlideIdRef.current !== null) {
      return
    }

    prevSlideIdRef.current = slide.id

    try {
      // Clear canvas
      canvas.clear()
      canvas.backgroundColor = slide.background || "#ffffff"

      // Load objects from slide
      if (slide.objects && slide.objects.length > 0) {
        fabric.util.enlivenObjects(
          slide.objects,
          (objects) => {
            objects.forEach((obj) => {
              canvas.add(obj)
            })
            canvas.renderAll()
          },
          "fabric",
        )
      } else {
        canvas.renderAll()
      }
    } catch (error) {
      console.error("Error loading slide content:", error)
    }
  }, [canvas, slide, isCanvasReady, currentSlideIndex])

  // Set up event listeners for canvas changes
  useEffect(() => {
    if (!canvas || !isCanvasReady || !slide) return

    // Save canvas state when objects are modified
    const saveCanvasState = () => {
      try {
        const json = canvas.toJSON(["id", "type"])
        updateSlide({
          ...slide,
          objects: json.objects || [],
          background: json.background as string,
        })
      } catch (error) {
        console.error("Error saving canvas state:", error)
      }
    }

    canvas.on("object:modified", saveCanvasState)
    canvas.on("object:added", saveCanvasState)
    canvas.on("object:removed", saveCanvasState)

    return () => {
      canvas.off("object:modified", saveCanvasState)
      canvas.off("object:added", saveCanvasState)
      canvas.off("object:removed", saveCanvasState)
    }
  }, [canvas, isCanvasReady, slide, updateSlide])

  // Resize canvas on window resize
  useEffect(() => {
    if (!canvas || !containerRef.current || !isCanvasReady) return

    const handleResize = () => {
      if (!containerRef.current) return

      try {
        const containerWidth = containerRef.current.clientWidth
        const containerHeight = containerRef.current.clientHeight

        // Maintain 16:9 aspect ratio
        const slideWidth = 960
        const slideHeight = 540

        let scale = Math.min(containerWidth / slideWidth, containerHeight / slideHeight)

        // Limit scale on mobile
        if (isMobile) {
          scale = Math.min(scale, 0.8)
        }

        canvas.setZoom(scale)
        canvas.setDimensions({
          width: slideWidth * scale,
          height: slideHeight * scale,
        })

        canvas.renderAll()
      } catch (error) {
        console.error("Error resizing canvas:", error)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [canvas, isMobile, isCanvasReady])

  return (
    <div ref={containerRef} className="relative flex items-center justify-center w-full h-full">
      <div className="shadow-lg">
        <canvas ref={canvasRef} id="fabric-canvas" width="960" height="540" />
      </div>
    </div>
  )
}
