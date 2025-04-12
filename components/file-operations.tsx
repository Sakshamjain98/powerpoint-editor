"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FileUp, FilePlus, Save, Undo2, Redo2, FileText, HelpCircle, Download } from "lucide-react"
import { usePresentation } from "@/lib/presentation-context"
import { exportAsPDF, exportAsPPTX } from "./Export"
import { extractPptxToJson, convertPptxJsonToFabric } from "./pptx-converter"

export default function FileOperations() {
  const {
    presentation,
    currentSlideIndex,
    fabricCanvas,
    undo,
    redo,
    canUndo,
    canRedo,
    setPresentation,
    setCurrentSlideIndex
  } = usePresentation()
  
  const [title, setTitle] = useState(presentation.title)
  const [showHelp, setShowHelp] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    setTitle(presentation.title)
  }, [presentation.title])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    setPresentation({
      ...presentation,
      title: e.target.value
    })
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
  
    const file = e.target.files[0];
    if (!file.name.match(/\.(pptx|ppt)$/i)) {
      alert("Please upload a PPTX or PPT file");
      return;
    }
  
    try {
      setIsUploading(true);
      // Extract the PPTX content to JSON
      const presentationJson = await extractPptxToJson(file);
      console.log("Extracted PPTX JSON:", presentationJson);
      
      // Convert to Fabric.js compatible format
      const fabricPresentation = convertPptxJsonToFabric(presentationJson);
      console.log("Converted Fabric Presentation:", fabricPresentation);
      
      // Update the presentation context
      setPresentation(fabricPresentation);
      setCurrentSlideIndex(0);
      
      alert("Presentation uploaded successfully!");
    } catch (error) {
      console.error("Error uploading PPTX:", error);
      alert("Error uploading PPTX. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset the file input
      e.target.value = "";
    }
  };

  const exportToPPTX = async () => {
    if (isExporting || !fabricCanvas) return
    setIsExporting(true)
    
    try {
      await exportAsPPTX(fabricCanvas, title || "presentation", {
        background: presentation.slides[currentSlideIndex].background
      })
    } catch (error) {
      console.error("Error exporting to PPTX:", error)
      alert("Error exporting to PPTX. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const exportToPDF = async () => {
    if (isExporting || !fabricCanvas) return
    setIsExporting(true)
    
    try {
      exportAsPDF(fabricCanvas, title || "presentation")
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      alert("Error exporting to PDF. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const savePresentation = () => {
    try {
      // Ensure localStorage is only accessed client-side
      if (typeof window !== 'undefined') {
        localStorage.setItem("savedPresentation", JSON.stringify(presentation))
        alert("Presentation saved successfully!")
      }
    } catch (error) {
      console.error("Error saving presentation:", error)
      alert("Error saving presentation. Please try again.")
    }
  }

  const toggleHelp = () => {
    setShowHelp(!showHelp)
  }

  const createNewPresentation = () => {
    setPresentation({
      title: "Untitled Presentation",
      slides: [createEmptySlide()],
    })
    setCurrentSlideIndex(0)
  }

  return (
    <div className="bg-white border-b border-gray-200 p-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={createNewPresentation} className="h-9 text-white bg-black w-9">
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
              <Button variant="ghost" size="icon" asChild className="h-9 text-white bg-black w-9">
                <label>
                  <FileUp className="h-5 w-5" />
                  <input 
                    type="file" 
                    accept=".pptx" 
                    className="sr-only" 
                    onChange={handleUpload}
                    disabled={isUploading} 
                  />
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
                className="h-9 w-9 text-white bg-black"
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
                className="h-9 w-9 text-white bg-black"
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
              <Button variant="ghost" size="icon" onClick={savePresentation} className="h-9 text-white bg-black w-9">
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
              <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} className="h-9 text-white bg-black w-9">
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
              <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} className="h-9 text-white bg-black w-9">
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
              <Button variant="ghost" size="icon" onClick={toggleHelp} className="h-9 w-9 text-white bg-black">
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
              <Button onClick={toggleHelp} className="bg-gray-800 hover:bg-gray-700 text-white">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function createEmptySlide(): import("../lib/types").Slide {
  return {
    id: `slide-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    background: "#FFFFFF", // Default white background
    objects: [], // No objects initially
    fabricState: null // Will be populated when rendered
  };
}