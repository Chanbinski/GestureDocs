import React, { useState, useEffect } from 'react';
import { Comment } from '../types/comment';

interface CommentSidebarProps {
  comments: Comment[];
  showCommentInput: boolean;
  commentText: string;
  onCommentTextChange: (text: string) => void;
  onCancel: (index: number, length: number) => void;
  onAddComment: (text: string) => void;
  onUpdateComment: (id: string, text: string) => void;
  onCommentClick: (index: number, length: number) => void;
  onDeleteComment: (id: string) => void;
  onUnselectComment: () => void;
  editingCommentId: string | null;
}

const CommentSidebar = ({
  comments,
  showCommentInput,
  commentText,
  onCommentTextChange,
  onCancel,
  onAddComment,
  onUpdateComment,
  onCommentClick,
  onDeleteComment,
  onUnselectComment,
  editingCommentId,
}: CommentSidebarProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const commentInputRef = React.useRef<HTMLTextAreaElement>(null);
  const commentEditorRef = React.useRef<HTMLDivElement>(null);

  // Handle keyboard shortcut for adding comments
  useEffect(() => {
    let isMetaPressed = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        isMetaPressed = true;
      }
      
      if (showCommentInput && 
          commentText.trim() !== '' && 
          isMetaPressed && 
          e.key === 'Enter') {
        e.preventDefault();
        // Clear input after a short delay to ensure IME is done
        setTimeout(() => {
          if (commentInputRef.current) {
            commentInputRef.current.value = '';
          }
          onCommentTextChange('');
        }, 10);
        onAddComment(commentText);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) {
        isMetaPressed = false;
      }
    };

    if (showCommentInput) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [showCommentInput, commentText, onAddComment]);

  // Focus the textarea when showCommentInput becomes true
  useEffect(() => {
    if (showCommentInput && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [showCommentInput]);

  useEffect(() => {
    if (editingCommentId) {
      const comment = comments.find(c => c.id === editingCommentId);
      if (comment) {
        setEditingId(editingCommentId);
        setEditText(comment.text);
        onCommentClick(comment.range.index, comment.range.length);
      }
    }
  }, [editingCommentId]);

  // Handle clicks outside the comment editor
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCommentInput && commentEditorRef.current && !commentEditorRef.current.contains(event.target as Node)) {
        onUnselectComment();
      }
    };
    if (showCommentInput) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCommentInput, onUnselectComment]); 

  return (
    <div className="w-64 h-screen overflow-y-auto fixed right-0 flex-none float">
      <div className="p-4">
        {comments.map(comment => (
          <div key={comment.id} className="mb-3 bg-white rounded-lg shadow-sm p-3">
            {editingId === comment.id ? (
              <div>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-2 border rounded mb-2 text-sm"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => {
                      onCancel(comment.range.index, comment.range.length);
                      setEditingId(null);
                    }}
                    className="p-1 text-gray-600 hover:text-gray-800 rounded-full"
                    aria-label="Cancel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => {
                      onDeleteComment(comment.id);
                      setEditingId(null);
                    }}
                    className="p-1 text-red-600 hover:text-red-800 rounded-full"
                    aria-label="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => {
                      onUpdateComment(comment.id, editText);
                      setEditingId(null);
                    }}
                    className="p-1 text-blue-500 hover:text-blue-600 rounded-full"
                    aria-label="Save"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <p 
                className="text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded"
                onClick={() => {
                  onCommentClick(comment.range.index, comment.range.length);
                  setEditingId(comment.id);
                  setEditText(comment.text);
                }}
              >
                {comment.text}
              </p>
            )}
          </div>
        ))}
        
        {showCommentInput && (
          <div ref={commentEditorRef} className="bg-white rounded-lg shadow-sm p-3">
            <textarea
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => onCommentTextChange(e.target.value)}
              className="w-full p-2 border rounded text-sm"
              placeholder="Add a comment..."
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button 
                onClick={onUnselectComment}
                className="p-1 text-gray-600 hover:text-gray-800 rounded-full"
                aria-label="Cancel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button 
                onClick={() => onAddComment(commentText)}
                className="p-1 text-blue-500 hover:text-blue-600 rounded-full"
                aria-label="Add comment"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSidebar; 