import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { SubmitUniversityApplication, UniversityApplication} from "@/schemas/applicationSchema";
import { useInstituteStore } from "./useInstituteData";
// Assuming you have an auth store, if not, you can remove this import and related code

// Update this to match your server URL

interface ApplicationUploadResponse {
  success: boolean;
  message: string;
  id: string;
  application?: any;
}

export interface WorkspaceDocumentPayload {
  doc_id: string;
  uni_doc_uri: string;
  status?: string;
  analysis?: Record<string, any>;
}

interface ApplicationUploadPayload {
  application: SubmitUniversityApplication;
  institute_id: string;
  documents?: WorkspaceDocumentPayload[];
}


export const useApplicationUpload = (): UseMutationResult<
  ApplicationUploadResponse,
  Error,
  ApplicationUploadPayload
> => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["application-upload"],
    mutationFn: async (formData: ApplicationUploadPayload) => {
      const res = await api.post<ApplicationUploadResponse>(
        `/api/institute/data/new_application`,
        formData
      );
      return res.data;
    },
    onSuccess: (data) => {
      // ✅ FIX: Invalidate applications query to refresh the list with updated status
      queryClient.invalidateQueries({ queryKey: ["application-upload"] });
      queryClient.invalidateQueries({ queryKey: ["get-applications"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });

      toast({
        title: "Application Submitted Successfully! ✅",
        description: data.message || "Your application has been submitted and is now visible to evaluators.",
      });

      console.log("new application response", data);
    },
    onError: (error: Error) => {
      queryClient.cancelQueries({ queryKey: ["application-upload"] });

      toast({
        title: "Error",
        description:
          error.message ||
          "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    },
  });
};

interface ApplicationGetResponse {
  applications: UniversityApplication[];
  data: UniversityApplication[];
  status: "success" | "error";
  message: string;
}

export const useApplicationGet = (): UseMutationResult<
  ApplicationGetResponse,
  Error,
  string,
  unknown
> => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["get-applications"],
    mutationFn: async (instituteId: string) => {
      const res = await api.get<ApplicationGetResponse>(
        `/api/institute/data/get_applications?id=${instituteId}`
      );
      return res.data;
    },
    onSuccess: (data) => {

const correctedApplications = data.applications.map(app => ({
 ...app,
 
// 2. Map over the correct array property: UniversityDocuments
 UniversityDocuments: app.UniversityDocuments.map(doc => { 
  if (doc.uni_doc_uri && !doc.uni_doc_uri.startsWith('http')) {
    doc.uni_doc_uri = `http://localhost:3100/uploads/${doc.uni_doc_uri}`;
 }
 return doc;
 })
 }));

 // 4. Update the TanStack Query cache with the corrected application data.
//    We use correctedApplications here, which should be assigned to the cache's array key.
 queryClient.setQueryData(["applications"], correctedApplications);

// --- END: URL CORRECTION LOGIC ---
 
console.log("Applications fetched successfully:", data);
},
// ...
    onError: (error: Error) => {
      toast({
        title: "Error",
        description:
          error.message ||
          "There was an error fetching your applications. Please try again.",
        variant: "destructive",
      });

      console.error("Error fetching applications:", error);
    },
  });
};

export const useDocumentGet = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // ✅ FIX: Backend /get_documents endpoint only needs application_id
  return useMutation({
    mutationKey: ["get-documents"],
    mutationFn: async (id: string) => {
      const res = await api.get(
        `/api/institute/data/get_documents?application_id=${id}`
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["documents"], data.data);

      
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description:
          error.message ||
          "There was an error fetching your documents. Please try again.",
        variant: "destructive",
      });

      console.error("Error fetching applications:", error);
    },
  });
};