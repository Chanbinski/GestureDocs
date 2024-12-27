import { useState } from 'react'
import TextEditor from './components/TextEditor';
import './App.css'

function App() {

  return (
    <>
      <div className="text-3xl font-bold text-black-500 mb-5">GestureDocs</div>
      <TextEditor />
    </>
  )
}

export default App
