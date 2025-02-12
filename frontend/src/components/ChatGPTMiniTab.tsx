import { useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const ChatGPTMiniTab = () => {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSend = async () => {
    if (!input.trim()) return;

    setMessages([...messages, { role: 'user', content: input }]);

    try {
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: input }],
        }),
      });

      const data = await response.json();
      setMessages([...messages, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages([...messages, { role: 'assistant', content: 'Error processing request' }]);
    }

    setInput('');
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-100 shadow-lg rounded-2xl p-4 w-96 border border-gray-300">
      <div className="h-80 overflow-y-auto p-4 bg-white rounded-lg border border-gray-300 shadow-inner space-y-3">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-900 rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message ChatGPT"
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-full transition-all"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatGPTMiniTab;
