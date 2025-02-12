import { useState, useRef } from 'react'
import TextEditor from './components/TextEditor';
import useWebcam from './hooks/useWebcam'
import useGestureDetection from './hooks/useGestureDetection';
import ChatGPTMiniTab from './components/ChatGPTMiniTab';
import './App.css'
import { FiSettings, FiCommand } from 'react-icons/fi'

interface SidebarOption {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
  isActive?: boolean;
}

function App() {
  const [showMesh, setShowMesh] = useState(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const videoRef = useWebcam();
  const [canvasRef, gestures] = useGestureDetection(videoRef, showMesh);
  const [activePopup, setActivePopup] = useState<string | null>(null);

  const sidebarOptions: SidebarOption[] = [
    {
      id: 'settings',
      icon: <FiSettings className="w-6 h-6 text-white" />,
      title: 'Settings',
      content: (
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
      )
    },
    {
      id: 'gestures',
      icon: <FiCommand className="w-6 h-6 text-white" />,
      title: 'Gestures',
      content: (
        <div className="flex flex-col gap-2">
          <div className={`px-2.5 py-1 rounded text-sm font-medium ${gestures.isHeadTilt ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700"}`}>
            Tilt
          </div>
          <div className={`px-2.5 py-1 rounded text-sm font-medium ${gestures.isHeadShake ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700"}`}>
            Head Shake
          </div>
          <div className={`px-2.5 py-1 rounded text-sm font-medium ${gestures.isShrug ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700"}`}>
            Shoulder Shrug
          </div>
          <div className={`px-2.5 py-1 rounded text-sm font-medium ${gestures.isHeadNod ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700"}`}>
            Nod
          </div>
          <div className={`px-2.5 py-1 rounded text-sm font-medium ${gestures.isMovingCloser ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700"}`}>
            Moving Closer
          </div>
          <div className={`px-2.5 py-1 rounded text-sm font-medium ${gestures.isMovingAway ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700"}`}>
            Moving Away
          </div>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="fixed bottom-5 left-5 flex flex-col gap-4 z-50">
        {sidebarOptions.map((option) => (
          <div key={option.id} className="relative">
            <button 
              className={`p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors ${
                activePopup === option.id ? 'bg-gray-700' : ''
              }`}
              onClick={() => setActivePopup(activePopup === option.id ? null : option.id)}
            >
              {option.icon}
            </button>
            
            {activePopup === option.id && (
              <div className="absolute bottom-0 left-16 bg-white shadow-lg rounded-lg p-3 w-48">
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-bold text-gray-900 mb-2">{option.title}</div>
                  {option.content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

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
