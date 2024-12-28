import { useEffect, useRef } from 'react';

const useWebcam = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
          };
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
      }
    };

    startWebcam();
  }, []);

  return videoRef;
};

export default useWebcam;
