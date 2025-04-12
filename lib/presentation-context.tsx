"use client"

import React, { createContext, useContext, useState, useRef, useEffect } from "react"
import { 
  Canvas, 
  Object as FabricObject, 
  ActiveSelection,
  SerializedObjectProps
} from "fabric"
import { createEmptySlide, clonePresentation, cloneSlide } from "@/lib/utils"
import type { Slide, Presentation } from "@/lib/types"

// Enable debug mode by setting this to true
const DEBUG_MODE = true

// Extended FabricObject type with our custom properties
interface CustomFabricObject extends FabricObject {
  id?: string
  bringForward: (intersecting?: boolean) => CustomFabricObject
  sendBackwards: (intersecting?: boolean) => CustomFabricObject
  bringToFront: () => CustomFabricObject
  sendToBack: () => CustomFabricObject
}

interface PresentationContextType {
  presentation: Presentation
  setPresentation: (presentation: Presentation) => void
  currentSlideIndex: number
  setCurrentSlideIndex: (index: number) => void
  fabricCanvas: Canvas | null
  setFabricCanvas: (canvas: Canvas | null) => void
  addSlide: () => void
  deleteSlide: () => void
  reorderSlides: (fromIndex: number, toIndex: number) => void
  updateCurrentSlide: (updatedSlide: Slide) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  duplicateSelected: () => void
  changeObjectPosition: (direction: "forward" | "backward" | "front" | "back") => void
  alignText: (alignment: "left" | "center" | "right") => void
  logState: () => void
}

const PresentationContext = createContext<PresentationContextType | null>(null)

