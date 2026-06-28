import { queryClient } from "@/App";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/utils";
import { useToast } from "./use-toast";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const useInstituteData = () => {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationKey: ["institute-data"],
    mutationFn: async (instituteId: string) => {
      // ✅ correct URL
      const res = await api.post("/api/institute/data", {
        institute_id: instituteId,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["institute-data"] });
      console.log("Institute data loaded:", data);
    },
    onError: (error: any) => {
      console.error("Failed to fetch institute data:", error);

      toast({
        description: error?.message || "Failed to fetch institute data",
      });

      // ⛔ DO NOT auto logout + redirect while debugging
      // if (error?.response?.status === 401) {
      //   logout(); // call from useAuthStore when re-enabling auth handling
      //   nav("/institute/login"); // reintroduce navigation when handling auth errors here
      // }
    },
    retry: 0,
  });

  return mutation;
};

export { useInstituteData };

interface InstituteState {
  instituteId: string | null;
  setInstituteId: (id: string) => void;
  clearInstituteId: () => void;
}

export const useInstituteStore = create<InstituteState>()(
  persist(
    (set) => ({
      instituteId: null,
      setInstituteId: (id: string) => set({ instituteId: id }),
      clearInstituteId: () => set({ instituteId: null }),
    }),
    {
      name: "institute-data-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
