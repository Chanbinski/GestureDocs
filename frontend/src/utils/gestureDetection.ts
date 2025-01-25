import { FaceLandmarkerResult, PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { DEFAULT_GESTURES, Gestures } from '../types/gestures';

interface DetectGesturesParams {
  // Face-related parameters
  faceLandmarks: FaceLandmarkerResult['faceLandmarks'][0];
  previousNoseX: { value: number | null };
  lastDirection: { value: number | null };
  previousNoseY: { value: number | null };
  lastNodDirection: { value: number | null };
  
  tiltThreshold?: number;
  shakeThreshold?: number;
  nodThreshold?: number;

  // Pose-related parameters
  poseLandmarks: PoseLandmarkerResult['landmarks'][0];
  previousShoulderY: { value: number | null };
  shrugThreshold?: number;
}

export function detectGestures({
  // Face-related parameters
  faceLandmarks,
  previousNoseX,
  lastDirection,
  previousNoseY,
  lastNodDirection,
  tiltThreshold = 0.03,
  shakeThreshold = 0.02,
  nodThreshold = 0.03,

  // Pose-related parameters
  poseLandmarks,
  previousShoulderY,
  shrugThreshold = 0.025
}: DetectGesturesParams): Gestures {

  if (!faceLandmarks) return DEFAULT_GESTURES;
    
  // Head Tilt Detection
  const leftEyeY = faceLandmarks[159].y
  const rightEyeY = faceLandmarks[386].y
  const headTiltLeft = leftEyeY - rightEyeY > tiltThreshold;
  const headTiltRight = rightEyeY - leftEyeY > tiltThreshold;

  // Head Shake Detection
  const noseX = faceLandmarks[1].x;
  let headShake = false;

  if (previousNoseX.value !== null) {
    const movement = noseX - previousNoseX.value;
    const isSignificantMovement = Math.abs(movement) > shakeThreshold;
    const currentDirection = movement > 0 ? 1 : 0; // 1 for right, 0 for left
    
    if (isSignificantMovement) {
      if (lastDirection.value !== null && lastDirection.value !== currentDirection) {
        headShake = true;
      }
      lastDirection.value = currentDirection;
    }
  }
  previousNoseX.value = noseX;

  // Nod
  const noseY = faceLandmarks[1].y;
  let nod = false;

  if(previousNoseY.value !== null) {
    const movement = noseY - previousNoseY.value;
    const isSignificantMovement = Math.abs(movement) > nodThreshold;
    const currentDirection = movement > 0 ? 1 : 0;

    if (isSignificantMovement) {
      if (lastNodDirection.value !== null && lastNodDirection.value !== currentDirection) {
        nod = true;
      }
      lastNodDirection.value = currentDirection;
    }
  }
  previousNoseY.value = noseY;

  // Shrug Detection
  let shrug = false;
  if (poseLandmarks && poseLandmarks.length > 0 && previousShoulderY) {
    const leftShoulder = poseLandmarks[11];
    const rightShoulder = poseLandmarks[12];
    const currentShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    if (previousShoulderY.value !== null) {
      const shoulderMovement = previousShoulderY.value - currentShoulderY;
      shrug = shoulderMovement > shrugThreshold;
    }
    previousShoulderY.value = currentShoulderY;
  }

  return {
    tilt: headTiltLeft || headTiltRight,
    shake: headShake,
    shrug: shrug,
    nod: nod
  };
} 