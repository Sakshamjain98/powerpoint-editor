"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, ChevronUp, ChevronDown, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { usePresentation } from "@/lib/presentation-context"

export default function SlideNavigator() {
  const {
    presentation,
    currentSlideIndex,
    setCurrentSlideIndex,
    addSlide,
    deleteSlide,
    reorderSlides
  } = usePresentation()
  
  const [expanded, setExpanded] = useState(true)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  // Improved drag and drop handling
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (draggedIndex === null || draggedIndex === index) return
    
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverIndex(null)
  }

  const handleDrop = (e, index) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (draggedIndex === null || draggedIndex === index) return
    
    // Perform the slide reordering
    reorderSlides(draggedIndex, index)
    
    // Reset states
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const moveSlideUp = (index) => {
    if (index > 0) {
      reorderSlides(index, index - 1)
    }
  }

  const moveSlideDown = (index) => {
    if (index < presentation.slides.length - 1) {
      reorderSlides(index, index + 1)
    }
  }

  // Improved thumbnail renderer function that shows actual visual representation
  // Improved thumbnail renderer function for SlideNavigator.tsx
  const renderSlideThumbnail = (slide, index) => {
    const bgColor = slide.background || "#ffffff"
    const objects = slide.objects || []
    
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-full h-full relative flex flex-col justify-center items-center"
          style={{ backgroundColor: bgColor }}
        >
          {/* Render simplified versions of objects */}
          {objects.map((obj, i) => {
            if (i >= 8) return null // Limit objects for performance
            
            const scaleX = 0.8
            const scaleY = 0.6
            
            // Normalize object properties for both Fabric.js and PPTX imported objects
            const type = obj.type?.replace('i-', '') || 'rect' // Normalize Fabric.js types
            const left = obj.left || 0
            const top = obj.top || 0
            const width = obj.width || (type === 'circle' ? (obj.radius || 0) * 2 : 50)
            const height = obj.height || (type === 'circle' ? (obj.radius || 0) * 2 : 50)
            const fill = obj.fill || obj.color || '#000000'
            
            switch (type) {
              case 'text':
              case 'textbox':
                const textContent = obj.text || ""
                const displayText = textContent.length > 10 ? textContent.substring(0, 10) + "..." : textContent
                return (
                  <div 
                    key={obj.id || i}
                    className="absolute bg-blue-200 rounded-sm overflow-hidden flex items-center justify-center p-1"
                    style={{
                      left: `${(left / 960) * 100 * scaleX}%`,
                      top: `${(top / 540) * 100 * scaleY}%`,
                      width: `${(width / 960) * 100 * scaleX}%`,
                      height: `${(height / 540) * 100 * scaleY}%`,
                      color: fill,
                      fontSize: '6px',
                      lineHeight: '1',
                      opacity: 0.9
                    }}
                  >
                    {displayText}
                  </div>
                )
                
              case 'image':
                return (
                  <div 
                    key={obj.id || i}
                    className="absolute bg-gray-200 flex items-center justify-center"
                    style={{
                      left: `${(left / 960) * 100 * scaleX}%`,
                      top: `${(top / 540) * 100 * scaleY}%`,
                      width: `${(width / 960) * 100 * scaleX}%`,
                      height: `${(height / 540) * 100 * scaleY}%`,
                      opacity: 0.8
                    }}
                  >
                    <span className="text-xs">📷</span>
                  </div>
                )
                
              case 'circle':
                return (
                  <div 
                    key={obj.id || i}
                    className="absolute rounded-full"
                    style={{
                      left: `${(left / 960) * 100 * scaleX}%`,
                      top: `${(top / 540) * 100 * scaleY}%`,
                      width: `${(width / 960) * 100 * scaleX}%`,
                      height: `${(height / 540) * 100 * scaleY}%`,
                      backgroundColor: fill,
                      opacity: 0.8
                    }}
                  />
                )
                
              default: // rectangle and other shapes
                return (
                  <div 
                    key={obj.id || i}
                    className="absolute"
                    style={{
                      left: `${(left / 960) * 100 * scaleX}%`,
                      top: `${(top / 540) * 100 * scaleY}%`,
                      width: `${(width / 960) * 100 * scaleX}%`,
                      height: `${(height / 540) * 100 * scaleY}%`,
                      backgroundColor: fill,
                      opacity: 0.8
                    }}
                  />
                )
            }
          })}
          
          {objects.length === 0 && (
            <span className="text-xs font-bold text-gray-400">Slide {index + 1}</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      expanded ? "w-64" : "w-20",
    )}>
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
                  className="h-8 w-8 text-white bg-black"
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
                <Button variant="ghost" size="icon" onClick={addSlide} className="h-8 text-white bg-black w-8">
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
                  disabled={presentation.slides.length <= 1}
                  className="h-8 w-8 text-white bg-black"
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
        {presentation.slides.map((slide, index) => (
          <div
            key={slide.id}
            data-index={index}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => setCurrentSlideIndex(index)}
            className={cn(
              "border rounded-md cursor-pointer transition-all relative group",
              currentSlideIndex === index ? "border-gray-400 bg-gray-100" : "border-gray-200",
              dragOverIndex === index ? "border-gray-800 bg-gray-100" : "",
              expanded ? "h-24" : "h-16",
            )}
          >
            {renderSlideThumbnail(slide, index)}

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
                  className="h-6 w-6 bg-white/80"
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
                  disabled={index === presentation.slides.length - 1}
                  className="h-6 w-6 bg-white/80"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className={cn(
              "absolute bottom-1 left-0 right-0 text-center text-xs",
              expanded ? "block" : "hidden",
            )}>
              Slide {index + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}