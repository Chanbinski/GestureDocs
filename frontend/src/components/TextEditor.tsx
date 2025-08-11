import { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './TextEditor.css';

import CommentSidebar from './CommentSidebar';
import ChatGPTMiniTab from './ChatGPTMiniTab';
import { StarIcon, ChatBubbleLeftIcon, CommandLineIcon, MinusIcon } from '@heroicons/react/24/outline';

import { Gestures } from '../types/gestures';
import { Comment } from '../types/comment';

const COMMENT_COLOR = '#fef9c3';
const COMMENT_SELECTED_COLOR = '#ffd54f';
const STORAGE_KEY = 'document_data';

// Keyboard bindings to block bold shortcut
const keyboardBindings = {
  // Block bold (Cmd/Ctrl + B)
  bold: {
    key: 'b',
    shortKey: true,
    handler: () => false
  },
  italic: {
    key: 'i',
    shortKey: true,
    handler: () => false
  },
  underline: {
    key: 'u',
    shortKey: true,
    handler: () => false
  },
};

// Quill modules configuration
const modules = {
  keyboard: {
    bindings: keyboardBindings
  },
  toolbar: false
};

const TextEditor = ({ gestures, gestureUsed }: { gestures: Gestures, gestureUsed: boolean }) => {
  // Editor state
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).content || '' : '';
  });
  const [isFocused, setIsFocused] = useState(false);
  const quillRef = useRef<any>(null);

  // Comment state
  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).comments || [] : [];
  });
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentRange, setCommentRange] = useState<{index: number, length: number} | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  // UI state
  const [showChatGPTPopup, setShowChatGPTPopup] = useState(false);

  // Gesture tracking
  const resultedGestures: Gestures = {
    isHeadTilt: gestures.isHeadTilt,
    isHeadShake: gestures.isHeadShake,
    isHeadTiltUp: gestures.isHeadTiltUp,
    isHeadNod: gestures.isHeadNod,
  };
  const prevGesturesRef = useRef(resultedGestures);

  // Text formatting helpers
  const highlight = (color: string, position: number, length: number | null) => {
    if (quillRef.current && length !== null) {
      const quill = quillRef.current.getEditor();
      quill.formatText(position, length, 'background', color);
    }
  };

  const scrollToPosition = (position: number, length: number) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      quill.focus();
      
      quill.setSelection(position + length, 0);
      
      requestAnimationFrame(() => {
        const [leaf] = quill.getLeaf(position);
        const element = leaf.domNode.parentElement || leaf.domNode;
        
        if (element instanceof Element) {
          element.scrollIntoView({ block: 'center', behavior: 'instant' });
        }
      });
    }
  }

  // Editor action handlers
  const handleBold = () => {
    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();
    if (selection.length > 0) {
      const format = quill.getFormat(selection);
      // Check if text already has both dark color and bold
      const currentColor = format.color;
      const currentBold = format.bold;
      const isFormatted = currentColor === 'red' && currentBold;
      
      if (isFormatted) {
        // Remove both color and bold
        quill.formatText(selection.index, selection.length, 'color', false);
        quill.formatText(selection.index, selection.length, 'bold', false);
      } else {
        // Apply both dark blue color and bold
        quill.formatText(selection.index, selection.length, 'color', 'red');
        quill.formatText(selection.index, selection.length, 'bold', true);
      }
    }
  };

  const handleStrikethrough = () => {
    const quill = quillRef.current.getEditor();
    const quillText = quill.getText();
    const selection = quill.getSelection();
    const cursorPosition = selection.index;
    
    let endOfWord = cursorPosition;
    while (endOfWord > 0 && /\s/.test(quillText[endOfWord - 1])) endOfWord--;
    
    let startOfWord = endOfWord;
    while (startOfWord > 0 && !/\s/.test(quillText[startOfWord - 1])) startOfWord--;
    
    if (endOfWord > startOfWord) {
      // Apply strikethrough to the word
      quill.formatText(startOfWord, endOfWord - startOfWord, 'strike', true);
      quill.setSelection(startOfWord, 0);
    }
  };

  // Comment handlers
  const handleComment = () => {
    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();
    if (selection.length > 0) {
      setCommentRange({index: selection.index, length: selection.length});
      highlight(COMMENT_SELECTED_COLOR, selection.index, selection.length);
      setShowCommentInput(true);
    }
  };

  const handleCommentClick = (position: number, length: number) => {
    comments.forEach(comment => {
      highlight(COMMENT_COLOR, comment.range.index, comment.range.length);
    });
    highlight(COMMENT_SELECTED_COLOR, position, length);
    scrollToPosition(position, length);
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

      if (quillRef.current) {
        const quill = quillRef.current.getEditor();
        scrollToPosition(commentRange.index + commentRange.length, 0);
        quill.format('background', false);
      }
    }
  };

  const handleUnselectComment = () => {
    if (commentRange) highlight('', commentRange.index, commentRange.length);
    setCommentText('');
    setCommentRange(null);
    setShowCommentInput(false);
  };

  const handleUpdateComment = (id: string, newText: string) => {
    setComments(comments.map(comment => {
      if (comment.id === id) {
        if (quillRef.current) highlight(COMMENT_COLOR, comment.range.index, comment.range.length);
        return { ...comment, text: newText };
      }
      return comment;
    }));
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
  // Handle default size for editor
  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      editor.root.style.fontSize = '11pt';
      editor.format('size', '11pt');
      
      const sizePickerLabel = document.querySelector('.ql-size .ql-picker-label');
      if (sizePickerLabel) {
        sizePickerLabel.setAttribute('data-value', '11pt');
      }
    }
  }, []);

  // Handle gesture detection
  useEffect(() => {
    if (JSON.stringify(prevGesturesRef.current) === JSON.stringify(resultedGestures)) return;
    prevGesturesRef.current = resultedGestures;

    if (!quillRef.current) return;

    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();

    requestAnimationFrame(() => {
      if (resultedGestures.isHeadTiltUp) {
        setShowChatGPTPopup(true);
        // Focus the ChatGPT textarea
        const textarea = document.getElementById('chatgpt-textarea') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
        }
      }
      if (resultedGestures.isHeadTilt && selection.length > 0) handleComment();
      if (resultedGestures.isHeadNod && selection.length > 0) handleBold();
      if (resultedGestures.isHeadShake) handleStrikethrough();
    });
  }, [resultedGestures, isFocused]);

  // Handle comment
  useEffect(() => {
    if (!quillRef.current) return;
    
    const quill = quillRef.current.getEditor();
    
    const handleTextChange = (delta: any) => {
      const changes = delta.ops.reduce((acc: {index: number, length: number}, op: any) => {
        if (op.retain) acc.index += op.retain;
        if (op.insert) acc.length += typeof op.insert === 'string' ? op.insert.length : 1;
        if (op.delete) acc.length -= op.delete;
        return acc;
      }, { index: 0, length: 0 });

      setComments(prevComments => 
        prevComments.map(comment => {
          if (comment.range.index > changes.index && comment.range.index + comment.range.length < changes.index - changes.length) {
            return {
              ...comment,
              range: {
                index: comment.range.index,
                length: 0
              }
            };
          }
          if (comment.range.index > changes.index) {
            return {
              ...comment,
              range: {
                index: comment.range.index + changes.length,
                length: comment.range.length
              }
            };
          }
          if (comment.range.index + comment.range.length > changes.index) {
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
        prevComments.filter(comment => comment.range.length > 0)
      );
    };

    quill.on('text-change', handleTextChange);
    return () => quill.off('text-change', handleTextChange);
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
      return () => quill.root.removeEventListener('click', handleClick);
    }
  }, [comments, editingCommentId]);

  // Handle local storage
  useEffect(() => {
    const data = { content: value, comments };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [value, comments]);

  return (
    <div className="h-screen flex">
      <div 
        className="flex-1 flex flex-col items-center"
      >
        {!gestureUsed && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="w-[840px] flex justify-end gap-2">
              <button 
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors flex items-center gap-1.5 text-sm"
                onClick={handleBold}
              >
                <StarIcon className="w-5 h-5" />
              </button>
              <button 
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors flex items-center gap-1.5 text-sm"
                onClick={handleStrikethrough}
              >
                <MinusIcon className="w-5 h-5" />
              </button>
              <button 
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors flex items-center gap-1.5 text-sm"
                onClick={handleComment}
              >
                <ChatBubbleLeftIcon className="w-5 h-5" />
              </button>
              <button 
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors flex items-center gap-1.5 text-sm"
                onClick={() => setShowChatGPTPopup(true)}
              >
                <CommandLineIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        <div className="w-[850px] mt-8">
          <ReactQuill 
            ref={quillRef} 
            value={value} 
            onChange={setValue}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            modules={modules}
            scrollingContainer="html"
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