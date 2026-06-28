'use client'

import * as React from "react"
import { MessageCircle, X } from "lucide-react"

interface ChatbotProps {
  isOpen: boolean
  onClose: () => void
}

export const Chatbot: React.FC<ChatbotProps> = ({ isOpen: initialIsOpen, onClose }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<Array<{ text: string; isUser: boolean }>>([
    { text: "Hello! How can I help you today?", isUser: false }
  ])
  const [inputValue, setInputValue] = React.useState("")

  const handleSend = () => {
    if (!inputValue.trim()) return
    
    setMessages([...messages, { text: inputValue, isUser: true }])
    setInputValue("")
    
    // Simulate bot response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: "I'm here to help you with your application. What would you like to know?", 
        isUser: false 
      }])
    }, 1000)
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-[#0b6e4f] hover:bg-[#095a40] text-white rounded-full p-4 shadow-lg transition-all duration-300 z-50"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-[#0b6e4f] text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">Chat Support</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-[#095a40] rounded p-1 transition-colors"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.isUser
                      ? 'bg-[#0b6e4f] text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6e4f]"
              />
              <button
                onClick={handleSend}
                className="bg-[#0b6e4f] hover:bg-[#095a40] text-white px-4 py-2 rounded-lg transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}