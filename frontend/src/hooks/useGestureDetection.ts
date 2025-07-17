import { useState, useEffect, useRef } from 'react';
import {  
  FilesetResolver, 
  DrawingUtils, 
 FaceLandmarker, 
  FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { Gestures, DEFAULT_GESTURES } from '../types/gestures';
import { detectGestures } from '../utils/gestureDetection';

export interface GestureThresholds {
  tilt: number;
  shake: number;
  nod: number;
  tiltUp: number;
}

const useGestureDetection = (
  videoRef: React.RefObject<HTMLVideoElement>, 
  thresholds: GestureThresholds,
  gestureUsed: Boolean
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gesturesRef = useRef<Gestures>(DEFAULT_GESTURES);
  const [gestures, setGestures] = useState<Gestures>(gesturesRef.current);
  const thresholdsRef = useRef(thresholds);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    thresholdsRef.current = thresholds;
  }, [thresholds]);

  useEffect(() => {
    if (!gestureUsed) {
      // Reset gestures when disabled
      gesturesRef.current = DEFAULT_GESTURES;
      setGestures(DEFAULT_GESTURES);
      return;
    }

    console.log("Gesture detection started");

    let faceLandmarker: FaceLandmarker;
    
    const initLandmarkers = async () => {
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
      startDetection();
    };

    const startDetection = () => {
        if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext("2d");

      if (!canvasCtx) return;

      // Add check for video readiness
      if (!video.readyState || video.readyState < 2) {
        // Wait for video to be ready
        const onLoadedData = () => {
          startDetection();
          video.removeEventListener('loadeddata', onLoadedData);
        };
        video.addEventListener('loadeddata', onLoadedData);
        return;
      }

      // Ensure valid video dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn("Video dimensions not ready, retrying...");
        animationFrameRef.current = requestAnimationFrame(startDetection);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const drawingUtils = new DrawingUtils(canvasCtx);

      const showLandmarks = (results: FaceLandmarkerResult) => {
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
      };

      const previousYaw = { value: null as number | null };
      const lastYawDirection = { value: null as string | null };
      const previousPitch = { value: null as number | null };
      
      const detect = async () => {
        try {
          // First check if gesture detection is disabled
          if (!gestureUsed) {
            previousYaw.value = null;
            lastYawDirection.value = null;
            previousPitch.value = null;
            return;
          }

          // Then check other video conditions
          if (video.paused || video.ended || !video.videoWidth) {
            animationFrameRef.current = requestAnimationFrame(detect);
            return;
          }

          const faceResults = faceLandmarker.detectForVideo(video, performance.now());
          canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

            if (faceResults.faceLandmarks) showLandmarks(faceResults);

          if (faceResults.faceLandmarks && faceResults.faceLandmarks[0]) {
            const faceLandmarks = faceResults.faceLandmarks[0];
            const newGestures = detectGestures({
              faceLandmarks,
              prevYaw: previousYaw,
              lastYawDir: lastYawDirection,
              prevPitch: previousPitch,
              thresholds: thresholdsRef.current,
            });

            if (JSON.stringify(newGestures) !== JSON.stringify(gesturesRef.current)) {
              gesturesRef.current = newGestures;
              setGestures(newGestures);
            }
          }

          animationFrameRef.current = requestAnimationFrame(detect);
        } catch (error) {
          console.error('Error in detection:', error);
          animationFrameRef.current = requestAnimationFrame(detect);
        }
      };

      detect();
    };

    console.log("Initializing landmarkers");
    initLandmarkers();

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (faceLandmarker) {
        faceLandmarker.close();
      }
      // Reset state
      gesturesRef.current = DEFAULT_GESTURES;
      setGestures(DEFAULT_GESTURES);
    };
  }, [gestureUsed, videoRef]);

  return [canvasRef, gestures] as const;
};

export default useGestureDetection;
