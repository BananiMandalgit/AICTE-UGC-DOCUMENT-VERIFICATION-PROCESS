import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { api } from "@/lib/utils";
import { useToast } from "./use-toast";

interface FileUploadResponse {
  filePath: string;
}

interface FileVerificationRequest {
  uni_doc_uri: string;
  doc_id: number;
  formatId: string;
  uni_application_id: number;
}

interface FileVerificationResponse {
  verified: boolean;
  message?: string;
}

export const useFileUpload = (): UseMutationResult<
  { downloadUrl: string },
  Error,
  File
> => {
  const { toast } = useToast();

  return useMutation({
    mutationKey: ["file-upload"],
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<FileUploadResponse>(
        "/api/institute/upload-document",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return { downloadUrl: response.data.filePath };
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: "Your document has been uploaded successfully.",
      });
      console.log("File upload successful. Access URL:", data.downloadUrl);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description:
          error.message || "There was an error uploading your document.",
        variant: "destructive",
      });
      console.error("File upload error:", error);
    },
  });
};

export const useFileVerification = (): UseMutationResult<
  FileVerificationResponse,
  Error,
  FileVerificationRequest
> => {
  const { toast } = useToast();

  return useMutation({
    mutationKey: ["file-verification"],
    mutationFn: async (payload: FileVerificationRequest) => {
      const response = await api.post<FileVerificationResponse>(
        "/institute/data/verify-document",
        payload
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: data.verified ? "Verification Successful" : "Verification Failed",
        description: data.message || "",
        variant: data.verified ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Error",
        description: error.message || "There was an error verifying your document.",
        variant: "destructive",
      });
      console.error("File verification error:", error);
    },
  });
};
