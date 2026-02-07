import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableSkeleton } from "@/components/DataTableSkeleton";
import { DollarSign, TrendingUp, Award, Percent } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

interface Tender {
  id: string;
  title: string;
  tenderNumber: string;
  category?: string;
  municipality?: string;
}

interface Submission {
  id: string;
  tenderId: string;
  vendorName: string;
  bidAmount: number;
  status: string;
  submissionDate?: string;
  submittedAt?: string;
  createdAt?: string;
  awardedDate?: string;
}

interface Municipality {
  id: number;
  name: string;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "6px",
};

export default function SpendAnalytics() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("all");

  const { data: submissions, isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ["/api/submissions"],
  });

  const { data: tenders } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });

  const { data: municipalities } = useQuery<Municipality[]>({
    queryKey: ["/api/municipalities"],
  });

  const tenderMap = useMemo(() => {
    const map = new Map<string, Tender>();
    tenders?.forEach((t) => map.set(t.id, t));
    return map;
  }, [tenders]);

  const awardedSubmissions = useMemo(() => {
    if (!submissions) return [];
    return submissions.filter((s) => {
      if (s.status !== "awarded") return false;
      const tender = tenderMap.get(s.tenderId);
      if (selectedMunicipality !== "all" && tender?.municipality !== selectedMunicipality) return false;
      const dateStr = s.awardedDate || s.submissionDate || s.submittedAt || s.createdAt || "";
      if (startDate && dateStr && dateStr < startDate) return false;
      if (endDate && dateStr && dateStr > endDate) return false;
      return true;
    });
  }, [submissions, tenderMap, selectedMunicipality, startDate, endDate]);

  const stats = useMemo(() => {
    const totalSpend = awardedSubmissions.reduce((sum, s) => sum + (s.bidAmount || 0), 0);
    const count = awardedSubmissions.length;
    const avgBid = count > 0 ? totalSpend / count : 0;
    const allBids = submissions?.filter((s) => s.bidAmount > 0).map((s) => s.bidAmount) || [];
    const avgAllBids = allBids.length > 0 ? allBids.reduce((a, b) => a + b, 0) / allBids.length : 0;
    const savings = avgAllBids > 0 ? ((avgAllBids - avgBid) / avgAllBids) * 100 : 0;
    return { totalSpend, count, avgBid, savings: Math.max(0, savings) };
  }, [awardedSubmissions, submissions]);

  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, number>();
    awardedSubmissions.forEach((s) => {
      const dateStr = s.awardedDate || s.submissionDate || s.submittedAt || s.createdAt || "";
      if (!dateStr) return;
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) || 0) + (s.bidAmount || 0));
    });
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-ZA", { year: "numeric", month: "short" }),
        amount,
      }));
  }, [awardedSubmissions]);

  const categoryData = useMemo(() => {
    const catMap = new Map<string, number>();
    awardedSubmissions.forEach((s) => {
      const tender = tenderMap.get(s.tenderId);
      const category = tender?.category || "Uncategorized";
      catMap.set(category, (catMap.get(category) || 0) + (s.bidAmount || 0));
    });
    return Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));
  }, [awardedSubmissions, tenderMap]);

  const topVendors = useMemo(() => {
    const vendorMap = new Map<string, number>();
    awardedSubmissions.forEach((s) => {
      const name = s.vendorName || "Unknown";
      vendorMap.set(name, (vendorMap.get(name) || 0) + (s.bidAmount || 0));
    });
    return Array.from(vendorMap.entries())
      .map(([vendor, total]) => ({ vendor, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [awardedSubmissions]);

  const tableData = useMemo(() => {
    return [...awardedSubmissions]
      .sort((a, b) => {
        const da = a.awardedDate || a.submissionDate || a.submittedAt || a.createdAt || "";
        const db = b.awardedDate || b.submissionDate || b.submittedAt || b.createdAt || "";
        return db.localeCompare(da);
      })
      .map((s) => {
        const tender = tenderMap.get(s.tenderId);
        return {
          id: s.id,
          tender: tender?.title || tender?.tenderNumber || "N/A",
          vendor: s.vendorName || "Unknown",
          amount: s.bidAmount || 0,
          date: s.awardedDate || s.submissionDate || s.submittedAt || s.createdAt || "",
          municipality: tender?.municipality || "N/A",
        };
      });
  }, [awardedSubmissions, tenderMap]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return "N/A";
    }
  };

  const isLoading = submissionsLoading;

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <PageHeader title="Spend Analytics" description="Financial analytics for procurement spending" moduleId="analytics" />

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label htmlFor="start-date" className="text-sm">Start Date</Label>
          <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-44" data-testid="input-start-date" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="end-date" className="text-sm">End Date</Label>
          <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-44" data-testid="input-end-date" />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Municipality</Label>
          <Select value={selectedMunicipality} onValueChange={setSelectedMunicipality}>
            <SelectTrigger className="w-52" data-testid="select-municipality">
              <SelectValue placeholder="All municipalities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Municipalities</SelectItem>
              {municipalities?.map((m) => (
                <SelectItem key={m.id} value={m.name} data-testid={`select-municipality-option-${m.id}`}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <DataTableSkeleton columns={4} rows={1} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Spend" value={formatCurrency(stats.totalSpend)} icon={DollarSign} iconColor="green" testId="stat-total-spend" />
          <StatsCard title="Average Bid Value" value={formatCurrency(stats.avgBid)} icon={TrendingUp} iconColor="blue" testId="stat-avg-bid" />
          <StatsCard title="Number of Awards" value={stats.count} icon={Award} iconColor="purple" testId="stat-award-count" />
          <StatsCard title="Cost Savings" value={`${stats.savings.toFixed(1)}%`} icon={Percent} iconColor="teal" subtitle="vs average bid" testId="stat-cost-savings" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Monthly Spend Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <div className="h-[300px]" data-testid="chart-monthly-spend">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} angle={-25} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [formatCurrency(value), "Spend"]} />
                    <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Monthly Spend" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground" data-testid="text-no-monthly-data">No awarded data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Spend by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="h-[300px]" data-testid="chart-spend-category">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name }) => name}>
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [formatCurrency(value), "Spend"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground" data-testid="text-no-category-data">No category data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-muted-foreground" />
            Top Vendors by Award Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topVendors.length > 0 ? (
            <div className="h-[400px]" data-testid="chart-top-vendors">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topVendors} layout="vertical" margin={{ top: 10, right: 30, left: 120, bottom: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} />
                  <YAxis type="category" dataKey="vendor" tick={{ fontSize: 12 }} width={110} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [formatCurrency(value), "Award Value"]} />
                  <Bar dataKey="total" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} name="Total Awarded" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground" data-testid="text-no-vendor-data">No vendor award data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Spend Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tableData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table data-testid="table-spend-summary">
                <TableHeader>
                  <TableRow>
                    <TableHead>Tender</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Awarded Amount</TableHead>
                    <TableHead>Award Date</TableHead>
                    <TableHead>Municipality</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row) => (
                    <TableRow key={row.id} data-testid={`row-spend-${row.id}`}>
                      <TableCell className="font-medium max-w-[200px] truncate">{row.tender}</TableCell>
                      <TableCell>{row.vendor}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(row.amount)}</TableCell>
                      <TableCell>{formatDate(row.date)}</TableCell>
                      <TableCell>{row.municipality}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground" data-testid="text-no-spend-data">No awarded submissions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
