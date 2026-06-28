import React from "react";
import { Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./hooks/useAuthStore";
import ProtectedInstituteRoute from "./routes/ProtectedInstituteRoute";
import ProtectedAdminRoute from "./routes/ProtectedAdminRoute";
import { PortalProvider } from "./contexts/PortalContext";
import { VoiceAssistantProvider } from "@/contexts/VoiceAssistantContext";

import PortalSelector from "@/pages/PortalSelector";
import AICTELanding from "@/pages/aicte/Landing";
import UGCLanding from "@/pages/ugc/Landing";
import AISHELanding from "@/pages/aishe/Landing";
import Institute from "./pages/institute";
import RegulationSelect from "./pages/institute/regulation-select";
import AICTEDashboard from "./pages/institute/dashboard";
import ApplicationWorkspace from "./pages/institute/dashboard/ApplicationWorkspace";
import InstituteApplication from "./pages/institute/applications";
import InstituteFeedbackPage from "./pages/institute/feedback";
import LoginPage from "./pages/institute/auth/login";
import RegisterPage from "./pages/institute/auth/register";
import ForgotPasswordPage from "./pages/institute/auth/forgot";
import ApplicationData from "./pages/institute/applications/Application";
import InstituteOtpForm from "./pages/institute/auth/otp";
import { api } from "./lib/utils";
import UploadLegalDocument from "./pages/institute/applications/UploadDocument";
import ErrorFix from "./pages/institute/applications/ErrorFixPage";
import Infrastructure from "./pages/institute/dashboard/infrastructure";
import AdminDashboard from "./pages/admin";
import AdminLogin from "./pages/admin/login";
import Evaluator from "./pages/evaluator";
import { EvaluatorLogin } from "./pages/evaluator/auth";
import EvaluatorFeedbackPage from "./pages/evaluator/feedback";
import VoiceAssistantButton from "@/components/VoiceAssistantButton";
import InstitutionPerformanceIndicators from "./pages/evaluator/InstitutionPerformanceIndicators";
import PlacementDashboard from "./pages/evaluator/placements/PlacementDashboard";
import PlacementDetailReport from "./pages/evaluator/placements/PlacementDetailReport";
import ComplianceEvidenceReport from "./pages/institute/ComplianceEvidenceReport";

export const queryClient = new QueryClient();

export default function App() {
  const { token, mode } = useAuthStore();
  // Ensure Authorization header uses Bearer scheme when token is present
  if (token) {
    api.defaults.headers.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.Authorization;
  }
  return (
    <PortalProvider>
      <QueryClientProvider client={queryClient}>
        <VoiceAssistantProvider>
          <Routes>
            {/* Portal Selection - Main Entry Point */}
            <Route path="/" element={<PortalSelector />} />

            {/* AICTE Landing Page */}
            <Route path="/aicte" element={<AICTELanding />} />

            {/* UGC Landing Page */}
            <Route path="/ugc" element={<UGCLanding />} />

            {/* AISHE Landing Page */}
            <Route path="/aishe" element={<AISHELanding />} />

            <Route path="/institute/login" element={<LoginPage />} />
            <Route path="/institute/regulation-select" element={<RegulationSelect />} />
            <Route path="/institute/auth/otp" element={<InstituteOtpForm />} />
            <Route path="/institute/auth/register" element={<RegisterPage />} />
            <Route path="/institute/forgot" element={<ForgotPasswordPage />} />

          <Route
            path="/institute"
            element={
              <ProtectedInstituteRoute>
                <Institute />
              </ProtectedInstituteRoute>
            }
          >
            <Route path="dashboard" element={<AICTEDashboard />} />
            <Route
              path="dashboard/application-workspace"
              element={<ApplicationWorkspace />}
            />
            <Route path="applications" element={<InstituteApplication />} />
            <Route path="applications/:id" element={<ApplicationData />} />
            <Route path="upload-document" element={<UploadLegalDocument />} />
            <Route path="error-fix" element={<ErrorFix />} />
            <Route path="infrastructure" element={<Infrastructure />} />
            <Route path="feedback" element={<InstituteFeedbackPage />} />
            <Route
              path="evidence/:uni_doc_id"
              element={<ComplianceEvidenceReport />}
            />
            <Route
              path="evidence"
              element={<ComplianceEvidenceReport />}
            />
          </Route>

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />

          <Route path="/evaluator" element={<EvaluatorLogin/>}/>
          <Route path="/evaluator/dashboard" element={<Evaluator/>}/>
          <Route path="/evaluator/feedback" element={<EvaluatorFeedbackPage />} />
          <Route
            path="/evaluator/institutions/:institutionId/performance"
            element={<InstitutionPerformanceIndicators />}
          />
          <Route path="/evaluator/placements" element={<PlacementDashboard />} />
          <Route path="/evaluator/placements/:collegeCode" element={<PlacementDetailReport />} />
          {/* Catch-all route */}
            <Route
              path="*"
              element={<div className="p-4">This page does not exist</div>}
            />
        </Routes>
        <VoiceAssistantButton />
        </VoiceAssistantProvider>
      </QueryClientProvider>
    </PortalProvider>
  );
}
