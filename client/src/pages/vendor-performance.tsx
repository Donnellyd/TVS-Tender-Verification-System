import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableSkeleton } from "@/components/DataTableSkeleton";
import { Users, UserCheck, Trophy, Star, ArrowUpDown, ChevronDown, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Vendor {
  id: string;
  companyName: string;
  tradingName?: string;
  contactPerson: string;
  contactEmail: string;
  status?: string;
}

interface Submission {
  id: string;
  vendorId: string;
  vendorName?: string;
  status: string;
  complianceResult: string;
  totalScore: number;
  bidAmount?: number;
  submissionDate?: string;
  submittedAt?: string;
  createdAt?: string;
  tenderId?: string;
}

interface VendorMetrics {
  vendorId: string;
  vendorName: string;
  totalBids: number;
  awardsWon: number;
  winRate: number;
  complianceRate: number;
  averageScore: number;
  lastActiveDate: string;
  rating: string;
  ratingPercent: number;
  recentSubmissions: Submission[];
}

type SortField = "vendorName" | "totalBids" | "awardsWon" | "winRate" | "complianceRate" | "averageScore" | "lastActiveDate" | "ratingPercent";
type SortDirection = "asc" | "desc";

export default function VendorPerformance() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("averageScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);

  const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ["/api/submissions"],
  });

  const isLoading = vendorsLoading || submissionsLoading;

  const vendorMetrics = useMemo(() => {
    if (!vendors || !submissions) return [];

    const submissionsByVendor = new Map<string, Submission[]>();
    for (const sub of submissions) {
      const vendorId = sub.vendorId;
      if (!submissionsByVendor.has(vendorId)) {
        submissionsByVendor.set(vendorId, []);
      }
      submissionsByVendor.get(vendorId)!.push(sub);
    }

    return vendors.map((vendor): VendorMetrics => {
      const vendorSubs = submissionsByVendor.get(vendor.id) || [];
      const totalBids = vendorSubs.length;
      const awardsWon = vendorSubs.filter((s) => s.status === "awarded").length;
      const winRate = totalBids > 0 ? (awardsWon / totalBids) * 100 : 0;
      const complianceChecks = vendorSubs.filter((s) => s.complianceResult && s.complianceResult !== "pending");
      const passedChecks = complianceChecks.filter((s) => s.complianceResult === "passed");
      const complianceRate = complianceChecks.length > 0 ? (passedChecks.length / complianceChecks.length) * 100 : 0;
      const scoredSubs = vendorSubs.filter((s) => s.totalScore > 0);
      const averageScore = scoredSubs.length > 0 ? scoredSubs.reduce((sum, s) => sum + s.totalScore, 0) / scoredSubs.length : 0;

      const dates = vendorSubs
        .map((s) => s.submissionDate || s.submittedAt || s.createdAt)
        .filter(Boolean)
        .map((d) => new Date(d!).getTime());
      const lastActiveDate = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : "";

      const ratingPercent = totalBids > 0 ? (winRate * 0.3 + complianceRate * 0.3 + (averageScore / 100) * 100 * 0.4) : 0;
      let rating = "Poor";
      if (ratingPercent > 80) rating = "Excellent";
      else if (ratingPercent > 60) rating = "Good";
      else if (ratingPercent > 40) rating = "Average";

      const recentSubmissions = [...vendorSubs]
        .sort((a, b) => {
          const dateA = new Date(a.submissionDate || a.submittedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.submissionDate || b.submittedAt || b.createdAt || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 5);

      return {
        vendorId: vendor.id,
        vendorName: vendor.companyName,
        totalBids,
        awardsWon,
        winRate,
        complianceRate,
        averageScore,
        lastActiveDate,
        rating,
        ratingPercent,
        recentSubmissions,
      };
    });
  }, [vendors, submissions]);

  const filteredAndSorted = useMemo(() => {
    let result = vendorMetrics;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((v) => v.vendorName.toLowerCase().includes(query));
    }

    result.sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return result;
  }, [vendorMetrics, searchQuery, sortField, sortDirection]);

  const stats = useMemo(() => {
    const totalVendors = vendorMetrics.length;
    const activeVendors = vendorMetrics.filter((v) => v.totalBids > 0).length;
    const avgScore = vendorMetrics.length > 0
      ? vendorMetrics.reduce((sum, v) => sum + v.averageScore, 0) / vendorMetrics.length
      : 0;
    const currentYear = new Date().getFullYear();
    const awardsThisYear = submissions
      ? submissions.filter((s) => {
          if (s.status !== "awarded") return false;
          const date = s.submissionDate || s.submittedAt || s.createdAt;
          return date ? new Date(date).getFullYear() === currentYear : false;
        }).length
      : 0;
    return { totalVendors, activeVendors, avgScore, awardsThisYear };
  }, [vendorMetrics, submissions]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const toggleExpand = (vendorId: string) => {
    setExpandedVendor((prev) => (prev === vendorId ? null : vendorId));
  };

  const ratingBadgeVariant = (rating: string) => {
    switch (rating) {
      case "Excellent": return "default" as const;
      case "Good": return "secondary" as const;
      case "Average": return "outline" as const;
      case "Poor": return "destructive" as const;
      default: return "outline" as const;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 -ml-2"
        onClick={() => handleSort(field)}
        data-testid={`sort-${field}`}
      >
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </Button>
    </TableHead>
  );

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <PageHeader
        title="Vendor Performance"
        description="Track and score vendor performance over time"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Vendors" value={stats.totalVendors} icon={Users} iconColor="blue" testId="stat-total-vendors" />
        <StatsCard title="Active Vendors" value={stats.activeVendors} icon={UserCheck} iconColor="green" testId="stat-active-vendors" />
        <StatsCard title="Average Score" value={stats.avgScore.toFixed(1)} icon={Star} iconColor="orange" testId="stat-average-score" />
        <StatsCard title="Awards This Year" value={stats.awardsThisYear} icon={Trophy} iconColor="purple" testId="stat-awards-year" />
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vendors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-vendor-search"
        />
      </div>

      {isLoading && <DataTableSkeleton columns={8} rows={6} />}

      {!isLoading && filteredAndSorted.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground" data-testid="text-no-vendors">
              No vendors found
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? "Try adjusting your search query" : "No vendor data available"}
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && filteredAndSorted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vendor Performance Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table data-testid="table-vendor-performance">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <SortableHeader field="vendorName">Vendor Name</SortableHeader>
                    <SortableHeader field="totalBids">Total Bids</SortableHeader>
                    <SortableHeader field="awardsWon">Awards Won</SortableHeader>
                    <SortableHeader field="winRate">Win Rate %</SortableHeader>
                    <SortableHeader field="complianceRate">Compliance Rate</SortableHeader>
                    <SortableHeader field="averageScore">Average Score</SortableHeader>
                    <SortableHeader field="lastActiveDate">Last Active</SortableHeader>
                    <SortableHeader field="ratingPercent">Rating</SortableHeader>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSorted.map((vendor) => (
                    <>
                      <TableRow
                        key={vendor.vendorId}
                        className="cursor-pointer hover-elevate"
                        onClick={() => toggleExpand(vendor.vendorId)}
                        data-testid={`row-vendor-${vendor.vendorId}`}
                      >
                        <TableCell>
                          {expandedVendor === vendor.vendorId ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`td-vendor-name-${vendor.vendorId}`}>
                          {vendor.vendorName}
                        </TableCell>
                        <TableCell data-testid={`td-total-bids-${vendor.vendorId}`}>
                          {vendor.totalBids}
                        </TableCell>
                        <TableCell data-testid={`td-awards-won-${vendor.vendorId}`}>
                          {vendor.awardsWon}
                        </TableCell>
                        <TableCell data-testid={`td-win-rate-${vendor.vendorId}`}>
                          {vendor.winRate.toFixed(1)}%
                        </TableCell>
                        <TableCell data-testid={`td-compliance-rate-${vendor.vendorId}`}>
                          {vendor.complianceRate.toFixed(1)}%
                        </TableCell>
                        <TableCell data-testid={`td-avg-score-${vendor.vendorId}`}>
                          {vendor.averageScore.toFixed(1)}
                        </TableCell>
                        <TableCell data-testid={`td-last-active-${vendor.vendorId}`}>
                          {formatDate(vendor.lastActiveDate)}
                        </TableCell>
                        <TableCell data-testid={`td-rating-${vendor.vendorId}`}>
                          <Badge variant={ratingBadgeVariant(vendor.rating)}>
                            {vendor.rating}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      {expandedVendor === vendor.vendorId && (
                        <TableRow key={`${vendor.vendorId}-expanded`}>
                          <TableCell colSpan={9} className="bg-muted/30 p-4">
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-muted-foreground">Recent Submissions</p>
                              {vendor.recentSubmissions.length === 0 ? (
                                <p className="text-sm text-muted-foreground" data-testid={`text-no-submissions-${vendor.vendorId}`}>
                                  No submissions found
                                </p>
                              ) : (
                                <Table data-testid={`table-submissions-${vendor.vendorId}`}>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Compliance</TableHead>
                                      <TableHead>Score</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {vendor.recentSubmissions.map((sub) => (
                                      <TableRow key={sub.id} data-testid={`row-submission-${sub.id}`}>
                                        <TableCell>{formatDate(sub.submissionDate || sub.submittedAt || sub.createdAt || "")}</TableCell>
                                        <TableCell>
                                          <Badge variant={sub.status === "awarded" ? "default" : "outline"}>
                                            {sub.status}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant={sub.complianceResult === "passed" ? "default" : sub.complianceResult === "failed" ? "destructive" : "outline"}>
                                            {sub.complianceResult}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>{sub.totalScore > 0 ? sub.totalScore : "N/A"}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
