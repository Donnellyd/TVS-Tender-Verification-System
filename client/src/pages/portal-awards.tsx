import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { portalFetch, portalApi } from "@/lib/portalApi";
import { useToast } from "@/hooks/use-toast";
import { Award, FileText, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Pen, AlertTriangle, Eye, ArrowLeft } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500 text-white border-yellow-600",
  sla_review: "bg-blue-500 text-white border-blue-600",
  signed: "bg-green-500 text-white border-green-600",
  declined: "bg-red-500 text-white border-red-600",
};

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PortalAwards() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedAwardId, setSelectedAwardId] = useState<string | null>(null);

  const { data: awards, isLoading } = useQuery({
    queryKey: ["portal", "awards"],
    queryFn: async () => {
      const res = await portalFetch("/api/portal/awards");
      if (!res.ok) throw new Error("Failed to load awards");
      return res.json();
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (selectedAwardId) {
    return (
      <PortalLayout>
        <AwardDetailView
          awardId={selectedAwardId}
          onBack={() => setSelectedAwardId(null)}
        />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-awards-title">My Awards</h1>
          <p className="text-muted-foreground">View your awarded tenders, review SLA documents, and sign to accept.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : !awards || awards.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Award className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-1">No awards yet.</p>
              <p className="text-sm text-muted-foreground">Awards will appear here once your bids are successful.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="hidden md:block">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tender #</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Value</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">SLA</th>
                          <th className="py-3 px-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {awards.map((award: any) => (
                          <>
                            <tr
                              key={award.id}
                              className="border-b border-border last:border-0 hover-elevate cursor-pointer"
                              onClick={() => toggleExpand(award.id)}
                              data-testid={`row-award-${award.id}`}
                            >
                              <td className="py-3 px-4 font-mono text-xs">{award.tenderNumber || "-"}</td>
                              <td className="py-3 px-4">
                                <span className="truncate max-w-[200px] block">{award.tenderTitle || "-"}</span>
                              </td>
                              <td className="py-3 px-4">
                                {award.estimatedValue
                                  ? `${award.currency || "ZAR"} ${Number(award.estimatedValue).toLocaleString()}`
                                  : "-"}
                              </td>
                              <td className="py-3 px-4">
                                <Badge className={statusColors[award.status] || "bg-gray-500 text-white border-gray-600"}>
                                  {formatStatus(award.status)}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                {award.slaRequired ? (
                                  <Badge variant="outline" className="text-xs">SLA Required</Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs">None</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {expandedId === award.id ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </td>
                            </tr>
                            {expandedId === award.id && (
                              <tr key={`${award.id}-detail`}>
                                <td colSpan={6} className="px-4 py-4 bg-muted/20">
                                  <AwardExpandedRow award={award} onViewDetail={setSelectedAwardId} />
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

            <div className="md:hidden space-y-3">
              {awards.map((award: any) => (
                <Card
                  key={award.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => toggleExpand(award.id)}
                  data-testid={`card-award-${award.id}`}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{award.tenderTitle || "-"}</p>
                        <p className="text-xs text-muted-foreground font-mono">{award.tenderNumber || "-"}</p>
                      </div>
                      <Badge className={statusColors[award.status] || "bg-gray-500 text-white border-gray-600"}>
                        {formatStatus(award.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                      <span>
                        {award.estimatedValue
                          ? `${award.currency || "ZAR"} ${Number(award.estimatedValue).toLocaleString()}`
                          : "No value"}
                      </span>
                      {award.slaRequired && (
                        <Badge variant="outline" className="text-xs">SLA Required</Badge>
                      )}
                    </div>
                    {expandedId === award.id && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <AwardExpandedRow award={award} onViewDetail={setSelectedAwardId} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}

function AwardExpandedRow({ award, onViewDetail }: { award: any; onViewDetail: (id: string) => void }) {
  const canSign = award.status === "pending" || award.status === "sla_review";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {award.awardDate && (
          <div>
            <span className="text-muted-foreground">Award Date: </span>
            <span>{new Date(award.awardDate).toLocaleDateString()}</span>
          </div>
        )}
        {award.bidAmount != null && (
          <div>
            <span className="text-muted-foreground">Bid Amount: </span>
            <span>{award.currency || "ZAR"} {Number(award.bidAmount).toLocaleString()}</span>
          </div>
        )}
        {award.score != null && (
          <div>
            <span className="text-muted-foreground">Score: </span>
            <span>{award.score}</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {canSign ? (
          <Button
            size="sm"
            className="gap-2"
            onClick={(e) => { e.stopPropagation(); onViewDetail(award.id); }}
            data-testid={`button-view-sign-${award.id}`}
          >
            <Pen className="h-4 w-4" />
            View & Sign
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={(e) => { e.stopPropagation(); onViewDetail(award.id); }}
            data-testid={`button-view-detail-${award.id}`}
          >
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        )}
      </div>
    </div>
  );
}

function AwardDetailView({ awardId, onBack }: { awardId: string; onBack: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [slaAccepted, setSlaAccepted] = useState(false);
  const [confirmAccept, setConfirmAccept] = useState(false);
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryTitle, setSignatoryTitle] = useState("");
  const [signatureData, setSignatureData] = useState("");
  const [expandedSlaId, setExpandedSlaId] = useState<string | null>(null);
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const { data: award, isLoading } = useQuery({
    queryKey: ["portal", "awards", awardId],
    queryFn: async () => {
      const res = await portalFetch(`/api/portal/awards/${awardId}`);
      if (!res.ok) throw new Error("Failed to load award details");
      return res.json();
    },
  });

  const signMutation = useMutation({
    mutationFn: async () => {
      await portalApi("POST", `/api/portal/awards/${awardId}/sign`, {
        signatoryName,
        signatoryTitle,
        signatureData,
        slaAccepted,
      });
    },
    onSuccess: () => {
      toast({ title: "Award Signed", description: "You have successfully accepted this tender award." });
      queryClient.invalidateQueries({ queryKey: ["portal", "awards"] });
    },
    onError: (error: Error) => {
      toast({ title: "Signing Failed", description: error.message, variant: "destructive" });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      await portalApi("POST", `/api/portal/awards/${awardId}/decline`, {
        declineReason,
      });
    },
    onSuccess: () => {
      toast({ title: "Award Declined", description: "You have declined this tender award." });
      queryClient.invalidateQueries({ queryKey: ["portal", "awards"] });
    },
    onError: (error: Error) => {
      toast({ title: "Decline Failed", description: error.message, variant: "destructive" });
    },
  });

  const canSign = award?.status === "pending" || award?.status === "sla_review";
  const isSigned = award?.status === "signed";
  const isDeclined = award?.status === "declined";
  const hasSlas = award?.slaDocuments && award.slaDocuments.length > 0;
  const slaRequired = hasSlas;

  const canSubmitSign =
    signatoryName.trim() !== "" &&
    signatoryTitle.trim() !== "" &&
    signatureData.trim() !== "" &&
    confirmAccept &&
    (!slaRequired || slaAccepted);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!award) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="gap-2" onClick={onBack} data-testid="button-back-awards">
          <ArrowLeft className="h-4 w-4" />
          Back to Awards
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Award not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" className="gap-2" onClick={onBack} data-testid="button-back-awards">
          <ArrowLeft className="h-4 w-4" />
          Back to Awards
        </Button>
        <Badge className={statusColors[award.status] || "bg-gray-500 text-white border-gray-600"}>
          {formatStatus(award.status)}
        </Badge>
      </div>

      {isSigned && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardContent className="py-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300" data-testid="text-award-accepted">Award Accepted</p>
                <div className="text-sm text-green-700 dark:text-green-400 space-y-1 mt-1">
                  {award.signedDate && (
                    <p>Signed on: {new Date(award.signedDate).toLocaleDateString()}</p>
                  )}
                  {award.signatoryName && <p>Signatory: {award.signatoryName}</p>}
                  {award.signatoryTitle && <p>Title: {award.signatoryTitle}</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isDeclined && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="py-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-300" data-testid="text-award-declined">Award Declined</p>
                {award.declineReason && (
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">Reason: {award.declineReason}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {award.awardLetterContent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Award Letter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm dark:prose-invert max-w-none border border-border rounded-md p-4 bg-muted/20"
              data-testid="text-award-letter"
              dangerouslySetInnerHTML={{ __html: award.awardLetterContent }}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tender Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Tender Number</p>
              <p className="font-mono" data-testid="text-tender-number">{award.tenderNumber || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Title</p>
              <p data-testid="text-tender-title">{award.tenderTitle || "-"}</p>
            </div>
            {award.tenderDescription && (
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Description</p>
                <p data-testid="text-tender-description">{award.tenderDescription}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Estimated Value</p>
              <p data-testid="text-estimated-value">
                {award.estimatedValue
                  ? `${award.currency || "ZAR"} ${Number(award.estimatedValue).toLocaleString()}`
                  : "-"}
              </p>
            </div>
            {award.bidAmount != null && (
              <div>
                <p className="text-muted-foreground">Bid Amount</p>
                <p data-testid="text-bid-amount">{award.currency || "ZAR"} {Number(award.bidAmount).toLocaleString()}</p>
              </div>
            )}
            {award.score != null && (
              <div>
                <p className="text-muted-foreground">Score</p>
                <p data-testid="text-bid-score">{award.score}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {hasSlas && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Service Level Agreements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {award.slaDocuments.map((sla: any) => (
              <div key={sla.id} className="border border-border rounded-md">
                <div className="flex items-center justify-between gap-2 p-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate">{sla.title || sla.name}</span>
                    {sla.required && (
                      <Badge variant="outline" className="text-xs shrink-0">Required</Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1"
                    onClick={() => setExpandedSlaId(expandedSlaId === sla.id ? null : sla.id)}
                    data-testid={`button-read-sla-${sla.id}`}
                  >
                    {expandedSlaId === sla.id ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Close
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Read SLA
                      </>
                    )}
                  </Button>
                </div>
                {expandedSlaId === sla.id && (
                  <div className="border-t border-border p-4 bg-muted/20">
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none text-sm"
                      data-testid={`text-sla-content-${sla.id}`}
                      dangerouslySetInnerHTML={{ __html: sla.content || "No content available." }}
                    />
                  </div>
                )}
              </div>
            ))}

            {canSign && (
              <div className="flex items-start gap-2 pt-2">
                <Checkbox
                  id="sla-accept"
                  checked={slaAccepted}
                  onCheckedChange={(checked) => setSlaAccepted(checked === true)}
                  data-testid="checkbox-sla-accept"
                />
                <label htmlFor="sla-accept" className="text-sm cursor-pointer leading-tight">
                  I have read and agree to the Service Level Agreement(s)
                </label>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {canSign && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Pen className="h-5 w-5" />
              Sign Award
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="signatory-name" className="text-sm font-medium">Full Name</label>
                <Input
                  id="signatory-name"
                  placeholder="Enter your full name"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  data-testid="input-signatory-name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="signatory-title" className="text-sm font-medium">Job Title</label>
                <Input
                  id="signatory-title"
                  placeholder="Enter your job title"
                  value={signatoryTitle}
                  onChange={(e) => setSignatoryTitle(e.target.value)}
                  data-testid="input-signatory-title"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="signature-data" className="text-sm font-medium">Digital Signature</label>
              <p className="text-xs text-muted-foreground">Type your full name as your digital signature confirmation.</p>
              <Input
                id="signature-data"
                placeholder="Type your full name to sign"
                value={signatureData}
                onChange={(e) => setSignatureData(e.target.value)}
                className="italic"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                data-testid="input-signature"
              />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="confirm-accept"
                checked={confirmAccept}
                onCheckedChange={(checked) => setConfirmAccept(checked === true)}
                data-testid="checkbox-confirm-accept"
              />
              <label htmlFor="confirm-accept" className="text-sm cursor-pointer leading-tight">
                I confirm that I accept this tender award and all its terms and conditions
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                className="gap-2"
                disabled={!canSubmitSign || signMutation.isPending}
                onClick={() => signMutation.mutate()}
                data-testid="button-sign-award"
              >
                {signMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Sign & Accept Award
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => setShowDecline(true)}
                disabled={signMutation.isPending || declineMutation.isPending}
                data-testid="button-decline-award"
              >
                <XCircle className="h-4 w-4" />
                Decline Award
              </Button>
            </div>

            {showDecline && (
              <Card className="border-red-200 dark:border-red-800">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <p className="text-sm font-medium">Decline this award?</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Please provide a reason for declining. This action cannot be undone.
                  </p>
                  <Textarea
                    placeholder="Enter your reason for declining..."
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    data-testid="input-decline-reason"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={declineReason.trim() === "" || declineMutation.isPending}
                      onClick={() => declineMutation.mutate()}
                      data-testid="button-confirm-decline"
                    >
                      {declineMutation.isPending ? "Declining..." : "Confirm Decline"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setShowDecline(false); setDeclineReason(""); }}
                      data-testid="button-cancel-decline"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
