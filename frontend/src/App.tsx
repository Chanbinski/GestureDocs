import { useState, useRef } from 'react'
import TextEditor from './components/TextEditor';
import useWebcam from './hooks/useWebcam'
import useGestureDetection from './hooks/useGestureDetection';
import './App.css'

function App() {
  const [showMesh, setShowMesh] = useState(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const videoRef = useWebcam();
  const [canvasRef, gestures] = useGestureDetection(videoRef, showMesh);

  return (
    <>
      <h1 className="py-2 text-3xl font-medium text-gray-800">GestureDocs</h1>

      <div className="flex flex-col gap-2 py-2">
        <div className="flex flex-row items-center gap-2">
          <div className="text-center font-medium text-gray-700 text-sm">Settings </div>
            <button
              onClick={() => setIsDeveloperMode(!isDeveloperMode)}
              className="bg-purple-500 text-white px-2 py-0.5 rounded text-xs">
              {isDeveloperMode ? "Normal View" : "Detailed View"}
            </button>
          </div>

        <div className="flex flex-row items-center gap-2">
            <div className="text-center font-medium text-gray-700 text-sm">Gesture Status </div>
            <div className={`text-center px-2 py-0.5 rounded text-xs ${gestures.tiltLeft ? "bg-green-500 text-white" : "bg-gray-500 text-gray-300"}`}>
              Tilt L
            </div>
            <div className={`text-center px-2 py-0.5 rounded text-xs ${gestures.tiltRight ? "bg-green-500 text-white" : "bg-gray-500 text-gray-300"}`}>
              Tilt R
            </div>
            <div className={`text-center px-2 py-0.5 rounded text-xs ${gestures.shake ? "bg-green-500 text-white" : "bg-gray-500 text-gray-300"}`}>
              Shake
            </div>
        </div>
      </div>

      <div className="mb-14">
        <TextEditor gestures={gestures}/>
      </div>

      <div className="fixed bottom-4 right-4 flex flex-col items-end gap-3">
        <div className={`relative w-[320px] h-[240px] ${!isDeveloperMode && 'hidden'}`}>
          <video ref={videoRef} className="absolute top-0 left-0 w-full h-full"/>
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
        </div>

        {isDeveloperMode && (
          <div className="flex flex-row items-center gap-2 absolute top-2 left-2">
            <div 
              onClick={() => setShowMesh(!showMesh)}
              className={`text-center px-2 py-0.5 rounded text-xs cursor-pointer ${showMesh ? "bg-green-500 text-white" : "bg-gray-500 text-gray-300"}`}
            >
              {showMesh ? "Disable Face Mesh" : "Enable Face Mesh"}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default App
