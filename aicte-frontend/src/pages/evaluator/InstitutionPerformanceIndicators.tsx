import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/lib/utils";
import { ArrowLeft, Loader2, RefreshCcw, ShieldCheck, TrendingUp, AlertTriangle } from "lucide-react";

interface PerformanceSummary {
  name: string;
  city: string;
  affiliationTier: string;
  overallScore: number;
  riskLevel: string;
  complianceStatus: string;
  evaluationWindow: string;
  complianceDelta: string;
}

type RiskSeverity = "low" | "medium" | "high";

interface KeyMetric {
  id: string;
  label: string;
  value: number;
  change: number;
  description: string;
}

interface DocumentInsight {
  section: string;
  readiness: number;
  blockers: string[];
  strengths: string[];
  lastUpdated: string;
}

interface RiskAlert {
  title: string;
  severity: RiskSeverity;
  detail: string;
  action: string;
}

interface ActionItem {
  title: string;
  owner: string;
  dueInDays: number;
  status: string;
  impact: string;
}

interface TimelinePoint {
  label: string;
  score: number;
  status: string;
}

interface PeerComparison {
  percentile: number;
  betterThan: number;
  focusAreas: string[];
}

interface PerformanceData {
  institutionId: string;
  generatedOn: string;
  summary: PerformanceSummary;
  peerComparison: PeerComparison;
  keyMetrics: KeyMetric[];
  documentInsights: DocumentInsight[];
  riskAlerts: RiskAlert[];
  actionItems: ActionItem[];
  timeline: TimelinePoint[];
}

const severityStyles: Record<RiskSeverity, { label: string; wrapper: string; badge: string; icon: typeof ShieldCheck }> = {
  low: {
    label: "Low",
    wrapper: "border-emerald-200 bg-emerald-50 text-emerald-800",
    badge: "bg-white/60 text-emerald-700",
    icon: ShieldCheck
  },
  medium: {
    label: "Medium",
    wrapper: "border-amber-200 bg-amber-50 text-amber-800",
    badge: "bg-white/60 text-amber-700",
    icon: AlertTriangle
  },
  high: {
    label: "High",
    wrapper: "border-rose-200 bg-rose-50 text-rose-800",
    badge: "bg-white/60 text-rose-700",
    icon: AlertTriangle
  }
};

export default function InstitutionPerformanceIndicators() {
  const { institutionId } = useParams<{ institutionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const friendlyName = (location.state as { instituteName?: string } | undefined)?.instituteName;
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayName = friendlyName || data?.summary.name || (institutionId ? `Institution ${institutionId}` : "Institution");
  const lastRefreshed = data ? new Date(data.generatedOn).toLocaleString() : null;

  const loadPerformance = useCallback(async () => {
    if (!institutionId) {
      setError("Institution identifier is missing in the URL.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/institutions/${institutionId}/performance`);
      setData(response.data?.data ?? null);
    } catch (_error) {
      setError("Unable to fetch performance indicators right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    loadPerformance();
  }, [loadPerformance]);

  const summaryBadges = useMemo(() => {
    if (!data) return [];
    return [
      { label: data.summary.affiliationTier, className: "bg-blue-50 text-blue-700" },
      { label: data.summary.city, className: "bg-slate-50 text-slate-700" },
      { label: data.summary.evaluationWindow, className: "bg-purple-50 text-purple-700" }
    ];
  }, [data]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Loading performance indicators</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3 text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              Fetching analytics for {friendlyName || "the selected institution"}...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Institution Performance Indicators</p>
            <h1 className="mt-2 text-4xl font-bold text-slate-900">{displayName}</h1>
            {lastRefreshed && (
              <p className="mt-1 text-sm text-slate-500">Analytics refreshed {lastRefreshed}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {summaryBadges.map((badge) => (
                <span key={badge.label} className={`rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
            </Button>
            <Button onClick={loadPerformance} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refreshing
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" /> Refresh data
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
            <AlertTitle>Unable to load indicators</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {data && (
          <div className="space-y-6">
            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Summary Snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase text-slate-500">Overall Score</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.overallScore}</p>
                    <p className="text-xs text-emerald-600">{data.summary.complianceDelta}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase text-slate-500">Risk Level</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{data.summary.riskLevel}</p>
                    <span className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {data.summary.complianceStatus}
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase text-slate-500">Peer Percentile</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{data.peerComparison.percentile}<span className="text-base">%</span></p>
                    <p className="text-xs text-slate-500">Ahead of {data.peerComparison.betterThan}% institutes</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase text-slate-500">Focus Areas</p>
                    <div className="mt-2 space-y-1 text-sm text-slate-700">
                      {data.peerComparison.focusAreas.map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-slate-400" /> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Key Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.keyMetrics.map((metric) => (
                    <div key={metric.id} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{metric.label}</p>
                          <p className="text-xs text-slate-500">{metric.description}</p>
                        </div>
                        <Badge variant="secondary" className={`text-xs ${metric.change >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                          {metric.change >= 0 ? "+" : ""}{metric.change}%
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <p className="text-3xl font-semibold text-slate-900">{metric.value}</p>
                        <span className="text-sm text-slate-500">/100</span>
                      </div>
                      <Progress className="mt-2" value={metric.value} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Document Readiness</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.documentInsights.map((doc) => (
                    <div key={doc.section} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{doc.section}</p>
                          <p className="text-xs text-slate-500">Updated {doc.lastUpdated}</p>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{doc.readiness}% ready</span>
                      </div>
                      <Progress className="mt-3" value={doc.readiness} />
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Strengths</p>
                          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-600">
                            {doc.strengths.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-rose-600">Blockers</p>
                          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-600">
                            {doc.blockers.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="border border-slate-200 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Risk Outlook</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.riskAlerts.map((alert) => {
                    const severity = severityStyles[alert.severity] || severityStyles.medium;
                    const Icon = severity.icon;
                    return (
                      <div key={alert.title} className={`rounded-lg border p-4 ${severity.wrapper}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <p className="font-semibold">{alert.title}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severity.badge}`}>
                            {severity.label}
                          </span>
                        </div>
                        <p className="mt-2 text-sm">{alert.detail}</p>
                        <p className="text-xs font-semibold uppercase tracking-wide">Recommended action</p>
                        <p className="text-sm text-slate-700">{alert.action}</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Priority Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.actionItems.map((action) => (
                    <div key={action.title} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-800">{action.title}</p>
                      <p className="text-xs text-slate-500">Owner: {action.owner}</p>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-slate-600">Due in {action.dueInDays} days</span>
                        <Badge variant="outline" className="text-xs uppercase tracking-wide">
                          {action.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Impact: {action.impact}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Timeline & Momentum</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4">
                {data.timeline.map((point) => (
                  <div key={point.label} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase text-slate-500">{point.label}</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{point.score}</p>
                    <p className="text-xs text-slate-500">{point.status}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
