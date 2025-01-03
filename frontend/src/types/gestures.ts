export interface Gestures {
  tiltLeft: boolean;
  tiltRight: boolean;
  shake: boolean;
}

export const DEFAULT_GESTURES: Gestures = {
  tiltLeft: false,
  tiltRight: false,
  shake: false
}; 