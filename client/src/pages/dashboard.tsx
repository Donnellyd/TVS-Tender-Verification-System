import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users,
  FileText,
  ClipboardCheck,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  X,
  ArrowRight,
  Layers,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Sector,
} from "recharts";
import type { DashboardStats, TendersByStatus, VendorsByStatus, MonthlyTrends } from "@shared/schema";

const COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#ef4444", "#8b5cf6", "#14b8a6"];

type DrillDownType = "tenders" | "vendors" | "compliance" | "pipeline" | null;

interface DrillDownTender {
  id: string;
  title: string;
  referenceNumber: string;
  status: string;
  budget: number;
  closingDate: string;
  category: string;
  municipality: string;
  createdAt: string;
}

interface DrillDownVendor {
  id: string;
  companyName: string;
  tradingName: string;
  contactPerson: string;
  contactEmail: string;
  status: string;
  bbbeeLevel: string;
  registrationNumber: string;
  createdAt: string;
}

interface ComplianceDrillDown {
  passRate: number;
  totalChecked: number;
  passed: number;
  failed: number;
  pending: number;
  recentResults: {
    id: string;
    vendorName: string;
    tenderTitle: string;
    complianceResult: string;
    totalScore: number;
    submittedAt: string;
  }[];
}

interface PipelineDrillDown {
  total: number;
  pipeline: { status: string; count: number }[];
  recent: {
    id: string;
    vendorName: string;
    tenderTitle: string;
    status: string;
    bidAmount: number;
    totalScore: number;
    submittedAt: string;
  }[];
}

function renderActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 8} dy={0} textAnchor="middle" fill="hsl(var(--foreground))" className="text-sm font-medium">
        {payload.status}
      </text>
      <text x={cx} y={cy + 12} dy={0} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-xs">
        {value} ({(percent * 100).toFixed(0)}%)
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 8} outerRadius={outerRadius + 12} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.3} />
    </g>
  );
}

