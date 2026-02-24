import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

interface Message { role: 'user' | 'assistant'; content: string }

const QUICK_REPLIES = [
  'What are your prices?',
  'Do you serve my area?',
  'Do you install IKEA cabinets?',
  'How long does it take?',
]

const WELCOME: Message = {
  role: 'assistant',
  content: "Hi! I'm the Cabinets of Orlando assistant. I can answer questions about pricing, collections, or installation. What can I help you with?",
}

export default function ChatWidget() {
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [leadSaved, setLeadSaved] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    setShowQuickReplies(false)
    const userMsg: Message = { role: 'user', content: text.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const { data } = await axios.post('/api/chat', {
        messages: next.filter(m => m.content !== WELCOME.content || m.role !== 'assistant'),
      })
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      if (data.leadSaved) setLeadSaved(true)
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble right now. Please call us at (833) 201-7849 — we're available 24/7.",
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* Chat panel */}
      {open && (
        <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden"
          style={{ height: '520px' }}>

          {/* Header */}
          <div className="bg-stone-950 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-wood-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">CO</span>
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Cabinets of Orlando</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"/>
                  <span className="text-stone-400 text-xs">Available now</span>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-stone-200 transition-colors p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-stone-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-stone-900 text-white rounded-br-md'
                    : 'bg-white text-stone-800 border border-stone-200 rounded-bl-md shadow-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}

            {/* Quick reply chips */}
            {showQuickReplies && messages.length === 1 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {QUICK_REPLIES.map(q => (
                  <button key={q} onClick={() => send(q)}
                    className="bg-white border border-stone-200 text-stone-700 text-xs px-3 py-1.5 rounded-full hover:border-wood-400 hover:text-wood-700 transition-colors shadow-sm">
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}/>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Lead saved confirmation */}
            {leadSaved && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 text-xs text-green-700 text-center">
                ✓ Your info has been saved — our team will call within 2 hours.
              </div>
            )}

            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div className="border-t border-stone-200 px-3 py-3 flex items-center gap-2 flex-shrink-0 bg-white">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask a question..."
              disabled={loading}
              className="flex-1 text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wood-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-wood-600 hover:bg-wood-700 disabled:bg-stone-200 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-stone-100 px-4 py-2 text-center flex-shrink-0">
            <a href="tel:+18332017849" className="text-xs text-stone-400 hover:text-wood-600 transition-colors">
              Or call (833) 201-7849 · Available 24/7
            </a>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 bg-wood-600 hover:bg-wood-700 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        )}
      </button>
    </div>
  )
}
