import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import jsPDF from "jspdf";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getPlacementReport, scorePlacement } from "@/lib/placements";
import type { PlacementReportResponse } from "@/types/placements";
import PlacementComponentDrilldown from "@/components/PlacementComponentDrilldown";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, ArrowLeft, Download, RefreshCcw, ShieldCheck, Sparkles } from "lucide-react";

const severityTone: Record<string, string> = {
  critical: "border-rose-200/40 bg-rose-50/10 text-rose-50",
  warning: "border-amber-200/40 bg-amber-50/10 text-amber-50",
  info: "border-sky-200/40 bg-sky-50/10 text-sky-50"
};

const pieColors = ["#38bdf8", "#f472b6"];
const breakdownLabels: Record<string, string> = {
  placementPercent: "Placement % (60%)",
  avgSalaryGrowth: "Salary Index (20%)",
  industryImmersion: "Industry Linkages (10%)",
  higherEducation: "Higher Education (10%)"
};

const PlacementDetailReport = () => {
  const { collegeCode } = useParams<{ collegeCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const friendlyName = (location.state as { instituteName?: string } | undefined)?.instituteName;

  const queryKey = ["placement-report", collegeCode];

  const { data, isLoading, error, refetch } = useQuery<PlacementReportResponse, Error>({
    queryKey,
    queryFn: () => getPlacementReport(collegeCode ?? ""),
    enabled: Boolean(collegeCode)
  });

  const rescoreMutation = useMutation({
    mutationFn: () => (collegeCode ? scorePlacement(collegeCode) : Promise.reject(new Error("Missing college code"))),
    onSuccess: () => {
      toast({ title: "AI scoring refreshed", description: "Latest placement intelligence is live." });
      refetch();
    },
    onError: (err: Error) => {
      toast({ title: "Unable to refresh score", description: err.message, variant: "destructive" });
    }
  });

  const scorecard = data?.scorecard;
  const breakdown = scorecard?.breakdown ?? {};
  const coreBreakdown = data?.trends.coreVsNonCore ?? [];
  const industryTrend = data?.trends.industry ?? [];
  const placementTrend = data?.trends.placement ?? [];
  const salaryTrend = data?.trends.avgSalary ?? [];
  const dataset = data?.dataset ?? [];
  const complianceFlags = data?.complianceFlags ?? [];
  const suggestedActions = scorecard?.suggested_actions ?? [];

  const summaryChips = useMemo(() => {
    if (!scorecard) return [];
    return Object.entries(breakdown).map(([label, value]) => ({
      label: breakdownLabels[label] || label,
      value: Number(value).toFixed(1)
    }));
  }, [breakdown, scorecard]);

  const handleDownloadReport = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("AICTE Placement Compliance Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Institution: ${data.college.name}`, 14, 32);
    const scoreValue = scorecard ? scorecard.placementScore.toFixed(1) : "--";
    const ratingLabel = scorecard?.performanceRating ?? "NA";
    const riskLabel = scorecard?.riskLevel ?? "NA";
    const remarksText = scorecard?.remarks ?? "No AI remarks recorded yet.";
    doc.text(`AI Score: ${scoreValue} (${ratingLabel})`, 14, 40);
    doc.text(`Risk Level: ${riskLabel}`, 14, 48);
    doc.text(`Remarks: ${remarksText}`, 14, 56, { maxWidth: 180 });

    doc.setFont("helvetica", "bold");
    doc.text("Recent Cohorts", 14, 72);
    doc.setFont("helvetica", "normal");
    const latestRows = data.dataset.slice(-5);
    latestRows.forEach((row, index) => {
      const line = `${row.academicYear} | Placed ${row.studentsPlaced}/${row.eligibleStudents} (${row.placementPercent}%) | Avg ₹${row.avgSalaryLpa} L`;
      doc.text(line, 14, 82 + index * 6);
    });

    doc.setFont("helvetica", "bold");
    doc.text("Suggested Actions", 14, 120);
    doc.setFont("helvetica", "normal");
    suggestedActions.slice(0, 4).forEach((action, index) => {
      doc.text(`• ${action}`, 14, 130 + index * 6, { maxWidth: 180 });
    });

    doc.save(`placement-report-${data.college.code}.pdf`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950/95 px-4 py-16 text-slate-50">
        <div className="mx-auto max-w-4xl">
          <Alert variant="destructive">
            <AlertTitle>Unable to load report</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-slate-950/95 px-4 py-16 text-slate-50">
        <div className="mx-auto max-w-4xl space-y-4">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>Loading placement analytics…</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400">Fetching AI compliance data.</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white/80 p-6 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Placement Compliance Report</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
              {friendlyName || data?.college.name || collegeCode}
            </h1>
            <p className="text-sm text-slate-600">{data?.college.state} · {data?.college.university}</p>
            {scorecard && (
              <div className="mt-4 flex flex-wrap gap-3">
                <Badge className="bg-emerald-100 text-emerald-800">AI Score {scorecard.placementScore.toFixed(1)}</Badge>
                <Badge className="bg-blue-100 text-blue-800">{scorecard.performanceRating}</Badge>
                <Badge className="bg-orange-100 text-orange-800">Risk: {scorecard.riskLevel}</Badge>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate(-1)} className="border-slate-300 text-slate-700">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button variant="secondary" onClick={() => refetch()} disabled={isLoading} className="bg-slate-200 text-slate-900">
              <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button onClick={handleDownloadReport} className="bg-sky-500 text-white hover:bg-sky-600">
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>

        {scorecard && (
          <div className="grid gap-4 md:grid-cols-4">
            {summaryChips.map((chip) => (
              <Card key={chip.label} className="border-slate-200 bg-white/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wide text-slate-600">{chip.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold text-slate-900">{chip.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-200 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Sparkles className="h-4 w-4 text-sky-600" /> Placement % Trend (2015–2025)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={placementTrend}> 
                  <XAxis dataKey="year" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: "#f1f5f9", borderColor: "#cbd5e1" }} />
                  <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Average Salary Growth
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salaryTrend}>
                  <defs>
                    <linearGradient id="salaryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f1f5f9" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: "#f1f5f9", borderColor: "#cbd5e1" }} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fill="url(#salaryGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-slate-200 bg-white/80">
            <CardHeader>
              <CardTitle className="text-slate-900">Core vs Non-Core jobs</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={coreBreakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                    {coreBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/80 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-slate-900">Industry linkages & higher education</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={industryTrend}>
                  <XAxis dataKey="year" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: "#f1f5f9", borderColor: "#cbd5e1" }} />
                  <Legend />
                  <Bar dataKey="industryMoUs" fill="#0ea5e9" name="MoUs" />
                  <Bar dataKey="internshipsCount" fill="#f59e0b" name="Internships" />
                  <Bar dataKey="higherEducationPercent" fill="#10b981" name="Higher Ed %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-white/10 bg-slate-900/70">
            <CardHeader>
              <CardTitle>Compliance Flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {complianceFlags.map((flag) => (
                <div key={flag.id} className={`rounded-2xl border px-4 py-3 ${severityTone[flag.severity] || "border-white/10"}`}>
                  <p className="text-sm font-semibold">{flag.title}</p>
                  <p className="text-xs text-slate-300">{flag.description}</p>
                  <p className="mt-2 text-xs text-slate-400">Action: {flag.recommendedAction}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-900/70">
            <CardHeader>
              <CardTitle>Suggested Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-slate-300">
                {suggestedActions.map((action) => (
                  <li key={action} className="rounded-xl border border-white/5 bg-white/5 p-3">
                    {action}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {data?.componentDrilldown && (
          <Card className="border-white/10 bg-slate-900/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Sparkles className="h-4 w-4 text-amber-300" /> Detailed Component Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-slate-300">
                <PlacementComponentDrilldown data={data.componentDrilldown} />
              </div>
            </CardContent>
          </Card>
        )}


      </div>
    </div>
  );
};

export default PlacementDetailReport;
