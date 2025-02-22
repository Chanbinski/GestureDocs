import { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './TextEditor.css';
import Quill from 'quill';
import CommentSidebar from './CommentSidebar';
import ChatGPTMiniTab from './ChatGPTMiniTab';

// Register custom font sizes with Quill
const Size = Quill.import('attributors/style/size');
Size.whitelist = ['8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '18pt', '24pt', '30pt', '36pt', '48pt', '60pt'];
Quill.register(Size, true);

const COMMENT_COLOR = '#fef9c3';
const COMMENT_SELECTED_COLOR = '#ffd54f';

interface GestureFeatures {
  isHeadTilt: boolean;
  isHeadShake: boolean;
  isHeadTiltUp: boolean;
  isHeadNod: boolean;
}

interface Comment {
  id: string;
  text: string;
  range: {
    index: number;
    length: number;
  };
}

const TextEditor = ({ gestures }: { gestures: GestureFeatures }) => {
  const resultedGestures: GestureFeatures = {
    isHeadTilt: gestures.isHeadTilt,
    isHeadShake: gestures.isHeadShake,
    isHeadTiltUp: gestures.isHeadTiltUp,
    isHeadNod: gestures.isHeadNod,
  };

  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const quillRef = useRef<any>(null); // Ref to ReactQuill instance
  const prevGesturesRef = useRef(resultedGestures);

  const [comments, setComments] = useState<Comment[]>([]);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentRange, setCommentRange] = useState<{index: number , length: number} | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  // Add state for the popup
  const [showChatGPTPopup, setShowChatGPTPopup] = useState(false);

  const highlight = (color: string, position: number, length: number | null) => {
    if (quillRef.current && length !== null) {
      const quill = quillRef.current.getEditor();
      quill.formatText(position, length, 'background', color);
    }
  }

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

  // Text Editor Style
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

  // Gesture Detection
  useEffect(() => {
    // Skip if gestures haven't changed
    if (JSON.stringify(prevGesturesRef.current) === JSON.stringify(resultedGestures)) return;
    
    prevGesturesRef.current = resultedGestures;

    if (!quillRef.current || !isFocused) return;

    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();

    requestAnimationFrame(() => {
      // Handle shrug gesture to open ChatGPT popup
      if (resultedGestures.isHeadTiltUp) {
        setShowChatGPTPopup(true);
      }

      // Handle tilt gesture for comments
      if (resultedGestures.isHeadTilt && selection.length > 0) {
        setCommentRange({index: selection.index, length: selection.length});
        highlight(COMMENT_SELECTED_COLOR, selection.index, selection.length);
        quill.setSelection(null);
        setShowCommentInput(true);
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
        const quillText = quill.getText();
        const cursorPosition = selection.index;
        
        // Find the end of the closest word to the left
        let endOfWord = cursorPosition;
        while (endOfWord > 0 && /\s/.test(quillText[endOfWord - 1])) {
          endOfWord--;
        }
        
        // Find the start of this word
        let startOfWord = endOfWord;
        while (startOfWord > 0 && !/\s/.test(quillText[startOfWord - 1])) {
          startOfWord--;
        }
        
        // Delete the word if we found one
        if (endOfWord > startOfWord) {
          quill.deleteText(startOfWord, endOfWord - startOfWord);
          // Set cursor position to where the word ended
          quill.setSelection(startOfWord, 0);
        }
      }
    });
  }, [resultedGestures, isFocused]);

  // Update Comment Ranges
  useEffect(() => {
    if (!quillRef.current) return;
    
    const quill = quillRef.current.getEditor();
    
    const handleTextChange = (delta: any) => {
      // Calculate the length change and position from the delta
      const changes = delta.ops.reduce((acc: {index: number, length: number}, op: any) => {
        if (op.retain) {
          acc.index += op.retain;
        }
        if (op.insert) {
          acc.length += typeof op.insert === 'string' ? op.insert.length : 1;
        }
        if (op.delete) {
          acc.length -= op.delete;
        }
        return acc;
      }, { index: 0, length: 0 });

      // Update all comment ranges that come after the change
      setComments(prevComments => 
        prevComments.map(comment => {
          if (comment.range.index > changes.index) {
            // If comment is after the change, shift its position
            return {
              ...comment,
              range: {
                index: comment.range.index + changes.length,
                length: comment.range.length
              }
            };
          }
          if (comment.range.index + comment.range.length > changes.index) {
            // If change is within the comment, adjust its length
            return {
              ...comment,
              range: {
                index: comment.range.index,
                length: comment.range.length + changes.length
              }
            };
          }
          return comment;
        })
      );

      setComments(prevComments =>
        prevComments.filter(comment => {
          if (comment.range.length <= 0) {
            return false;
          }
          return true;
        }));
      };

    quill.on('text-change', handleTextChange);
    
    return () => {
      quill.off('text-change', handleTextChange);
    };
  }, []);

  // Text for Comment Click Handling
  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      
      const handleClick = () => {
        const range = quill.getSelection();
        if (!range) return;
        
        const formats = quill.getFormat(range.index);
        if (formats.background === COMMENT_COLOR) {
          const clickedComment = comments.find(comment => 
            range.index >= comment.range.index && 
            range.index < (comment.range.index + comment.range.length)
          );
          
          if (clickedComment) {
            setEditingCommentId(clickedComment.id);
            handleCommentClick(clickedComment.range.index, clickedComment.range.length);
          }
        }
      };

      quill.root.addEventListener('click', handleClick);
      
      return () => {
        quill.root.removeEventListener('click', handleClick);
      };
    }
  }, [comments, editingCommentId]);

  const handleCommentClick = (position: number, length: number) => {
    comments.forEach(comment => {
      highlight(COMMENT_COLOR, comment.range.index, comment.range.length);
    });
    highlight(COMMENT_SELECTED_COLOR, position, length);
  };

  // ADD, UNSELECT is for new comments in the sidebar
  const handleAddComment = (text: string) => {
    if (commentRange && commentRange.length > 0) {
      const newComment = {
        id: Date.now().toString(),
        text: text,
        range: {
          index: commentRange.index,
          length: commentRange.length
        }
      };
      setComments([...comments, newComment]);

      highlight(COMMENT_COLOR, commentRange.index, commentRange.length);
      setCommentText('');
      setCommentRange(null);
      setShowCommentInput(false);

      // Reset cursor format
      if (quillRef.current) {
        const quill = quillRef.current.getEditor();
        const cursorPosition = commentRange.index + commentRange.length;
        quill.setSelection(cursorPosition, 0);  // Move cursor to end of comment
        quill.format('background', false);  // Reset format only at cursor position
      }
    }
  };

  const handleUnselectComment = () => {
    if (commentRange) highlight('', commentRange.index, commentRange.length);
    setCommentText('');
    setCommentRange(null);
    setShowCommentInput(false);
  }

  // UPDATE, CANCEL, DELETE is for already existing comments in the sidebar
  const handleUpdateComment = (id: string, newText: string) => {
    setComments(comments.map(comment => {
      if (comment.id === id) {
        if (quillRef.current) highlight(COMMENT_COLOR, comment.range.index, comment.range.length);
        return { ...comment, text: newText };
      }
      return comment;
    }))
    setEditingCommentId(null);
  };

  const handleCancelComment = (commentIndex: number, commentLength: number) => {
    if (commentIndex && commentLength) {
      highlight(COMMENT_COLOR, commentIndex, commentLength);
    }
  };

  const handleDeleteComment = (id: string) => {
    const commentToDelete = comments.find(comment => comment.id === id);
    if (commentToDelete) {
      highlight('', commentToDelete.range.index, commentToDelete.range.length);
    }
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
      {showChatGPTPopup && (
        <ChatGPTMiniTab onClose={() => setShowChatGPTPopup(false)} />
      )}
    </div>
  );
};

export default TextEditor;