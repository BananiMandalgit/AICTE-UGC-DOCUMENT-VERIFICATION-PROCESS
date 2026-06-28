import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceAssistantProps {
  message?: string;
  autoSpeak?: boolean;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
  message = "", 
  autoSpeak = false 
}) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Initialize Speech Synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSynthesis(window.speechSynthesis);
    }

    // Initialize Speech Recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          console.log('Voice input:', transcript);
          handleVoiceCommand(transcript);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      }
    }

    return () => {
      if (synthesis) {
        synthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (message && autoSpeak && isEnabled) {
      speak(message);
    }
  }, [message, autoSpeak, isEnabled]);

  const speak = (text: string) => {
    if (!synthesis || !isEnabled) return;

    // Cancel any ongoing speech
    synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings for male voice
    const voices = synthesis.getVoices();
    const maleVoice = voices.find(voice => 
      voice.name.includes('Male') || 
      voice.name.includes('David') ||
      voice.name.includes('Google US English') ||
      voice.lang === 'en-US'
    );
    
    if (maleVoice) {
      utterance.voice = maleVoice;
    }
    
    utterance.rate = 1.1; // Faster, more natural speech
    utterance.pitch = 0.9; // Slightly lower pitch for male voice
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesis.speak(utterance);
  };

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // Handle common commands
    if (lowerCommand.includes('help')) {
      speak("I'm here to guide you through the AICTE approval process. You can ask me about login, registration, document upload, or application status.");
    } else if (lowerCommand.includes('login')) {
      speak("To login, enter your registered email address and click continue. You will receive an OTP on your email.");
    } else if (lowerCommand.includes('register')) {
      speak("To register, click on the register button and fill in your institution details including name, type, email, phone number, and address.");
    } else if (lowerCommand.includes('document')) {
      speak("You can upload documents in PDF format. Make sure all documents are clear and properly scanned.");
    } else {
      speak("I'm not sure about that. You can ask me about login, registration, documents, or applications.");
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      speak("Voice recognition is not supported in your browser");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      speak("I'm listening. How can I help you?");
    }
  };

  const toggleVoice = () => {
    if (isSpeaking && synthesis) {
      synthesis.cancel();
      setIsSpeaking(false);
    }
    setIsEnabled(!isEnabled);
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-3">
      {/* Voice Toggle Button */}
      <Button
        onClick={toggleVoice}
        className={`group relative rounded-2xl p-5 shadow-2xl transition-all duration-300 hover:scale-110 ${
          isEnabled 
            ? 'bg-gradient-to-r from-[#0b6e4f] to-[#0d8a62] hover:from-[#095a40] hover:to-[#0b6e4f]' 
            : 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600'
        }`}
        title={isEnabled ? "Disable voice assistant" : "Enable voice assistant"}
      >
        {isEnabled ? (
          isSpeaking ? (
            <Volume2 className="h-7 w-7 animate-pulse text-white drop-shadow-lg" />
          ) : (
            <Volume2 className="h-7 w-7 text-white drop-shadow-lg" />
          )
        ) : (
          <VolumeX className="h-7 w-7 text-white drop-shadow-lg" />
        )}
        <span className="absolute -top-8 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {isEnabled ? 'Voice Active' : 'Voice Disabled'}
        </span>
      </Button>

      {/* Voice Input Button */}
      {isEnabled && recognition && (
        <Button
          onClick={toggleListening}
          className={`group relative rounded-2xl p-5 shadow-2xl transition-all duration-300 hover:scale-110 ${
            isListening 
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 animate-pulse' 
              : 'bg-gradient-to-r from-[#0b6e4f] to-[#0d8a62] hover:from-[#095a40] hover:to-[#0b6e4f]'
          }`}
          title={isListening ? "Stop listening" : "Start voice input"}
        >
          {isListening ? (
            <>
              <MicOff className="h-7 w-7 text-white drop-shadow-lg" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-300 rounded-full animate-ping"></span>
            </>
          ) : (
            <Mic className="h-7 w-7 text-white drop-shadow-lg" />
          )}
          <span className="absolute -top-8 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {isListening ? 'Listening...' : 'Ask Question'}
          </span>
        </Button>
      )}
    </div>
  );
};

// Hook for using voice assistant in components
export const useVoiceAssistant = () => {
  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const synthesis = window.speechSynthesis;
      synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = synthesis.getVoices();
      const maleVoice = voices.find(voice => 
        voice.name.includes('Male') || 
        voice.name.includes('David') ||
        voice.name.includes('Google US English') ||
        voice.lang === 'en-US'
      );
      
      if (maleVoice) {
        utterance.voice = maleVoice;
      }
      
      utterance.rate = 1.1; // Faster, more natural
      utterance.pitch = 0.9; // Slightly lower for male voice
      utterance.volume = 1.0;

      synthesis.speak(utterance);
    }
  };

  return { speak };
};
