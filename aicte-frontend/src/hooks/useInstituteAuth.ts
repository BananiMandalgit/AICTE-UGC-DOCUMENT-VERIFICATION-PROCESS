import { queryClient } from "@/App";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/hooks/useAuthStore";

type ExistsPayload = string | { authKey?: string; email?: string };
type OtpPayload = string | { email: string; password?: string };
type LoginPayload = { email?: string; authKey?: string; otp: string };

const normalizeAuthKey = (payload: ExistsPayload): string => {
  if (typeof payload === "string") {
    return payload;
  }
  return payload.authKey || payload.email || "";
};

const normalizeOtpPayload = (payload: OtpPayload) => {
  if (typeof payload === "string") {
    return { email: payload };
  }
  return payload;
};

const normalizeLoginPayload = (payload: LoginPayload) => {
  const authKey = payload.authKey || payload.email || "";
  return { authKey, otp: payload.otp };
};

export const useInstituteExists = () => {
  const { toast } = useToast();

  return useMutation<any, any, ExistsPayload>({
    mutationKey: ["institute-exists"],
    mutationFn: async (payload) => {
      const authKey = normalizeAuthKey(payload);
      const res = await api.post("/api/institute/auth/institute_exists", {
        authKey,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institute-exists"] });
    },
    onError: (error) => {
      console.error("Institute exists check failed:", error);
      toast({ description: "Error checking institute. Please try again." });
    },
  });
};

export const useSendInstituteOtp = () => {
  const { toast } = useToast();

  return useMutation<any, any, OtpPayload>({
    mutationKey: ["institute-send-otp"],
    mutationFn: async (payload) => {
      const body = normalizeOtpPayload(payload);
      const res = await api.post("/api/institute/auth/send-otp", body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institute-send-otp"] });
    },
    onError: (error) => {
      console.error("Send OTP error:", error);
      toast({ description: error?.message || "Failed to send OTP" });
    },
  });
};

export const useInstituteLogin = () => {
  const { toast } = useToast();
  const { setTokenMode } = useAuthStore();
  const navigate = useNavigate();

  return useMutation<any, any, LoginPayload>({
    mutationKey: ["institute-login"],
    mutationFn: async (payload) => {
      const res = await api.post(
        "/api/institute/auth/login",
        normalizeLoginPayload(payload)
      );
      console.log("Login API response:", res.data);
      return res.data;
    },
    onSuccess: (data) => {
      console.log("Login success:", data);

      // Extract token from whatever structure the backend returns.
      // Codex: inspect the real API response and select the correct field.
      const token =
        data?.token ||
        data?.access_token ||
        data?.data?.token ||
        data?.data?.access_token;

      if (!token) {
        toast({ description: "Token missing in response" });
        return;
      }

      // Persist login
      setTokenMode(token, "institute");

      // Redirect to dashboard
      navigate("/institute/dashboard", { replace: true });
    },
    onError: (error) => {
      console.error("Institute login error:", error);
      toast({ description: error?.message || "Institute login failed" });
    },
  });
};
