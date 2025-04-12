"use client"

import { useState, useEffect } from "react"
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
  FlipHorizontal,
  FlipVertical,
  MoveDown,
  MoveUp,
} from "lucide-react"
import { usePresentation } from "@/lib/presentation-context"

export default function Toolbar() {
  const { fabricCanvas, currentSlide, updateCurrentSlide, duplicateSelected, changeObjectPosition, alignText } = usePresentation()
  const [activeTab, setActiveTab] = useState("insert")
  const [bgColor, setBgColor] = useState(currentSlide?.background || "#ffffff")
  const [isUploading, setIsUploading] = useState(false)
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null)

  useEffect(() => {
    if (currentSlide) {
      setBgColor(currentSlide.background || "#ffffff")
    }
  }, [currentSlide])

  useEffect(() => {
    if (!fabricCanvas) return

    const handleSelection = () => {
      setSelectedObject(fabricCanvas.getActiveObject())
    }

    fabricCanvas.on('selection:created', handleSelection)
    fabricCanvas.on('selection:updated', handleSelection)
    fabricCanvas.on('selection:cleared', () => setSelectedObject(null))

    return () => {
      fabricCanvas.off('selection:created', handleSelection)
      fabricCanvas.off('selection:updated', handleSelection)
      fabricCanvas.off('selection:cleared', () => setSelectedObject(null))
    }
  }, [fabricCanvas])

  const addText = () => {
    if (!fabricCanvas) return

    const text = new fabric.IText("Double click to edit", {
      left: 100,
      top: 100,
      fontFamily: "Arial",
      fontSize: 24,
      fill: "#000000",
    })

    fabricCanvas.add(text)
    fabricCanvas.setActiveObject(text)
    fabricCanvas.renderAll()
  }

  const addShape = (type: "rect" | "circle" | "triangle") => {
    if (!fabricCanvas) return

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

    fabricCanvas.add(shape)
    fabricCanvas.setActiveObject(shape)
    fabricCanvas.renderAll()
  }

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!fabricCanvas || !e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    
    setIsUploading(true)
  
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'TaskMetaUpSpace')
      
      const response = await fetch('https://api.cloudinary.com/v1_1/dgufdt51q/image/upload', {
        method: 'POST',
        body: formData
      })
  
      if (!response.ok) throw new Error('Upload failed')
  
      const data = await response.json()
      const imageUrl = data.secure_url
  
      const imgObj = new Image()
      imgObj.crossOrigin = "Anonymous"
      imgObj.src = imageUrl
  
      const image = await new Promise<fabric.Image>((resolve, reject) => {
        imgObj.onload = () => {
          const img = new fabric.Image(imgObj, {
            left: 100,
            top: 100,
            padding: 10,
            cornerSize: 10,
            selectable: true,
          })
  
          const maxDimension = 400
          if (img.width! > maxDimension || img.height! > maxDimension) {
            const scale = img.width! > img.height! 
              ? maxDimension / img.width! 
              : maxDimension / img.height!
            img.scaleX = scale
            img.scaleY = scale
          }
  
          fabricCanvas.add(img)
          fabricCanvas.setActiveObject(img)
          fabricCanvas.renderAll()
          resolve(img)
        }
  
        imgObj.onerror = () => {
          reject(new Error(`Failed to load image: ${imageUrl}`))
        }
      })
  
      fabricCanvas.viewportCenterObject(image)
      fabricCanvas.renderAll()
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  const changeBackgroundColor = (color: string) => {
    if (!fabricCanvas) return

    fabricCanvas.backgroundColor = color
    fabricCanvas.renderAll()

    setBgColor(color)
    updateCurrentSlide({
      ...currentSlide,
      background: color,
    })
  }

  const deleteSelected = () => {
    if (!fabricCanvas) return

    const activeObjects = fabricCanvas.getActiveObjects()
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => fabricCanvas.remove(obj))
      fabricCanvas.discardActiveObject()
      fabricCanvas.renderAll()
    }
  }

  const formatText = (format: "bold" | "italic" | "underline") => {
    if (!fabricCanvas) return

    const activeObjects = fabricCanvas.getActiveObjects()
    if (!activeObjects || activeObjects.length === 0) return

    activeObjects.forEach(activeObject => {
      if (activeObject instanceof fabric.IText) {
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
      }
    })

    fabricCanvas.renderAll()
  }

  const rotateObject = () => {
    if (!fabricCanvas) return

    const activeObjects = fabricCanvas.getActiveObjects()
    if (!activeObjects || activeObjects.length === 0) return

    activeObjects.forEach(activeObject => {
      const currentAngle = activeObject.angle || 0
      activeObject.rotate((currentAngle + 45) % 360)
    })

    fabricCanvas.renderAll()
  }

  const flipObject = (direction: "horizontal" | "vertical") => {
    if (!fabricCanvas) return

    const activeObjects = fabricCanvas.getActiveObjects()
    if (!activeObjects || activeObjects.length === 0) return

    activeObjects.forEach(activeObject => {
      if (direction === "horizontal") {
        activeObject.set('flipX', !activeObject.flipX)
      } else {
        activeObject.set('flipY', !activeObject.flipY)
      }
    })

    fabricCanvas.renderAll()
  }

  return (
    <div className="bg-white border-b border-gray-200 p-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="text-white">
        <TabsList className="mb-2 bg-white border border-gray-200">
          <TabsTrigger value="insert" className="text-black ">
            Insert
          </TabsTrigger>
          <TabsTrigger value="format" className="text-black" disabled={!selectedObject}>
            Format
          </TabsTrigger>
          <TabsTrigger value="slide" className="text-black">
            Slide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insert" className="flex flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={addText} className="h-10 w-10">
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
                <Button variant="outline" size="icon" onClick={() => addShape("rect")} className="h-10 w-10">
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
                <Button variant="outline" size="icon" onClick={() => addShape("circle")} className="h-10 w-10">
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
                <Button variant="outline" size="icon" onClick={() => addShape("triangle")} className="h-10 w-10">
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
                <Button variant="outline" size="icon" asChild className="h-10 w-10" disabled={isUploading}>
                  <label>
                    {isUploading ? (
                      <div className="animate-spin">
                        <RotateCw className="h-5 w-5" />
                      </div>
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                    <input type="file" accept="image/*" className="sr-only" onChange={uploadImage} disabled={isUploading} />
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
          {/* Text formatting */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => formatText("bold")}
                  className="h-10 w-10"
                  disabled={!selectedObject || !(selectedObject instanceof fabric.IText)}
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
                  className="h-10 w-10"
                  disabled={!selectedObject || !(selectedObject instanceof fabric.IText)}
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
                  className="h-10 w-10"
                  disabled={!selectedObject || !(selectedObject instanceof fabric.IText)}
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

          {/* Text alignment */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => alignText("left")}
                  className="h-10 w-10"
                  disabled={!selectedObject || !(selectedObject instanceof fabric.IText)}
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
                  className="h-10 w-10"
                  disabled={!selectedObject || !(selectedObject instanceof fabric.IText)}
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
                  className="h-10 w-10"
                  disabled={!selectedObject || !(selectedObject instanceof fabric.IText)}
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

          {/* Object positioning */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeObjectPosition("front")}
                  className="h-10 w-10"
                  disabled={!selectedObject}
                >
                  <MoveUp className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bring to Front</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeObjectPosition("forward")}
                  className="h-10 w-10"
                  disabled={!selectedObject}
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
                  className="h-10 w-10"
                  disabled={!selectedObject}
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
                  onClick={() => changeObjectPosition("back")}
                  className="h-10 w-10"
                  disabled={!selectedObject}
                >
                  <MoveDown className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send to Back</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="h-10 border-r border-gray-200 mx-1"></div>

          {/* Transformations */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={rotateObject}
                  className="h-10 w-10"
                  disabled={!selectedObject}
                >
                  <RotateCw className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rotate 45°</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => flipObject("horizontal")}
                  className="h-10 w-10"
                  disabled={!selectedObject}
                >
                  <FlipHorizontal className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Flip Horizontal</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => flipObject("vertical")}
                  className="h-10 w-10"
                  disabled={!selectedObject}
                >
                  <FlipVertical className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Flip Vertical</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="h-10 border-r border-gray-200 mx-1"></div>

          {/* Object actions */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={duplicateSelected}
                  className="h-10 w-10"
                  disabled={!selectedObject}
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
                  className="h-10 w-10"
                  disabled={!selectedObject}
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
                    <Button variant="outline" size="sm" className="flex gap-2">
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