import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getPlacementDashboard, scorePlacement, uploadPlacementSheet } from "@/lib/placements";
import type { PlacementDashboardResponse, PlacementDashboardRow, PlacementQueryParams, PlacementSortField, SortDirection } from "@/types/placements";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Filter,
  RefreshCcw,
  Sparkles,
  UploadCloud
} from "lucide-react";

const severityChip: Record<string, string> = {
  Low: "bg-emerald-100/20 text-emerald-200 border border-emerald-400/30",
  Medium: "bg-amber-100/20 text-amber-100 border border-amber-400/30",
  High: "bg-rose-100/20 text-rose-100 border border-rose-400/40"
};

const ratingAccent: Record<string, string> = {
  Exemplary: "text-sky-200",
  Compliant: "text-emerald-200",
  Watch: "text-amber-100",
  "High Risk": "text-rose-100"
};

const DEFAULT_PARAMS: PlacementQueryParams = {
  page: 1,
  pageSize: 8,
  sortBy: "aiScore",
  sortDir: "desc"
};

const MiniTrendChart = ({ data, id }: { data: { year: number; value: number }[]; id: string }) => {
  if (!data?.length) {
    return <div className="text-xs text-slate-400">No data</div>;
  }

  const gradientId = `trend-${id}`;

  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ left: 0, right: 0, top: 6, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.85} />
            <stop offset="95%" stopColor="#0f172a" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke="#38bdf8"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          className="drop-shadow-[0_0_8px_rgba(56,189,248,0.35)]"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const PlacementDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [filters, setFilters] = useState({ state: "all", university: "all", rating: "all" });
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const queryKey = ["placements", params, filters, search];

  const { data, isLoading, isFetching, refetch } = useQuery<PlacementDashboardResponse, Error>({
    queryKey,
    queryFn: () =>
      getPlacementDashboard({
        ...params,
        state: filters.state !== "all" ? filters.state : undefined,
        university: filters.university !== "all" ? filters.university : undefined,
        rating: filters.rating !== "all" ? filters.rating : undefined,
        search: search || undefined
      }),
    placeholderData: (previousData) => previousData
  });

  const uploadMutation = useMutation({
    mutationFn: uploadPlacementSheet,
    onSuccess: (response) => {
      toast({
        title: "Placement data ingested",
        description: `${response.data.collegesUpdated} institutes rescored with AI compliance.`
      });
      setFile(null);
      setSheetOpen(false);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
  });

  const rescoreMutation = useMutation({
    mutationFn: (collegeCode: string) => scorePlacement(collegeCode),
    onSuccess: (response, collegeCode) => {
      toast({
        title: "AI score refreshed",
        description: `${collegeCode} is now rated ${response.performanceRating} (${response.placementScore.toFixed(1)})`
      });
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      toast({ title: "Unable to re-score", description: error.message, variant: "destructive" });
    }
  });

  const summary = data?.summary;
  const filtersResponse = data?.filters;

  const isTableEmpty = !isLoading && !data?.items?.length;

  const handleSort = (column: PlacementSortField) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      sortBy: column,
      sortDir: prev.sortBy === column && prev.sortDir === "asc" ? "desc" : "asc"
    }));
  };

  const handleUpload = () => {
    if (!file) return;
    uploadMutation.mutate(file);
  };

  const resetFilters = () => {
    setFilters({ state: "all", university: "all", rating: "all" });
    setParams(DEFAULT_PARAMS);
    setSearch("");
  };

  const headerDescription = useMemo(() => {
    if (!data?.items?.length) return "Upload placement history to unlock AI scoring.";
    return `${data.meta.total} institutes analysed with NAAC-style scoring.`;
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="space-y-8">
          <div className="rounded-3xl border border-emerald-100/70 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.25),_transparent_50%),linear-gradient(135deg,_#f0fdf4,_#ecfeff)] p-8 text-slate-900 shadow-[0_25px_80px_rgba(15,23,42,0.15)]">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-emerald-600">Evaluator Intelligence</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                  Placement Scoring Compliance Module
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-600">{headerDescription}</p>
                {summary && (
                  <div className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                    <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 text-slate-700">
                      <p className="text-xs uppercase tracking-wide text-emerald-600">Average AI Score</p>
                      <p className="mt-1 text-2xl font-semibold text-emerald-700">{summary.averageScore.toFixed(1)}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 text-slate-700">
                      <p className="text-xs uppercase tracking-wide text-emerald-600">Low Risk Institutes</p>
                      <p className="mt-1 text-2xl font-semibold text-emerald-700">{summary.lowRiskCount}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 text-slate-700">
                      <p className="text-xs uppercase tracking-wide text-emerald-600">Compliance Flags</p>
                      <p className="mt-1 text-2xl font-semibold text-amber-600">{summary.flaggedInstitutions}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => refetch()} disabled={isFetching} className="bg-emerald-600 text-white hover:bg-emerald-500">
                  <RefreshCcw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                  Refresh Data
                </Button>
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger asChild>
                    <Button className="bg-teal-500 text-white hover:bg-teal-400">
                      <UploadCloud className="mr-2 h-4 w-4" /> Upload Excel
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="max-w-xl overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Upload placement analytics file</SheetTitle>
                      <SheetDescription>
                        Provide the 10-year history (same format as Scholarship module). AI scoring kicks in instantly.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      <div>
                        <Label htmlFor="placement-file">Placement workbook</Label>
                        <Input
                          id="placement-file"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={(event) => {
                            const nextFile = event.target.files?.[0] ?? null;
                            setFile(nextFile);
                          }}
                          className="mt-2"
                        />
                        <p className="mt-2 text-xs text-slate-400">
                          Columns required: College Code, Academic Year, Eligible Students, Students Placed, Avg Salary (LPA), Core %, MoUs, Internships, Higher Education %.
                        </p>
                        <a
                          href="http://localhost:3100/documents/placement_sample.xlsx"
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center text-xs font-semibold text-sky-400"
                        >
                          <ArrowUpRight className="mr-1 h-3 w-3" /> Download template
                        </a>
                      </div>
                      <div className="rounded-2xl border border-dashed border-teal-200 bg-teal-50 p-4 text-xs text-teal-900">
                        <p className="font-semibold">AI Compliance Tips</p>
                        <ul className="mt-2 list-disc space-y-1 pl-4">
                          <li>Academic year must cover 2015–2025 for best insights.</li>
                          <li>Placement % will be auto-calculated if blank.</li>
                          <li>Internship + MoU counts map to NAAC industry linkage scores.</li>
                        </ul>
                      </div>
                      <Button
                        onClick={handleUpload}
                        disabled={!file || uploadMutation.isPending}
                        className="w-full"
                      >
                        {uploadMutation.isPending ? "Processing..." : "Run automated analysis"}
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>

          <Card className="border-slate-200 bg-white text-slate-900 shadow-xl">
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <BarChart3 className="h-5 w-5 text-emerald-500" /> Institution Placement Dashboard
                </CardTitle>
                <p className="text-sm text-slate-600">
                  Filter by state, university or performance rating to prioritise evaluations.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-emerald-100 px-3 py-1 text-xs text-emerald-700 bg-emerald-50">
                  <Filter className="h-3.5 w-3.5 text-emerald-500" /> Advanced filters active
                </div>
                <Button variant="outline" size="sm" onClick={resetFilters} className="border-slate-300 text-slate-700">
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-5">
                <div className="md:col-span-2">
                  <Label htmlFor="search" className="text-xs uppercase tracking-wide text-slate-600">
                    Search College / State
                  </Label>
                  <Input
                    id="search"
                    placeholder="e.g. Pune, VTU, Innovation"
                    value={search}
                    onChange={(event) => {
                      setParams((prev) => ({ ...prev, page: 1 }));
                      setSearch(event.target.value);
                    }}
                    className="mt-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-slate-600">State</Label>
                  <Select
                    value={filters.state}
                    onValueChange={(value) => {
                      setFilters((prev) => ({ ...prev, state: value }));
                      setParams((prev) => ({ ...prev, page: 1 }));
                    }}
                  >
                    <SelectTrigger className="mt-2 border-slate-200 bg-white text-slate-900">
                      <SelectValue placeholder="All states" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All states</SelectItem>
                      {filtersResponse?.states?.map((stateOption: string) => (
                        <SelectItem key={stateOption} value={stateOption}>
                          {stateOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-slate-600">University</Label>
                  <Select
                    value={filters.university}
                    onValueChange={(value) => {
                      setFilters((prev) => ({ ...prev, university: value }));
                      setParams((prev) => ({ ...prev, page: 1 }));
                    }}
                  >
                    <SelectTrigger className="mt-2 border-slate-200 bg-white text-slate-900">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All universities</SelectItem>
                      {filtersResponse?.universities?.map((uni: string) => (
                        <SelectItem key={uni} value={uni}>
                          {uni}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-slate-600">Performance Rating</Label>
                  <Select
                    value={filters.rating}
                    onValueChange={(value) => {
                      setFilters((prev) => ({ ...prev, rating: value }));
                      setParams((prev) => ({ ...prev, page: 1 }));
                    }}
                  >
                    <SelectTrigger className="mt-2 border-slate-200 bg-white text-slate-900">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All bands</SelectItem>
                      {filtersResponse?.performanceRatings?.map((ratingOption: string) => (
                        <SelectItem key={ratingOption} value={ratingOption}>
                          {ratingOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <Table>
                  <TableHeader className="bg-emerald-50">
                    <TableRow>
                      <TableHead className="text-slate-700">Institution</TableHead>
                      <TableHead className="cursor-pointer text-slate-700" onClick={() => handleSort("placementPercent")}>
                        <div className="flex items-center gap-1">
                          Placement % (Last AY)
                          {params.sortBy === "placementPercent" && (
                            <span className="text-xs text-slate-500">{params.sortDir === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-700">Average Package Trend (10 yrs)</TableHead>
                      <TableHead className="text-slate-700">Industry Linkages</TableHead>
                      <TableHead className="cursor-pointer text-slate-700" onClick={() => handleSort("higherEducationPercent")}>
                        <div className="flex items-center gap-1">
                          Higher Education %
                          {params.sortBy === "higherEducationPercent" && (
                            <span className="text-xs text-slate-500">{params.sortDir === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer text-slate-700" onClick={() => handleSort("aiScore")}>
                        <div className="flex items-center gap-1">
                          AI Score (0–100)
                          {params.sortBy === "aiScore" && (
                            <span className="text-xs text-slate-500">{params.sortDir === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-right text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                          Loading placement intelligence...
                        </TableCell>
                      </TableRow>
                    )}
                    {isTableEmpty && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                          No placement entries yet. Upload an Excel sheet to initialise scoring.
                        </TableCell>
                      </TableRow>
                    )}
                    {data?.items?.map((row: PlacementDashboardRow) => (
                      <TableRow key={row.collegeCode} className="border-slate-100 hover:bg-slate-50">
                        <TableCell className="align-top">
                          <div>
                            <p className="font-semibold text-slate-900">{row.collegeName}</p>
                            <p className="text-xs text-slate-500">{row.state} · {row.university}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className={`border-none ${severityChip[row.riskLevel] || "bg-emerald-50 text-emerald-700"}`}>
                                {row.riskLevel} Risk
                              </Badge>
                              <span className={`text-xs font-semibold ${ratingAccent[row.performanceRating] || "text-slate-500"}`}>
                                {row.performanceRating}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <p className="text-lg font-semibold text-slate-100">{row.placementPercent.toFixed(1)}%</p>
                          <p className="text-xs text-slate-400">AY {row.lastAcademicYear}</p>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="min-w-[160px]">
                            <MiniTrendChart data={row.averagePackageTrend} id={`${row.collegeCode}-avg`} />
                            <p className="mt-2 text-xs text-slate-400">Latest Avg Package · ₹{row.averagePackage.toFixed(1)} L</p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <p className="text-lg font-semibold text-slate-100">{row.industryMoUs}</p>
                          <p className="text-xs text-slate-400">MoUs · Internships {row.internshipsCount}</p>
                        </TableCell>
                        <TableCell className="align-top">
                          <p className="text-lg font-semibold text-slate-100">{row.higherEducationPercent.toFixed(1)}%</p>
                          <p className="text-xs text-slate-400">Students pursuing higher studies</p>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="min-w-[140px]">
                            <p className="text-xl font-semibold text-slate-50">{row.aiScore.toFixed(1)}</p>
                            <Progress value={row.aiScore} className="mt-2 bg-slate-800" />
                            <p className="mt-1 text-xs text-slate-400">AI Score (weighted)</p>
                          </div>
                        </TableCell>
                        <TableCell className="space-y-2 text-right align-top">
                          <Button
                            size="sm"
                            className="w-full bg-slate-800 text-slate-100"
                            onClick={() => navigate(`/evaluator/placements/${row.collegeCode}`, { state: { instituteName: row.collegeName } })}
                          >
                            <Sparkles className="mr-2 h-4 w-4" /> View Report
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={rescoreMutation.isPending}
                            onClick={() => rescoreMutation.mutate(row.collegeCode)}
                            className="w-full border-white/20 text-slate-100"
                          >
                            {rescoreMutation.isPending ? "Scoring..." : "Re-score"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                <p>
                  Page {params.page} of {data?.meta.totalPages ?? 1}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={params.page === 1}
                    onClick={() => setParams((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                  >
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={params.page >= (data?.meta.totalPages ?? 1)}
                    onClick={() => setParams((prev) => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>

              {data?.summary?.flaggedInstitutions ? (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-200/20 bg-amber-100/10 px-4 py-3 text-sm text-amber-100">
                  <AlertTriangle className="h-4 w-4" /> {data.summary.flaggedInstitutions} institutes need immediate compliance attention.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlacementDashboard;
