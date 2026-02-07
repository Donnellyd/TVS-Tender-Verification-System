import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { portalFetch } from "@/lib/portalApi";
import { FileText, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-gray-500 text-white border-gray-600",
  submitted: "bg-blue-500 text-white border-blue-600",
  auto_checking: "bg-yellow-500 text-white border-yellow-600",
  manual_review: "bg-orange-500 text-white border-orange-600",
  passed: "bg-green-500 text-white border-green-600",
  failed: "bg-red-500 text-white border-red-600",
  awarded: "bg-emerald-600 text-white border-emerald-700",
  rejected: "bg-red-500 text-white border-red-600",
};

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PortalSubmissions() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["portal", "submissions"],
    queryFn: async () => {
      const res = await portalFetch("/api/portal/submissions");
      if (!res.ok) throw new Error("Failed to load submissions");
      return res.json();
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Submissions</h1>
          <p className="text-muted-foreground">Track all your bid submissions and their status.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : !submissions || submissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">No submissions yet.</p>
              <a href="/portal/submit">
                <Button size="sm" data-testid="link-submit-first">Submit Your First Quote</Button>
              </a>
            </CardContent>
          </Card>
        ) : (
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tender #</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Bid Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                        <th className="py-3 px-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub: any) => (
                        <>
                          <tr
                            key={sub.id}
                            className="border-b border-border last:border-0 hover-elevate cursor-pointer"
                            onClick={() => toggleExpand(sub.id)}
                            data-testid={`row-submission-${sub.id}`}
                          >
                            <td className="py-3 px-4 font-mono text-xs">{sub.tenderNumber || "-"}</td>
                            <td className="py-3 px-4">
                              <span className="truncate max-w-[200px] block">{sub.tenderTitle || sub.tenderId}</span>
                            </td>
                            <td className="py-3 px-4">
                              {sub.bidAmount
                                ? `${sub.currency || "ZAR"} ${Number(sub.bidAmount).toLocaleString()}`
                                : "-"}
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={statusColors[sub.status] || "bg-gray-500 text-white border-gray-600"}>
                                {formatStatus(sub.status)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {sub.submissionDate ? new Date(sub.submissionDate).toLocaleDateString() : "-"}
                            </td>
                            <td className="py-3 px-4">
                              {expandedId === sub.id ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </td>
                          </tr>
                          {expandedId === sub.id && (
                            <tr key={`${sub.id}-detail`}>
                              <td colSpan={6} className="px-4 py-4 bg-muted/20">
                                <SubmissionDetail submission={sub} />
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!isLoading && submissions && submissions.length > 0 && (
          <div className="md:hidden space-y-3">
            {submissions.map((sub: any) => (
              <Card
                key={sub.id}
                className="hover-elevate cursor-pointer"
                onClick={() => toggleExpand(sub.id)}
                data-testid={`card-submission-${sub.id}`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{sub.tenderTitle || sub.tenderId}</p>
                      <p className="text-xs text-muted-foreground font-mono">{sub.tenderNumber || "-"}</p>
                    </div>
                    <Badge className={statusColors[sub.status] || "bg-gray-500 text-white border-gray-600"}>
                      {formatStatus(sub.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {sub.bidAmount
                        ? `${sub.currency || "ZAR"} ${Number(sub.bidAmount).toLocaleString()}`
                        : "No amount"}
                    </span>
                    <span>{sub.submissionDate ? new Date(sub.submissionDate).toLocaleDateString() : ""}</span>
                  </div>
                  {expandedId === sub.id && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <SubmissionDetail submission={sub} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}

function SubmissionDetail({ submission }: { submission: any }) {
  const checks = submission.complianceResults || submission.complianceChecks || [];

  if (checks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No detailed compliance data available for this submission.</p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium mb-2">Compliance Results</p>
      {checks.map((check: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          {check.status === "passed" || check.status === "green" ? (
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
          ) : check.status === "warning" || check.status === "amber" ? (
            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
          )}
          <span>{check.name || check.requirement || check.type}</span>
          {check.message && (
            <span className="text-muted-foreground">- {check.message}</span>
          )}
        </div>
      ))}
    </div>
  );
}
