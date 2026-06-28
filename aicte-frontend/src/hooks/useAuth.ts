import { queryClient } from "@/App";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/utils";
import { useToast } from "./use-toast";
import { useNavigate } from "react-router-dom";

export { useInstituteExists, useInstituteLogin } from "./useInstituteAuth";

interface InstituteRegistrationData {
  institute_data: object;
  password: string;
}

const useInstituteRegistration = () => {
  const { toast } = useToast();
  const nav = useNavigate();
  const mutation = useMutation({
    mutationKey: ["institute-register"],
    mutationFn: async (formData: InstituteRegistrationData) => {
      const res = await api.post(
        `/api/institute/auth/register`,
        formData
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["institute-register"] });
      // Registration should NOT auto-login. Redirect user to login page.
      try {
        toast({ title: "Registration successful", description: "Please login to continue." });
        nav("/institute/login");
      } catch (e) {
        console.log("Registration successful:", data);
      }
    },
    onError: (error) => {
      queryClient.cancelQueries({ queryKey: ["institute-register"] });
      toast({
        description: error.message,
        onClick: () => {
          nav("/institute/login");
        },
      });

      console.error("Registration failed:", error);
    },
  });

  return mutation;
};

interface InstituteLoginData {
  authKey: string;
  password: string;
}

const useInstituteForgotPassword = () => {
  const { toast } = useToast();
  const nav = useNavigate();

  const mutation = useMutation({
    mutationKey: ["institute-fp"],
    mutationFn: async (formData: InstituteLoginData) => {
      const res = await api.post(
        `/api/institute/auth/forgot`,
        formData
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["institute-fp"] });

      // Show success toast
      if (data.success) {
        toast({
          title: "Recover Successful",
          description: "Redirecting to login page...",
        });
        nav("/institute/login");
      } else {
        toast({
          title: "Recover Failed",
          description: "Invalid credentials, please try again.",
        });
      }
      // Navigate to the dashboard
      // nav("/institute/dashboard");
    },
    onError: (error) => {
      queryClient.cancelQueries({ queryKey: ["institute-fp"] });

      // Show error toast
      toast({
        title: "Recover Failed",
      });

      console.error("Login failed:", error);
    },
  });

  return mutation;
};

export {
  useInstituteRegistration,
  useInstituteForgotPassword
};
