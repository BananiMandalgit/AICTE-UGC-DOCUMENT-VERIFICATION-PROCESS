import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/utils";
import { useToast } from "./use-toast";

export interface NirfComponentScore {
  key: string;
  label: string;
  score: number;
  weight: number;
}

export interface NirfRun {
  id: string;
  academicYear: number;
  status: string;
  finalScore: number | null;
  createdAt: string;
  downloadUrl: string | null;
  components: NirfComponentScore[];
}

export interface NirfHistoryResult {
  runs: NirfRun[];
  total: number;
}

let fallbackCounter = 0;

export const createNirfRunFallbackId = () => {
  fallbackCounter = (fallbackCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `temp-nirf-run-${fallbackCounter}`;
};

const toAbsoluteUrl = (input: string) => {
  if (!input) return null;
  if (/^https?:\/\//i.test(input)) {
    return input;
  }
  const sanitized = input.replace(/^\/+/, "");
  if (typeof window === "undefined") {
    return `/${sanitized}`;
  }
  return `${window.location.origin}/${sanitized}`;
};

const resolveDownloadUrl = (run: any): string | null => {
  const candidate = typeof run?.downloadUrl === "string" && run.downloadUrl.trim().length
    ? run.downloadUrl.trim()
    : typeof run?.fileUrl === "string" && run.fileUrl.trim().length
      ? run.fileUrl.trim()
      : typeof run?.uploadKey === "string" && run.uploadKey.trim().length
        ? run.uploadKey.trim()
        : null;

  if (!candidate) return null;
  return toAbsoluteUrl(candidate);
};

const normalizeComponent = (component: any, index: number): NirfComponentScore => {
  const keySource = typeof component?.key === "string" && component.key.trim().length
    ? component.key.trim()
    : `component_${index + 1}`;

  return {
    key: keySource,
    label:
      typeof component?.label === "string" && component.label.trim().length
        ? component.label.trim()
        : keySource,
    score: Number.isFinite(component?.score) ? Number(component.score) : 0,
    weight: Number.isFinite(component?.weight) ? Number(component.weight) : 0,
  };
};

export const normalizeRun = (run: any, index = 0): NirfRun => {
  const createdAtValue = typeof run?.createdAt === "string" && run.createdAt.length
    ? run.createdAt
    : new Date().toISOString();
  const fallbackId = createNirfRunFallbackId();

  return {
    id:
      typeof run?.id === "string" && run.id.trim().length
        ? run.id
        : `${fallbackId}-${index}`,
    academicYear: Number(run?.academicYear) || new Date(createdAtValue).getFullYear(),
    status: typeof run?.status === "string" ? run.status : "QUEUED",
    finalScore: Number.isFinite(run?.finalScore) ? Number(run.finalScore) : null,
    createdAt: createdAtValue,
    downloadUrl: resolveDownloadUrl(run),
    components: Array.isArray(run?.components)
      ? run.components.map((component: any, componentIndex: number) => normalizeComponent(component, componentIndex))
      : [],
  };
};

export const normalizeHistoryResponse = (payload: any): NirfHistoryResult => {
  const data = payload?.data ?? payload ?? {};
  const rawRuns = Array.isArray(data?.runs) ? data.runs : [];
  const total = Number.isFinite(data?.total) ? Number(data.total) : rawRuns.length;

  return {
    runs: rawRuns.map((run: any, index: number) => normalizeRun(run, index)),
    total,
  };
};

interface NirfUploadPayload {
  instituteId: string;
  file: File;
  academicYear?: number;
}

export const useNirfUpload = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["nirf-upload"],
    mutationFn: async ({ instituteId, file, academicYear }: NirfUploadPayload) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("instituteId", instituteId);
      formData.append("academicYear", String(academicYear ?? new Date().getFullYear()));

      const response = await api.post("/api/institute/nirf/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data;
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "NIRF dataset queued",
        description: "Scoring run scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["nirf-history", variables.instituteId] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error?.message || "Unable to process the NIRF workbook.",
        variant: "destructive",
      });
    },
  });
};

export const useNirfHistory = (instituteId?: string, enabled = true) => {
  return useQuery({
    queryKey: ["nirf-history", instituteId],
    enabled: Boolean(enabled && instituteId),
    queryFn: async () => {
      const response = await api.get("/api/institute/nirf/history", {
        params: { instituteId },
      });
      return normalizeHistoryResponse(response.data);
    },
    staleTime: 30_000,
  });
};
