import { useState, useEffect, useRef } from 'react'
import TextEditor from './components/TextEditor';
import useWebcam from './hooks/useWebcam'
import useGestureDetection, { GestureThresholds } from './hooks/useGestureDetection';
import './App.css'
import { CogIcon, CodeBracketIcon, FaceSmileIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'

const STORAGE_KEY = 'document_data';

function App() {
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [gestureUsed, setGestureUsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return data.gestureUsed ?? true;
    }
    return true;
  });
  const [thresholds, setThresholds] = useState<GestureThresholds>(() => {
    const defaultThresholds: GestureThresholds = { tilt: 0.03, shake: 5, nod: 1.5, tiltUp: 1.9 }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return data.thresholds || defaultThresholds;
    }
    return defaultThresholds;
  });
  const [settingOption, setSettingOption] = useState<'none' | 'settings' | 'gesture' | 'developer'>('none');
  const [showGestureDot, setShowGestureDot] = useState(false);
  
  const videoRef = useWebcam();
  const [canvasRef, gestures] = useGestureDetection(videoRef, thresholds, gestureUsed)
  const prevGesturesRef = useRef(gestures);

  // Save Gesture Settings (gestureUsed, thresholds)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const data = saved ? JSON.parse(saved) : {};
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      gestureUsed,
      thresholds
    }));
  }, [gestureUsed, thresholds]);

  // Effect to show the dot when a gesture is detected
  useEffect(() => {
    const detected = gestures.isHeadTilt || gestures.isHeadShake || gestures.isHeadNod || gestures.isHeadTiltUp;
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (detected) {
      setShowGestureDot(true);
      console.log('Gesture detected');
      timer = setTimeout(() => {
        setShowGestureDot(false);
      }, 1000);
      prevGesturesRef.current = gestures;
    } else {
      setShowGestureDot(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [gestures]);

  return (
    <>
      {/* Modal Overlays */}
      {(settingOption === 'developer' || settingOption === 'gesture') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
          {settingOption === 'developer' && (
            <div className="bg-white rounded-lg p-6 w-96 max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Developer Settings</h2>
                <button 
                  onClick={() => setSettingOption('none')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5 stroke-2" />
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
          
          {settingOption === 'gesture' && (
            <div className="bg-white rounded-lg p-6 w-1/3 max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-bold text-gray-900">Gesture Settings</h2>
                </div>
                <button 
                  onClick={() => setSettingOption('none')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5 stroke-2" />
                </button>
              </div>

              <div className="p-1 mb-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">Gesture Controls</div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gestureUsed}
                    onChange={(e) => {
                      setGestureUsed(() => {
                        const newValue = e.target.checked;
                        return newValue;
                      });
                      if (!e.target.checked) {
                        setSettingOption('none');
                      }
                    }}
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

              
             {gestureUsed && <div className="space-y-6">
              <div className="p-1 text-sm text-gray-500">If gesture is detected, the text area will be highlighted in green.</div>
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
                      Sensitivity (lower = more sensitive): {thresholds.tilt.toFixed(3)}
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
                      Sensitivity (lower = more sensitive): {thresholds.shake.toFixed(1)}
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
                      Sensitivity (lower = more sensitive): {thresholds.nod.toFixed(2)}
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
                      Sensitivity (lower = more sensitive): {thresholds.tiltUp.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div> }
            </div> 
          )}
        </div>
      )}

      {/* Settings Menu */}
      <div className="fixed bottom-5 right-5 z-[100]">
        <div className="relative">
          <button 
            className={`p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors ${
              settingOption !== 'none' ? 'bg-gray-700' : ''
            }`}
            onClick={() => setSettingOption(settingOption === 'none' ? 'settings' : 'none')}
          >
            <CogIcon className="w-6 h-6 text-white stroke-2" />
          </button>
          
          {settingOption === 'settings' && (
            <div className="absolute bottom-16 right-0 bg-white shadow-lg rounded-lg p-2 w-64">
              <button
                onClick={() => setSettingOption('developer')}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                <CodeBracketIcon className="w-4 h-4 mr-2 stroke-2" />
                Developer Settings
              </button>
              <button
                onClick={() => setSettingOption('gesture')}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                <FaceSmileIcon className="w-4 h-4 mr-2 stroke-2" />
                Gesture Settings
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to reset the document? This cannot be undone.')) {
                    localStorage.removeItem('document_data');
                    window.location.reload();
                  }
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                <TrashIcon className="w-4 h-4 mr-2 stroke-2" />
                Reset Document
              </button>
            </div>
          )} 
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
          {/* Gesture Detection Dot */}
          {showGestureDot && (
            <div className="absolute right-5 top-5 w-2 h-2 bg-black rounded-full z-50" />
          )}
        <div className="mb-14">
          <TextEditor gestures={gestures} gestureUsed={gestureUsed}/>
        </div>
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-[75]">
          <div className={`relative w-[280px] h-[210px] ${!isDeveloperMode && 'hidden'} bg-black rounded-lg shadow-lg`}>
            <video ref={videoRef} className="absolute top-0 left-0 w-full h-full rounded-lg"/>
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-lg" />
          </div>
        </div>
      </div>
    </>
  )
}

export default App
