import { useState, useRef, useEffect } from 'react';
import { TrashIcon, ChevronDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';

// Constants
const API_URL = import.meta.env.VITE_API_URL;
const STORAGE_KEY = 'chatgpt_history';
const AUTO_HIDE_DELAY = 30000; // 30 seconds

// Types
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// Storage utilities
const loadMessages = (): Message[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

const saveMessages = (messages: Message[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
};

const ChatGPTMiniTab = ({ onClose }: { onClose: () => void }) => {
  // State
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [streaming, setStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoHideTimeoutRef = useRef<number | null>(null);

  // Effects
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streaming]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      clearAutoHideTimer();
    };
  }, []);

  // Utility functions
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '32px';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, 160)}px`;
    }
  };

  // Auto-hide timer functions
  const startAutoHideTimer = () => {
    clearAutoHideTimer();
    autoHideTimeoutRef.current = setTimeout(() => {
      onClose();
    }, AUTO_HIDE_DELAY);
  };

  const clearAutoHideTimer = () => {
    if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
      autoHideTimeoutRef.current = null;
    }
  };

  // Event handlers
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear chat history? This cannot be undone.')) {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  };

  const handleSend = async () => {
    if (!input.trim() || streaming) return;

    setStreaming(true);
    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setCurrentResponse('');
    
    // Clear input after a short delay to ensure IME is done
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.value = '';
      }
      setInput('');
      adjustTextareaHeight();
    }, 10);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Network error or empty response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.content) {
                assistantMessage += parsed.content;
                setCurrentResponse(assistantMessage);
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error processing request' }]);
    } finally {
      setStreaming(false);
      setCurrentResponse('');
    }
  };

  // Handle copy event to strip formatting
  const handleCopy = (e: React.ClipboardEvent, content: string) => {
    e.preventDefault();
    const selection = window.getSelection();
    const selectedText = selection?.toString() || content;
    e.clipboardData.setData('text/plain', selectedText);
    e.clipboardData.setData('text/html', selectedText);
  };

  // Render message component
  const MessageBubble = ({ message }: { message: Message }) => (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs p-2 rounded ${
          message.role === 'user'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-700'
        }`}
        onCopy={(e) => handleCopy(e, message.content)}
      >
        <p className="text-sm whitespace-pre-wrap break-words select-text">
          {message.content}
        </p>
      </div>
    </div>
  );

  // Render loading indicator
  const LoadingIndicator = () => (
    <div className="flex justify-start">
      <div className="p-2">
        <div className="w-1.5 h-1.5 bg-black rounded-full animate-blink"></div>
      </div>
    </div>
  );

  return (
    <div 
      className="fixed bottom-4 left-4 w-64 bg-white rounded-lg shadow-sm p-3 float"
      onFocus={clearAutoHideTimer}
      onBlur={startAutoHideTimer}
      tabIndex={-1}
    >
      {/* Header */}
      <div className="flex justify-end items-center mb-3 gap-1">
        <button 
          onClick={handleClearHistory}
          className="text-gray-400 hover:text-gray-600 p-1 rounded"
          aria-label="Clear history"
        >
          <TrashIcon className="w-4 h-4 stroke-2" />
        </button>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <ChevronDownIcon className="w-4 h-4 stroke-2" />
        </button>
      </div>

      {/* Messages Container */}
      <div className="h-80 overflow-y-auto space-y-3 mb-2">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        {streaming && (
          currentResponse ? (
            <MessageBubble message={{ role: 'assistant', content: currentResponse }} />
          ) : (
            <LoadingIndicator />
          )
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="mt-2 flex gap-2 items-center">
        <textarea
          id="chatgpt-textarea"
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Message ChatGPT..."
          className="flex-1 p-2 border rounded text-sm min-h-8 resize-none leading-tight"
          rows={1}
        />
        <button 
          onClick={handleSend}
          disabled={streaming}
          className={`text-blue-500 hover:text-blue-600 flex items-center ${streaming ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label="Send message"
        >
          <ArrowUpIcon className="w-4 h-4 stroke-2" />
        </button>
      </div>
    </div>
  );
};

export default ChatGPTMiniTab;
