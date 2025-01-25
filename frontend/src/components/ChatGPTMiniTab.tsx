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

    const newMessage: Message = { role: 'user', content: input };
    setMessages([...messages, newMessage]);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer YOUR_OPENAI_API_KEY`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [...messages, newMessage],
        }),
      });

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.choices[0].message.content };

      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    }

    setInput('');
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 w-80">
      <div className="h-60 overflow-y-auto border-b mb-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
            <p className={`p-2 ${msg.role === 'user' ? 'bg-blue-200' : 'bg-gray-200'} rounded`}>
              {msg.content}
            </p>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask ChatGPT..."
        className="w-full border rounded p-2"
      />
      <button onClick={handleSend} className="bg-blue-500 text-white p-2 rounded mt-2 w-full">
        Send
      </button>
    </div>
  );
};

export default ChatGPTMiniTab;
