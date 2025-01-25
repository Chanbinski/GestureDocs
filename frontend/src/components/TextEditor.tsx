import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './TextEditor.css';
import Quill from 'quill';

// Register custom font sizes with Quill
const Size = Quill.import('attributors/style/size');
Size.whitelist = ['8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '18pt', '24pt', '30pt', '36pt', '48pt', '60pt'];
Quill.register(Size, true);

type GestureFeatures = {
  tiltLeft: boolean;
  tiltRight: boolean;
  shake: boolean;
}

type TextEditorProps = {
  gestures: GestureFeatures;
}

const TextEditor: React.FC<TextEditorProps> = ({ gestures }) => {
  const [title, setTitle] = useState('');
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

  // Add toolbar configuration
  const modules = {
    toolbar: [
      [{ 'size': Size.whitelist }],  // Use the registered sizes
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ]
  };

  const formats = [
    'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet'
  ];

  useEffect(() => {
    // Set default size on mount
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      editor.format('size', '11pt'); // Google Docs default size
      
      const sizePickerLabel = document.querySelector('.ql-size .ql-picker-label');
      if (sizePickerLabel) {
        sizePickerLabel.setAttribute('data-value', '11pt');
      }
    }
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <input 
        className="text-3xl mb-5 border-none outline-none" 
        value={title} 
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled Document"
      />
      <div className="flex-1 flex flex-col relative">
        <ReactQuill 
          ref={quillRef} 
          value={value} 
          onChange={setValue}
          modules={modules}
          formats={formats}
          className="flex-1 flex flex-col"
        />
      </div>
    </div>
  );
};

export default TextEditor;