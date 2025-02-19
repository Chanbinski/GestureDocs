export interface Gestures {
  isHeadTilt: boolean;
  isHeadShake: boolean;
  isHeadTiltUp: boolean;
  isHeadNod: boolean;
}

export const DEFAULT_GESTURES: Gestures = {
  isHeadTilt: false,
  isHeadShake: false,
  isHeadNod: false,
  isHeadTiltUp: false,
}; 