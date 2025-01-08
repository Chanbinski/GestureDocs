import { FaceLandmarkerResult, PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { Gestures } from '../types/gestures';

interface DetectGesturesParams {
  // Face-related parameters
  faceLandmarks: FaceLandmarkerResult['faceLandmarks'][0];
  previousNoseX: { value: number | null };
  lastDirection: { value: number | null };
  tiltThreshold?: number;
  shakeThreshold?: number;

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
  tiltThreshold = 0.03,
  shakeThreshold = 0.02,

  // Pose-related parameters
  poseLandmarks,
  previousShoulderY,
  shrugThreshold = 0.03
}: DetectGesturesParams): Gestures {
    
  // Head Tilt Detection
  const leftEyeY = faceLandmarks ? faceLandmarks[159].y : 0;
  const rightEyeY = faceLandmarks ? faceLandmarks[386].y : 0;
  const headTiltLeft = leftEyeY - rightEyeY > tiltThreshold;
  const headTiltRight = rightEyeY - leftEyeY > tiltThreshold;

  // Head Shake Detection
  const noseX = faceLandmarks ? faceLandmarks[1].x : 0;
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
    tiltLeft: headTiltLeft,
    tiltRight: headTiltRight,
    shake: headShake,
    shrug: shrug
  };
} 