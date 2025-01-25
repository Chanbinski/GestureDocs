export interface Gestures {
  tilt: boolean;
  shake: boolean;
  shrug: boolean;
  nod: boolean;
}

export const DEFAULT_GESTURES: Gestures = {
  tilt: false,
  shake: false,
  shrug: false,
  nod: false
}; 