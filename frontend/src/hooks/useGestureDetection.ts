import { useEffect } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const useGestureDetection = (videoRef: React.RefObject<HTMLVideoElement>) => {
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

    const detectGestures = async () => {
      if (!videoRef.current) return;

      const video = videoRef.current;

      const detect = () => {
        const results = faceLandmarker.detectForVideo(video, performance.now());
        
        if(results.faceLandmarks) {
            //console.log(results.faceLandmarks);
        }
 
        requestAnimationFrame(detect);
      };

      detect();
    };

    initFaceLandmarker();

    return () => {
      if (faceLandmarker) faceLandmarker.close();
    };
  }, [videoRef]);
};

export default useGestureDetection;
