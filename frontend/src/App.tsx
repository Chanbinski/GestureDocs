import { useState, useRef } from 'react'
import TextEditor from './components/TextEditor';
import useWebcam from './hooks/useWebcam'
import useGestureDetection from './hooks/useGestureDetection';
import './App.css'

function App() {
  const videoRef = useWebcam();
  const canvasRef = useGestureDetection(videoRef);

  return (
    <>
      <div className="text-3xl font-bold text-black-500 mb-5">GestureDocs</div>
      <div className="mb-5">
        <TextEditor/>
      </div>
      <div className="relative w-[320px] h-[240px] flex justify-center items-center mx-auto my-auto">
        <video ref={videoRef} className="absolute top-0 left-0 w-full h-full"/>
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
      </div>
      
    </>
  )
}

export default App
