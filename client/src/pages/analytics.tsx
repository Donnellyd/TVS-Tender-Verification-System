import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  ClipboardCheck,
  Download,
  Calendar,
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
  AreaChart,
  Area,
} from "recharts";
import type {
  TendersByStatus,
  TendersByMunicipality,
  ComplianceByCategory,
  VendorsByStatus,
  MonthlyTrends,
} from "@shared/schema";

const COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#ef4444", "#8b5cf6", "#14b8a6", "#ec4899"];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("30");

  const { data: tendersByStatus, isLoading: loadingTenderStatus } = useQuery<TendersByStatus[]>({
    queryKey: ["/api/analytics/tenders-by-status"],
  });

  const { data: tendersByMunicipality, isLoading: loadingMunicipality } = useQuery<TendersByMunicipality[]>({
    queryKey: ["/api/analytics/tenders-by-municipality"],
  });

  const { data: complianceByCategory, isLoading: loadingCompliance } = useQuery<ComplianceByCategory[]>({
    queryKey: ["/api/analytics/compliance-by-category"],
  });

  const { data: vendorsByStatus, isLoading: loadingVendors } = useQuery<VendorsByStatus[]>({
    queryKey: ["/api/analytics/vendors-by-status"],
  });

  const { data: monthlyTrends, isLoading: loadingTrends } = useQuery<MonthlyTrends[]>({
    queryKey: ["/api/analytics/monthly-trends"],
  });

  const exportReport = () => {
    const data = {
      tendersByStatus,
      tendersByMunicipality,
      complianceByCategory,
      vendorsByStatus,
      monthlyTrends,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tvs-analytics-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <PageHeader
        title="Analytics & Reporting"
        description="Insights into tender management and compliance performance"
      />

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]" data-testid="select-date-range">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={exportReport} data-testid="button-export">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tenders" data-testid="tab-tenders">
            <FileText className="h-4 w-4 mr-2" />
            Tenders
          </TabsTrigger>
          <TabsTrigger value="vendors" data-testid="tab-vendors">
            <Users className="h-4 w-4 mr-2" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="compliance" data-testid="tab-compliance">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Compliance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Monthly Trends */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Monthly Activity Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {loadingTrends ? (
                    <Skeleton className="w-full h-full" />
                  ) : monthlyTrends && monthlyTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrends}>
                        <defs>
                          <linearGradient id="colorTenders" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorVendors" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
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
                        <Area
                          type="monotone"
                          dataKey="tenders"
                          stroke="hsl(var(--chart-1))"
                          fill="url(#colorTenders)"
                          strokeWidth={2}
                          name="Tenders"
                        />
                        <Area
                          type="monotone"
                          dataKey="vendors"
                          stroke="hsl(var(--chart-2))"
                          fill="url(#colorVendors)"
                          strokeWidth={2}
                          name="Vendors"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No trend data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

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
                  {loadingTenderStatus ? (
                    <Skeleton className="w-full h-full" />
                  ) : tendersByStatus && tendersByStatus.length > 0 ? (
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
                        >
                          {tendersByStatus.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
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
                  {loadingVendors ? (
                    <Skeleton className="w-full h-full" />
                  ) : vendorsByStatus && vendorsByStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vendorsByStatus}>
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
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tenders Tab */}
        <TabsContent value="tenders" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tenders by Municipality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {loadingMunicipality ? (
                    <Skeleton className="w-full h-full" />
                  ) : tendersByMunicipality && tendersByMunicipality.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tendersByMunicipality} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="municipality" type="category" width={120} className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                          }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No municipality data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tender Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {loadingTenderStatus ? (
                    <Skeleton className="w-full h-full" />
                  ) : tendersByStatus && tendersByStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tendersByStatus}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          dataKey="count"
                          nameKey="status"
                          label={({ status, count, percent }) =>
                            `${status}: ${count} (${(percent * 100).toFixed(0)}%)`
                          }
                          labelLine={true}
                        >
                          {tendersByStatus.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vendor Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {loadingVendors ? (
                    <Skeleton className="w-full h-full" />
                  ) : vendorsByStatus && vendorsByStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={vendorsByStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="status"
                        >
                          {vendorsByStatus.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.status === "approved" ? "#22c55e" :
                                entry.status === "pending" ? "#f97316" :
                                entry.status === "suspended" ? "#ef4444" :
                                entry.status === "debarred" ? "#991b1b" :
                                COLORS[index % COLORS.length]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Vendor Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {loadingTrends ? (
                    <Skeleton className="w-full h-full" />
                  ) : monthlyTrends && monthlyTrends.length > 0 ? (
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
                        <Line
                          type="monotone"
                          dataKey="vendors"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth={3}
                          dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2 }}
                          name="New Vendors"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Compliance Pass Rate by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {loadingCompliance ? (
                    <Skeleton className="w-full h-full" />
                  ) : complianceByCategory && complianceByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={complianceByCategory}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="category" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="passed" name="Passed" fill="#22c55e" stackId="a" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="failed" name="Failed" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No compliance data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Compliance Checks Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {loadingTrends ? (
                    <Skeleton className="w-full h-full" />
                  ) : monthlyTrends && monthlyTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrends}>
                        <defs>
                          <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
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
                        <Area
                          type="monotone"
                          dataKey="complianceChecks"
                          stroke="hsl(var(--chart-4))"
                          fill="url(#colorCompliance)"
                          strokeWidth={2}
                          name="Compliance Checks"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pass Rate Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingCompliance ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : complianceByCategory && complianceByCategory.length > 0 ? (
                  <div className="space-y-4">
                    {complianceByCategory.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.category}</span>
                          <span className={`font-bold ${
                            item.passRate >= 80 ? "text-green-600" :
                            item.passRate >= 60 ? "text-yellow-600" :
                            "text-red-600"
                          }`}>
                            {item.passRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.passRate >= 80 ? "bg-green-500" :
                              item.passRate >= 60 ? "bg-yellow-500" :
                              "bg-red-500"
                            }`}
                            style={{ width: `${item.passRate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
