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