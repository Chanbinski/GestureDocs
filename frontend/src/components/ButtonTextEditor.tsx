import { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './TextEditor.css';
import Quill from 'quill';
import CommentSidebar from './CommentSidebar';
import ChatGPTMiniTab from './ChatGPTMiniTab';
import { FiBold, FiMessageSquare, FiTrash2, FiMessageCircle } from 'react-icons/fi';

const Size = Quill.import('attributors/style/size');
Size.whitelist = ['8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '18pt', '24pt', '30pt', '36pt', '48pt', '60pt'];
Quill.register(Size, true);

const COMMENT_COLOR = '#fef9c3';
const COMMENT_SELECTED_COLOR = '#ffd54f';

interface Comment {
  id: string;
  text: string;
  range: { index: number; length: number; };
}

const ButtonTextEditor = () => {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const quillRef = useRef<any>(null);
  const [showChatGPTPopup, setShowChatGPTPopup] = useState(false);
  
  // Comment state
  const [comments, setComments] = useState<Comment[]>([]);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentRange, setCommentRange] = useState<{index: number, length: number} | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const handleBoldClick = () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    
    const selection = quill.getSelection();
    if (!selection || !selection.length) return;

    const format = quill.getFormat(selection);
    quill.formatText(selection.index, selection.length, 'bold', !format.bold);
  };

  const handleCommentClick = () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    
    const selection = quill.getSelection();
    if (!selection || !selection.length) return;

    setCommentRange(selection);
    highlight(COMMENT_SELECTED_COLOR, selection.index, selection.length);
    quill.setSelection(null);
    setShowCommentInput(true);
  };

  const handleDeleteClick = () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    
    const selection = quill.getSelection();
    if (!selection) return;

    // Find word boundaries
    const text = quill.getText();
    let start = selection.index;
    while (start > 0 && !/\s/.test(text[start - 1])) start--;
    let end = start;
    while (end < text.length && !/\s/.test(text[end])) end++;
    
    quill.deleteText(start, end - start);
  };

  // ... Copy all the comment-related functions from TextEditor.tsx ...
  // (handleAddComment, handleUnselectComment, handleUpdateComment, etc.)

  return (
    <div className="h-screen flex">
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b p-2 flex gap-2">
          <button onClick={handleBoldClick} className="p-2 hover:bg-gray-100 rounded">
            <FiBold />
          </button>
          <button onClick={handleCommentClick} className="p-2 hover:bg-gray-100 rounded">
            <FiMessageSquare />
          </button>
          <button onClick={handleDeleteClick} className="p-2 hover:bg-gray-100 rounded">
            <FiTrash2 />
          </button>
          <button onClick={() => setShowChatGPTPopup(true)} className="p-2 hover:bg-gray-100 rounded">
            <FiMessageCircle />
          </button>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="w-[850px]">
            <ReactQuill 
              ref={quillRef}
              value={value}
              onChange={setValue}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
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

export default ButtonTextEditor; 