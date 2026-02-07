import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableSkeleton } from "@/components/DataTableSkeleton";
import { TrendingUp, DollarSign, BarChart3, Trophy, ArrowDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Tender {
  id: string;
  title: string;
  tenderNumber: string;
  status: string;
}

interface Submission {
  id: string;
  vendorName: string;
  bidAmount: number;
  complianceResult: string;
  totalScore: number;
  status: string;
  submissionDate: string;
  submittedAt?: string;
  createdAt?: string;
}

interface ScoringTemplate {
  id: string;
  name: string;
  criteria: { name: string; maxScore: number; weight: number }[];
}

export default function BidAnalysis() {
  const [selectedTenderId, setSelectedTenderId] = useState("");

  const { data: tenders } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ["/api/tenders", selectedTenderId, "submissions"],
    enabled: !!selectedTenderId,
  });

  const { data: scoringTemplates } = useQuery<ScoringTemplate[]>({
    queryKey: ["/api/scoring-templates"],
    enabled: !!selectedTenderId,
  });

  const bidData = useMemo(() => {
    if (!submissions || submissions.length === 0) return null;

    const bids = submissions.map((s) => ({
      id: s.id,
      vendorName: s.vendorName || "Unknown Vendor",
      bidAmount: (s as any).bidAmount || 0,
      complianceResult: s.complianceResult || "pending",
      totalScore: s.totalScore || 0,
      status: s.status || "pending",
      submissionDate: s.submissionDate || s.submittedAt || s.createdAt || "",
    }));

    const prices = bids.map((b) => b.bidAmount).filter((p) => p > 0);
    const scores = bids.map((b) => b.totalScore);

    const highestScore = Math.max(...scores);
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const priceRange = maxPrice - lowestPrice;
    const priceDeviation = averagePrice > 0 ? ((priceRange / averagePrice) * 100) : 0;

    const conformingBids = bids.filter((b) => b.complianceResult === "passed" && b.bidAmount > 0);
    const lowestConformingBid = conformingBids.length > 0
      ? conformingBids.reduce((min, b) => b.bidAmount < min.bidAmount ? b : min, conformingBids[0])
      : null;

    const sortedByPrice = [...bids].filter((b) => b.bidAmount > 0).sort((a, b) => a.bidAmount - b.bidAmount);

    return {
      bids,
      highestScore,
      lowestPrice,
      averagePrice,
      priceRange,
      priceDeviation,
      lowestConformingBid,
      sortedByPrice,
    };
  }, [submissions]);

  const complianceBadgeVariant = (result: string) => {
    switch (result) {
      case "passed": return "default" as const;
      case "failed": return "destructive" as const;
      case "flagged": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "accepted":
      case "awarded": return "default" as const;
      case "rejected":
      case "disqualified": return "destructive" as const;
      default: return "outline" as const;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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

  const selectedTender = tenders?.find((t) => t.id === selectedTenderId);

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <PageHeader
        title="Bid Analysis"
        description="Compare bids side-by-side for selected tenders"
        moduleId="evaluation"
      />

      <div className="flex items-center gap-4">
        <div className="w-full max-w-md">
          <Select value={selectedTenderId} onValueChange={setSelectedTenderId}>
            <SelectTrigger data-testid="select-tender">
              <SelectValue placeholder="Select a tender to analyze" />
            </SelectTrigger>
            <SelectContent>
              {tenders?.map((tender) => (
                <SelectItem key={tender.id} value={tender.id} data-testid={`select-tender-option-${tender.id}`}>
                  {tender.tenderNumber} - {tender.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedTender && (
          <Badge variant="outline" data-testid="badge-tender-status">
            {selectedTender.status}
          </Badge>
        )}
      </div>

      {!selectedTenderId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground" data-testid="text-empty-state">
              Select a tender to view bid analysis
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a tender from the dropdown above to compare submissions
            </p>
          </CardContent>
        </Card>
      )}

      {selectedTenderId && submissionsLoading && (
        <DataTableSkeleton columns={6} rows={4} />
      )}

      {selectedTenderId && !submissionsLoading && (!submissions || submissions.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground" data-testid="text-no-submissions">
              No submissions found for this tender
            </p>
          </CardContent>
        </Card>
      )}

      {bidData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Comparative Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table data-testid="table-comparative-summary">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Criteria</TableHead>
                      {bidData.bids.map((bid) => (
                        <TableHead key={bid.id} className="min-w-[160px] text-center" data-testid={`th-vendor-${bid.id}`}>
                          {bid.vendorName}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Submission Date</TableCell>
                      {bidData.bids.map((bid) => (
                        <TableCell key={bid.id} className="text-center" data-testid={`td-date-${bid.id}`}>
                          {formatDate(bid.submissionDate)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Bid Price</TableCell>
                      {bidData.bids.map((bid) => (
                        <TableCell
                          key={bid.id}
                          className={`text-center ${bid.bidAmount === bidData.lowestPrice && bid.bidAmount > 0 ? "bg-green-50 dark:bg-green-950/20 font-semibold" : ""}`}
                          data-testid={`td-price-${bid.id}`}
                        >
                          {bid.bidAmount > 0 ? formatCurrency(bid.bidAmount) : "N/A"}
                          {bid.bidAmount === bidData.lowestPrice && bid.bidAmount > 0 && (
                            <ArrowDown className="h-3 w-3 inline ml-1 text-green-600 dark:text-green-400" />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Compliance</TableCell>
                      {bidData.bids.map((bid) => (
                        <TableCell key={bid.id} className="text-center" data-testid={`td-compliance-${bid.id}`}>
                          <Badge variant={complianceBadgeVariant(bid.complianceResult)}>
                            {bid.complianceResult}
                          </Badge>
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Total Score</TableCell>
                      {bidData.bids.map((bid) => (
                        <TableCell
                          key={bid.id}
                          className={`text-center ${bid.totalScore === bidData.highestScore && bid.totalScore > 0 ? "bg-blue-50 dark:bg-blue-950/20 font-semibold" : ""}`}
                          data-testid={`td-score-${bid.id}`}
                        >
                          {bid.totalScore > 0 ? bid.totalScore.toFixed(1) : "N/A"}
                          {bid.totalScore === bidData.highestScore && bid.totalScore > 0 && (
                            <Trophy className="h-3 w-3 inline ml-1 text-blue-600 dark:text-blue-400" />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Status</TableCell>
                      {bidData.bids.map((bid) => (
                        <TableCell key={bid.id} className="text-center" data-testid={`td-status-${bid.id}`}>
                          <Badge variant={statusBadgeVariant(bid.status)}>
                            {bid.status}
                          </Badge>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Score Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bidData.bids.some((b) => b.totalScore > 0) ? (
                <div className="h-[300px]" data-testid="chart-score-comparison">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={bidData.bids.map((b) => ({
                        name: b.vendorName.length > 15 ? b.vendorName.substring(0, 15) + "..." : b.vendorName,
                        score: b.totalScore,
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                    >
                      <XAxis
                        dataKey="name"
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                        angle={-25}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                      />
                      <Bar
                        dataKey="score"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                        name="Total Score"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-muted-foreground" data-testid="text-no-scores">
                    No scoring data available for this tender
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Price Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-md border p-4" data-testid="stat-average-price">
                  <p className="text-sm text-muted-foreground">Average Price</p>
                  <p className="text-lg font-semibold">{formatCurrency(bidData.averagePrice)}</p>
                </div>
                <div className="rounded-md border p-4" data-testid="stat-lowest-price">
                  <p className="text-sm text-muted-foreground">Lowest Price</p>
                  <p className="text-lg font-semibold">{formatCurrency(bidData.lowestPrice)}</p>
                </div>
                <div className="rounded-md border p-4" data-testid="stat-price-range">
                  <p className="text-sm text-muted-foreground">Price Range</p>
                  <p className="text-lg font-semibold">{formatCurrency(bidData.priceRange)}</p>
                </div>
                <div className="rounded-md border p-4" data-testid="stat-price-deviation">
                  <p className="text-sm text-muted-foreground">Price Deviation</p>
                  <p className="text-lg font-semibold">{bidData.priceDeviation.toFixed(1)}%</p>
                </div>
              </div>

              {bidData.lowestConformingBid && (
                <div className="rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-4" data-testid="text-lowest-conforming">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Lowest Conforming Bid: {bidData.lowestConformingBid.vendorName} at {formatCurrency(bidData.lowestConformingBid.bidAmount)}
                  </p>
                </div>
              )}

              {bidData.sortedByPrice.length > 0 && (
                <div className="h-[300px]" data-testid="chart-price-comparison">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={bidData.sortedByPrice.map((b) => ({
                        name: b.vendorName.length > 15 ? b.vendorName.substring(0, 15) + "..." : b.vendorName,
                        price: b.bidAmount,
                        isLowestConforming: bidData.lowestConformingBid?.id === b.id,
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                    >
                      <XAxis
                        dataKey="name"
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                        angle={-25}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis className="text-xs" tickFormatter={(v) => formatCurrency(v)} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                        formatter={(value: number) => [formatCurrency(value), "Bid Price"]}
                      />
                      <Bar
                        dataKey="price"
                        fill="hsl(var(--chart-2))"
                        radius={[4, 4, 0, 0]}
                        name="Bid Price"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {bidData.sortedByPrice.length > 0 && (
                <div className="overflow-x-auto">
                  <Table data-testid="table-price-ranking">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead className="text-right">Bid Price</TableHead>
                        <TableHead className="text-right">vs Average</TableHead>
                        <TableHead>Compliance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bidData.sortedByPrice.map((bid, index) => {
                        const vsAverage = bidData.averagePrice > 0
                          ? ((bid.bidAmount - bidData.averagePrice) / bidData.averagePrice) * 100
                          : 0;
                        const isLowestConforming = bidData.lowestConformingBid?.id === bid.id;
                        return (
                          <TableRow
                            key={bid.id}
                            className={isLowestConforming ? "bg-green-50 dark:bg-green-950/20" : ""}
                            data-testid={`row-price-${bid.id}`}
                          >
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                              {bid.vendorName}
                              {isLowestConforming && (
                                <Badge variant="default" className="ml-2 text-xs">
                                  Best Value
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(bid.bidAmount)}
                            </TableCell>
                            <TableCell className={`text-right ${vsAverage < 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                              {vsAverage > 0 ? "+" : ""}{vsAverage.toFixed(1)}%
                            </TableCell>
                            <TableCell>
                              <Badge variant={complianceBadgeVariant(bid.complianceResult)}>
                                {bid.complianceResult}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
