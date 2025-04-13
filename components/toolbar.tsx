"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
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
  PencilIcon,
  EraserIcon,
  Paintbrush,
  Droplets,
  Minus,
  Plus,
  Check,
  Star,
  Heart,
  Hexagon,
  Pentagon,
  Octagon,
  ArrowRight,
  ArrowLeftRight,
  Cross,
  Zap
} from "lucide-react"
import { usePresentation } from "@/lib/presentation-context"
import { shapeDefinitions, shapeTypes } from "@/lib/shapes/shape-definitions"

const colorPresets = [
  "#ffffff", "#f8f9fa", "#e9ecef", "#dee2e6", "#ced4da",
  "#f8d7da", "#d1e7dd", "#cff4fc", "#fff3cd", "#d3d3d3",
  "#000000", "#495057", "#343a40", "#212529",
  "#dc3545", "#fd7e14", "#ffc107", "#28a745", "#007bff", "#6f42c1"
]

const brushSizes = [
  { value: 1, label: "1px" },
  { value: 3, label: "3px" },
  { value: 5, label: "5px" },
  { value: 8, label: "8px" },
  { value: 10, label: "10px" },
  { value: 15, label: "15px" }
]

export default function Toolbar() {
  const { fabricCanvas, currentSlide, updateCurrentSlide, duplicateSelected, changeObjectPosition, alignText } = usePresentation()
  const [activeTab, setActiveTab] = useState("insert")
  const [bgColor, setBgColor] = useState(currentSlide?.background || "#ffffff")
  const [isUploading, setIsUploading] = useState(false)
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null)
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [isErasing, setIsErasing] = useState(false)
  const [drawingColor, setDrawingColor] = useState("#000000")
  const [brushWidth, setBrushWidth] = useState(5)
  const [drawingOpacity, setDrawingOpacity] = useState(100)
  const [drawingTab, setDrawingTab] = useState("colors")
  const [objectColor, setObjectColor] = useState("#000000")

  useEffect(() => {
    if (currentSlide) {
      setBgColor(currentSlide.background || "#ffffff")
    }
  }, [currentSlide])

  useEffect(() => {
    if (!fabricCanvas) return

    const handleSelection = () => {
      const activeObj = fabricCanvas.getActiveObject()
      setSelectedObject(activeObj)
      // Update color picker based on selected object
      if (activeObj) {
        if (activeObj instanceof fabric.IText) {
          setObjectColor(activeObj.fill?.toString() || "#000000")
        } else {
          setObjectColor(activeObj.fill?.toString() || "#000000")
        }
      }
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

  // Initialize the drawing brush
  useEffect(() => {
    if (!fabricCanvas) return
    
    // Initialize the free drawing brush if it doesn't exist
    if (!fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas)
    }
    
    // Apply settings when brush exists
    fabricCanvas.freeDrawingBrush.color = drawingColor
    fabricCanvas.freeDrawingBrush.width = brushWidth
    fabricCanvas.freeDrawingBrush.opacity = drawingOpacity / 100
    
  }, [fabricCanvas, drawingColor, brushWidth, drawingOpacity, isDrawingMode])

  // Drawing functions
  const handleToggleDrawingMode = () => {
    if (!fabricCanvas) return
    const newMode = !isDrawingMode
    setIsDrawingMode(newMode)

    if (newMode && isErasing) {
      setIsErasing(false)
    }

    fabricCanvas.isDrawingMode = newMode
    
    // Ensure brush is initialized when entering drawing mode
    if (newMode && !fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas)
    }
    
    if (newMode && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = isErasing ? "#ffffff" : drawingColor
      fabricCanvas.freeDrawingBrush.width = isErasing ? brushWidth * 2 : brushWidth
      fabricCanvas.freeDrawingBrush.opacity = drawingOpacity / 100
    }
  }

  const handleDrawingColorChange = (color: string) => {
    setDrawingColor(color)
    if (fabricCanvas && fabricCanvas.freeDrawingBrush && isDrawingMode && !isErasing) {
      fabricCanvas.freeDrawingBrush.color = color
    }
  }

  const handleBrushWidthChange = (width: number) => {
    setBrushWidth(width)
    if (fabricCanvas && fabricCanvas.freeDrawingBrush && isDrawingMode) {
      fabricCanvas.freeDrawingBrush.width = isErasing ? width * 2 : width
    }
  }

  const handleDrawingOpacityChange = (value: number) => {
    const opacity = Number(value)
    setDrawingOpacity(opacity)
    if (fabricCanvas && fabricCanvas.freeDrawingBrush && isDrawingMode) {
      fabricCanvas.freeDrawingBrush.opacity = opacity / 100
    }
  }

  const handleToggleErasing = () => {
    if (!fabricCanvas || !isDrawingMode || !fabricCanvas.freeDrawingBrush) return
    const newErasing = !isErasing
    setIsErasing(newErasing)

    if (newErasing) {
      fabricCanvas.freeDrawingBrush.color = "#ffffff"
      fabricCanvas.freeDrawingBrush.width = brushWidth * 2
    } else {
      fabricCanvas.freeDrawingBrush.color = drawingColor
      fabricCanvas.freeDrawingBrush.width = brushWidth
    }
  }

  // Insert functions
  const addText = () => {
    if (!fabricCanvas) return

    const text = new fabric.IText("Double click to edit", {
      left: 100,
      top: 100,
      fontFamily: "Arial",
      fontSize: 24,
      fill: objectColor,
    })

    fabricCanvas.add(text)
    fabricCanvas.setActiveObject(text)
    fabricCanvas.renderAll()
  }

  const addShape = (type: string) => {
    if (!fabricCanvas) return

    const shape = createShape(fabric, type, shapeDefinitions, {
      left: 100,
      top: 100,
      fill: objectColor
    })

    if (shape) {
      fabricCanvas.add(shape)
      fabricCanvas.setActiveObject(shape)
      fabricCanvas.renderAll()
    }
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

  // Format functions
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

  const changeObjectColor = (color: string) => {
    if (!fabricCanvas || !selectedObject) return
    
    setObjectColor(color)
    
    if (selectedObject instanceof fabric.IText) {
      selectedObject.set('fill', color)
    } else {
      selectedObject.set('fill', color)
    }
    
    fabricCanvas.renderAll()
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

  // Shape creation helper
  const createShape = (fabric: any, type: string, definitions: any, customProps: any = {}) => {
    const definition = definitions[type]
    if (!definition) return null
  
    const props = { ...definition.defaultProps, ...customProps }
  
    switch (definition.type) {
      case "rect":
        return new fabric.Rect(props)
      case "circle":
        return new fabric.Circle(props)
      case "triangle":
        return new fabric.Triangle(props)
      case "ellipse":
        return new fabric.Ellipse(props)
      case "line":
        return new fabric.Line([props.x1, props.y1, props.x2, props.y2], {
          stroke: props.stroke,
          strokeWidth: props.strokeWidth,
          ...customProps,
        })
      case "polygon":
        const left = props.left || 100
        const top = props.top || 100
        let points = []
  
        if (type === "star") {
          const outerRadius = 50
          const innerRadius = 25
          const center = { x: left, y: top }
          const numPoints = 5
  
          for (let i = 0; i < numPoints * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius
            const angle = (i * Math.PI) / numPoints
            points.push({
              x: center.x + radius * Math.cos(angle),
              y: center.y + radius * Math.sin(angle),
            })
          }
        } else if (type === "pentagon" || type === "hexagon" || type === "octagon") {
          const radius = 50
          const center = { x: left, y: top }
          const sides = type === "pentagon" ? 5 : type === "hexagon" ? 6 : 8
          const startAngle = type === "pentagon" ? -Math.PI / 2 : 0
  
          for (let i = 0; i < sides; i++) {
            const angle = startAngle + (i * 2 * Math.PI) / sides
            points.push({
              x: center.x + radius * Math.cos(angle),
              y: center.y + radius * Math.sin(angle),
            })
          }
        } else if (props.points && props.points.length > 0) {
          points = props.points
        }
  
        return new fabric.Polygon(points, {
          fill: props.fill,
          ...customProps,
        })
      case "path":
        return new fabric.Path(props.path, props)
      default:
        return null
    }
  }

  const ColorPalette = ({ color, onChange }: { color: string, onChange: (color: string) => void }) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label>Color Palette</Label>
        <div
          className="w-6 h-6 rounded-full border shadow-sm"
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="grid grid-cols-5 gap-2">
        {colorPresets.map((presetColor) => (
          <button
            key={presetColor}
            className={`w-10 h-10 rounded-full border transition-transform hover:scale-110 ${
              presetColor === color ? "ring-1 ring-offset-2 ring-primary" : ""
            }`}
            onClick={() => onChange(presetColor)}
            style={{ backgroundColor: presetColor }}
          />
        ))}
      </div>
      <div className="flex mt-5 space-x-2">
        <Input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 p-1 cursor-pointer"
        />
        <Input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
      </div>
    </div>
  )

  return (
    <div className="bg-white border-b border-gray-200 p-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="text-white">
        <TabsList className="mb-2 bg-white border border-gray-200">
          <TabsTrigger value="insert" className="text-black">
            Insert
          </TabsTrigger>
          <TabsTrigger value="draw" className="text-black">
            Draw
          </TabsTrigger>
          <TabsTrigger value="format" className="text-black" disabled={!selectedObject}>
            Format
          </TabsTrigger>
          <TabsTrigger value="slide" className="text-black">
            Slide
          </TabsTrigger>
        </TabsList>

        {/* Insert Tab */}
        <TabsContent value="insert" className="flex flex-wrap gap-2">
          {/* Text */}
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

          {/* Basic Shapes */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => addShape("rectangle")} className="h-10 w-10">
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

          {/* Advanced Shapes */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Zap className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="icon" onClick={() => addShape("ellipse")} className="h-10 w-10">
                  <Circle className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => addShape("star")} className="h-10 w-10">
                  <Star className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => addShape("heart")} className="h-10 w-10">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => addShape("pentagon")} className="h-10 w-10">
                  <Pentagon className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => addShape("hexagon")} className="h-10 w-10">
                  <Hexagon className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => addShape("octagon")} className="h-10 w-10">
                  <Octagon className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => addShape("arrow")} className="h-10 w-10">
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => addShape("doubleArrow")} className="h-10 w-10">
                  <ArrowLeftRight className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => addShape("cross")} className="h-10 w-10">
                  <Cross className="h-5 w-5" />
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Image */}
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

          {/* Color Picker for Objects */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Palette className="h-5 w-5" />
                <div 
                  className="absolute w-3 h-3 bottom-1 right-1 rounded-full border border-white" 
                  style={{ backgroundColor: objectColor }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <ColorPalette color={objectColor} onChange={changeObjectColor} />
            </PopoverContent>
          </Popover>
        </TabsContent>

        {/* Draw Tab */}
        <TabsContent value="draw" className="space-y-4">
          <Button
            variant={isDrawingMode ? "default" : "outline"}
            className="w-full"
            onClick={handleToggleDrawingMode}
          >
            <PencilIcon className="mr-2 h-5 w-5" />
            {isDrawingMode ? "Exit Drawing Mode" : "Enter Drawing Mode"}
          </Button>

          {isDrawingMode && (
            <>
              <Tabs value={drawingTab} onValueChange={setDrawingTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="colors">
                    <Palette className="mr-2 h-4 w-4" />
                    Colors
                  </TabsTrigger>
                  <TabsTrigger value="brush">
                    <Paintbrush className="mr-2 h-4 w-4" />
                    Brush
                  </TabsTrigger>
                  <TabsTrigger value="tools">
                    <EraserIcon className="mr-2 h-4 w-4" />
                    Tools
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="colors">
                  <ColorPalette color={drawingColor} onChange={handleDrawingColorChange} />
                </TabsContent>
                <TabsContent value="brush" className="space-y-4">
                  <div className="space-y-3">
                    <Label className="block text-sm font-semibold">Brush Size</Label>
                    <div className="flex items-center space-x-3">
                      <Minus className="h-4 w-4 text-gray-500" />
                      <Slider
                        value={[brushWidth]}
                        min={1}
                        max={30}
                        step={1}
                        onValueChange={(value) => handleBrushWidthChange(value[0])}
                        className="flex-1"
                      />
                      <Plus className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {brushSizes.map((size) => (
                        <Button
                          key={size.value}
                          variant={size.value === brushWidth ? "default" : "outline"}
                          className="px-2 py-1 h-auto"
                          onClick={() => handleBrushWidthChange(size.value)}
                        >
                          {size.label}
                        </Button>
                      ))}
                    </div>
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between">
                        <Label className="font-medium">
                          <Droplets className="mr-2 h-4 w-4" />
                          Opacity
                        </Label>
                        <span className="text-sm font-medium">{drawingOpacity}%</span>
                      </div>
                      <Slider
                        value={[drawingOpacity]}
                        min={1}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleDrawingOpacityChange(value[0])}
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="tools">
                  <Button
                    onClick={handleToggleErasing}
                    variant={isErasing ? "destructive" : "outline"}
                    className="w-full"
                  >
                    <EraserIcon className="mr-2 w-5 h-5" />
                    {isErasing ? "Stop Erasing" : "Eraser Mode"}
                  </Button>
                </TabsContent>
              </Tabs>
            </>
          )}
        </TabsContent>

        {/* Format Tab */}
        <TabsContent value="format" className="flex flex-wrap gap-2">
          {/* Color Picker for Selected Object */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 flex items-center gap-2" disabled={!selectedObject}>
                <Palette className="h-5 w-5" />
                <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: objectColor }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <ColorPalette color={objectColor} onChange={changeObjectColor} />
            </PopoverContent>
          </Popover>

          <div className="h-10 border-r border-gray-200 mx-1"></div>
          
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

        {/* Slide Tab */}
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
                        {colorPresets.map((color) => (
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