import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Users,
  FileText,
  ClipboardCheck,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
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
} from "recharts";
import type { DashboardStats, TendersByStatus, VendorsByStatus, MonthlyTrends } from "@shared/schema";

const COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#ef4444", "#8b5cf6", "#14b8a6"];

export default function Dashboard() {
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

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <PageHeader
        title="Dashboard"
        description="Overview of tender vetting and verification activities"
        moduleId="dashboard"
      />

      {/* Stats Grid */}
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
            <StatsCard
              title="Total Vendors"
              value={stats?.totalVendors || 0}
              subtitle={`${stats?.activeVendors || 0} active`}
              icon={Users}
              iconColor="blue"
              testId="stat-total-vendors"
            />
            <StatsCard
              title="Open Tenders"
              value={stats?.openTenders || 0}
              subtitle={`${stats?.totalTenders || 0} total`}
              icon={FileText}
              iconColor="green"
              testId="stat-open-tenders"
            />
            <StatsCard
              title="Compliance Rate"
              value={`${stats?.compliancePassRate || 0}%`}
              subtitle="Pass rate"
              icon={ClipboardCheck}
              iconColor="purple"
              testId="stat-compliance-rate"
            />
            <StatsCard
              title="Pending Reviews"
              value={stats?.pendingReviews || 0}
              subtitle={`${stats?.documentsToVerify || 0} documents`}
              icon={AlertCircle}
              iconColor="orange"
              testId="stat-pending-reviews"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tenders by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Tenders by Status
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
                      label={({ status, count }) => `${status}: ${count}`}
                      labelLine={false}
                    >
                      {tendersByStatus.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
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

        {/* Vendors by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-muted-foreground" />
              Vendors by Status
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
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
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

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Monthly Trends
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

      {/* Recent Activity */}
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
