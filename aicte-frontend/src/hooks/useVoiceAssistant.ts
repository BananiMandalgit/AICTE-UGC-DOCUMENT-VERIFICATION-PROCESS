import { useCallback, useState } from "react";

/**
 * Provides basic speech-synthesis helpers for the floating voice assistant.
 */
export function useVoiceAssistant() {
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) {
      console.log("Speech synthesis not supported");
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const toggleAssistant = useCallback(() => {
    const newValue = !isActive;
    setIsActive(newValue);

    if (newValue) {
      speak("Voice assistant activated. I'm here to guide you through the approval process.");
    } else {
      stopSpeaking();
    }
  }, [isActive, speak, stopSpeaking]);

  const provideGuidance = useCallback(
    (context: string) => {
      if (!isActive) return;

      const guidance: Record<string, string> = {
        "/": "Welcome to Approval Engine X. Choose your portal to begin.",
        "/aicte": "This is the AICTE landing page. Explore announcements or jump straight to the institution login.",
        "/ugc": "UGC portal landing page. Follow similar steps for submissions.",
        "/institute/login": "Enter your institution credentials or register to start the approval process.",
        "/institute/regulation-select": "Pick the applicable regulation set before proceeding with your institution application.",
        "/institute/auth/register": "Complete the registration form to create your institution account.",
        "/institute/auth/otp": "Enter the one-time password sent to your registered contact to continue.",
        "/institute/dashboard": "Institution dashboard loaded. Launch new applications or track document status from here.",
        "/institute/dashboard/application-workspace": "Application workspace. Upload documents, run AI checks, and submit updates.",
        "/institute/applications": "Application list view. Select any entry to inspect evaluator feedback and statuses.",
        "/institute/applications/:id": "Detailed application view. Review each document, rerun checks, or re-upload as needed.",
        "/institute/upload-document": "Upload supporting documents in PDF or DOC format, up to ten megabytes.",
        "/institute/error-fix": "Error fix assistant open. Follow the AI guidance to correct document issues.",
        "/institute/infrastructure": "Infrastructure section. Provide facility details required for compliance.",
        "/evaluator": "Evaluator login screen. Sign in to review assigned institutions.",
        "/evaluator/regulation-select": "Select the evaluation regulation you will work with, then continue to assignments.",
        "/evaluator/dashboard": "Evaluator dashboard. Pick an institution card to begin reviewing documents.",
        "/admin/login": "Admin login portal. Enter credentials to manage institutions and users.",
        "/admin": "Admin console loaded. Use the sidebar for system-wide management.",
        landing: "Welcome to the approval portal. Please select your role: Institution, Evaluator, or Admin.",
        "institution-login": "Fill in your institution details and click Login or Register.",
        "institution-dashboard": "You can start applications, upload documents, or view AI analysis tools.",
        "evaluator-dashboard": "Review pending applications by selecting an institution card.",
        "admin-dashboard": "Use the sidebar to manage institutions, users, and system settings.",
        upload: "Upload your document in PDF or DOC format. Maximum size allowed is ten megabytes.",
        "ai-report": "The AI has analyzed your documents and prepared a compliance report.",
      };

      speak(guidance[context] || "Navigation complete.");
    },
    [isActive, speak]
  );

  return {
    isActive,
    isSpeaking,
    speak,
    stopSpeaking,
    toggleAssistant,
    provideGuidance,
  };
}
