import { useState } from 'react'
import TextEditor from './components/TextEditor';
import useWebcam from './hooks/useWebcam'
import useGestureDetection from './hooks/useGestureDetection';
import './App.css'
import { FiSettings, FiCode, FiCommand } from 'react-icons/fi'

interface GestureThresholds {
  tilt: number;
  shake: number;
  nod: number;
  tiltUp: number;
}

function App() {
  const [showMesh, setShowMesh] = useState(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const videoRef = useWebcam();

  const [thresholds, setThresholds] = useState<GestureThresholds>({
    tilt: 0.03,
    shake: 5,
    nod: 1.2,
    tiltUp: 1.5
  });

  const [canvasRef, gestures] = useGestureDetection(videoRef, showMesh, thresholds);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [showGestureModal, setShowGestureModal] = useState(false);

  return (
    <>
      {/* Modal Overlays */}
      {(showDeveloperModal || showGestureModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
          {showDeveloperModal && (
            <div className="bg-white rounded-lg p-6 w-96 max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Developer Settings</h2>
                <button 
                  onClick={() => setShowDeveloperModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700">Developer Mode</div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDeveloperMode}
                      onChange={() => setIsDeveloperMode(!isDeveloperMode)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer 
                      peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] 
                      after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 
                      after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                      peer-checked:bg-green-500">
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {showGestureModal && (
            <div className="bg-white rounded-lg p-6 w-1/3 max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-bold text-gray-900">Gesture Settings</h2>
                  <div className="text-sm text-gray-500">If gesture is detected, the text area will be highlighted in green.</div>
                </div>
                <button 
                  onClick={() => setShowGestureModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className={`px-2.5 py-1 rounded text-sm font-medium ${gestures.isHeadTilt ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700"}`}>
                    Head Tilt
                  </div>
                  <div className="mt-2">
                    <input
                      type="range"
                      min="0.01"
                      max="0.1"
                      step="0.01"
                      value={thresholds.tilt}
                      onChange={(e) => setThresholds(prev => ({ ...prev, tilt: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 text-center">
                      Sensitivity: {thresholds.tilt.toFixed(3)}
                    </div>
                  </div>
                </div>

                <div>
                  <div className={`px-2.5 py-1 rounded text-sm font-medium ${gestures.isHeadShake ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700"}`}>
                    Head Shake
                  </div>
                  <div className="mt-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={thresholds.shake}
                      onChange={(e) => setThresholds(prev => ({ ...prev, shake: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 text-center">
                      Sensitivity: {thresholds.shake.toFixed(1)}
                    </div>
                  </div>
                </div>

                <div>
                  <div className={`px-2.5 py-1 rounded text-sm font-medium ${gestures.isHeadNod ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700"}`}>
                    Head Nod
                  </div>
                  <div className="mt-2">
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={thresholds.nod}
                      onChange={(e) => setThresholds(prev => ({ ...prev, nod: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 text-center">
                      Sensitivity: {thresholds.nod.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div>
                  <div className={`px-2.5 py-1 rounded text-sm font-medium ${gestures.isHeadTiltUp ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700"}`}>
                    Head Tilt Up
                  </div>
                  <div className="mt-2">
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={thresholds.tiltUp}
                      onChange={(e) => setThresholds(prev => ({ ...prev, tiltUp: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 text-center">
                      Sensitivity: {thresholds.tiltUp.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Menu */}
      <div className="fixed bottom-5 right-5 z-40">
        <div className="relative">
          <button 
            className={`p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors ${
              showSettings ? 'bg-gray-700' : ''
            }`}
            onClick={() => setShowSettings(!showSettings)}
          >
            <FiSettings className="w-6 h-6 text-white" />
          </button>
          
          {showSettings && (
            <div className="absolute bottom-16 right-0 bg-white shadow-lg rounded-lg p-2 w-64">
              <button
                onClick={() => {
                  setShowDeveloperModal(true);
                  setShowSettings(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                <FiCode className="w-4 h-4 mr-2" />
                Developer Settings
              </button>
              <button
                onClick={() => {
                  setShowGestureModal(true);
                  setShowSettings(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                <FiCommand className="w-4 h-4 mr-2" />
                Gesture Settings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
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
                {showMesh ? "Disable Mesh" : "Enable Mesh"}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default App
