import React, { useState, useEffect } from 'react';

interface Comment {
  id: string;
  text: string;
  position: number;
  length: number;
}

interface CommentSidebarProps {
  comments: Comment[];
  showCommentInput: boolean;
  commentText: string;
  onCommentTextChange: (text: string) => void;
  onCancel: () => void;
  onAddComment: (text: string) => void;
  onUpdateComment: (id: string, text: string) => void;
  onCommentClick: (position: number, length: number) => void;
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

  // Focus the textarea when showCommentInput becomes true
  React.useEffect(() => {
    if (showCommentInput && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [showCommentInput]);

  useEffect(() => {
    console.log(editingCommentId);
    if (editingCommentId) {
      const comment = comments.find(c => c.id === editingCommentId);
      if (comment) {
        setEditingId(editingCommentId);
        setEditText(comment.text);
        onCommentClick(comment.position, comment.length);
      }
    }
  }, [editingCommentId]);

  return (
    <div className="w-64 h-screen overflow-y-auto fixed right-0 flex-none">
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
                      onCancel();
                      setEditingId(null);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      onDeleteComment(comment.id);
                      setEditingId(null);
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                  <button 
                    onClick={() => {
                      onUpdateComment(comment.id, editText);
                      setEditingId(null);
                    }}
                    className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p 
                className="text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded"
                onClick={() => {
                  onCommentClick(comment.position, comment.length);
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
          <div className="bg-white rounded-lg shadow-sm p-3">
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
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button 
                onClick={() => onAddComment(commentText)}
                className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Comment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSidebar; 