"use client"

import { useState } from "react"
import SlideEditor from "./slide-editor"
import SlideNavigator from "./slide-navigator"
import Toolbar from "./toolbar"
import FileOperations from "./file-operations"
import { PresentationProvider } from "../lib/presentation-context"
import { createEmptySlide } from "../lib/utils"

export default function Editor() {
  const [showTutorial, setShowTutorial] = useState(true)

  const closeTutorial = () => {
    setShowTutorial(false)
  }

  return (
    <PresentationProvider>
      <div className="flex flex-col h-screen">
        <FileOperations />
        
        <div className="flex flex-1 overflow-hidden">
          <SlideNavigator />
          
          <div className="flex flex-col flex-1">
            <Toolbar />
            
            <div className="flex-1 overflow-auto bg-white flex items-center justify-center p-4">
              <SlideEditor />
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
                  <p><strong>1.</strong> Use the slide thumbnails on the left to navigate between slides.</p>
                  <p><strong>2.</strong> Add text, shapes, and images using the Insert tab in the toolbar.</p>
                  <p><strong>3.</strong> Format selected objects using the Format tab in the toolbar.</p>
                  <p><strong>4.</strong> Change slide background using the Slide tab.</p>
                  <p><strong>5.</strong> Add new slides with the + button in the sidebar.</p>
                  <p><strong>6.</strong> Export your presentation as PPTX or PDF using the buttons in the top toolbar.</p>
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
    </PresentationProvider>
  )
}
