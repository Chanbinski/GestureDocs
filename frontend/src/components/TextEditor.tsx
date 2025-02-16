import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './TextEditor.css';
import Quill from 'quill';
import CommentSidebar from './CommentSidebar';

// Register custom font sizes with Quill
const Size = Quill.import('attributors/style/size');
Size.whitelist = ['8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '18pt', '24pt', '30pt', '36pt', '48pt', '60pt'];
Quill.register(Size, true);

const COMMENT_COLOR = '#fef9c3';
const COMMENT_SELECTED_COLOR = '#ffd54f';

interface GestureFeatures {
  isHeadTilt: boolean;
  isHeadShake: boolean;
  isShrug: boolean;
  isHeadNod: boolean;
  isMovingCloser: boolean;
  isMovingAway: boolean;
}

interface Comment {
  id: string;
  text: string;
  position: number;
  length: number;
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

  const [comments, setComments] = useState<Comment[]>([]);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentPosition, setCommentPosition] = useState(0);
  const [commentLength, setCommentLength] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  // Gesture detection
  useEffect(() => {
    // Skip if gestures haven't changed
    if (JSON.stringify(prevGesturesRef.current) === JSON.stringify(resultedGestures)) return;
    
    prevGesturesRef.current = resultedGestures;

    if (!quillRef.current || !isFocused) return;

    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();

    // Handle tilt gesture for comments
    if (resultedGestures.isHeadTilt && selection.length > 0) {
      setCommentPosition(selection.index);
      setCommentLength(selection.length);
      quill.formatText(selection.index, selection.length, 'background', COMMENT_SELECTED_COLOR);
      quill.setSelection(null);
      setShowCommentInput(true);
    }

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

  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      
      const handleClick = (e: MouseEvent) => {
        const range = quill.getSelection();
        if (!range) return;
        
        const formats = quill.getFormat(range.index);
        if (formats.background === COMMENT_COLOR) {
          const clickedComment = comments.find(comment => 
            range.index >= comment.position && 
            range.index < (comment.position + comment.length)
          );
          
          if (clickedComment) {
            setEditingCommentId(clickedComment.id);
          }
        }
      };

      quill.root.addEventListener('click', handleClick);
      
      return () => {
        quill.root.removeEventListener('click', handleClick);
      };
    }
  }, [comments, editingCommentId]);

  
  const handleAddComment = (text: string) => {
    if (text.trim()) {
      const newComment = {
        id: Date.now().toString(),
        text: text,
        position: commentPosition,
        length: commentLength || 1
      };
      
      setComments(prev => [...prev, newComment]);
      
      // Apply highlight to the new comment's text
      if (quillRef.current) {
        const quill = quillRef.current.getEditor();
        quill.formatText(newComment.position, newComment.length, 'background', COMMENT_COLOR);
      }
      
      setCommentText('');
      setShowCommentInput(false);
    }
  };

  const highlight = (color: string, position: number, length: number | null) => {
    if (quillRef.current && length !== null) {
      const quill = quillRef.current.getEditor();
      quill.formatText(position, length, 'background', color);
    }
  }

  // For new comments
  const handleUnselectComment = () => {
    setShowCommentInput(false);
    highlight('', commentPosition, commentLength);
  }

  // For already existing comments
  const handleCancelComment = () => {
    setShowCommentInput(false);
    highlight(COMMENT_COLOR, commentPosition, commentLength);
  };

  const handleUpdateComment = (id: string, newText: string) => {
    setComments(comments.map(comment => {
      if (comment.id === id) {
        if (quillRef.current) {
          const quill = quillRef.current.getEditor();
          quill.formatText(comment.position, comment.length, 'background', COMMENT_COLOR);
        }
        return { ...comment, text: newText };
      }
      return comment;
    }))
  };

  const handleCommentClick = (position: number, length: number) => {
    // First, unhighlight all comments
    comments.forEach(comment => {
      highlight(COMMENT_COLOR, comment.position, comment.length);
    });
    
    // Then highlight the clicked comment
    highlight(COMMENT_SELECTED_COLOR, position, length);
  };

  const handleDeleteComment = (id: string) => {
    handleUnselectComment();
    setComments(prev => prev.filter(comment => comment.id !== id));
  };

  return (
    <div className="h-screen flex">
      <div className="flex-1 flex justify-center">
        <div className="w-[850px]">
          <ReactQuill 
            ref={quillRef} 
            value={value} 
            onChange={setValue}
            modules={modules}
            formats={formats}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>
      </div>
      <CommentSidebar
        comments={comments}
        showCommentInput={showCommentInput}
        editingCommentId={editingCommentId}
        commentText={commentText}
        onCommentTextChange={setCommentText}
        onUnselectComment={handleUnselectComment}
        onCancel={handleCancelComment}
        onAddComment={handleAddComment}
        onUpdateComment={handleUpdateComment}
        onCommentClick={handleCommentClick}
        onDeleteComment={handleDeleteComment}
      />
    </div>
  );
};

export default TextEditor;