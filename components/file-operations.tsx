"use client"

import type React from "react"

import { useState } from "react"
import type { Presentation, Slide } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FileUp, FilePlus, Save, Undo2, Redo2, FileText, HelpCircle, Download } from "lucide-react"
import * as fabric from "fabric"
import pptxgen from "pptxgenjs"
import { jsPDF } from "jspdf"
import { createEmptySlide, clonePresentation } from "@/lib/utils"

interface FileOperationsProps {
  presentation: Presentation
  createNewPresentation: () => void
  setPresentation: (presentation: Presentation) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  fabricCanvas: fabric.Canvas | null
}

export default function FileOperations({
  presentation,
  createNewPresentation,
  setPresentation,
  undo,
  redo,
  canUndo,
  canRedo,
  fabricCanvas,
}: FileOperationsProps) {
  const [title, setTitle] = useState(presentation.title)
  const [showHelp, setShowHelp] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    // Update presentation title
    const updatedPresentation = clonePresentation(presentation)
    updatedPresentation.title = e.target.value
    setPresentation(updatedPresentation)
  }

  // Upload PPTX
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    
  }

  // Helper function to create a slide with title and content
  const createSlideWithContent = (title: string, content: string, bgColor: string): Slide => {
    const slide = createEmptySlide()
    slide.background = bgColor

    // Create objects array for the slide
    const objects = []

    // Add title object
    objects.push({
      type: "i-text",
      version: "5.3.0",
      originX: "left",
      originY: "top",
      left: 100,
      top: 80,
      width: 760,
      height: 50,
      fill: "#000000",
      stroke: null,
      strokeWidth: 1,
      strokeDashArray: null,
      strokeLineCap: "butt",
      strokeDashOffset: 0,
      strokeLineJoin: "miter",
      strokeUniform: false,
      strokeMiterLimit: 4,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      flipX: false,
      flipY: false,
      opacity: 1,
      shadow: null,
      visible: true,
      backgroundColor: "",
      fillRule: "nonzero",
      paintFirst: "fill",
      globalCompositeOperation: "source-over",
      skewX: 0,
      skewY: 0,
      text: title,
      fontSize: 40,
      fontWeight: "bold",
      fontFamily: "Arial",
      fontStyle: "normal",
      lineHeight: 1.16,
      underline: false,
      overline: false,
      linethrough: false,
      textAlign: "left",
      textBackgroundColor: "",
      charSpacing: 0,
      styles: {},
    })

    // Add content object
    objects.push({
      type: "i-text",
      version: "5.3.0",
      originX: "left",
      originY: "top",
      left: 100,
      top: 180,
      width: 760,
      height: 200,
      fill: "#000000",
      stroke: null,
      strokeWidth: 1,
      strokeDashArray: null,
      strokeLineCap: "butt",
      strokeDashOffset: 0,
      strokeLineJoin: "miter",
      strokeUniform: false,
      strokeMiterLimit: 4,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      flipX: false,
      flipY: false,
      opacity: 1,
      shadow: null,
      visible: true,
      backgroundColor: "",
      fillRule: "nonzero",
      paintFirst: "fill",
      globalCompositeOperation: "source-over",
      skewX: 0,
      skewY: 0,
      text: content,
      fontSize: 24,
      fontWeight: "normal",
      fontFamily: "Arial",
      fontStyle: "normal",
      lineHeight: 1.16,
      underline: false,
      overline: false,
      linethrough: false,
      textAlign: "left",
      textBackgroundColor: "",
      charSpacing: 0,
      styles: {},
    })

    slide.objects = objects
    return slide
  }

  // Export to PPTX
  const exportToPPTX = async () => {
    if (isExporting) return
    setIsExporting(true)

    try {
      const pptx = new pptxgen()

      // Set presentation properties
      pptx.title = title
      pptx.subject = "Created with Web PowerPoint Editor"
      pptx.author = "Web PowerPoint Editor User"

      // Add slides
      for (let i = 0; i < presentation.slides.length; i++) {
        const slide = presentation.slides[i]
        const pptxSlide = pptx.addSlide()

        // Set background
        if (slide.background) {
          pptxSlide.background = { color: slide.background }
        }

        // Convert Fabric.js objects to pptxgenjs objects
        if (slide.objects && slide.objects.length > 0) {
          for (const obj of slide.objects) {
            if (obj.type === "i-text" || obj.type === "text") {
              // Text element
              pptxSlide.addText(obj.text || "", {
                x: (obj.left || 0) / 960,
                y: (obj.top || 0) / 540,
                w: ((obj.width || 300) + 50) / 960, // Add padding to ensure text fits
                h: ((obj.height || 100) + 20) / 540, // Add padding to ensure text fits
                fontSize: (obj.fontSize || 24) / 2, // Convert to points
                bold: obj.fontWeight === "bold",
                italic: obj.fontStyle === "italic",
                underline: obj.underline,
                color: obj.fill || "#000000",
                align: obj.textAlign || "left",
                fontFace: obj.fontFamily || "Arial",
              })
            } else if (obj.type === "rect") {
              // Rectangle
              pptxSlide.addShape("rect", {
                x: (obj.left || 0) / 960,
                y: (obj.top || 0) / 540,
                w: (obj.width || 100) / 960,
                h: (obj.height || 100) / 540,
                fill: { color: obj.fill || "#000000" },
                line: { color: obj.stroke || "transparent", width: (obj.strokeWidth || 0) / 2 },
                rotate: obj.angle || 0,
              })
            } else if (obj.type === "circle") {
              // Circle
              pptxSlide.addShape("ellipse", {
                x: (obj.left || 0) / 960,
                y: (obj.top || 0) / 540,
                w: (obj.width || 100) / 960,
                h: (obj.height || 100) / 540,
                fill: { color: obj.fill || "#000000" },
                line: { color: obj.stroke || "transparent", width: (obj.strokeWidth || 0) / 2 },
                rotate: obj.angle || 0,
              })
            } else if (obj.type === "triangle") {
              // Triangle
              pptxSlide.addShape("triangle", {
                x: (obj.left || 0) / 960,
                y: (obj.top || 0) / 540,
                w: (obj.width || 100) / 960,
                h: (obj.height || 100) / 540,
                fill: { color: obj.fill || "#000000" },
                line: { color: obj.stroke || "transparent", width: (obj.strokeWidth || 0) / 2 },
                rotate: obj.angle || 0,
              })
            } else if (obj.type === "image") {
              // Image
              if (obj.src) {
                // For data URLs
                pptxSlide.addImage({
                  data: obj.src,
                  x: (obj.left || 0) / 960,
                  y: (obj.top || 0) / 540,
                  w: (obj.width || 200) / 960,
                  h: (obj.height || 200) / 540,
                  rotate: obj.angle || 0,
                })
              }
            }
          }
        }
      }

      // Save the file
      await pptx.writeFile({ fileName: `${title}.pptx` })
    } catch (error) {
      console.error("Error exporting to PPTX:", error)
      alert("Error exporting to PPTX. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  // Export to PDF
  const exportToPDF = async () => {
    if (isExporting || !fabricCanvas) return
    setIsExporting(true)

    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: [960, 540],
      })

      // Create a temporary canvas for rendering
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = 960
      tempCanvas.height = 540
      document.body.appendChild(tempCanvas)

      // Process each slide
      for (let i = 0; i < presentation.slides.length; i++) {
        const slide = presentation.slides[i]

        if (i > 0) {
          pdf.addPage()
        }

        // Create a temporary Fabric.js canvas
        const fabricTempCanvas = new fabric.StaticCanvas(tempCanvas)
        fabricTempCanvas.backgroundColor = slide.background || "#ffffff"

        // Add objects to canvas
        if (slide.objects && slide.objects.length > 0) {
          await new Promise<void>((resolve) => {
            fabric.util.enlivenObjects(
              slide.objects,
              (objects) => {
                objects.forEach((obj) => {
                  fabricTempCanvas.add(obj)
                })
                fabricTempCanvas.renderAll()

                // Add the rendered slide to the PDF
                setTimeout(() => {
                  try {
                    const imgData = tempCanvas.toDataURL("image/png")
                    pdf.addImage(imgData, "PNG", 0, 0, 960, 540)
                    fabricTempCanvas.dispose()
                    resolve()
                  } catch (error) {
                    console.error("Error adding slide to PDF:", error)
                    fabricTempCanvas.dispose()
                    resolve()
                  }
                }, 200) // Small delay to ensure canvas is rendered
              },
              "fabric",
            )
          })
        } else {
          // If there are no objects, just add the background
          fabricTempCanvas.renderAll()

          await new Promise<void>((resolve) => {
            setTimeout(() => {
              try {
                const imgData = tempCanvas.toDataURL("image/png")
                pdf.addImage(imgData, "PNG", 0, 0, 960, 540)
              } catch (error) {
                console.error("Error adding slide to PDF:", error)
              }
              fabricTempCanvas.dispose()
              resolve()
            }, 200) // Small delay to ensure canvas is rendered
          })
        }
      }

      // Save the PDF and clean up
      pdf.save(`${title}.pdf`)
      document.body.removeChild(tempCanvas)
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      alert("Error exporting to PDF. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  // Save presentation
  const savePresentation = () => {
    try {
      // In a real app, this would save to a server or local storage
      // For this demo, we'll save to localStorage
      const presentationData = JSON.stringify(presentation)
      localStorage.setItem("savedPresentation", presentationData)
      alert("Presentation saved successfully!")
    } catch (error) {
      console.error("Error saving presentation:", error)
      alert("Error saving presentation. Please try again.")
    }
  }

  // Toggle help
  const toggleHelp = () => {
    setShowHelp(!showHelp)
  }

  return (
    <div className="bg-white border-b border-gray-200 p-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={createNewPresentation} className="h-9 w-9 text-black">
                <FilePlus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>New Presentation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild className="h-9 w-9 text-black">
                <label>
                  <FileUp className="h-5 w-5" />
                  <input type="file" accept=".pptx" className="sr-only" onChange={handleUpload} />
                </label>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload PPTX</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={exportToPPTX}
                disabled={isExporting}
                className="h-9 w-9 text-black"
              >
                <Download className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export to PPTX</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={exportToPDF}
                disabled={isExporting}
                className="h-9 w-9 text-black"
              >
                <FileText className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export to PDF</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={savePresentation} className="h-9 w-9 text-black">
                <Save className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save Presentation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="h-6 border-r border-gray-200 mx-1"></div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} className="h-9 w-9 text-black">
                <Undo2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} className="h-9 w-9 text-black">
                <Redo2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Redo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={title}
          onChange={handleTitleChange}
          className="max-w-xs h-9 border-gray-300 focus:border-gray-400 focus:ring-gray-400"
        />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleHelp} className="h-9 w-9 text-black">
                <HelpCircle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Help</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={toggleHelp}>
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-black">PowerPoint Editor Help</h2>
            <div className="space-y-4 text-black">
              <div>
                <h3 className="font-semibold">Navigation</h3>
                <p>Use the slide thumbnails on the left to navigate between slides. Click on a slide to select it.</p>
              </div>
              <div>
                <h3 className="font-semibold">Adding Content</h3>
                <p>Use the Insert tab to add text, shapes, and images to your slides.</p>
              </div>
              <div>
                <h3 className="font-semibold">Formatting</h3>
                <p>Select an object and use the Format tab to change its appearance.</p>
              </div>
              <div>
                <h3 className="font-semibold">Slide Management</h3>
                <p>Add new slides with the + button in the sidebar. Delete slides with the trash icon.</p>
              </div>
              <div>
                <h3 className="font-semibold">File Operations</h3>
                <p>
                  Create new presentations, upload PPTX files, and export your work using the buttons in the top
                  toolbar.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={toggleHelp} className="bg-gray-800 hover:bg-gray-800 text-white">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
