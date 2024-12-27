import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const TextEditor: React.FC = () => {
  const [value, setValue] = useState('');

  return (
    <div className="editor-container">
      <ReactQuill value={value} onChange={setValue} />
    </div>
  );
};

export default TextEditor;