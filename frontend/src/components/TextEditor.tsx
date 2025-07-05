import { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './TextEditor.css';

import CommentSidebar from './CommentSidebar';
import ChatGPTMiniTab from './ChatGPTMiniTab';

import { Gestures } from '../types/gestures';
import { Comment } from '../types/comment';
import { BoldIcon, ChatBubbleLeftIcon, CommandLineIcon, TrashIcon } from '@heroicons/react/24/outline';

// Constants
const COMMENT_COLOR = '#fef9c3';
const COMMENT_SELECTED_COLOR = '#ffd54f';
const STORAGE_KEY = 'document_data';

const TextEditor = ({ gestures, gestureUsed }: { gestures: Gestures, gestureUsed: boolean }) => {
  const resultedGestures: Gestures = {
    isHeadTilt: gestures.isHeadTilt,
    isHeadShake: gestures.isHeadShake,
    isHeadTiltUp: gestures.isHeadTiltUp,
    isHeadNod: gestures.isHeadNod,
  };

  // State
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return data.content || '';
    }
    return '';
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return data.comments || [];
    }
    return [];
  });

  const [isFocused, setIsFocused] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentRange, setCommentRange] = useState<{index: number, length: number} | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [showChatGPTPopup, setShowChatGPTPopup] = useState(false);

  // Refs
  const quillRef = useRef<any>(null);
  const prevGesturesRef = useRef(resultedGestures);

  // Utility Functions
  const highlight = (color: string, position: number, length: number | null) => {
    if (quillRef.current && length !== null) {
      const quill = quillRef.current.getEditor();
      quill.formatText(position, length, 'background', color);
    } else {
      console.log('No length provided.');
    }
  }

  // Editor Handlers
  const handleBold = () => {
    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();
    if (selection.length > 0) {
      const format = quill.getFormat(selection);
      const isBold = Boolean(format.bold);
      quill.formatText(selection.index, selection.length, 'bold', !isBold);
    }
  }

  const handleComment = () => {
    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();
    if (selection.length > 0) {
      setCommentRange({index: selection.index, length: selection.length});
      highlight(COMMENT_SELECTED_COLOR, selection.index, selection.length);
      quill.setSelection(null);
      setShowCommentInput(true);
    }
  }

  const handleDelete = () => {
    const quill = quillRef.current.getEditor();
    const quillText = quill.getText();
    const selection = quill.getSelection();
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

  // Comment Handlers
  const handleCommentClick = (position: number, length: number) => {
    comments.forEach(comment => {
      highlight(COMMENT_COLOR, comment.range.index, comment.range.length);
    });
    highlight(COMMENT_SELECTED_COLOR, position, length);
  };

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

  // Effects
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
      if (resultedGestures.isHeadTilt) {
        handleComment();
      }

      // Handle nod gesture
      if (resultedGestures.isHeadNod) {
        handleBold();
      }

      // Handle shake gesture
      if (resultedGestures.isHeadShake && selection) {
        handleDelete();
      }
    });
  }, [resultedGestures, isFocused]);

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

  useEffect(() => {
    const data = { content: value, comments };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [value, comments]);

  return (
    <div className="h-screen flex">
      <div 
        className="flex-1 flex flex-col items-center"
        onClick={() => {
          if (quillRef.current) {
            const quill = quillRef.current.getEditor();
            quill.focus();
          }
        }}
      >
        {!gestureUsed && <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-10 w-[850px] flex gap-2 ml-4">
          <button 
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors flex items-center gap-1.5 text-sm"
            onClick={handleBold}
          >
            <BoldIcon className="w-4 h-4" />
            Bold
          </button>
          <button 
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors flex items-center gap-1.5 text-sm"
            onClick={handleComment}
          >
            <ChatBubbleLeftIcon className="w-4 h-4" />
            Comment
          </button>
          <button 
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors flex items-center gap-1.5 text-sm"
            onClick={() => setShowChatGPTPopup(true)}
          >
            <CommandLineIcon className="w-4 h-4" />
            ChatGPT
          </button>
          <button 
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors flex items-center gap-1.5 text-sm"
            onClick={handleDelete}
          >
            <TrashIcon className="w-4 h-4" />
            Delete Word
          </button>
        </div>}
        <div className="w-[850px] mt-8">
          <ReactQuill 
            ref={quillRef} 
            value={value} 
            onChange={setValue}
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