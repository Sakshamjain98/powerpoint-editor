export interface Slide {
  id: string
  background?: string
  objects?: any[]
  fabricState?: {
    version: string
    objects: any[]
    background?: string
  }
}

export interface Presentation {
  title: string
  slides: Slide[]
}


import 'fabric'

declare module 'fabric' {
  namespace fabric {
    interface Object {
      sendBackwards: (intersecting?: boolean) => Object
      bringForward: (intersecting?: boolean) => Object
      bringToFront: () => Object
      sendToBack: () => Object
    }
  }
}