import { useState, useEffect, useRef } from 'react';
import {  
  FilesetResolver, 
  DrawingUtils, 
 FaceLandmarker, 
  FaceLandmarkerResult,
  PoseLandmarker,
  PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { Gestures, DEFAULT_GESTURES } from '../types/gestures';
import { detectGestures } from '../utils/gestureDetection';

const useGestureDetection = (videoRef: React.RefObject<HTMLVideoElement>, showMesh: Boolean) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gesturesRef = useRef<Gestures>(DEFAULT_GESTURES);
  const [gestures, setGestures] = useState<Gestures>(gesturesRef.current);

  useEffect(() => {
  let faceLandmarker: FaceLandmarker;
   let poseLandmarker: PoseLandmarker;

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

      poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1
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
        video.addEventListener('loadeddata', () => startDetection());
        return;
      }

      // Ensure valid video dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn("Video dimensions not ready, retrying...");
        requestAnimationFrame(startDetection);
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

      const showPoseLandmarks = (results: PoseLandmarkerResult) => {
        if (results.landmarks) {
          for (const landmarks of results.landmarks) {
            drawingUtils.drawConnectors(
              landmarks,
              PoseLandmarker.POSE_CONNECTIONS,
              { color: "#00FF00", lineWidth: 2}
            );
            drawingUtils.drawLandmarks(landmarks, {
              color: "#FF0000",
              lineWidth: 1
            });
          }
        }
      };

      const previousNoseX = { value: null as number | null };
      const lastDirection = { value: null as number | null };
      const previousNoseY = { value: null as number | null };
      const lastNodDirection = { value: null as number | null };
      const previousShoulderY = { value: null as number | null };

      const detect = async () => {
        try {
          // Only process if video is playing and visible
          if (video.paused || video.ended || !video.videoWidth) {
            requestAnimationFrame(detect);
            return;
          }
          const faceResults = faceLandmarker.detectForVideo(video, performance.now());
          const poseResults = poseLandmarker.detectForVideo(video, performance.now());
          canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

          if (showMesh) {
            if (faceResults.faceLandmarks) showLandmarks(faceResults);
            if (poseResults.landmarks) showPoseLandmarks(poseResults);
          }

          if (faceResults.faceLandmarks && faceResults.faceLandmarks[0] && poseResults.landmarks && poseResults.landmarks[0]) {
            const faceLandmarks = faceResults.faceLandmarks[0];
            const poseLandmarks = poseResults.landmarks[0];
            const newGestures = detectGestures({
              faceLandmarks,
              previousNoseX,
              lastDirection,
              previousNoseY,
              lastNodDirection,
              poseLandmarks,
              previousShoulderY,
            });

            if (JSON.stringify(newGestures) !== JSON.stringify(gesturesRef.current)) {
              gesturesRef.current = newGestures;
              setGestures(newGestures);
            }
          }

          requestAnimationFrame(detect);
        } catch (error) {
          console.error('Error in detection:', error);
          requestAnimationFrame(detect);
        }
      };

      detect();
    };

    initLandmarkers();
  }, [videoRef, showMesh]);

  return [canvasRef, gesturesRef.current] as const;
};

export default useGestureDetection;
