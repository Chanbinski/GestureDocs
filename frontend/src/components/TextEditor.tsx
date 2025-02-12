import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './TextEditor.css';
import Quill from 'quill';

// Register custom font sizes with Quill
const Size = Quill.import('attributors/style/size');
Size.whitelist = ['8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '18pt', '24pt', '30pt', '36pt', '48pt', '60pt'];
Quill.register(Size, true);

interface GestureFeatures {
  isHeadTilt: boolean;
  isHeadShake: boolean;
  isShrug: boolean;
  isHeadNod: boolean;
  isMovingCloser: boolean;
  isMovingAway: boolean;
}

const TextEditor = ({ gestures }: { gestures: GestureFeatures }) => {
  const resultedGestures: GestureFeatures = {
    isHeadTilt: gestures.isHeadTilt,
    isHeadShake: gestures.isHeadShake,
    isShrug: gestures.isShrug,
    isHeadNod: gestures.isHeadNod,
    isMovingCloser: gestures.isMovingCloser,
    isMovingAway: gestures.isMovingAway,
  };

  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const quillRef = useRef<any>(null); // Ref to ReactQuill instance
  const prevGesturesRef = useRef(resultedGestures);

  // Set default size
  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      editor.format('size', '11pt');  // Use pt to match the Size whitelist
    }
  }, []);

  // Gesture detection
  useEffect(() => {
    // Skip if gestures haven't changed
    if (JSON.stringify(prevGesturesRef.current) === JSON.stringify(resultedGestures)) {
      return;
    }
    prevGesturesRef.current = resultedGestures;

    if (!quillRef.current || !isFocused) return;

    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();

    // Batch all formatting operations
    requestAnimationFrame(() => {
      // Handle color formatting
      if (resultedGestures.isHeadTilt !== prevGesturesRef.current.isHeadTilt) {
        // Add comment
      }

      // Handle nod gesture
      if (resultedGestures.isHeadNod && selection?.length > 0) {
        const format = quill.getFormat(selection);
        const isBold = Boolean(format.bold);  // Ensure we have a boolean value
        quill.formatText(selection.index, selection.length, 'bold', !isBold);
        //quill.format('bold', false); // Reset cursor formatting
      }

      // Handle shake gesture
      if (resultedGestures.isHeadShake && selection) {
        if (selection.length > 0) {
          quill.deleteText(selection.index, selection.length);
        } else {
          const text = quill.getText();
          const lastSpaceIndex = text.trim().lastIndexOf(" ");
          const deleteStart = lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1;
          quill.deleteText(deleteStart, text.length - deleteStart);
        }
      }
    });
  }, [resultedGestures, isFocused]);

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
    // Set default size when editor is initialized
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      editor.root.style.fontSize = '11pt';  // Set default size
      editor.format('size', '11pt');  // Set default size for new text
      
      const sizePickerLabel = document.querySelector('.ql-size .ql-picker-label');
      if (sizePickerLabel) {
        sizePickerLabel.setAttribute('data-value', '11pt');
      }
    }
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex flex-col relative">
        <ReactQuill 
          ref={quillRef} 
          value={value} 
          onChange={setValue}
          modules={modules}
          formats={formats}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 flex flex-col"
        />
      </div>
    </div>
  );
};

export default TextEditor;