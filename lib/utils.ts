import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from "uuid"
import type { Slide, Presentation } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createEmptySlide(): Slide {
  return {
    id: uuidv4(),
    background: "#ffffff",
    objects: [],
  }
}

// Deep clone a presentation to avoid reference issues
export function clonePresentation(presentation: Presentation): Presentation {
  return JSON.parse(JSON.stringify(presentation))
}

// Deep clone a slide to avoid reference issues
export function cloneSlide(slide: Slide): Slide {
  return JSON.parse(JSON.stringify(slide))
}
