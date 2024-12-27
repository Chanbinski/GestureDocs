import useWebcam from '../hooks/useWebcam';

const WebcamFeed = () => {
  const videoRef = useWebcam();

  return <video ref={videoRef} style={{ width: '100%' }} />;
};

export default WebcamFeed;
