"use client"

import { useState, useEffect, useRef } from "react"
import SlideEditor from "@/components/slide-editor"
import SlideNavigator from "@/components/slide-navigator"
import Toolbar from "@/components/toolbar"
import FileOperations from "@/components/file-operations"
import type { Slide, Presentation } from "@/lib/types"
import { createEmptySlide, clonePresentation, cloneSlide } from "@/lib/utils"
import type * as fabric from "fabric"

export default function Editor() {
  const [presentation, setPresentation] = useState<Presentation>({
    title: "Untitled Presentation",
    slides: [createEmptySlide()],
  })
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null)
  const [history, setHistory] = useState<Array<Presentation>>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showTutorial, setShowTutorial] = useState(true)

  // Initialize history when component mounts
  useEffect(() => {
    if (history.length === 0) {
      setHistory([clonePresentation(presentation)])
      setHistoryIndex(0)
    }
  }, [presentation, history.length])

  // Check for saved presentation in localStorage
  useEffect(() => {
    try {
      const savedPresentation = localStorage.getItem("savedPresentation")
      if (savedPresentation) {
        const parsedPresentation = JSON.parse(savedPresentation)
        setPresentation(parsedPresentation)
        setHistory([parsedPresentation])
        setHistoryIndex(0)
      }
    } catch (error) {
      console.error("Error loading saved presentation:", error)
    }
  }, [])

  // Get current slide
  const currentSlide = presentation.slides[currentSlideIndex]

  // Add a new slide
  const addSlide = () => {
    // Create a deep clone of the presentation to avoid reference issues
    const newPresentation = clonePresentation(presentation)
    newPresentation.slides.push(createEmptySlide())

    updatePresentation(newPresentation)
    setCurrentSlideIndex(newPresentation.slides.length - 1)
  }

  // Delete current slide
  const deleteSlide = () => {
    if (presentation.slides.length <= 1) return

    // Create a deep clone of the presentation to avoid reference issues
    const newPresentation = clonePresentation(presentation)
    newPresentation.slides = newPresentation.slides.filter((_, index) => index !== currentSlideIndex)

    updatePresentation(newPresentation)

    if (currentSlideIndex >= newPresentation.slides.length) {
      setCurrentSlideIndex(newPresentation.slides.length - 1)
    }
  }

  // Reorder slides
  const reorderSlides = (fromIndex: number, toIndex: number) => {
    // Create a deep clone of the presentation to avoid reference issues
    const newPresentation = clonePresentation(presentation)
    const [movedSlide] = newPresentation.slides.splice(fromIndex, 1)
    newPresentation.slides.splice(toIndex, 0, movedSlide)

    updatePresentation(newPresentation)

    if (currentSlideIndex === fromIndex) {
      setCurrentSlideIndex(toIndex)
    } else if (currentSlideIndex > fromIndex && currentSlideIndex <= toIndex) {
      setCurrentSlideIndex(currentSlideIndex - 1)
    } else if (currentSlideIndex < fromIndex && currentSlideIndex >= toIndex) {
      setCurrentSlideIndex(currentSlideIndex + 1)
    }
  }

  // Update presentation and add to history
  const updatePresentation = (newPresentation: Presentation) => {
    setPresentation(newPresentation)

    // Add to history, removing any future states if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(clonePresentation(newPresentation))

    // Limit history size to prevent memory issues
    if (newHistory.length > 50) {
      newHistory.shift()
    }

    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  // Undo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setPresentation(clonePresentation(history[historyIndex - 1]))
    }
  }

  // Redo
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setPresentation(clonePresentation(history[historyIndex + 1]))
    }
  }

  // Create new presentation
  const createNewPresentation = () => {
    const newPresentation = {
      title: "Untitled Presentation",
      slides: [createEmptySlide()],
    }
    setPresentation(newPresentation)
    setCurrentSlideIndex(0)
    setHistory([clonePresentation(newPresentation)])
    setHistoryIndex(0)
  }

  // Update current slide
  const updateCurrentSlide = (updatedSlide: Slide) => {
    // Create a deep clone of the presentation to avoid reference issues
    const newPresentation = clonePresentation(presentation)
    newPresentation.slides[currentSlideIndex] = cloneSlide(updatedSlide)
    updatePresentation(newPresentation)
  }

  // Set presentation (used by file operations)
  const setFullPresentation = (newPresentation: Presentation) => {
    setPresentation(clonePresentation(newPresentation))
    setCurrentSlideIndex(0)
    setHistory([clonePresentation(newPresentation)])
    setHistoryIndex(0)
  }

  // Close tutorial
  const closeTutorial = () => {
    setShowTutorial(false)
  }

  return (
    <div className="flex flex-col h-screen">
      <FileOperations
        presentation={presentation}
        createNewPresentation={createNewPresentation}
        setPresentation={setFullPresentation}
        undo={undo}
        redo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        fabricCanvas={fabricCanvas}
      />

      <div className="flex flex-1 overflow-hidden">
        <SlideNavigator
          slides={presentation.slides}
          currentSlideIndex={currentSlideIndex}
          setCurrentSlideIndex={setCurrentSlideIndex}
          addSlide={addSlide}
          deleteSlide={deleteSlide}
          reorderSlides={reorderSlides}
        />

        <div className="flex flex-col flex-1">
          <Toolbar canvas={fabricCanvas} currentSlide={currentSlide} updateCurrentSlide={updateCurrentSlide} />

          <div className="flex-1 overflow-auto bg-white flex items-center justify-center p-4">
            <SlideEditor
              slide={currentSlide}
              updateSlide={updateCurrentSlide}
              setFabricCanvas={setFabricCanvas}
              canvasRef={canvasRef}
              currentSlideIndex={currentSlideIndex}
            />
          </div>
        </div>
      </div>

      {showTutorial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeTutorial}>
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-black">Welcome to PowerPoint Editor</h2>
            <div className="space-y-4 text-black">
              <div>
                <h3 className="font-semibold">Getting Started</h3>
                <p>This is a web-based PowerPoint editor. Here's how to use it:</p>
              </div>
              <div className="space-y-2">
                <p>
                  <strong>1.</strong> Use the slide thumbnails on the left to navigate between slides.
                </p>
                <p>
                  <strong>2.</strong> Add text, shapes, and images using the Insert tab in the toolbar.
                </p>
                <p>
                  <strong>3.</strong> Format selected objects using the Format tab in the toolbar.
                </p>
                <p>
                  <strong>4.</strong> Change slide background using the Slide tab.
                </p>
                <p>
                  <strong>5.</strong> Add new slides with the + button in the sidebar.
                </p>
                <p>
                  <strong>6.</strong> Export your presentation as PPTX or PDF using the buttons in the top toolbar.
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button className="px-4 py-2 bg-gray-800 text-white rounded" onClick={closeTutorial}>
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
