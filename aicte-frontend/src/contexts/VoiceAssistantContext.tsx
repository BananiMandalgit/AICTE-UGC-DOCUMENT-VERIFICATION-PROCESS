import { createContext, ReactNode, useContext, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";

const ROUTE_KEYS = [
  "/",
  "/aicte",
  "/ugc",
  "/institute/login",
  "/institute/auth/register",
  "/institute/auth/otp",
  "/institute/regulation-select",
  "/institute/dashboard",
  "/institute/dashboard/application-workspace",
  "/institute/applications",
  "/institute/applications/:id",
  "/institute/upload-document",
  "/institute/error-fix",
  "/institute/infrastructure",
  "/evaluator",
  "/evaluator/regulation-select",
  "/evaluator/dashboard",
  "/admin/login",
  "/admin",
];

type VoiceAssistantContextValue = ReturnType<typeof useVoiceAssistant>;

const VoiceAssistantContext = createContext<VoiceAssistantContextValue | null>(null);

function matchPath(pattern: string, path: string) {
  if (pattern === path) return true;
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return false;
  return patternParts.every((part, idx) => part.startsWith(":") || part === pathParts[idx]);
}

export function VoiceAssistantProvider({ children }: { children: ReactNode }) {
  const assistant = useVoiceAssistant();
  const location = useLocation();
  const { isActive, provideGuidance } = assistant;

  useEffect(() => {
    if (!isActive) return;
    const matchedKey = ROUTE_KEYS.find((pattern) => matchPath(pattern, location.pathname));
    if (matchedKey) {
      provideGuidance(matchedKey);
    }
  }, [isActive, provideGuidance, location.pathname]);

  const value = useMemo(() => assistant, [assistant]);

  return <VoiceAssistantContext.Provider value={value}>{children}</VoiceAssistantContext.Provider>;
}

export function useVoiceAssistantContext() {
  const ctx = useContext(VoiceAssistantContext);
  if (!ctx) {
    throw new Error("useVoiceAssistantContext must be used within VoiceAssistantProvider");
  }
  return ctx;
}
