import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { portalFetch, portalApi } from "@/lib/portalApi";
import {
  Search,
  ArrowLeft,
  Calendar,
  Tag,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Send,
  FileText,
} from "lucide-react";

const typeBadgeColors: Record<string, string> = {
  RFQ: "bg-blue-500 text-white border-blue-600",
  RFP: "bg-purple-500 text-white border-purple-600",
  RFT: "bg-teal-500 text-white border-teal-600",
  RFI: "bg-gray-500 text-white border-gray-600",
};

export default function PortalSubmit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTender, setSelectedTender] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [bidAmount, setBidAmount] = useState("");
  const [currency, setCurrency] = useState("ZAR");
  const [notes, setNotes] = useState("");

  const { data: tenders, isLoading: tendersLoading } = useQuery({
    queryKey: ["portal", "tenders"],
    queryFn: async () => {
      const res = await portalFetch("/api/portal/tenders");
      if (!res.ok) throw new Error("Failed to load tenders");
      return res.json();
    },
  });

  const { data: complianceCheck, isLoading: complianceLoading } = useQuery({
    queryKey: ["portal", "compliance-check", selectedTender?.id],
    queryFn: async () => {
      const res = await portalFetch(`/api/portal/compliance-check/${selectedTender.id}`);
      if (!res.ok) return { requirements: [], overallStatus: "unknown", canSubmit: true };
      return res.json();
    },
    enabled: !!selectedTender?.id,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await portalApi("POST", "/api/portal/submissions", {
        tenderId: selectedTender.id,
        bidAmount: bidAmount ? parseFloat(bidAmount) : undefined,
        currency,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Submission Successful", description: "Your bid has been submitted." });
      queryClient.invalidateQueries({ queryKey: ["portal", "submissions"] });
      setLocation("/portal/submissions");
    },
    onError: (error: Error) => {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    },
  });

  const filteredTenders = (tenders || []).filter((t: any) => {
    const matchesSearch =
      !searchQuery ||
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tenderNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const overallStatus = complianceCheck?.overallStatus || "unknown";
  const canSubmit = complianceCheck?.canSubmit !== false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  if (selectedTender) {
    return (
      <PortalLayout>
        <div className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTender(null)}
            className="gap-1"
            data-testid="button-back-tenders"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tenders
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="text-xl">{selectedTender.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {selectedTender.tenderNumber} | Closes: {selectedTender.closingDate ? new Date(selectedTender.closingDate).toLocaleDateString() : "N/A"}
                  </CardDescription>
                </div>
                <Badge className={typeBadgeColors[selectedTender.type] || "bg-gray-500 text-white border-gray-600"}>
                  {selectedTender.type || "Tender"}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compliance Pre-Check</CardTitle>
              <CardDescription>Verify your compliance status before submitting.</CardDescription>
            </CardHeader>
            <CardContent>
              {complianceLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Overall Status:</span>
                    {overallStatus === "green" || overallStatus === "ready" ? (
                      <Badge className="bg-green-500 text-white border-green-600">Ready to Submit</Badge>
                    ) : overallStatus === "amber" || overallStatus === "warning" ? (
                      <Badge className="bg-yellow-500 text-white border-yellow-600">Needs Attention</Badge>
                    ) : overallStatus === "red" || overallStatus === "blocked" ? (
                      <Badge className="bg-red-500 text-white border-red-600">Cannot Submit</Badge>
                    ) : (
                      <Badge className="bg-green-500 text-white border-green-600">Ready to Submit</Badge>
                    )}
                  </div>

                  {complianceCheck?.requirements?.length > 0 && (
                    <div className="space-y-2">
                      {complianceCheck.requirements.map((req: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 rounded-md bg-muted/50"
                          data-testid={`compliance-item-${idx}`}
                        >
                          {req.status === "green" || req.status === "passed" ? (
                            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                          ) : req.status === "amber" || req.status === "warning" ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{req.name || req.requirement}</p>
                            {req.message && (
                              <p className="text-xs text-muted-foreground">{req.message}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {canSubmit && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submit Your Bid</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bidAmount">Bid Amount</Label>
                      <Input
                        id="bidAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        data-testid="input-bid-amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger data-testid="select-currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                          <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional notes for this submission..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      data-testid="input-notes"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full sm:w-auto gap-2"
                    disabled={submitMutation.isPending}
                    data-testid="button-submit-bid"
                  >
                    <Send className="h-4 w-4" />
                    {submitMutation.isPending ? "Submitting..." : "Submit Bid"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Submit a Quote</h1>
          <p className="text-muted-foreground">Select an open tender to submit your bid.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tenders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-tenders"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[140px]" data-testid="select-type-filter">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="RFQ">RFQ</SelectItem>
              <SelectItem value="RFP">RFP</SelectItem>
              <SelectItem value="RFT">RFT</SelectItem>
              <SelectItem value="RFI">RFI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {tendersLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : filteredTenders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No open tenders found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredTenders.map((tender: any) => (
              <Card key={tender.id} className="hover-elevate" data-testid={`card-tender-${tender.id}`}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-foreground line-clamp-2">{tender.title}</h3>
                      <Badge className={typeBadgeColors[tender.type] || "bg-gray-500 text-white border-gray-600"}>
                        {tender.type || "Tender"}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      {tender.tenderNumber && (
                        <div className="flex items-center gap-2">
                          <Tag className="h-3 w-3" />
                          <span>{tender.tenderNumber}</span>
                        </div>
                      )}
                      {tender.closingDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>Closes: {new Date(tender.closingDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {tender.category && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          <span>{tender.category}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedTender(tender)}
                      data-testid={`button-select-tender-${tender.id}`}
                    >
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
