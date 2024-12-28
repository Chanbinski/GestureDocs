import { useState, useRef } from 'react'
import TextEditor from './components/TextEditor';
import useWebcam from './hooks/useWebcam'
import useGestureDetection from './hooks/useGestureDetection';
import './App.css'

function App() {
  const [showMesh, setShowMesh] = useState(false);

  const videoRef = useWebcam();
  const [canvasRef, gestures] = useGestureDetection(videoRef, showMesh);

  return (
    <>
      <div className="text-3xl font-bold text-black-500 mb-5">GestureDocs</div>
      <div className="mb-14">
        <TextEditor gestures={gestures}/>
      </div>
      <div className="flex flex-col justify-center items-center gap-3">
        <button
          onClick={() => setShowMesh(!showMesh)}
          className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow"
        >
        {showMesh ? "Disable Mesh" : "Enable Mesh"} </button>

        <div className="relative w-[320px] h-[240px]">
          <video ref={videoRef} className="absolute top-0 left-0 w-full h-full"/>
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
        </div>

        <div className="flex flex-row grow gap-5">
          <div className={`text-center px-4 py-2 rounded ${gestures[0] ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300"}`}>
            Tilt L
          </div>
          <div className={`text-center px-4 py-2 rounded ${gestures[1] ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300"}`}>
            Tilt R
          </div>
          <div className={`text-center px-4 py-2 rounded ${gestures[2] ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300"}`}>
            Shake
          </div>
        </div>
      </div>
    </>
  )
}

export default App
