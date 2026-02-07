import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { portalFetch } from "@/lib/portalApi";
import { Send, FileText, Clock, CheckCircle, MessageSquare, ArrowRight, Award } from "lucide-react";

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

export default function PortalDashboard() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["portal", "profile"],
    queryFn: async () => {
      const res = await portalFetch("/api/portal/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ["portal", "submissions"],
    queryFn: async () => {
      const res = await portalFetch("/api/portal/submissions");
      if (!res.ok) throw new Error("Failed to load submissions");
      return res.json();
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["portal", "messages"],
    queryFn: async () => {
      const res = await portalFetch("/api/portal/messages");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: awards } = useQuery({
    queryKey: ["portal", "awards"],
    queryFn: async () => {
      const res = await portalFetch("/api/portal/awards");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const totalSubmissions = submissions?.length || 0;
  const pendingCount = submissions?.filter((s: any) => ["submitted", "auto_checking", "manual_review"].includes(s.status)).length || 0;
  const approvedCount = submissions?.filter((s: any) => ["passed", "awarded"].includes(s.status)).length || 0;
  const unreadMessages = profile?.unreadMessages || 0;
  const recentSubmissions = submissions?.slice(0, 5) || [];
  const pendingAwards = awards?.filter((a: any) => ["pending", "sla_review"].includes(a.status)) || [];

  return (
    <PortalLayout>
      <div className="space-y-6">
        {profileLoading ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-welcome">
              Welcome, {profile?.companyName || "Vendor"}
            </h1>
            <p className="text-muted-foreground">Here's an overview of your activity.</p>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
              <div className="rounded-lg p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <FileText className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {submissionsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="stat-total-submissions">{totalSubmissions}</div>
              )}
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <div className="rounded-lg p-2 bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                <Clock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {submissionsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="stat-pending">{pendingCount}</div>
              )}
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
              <div className="rounded-lg p-2 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {submissionsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="stat-approved">{approvedCount}</div>
              )}
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Messages</CardTitle>
              <div className="rounded-lg p-2 bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                <MessageSquare className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-messages">{unreadMessages}</div>
              <p className="text-xs text-muted-foreground mt-1">unread</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/portal/submit">
            <Button className="gap-2" data-testid="button-submit-new">
              <Send className="h-4 w-4" />
              Submit New Quote
            </Button>
          </Link>
          <Link href="/portal/submit">
            <Button variant="outline" className="gap-2" data-testid="button-view-tenders">
              <FileText className="h-4 w-4" />
              View Open Tenders
            </Button>
          </Link>
        </div>

        {pendingAwards.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <CardTitle className="text-lg">Awards Pending Your Signature</CardTitle>
              </div>
              <Link href="/portal/awards">
                <Button variant="ghost" size="sm" className="gap-1" data-testid="link-view-awards">
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingAwards.map((award: any) => (
                  <div key={award.id} className="flex items-center justify-between gap-4 p-3 rounded-md bg-background border border-border" data-testid={`award-pending-${award.id}`}>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{award.tender?.title || "Tender"}</div>
                      <div className="text-sm text-muted-foreground">{award.tender?.tenderNumber}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {award.hasSla && (
                        <Badge variant="outline" className="text-xs">SLA Required</Badge>
                      )}
                      <Link href="/portal/awards">
                        <Button size="sm" data-testid={`button-sign-${award.id}`}>
                          Review & Sign
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-lg">Recent Submissions</CardTitle>
            <Link href="/portal/submissions">
              <Button variant="ghost" size="sm" className="gap-1" data-testid="link-view-all-submissions">
                View All
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {submissionsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentSubmissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No submissions yet.</p>
                <Link href="/portal/submit">
                  <Button variant="link" size="sm" data-testid="link-first-submission">Submit your first quote</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Tender</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground hidden sm:table-cell">Amount</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-2 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSubmissions.map((sub: any) => (
                      <tr key={sub.id} className="border-b border-border last:border-0" data-testid={`row-submission-${sub.id}`}>
                        <td className="py-3 pr-4">
                          <div className="font-medium truncate max-w-[200px]">{sub.tenderNumber || sub.tenderId}</div>
                          {sub.tenderTitle && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{sub.tenderTitle}</div>
                          )}
                        </td>
                        <td className="py-3 pr-4 hidden sm:table-cell">
                          {sub.bidAmount ? `${sub.currency || "ZAR"} ${Number(sub.bidAmount).toLocaleString()}` : "-"}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge className={statusColors[sub.status] || "bg-gray-500 text-white border-gray-600"}>
                            {formatStatus(sub.status)}
                          </Badge>
                        </td>
                        <td className="py-3 hidden md:table-cell text-muted-foreground">
                          {sub.submissionDate ? new Date(sub.submissionDate).toLocaleDateString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