export function PresentationProvider({ children }: { children: React.ReactNode }) {
  const [presentation, setPresentation] = useState<Presentation>({
    title: "Untitled Presentation",
    slides: [createEmptySlide()],
  })
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null)
  const [history, setHistory] = useState<Array<Presentation>>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  // Important flags to control state transitions
  const slideTransitionRef = useRef({
    isChangingSlide: false,
    isSavingState: false,
    pendingSave: false,
    previousSlideIndex: -1
  })

  // Cache slide objects for better performance
  const slideCacheRef = useRef<Map<string, any>>(new Map())

  // Debug logging helper
  const debugLog = (...args: any[]) => {
    if (DEBUG_MODE) {
      console.log('[PresentationContext]', ...args)
    }
  }

  // State inspection utility
  const logState = () => {
    debugLog('=== CURRENT STATE ===')
    debugLog('Presentation:', {
      title: presentation.title,
      slideCount: presentation.slides.length,
      currentSlideIndex,
    })
    debugLog('History:', {
      length: history.length,
      index: historyIndex,
      canUndo: historyIndex > 0,
      canRedo: historyIndex < history.length - 1,
    })
    if (fabricCanvas) {
      debugLog('Canvas Objects:', fabricCanvas.getObjects().map(o => ({
        type: o.type,
        id: (o as CustomFabricObject).id,
        left: o.left,
        top: o.top,
      })))
    }
  }

  // Initialize history
  useEffect(() => {
    if (history.length === 0) {
      const initialHistory = [clonePresentation(presentation)]
      setHistory(initialHistory)
      setHistoryIndex(0)
      debugLog('History initialized', initialHistory)
    }
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (fabricCanvas) {
        fabricCanvas.dispose()
        setFabricCanvas(null)
      }
      slideCacheRef.current.clear()
    }
  }, [fabricCanvas])

  // Save canvas state
  const saveCanvasState = () => {
    const flags = slideTransitionRef.current
    
    if (!fabricCanvas || flags.isChangingSlide || flags.isSavingState) {
      if (!flags.isChangingSlide && !flags.isSavingState) {
        flags.pendingSave = true
      }
      debugLog('Skipping save - canvas busy or state changing')
      return
    }
    
    flags.isSavingState = true
    flags.pendingSave = false
    
    try {
      const objects = fabricCanvas.getObjects().map(obj => {
        const baseObj = obj.toObject(['id', 'type']) as SerializedObjectProps & { id?: string }
        return {
          ...baseObj,
          id: (obj as CustomFabricObject).id || baseObj.id || `obj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        }
      })
  
      const state = {
        version: '6.0.0',
        objects,
        background: typeof fabricCanvas.backgroundColor === "string" ? fabricCanvas.backgroundColor : "#ffffff"
      }
  
      debugLog('Saving canvas state:', {
        objects: objects.length,
        background: state.background
      })
      
      // Cache the state for this slide
      const currentSlide = presentation.slides[currentSlideIndex]
      if (currentSlide) {
        slideCacheRef.current.set(currentSlide.id, { 
          fabricState: state,
          objects
        })
      }
  
      const newPresentation = clonePresentation(presentation)
      newPresentation.slides[currentSlideIndex] = {
        ...newPresentation.slides[currentSlideIndex],
        fabricState: state,
        objects
      }
      
      setPresentation(newPresentation)
      
      // Only update history if not in slide transition
      if (!flags.isChangingSlide) {
        // Implement throttled history update
        const now = Date.now()
        const lastUpdate = slideTransitionRef.current.lastHistoryUpdate || 0
        
        if (now - lastUpdate > 1000) { // Throttle to once per second
          const newHistory = history.slice(0, historyIndex + 1)
          newHistory.push(clonePresentation(newPresentation))
          
          // Limit history size
          if (newHistory.length > 30) {
            newHistory.shift()
            setHistoryIndex(historyIndex)
          } else {
            setHistoryIndex(newHistory.length - 1)
          }
          
          setHistory(newHistory)
          slideTransitionRef.current.lastHistoryUpdate = now
          
          debugLog('History updated', {
            index: newHistory.length - 1,
            length: newHistory.length
          })
        }
      }
    } catch (error) {
      console.error("Error saving canvas state:", error)
      debugLog('Save error:', error)
    } finally {
      flags.isSavingState = false
      if (flags.pendingSave) {
        setTimeout(() => saveCanvasState(), 10)
      }
    }
  }

  // Load canvas state with better error handling and performance
  const loadCanvasState = () => {
    if (!fabricCanvas) {
      debugLog('Cannot load - no canvas')
      return
    }
    
    const flags = slideTransitionRef.current
    flags.isChangingSlide = true
    
    try {
      const currentSlide = presentation.slides[currentSlideIndex]
      if (!currentSlide) {
        console.error("Cannot find current slide!", currentSlideIndex)
        flags.isChangingSlide = false
        return
      }
      
      debugLog(`Loading slide ${currentSlideIndex}`, {
        id: currentSlide.id,
        objects: currentSlide.objects?.length || 0
      })
      
      // Clear the canvas first and set background
      fabricCanvas.clear()
      fabricCanvas.backgroundColor = currentSlide.background || "#ffffff"
      
      // Log cache state for debugging
      debugLog("Cache contains IDs:", Array.from(slideCacheRef.current.keys()))
      
      // Check cache first
      const cachedState = slideCacheRef.current.get(currentSlide.id)
      let loadedFromCache = false
      
      if (cachedState?.fabricState) {
        debugLog(`Loading from cache for slide ID: ${currentSlide.id}`)
        try {
          fabricCanvas.loadFromJSON(
            JSON.parse(JSON.stringify(cachedState.fabricState)), // Deep clone to prevent reference issues
            () => {
              // Force a full render cycle
              fabricCanvas.renderAll()
              loadedFromCache = true
              
              setTimeout(() => {
                flags.isChangingSlide = false
                fabricCanvas.renderAll() // Extra render to ensure visibility
                debugLog('Slide loaded from cache')
              }, 100)
            },
            (err, obj) => {
              if (err) debugLog(`Error loading object: ${err}`)
            }
          )
        } catch (error) {
          console.error("Error loading from cache:", error)
          debugLog('Cache load error:', error)
          loadedFromCache = false
        }
      }
      
      // Fall back to slide state if cache failed
      if (!loadedFromCache && currentSlide.fabricState) {
        debugLog('Loading from slide state')
        try {
          fabricCanvas.loadFromJSON(
            JSON.parse(JSON.stringify(currentSlide.fabricState)), // Deep clone
            () => {
              fabricCanvas.renderAll()
              setTimeout(() => {
                flags.isChangingSlide = false
                fabricCanvas.renderAll() // Extra render
                debugLog('Slide loaded from state')
              }, 100)
            },
            (err, obj) => {
              if (err) debugLog(`Error loading object: ${err}`)
            }
          )
        } catch (error) {
          console.error("Error loading from state:", error)
          debugLog('State load error:', error)
          flags.isChangingSlide = false
        }
      } else if (!loadedFromCache) {
        // No content to load
        fabricCanvas.renderAll()
        setTimeout(() => {
          flags.isChangingSlide = false
          debugLog('Empty slide loaded')
        }, 50)
      }
    } catch (error) {
      console.error("Error loading canvas state:", error)
      debugLog('Load error:', error)
      
      // Recovery - ensure we have a clean state
      fabricCanvas.clear() 
      fabricCanvas.backgroundColor = "#ffffff"
      fabricCanvas.renderAll()
      
      setTimeout(() => {
        flags.isChangingSlide = false
      }, 50)
    }
  }
  
  // Canvas modification listener with debounce
  useEffect(() => {
    if (!fabricCanvas) return
    
    let debounceTimer: NodeJS.Timeout | null = null
    
    const handleModification = () => {
      const flags = slideTransitionRef.current
      if (!flags.isChangingSlide) {
        debugLog('Canvas modified - saving state')
         // Force update cache for current slide
      const currentSlide = presentation.slides[currentSlideIndex];
      if (currentSlide) {
        const objects = fabricCanvas.getObjects().map(obj => {
          const baseObj = obj.toObject(['id', 'type']) as SerializedObjectProps & { id?: string };
          return {
            ...baseObj,
            id: (obj as CustomFabricObject).id || baseObj.id || `obj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          };
        });
        
        const state = {
          version: '6.0.0',
          objects,
          background: typeof fabricCanvas.backgroundColor === "string" ? fabricCanvas.backgroundColor : "#ffffff"
        };
        
        // Force update cache before state save
        slideCacheRef.current.set(currentSlide.id, { fabricState: state, objects });
        debugLog(`Updated cache for current slide ${currentSlideIndex}, ${objects.length} objects`);
      }
      
        saveCanvasState()
      } else {
        debugLog('Canvas modified during slide change - skipping save')
      }
    }
    
    const debouncedModification = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(handleModification, 300)
    }
    
    fabricCanvas.on('object:modified', debouncedModification)
    fabricCanvas.on('object:added', debouncedModification)
    fabricCanvas.on('object:removed', debouncedModification)
    
    // Add direct event listeners for immediate user actions
    fabricCanvas.on('mouse:up', () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(handleModification, 100) 
    })
    
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      fabricCanvas.off('object:modified', debouncedModification)
      fabricCanvas.off('object:added', debouncedModification)
      fabricCanvas.off('object:removed', debouncedModification)
      fabricCanvas.off('mouse:up')
    }
  }, [fabricCanvas, currentSlideIndex])
  
  // Improved slide change handling with state transition management
 // In your effect for slide changes
