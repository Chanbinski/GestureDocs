import { useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

const useGestureDetection = (videoRef: React.RefObject<HTMLVideoElement>) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
          return;
        }

        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext("2d");

        if (!canvasCtx) return;

        const drawingUtils = new DrawingUtils(canvasCtx);

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const detect = () => {
          const results = faceLandmarker.detectForVideo(video, performance.now());

          // Clear canvas
          canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

          console.log(canvas.width, canvas.height);

          console.log(results.faceLandmarks);

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
                { color: "#30FF30" }
              );
              drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
                { color: "#30FF30", lineWidth: 2 }
              );
              drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
                { color: "#FF3030" }
              );
              drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
                { color: "#FF3030", lineWidth: 2 }
              );
              drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
                { color: "#FF3030", lineWidth: 2 }
              );
              drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_LIPS,
                { color: "#FF3030", lineWidth: 2 }
              );
              drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
                { color: "#30FF30", lineWidth: 2 }
              );
              drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
                { color: "#FF3030", lineWidth: 2 }
              );
            }
          }
          requestAnimationFrame(detect);
        };

      detect();
    };

    initFaceLandmarker();
  }, [videoRef]);

  return canvasRef;
};

export default useGestureDetection;