function DrillDownPanel({
  type,
  filterLabel,
  onClose,
}: {
  type: DrillDownType;
  filterLabel: string | null;
  onClose: () => void;
}) {
  const tenderUrl = filterLabel
    ? `/api/analytics/drill-down/tenders?status=${encodeURIComponent(filterLabel)}`
    : "/api/analytics/drill-down/tenders";

  const tenderQuery = useQuery<DrillDownTender[]>({
    queryKey: [tenderUrl],
    enabled: type === "tenders",
  });

  const vendorUrl = filterLabel
    ? `/api/analytics/drill-down/vendors?status=${encodeURIComponent(filterLabel)}`
    : "/api/analytics/drill-down/vendors";

  const vendorQuery = useQuery<DrillDownVendor[]>({
    queryKey: [vendorUrl],
    enabled: type === "vendors",
  });

  const complianceQuery = useQuery<ComplianceDrillDown>({
    queryKey: ["/api/analytics/drill-down/compliance"],
    enabled: type === "compliance",
  });

  const pipelineQuery = useQuery<PipelineDrillDown>({
    queryKey: ["/api/analytics/drill-down/pipeline"],
    enabled: type === "pipeline",
  });

  const isLoading =
    (type === "tenders" && tenderQuery.isLoading) ||
    (type === "vendors" && vendorQuery.isLoading) ||
    (type === "compliance" && complianceQuery.isLoading) ||
    (type === "pipeline" && pipelineQuery.isLoading);

  const titles: Record<string, string> = {
    tenders: filterLabel ? `Tenders - ${filterLabel}` : "All Tenders",
    vendors: filterLabel ? `Vendors - ${filterLabel}` : "All Vendors",
    compliance: "Compliance Breakdown",
    pipeline: "Submission Pipeline",
  };

  return (
    <Card data-testid="drill-down-panel">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowRight className="h-4 w-4 text-primary" />
          {titles[type || ""]}
        </CardTitle>
        <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-drilldown">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : type === "tenders" && tenderQuery.data ? (
          <div className="overflow-x-auto">
            <p className="text-sm text-muted-foreground mb-3">{tenderQuery.data.length} tender(s) found</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Closing Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenderQuery.data.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No tenders found</TableCell></TableRow>
                ) : (
                  tenderQuery.data.slice(0, 20).map((t) => (
                    <TableRow key={t.id} data-testid={`row-tender-${t.id}`}>
                      <TableCell className="font-medium max-w-[200px] truncate">{t.title}</TableCell>
                      <TableCell><code className="text-xs">{t.referenceNumber || "-"}</code></TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                      <TableCell>{t.budget ? `R ${Number(t.budget).toLocaleString()}` : "-"}</TableCell>
                      <TableCell>{t.closingDate ? new Date(t.closingDate).toLocaleDateString() : "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : type === "vendors" && vendorQuery.data ? (
          <div className="overflow-x-auto">
            <p className="text-sm text-muted-foreground mb-3">{vendorQuery.data.length} vendor(s) found</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>B-BBEE</TableHead>
                  <TableHead>Reg. Number</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendorQuery.data.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No vendors found</TableCell></TableRow>
                ) : (
                  vendorQuery.data.slice(0, 20).map((v) => (
                    <TableRow key={v.id} data-testid={`row-vendor-${v.id}`}>
                      <TableCell className="font-medium max-w-[200px] truncate">{v.companyName}</TableCell>
                      <TableCell className="text-sm">{v.contactPerson}</TableCell>
                      <TableCell><StatusBadge status={v.status} /></TableCell>
                      <TableCell>{v.bbbeeLevel ? <Badge variant="outline">Level {v.bbbeeLevel}</Badge> : "-"}</TableCell>
                      <TableCell><code className="text-xs">{v.registrationNumber || "-"}</code></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : type === "compliance" && complianceQuery.data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-md bg-muted/50 text-center">
                <p className="text-2xl font-bold">{complianceQuery.data.totalChecked}</p>
                <p className="text-xs text-muted-foreground">Total Checked</p>
              </div>
              <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{complianceQuery.data.passed}</p>
                <p className="text-xs text-muted-foreground">Passed</p>
              </div>
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{complianceQuery.data.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
              <div className="p-3 rounded-md bg-orange-50 dark:bg-orange-900/20 text-center">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{complianceQuery.data.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <p className="text-sm font-medium mb-2">Recent Compliance Results</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Tender</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complianceQuery.data.recentResults.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No compliance data</TableCell></TableRow>
                  ) : (
                    complianceQuery.data.recentResults.map((r) => (
                      <TableRow key={r.id} data-testid={`row-compliance-${r.id}`}>
                        <TableCell className="font-medium max-w-[160px] truncate">{r.vendorName || "-"}</TableCell>
                        <TableCell className="max-w-[160px] truncate">{r.tenderTitle || "-"}</TableCell>
                        <TableCell>
                          {r.complianceResult === "pass" ? (
                            <Badge className="bg-green-600 border-green-700">Pass</Badge>
                          ) : r.complianceResult === "fail" ? (
                            <Badge variant="destructive">Fail</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>{r.totalScore || "-"}</TableCell>
                        <TableCell>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : type === "pipeline" && pipelineQuery.data ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Total submissions:</span>
              <span className="font-bold">{pipelineQuery.data.total}</span>
            </div>
            <div className="h-[200px]">
              {pipelineQuery.data.pipeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineQuery.data.pipeline}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="status" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No pipeline data</div>
              )}
            </div>
            <div className="overflow-x-auto">
              <p className="text-sm font-medium mb-2">Recent Submissions</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Tender</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bid Amount</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pipelineQuery.data.recent.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No submissions</TableCell></TableRow>
                  ) : (
                    pipelineQuery.data.recent.map((s) => (
                      <TableRow key={s.id} data-testid={`row-pipeline-${s.id}`}>
                        <TableCell className="font-medium max-w-[160px] truncate">{s.vendorName || "-"}</TableCell>
                        <TableCell className="max-w-[160px] truncate">{s.tenderTitle || "-"}</TableCell>
                        <TableCell><StatusBadge status={s.status} /></TableCell>
                        <TableCell>{s.bidAmount ? `R ${Number(s.bidAmount).toLocaleString()}` : "-"}</TableCell>
                        <TableCell>{s.totalScore || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No data available</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [drillDown, setDrillDown] = useState<DrillDownType>(null);
  const [drillDownFilter, setDrillDownFilter] = useState<string | null>(null);
  const [activePieIndex, setActivePieIndex] = useState<number>(-1);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const { data: tendersByStatus } = useQuery<TendersByStatus[]>({
    queryKey: ["/api/analytics/tenders-by-status"],
  });

  const { data: vendorsByStatus } = useQuery<VendorsByStatus[]>({
    queryKey: ["/api/analytics/vendors-by-status"],
  });

  const { data: monthlyTrends } = useQuery<MonthlyTrends[]>({
    queryKey: ["/api/analytics/monthly-trends"],
  });

  const openDrillDown = (type: DrillDownType, filter?: string) => {
    setDrillDown(type);
    setDrillDownFilter(filter || null);
  };

  const closeDrillDown = () => {
    setDrillDown(null);
    setDrillDownFilter(null);
  };

  const handlePieClick = (_data: any, index: number) => {
    if (tendersByStatus && tendersByStatus[index]) {
      openDrillDown("tenders", tendersByStatus[index].status);
    }
  };

  const handleBarClick = (data: any) => {
    if (data?.status) {
      openDrillDown("vendors", data.status);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <PageHeader
        title="Dashboard"
        description="Overview of tender vetting and verification activities. Click any chart to drill down into the data."
        moduleId="dashboard"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <div className="cursor-pointer" onClick={() => openDrillDown("vendors")} data-testid="stat-total-vendors-clickable">
              <StatsCard
                title="Total Vendors"
                value={stats?.totalVendors || 0}
                subtitle={`${stats?.activeVendors || 0} active - Click to drill down`}
                icon={Users}
                iconColor="blue"
                testId="stat-total-vendors"
              />
            </div>
            <div className="cursor-pointer" onClick={() => openDrillDown("tenders")} data-testid="stat-open-tenders-clickable">
              <StatsCard
                title="Open Tenders"
                value={stats?.openTenders || 0}
                subtitle={`${stats?.totalTenders || 0} total - Click to drill down`}
                icon={FileText}
                iconColor="green"
                testId="stat-open-tenders"
              />
            </div>
            <div className="cursor-pointer" onClick={() => openDrillDown("compliance")} data-testid="stat-compliance-clickable">
              <StatsCard
                title="Compliance Rate"
                value={`${stats?.compliancePassRate || 0}%`}
                subtitle="Pass rate - Click to drill down"
                icon={ClipboardCheck}
                iconColor="purple"
                testId="stat-compliance-rate"
              />
            </div>
            <div className="cursor-pointer" onClick={() => openDrillDown("pipeline")} data-testid="stat-pipeline-clickable">
              <StatsCard
                title="Pending Reviews"
                value={stats?.pendingReviews || 0}
                subtitle={`${stats?.documentsToVerify || 0} documents - Click to drill down`}
                icon={AlertCircle}
                iconColor="orange"
                testId="stat-pending-reviews"
              />
            </div>
          </>
        )}
      </div>

      {drillDown && (
        <DrillDownPanel type={drillDown} filterLabel={drillDownFilter} onClose={closeDrillDown} />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-base">Tenders by Status</span>
              </div>
              <span className="text-xs text-muted-foreground font-normal">Click a segment to drill down</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {tendersByStatus && tendersByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tendersByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="status"
                      activeIndex={activePieIndex}
                      activeShape={renderActiveShape}
                      onMouseEnter={(_: any, index: number) => setActivePieIndex(index)}
                      onMouseLeave={() => setActivePieIndex(-1)}
                      onClick={handlePieClick}
                      className="cursor-pointer"
                    >
                      {tendersByStatus.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No tender data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-base">Vendors by Status</span>
              </div>
              <span className="text-xs text-muted-foreground font-normal">Click a bar to drill down</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {vendorsByStatus && vendorsByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vendorsByStatus} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="status" type="category" width={80} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                      onClick={handleBarClick}
                      className="cursor-pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No vendor data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-base">Monthly Trends</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openDrillDown("pipeline")}
              data-testid="button-view-pipeline"
            >
              <Layers className="h-3 w-3 mr-1" />
              View Pipeline
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {monthlyTrends && monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tenders"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-1))" }}
                    name="Tenders"
                  />
                  <Line
                    type="monotone"
                    dataKey="vendors"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-2))" }}
                    name="Vendors"
                  />
                  <Line
                    type="monotone"
                    dataKey="complianceChecks"
                    stroke="hsl(var(--chart-4))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-4))" }}
                    name="Compliance Checks"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No trend data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {stats.recentActivity.slice(0, 5).map((activity, index) => (
                <div
                  key={activity.id || index}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
                >
                  <div className={`rounded-full p-2 ${
                    activity.action.includes("create") ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" :
                    activity.action.includes("update") ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" :
                    activity.action.includes("delete") ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" :
                    "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400"
                  }`}>
                    {activity.action.includes("create") ? <CheckCircle className="h-4 w-4" /> :
                     activity.action.includes("delete") ? <XCircle className="h-4 w-4" /> :
                     <Clock className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activity.action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.entityType} {activity.entityId ? `#${activity.entityId.slice(0, 8)}` : ""}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
