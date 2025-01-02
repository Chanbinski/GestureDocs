import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface GestureFeatures {
  tiltLeft: boolean;
  tiltRight: boolean;
  shake: boolean;
}

interface TextEditorProps {
  gestures: GestureFeatures;
}

const TextEditor: React.FC<TextEditorProps> = ({ gestures }) => {
  const [value, setValue] = useState('');
  const quillRef = useRef<any>(null); // Ref to ReactQuill instance
  useEffect(() => {
    //console.log(gestures);
    const isHeadTilted = gestures.tiltLeft || gestures.tiltRight // Head Tilt Left or Right
    const isHeadShake = gestures.shake; // Head Shake

    if (quillRef.current) {
      const quill = quillRef.current.getEditor(); // Access Quill instance

      // Change text format dynamically
      if (isHeadTilted) {
        quill.format("color", "red"); // New text will be red
      } else {
        quill.format("color", "black"); // New text will be black
      }

      // Delete text on head shake
      if (isHeadShake) {
        const selection = quill.getSelection(); // Get the current selection
        if (selection && selection.length > 0) {
          // If text is selected, delete it
          quill.deleteText(selection.index, selection.length);
        } else {
          // If no text is selected, delete the last word
          const text = quill.getText(); // Get all text from the editor
          const lastSpaceIndex = text.trim().lastIndexOf(" "); // Find the last space
          const deleteStart = lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1; // Delete from the last word
          quill.deleteText(deleteStart, text.length - deleteStart); // Delete last word
        }
      }
    }
  }, [gestures]); // Re-run whenever gestures change

  return (
    <div className="editor-container">
      <ReactQuill ref={quillRef} value={value} onChange={setValue} />
    </div>
  );
};

export default TextEditor;