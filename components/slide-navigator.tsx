"use client"

import type React from "react"

import { useState } from "react"
import type { Slide } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, ChevronUp, ChevronDown, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SlideNavigatorProps {
  slides: Slide[]
  currentSlideIndex: number
  setCurrentSlideIndex: (index: number) => void
  addSlide: () => void
  deleteSlide: () => void
  reorderSlides: (fromIndex: number, toIndex: number) => void
}

export default function SlideNavigator({
  slides,
  currentSlideIndex,
  setCurrentSlideIndex,
  addSlide,
  deleteSlide,
  reorderSlides,
}: SlideNavigatorProps) {
  const [expanded, setExpanded] = useState(true)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const draggedOverItem = document.querySelector(`[data-index="${index}"]`)
    if (!draggedOverItem) return

    draggedOverItem.classList.add("bg-gray-100")
  }

  const handleDragLeave = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null) return

    const draggedOverItem = document.querySelector(`[data-index="${index}"]`)
    if (!draggedOverItem) return

    draggedOverItem.classList.remove("bg-gray-100")
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const draggedOverItem = document.querySelector(`[data-index="${index}"]`)
    if (!draggedOverItem) return

    draggedOverItem.classList.remove("bg-gray-100")

    reorderSlides(draggedIndex, index)
    setDraggedIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const moveSlideUp = (index: number) => {
    if (index > 0) {
      reorderSlides(index, index - 1)
    }
  }

  const moveSlideDown = (index: number) => {
    if (index < slides.length - 1) {
      reorderSlides(index, index + 1)
    }
  }

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
        expanded ? "w-64" : "w-20",
      )}
    >
      <div className="p-2 flex justify-between items-center border-b border-gray-200">
        <h2 className={cn("font-medium text-black", expanded ? "block" : "hidden")}>Slides</h2>
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpanded(!expanded)}
                  className="h-8 w-8 text-white hover:bg-black"
                >
                  {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{expanded ? "Collapse" : "Expand"} Sidebar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={addSlide} className="h-8 w-8 text-white hover:bg-black">
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add Slide</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={deleteSlide}
                  disabled={slides.length <= 1}
                  className="h-8 w-8 text-white hover:bg-black"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Slide</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            data-index={index}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={(e) => handleDragLeave(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => setCurrentSlideIndex(index)}
            className={cn(
              "border rounded-md cursor-pointer transition-all relative group",
              currentSlideIndex === index ? "border-gray-400 bg-gray-100" : "border-gray-200",
              expanded ? "h-24" : "h-16",
            )}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-[80%] h-[60%] flex items-center justify-center text-xs text-gray-500"
                style={{ backgroundColor: slide.background || "#ffffff" }}
              >
                {index + 1}
              </div>
            </div>

            {expanded && (
              <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    moveSlideUp(index)
                  }}
                  disabled={index === 0}
                  className="h-6 w-6 bg-white/80 text-white hover:bg-black"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    moveSlideDown(index)
                  }}
                  disabled={index === slides.length - 1}
                  className="h-6 w-6 bg-white/80 text-white hover:bg-black"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div
              className={cn(
                "absolute bottom-1 left-0 right-0 text-center text-xs text-black",
                expanded ? "block" : "hidden",
              )}
            >
              Slide {index + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
