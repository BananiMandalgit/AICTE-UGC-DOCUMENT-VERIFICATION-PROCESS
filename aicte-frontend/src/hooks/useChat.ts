'use client'

import { useEffect, useState, useRef } from 'react' // <-- Added useRef

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatHookResult {
  messages: Message[]
  isLoading: boolean
  error: Error | null
  sendMessage: (content: string) => void
}

const SOCKET_URL = 'ws://localhost:3100/chatbot'  // Changed from 127.0.0.1 to localhost for consistency
const RECONNECT_DELAY = 3000; // Delay in milliseconds before attempting to reconnect

export function useChat(): ChatHookResult {
  // We use a ref to hold the actual WebSocket instance for reliable cleanup and send operations
  const socketRef = useRef<WebSocket | null>(null);
  
  // State variables for the component's render cycle
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout | undefined;

    const connect = () => {
      setIsLoading(true);
      const ws = new WebSocket(SOCKET_URL);
      socketRef.current = ws; // Store the new WebSocket instance in the ref

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsLoading(false);
        setError(null);
        clearTimeout(reconnectTimeout);
      };

      ws.onerror = (event) => {
        // Log the error but rely on `onclose` to handle the actual reconnection attempt
        console.error('WebSocket error:', event);
        setError(new Error('WebSocket connection error. Check backend server.'));
      };

      ws.onmessage = (event) => {
        const newMessage: Message = {
          role: 'assistant',
          content: event.data,
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected. Attempting reconnect in 3s...');
        setIsLoading(true);

        // Throttle reconnection attempts to prevent browser throttling
        reconnectTimeout = setTimeout(() => {
          connect();
        }, RECONNECT_DELAY);
      };
    };

    connect(); // Initial connection attempt

    return () => {
      // Cleanup function runs on unmount:
      clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        // Prevent `onclose` from triggering another reconnect attempt during unmount
        socketRef.current.onclose = null; 
        socketRef.current.close();
      }
    };
  }, []); // Empty dependency array ensures it runs once

  const sendMessage = (content: string) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      const userMessage: Message = { role: 'user', content };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      ws.send(content);
    } else {
      console.error('WebSocket is not open. Cannot send message.');
      setError(new Error('WebSocket is not open. Please wait for reconnection or check the server.'));
    }
  };

  // We expose the state variables. The actual socket instance is managed internally via socketRef.
  return { messages, isLoading, error, sendMessage };
}
