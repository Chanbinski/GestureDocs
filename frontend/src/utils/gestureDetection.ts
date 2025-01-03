import { FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { Gestures } from '../types/gestures';

interface DetectGesturesParams {
  landmarks: FaceLandmarkerResult['faceLandmarks'][0];
  previousNoseX: { value: number | null };
  lastDirection: { value: number | null };
  tiltThreshold?: number;
  shakeThreshold?: number;
}

export function detectGestures({
  landmarks,
  previousNoseX,
  lastDirection,
  tiltThreshold = 0.03,
  shakeThreshold = 0.02
}: DetectGesturesParams): Gestures {
    
  // Head Tilt Detection
  const leftEyeY = landmarks ? landmarks[159].y : 0;
  const rightEyeY = landmarks ? landmarks[386].y : 0;
  const headTiltLeft = leftEyeY - rightEyeY > tiltThreshold;
  const headTiltRight = rightEyeY - leftEyeY > tiltThreshold;

  // Head Shake Detection
  const noseX = landmarks ? landmarks[1].x : 0;
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

  return {
    tiltLeft: headTiltLeft,
    tiltRight: headTiltRight,
    shake: headShake
  };
} 