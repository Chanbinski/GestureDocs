import { FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { DEFAULT_GESTURES, Gestures } from '../types/gestures';

interface DetectGesturesParams {
  faceLandmarks: FaceLandmarkerResult['faceLandmarks'][0];
  prevYaw: { value: number | null };
  lastYawDir: { value: string | null };
  prevPitch: { value: number | null };
  thresholds: {
    tilt: number;
    shake: number;
    nod: number;
    tiltUp: number;
  };
}

let lastGestureTime = 0;
const GESTURE_COOLDOWN = 1000; // 1 second in milliseconds

function computeYawPitch(
  leftEye: { x: number; y: number; z: number },
  rightEye: { x: number; y: number; z: number },
  nose: { x: number; y: number; z: number },
  chin: { x: number; y: number; z: number }
) {

  const dx = rightEye.x - leftEye.x;
  //const dy = rightEye.y - leftEye.y;
  const dz = rightEye.z - leftEye.z;

  const yawRad = Math.atan2(dx, dz);
  const yawDeg = (yawRad * 180) / Math.PI;


  //const dnx = nose.x - chin.x;
  const dny = nose.y - chin.y;
  const dnz = nose.z - chin.z;

  const pitchRad = Math.atan2(dny, dnz);
  const pitchDeg = (pitchRad * 180) / Math.PI;

  return { yawDeg, pitchDeg };
}

export function detectGestures({
  faceLandmarks, prevYaw, lastYawDir, prevPitch, thresholds
}: DetectGesturesParams): Gestures {
  const currentTime = Date.now();
  const isInCooldown = currentTime - lastGestureTime < GESTURE_COOLDOWN;

  if (!faceLandmarks) return DEFAULT_GESTURES;

  //Landmarks
  const noseTip = faceLandmarks[1];
  const chin = faceLandmarks[152];
  const leftEye = faceLandmarks[159];
  const rightEye = faceLandmarks[386];

  //Variables
  let isHeadShake = false;
  let isHeadNod = false;
  let isHeadTilt = false;
  let isHeadTiltUp = false;

  const { yawDeg, pitchDeg } = computeYawPitch(noseTip, leftEye, rightEye, chin);

  // Head Tilt (roll)
  isHeadTilt = Math.abs(leftEye.y - rightEye.y) > thresholds.tilt;

  if (prevPitch.value !== null && prevYaw.value !== null && !isHeadTilt) {
    const yawMovement = yawDeg - prevYaw.value;
    const pitchMovement = pitchDeg - prevPitch.value;

    const curYawDir = yawMovement > 0 ? "right" : "left";

    // Turning left is 1, turning right is 0

    // You turn left -> yawDegrees decrease, meaning that yawDeg - prevYaw.value is negative
    // Your turn right -> yawDegrees increase, meaning that yawDeg - prevYaw.value is positive
    // You turn up -> pitchDegrees increase, meaning that pitchDeg - prevPitch.value is positive
    // You turn down -> pitchDegrees decrease, meaning that pitchDeg - prevPitch.value is negative

    if (Math.abs(yawMovement) > thresholds.shake && Math.abs(pitchMovement) > thresholds.nod) {
      //
    }

    else if (Math.abs(yawMovement) > thresholds.shake) {
      if (lastYawDir.value !== null && lastYawDir.value !== curYawDir) {
        isHeadShake = true; 
      }
      lastYawDir.value = curYawDir;
    }

    // Nod Detection
    else if (!isInCooldown) {
      if (pitchMovement < -thresholds.nod) isHeadNod = true;
      else if (pitchMovement > thresholds.tiltUp) isHeadTiltUp = true;
    }
    
    // Update lastGestureTime when a gesture is detected
    if (isHeadNod || isHeadTiltUp) lastGestureTime = currentTime;
  }

  prevPitch.value = pitchDeg;
  prevYaw.value = yawDeg;

  return {
    isHeadTilt,
    isHeadShake,
    isHeadTiltUp,
    isHeadNod,
  };
  }