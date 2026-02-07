import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/EmptyState";
import { DataTableSkeleton } from "@/components/DataTableSkeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Award, FileText, CheckCircle, XCircle, Clock, Plus, Trash2, Send, Eye, Edit, Bell, Search } from "lucide-react";
import { format } from "date-fns";
import type { Tender, BidSubmission } from "@shared/schema";

function getSigningStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-300" data-testid={`badge-status-${status}`}><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    case "sla_review":
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-300" data-testid={`badge-status-${status}`}><FileText className="h-3 w-3 mr-1" />SLA Review</Badge>;
    case "signed":
      return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-300" data-testid={`badge-status-${status}`}><CheckCircle className="h-3 w-3 mr-1" />Signed</Badge>;
    case "declined":
      return <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-300" data-testid={`badge-status-${status}`}><XCircle className="h-3 w-3 mr-1" />Declined</Badge>;
    default:
      return <Badge variant="outline" data-testid={`badge-status-${status}`}>{status}</Badge>;
  }
}

export default function AwardManagement() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selectedTenderId, setSelectedTenderId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("award-signing");

  const [createAwardOpen, setCreateAwardOpen] = useState(false);
  const [awardFormData, setAwardFormData] = useState({ submissionId: "", awardLetterContent: "" });

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedAcceptance, setSelectedAcceptance] = useState<any>(null);

  const [slaDialogOpen, setSlaDialogOpen] = useState(false);
  const [editingSla, setEditingSla] = useState<any>(null);
  const [slaFormData, setSlaFormData] = useState({ title: "", description: "", documentContent: "", isRequired: true });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingSlaId, setDeletingSlaId] = useState<string>("");

  const { data: tenders } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });

  const { data: awardAcceptances, isLoading: acceptancesLoading } = useQuery<any[]>({
    queryKey: ["/api/tenders", selectedTenderId, "award-acceptances"],
    enabled: !!selectedTenderId,
  });

  const { data: slaDocuments, isLoading: slaLoading } = useQuery<any[]>({
    queryKey: ["/api/tenders", selectedTenderId, "sla-documents"],
    enabled: !!selectedTenderId,
  });

  const { data: allSubmissions } = useQuery<BidSubmission[]>({
    queryKey: ["/api/submissions"],
    enabled: !!selectedTenderId,
  });

  const eligibleSubmissions = (allSubmissions || []).filter(
    (s: any) => s.tenderId === selectedTenderId && (s.status === "passed" || s.status === "manual_review")
  );

  const createAwardMutation = useMutation({
    mutationFn: (data: { submissionId: string; awardLetterContent: string }) =>
      apiRequest("POST", "/api/award-acceptances", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/tenders", selectedTenderId, "award-acceptances"] });
      toast({ title: "Success", description: "Award acceptance created successfully" });
      setCreateAwardOpen(false);
      setAwardFormData({ submissionId: "", awardLetterContent: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create award acceptance", variant: "destructive" });
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/award-acceptances/${id}/remind`, {}),
    onSuccess: () => {
      toast({ title: "Success", description: "Reminder sent successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to send reminder", variant: "destructive" });
    },
  });

  const createSlaMutation = useMutation({
    mutationFn: (data: { title: string; description: string; documentContent: string; isRequired: boolean }) =>
      apiRequest("POST", `/api/tenders/${selectedTenderId}/sla-documents`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/tenders", selectedTenderId, "sla-documents"] });
      toast({ title: "Success", description: "SLA document created successfully" });
      handleCloseSlaDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create SLA document", variant: "destructive" });
    },
  });

  const updateSlaMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title: string; description: string; documentContent: string; isRequired: boolean } }) =>
      apiRequest("PUT", `/api/sla-documents/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/tenders", selectedTenderId, "sla-documents"] });
      toast({ title: "Success", description: "SLA document updated successfully" });
      handleCloseSlaDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update SLA document", variant: "destructive" });
    },
  });

  const deleteSlaMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/sla-documents/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/tenders", selectedTenderId, "sla-documents"] });
      toast({ title: "Success", description: "SLA document deleted successfully" });
      setDeleteConfirmOpen(false);
      setDeletingSlaId("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete SLA document", variant: "destructive" });
    },
  });

  const handleCloseSlaDialog = () => {
    setSlaDialogOpen(false);
    setEditingSla(null);
    setSlaFormData({ title: "", description: "", documentContent: "", isRequired: true });
  };

  const handleEditSla = (sla: any) => {
    setEditingSla(sla);
    setSlaFormData({
      title: sla.title || "",
      description: sla.description || "",
      documentContent: sla.documentContent || "",
      isRequired: sla.isRequired ?? true,
    });
    setSlaDialogOpen(true);
  };

  const handleSlaSubmit = () => {
    if (!slaFormData.title.trim()) {
      toast({ title: "Validation Error", description: "Title is required", variant: "destructive" });
      return;
    }
    if (!slaFormData.documentContent.trim()) {
      toast({ title: "Validation Error", description: "Document content is required", variant: "destructive" });
      return;
    }
    if (editingSla) {
      updateSlaMutation.mutate({ id: editingSla.id, data: slaFormData });
    } else {
      createSlaMutation.mutate(slaFormData);
    }
  };

  const handleCreateAward = () => {
    if (!awardFormData.submissionId) {
      toast({ title: "Validation Error", description: "Please select a submission", variant: "destructive" });
      return;
    }
    createAwardMutation.mutate(awardFormData);
  };

  const selectedTender = tenders?.find((t) => t.id === selectedTenderId);

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Award & SLA Management"
        description="Manage tender awards, track vendor signing status, and configure SLA documents"
      />

      <div className="flex-1 p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList data-testid="tabs-award-management">
            <TabsTrigger value="award-signing" data-testid="tab-award-signing">
              <Award className="h-4 w-4 mr-2" />
              Award Signing
            </TabsTrigger>
            <TabsTrigger value="sla-documents" data-testid="tab-sla-documents">
              <FileText className="h-4 w-4 mr-2" />
              SLA Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="award-signing" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
                <CardTitle className="text-lg">Award Acceptances</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-64">
                    <Select value={selectedTenderId} onValueChange={setSelectedTenderId} data-testid="select-tender-award">
                      <SelectTrigger data-testid="select-tender-award-trigger">
                        <SelectValue placeholder="Select a tender" />
                      </SelectTrigger>
                      <SelectContent>
                        {(tenders || []).map((tender) => (
                          <SelectItem key={tender.id} value={tender.id} data-testid={`select-tender-option-${tender.id}`}>
                            {tender.tenderNumber} - {tender.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedTenderId && (
                    <Button
                      onClick={() => setCreateAwardOpen(true)}
                      data-testid="button-create-award"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Award
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedTenderId ? (
                  <EmptyState
                    icon={Award}
                    title="Select a Tender"
                    description="Choose a tender from the dropdown above to view award acceptances"
                    testId="empty-state-no-tender-awards"
                  />
                ) : acceptancesLoading ? (
                  <DataTableSkeleton columns={6} rows={5} />
                ) : !awardAcceptances || awardAcceptances.length === 0 ? (
                  <EmptyState
                    icon={Award}
                    title="No Award Acceptances"
                    description="No award acceptances found for this tender. Create one to get started."
                    actionLabel="Create Award"
                    onAction={() => setCreateAwardOpen(true)}
                    testId="empty-state-no-acceptances"
                  />
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vendor Company</TableHead>
                          <TableHead>Bid Amount</TableHead>
                          <TableHead>Total Score</TableHead>
                          <TableHead>Signing Status</TableHead>
                          <TableHead>Signed Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {awardAcceptances.map((acceptance: any) => (
                          <TableRow key={acceptance.id} data-testid={`row-acceptance-${acceptance.id}`}>
                            <TableCell data-testid={`text-vendor-${acceptance.id}`}>
                              {acceptance.vendorCompanyName || acceptance.submission?.vendor?.companyName || "N/A"}
                            </TableCell>
                            <TableCell data-testid={`text-bid-amount-${acceptance.id}`}>
                              {acceptance.bidAmount != null
                                ? `R ${Number(acceptance.bidAmount).toLocaleString()}`
                                : "N/A"}
                            </TableCell>
                            <TableCell data-testid={`text-total-score-${acceptance.id}`}>
                              {acceptance.totalScore != null ? acceptance.totalScore : "N/A"}
                            </TableCell>
                            <TableCell data-testid={`text-status-${acceptance.id}`}>
                              {getSigningStatusBadge(acceptance.signingStatus || acceptance.status || "pending")}
                            </TableCell>
                            <TableCell data-testid={`text-signed-date-${acceptance.id}`}>
                              {acceptance.signedAt
                                ? format(new Date(acceptance.signedAt), "dd MMM yyyy")
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 flex-wrap">
                                {(acceptance.signingStatus === "pending" || acceptance.signingStatus === "sla_review" ||
                                  acceptance.status === "pending" || acceptance.status === "sla_review") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => sendReminderMutation.mutate(acceptance.id)}
                                    disabled={sendReminderMutation.isPending}
                                    data-testid={`button-send-reminder-${acceptance.id}`}
                                  >
                                    <Send className="h-3 w-3 mr-1" />
                                    Send Reminder
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAcceptance(acceptance);
                                    setDetailsDialogOpen(true);
                                  }}
                                  data-testid={`button-view-details-${acceptance.id}`}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Details
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sla-documents" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
                <CardTitle className="text-lg">SLA Documents</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-64">
                    <Select value={selectedTenderId} onValueChange={setSelectedTenderId} data-testid="select-tender-sla">
                      <SelectTrigger data-testid="select-tender-sla-trigger">
                        <SelectValue placeholder="Select a tender" />
                      </SelectTrigger>
                      <SelectContent>
                        {(tenders || []).map((tender) => (
                          <SelectItem key={tender.id} value={tender.id} data-testid={`select-tender-sla-option-${tender.id}`}>
                            {tender.tenderNumber} - {tender.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedTenderId && (
                    <Button
                      onClick={() => {
                        setEditingSla(null);
                        setSlaFormData({ title: "", description: "", documentContent: "", isRequired: true });
                        setSlaDialogOpen(true);
                      }}
                      data-testid="button-add-sla"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add SLA Document
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedTenderId ? (
                  <EmptyState
                    icon={FileText}
                    title="Select a Tender"
                    description="Choose a tender from the dropdown above to view SLA documents"
                    testId="empty-state-no-tender-sla"
                  />
                ) : slaLoading ? (
                  <DataTableSkeleton columns={4} rows={3} />
                ) : !slaDocuments || slaDocuments.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No SLA Documents"
                    description="No SLA documents found for this tender. Add one to get started."
                    actionLabel="Add SLA Document"
                    onAction={() => {
                      setEditingSla(null);
                      setSlaFormData({ title: "", description: "", documentContent: "", isRequired: true });
                      setSlaDialogOpen(true);
                    }}
                    testId="empty-state-no-sla"
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {slaDocuments.map((sla: any) => (
                      <Card key={sla.id} data-testid={`card-sla-${sla.id}`}>
                        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                          <div className="space-y-1 min-w-0">
                            <CardTitle className="text-base truncate" data-testid={`text-sla-title-${sla.id}`}>
                              {sla.title}
                            </CardTitle>
                            {sla.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-sla-description-${sla.id}`}>
                                {sla.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditSla(sla)}
                              data-testid={`button-edit-sla-${sla.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeletingSlaId(sla.id);
                                setDeleteConfirmOpen(true);
                              }}
                              data-testid={`button-delete-sla-${sla.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2 flex-wrap">
                            {sla.isRequired && (
                              <Badge variant="secondary" data-testid={`badge-required-${sla.id}`}>
                                Required
                              </Badge>
                            )}
                            {sla.version && (
                              <Badge variant="outline" data-testid={`badge-version-${sla.id}`}>
                                v{sla.version}
                              </Badge>
                            )}
                            {sla.createdAt && (
                              <span className="text-xs text-muted-foreground" data-testid={`text-sla-date-${sla.id}`}>
                                {format(new Date(sla.createdAt), "dd MMM yyyy")}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={createAwardOpen} onOpenChange={setCreateAwardOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Award Acceptance</DialogTitle>
            <DialogDescription>
              Select a submission and provide award letter content to create an award acceptance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="submission-select">Submission</Label>
              <Select
                value={awardFormData.submissionId}
                onValueChange={(val) => setAwardFormData((prev) => ({ ...prev, submissionId: val }))}
                data-testid="select-submission"
              >
                <SelectTrigger data-testid="select-submission-trigger" id="submission-select">
                  <SelectValue placeholder="Select a submission" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleSubmissions.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No eligible submissions
                    </SelectItem>
                  ) : (
                    eligibleSubmissions.map((sub: any) => (
                      <SelectItem key={sub.id} value={sub.id} data-testid={`select-submission-option-${sub.id}`}>
                        {sub.vendorCompanyName || sub.id} - {sub.status}
                        {sub.bidAmount != null ? ` (R ${Number(sub.bidAmount).toLocaleString()})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="award-letter">Award Letter Content</Label>
              <Textarea
                id="award-letter"
                placeholder="Enter award letter content..."
                value={awardFormData.awardLetterContent}
                onChange={(e) => setAwardFormData((prev) => ({ ...prev, awardLetterContent: e.target.value }))}
                rows={6}
                data-testid="textarea-award-letter"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateAwardOpen(false)} data-testid="button-cancel-create-award">
              Cancel
            </Button>
            <Button
              onClick={handleCreateAward}
              disabled={createAwardMutation.isPending}
              data-testid="button-submit-create-award"
            >
              {createAwardMutation.isPending ? "Creating..." : "Create Award"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Award Acceptance Details</DialogTitle>
            <DialogDescription>
              Viewing details for this award acceptance.
            </DialogDescription>
          </DialogHeader>
          {selectedAcceptance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Vendor</Label>
                  <p className="text-sm font-medium" data-testid="text-detail-vendor">
                    {selectedAcceptance.vendorCompanyName || selectedAcceptance.submission?.vendor?.companyName || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div data-testid="text-detail-status">
                    {getSigningStatusBadge(selectedAcceptance.signingStatus || selectedAcceptance.status || "pending")}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Bid Amount</Label>
                  <p className="text-sm font-medium" data-testid="text-detail-bid-amount">
                    {selectedAcceptance.bidAmount != null
                      ? `R ${Number(selectedAcceptance.bidAmount).toLocaleString()}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Score</Label>
                  <p className="text-sm font-medium" data-testid="text-detail-total-score">
                    {selectedAcceptance.totalScore ?? "N/A"}
                  </p>
                </div>
                {selectedAcceptance.signedAt && (
                  <div>
                    <Label className="text-muted-foreground">Signed Date</Label>
                    <p className="text-sm font-medium" data-testid="text-detail-signed-date">
                      {format(new Date(selectedAcceptance.signedAt), "dd MMM yyyy HH:mm")}
                    </p>
                  </div>
                )}
                {selectedAcceptance.signatureData && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Signature</Label>
                    <p className="text-sm font-medium" data-testid="text-detail-signature">
                      {typeof selectedAcceptance.signatureData === "string"
                        ? selectedAcceptance.signatureData
                        : "Signature on file"}
                    </p>
                  </div>
                )}
              </div>
              {selectedAcceptance.awardLetterContent && (
                <div>
                  <Label className="text-muted-foreground">Award Letter</Label>
                  <div className="mt-1 rounded-md border p-3 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto" data-testid="text-detail-award-letter">
                    {selectedAcceptance.awardLetterContent}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)} data-testid="button-close-details">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={slaDialogOpen} onOpenChange={(open) => { if (!open) handleCloseSlaDialog(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSla ? "Edit SLA Document" : "Add SLA Document"}</DialogTitle>
            <DialogDescription>
              {editingSla ? "Update the SLA document details below." : "Create a new SLA document for this tender."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sla-title">Title</Label>
              <Input
                id="sla-title"
                placeholder="Enter SLA title"
                value={slaFormData.title}
                onChange={(e) => setSlaFormData((prev) => ({ ...prev, title: e.target.value }))}
                data-testid="input-sla-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sla-description">Description (optional)</Label>
              <Input
                id="sla-description"
                placeholder="Enter description"
                value={slaFormData.description}
                onChange={(e) => setSlaFormData((prev) => ({ ...prev, description: e.target.value }))}
                data-testid="input-sla-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sla-content">Document Content</Label>
              <Textarea
                id="sla-content"
                placeholder="Paste or type SLA document content..."
                value={slaFormData.documentContent}
                onChange={(e) => setSlaFormData((prev) => ({ ...prev, documentContent: e.target.value }))}
                rows={10}
                data-testid="textarea-sla-content"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="sla-required"
                checked={slaFormData.isRequired}
                onCheckedChange={(checked) =>
                  setSlaFormData((prev) => ({ ...prev, isRequired: checked === true }))
                }
                data-testid="checkbox-sla-required"
              />
              <Label htmlFor="sla-required" className="cursor-pointer">Required</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseSlaDialog} data-testid="button-cancel-sla">
              Cancel
            </Button>
            <Button
              onClick={handleSlaSubmit}
              disabled={createSlaMutation.isPending || updateSlaMutation.isPending}
              data-testid="button-submit-sla"
            >
              {(createSlaMutation.isPending || updateSlaMutation.isPending) ? "Saving..." : editingSla ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete SLA Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this SLA document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} data-testid="button-cancel-delete-sla">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteSlaMutation.mutate(deletingSlaId)}
              disabled={deleteSlaMutation.isPending}
              data-testid="button-confirm-delete-sla"
            >
              {deleteSlaMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
