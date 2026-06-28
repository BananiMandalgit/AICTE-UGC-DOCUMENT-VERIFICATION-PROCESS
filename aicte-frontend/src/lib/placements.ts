import { api } from "@/lib/utils";
import type {
  PlacementDashboardResponse,
  PlacementQueryParams,
  PlacementReportResponse,
  PlacementScorecard,
  PlacementUploadResponse,
  InstitutePlacementSummary
} from "@/types/placements";

export const getPlacementDashboard = async (params: PlacementQueryParams) => {
  const response = await api.get("/api/placements", { params });
  return response.data?.data as PlacementDashboardResponse;
};

export const getPlacementReport = async (collegeCode: string) => {
  const response = await api.get(`/api/placements/${collegeCode}`);
  return response.data?.data as PlacementReportResponse;
};

export const uploadPlacementSheet = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/api/placements/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data as { success: boolean } & PlacementUploadResponse;
};

export const uploadInstitutePlacementSheet = async (file: File, instituteId: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("instituteId", instituteId);
  const response = await api.post("/api/placements/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data as { success: boolean } & PlacementUploadResponse;
};

export const scorePlacement = async (collegeCode: string) => {
  const response = await api.post("/api/placements/score", { collegeId: collegeCode });
  return response.data?.data as PlacementScorecard;
};

export const getInstitutePlacementSummary = async (instituteId: string) => {
  const response = await api.get(`/api/placements/institute/${instituteId}`);
  return response.data?.data as InstitutePlacementSummary;
};
