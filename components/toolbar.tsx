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
  const [isUploading, setIsUploading] = useState(false);

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
  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
  
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'TaskMetaUpSpace');
      
      // Upload to Cloudinary
      const response = await fetch('https://api.cloudinary.com/v1_1/dgufdt51q/image/upload', {
        method: 'POST',
        body: formData
      });
  
      if (!response.ok) {
        throw new Error('Upload failed');
      }
  
      const data = await response.json();
      const imageUrl = data.secure_url;
  
      // Use the addImageToCanvas function
      const image = await addImageToCanvas(canvas, imageUrl);
      
      if (!image) {
        throw new Error('Failed to add image to canvas');
      }
  
      // Center the image after adding
      canvas.viewportCenterObject(image);
      canvas.renderAll();
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };
  
  const addImageToCanvas = async (canvas: fabric.Canvas, imageUrl: string) => {
    if (!canvas) return null;
  
    try {
      const imgObj = new Image();
      imgObj.crossOrigin = "Anonymous";
      imgObj.src = imageUrl;
  
      return new Promise<fabric.Image>((resolve, reject) => {
        imgObj.onload = () => {
          const image = new fabric.Image(imgObj, {
            id: `image-${Date.now()}`,
            top: 100,
            left: 100,
            padding: 10,
            cornerSize: 10, // Fixed typo from 'cornorSize' to 'cornerSize'
            selectable: true,
          });
  
          const maxDimension = 400;
  
          if (image.width! > maxDimension || image.height! > maxDimension) {
            if (image.width! > image.height!) {
              const scale = maxDimension / image.width!;
              image.scaleX = scale;
              image.scaleY = scale;
            } else {
              const scale = maxDimension / image.height!;
              image.scaleX = scale;
              image.scaleY = scale;
            }
          }
  
          canvas.add(image);
          canvas.setActiveObject(image);
          canvas.renderAll();
          resolve(image);
        };
  
        imgObj.onerror = () => {
          reject(new Error(`Failed to load image: ${imageUrl}`));
        };
      });
    } catch (error) {
      console.error("Error adding image:", error);
      return null;
    }
  };
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
        activeObject.bringToFront()
      } else {
        canvas.sendToBack(activeObject)
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
      <Button 
        variant="outline" 
        size="icon" 
        asChild 
        className="h-10 w-10 text-black hover:bg-white"
        disabled={isUploading}
      >
        <label>
          {isUploading ? (
            <div className="animate-spin">
              <RotateCw className="h-5 w-5" />
            </div>
          ) : (
            <ImageIcon className="h-5 w-5" />
          )}
          <input 
            type="file" 
            accept="image/*" 
            className="sr-only" 
            onChange={uploadImage} 
            disabled={isUploading}
          />
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
