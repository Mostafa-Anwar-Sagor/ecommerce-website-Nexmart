import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, MessageCircle, Image as ImageIcon } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import api from '../../services/api';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export default function ChatPage() {
  const { user, accessToken } = useSelector((s: RootState) => s.auth);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!accessToken) { navigate('/login'); return; }
    socket = io({ auth: { token: accessToken } });
    socket.on('new:message', (msg: any) => {
      setMessages(prev => [...prev, msg]);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
    socket.on('user:typing', ({ userId }: any) => {
      if (userId !== user?.id) { setTyping(true); setTimeout(() => setTyping(false), 3000); }
    });
    api.get('/chat/conversations').then(r => setConversations(r.data.data?.conversations || [])).finally(() => setLoading(false));
    return () => { socket?.disconnect(); };
  }, [accessToken]);

  useEffect(() => {
    if (!activeConv) return;
    socket?.emit('join:conversation', activeConv.id);
    api.get(`/chat/conversations/${activeConv.id}/messages`).then(r => {
      setMessages(r.data.data?.messages || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
  }, [activeConv]);

  const sendMessage = () => {
    if (!input.trim() || !activeConv) return;
    socket?.emit('send:message', { conversationId: activeConv.id, content: input });
    setInput('');
  };

  const onType = (val: string) => {
    setInput(val);
    if (activeConv) socket?.emit('typing:start', { conversationId: activeConv.id });
  };

  const partner = (conv: any) => conv.buyer?.id === user?.id ? conv.seller : conv.buyer;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><MessageCircle className="w-6 h-6 text-primary" /> Messages</h1>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden flex h-[600px]">
          {/* Conversation list */}
          <div className="w-72 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300">Chats</div>
            {loading ? <div className="p-4 text-sm text-gray-400">Loading…</div> : conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No conversations yet</div>
            ) : (
              <div className="overflow-y-auto flex-1">
                {conversations.map((conv: any) => {
                  const p = partner(conv);
                  return (
                    <button key={conv.id} onClick={() => setActiveConv(conv)}
                      className={`w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 ${activeConv?.id === conv.id ? 'bg-primary/5' : ''}`}>
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <span className="font-bold text-primary text-sm">{p?.name?.[0] || '?'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{p?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{conv.lastMessage || 'Start chatting!'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message thread */}
          {activeConv ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300">{partner(activeConv)?.name}</div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg: any) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${isMine ? 'bg-primary text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'}`}>
                        {msg.imageUrl && <img src={msg.imageUrl} alt="" className="mb-2 rounded-lg max-h-40 object-cover" />}
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                {typing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full text-gray-400 text-sm">typing…</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <button className="p-2 text-gray-400 hover:text-primary"><ImageIcon className="w-5 h-5" /></button>
                <input value={input} onChange={e => onType(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message…"
                  className="flex-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary" />
                <button onClick={sendMessage} className="p-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center"><MessageCircle className="w-16 h-16 mx-auto mb-3 opacity-30" /><p>Select a conversation</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
