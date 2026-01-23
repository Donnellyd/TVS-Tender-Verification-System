import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/EmptyState";
import { DataTableSkeleton } from "@/components/DataTableSkeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, Search, FileText, Trash2, CheckCircle, XCircle, AlertCircle, 
  Clock, Send, Eye, Download, RefreshCw, Mail, FileCheck, Building2, Upload, Loader2
} from "lucide-react";
import { format } from "date-fns";
import type { BidSubmission, Tender, Vendor, TenderRequirement, SubmissionDocument } from "@shared/schema";

const submissionStatuses = ["draft", "submitted", "auto_checking", "manual_review", "passed", "failed", "awarded", "rejected"];
const requirementTypes = ["CSD Registration", "Tax Clearance", "BBBEE Certificate", "Company Registration", "COIDA Certificate", "Public Liability Insurance", "Municipal Rates Clearance", "Audited Financials", "Declaration of Interest", "Bid Defaulters Check", "Professional Registration", "Safety Certification", "Other"];

export default function Submissions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<BidSubmission | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [tenderFilter, setTenderFilter] = useState<string>("");
  const [complianceResults, setComplianceResults] = useState<any>(null);
  const [uploadingRequirementId, setUploadingRequirementId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadRequirement, setUploadRequirement] = useState<TenderRequirement | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentDate, setDocumentDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [editingBidAmount, setEditingBidAmount] = useState(false);
  const [bidAmountValue, setBidAmountValue] = useState("");

  const [formData, setFormData] = useState({
    tenderId: "",
    vendorId: "",
    bidAmount: "",
    scoringSystem: "80/20",
  });

  const { data: submissions, isLoading } = useQuery<BidSubmission[]>({
    queryKey: ["/api/submissions"],
  });

  const { data: tenders } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: submissionsByStage } = useQuery<Array<{ stage: string; count: number }>>({
    queryKey: ["/api/analytics/submissions-by-stage"],
  });

  const { data: requirements } = useQuery<TenderRequirement[]>({
    queryKey: ["/api/tenders", selectedSubmission?.tenderId, "requirements"],
    enabled: !!selectedSubmission?.tenderId,
  });

  const { data: submissionDocuments } = useQuery<SubmissionDocument[]>({
    queryKey: ["/api/submissions", selectedSubmission?.id, "documents"],
    enabled: !!selectedSubmission?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/submissions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/submissions-by-stage"] });
      toast({ title: "Success", description: "Bid submission created successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create submission", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PUT", `/api/submissions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/submissions-by-stage"] });
      toast({ title: "Success", description: "Submission updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update submission", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/submissions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/submissions-by-stage"] });
      toast({ title: "Success", description: "Submission deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete submission", variant: "destructive" });
    },
  });

  const runComplianceCheckMutation = useMutation({
    mutationFn: (submissionId: string) => 
      apiRequest("POST", `/api/submissions/${submissionId}/run-compliance-check`, {}),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      setComplianceResults(data);
      toast({ 
        title: data.summary.overallPassed ? "Compliance Passed" : "Compliance Failed", 
        description: `${data.summary.passedCount}/${data.summary.totalRequirements} requirements met`,
        variant: data.summary.overallPassed ? "default" : "destructive"
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to run compliance check", variant: "destructive" });
    },
  });

  const generateLetterMutation = useMutation({
    mutationFn: ({ submissionId, letterType }: { submissionId: string; letterType: string }) =>
      apiRequest("POST", `/api/submissions/${submissionId}/generate-letter`, { letterType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      toast({ title: "Success", description: "Letter generated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate letter", variant: "destructive" });
    },
  });

  const submitBidMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      // Step 1: Update status to "submitted"
      await apiRequest("PUT", `/api/submissions/${submissionId}`, { 
        status: "submitted",
        submissionDate: new Date().toISOString(),
      });
      
      // Step 2: Update to "auto_checking" and run compliance check
      await apiRequest("PUT", `/api/submissions/${submissionId}`, { 
        status: "auto_checking" 
      });
      
      // Step 3: Run compliance check - this will set final status to passed/failed
      return apiRequest("POST", `/api/submissions/${submissionId}/run-compliance-check`, {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/submissions-by-stage"] });
      setComplianceResults(data);
      
      if (data.summary.overallPassed) {
        toast({ 
          title: "Bid Submitted - Compliance Passed!", 
          description: `All ${data.summary.passedCount} requirements met. Ready for manual review.`,
        });
      } else {
        toast({ 
          title: "Bid Submitted - Compliance Issues Found", 
          description: `${data.summary.failedCount} of ${data.summary.totalRequirements} requirements failed.`,
          variant: "destructive"
        });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit bid", variant: "destructive" });
    },
  });

  const handleUploadDocument = async (requirementId: string, file: File) => {
    if (!selectedSubmission) return;
    
    setUploadingRequirementId(requirementId);
    
    try {
      // Use FormData to upload directly to server (bypasses CORS issues with presigned URLs)
      const formData = new FormData();
      formData.append('file', file);
      if (documentDate) {
        formData.append('documentDate', documentDate);
      }
      if (expiryDate) {
        formData.append('expiryDate', expiryDate);
      }
      
      const response = await fetch(
        `/api/submissions/${selectedSubmission.id}/requirements/${requirementId}/upload-direct`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }
      
      // Refresh documents list
      queryClient.invalidateQueries({ queryKey: ["/api/submissions", selectedSubmission.id, "documents"] });
      
      toast({ title: "Document Uploaded!", description: `${file.name} has been uploaded successfully` });
      handleCloseUploadDialog();
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not upload the document";
      toast({ title: "Upload Failed", description: errorMessage + ". Please try again.", variant: "destructive" });
    } finally {
      setUploadingRequirementId(null);
    }
  };

  const handleOpenUploadDialog = (requirement: TenderRequirement) => {
    setUploadRequirement(requirement);
    setUploadFile(null);
    setDocumentDate("");
    setExpiryDate("");
    setUploadDialogOpen(true);
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setUploadRequirement(null);
    setUploadFile(null);
    setDocumentDate("");
    setExpiryDate("");
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      tenderId: "",
      vendorId: "",
      bidAmount: "",
      scoringSystem: "80/20",
    });
  };

  const handleSubmit = () => {
    if (!formData.tenderId || !formData.vendorId) {
      toast({ title: "Validation Error", description: "Please select a tender and vendor", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      ...formData,
      bidAmount: formData.bidAmount ? parseInt(formData.bidAmount) : null,
      status: "draft",
    });
  };

  const handleViewDetails = (submission: BidSubmission) => {
    setSelectedSubmission(submission);
    setComplianceResults(null);
    setEditingBidAmount(false);
    setBidAmountValue("");
    setDetailsDialogOpen(true);
  };

  const handleStatusChange = (submission: BidSubmission, newStatus: string) => {
    updateMutation.mutate({ id: submission.id, data: { status: newStatus } });
  };

  const filteredSubmissions = submissions?.filter((submission) => {
    const tender = tenders?.find(t => t.id === submission.tenderId);
    const vendor = vendors?.find(v => v.id === submission.vendorId);
    const matchesSearch = !searchTerm ||
      tender?.tenderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor?.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || submission.status === statusFilter;
    const matchesTender = !tenderFilter || submission.tenderId === tenderFilter;
    return matchesSearch && matchesStatus && matchesTender;
  });

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      draft: { variant: "secondary", icon: <Clock className="w-3 h-3" /> },
      submitted: { variant: "default", icon: <Send className="w-3 h-3" /> },
      auto_checking: { variant: "outline", icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
      manual_review: { variant: "outline", icon: <Eye className="w-3 h-3" /> },
      passed: { variant: "default", icon: <CheckCircle className="w-3 h-3" /> },
      failed: { variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
      awarded: { variant: "default", icon: <CheckCircle className="w-3 h-3" /> },
      rejected: { variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
    };
    const config = configs[status] || configs.draft;
    return (
      <Badge variant={config.variant} className="gap-1" data-testid={`badge-status-${status}`}>
        {config.icon}
        {status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getComplianceBadge = (result: string | null) => {
    if (!result || result === "pending") {
      return <Badge variant="outline" className="gap-1"><AlertCircle className="w-3 h-3" /> Pending</Badge>;
    }
    if (result === "passed") {
      return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="w-3 h-3" /> Passed</Badge>;
    }
    return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Failed</Badge>;
  };

  const openTenders = tenders?.filter(t => t.status === "open") || [];

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <PageHeader
        title="Bid Submissions"
        description="Track and manage vendor bid submissions, run compliance checks, and generate award/rejection letters"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {submissionsByStage?.map((stage) => (
          <Card key={stage.stage} data-testid={`card-stage-${stage.stage.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardHeader className="pb-2">
              <CardDescription>{stage.stage}</CardDescription>
              <CardTitle className="text-2xl">{stage.count}</CardTitle>
            </CardHeader>
          </Card>
        ))}
        {(!submissionsByStage || submissionsByStage.length === 0) && (
          <>
            <Card><CardHeader className="pb-2"><CardDescription>Draft</CardDescription><CardTitle className="text-2xl">0</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Submitted</CardDescription><CardTitle className="text-2xl">0</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Under Review</CardDescription><CardTitle className="text-2xl">0</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Awarded</CardDescription><CardTitle className="text-2xl">0</CardTitle></CardHeader></Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>All Submissions</CardTitle>
              <CardDescription>Manage bid submissions and track compliance status</CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2" data-testid="button-add-submission">
              <Plus className="w-4 h-4" />
              New Submission
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by tender or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {submissionStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tenderFilter} onValueChange={setTenderFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-tender-filter">
                <SelectValue placeholder="Filter by tender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenders</SelectItem>
                {tenders?.map((tender) => (
                  <SelectItem key={tender.id} value={tender.id}>
                    {tender.tenderNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <DataTableSkeleton columns={7} rows={5} />
          ) : !filteredSubmissions?.length ? (
            <EmptyState
              icon={FileText}
              title="No submissions found"
              description="Create a new bid submission to get started"
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tender</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Bid Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => {
                    const tender = tenders?.find(t => t.id === submission.tenderId);
                    const vendor = vendors?.find(v => v.id === submission.vendorId);
                    return (
                      <TableRow key={submission.id} data-testid={`row-submission-${submission.id}`}>
                        <TableCell>
                          <div className="font-medium">{tender?.tenderNumber || "Unknown"}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">{tender?.title}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span>{vendor?.companyName || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {submission.bidAmount ? `R ${submission.bidAmount.toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                        <TableCell>{getComplianceBadge(submission.complianceResult)}</TableCell>
                        <TableCell>
                          {submission.submissionDate 
                            ? format(new Date(submission.submissionDate), "dd MMM yyyy") 
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleViewDetails(submission)}
                              data-testid={`button-view-${submission.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteMutation.mutate(submission.id)}
                              data-testid={`button-delete-${submission.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Bid Submission</DialogTitle>
            <DialogDescription>
              Create a new bid submission for a tender
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tenderId">Tender *</Label>
              <Select value={formData.tenderId} onValueChange={(v) => setFormData({ ...formData, tenderId: v })}>
                <SelectTrigger data-testid="select-tender">
                  <SelectValue placeholder="Select a tender" />
                </SelectTrigger>
                <SelectContent>
                  {openTenders.map((tender) => (
                    <SelectItem key={tender.id} value={tender.id}>
                      {tender.tenderNumber} - {tender.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorId">Vendor *</Label>
              <Select value={formData.vendorId} onValueChange={(v) => setFormData({ ...formData, vendorId: v })}>
                <SelectTrigger data-testid="select-vendor">
                  <SelectValue placeholder="Select a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors?.filter(v => v.status === "approved").map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bidAmount">Bid Amount (Rands)</Label>
              <Input
                id="bidAmount"
                type="number"
                value={formData.bidAmount}
                onChange={(e) => setFormData({ ...formData, bidAmount: e.target.value })}
                placeholder="Enter bid amount"
                data-testid="input-bid-amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scoringSystem">Scoring System</Label>
              <Select value={formData.scoringSystem} onValueChange={(v) => setFormData({ ...formData, scoringSystem: v })}>
                <SelectTrigger data-testid="select-scoring">
                  <SelectValue placeholder="Select scoring system" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="80/20">80/20 (Under R50M)</SelectItem>
                  <SelectItem value="90/10">90/10 (Over R50M)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-submit">
              {createMutation.isPending ? "Creating..." : "Create Submission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              View and manage bid submission details, documents, and compliance
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Tender</CardDescription>
                      <CardTitle className="text-lg">
                        {tenders?.find(t => t.id === selectedSubmission.tenderId)?.tenderNumber}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {tenders?.find(t => t.id === selectedSubmission.tenderId)?.title}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Vendor</CardDescription>
                      <CardTitle className="text-lg">
                        {vendors?.find(v => v.id === selectedSubmission.vendorId)?.companyName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        B-BBEE: {vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel || "N/A"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center justify-between">
                        <span>Bid Amount</span>
                        {selectedSubmission.status === "draft" && !editingBidAmount && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              setBidAmountValue(selectedSubmission.bidAmount?.toString() || "");
                              setEditingBidAmount(true);
                            }}
                            data-testid="button-edit-bid-amount"
                          >
                            Edit
                          </Button>
                        )}
                      </CardDescription>
                      {editingBidAmount ? (
                        <div className="space-y-2 mt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">R</span>
                            <Input
                              type="number"
                              value={bidAmountValue}
                              onChange={(e) => setBidAmountValue(e.target.value)}
                              placeholder="e.g. 5000000"
                              className="flex-1 text-right"
                              data-testid="input-edit-bid-amount"
                            />
                          </div>
                          {bidAmountValue && !isNaN(parseInt(bidAmountValue)) && (
                            <p className="text-sm text-muted-foreground">
                              Preview: R {parseInt(bidAmountValue).toLocaleString()}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const parsed = parseInt(bidAmountValue);
                                const newBidAmount = !isNaN(parsed) ? parsed : null;
                                updateMutation.mutate({
                                  id: selectedSubmission.id,
                                  data: { bidAmount: newBidAmount }
                                }, {
                                  onSuccess: () => {
                                    setEditingBidAmount(false);
                                    setSelectedSubmission({ ...selectedSubmission, bidAmount: newBidAmount });
                                    toast({ title: "Bid amount updated" });
                                  }
                                });
                              }}
                              disabled={updateMutation.isPending}
                              data-testid="button-save-bid-amount"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingBidAmount(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <CardTitle className="text-lg">
                          {selectedSubmission.bidAmount ? `R ${selectedSubmission.bidAmount.toLocaleString()}` : "Not set"}
                        </CardTitle>
                      )}
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Status</CardDescription>
                      <div className="mt-2">{getStatusBadge(selectedSubmission.status)}</div>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Compliance</CardDescription>
                      <div className="mt-2">{getComplianceBadge(selectedSubmission.complianceResult)}</div>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Scoring System</CardDescription>
                      <CardTitle className="text-lg">{selectedSubmission.scoringSystem || "80/20"}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                {selectedSubmission.complianceNotes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Compliance Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedSubmission.complianceNotes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Required Documents</h3>
                  <Badge variant="outline">
                    {submissionDocuments?.length || 0} / {requirements?.length || 0} uploaded
                  </Badge>
                </div>

                {selectedSubmission.status === "draft" && (
                  <p className="text-sm text-muted-foreground">
                    Upload documents for each requirement below. Once all required documents are uploaded, you can submit your bid.
                  </p>
                )}

                {requirements?.length ? (
                  <div className="space-y-2">
                    {requirements.map((req) => {
                      const doc = submissionDocuments?.find(d => d.requirementId === req.id);
                      const isUploading = uploadingRequirementId === req.id;
                      return (
                        <div 
                          key={req.id} 
                          className="flex items-center justify-between p-3 border rounded-lg"
                          data-testid={`requirement-${req.id}`}
                        >
                          <div className="flex items-center gap-3">
                            {doc ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-amber-500" />
                            )}
                            <div>
                              <p className="font-medium">{req.requirementType}</p>
                              <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>
                              {doc && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {doc.documentName} {doc.uploadedAt && `• Uploaded ${format(new Date(doc.uploadedAt), "dd MMM yyyy")}`}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {req.isMandatory && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                            {doc ? (
                              <Badge variant="outline" className="gap-1">
                                <FileCheck className="w-3 h-3" />
                                Uploaded
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Missing</Badge>
                            )}
                            {selectedSubmission.status === "draft" && (
                              <Button 
                                size="sm" 
                                variant={doc ? "outline" : "default"}
                                onClick={() => handleOpenUploadDialog(req)}
                                disabled={isUploading}
                                data-testid={`button-upload-${req.id}`}
                              >
                                {isUploading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4 mr-1" />
                                )}
                                {doc ? "Replace" : "Upload"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="No requirements defined"
                    description="Add requirements to the tender first"
                  />
                )}
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Compliance Check</h3>
                  <Button 
                    onClick={() => runComplianceCheckMutation.mutate(selectedSubmission.id)}
                    disabled={runComplianceCheckMutation.isPending}
                    className="gap-2"
                    data-testid="button-run-compliance"
                  >
                    <RefreshCw className={`w-4 h-4 ${runComplianceCheckMutation.isPending ? 'animate-spin' : ''}`} />
                    Run Compliance Check
                  </Button>
                </div>

                {complianceResults && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          {complianceResults.summary.overallPassed ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          {complianceResults.summary.overallPassed ? "Compliance Passed" : "Compliance Failed"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-bold">{complianceResults.summary.totalRequirements}</p>
                              <p className="text-sm text-muted-foreground">Total</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-600">{complianceResults.summary.passedCount}</p>
                              <p className="text-sm text-muted-foreground">Passed</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-red-600">{complianceResults.summary.failedCount}</p>
                              <p className="text-sm text-muted-foreground">Failed</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{complianceResults.summary.mandatoryPassed}/{complianceResults.summary.mandatoryTotal}</p>
                              <p className="text-sm text-muted-foreground">Mandatory</p>
                            </div>
                          </div>
                          <Progress 
                            value={(complianceResults.summary.passedCount / complianceResults.summary.totalRequirements) * 100} 
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-2">
                      {complianceResults.results.map((result: any, index: number) => (
                        <div 
                          key={index}
                          className={`flex items-center justify-between p-3 border rounded-lg ${result.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                        >
                          <div className="flex items-center gap-3">
                            {result.passed ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <div>
                              <p className="font-medium">{result.requirementType}</p>
                              <p className="text-sm text-muted-foreground">{result.reason}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!complianceResults && selectedSubmission.autoCheckCompletedAt && (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">
                        Last check completed on {format(new Date(selectedSubmission.autoCheckCompletedAt), "dd MMM yyyy HH:mm")}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <h3 className="text-lg font-semibold">Workflow Actions</h3>
                
                {selectedSubmission.status === "draft" && (
                  <Card className="border-primary">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Submit Bid
                      </CardTitle>
                      <CardDescription>
                        Submit your bid for compliance checking. Ensure all required documents are uploaded.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileCheck className="w-4 h-4" />
                        <span>
                          {submissionDocuments?.length || 0} / {requirements?.length || 0} documents uploaded
                        </span>
                      </div>
                      <Button 
                        className="w-full gap-2"
                        onClick={() => submitBidMutation.mutate(selectedSubmission.id)}
                        disabled={submitBidMutation.isPending}
                        data-testid="button-submit-bid"
                      >
                        {submitBidMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Submit Bid for Review
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Update Status</CardTitle>
                      <CardDescription>Change the submission status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Select 
                        value={selectedSubmission.status} 
                        onValueChange={(v) => handleStatusChange(selectedSubmission, v)}
                      >
                        <SelectTrigger data-testid="select-update-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {submissionStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Generate Letters</CardTitle>
                      <CardDescription>Create award or rejection letters</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full gap-2"
                        onClick={() => generateLetterMutation.mutate({ 
                          submissionId: selectedSubmission.id, 
                          letterType: "award" 
                        })}
                        disabled={generateLetterMutation.isPending}
                        data-testid="button-generate-award"
                      >
                        <Mail className="w-4 h-4" />
                        Generate Award Letter
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full gap-2"
                        onClick={() => generateLetterMutation.mutate({ 
                          submissionId: selectedSubmission.id, 
                          letterType: "rejection" 
                        })}
                        disabled={generateLetterMutation.isPending}
                        data-testid="button-generate-rejection"
                      >
                        <Mail className="w-4 h-4" />
                        Generate Rejection Letter
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document for: {uploadRequirement?.requirementType}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="upload-file">Select File *</Label>
              <Input
                id="upload-file"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                data-testid="input-upload-file"
              />
              {uploadFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="document-date">Document Date</Label>
              <Input
                id="document-date"
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                data-testid="input-document-date"
              />
              <p className="text-xs text-muted-foreground">
                Date the document was issued (important for CSD, Municipal Rates)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry-date">Expiry Date</Label>
              <Input
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                data-testid="input-expiry-date"
              />
              <p className="text-xs text-muted-foreground">
                When the document expires (important for certificates)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseUploadDialog}>Cancel</Button>
            <Button 
              onClick={() => {
                if (uploadFile && uploadRequirement) {
                  handleUploadDocument(uploadRequirement.id, uploadFile);
                }
              }}
              disabled={!uploadFile || uploadingRequirementId !== null}
              data-testid="button-confirm-upload"
            >
              {uploadingRequirementId ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                "Upload Document"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
