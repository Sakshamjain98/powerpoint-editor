"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Slide } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import * as fabric from "fabric"
import {
  Type,
  ImageIcon,
  Square,
  Circle,
  Triangle,
  Palette,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Copy,
  ChevronsUpDown,
  RotateCw,
  Layers,
} from "lucide-react"

interface ToolbarProps {
  canvas: fabric.Canvas | null
  currentSlide: Slide
  updateCurrentSlide: (slide: Slide) => void
}

export default function Toolbar({ canvas, currentSlide, updateCurrentSlide }: ToolbarProps) {
  const [activeTab, setActiveTab] = useState("insert")
  const [bgColor, setBgColor] = useState(currentSlide?.background || "#ffffff")

  // Update bgColor when currentSlide changes
  useEffect(() => {
    if (currentSlide) {
      setBgColor(currentSlide.background || "#ffffff")
    }
  }, [currentSlide])

  // Add text
  const addText = () => {
    if (!canvas) return

    try {
      const text = new fabric.IText("Double click to edit", {
        left: 100,
        top: 100,
        fontFamily: "Arial",
        fontSize: 24,
        fill: "#000000",
      })

      canvas.add(text)
      canvas.setActiveObject(text)
      canvas.renderAll()
    } catch (error) {
      console.error("Error adding text:", error)
    }
  }

  // Add shape
  const addShape = (type: "rect" | "circle" | "triangle") => {
    if (!canvas) return

    try {
      let shape: fabric.Object

      switch (type) {
        case "rect":
          shape = new fabric.Rect({
            left: 100,
            top: 100,
            width: 100,
            height: 100,
            fill: "#000000",
          })
          break
        case "circle":
          shape = new fabric.Circle({
            left: 100,
            top: 100,
            radius: 50,
            fill: "#000000",
          })
          break
        case "triangle":
          shape = new fabric.Triangle({
            left: 100,
            top: 100,
            width: 100,
            height: 100,
            fill: "#000000",
          })
          break
        default:
          return
      }

      canvas.add(shape)
      canvas.setActiveObject(shape)
      canvas.renderAll()
    } catch (error) {
      console.error(`Error adding ${type}:`, error)
    }
  }

  // Upload image
  const uploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    
    // Create a FormData object to send the file to Cloudinary
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'TaskMetaUpSpace')
    
    // First create a local URL for preview while uploading
    const localUrl = URL.createObjectURL(file)
    
    // Create a temporary image on canvas immediately
    fabric.Image.fromURL(
      localUrl,
      (fabricImg: fabric.Image) => {
        fabricImg.set({
          left: 100,
          top: 100,
          opacity: 1, // Make it semi-transparent to indicate it's uploading
          name: 'uploading-image' // Mark it as uploading
        })
        canvas.add(fabricImg)
        canvas.setActiveObject(fabricImg)
        canvas.renderAll()
        
        // Now upload to Cloudinary
        fetch('https://api.cloudinary.com/v1_1/dgufdt51q/image/upload', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          const cloudinaryUrl = data.secure_url
          
          // Replace the temporary image with the Cloudinary one
          fabric.Image.fromURL(
            cloudinaryUrl,
            (cloudinaryImg: fabric.Image) => {
              // Remove the temporary image
              const objects = canvas.getObjects()
              const tempImage = objects.find(obj => obj.name === 'uploading-image')
              if (tempImage) {
                canvas.remove(tempImage)
              }
              
              // Calculate dimensions to fit within slide
              const maxWidth = 400
              const maxHeight = 300
              let width = cloudinaryImg.width || 1
              let height = cloudinaryImg.height || 1
              
              if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height)
                width = width * ratio
                height = height * ratio
              }
              
              cloudinaryImg.set({
                left: 100,
                top: 100,
                scaleX: width / (cloudinaryImg.width || 1),
                scaleY: height / (cloudinaryImg.height || 1),
                opacity: 1,
                name: 'cloudinary-image'
              })
              
              canvas.add(cloudinaryImg)
              canvas.setActiveObject(cloudinaryImg)
              canvas.renderAll()
            },
            { crossOrigin: 'anonymous' }
          )
        })
        .catch(error => {
          console.error("Error uploading image to Cloudinary:", error)
          // Keep the local version if upload fails
          const objects = canvas.getObjects()
          const tempImage = objects.find(obj => obj.name === 'uploading-image')
          if (tempImage) {
            tempImage.set({ opacity: 1 })
            canvas.renderAll()
          }
        })
        .finally(() => {
          URL.revokeObjectURL(localUrl)
        })
      },
      { crossOrigin: 'anonymous' }
    )
    
    // Reset the file input
    e.target.value = ""
  }
  // Change background color
  const changeBackgroundColor = (color: string) => {
    if (!canvas) return

    try {
      canvas.backgroundColor = color
      canvas.renderAll()

      setBgColor(color)
      updateCurrentSlide({
        ...currentSlide,
        background: color,
      })
    } catch (error) {
      console.error("Error changing background color:", error)
    }
  }

  // Delete selected object
  const deleteSelected = () => {
    if (!canvas) return

    try {
      const activeObject = canvas.getActiveObject()
      if (activeObject) {
        canvas.remove(activeObject)
        canvas.renderAll()
      }
    } catch (error) {
      console.error("Error deleting object:", error)
    }
  }

  // Duplicate selected object
  const duplicateSelected = () => {
    if (!canvas) return

    try {
      const activeObject = canvas.getActiveObject()
      if (!activeObject) return

      activeObject.clone((cloned: fabric.Object) => {
        cloned.set({
          left: (activeObject.left || 0) + 20,
          top: (activeObject.top || 0) + 20,
        })

        canvas.add(cloned)
        canvas.setActiveObject(cloned)
        canvas.renderAll()
      })
    } catch (error) {
      console.error("Error duplicating object:", error)
    }
  }

  // Text formatting
  const formatText = (format: "bold" | "italic" | "underline") => {
    if (!canvas) return

    try {
      const activeObject = canvas.getActiveObject()
      if (!activeObject || !(activeObject instanceof fabric.IText)) return

      switch (format) {
        case "bold":
          activeObject.set("fontWeight", activeObject.fontWeight === "bold" ? "normal" : "bold")
          break
        case "italic":
          activeObject.set("fontStyle", activeObject.fontStyle === "italic" ? "normal" : "italic")
          break
        case "underline":
          activeObject.set("underline", !activeObject.underline)
          break
      }

      canvas.renderAll()
    } catch (error) {
      console.error(`Error formatting text (${format}):`, error)
    }
  }

  // Text alignment
  const alignText = (alignment: "left" | "center" | "right") => {
    if (!canvas) return

    try {
      const activeObject = canvas.getActiveObject()
      if (!activeObject || !(activeObject instanceof fabric.IText)) return

      activeObject.set("textAlign", alignment)
      canvas.renderAll()
    } catch (error) {
      console.error(`Error aligning text (${alignment}):`, error)
    }
  }

  // Bring forward/backward
  const changeObjectPosition = (direction: "forward" | "backward") => {
    if (!canvas) return

    try {
      const activeObject = canvas.getActiveObject()
      if (!activeObject) return

      if (direction === "forward") {
        canvas.bringForward(activeObject)
      } else {
        canvas.sendBackwards(activeObject)
      }

      canvas.renderAll()
    } catch (error) {
      console.error(`Error changing object position (${direction}):`, error)
    }
  }

  // Rotate object
  const rotateObject = () => {
    if (!canvas) return

    try {
      const activeObject = canvas.getActiveObject()
      if (!activeObject) return

      const currentAngle = activeObject.angle || 0
      activeObject.rotate((currentAngle + 45) % 360)
      canvas.renderAll()
    } catch (error) {
      console.error("Error rotating object:", error)
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 p-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="text-black">
        <TabsList className="mb-2 bg-white border border-gray-200">
          <TabsTrigger
            value="insert"
            className="text-black data-[state=active]:bg-gray-100 data-[state=active]:shadow-none"
          >
            Insert
          </TabsTrigger>
          <TabsTrigger
            value="format"
            className="text-black data-[state=active]:bg-gray-100 data-[state=active]:shadow-none"
          >
            Format
          </TabsTrigger>
          <TabsTrigger
            value="slide"
            className="text-black data-[state=active]:bg-gray-100 data-[state=active]:shadow-none"
          >
            Slide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insert" className="flex flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={addText} className="h-10 w-10 text-black hover:bg-white">
                  <Type className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add Text</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => addShape("rect")}
                  className="h-10 w-10 text-black hover:bg-white"
                >
                  <Square className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add Rectangle</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => addShape("circle")}
                  className="h-10 w-10 text-black hover:bg-white"
                >
                  <Circle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add Circle</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => addShape("triangle")}
                  className="h-10 w-10 text-black hover:bg-white"
                >
                  <Triangle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add Triangle</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" asChild className="h-10 w-10 text-black hover:bg-white">
                  <label>
                    <ImageIcon className="h-5 w-5" />
                    <input type="file" accept="image/*" className="sr-only" onChange={uploadImage} />
                  </label>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add Image</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TabsContent>

        <TabsContent value="format" className="flex flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => formatText("bold")}
                  className="h-10 w-10 text-black hover:bg-white"
                >
                  <Bold className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bold</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => formatText("italic")}
                  className="h-10 w-10 text-black hover:bg-white"
                >
                  <Italic className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Italic</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => formatText("underline")}
                  className="h-10 w-10 text-black hover:bg-white"
                >
                  <Underline className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Underline</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="h-10 border-r border-gray-200 mx-1"></div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => alignText("left")}
                  className="h-10 w-10 text-black hover:bg-white"
                >
                  <AlignLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Align Left</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => alignText("center")}
                  className="h-10 w-10 text-black hover:bg-white"
                >
                  <AlignCenter className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Align Center</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => alignText("right")}
                  className="h-10 w-10 text-black hover:bg-white"
                >
                  <AlignRight className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Align Right</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="h-10 border-r border-gray-200 mx-1"></div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeObjectPosition("forward")}
                  className="h-10 w-10 text-black hover:bg-white"
                >
                  <Layers className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bring Forward</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeObjectPosition("backward")}
                  className="h-10 w-10 text-black hover:bg-white"
                >
                  <ChevronsUpDown className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send Backward</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={rotateObject}
                  className="h-10 w-10 text-black hover:bg-white"
                >
                  <RotateCw className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rotate 45°</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="h-10 border-r border-gray-200 mx-1"></div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={duplicateSelected}
                  className="h-10 w-10 text-black hover:bg-white"
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Duplicate</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={deleteSelected}
                  className="h-10 w-10 text-black hover:bg-white"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TabsContent>

        <TabsContent value="slide" className="flex flex-wrap gap-2 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex gap-2 text-black hover:bg-white">
                      <Palette className="h-4 w-4" />
                      Background
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Background Color</label>
                      <Input
                        type="color"
                        value={bgColor}
                        onChange={(e) => changeBackgroundColor(e.target.value)}
                        className="h-8 w-full"
                      />
                      <div className="grid grid-cols-5 gap-1 mt-2">
                        {[
                          "#ffffff",
                          "#f8f9fa",
                          "#e9ecef",
                          "#dee2e6",
                          "#ced4da",
                          "#f8d7da",
                          "#d1e7dd",
                          "#cff4fc",
                          "#fff3cd",
                          "#d3d3d3",
                        ].map((color) => (
                          <button
                            key={color}
                            className="w-8 h-8 rounded-md border border-gray-200"
                            style={{ backgroundColor: color }}
                            onClick={() => changeBackgroundColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </TooltipTrigger>
              <TooltipContent>
                <p>Change Background</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TabsContent>
      </Tabs>
    </div>
  )
}
