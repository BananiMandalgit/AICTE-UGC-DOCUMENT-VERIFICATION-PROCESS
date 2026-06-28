import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/hooks/useAuthStore";

interface Props {
  children: JSX.Element;
}

export default function ProtectedInstituteRoute({ children }: Props) {
  const { mode } = useAuthStore();
  let role: string | undefined;

  try {
    const auth = JSON.parse(localStorage.getItem("auth-store") || "{}");
    role = auth?.state?.role ?? auth?.state?.mode ?? mode ?? undefined;
  } catch {
    role = mode ?? undefined;
  }

  if (role !== "institute") {
    return <Navigate to="/" replace />;
  }

  return children;
}
