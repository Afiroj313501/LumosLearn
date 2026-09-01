import { useState, useRef, useEffect } from 'react';
import { askAssistant } from '../api/chat';
import type { ChatMessage } from '../api/chat';
import './StudyAssistant.css';

const StudyAssistant = ({ courseId }: { courseId: string }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await askAssistant(courseId, userMessage.content, messages);
      setMessages([...newMessages, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I ran into an error. Try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button className="assistant-fab" onClick={() => setOpen(!open)}>
        {open ? 'Close' : 'Ask AI'}
      </button>

      {open && (
        <div className="assistant-panel">
          <div className="assistant-header">
            <span>Study Assistant</span>
          </div>

          <div className="assistant-messages" ref={scrollRef}>
            {messages.length === 0 && (
              <p className="assistant-empty">
                Ask me anything about this course's content.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'msg msg-user' : 'msg msg-assistant'}>
                {m.content}
              </div>
            ))}
            {loading && <div className="msg msg-assistant msg-loading">Thinking...</div>}
          </div>

          <div className="assistant-input-row">
            <textarea
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default StudyAssistant;