useEffect(() => {
    const flags = slideTransitionRef.current;
    const prevIndex = flags.previousSlideIndex;
    
    debugLog(`Slide changing from ${prevIndex} to ${currentSlideIndex}`);
    
    // Skip first run
    if (prevIndex === -1) {
      flags.previousSlideIndex = currentSlideIndex;
      return;
    }
    
    // Save the state of the previous slide
    if (fabricCanvas && prevIndex !== -1 && prevIndex !== currentSlideIndex) {
      // Set flag to prevent concurrent operations
      flags.isChangingSlide = true;
      flags.pendingSave = false;
      
      // Explicit logging of state
      debugLog(`Saving state for slide ${prevIndex} before switching`);
      
      // Ensure previous slide state is saved completely
      const objects = fabricCanvas.getObjects().map(obj => {
        const baseObj = obj.toObject(['id', 'type']) as SerializedObjectProps & { id?: string }
        return {
          ...baseObj,
          id: (obj as CustomFabricObject).id || baseObj.id || `obj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        }
      });
      
      const state = {
        version: '6.0.0',
        objects,
        background: typeof fabricCanvas.backgroundColor === "string" ? fabricCanvas.backgroundColor : "#ffffff"
      };
      
      // Force cache update for previous slide
      const prevSlide = presentation.slides[prevIndex];
      if (prevSlide) {
        const cacheData = { fabricState: state, objects };
        slideCacheRef.current.set(prevSlide.id, cacheData);
        debugLog(`Updated cache for slide ${prevIndex}, ${objects.length} objects`);
        
        // Update presentation atomically
        setPresentation(prev => {
          const newPresentation = clonePresentation(prev);
          if (newPresentation.slides[prevIndex]) {
            newPresentation.slides[prevIndex] = {
              ...newPresentation.slides[prevIndex],
              fabricState: state,
              objects,
            };
          }
          return newPresentation;
        });
      }
      
      // Then load the new slide with sufficient delay
      setTimeout(() => {
        debugLog(`Loading slide ${currentSlideIndex} after saving ${prevIndex}`);
        loadCanvasState();
        flags.previousSlideIndex = currentSlideIndex;
      }, 150); // Increased delay for safer transitions
    } else {
      // Just load new slide
      loadCanvasState();
      flags.previousSlideIndex = currentSlideIndex;
    }
  }, [currentSlideIndex]);

  // Update presentation and history
  const updatePresentation = (newPresentation: Presentation) => {
    debugLog('Updating presentation...')
    
    setPresentation(newPresentation)
    
    // Only update history if we're not in the middle of changing slides
    if (!slideTransitionRef.current.isChangingSlide) {
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(clonePresentation(newPresentation))
      
      if (newHistory.length > 30) {
        newHistory.shift()
        setHistoryIndex(Math.max(0, historyIndex))
      } else {
        setHistoryIndex(newHistory.length - 1)
      }
      
      setHistory(newHistory)
      debugLog('History updated', {
        index: newHistory.length - 1,
        length: newHistory.length
      })
    }
  }

  // Update current slide
  const updateCurrentSlide = (updatedSlide: Slide) => {
    debugLog('Updating current slide...')
    const newPresentation = clonePresentation(presentation)
    newPresentation.slides[currentSlideIndex] = cloneSlide(updatedSlide)
    updatePresentation(newPresentation)
  }

  // Slide management
  const addSlide = () => {
    debugLog('Adding new slide...')
    
    // Save current canvas state first
    if (fabricCanvas && !slideTransitionRef.current.isChangingSlide) {
      saveCanvasState()
    }
    
    const newPresentation = clonePresentation(presentation)
    const newSlide = createEmptySlide()
    newPresentation.slides.push(newSlide)
    
    // Update presentation first
    setPresentation(newPresentation)
    
    // Then update history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(clonePresentation(newPresentation))
    
    if (newHistory.length > 30) {
      newHistory.shift()
      setHistoryIndex(Math.max(0, historyIndex))
    } else {
      setHistoryIndex(newHistory.length - 1)
    }
    
    setHistory(newHistory)
    
    // Change to the new slide
    setCurrentSlideIndex(newPresentation.slides.length - 1)
  }

  const deleteSlide = () => {
    if (presentation.slides.length <= 1) {
      debugLog('Cannot delete - only one slide')
      return
    }

    debugLog(`Deleting slide ${currentSlideIndex}`)
    
    const newPresentation = clonePresentation(presentation)
    
    // Remove from slide cache
    const slideId = newPresentation.slides[currentSlideIndex].id
    slideCacheRef.current.delete(slideId)
    
    // Remove from presentation
    newPresentation.slides.splice(currentSlideIndex, 1)
    updatePresentation(newPresentation)
    
    // Adjust current slide index
    setCurrentSlideIndex(Math.min(currentSlideIndex, newPresentation.slides.length - 1))
  }

  const reorderSlides = (fromIndex: number, toIndex: number) => {
    debugLog(`Reordering from ${fromIndex} to ${toIndex}`)
    
    // Save current slide state first
    if (fabricCanvas && !slideTransitionRef.current.isChangingSlide) {
      // Set flag to prevent concurrent operations
      slideTransitionRef.current.isChangingSlide = true
      
      // Explicitly save the current slide state before reordering
      const objects = fabricCanvas.getObjects().map(obj => {
        const baseObj = obj.toObject(['id', 'type']) as SerializedObjectProps & { id?: string }
        return {
          ...baseObj,
          id: (obj as CustomFabricObject).id || baseObj.id || `obj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        }
      })
      
      const state = {
        version: '6.0.0',
        objects,
        background: typeof fabricCanvas.backgroundColor === "string" ? fabricCanvas.backgroundColor : "#ffffff"
      }
      
      // Update cache for current slide
      const currentSlide = presentation.slides[currentSlideIndex]
      if (currentSlide) {
        slideCacheRef.current.set(currentSlide.id, { 
          fabricState: state,
          objects
        })
        debugLog(`Updated cache for slide ${currentSlideIndex} before reordering`)
      }
      
      // Create a new presentation with updated slide
      const tempPresentation = clonePresentation(presentation)
      if (tempPresentation.slides[currentSlideIndex]) {
        tempPresentation.slides[currentSlideIndex] = {
          ...tempPresentation.slides[currentSlideIndex],
          fabricState: state,
          objects,
        }
      }
      
      // Now perform the reordering
      const [movedSlide] = tempPresentation.slides.splice(fromIndex, 1)
      tempPresentation.slides.splice(toIndex, 0, movedSlide)
      
      // Update presentation state
      setPresentation(tempPresentation)
      
      // Update history
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(clonePresentation(tempPresentation))
      
      if (newHistory.length > 30) {
        newHistory.shift()
        setHistoryIndex(Math.max(0, historyIndex))
      } else {
        setHistoryIndex(newHistory.length - 1)
      }
      
      setHistory(newHistory)
      
      // Update current slide index if needed
      let newIndex = currentSlideIndex
      if (currentSlideIndex === fromIndex) {
        newIndex = toIndex
      } else if (currentSlideIndex > fromIndex && currentSlideIndex <= toIndex) {
        newIndex = currentSlideIndex - 1
      } else if (currentSlideIndex < fromIndex && currentSlideIndex >= toIndex) {
        newIndex = currentSlideIndex + 1
      }
      
      // Clear the flag and trigger a reload if needed
      setTimeout(() => {
        slideTransitionRef.current.isChangingSlide = false
        
        if (newIndex !== currentSlideIndex) {
          setCurrentSlideIndex(newIndex)
        } else {
          // Force reload current slide
          loadCanvasState()
        }
      }, 100)
    } else {
      // Simpler flow if canvas isn't available or is already in transition
      const newPresentation = clonePresentation(presentation)
      const [movedSlide] = newPresentation.slides.splice(fromIndex, 1)
      newPresentation.slides.splice(toIndex, 0, movedSlide)
      
      updatePresentation(newPresentation)
      
      // Update current slide index if needed
      let newIndex = currentSlideIndex
      if (currentSlideIndex === fromIndex) {
        newIndex = toIndex
      } else if (currentSlideIndex > fromIndex && currentSlideIndex <= toIndex) {
        newIndex = currentSlideIndex - 1
      } else if (currentSlideIndex < fromIndex && currentSlideIndex >= toIndex) {
        newIndex = currentSlideIndex + 1
      }
      
      if (newIndex !== currentSlideIndex) {
        setCurrentSlideIndex(newIndex)
      }
    }
  }

  // Improved Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      // Always save current state before undoing
      if (fabricCanvas && !slideTransitionRef.current.isChangingSlide) {
        saveCanvasState()
      }
      
      const newIndex = historyIndex - 1
      debugLog(`Undo from ${historyIndex} to ${newIndex}`)
      
      const previousState = clonePresentation(history[newIndex])
      setPresentation(previousState)
      setHistoryIndex(newIndex)
      
      // Handle slide existence and reload
      const targetSlide = previousState.slides[currentSlideIndex]
      if (targetSlide) {
        // Force slide reload by briefly setting a flag
        slideTransitionRef.current.isChangingSlide = true
        setTimeout(() => {
          loadCanvasState()
        }, 50)
      } else {
        // Slide doesn't exist in previous state, adjust index
        setCurrentSlideIndex(Math.min(currentSlideIndex, previousState.slides.length - 1))
      }
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      // Always save current state before redoing
      if (fabricCanvas && !slideTransitionRef.current.isChangingSlide) {
        saveCanvasState()
      }
      
      const newIndex = historyIndex + 1
      debugLog(`Redo from ${historyIndex} to ${newIndex}`)
      
      const nextState = clonePresentation(history[newIndex])
      setPresentation(nextState)
      setHistoryIndex(newIndex)
      
      // Handle slide existence and reload
      const targetSlide = nextState.slides[currentSlideIndex]
      if (targetSlide) {
        // Force slide reload by briefly setting a flag
        slideTransitionRef.current.isChangingSlide = true
        setTimeout(() => {
          loadCanvasState()
        }, 50)
      } else {
        // Slide doesn't exist in next state, adjust index
        setCurrentSlideIndex(Math.min(currentSlideIndex, nextState.slides.length - 1))
      }
    }
  }

  // Object operations
  const duplicateSelected = async () => {
    if (!fabricCanvas) return

    const activeObjects = fabricCanvas.getActiveObjects() as CustomFabricObject[]
    if (!activeObjects || activeObjects.length === 0) return

    debugLog(`Duplicating ${activeObjects.length} objects`)
    fabricCanvas.discardActiveObject()
    
    const clones: CustomFabricObject[] = []

    await Promise.all(
      activeObjects.map(obj =>
        obj.clone().then((clone: CustomFabricObject) => {
          clone.set({
            left: (obj.left || 0) + 10,
            top: (obj.top || 0) + 10,
            id: `${obj.id}-copy-${Date.now()}`
          })
          clones.push(clone)
        })
      )
    )

    clones.forEach(clone => fabricCanvas.add(clone))
    
    const selection = new ActiveSelection(clones, {
      canvas: fabricCanvas,
    })
    fabricCanvas.setActiveObject(selection)
    fabricCanvas.requestRenderAll()
  }

  // Fix for the object positioning methods (in presentation-context.tsx)
