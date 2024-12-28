import { useState, useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

const useGestureDetection = (videoRef: React.RefObject<HTMLVideoElement>, showMesh: Boolean) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Gesture indicators: [headTiltLeft, headTiltRight, headShake]
  const [gestures, setGestures] = useState([false, false, false]);

  useEffect(() => {
    let faceLandmarker: FaceLandmarker;

    const initFaceLandmarker = async () => {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );

      faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      });

      detectGestures();
    };
    

    // Issue regarding DrawingUtils https://github.com/google-ai-edge/mediapipe/issues/5790
    const detectGestures = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;

        if (video.videoWidth === 0 || video.videoHeight === 0) {
          console.error("Video dimensions are zero. Ensure the webcam feed is loaded.");
          requestAnimationFrame(detectGestures);
          return;
        }

        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext("2d");

        if (!canvasCtx) return;

        const drawingUtils = new DrawingUtils(canvasCtx);

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const previousNoseX = { value: null as number | null };
        let lastDirection = null as string | null;

        const detect = () => {
          const results = faceLandmarker.detectForVideo(video, performance.now());
          canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

          const landmarks = results.faceLandmarks[0];

          // Detect Head Tilt
          const leftEyeY = landmarks ? landmarks[159].y : 0; // Left eye
          const rightEyeY = landmarks ? landmarks[386].y : 0; // Right eye
          const tiltThreshold = 0.03; // Adjust based on sensitivity

          const headTiltLeft = leftEyeY - rightEyeY > tiltThreshold
          const headTiltRight = rightEyeY - leftEyeY > tiltThreshold;

          // Detect Head Shake
          const noseX = landmarks ? landmarks[1].x : 0; // Nose tip
          const shakeThreshold = 0.02; // Adjust based on sensitivity

          let headShake = false;
          if (previousNoseX.value !== null) {
            const movement = noseX - previousNoseX.value; // Calculate movement
            if (movement > shakeThreshold) {
              // Movement to the right
              if (lastDirection === "left") {
                headShake = true; // Complete shake detected (left → right)
                lastDirection = null; // Reset direction
              } else {
                lastDirection = "right"; // Update direction
              }
            } else if (movement < -shakeThreshold) {
              // Movement to the left
              if (lastDirection === "right") {
                headShake = true; // Complete shake detected (right → left)
                lastDirection = null; // Reset direction
              } else {
                lastDirection = "left"; // Update direction
              }
            }
          }
          
          previousNoseX.value = noseX;

          setGestures([headTiltLeft, headTiltRight, headShake]);

          // Draw Face Landmarks
          if (showMesh) {
            if (results.faceLandmarks) {
              for (const landmarks of results.faceLandmarks) {
                drawingUtils.drawConnectors(
                  landmarks,
                  FaceLandmarker.FACE_LANDMARKS_TESSELATION,
                  { color: "#C0C0C070", lineWidth: 1 }
                );
                drawingUtils.drawConnectors(
                  landmarks,
                  FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
                  { color: "#30FF30", lineWidth: 2 }
                );
                drawingUtils.drawConnectors(
                  landmarks,
                  FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
                  { color: "#30FF30", lineWidth: 2 }
                );
                drawingUtils.drawConnectors(
                  landmarks,
                  FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
                  { color: "#30FF30", lineWidth: 2 }
                );
                drawingUtils.drawConnectors(
                  landmarks,
                  FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
                  { color: "#30FF30", lineWidth: 2 }
                );
                drawingUtils.drawConnectors(
                  landmarks,
                  FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
                  { color: "#30FF30", lineWidth: 2 }
                );
                drawingUtils.drawConnectors(
                  landmarks,
                  FaceLandmarker.FACE_LANDMARKS_LIPS,
                  { color: "#30FF30", lineWidth: 2 }
                );
                drawingUtils.drawConnectors(
                  landmarks,
                  FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
                  { color: "#30FF30", lineWidth: 2 }
                );
                drawingUtils.drawConnectors(
                  landmarks,
                  FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
                  { color: "#30FF30", lineWidth: 2 }
                );
              }
            }
          }
          requestAnimationFrame(detect);
        };

      detect();
    };

    initFaceLandmarker();
  }, [videoRef, showMesh]);

  return [canvasRef, gestures] as const;
};

export default useGestureDetection;
