export interface Gestures {
  isHeadTilt: boolean;
  isHeadShake: boolean;
  isShrug: boolean;
  isHeadNod: boolean;
  isMovingCloser: boolean;
  isMovingAway: boolean;
}

export const DEFAULT_GESTURES: Gestures = {
  isHeadTilt: false,
  isHeadShake: false,
  isShrug: false,
  isHeadNod: false,
  isMovingCloser: false,
  isMovingAway: false,
}; 