const changeObjectPosition = (direction: "forward" | "backward" | "front" | "back") => {
  if (!fabricCanvas) return

  const activeObjects = fabricCanvas.getActiveObjects()
  if (!activeObjects || activeObjects.length === 0) return

  debugLog(`Changing position (${direction}) for ${activeObjects.length} objects`)
  
  // Preserve the selection
  const selection = fabricCanvas.getActiveObject()
  
  // Process each object
  activeObjects.forEach(obj => {
    switch (direction) {
      case "forward": 
        // Use canvas method instead of object method
        fabricCanvas.bringObjectForward(obj, true);
        break;
      case "backward": 
        fabricCanvas.sendObjectBackwards(obj, true);
        break;
      case "front": 
        fabricCanvas.bringObjectToFront(obj);
        break;
      case "back": 
        fabricCanvas.sendObjectToBack(obj);
        break;
    }
  })
  
  // Maintain selection after changing position
  if (selection) {
    fabricCanvas.setActiveObject(selection);
  }
  
  fabricCanvas.requestRenderAll()
}

  const alignText = (alignment: "left" | "center" | "right") => {
    if (!fabricCanvas) return

    const activeObjects = fabricCanvas.getActiveObjects()
      .filter(obj => obj.type?.includes('text'))

    if (!activeObjects.length) return

    debugLog(`Aligning ${activeObjects.length} text objects to ${alignment}`)
    
    activeObjects.forEach(obj => {
      obj.set('textAlign', alignment)
    })
    
    fabricCanvas.requestRenderAll()
  }

  return (
    <PresentationContext.Provider
      value={{
        presentation,
        setPresentation,
        currentSlideIndex,
        setCurrentSlideIndex,
        fabricCanvas,
        setFabricCanvas,
        addSlide,
        deleteSlide,
        reorderSlides,
        updateCurrentSlide,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        duplicateSelected,
        changeObjectPosition,
        alignText,
        logState,
      }}
    >
      {children}
    </PresentationContext.Provider>
  )
}

export function usePresentation() {
  const context = useContext(PresentationContext)
  if (!context) {
    throw new Error("usePresentation must be used within a PresentationProvider")
  }
  return context
}