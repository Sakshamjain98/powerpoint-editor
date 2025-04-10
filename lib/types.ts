export interface Slide {
  id: string
  background?: string
  objects: any[]
}

export interface Presentation {
  title: string
  slides: Slide[]
}
