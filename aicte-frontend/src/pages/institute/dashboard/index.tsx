import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
// import { Separator } from "@/components/ui/separator"; // Removed duplicate import
import { api } from "@/lib/utils";
import { SERVER_URL } from "@/constants/API";
import { buildUgcApplicationTypes } from "@/data/ugcApprovalConfig";
// --- Evidence Report Types ---
type EvidenceReportResponse = {
  success: boolean;
  data?: {
    application: {
      uni_application_id: string;
      universityId: string;
      status: string;
    };
    evidenceReport: {
      placementIntelligence: any;
      nirfScoring: any;
      researchEligibility: any;
      facultyValidation: any;
    };
  };
  error?: string;
};

function EvidenceReportSectionInstitution({ uni_application_id }: { uni_application_id: string }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<EvidenceReportResponse["data"] | null>(null);

  React.useEffect(() => {
    if (!uni_application_id) return;
    setLoading(true);
    setError(null);
    setReport(null);
    api.get(`/api/evaluator/evidence-report/${uni_application_id}`)
      .then((res) => {
        setReport(res.data.data);
      })
      .catch((err) => {
        setError(err?.response?.data?.error || err.message || "Failed to load evidence report");
      })
      .finally(() => setLoading(false));
  }, [uni_application_id]);

  return (
    <Card className="mt-10 mb-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Evidence Report</CardTitle>
        <p className="text-gray-500 text-sm mt-1">AI-powered analysis summary for this application, grouped by evidence category.</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading evidence report...</div>
        ) : error ? (
          <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>
        ) : !report ? (
          <div className="text-center text-gray-500 py-8">No evidence report data available.</div>
        ) : (
          <Accordion type="multiple" className="w-full">
            {/* NIRF Scoring Upload */}
            <AccordionItem value="nirf">
              <AccordionTrigger>NIRF Scoring Upload</AccordionTrigger>
              <AccordionContent>
                {report.evidenceReport.nirfScoring ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-6 items-center mb-2">
                      <div>
                        <span className="text-gray-500 text-xs">Final Score</span>
                        <div className="text-2xl font-bold">{typeof report.evidenceReport.nirfScoring.totalScore === "number" ? report.evidenceReport.nirfScoring.totalScore.toFixed(2) : "—"}</div>
                      </div>
                      {report.evidenceReport.nirfScoring.createdAt && (
                        <div>
                          <span className="text-gray-500 text-xs">Timestamp</span>
                          <div>{new Date(report.evidenceReport.nirfScoring.createdAt).toLocaleString()}</div>
                        </div>
                      )}
                    </div>
                    {Array.isArray(report.evidenceReport.nirfScoring.componentScores) && report.evidenceReport.nirfScoring.componentScores.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Component</TableHead>
                            <TableHead>Score</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.evidenceReport.nirfScoring.componentScores.map((comp: any) => (
                            <TableRow key={comp.id || comp.component}>
                              <TableCell>{comp.component}</TableCell>
                              <TableCell>{typeof comp.score === "number" ? comp.score.toFixed(2) : "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-gray-500 text-sm">No component breakdown available.</div>
                    )}
                  </div>
                ) : <div className="text-gray-500 text-sm">No data available.</div>}
              </AccordionContent>
            </AccordionItem>
            {/* <Separator className="my-2" /> */}
            {/* Placement Intelligence Upload */}
            <AccordionItem value="placement">
              <AccordionTrigger>Placement Intelligence Upload</AccordionTrigger>
              <AccordionContent>
                {report.evidenceReport.placementIntelligence ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-6 items-center mb-2">
                      <div>
                        <span className="text-gray-500 text-xs">AI Score</span>
                        <div className="text-2xl font-bold">{typeof report.evidenceReport.placementIntelligence.aiScore === "number" ? report.evidenceReport.placementIntelligence.aiScore.toFixed(2) : "—"}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Risk Level</span>
                        <Badge>{report.evidenceReport.placementIntelligence.riskLevel || "—"}</Badge>
                      </div>
                    </div>
                    {report.evidenceReport.placementIntelligence.analysisJson?.performanceRating && (
                      <div>
                        <span className="text-gray-500 text-xs">Performance Rating</span>
                        <div>{report.evidenceReport.placementIntelligence.analysisJson.performanceRating}</div>
                      </div>
                    )}
                    {Array.isArray(report.evidenceReport.placementIntelligence.analysisJson?.suggestedActions) && report.evidenceReport.placementIntelligence.analysisJson.suggestedActions.length > 0 ? (
                      <div>
                        <span className="text-gray-500 text-xs">Top 3 Suggested Actions</span>
                        <ul className="list-disc ml-6 mt-1">
                          {report.evidenceReport.placementIntelligence.analysisJson.suggestedActions.slice(0, 3).map((action: string, idx: number) => (
                            <li key={idx}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    ) : <div className="text-gray-500 text-sm">No suggested actions available.</div>}
                  </div>
                ) : <div className="text-gray-500 text-sm">No data available.</div>}
              </AccordionContent>
            </AccordionItem>
            {/* <Separator className="my-2" /> */}
            {/* Research Eligibility Evidence Upload */}
            <AccordionItem value="research">
              <AccordionTrigger>Research Eligibility Evidence Upload</AccordionTrigger>
              <AccordionContent>
                {report.evidenceReport.researchEligibility ? (
                  <div className="space-y-2">
                    {typeof report.evidenceReport.researchEligibility.eligibilityScore === "number" && (
                      <div>
                        <span className="text-gray-500 text-xs">Eligibility Score</span>
                        <div className="text-2xl font-bold">{report.evidenceReport.researchEligibility.eligibilityScore.toFixed(2)}</div>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500 text-xs">Eligibility Status</span>
                      <Badge>{report.evidenceReport.researchEligibility.eligibilityStatus || "—"}</Badge>
                    </div>
                    {Array.isArray(report.evidenceReport.researchEligibility.missingDocuments) && report.evidenceReport.researchEligibility.missingDocuments.length > 0 ? (
                      <div>
                        <span className="text-gray-500 text-xs">Missing Documents</span>
                        <ul className="list-disc ml-6 mt-1">
                          {report.evidenceReport.researchEligibility.missingDocuments.map((doc: string, idx: number) => (
                            <li key={idx}>{doc}</li>
                          ))}
                        </ul>
                      </div>
                    ) : <div className="text-gray-500 text-sm">No missing documents.</div>}
                  </div>
                ) : <div className="text-gray-500 text-sm">No data available.</div>}
              </AccordionContent>
            </AccordionItem>
            {/* <Separator className="my-2" /> */}
            {/* Faculty Score Validation */}
            <AccordionItem value="faculty">
              <AccordionTrigger>Faculty Score Validation</AccordionTrigger>
              <AccordionContent>
                {report.evidenceReport.facultyValidation ? (
                  <div className="space-y-2">
                    {typeof report.evidenceReport.facultyValidation.overall_score === "number" && (
                      <div>
                        <span className="text-gray-500 text-xs">Overall Score</span>
                        <div className="text-2xl font-bold">{report.evidenceReport.facultyValidation.overall_score.toFixed(2)}</div>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500 text-xs">Validation Status</span>
                      <Badge>{report.evidenceReport.facultyValidation.validation_status || "—"}</Badge>
                    </div>
                    {Array.isArray(report.evidenceReport.facultyValidation.issues) && report.evidenceReport.facultyValidation.issues.length > 0 ? (
                      <div>
                        <span className="text-gray-500 text-xs">Top Issues</span>
                        <ul className="list-disc ml-6 mt-1">
                          {report.evidenceReport.facultyValidation.issues.slice(0, 3).map((issue: string, idx: number) => (
                            <li key={idx}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    ) : <div className="text-gray-500 text-sm">No major issues found.</div>}
                    {Array.isArray(report.evidenceReport.facultyValidation.recommendations) && report.evidenceReport.facultyValidation.recommendations.length > 0 ? (
                      <div>
                        <span className="text-gray-500 text-xs">Recommendations</span>
                        <ul className="list-disc ml-6 mt-1">
                          {report.evidenceReport.facultyValidation.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    ) : <div className="text-gray-500 text-sm">No recommendations.</div>}
                  </div>
                ) : <div className="text-gray-500 text-sm">No data available.</div>}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FileText,
  Users,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  BookOpen,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import applicationTypes from "@/data/applicationTypes.json";
import { useInstituteData, useInstituteStore } from "@/hooks/useInstituteData";
import { useAuthStore } from "@/hooks/useAuthStore";
import { Skeleton } from "@/components/ui/skeleton";
import Settings from "../settings";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
// import { Separator } from "@/components/ui/separator";

const typedApplicationTypes: ApplicationType[] = applicationTypes as ApplicationType[];

const DashboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-background">
    <div className="ml-64 mr-80 p-8">
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-96 mb-8" />

      <div className="grid grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="w-80 bg-background h-screen fixed right-0 top-0 border-l">
      <div className="p-6">
        <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
        <Skeleton className="h-6 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-32 mx-auto mb-6" />
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-4 w-32 mb-2" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-32 mb-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-2 w-full mb-4" />
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full mt-1" />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

interface ApplicationType {
  id: string;
  name: string;
  documents: { id: string; name: string; pdfPath: string }[];
}

interface UniversityData {
  email: string;
  state: string;
  pincode: string;
  district: string;
  phone: string;
  instituteType: string;
  universityName: string;
}

interface RightSidebarProps {
  data: UniversityData;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ data }) => (
  <div className="w-80 bg-white h-screen sticky right-0 top-0 border-l border-gray-200">
    {/* FIXME just for logging out need to modify */}
    <Settings />
    <ScrollArea className="h-screen px-6 py-8">
      <div className="flex flex-col items-center mb-8">
        <Avatar className="w-24 h-24 mb-4">
          <AvatarImage src="/placeholder-user.jpg" alt="University Avatar" />
          <AvatarFallback>UN</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-semibold text-gray-800">
          {data.universityName}
        </h2>
        <p className="text-sm text-gray-600">{data.instituteType}</p>
      </div>

      <div className="space-y-6">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center text-sm">
              <Mail className="w-5 h-5 mr-3 text-[#0b6e4f]" />
              <span className="text-gray-700">{data.email}</span>
            </div>
            <div className="flex items-center text-sm">
              <Phone className="w-5 h-5 mr-3 text-[#0b6e4f]" />
              <span className="text-gray-700">{data.phone}</span>
            </div>
            <div className="flex items-center text-sm">
              <MapPin className="w-5 h-5 mr-3 text-[#0b6e4f]" />
              <span className="text-gray-700">{`${data.district}, ${data.state}`}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">
              Application Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Completion</span>
                  <span className="text-blue-600 font-semibold">65%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[65%] rounded-full" />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-800 mb-2">
                  Recent Activity
                </h4>
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">
                    Documents uploaded - 2 days ago
                  </p>
                  <p className="text-xs text-gray-600">
                    Application started - 5 days ago
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  </div>
);


interface MainContentProps {
  applicationTypes: ApplicationType[];
  selectedTypeId: string;
  setSelectedTypeId: (type: string) => void;
  instituteId: string;
  universityName: string;
  instituteData: any;
}


const MainContent: React.FC<MainContentProps> = ({
  applicationTypes,
  selectedTypeId,
  setSelectedTypeId,
  instituteId,
  universityName,
  instituteData,
}) => {
  const navigate = useNavigate();

  const handleWorkspaceLaunch = React.useCallback(() => {
    navigate("/institute/dashboard/application-workspace", {
      state: { selectedTypeId, instituteId, instituteName: universityName },
    });
  }, [navigate, selectedTypeId, instituteId, universityName]);

  return (
    <div className="flex-1 p-8 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {universityName}
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your applications
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          {
            icon: FileText,
            title: "Total Applications",
            value: "4",
            change: "+10% from last month",
            color: "text-blue-600",
          },
          {
            icon: Users,
            title: "In Review",
            value: "4",
            change: "+19% from last month",
            color: "text-green-600",
          },
          {
            icon: ChevronRight,
            title: "Approved",
            value: "0",
            change: "+4% from last month",
            color: "text-orange-600",
          },
        ].map((item, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.03 }}
            className="relative overflow-hidden rounded-lg"
          >
            <Card
              className="bg-white shadow-sm h-48"
              onClick={() => {
                navigate("/institute/applications");
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">
                  {item.title}
                </CardTitle>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${item.color}`}>
                  {item.value}
                </div>
                <p className="text-sm text-gray-600 mt-1">{item.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* <Separator className="my-8" /> */}

      <Card className="mb-6 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-gray-800">
            <BookOpen className="w-6 h-6 mr-3 text-[#0b6e4f]" />
            Start New Application
          </CardTitle>
          <CardDescription className="text-gray-600">
            Select an application type to begin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Select
              onValueChange={setSelectedTypeId}
              value={selectedTypeId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select application type" />
              </SelectTrigger>
              <SelectContent>
                {applicationTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="rounded-lg border border-gray-200 divide-y divide-gray-200">
              {applicationTypes
                .find((type) => type.id === selectedTypeId)
                ?.documents.map((doc: any, index) => (
                  <motion.div
                    key={doc.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-3 text-gray-700">
                      <FileText className="w-5 h-5 text-[#0b6e4f]" />
                      {doc.name}
                    </span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[#0b6e4f] border-[#0b6e4f] hover:bg-green-50"
                        >
                          View Format
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle className="text-2xl text-gray-800">
                            {doc.name}
                          </DialogTitle>
                          <DialogDescription className="text-gray-600">
                            Please review the document format
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4">
                          <iframe
                            title={`${doc.name} format preview`}
                            src={encodeURI(doc.pdfPath)}
                            className="w-full h-[70vh] border rounded"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </motion.div>
                ))}
            </div>
          </div>
          <Button
            className="mt-6 bg-[#0b6e4f] hover:bg-[#095a40] text-white"
            onClick={handleWorkspaceLaunch}
          >
            Start Application
          </Button>
          <div>
            {/* <Separator className="my-4" /> */}
            <Button
              onClick={() => {
                navigate("/institute/infrastructure");
              }}
            >
              Verify Infrastructure
            </Button>
          </div>
        </CardContent>
      </Card>

    {/* ...existing dashboard content... */}
    {/* Evidence Report Section (bottom) for institution */}
    {/* Use latest or selected application for uni_application_id if available */}
    {instituteData?.latestApplication?.uni_application_id && (
      <EvidenceReportSectionInstitution uni_application_id={instituteData.latestApplication.uni_application_id} />
    )}
  </div>
  );
};

export default function Dashboard() {
  const [applicationOptions, setApplicationOptions] = React.useState<ApplicationType[]>(typedApplicationTypes);
  const [selectedType, setSelectedType] = React.useState(
    typedApplicationTypes[0].id
  );
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const { pathname } = useLocation();
  const [isChatOpen, setIsChatOpen] = React.useState(false);

  const { setInstituteId } = useInstituteStore();
  const { mutateAsync: getInstituteData } = useInstituteData();
  const [instituteData, setInstituteData] = React.useState<any | null>(null);
  const { token } = useAuthStore();

  React.useEffect(() => {
    const loginSource = localStorage.getItem("loginSource");
    if (loginSource === "ugc") {
      const ugcTypes = buildUgcApplicationTypes();
      setApplicationOptions(ugcTypes);
      setSelectedType(ugcTypes[0]?.id || "");
    } else {
      setApplicationOptions(typedApplicationTypes);
      setSelectedType(typedApplicationTypes[0]?.id || "");
    }
  }, []);

  React.useEffect(() => {
    const fetchInstituteData = async () => {
      try {
        // Get institute_id from JWT token
        if (!token) {
          console.error("No token found");
          return;
        }

        const decoded: any = jwtDecode(token);
        console.log("Decoded token:", decoded);
        
        // Token structure: { sub: institute_id, role: 'institute', iat: timestamp }
        const instituteId = decoded.sub || decoded.institute_id;

        if (!instituteId) {
          console.error("No institute_id in token. Token content:", decoded);
          return;
        }

        console.log("Fetching data for institute:", instituteId);
        const resp = await getInstituteData(instituteId);
        console.log("Institute data response from API:", resp);
        setInstituteData(resp.institute || resp.data || resp);
        const id = resp.institute?.id || resp.data?.id || resp.id;
        if (id) setInstituteId(id);
      } catch (err) {
        console.error("Error loading institute data:", err);
      }
    };

    fetchInstituteData();
  }, [getInstituteData, setInstituteId, token]);

  if (!instituteData) {
    return <DashboardSkeleton />;
  }
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex flex-1">
        <MainContent
          applicationTypes={applicationOptions}
          selectedTypeId={selectedType}
          setSelectedTypeId={setSelectedType}
          instituteId={instituteData.id}
          universityName={instituteData.universityName || instituteData.name}
          instituteData={instituteData}
        />
      </div>
      {/* Uncomment if you want the right sidebar */}
      {/* <RightSidebar data={instituteData} /> */}
    </div>
  );
}
