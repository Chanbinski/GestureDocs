import { FaceLandmarkerResult, PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { DEFAULT_GESTURES, Gestures } from '../types/gestures';

interface DetectGesturesParams {
  faceLandmarks: FaceLandmarkerResult['faceLandmarks'][0];
  poseLandmarks: PoseLandmarkerResult['landmarks'][0];
  prevYaw: { value: number | null };
  lastYawDir: { value: number | null };
  prevPitch: { value: number | null };
  lastPitchDir: { value: number | null };
  prevShoulderY: { value: number | null };
  prevNoseZ: { value: number | null };
}

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
  faceLandmarks, poseLandmarks,
  prevYaw, lastYawDir,
  prevPitch, lastPitchDir,
  prevShoulderY, prevNoseZ,
}: DetectGesturesParams): Gestures {

  const tiltThreshold = 0.03;
  const shakeThreshold = 5;
  const nodThreshold = 1.5;
  const gettingCloserThreshold = 0.007;
  const shrugThreshold = 0.022;

  if (!faceLandmarks) return DEFAULT_GESTURES;

  //Landmarks
  const noseTip = faceLandmarks[1];
  const chin = faceLandmarks[152];
  const leftEye = faceLandmarks[159];
  const rightEye = faceLandmarks[386];

  const leftShoulder = poseLandmarks[11];
  const rightShoulder = poseLandmarks[12];

  //Variables
  let isHeadShake = false;
  let isHeadNod = false;
  let isHeadTilt = false;
  let isShrug = false;
  let isMovingCloser = false;
  let isMovingAway = false;

  const { yawDeg, pitchDeg } = computeYawPitch(noseTip, leftEye, rightEye, chin);

  // Head Tilt (yaw)
  isHeadTilt = Math.abs(leftEye.y - rightEye.y) > tiltThreshold;


  if (prevPitch.value !== null && prevYaw.value !== null && !isHeadTilt) {
    const yawMovement = yawDeg - prevYaw.value;
    const pitchMovement = pitchDeg - prevPitch.value;

    // Turning left is 1, turning right is 0

    // You turn left -> yawDegrees decrease, meaning that yawDeg - prevYaw.value is negative
    // Your turn right -> yawDegrees increase, meaning that yawDeg - prevYaw.value is positive
    // You turn up -> pitchDegrees increase, meaning that pitchDeg - prevPitch.value is positive
    // You turn down -> pitchDegrees decrease, meaning that pitchDeg - prevPitch.value is negative

    const curYawDir = yawMovement > 0 ? 1 : 0;
    const curPitchDir = pitchMovement > 0 ? 1 : 0;

    if (Math.abs(yawMovement) > shakeThreshold && Math.abs(pitchMovement) > nodThreshold) {
      // Skip
    }
   
    // Head Shake Detection
    else if (Math.abs(yawMovement) > shakeThreshold) {
      if (lastYawDir.value !== null && lastYawDir.value !== curYawDir) isHeadShake = true;
      lastYawDir.value = curYawDir;
    }

    // Head Nod Detection
    else if (Math.abs(pitchMovement) > nodThreshold) {
        if (lastPitchDir.value !== null && lastPitchDir.value === 0 && curPitchDir === 1) isHeadNod = true;
        lastPitchDir.value = curPitchDir;
      }
  }
  prevYaw.value = yawDeg;
  prevPitch.value = pitchDeg;

  // Shrug (y-axis)
  if (!poseLandmarks) isShrug = false;
  else {
    const curShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    if (prevShoulderY.value !== null) {
      isShrug = prevShoulderY.value - curShoulderY > shrugThreshold;
    }
    prevShoulderY.value = curShoulderY;
  }


  // Getting closer, getting away
  // const dx = rightEye.x - leftEye.x;
  // const dy = rightEye.y - leftEye.y;
  // const distance = Math.sqrt(dx * dx + dy * dy);

  // if (prevNoseZ.value !== null && !isHeadNod && !isShrug) {
  //   const movement = distance - prevNoseZ.value;
  //   if (movement > gettingCloserThreshold) {
  //     isMovingCloser = true
  //   } else if (movement < -gettingCloserThreshold) {
  //     isMovingAway = true
  //   }
  // }
  // prevNoseZ.value = distance;

  

  return {
    isHeadTilt,
    isHeadShake,
    isShrug,
    isHeadNod,
    isMovingCloser: false,
    isMovingAway: false,
  };
} 