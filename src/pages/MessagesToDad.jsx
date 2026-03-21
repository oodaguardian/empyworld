import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';

export default function MessagesToDad() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'I love you Daddy! 💖', date: 'Today', emoji: '😍' },
    { id: 2, text: 'Look what I drew!', date: 'Yesterday', emoji: '🎨' },
    { id: 3, text: 'Can we go to the park?', date: '2 days ago', emoji: '🏞️' },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      { id: Date.now(), text: input.trim(), date: 'Just now', emoji: '💌' },
      ...prev,
    ]);
    setInput('');
  };

  return (
    <PageLayout title="Messages to Dad" icon="💌">
      <div className="flex flex-col h-full gap-3">
        {/* Message list */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="empy-card p-3 sm:p-4 flex-row !flex-row !items-start gap-3"
            >
              <span className="text-2xl sm:text-3xl flex-shrink-0">{msg.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-body text-sm sm:text-base">{msg.text}</p>
                <p className="text-white/40 font-body text-xs mt-1">{msg.date}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message to Dad..."
            className="input input-bordered flex-1 bg-empy-black/50 border-empy-pink/30 text-white placeholder-white/30 font-body text-sm sm:text-base"
            maxLength={200}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            className="btn bg-empy-pink border-empy-pink text-white hover:bg-empy-pink-dark font-display text-sm sm:text-base"
          >
            Send 💌
          </motion.button>
        </div>
      </div>
    </PageLayout>
  );
}
