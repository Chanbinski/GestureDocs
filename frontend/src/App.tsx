import { useState, useRef } from 'react'
import TextEditor from './components/TextEditor';
import useWebcam from './hooks/useWebcam'
import useGestureDetection from './hooks/useGestureDetection';
import './App.css'

function App() {
  const videoRef = useWebcam();
  useGestureDetection(videoRef);

  return (
    <>
      <div className="text-3xl font-bold text-black-500 mb-5">GestureDocs</div>
      <TextEditor />
      <div className="w-60 fixed bottom-10 right-10">
        <video ref={videoRef} />
      </div>
    </>
  )
}

export default App
