import { Volume2, VolumeX } from "lucide-react";
import { useVoiceAssistantContext } from "@/contexts/VoiceAssistantContext";

export default function VoiceAssistantButton() {
  const { isActive, isSpeaking, toggleAssistant, stopSpeaking } = useVoiceAssistantContext();

  return (
    <div className="fixed top-4 right-4 flex flex-col items-end gap-2 z-50">
      <button
        onClick={toggleAssistant}
        className="p-4 rounded-full bg-blue-700 text-white shadow-lg hover:bg-blue-800 transition"
        aria-label={isActive ? "Turn off voice assistant" : "Turn on voice assistant"}
      >
        {isActive ? <VolumeX size={22} /> : <Volume2 size={22} />}
      </button>

      {isSpeaking && (
        <button
          onClick={stopSpeaking}
          className="px-3 py-1 rounded-md bg-red-600 text-white shadow hover:bg-red-700"
        >
          Stop
        </button>
      )}
    </div>
  );
}
