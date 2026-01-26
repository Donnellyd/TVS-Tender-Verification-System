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
  Clock, Send, Eye, Download, RefreshCw, Mail, FileCheck, Building2, Upload, Loader2, BarChart3, Sparkles
} from "lucide-react";
import { format } from "date-fns";
import type { BidSubmission, Tender, Vendor, TenderRequirement, SubmissionDocument, EvaluationScore, TenderScoringCriteria } from "@shared/schema";

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
  const [scoringDialogOpen, setScoringDialogOpen] = useState(false);
  const [isAutoScoring, setIsAutoScoring] = useState(false);
  const [autoScoreResults, setAutoScoreResults] = useState<any>(null);
  const [letterDialogOpen, setLetterDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [generatedLetter, setGeneratedLetter] = useState<{ subject: string; body: string } | null>(null);
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [letterPreview, setLetterPreview] = useState<string>("");

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

  const { data: submissionStats } = useQuery<Record<string, {
    documentsMissing: number;
    totalDocuments: number;
    compliancePercentage: number;
    daysInStage: number;
  }>>({
    queryKey: ["/api/submissions-stats"],
  });

  const { data: requirements } = useQuery<TenderRequirement[]>({
    queryKey: ["/api/tenders", selectedSubmission?.tenderId, "requirements"],
    enabled: !!selectedSubmission?.tenderId,
  });

  const { data: submissionDocuments } = useQuery<SubmissionDocument[]>({
    queryKey: ["/api/submissions", selectedSubmission?.id, "documents"],
    enabled: !!selectedSubmission?.id,
  });

  // Query for scoring criteria when viewing a submission
  const { data: scoringCriteria } = useQuery<TenderScoringCriteria[]>({
    queryKey: ["/api/tenders", selectedSubmission?.tenderId, "scoring-criteria"],
    enabled: !!selectedSubmission?.tenderId,
  });

  // Query for evaluation scores for selected submission
  const { data: evaluationScores, refetch: refetchScores } = useQuery<EvaluationScore[]>({
    queryKey: ["/api/submissions", selectedSubmission?.id, "scores"],
    enabled: !!selectedSubmission?.id,
  });

  // Query for letter templates
  const { data: letterTemplates } = useQuery<Array<{ id: string; name: string; letterType: string; subject: string; bodyTemplate: string }>>({
    queryKey: ["/api/letter-templates"],
  });

  // Query for generated letters for selected submission
  const { data: generatedLetters, refetch: refetchLetters } = useQuery<Array<{ id: string; letterType: string; subject: string; body: string; sentAt: string | null; createdAt: string }>>({
    queryKey: ["/api/submissions", selectedSubmission?.id, "letters"],
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
      if (data?.summary) {
        toast({ 
          title: data.summary.overallPassed ? "Compliance Passed" : "Compliance Failed", 
          description: `${data.summary.passedCount}/${data.summary.totalRequirements} requirements met`,
          variant: data.summary.overallPassed ? "default" : "destructive"
        });
      } else {
        toast({ title: "Compliance Check Complete", description: "Check completed" });
      }
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
      
      if (data?.summary?.overallPassed) {
        toast({ 
          title: "Bid Submitted - Compliance Passed!", 
          description: `All ${data.summary.passedCount} requirements met. Ready for manual review.`,
        });
      } else if (data?.summary) {
        toast({ 
          title: "Bid Submitted - Compliance Issues Found", 
          description: `${data.summary.failedCount} of ${data.summary.totalRequirements} requirements failed.`,
          variant: "destructive"
        });
      } else {
        toast({ title: "Bid Submitted", description: "Submission completed" });
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

  const handleOpenLetterDialog = () => {
    setLetterDialogOpen(true);
    setSelectedTemplateId("");
    setGeneratedLetter(null);
    setLetterPreview("");
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = letterTemplates?.find(t => t.id === templateId);
    if (template && selectedSubmission) {
      const vendor = vendors?.find(v => v.id === selectedSubmission.vendorId);
      const tender = tenders?.find(t => t.id === selectedSubmission.tenderId);
      
      // Replace placeholders with actual data
      let preview = template.bodyTemplate
        .replace(/\[TenderNo\]/g, tender?.tenderNumber || "[TenderNo]")
        .replace(/\[TenderTitle\]/g, tender?.title || "[TenderTitle]")
        .replace(/\[BidderName\]/g, vendor?.companyName || "[BidderName]")
        .replace(/\[ContractorName\]/g, vendor?.companyName || "[ContractorName]")
        .replace(/\[Currency \+ Amount\]/g, selectedSubmission.bidAmount ? `R ${Number(selectedSubmission.bidAmount).toLocaleString()}` : "[Amount]")
        .replace(/\[Amount\]/g, selectedSubmission.bidAmount ? `R ${Number(selectedSubmission.bidAmount).toLocaleString()}` : "[Amount]")
        .replace(/\[Date\]/g, format(new Date(), "dd MMMM yyyy"))
        .replace(/\[YourName\]/g, "[Your Name]")
        .replace(/\[Position\]/g, "[Your Position]")
        .replace(/\[Organisation\]/g, "[Your Organisation]")
        .replace(/\[ContactDetails\]/g, "[Contact Details]");
      
      setLetterPreview(preview);
    }
  };

  const handleGenerateLetter = async () => {
    if (!selectedSubmission || !selectedTemplateId) return;
    
    setIsGeneratingLetter(true);
    const template = letterTemplates?.find(t => t.id === selectedTemplateId);
    
    try {
      const response = await fetch(`/api/submissions/${selectedSubmission.id}/generate-letter`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          letterType: template?.letterType || 'award',
          templateId: selectedTemplateId
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate letter');
      }
      
      const result = await response.json();
      setGeneratedLetter({ subject: result.subject, body: result.body });
      refetchLetters();
      toast({ title: "Letter Generated", description: "Communication ready for review" });
    } catch (error: any) {
      toast({ 
        title: "Generation Failed", 
        description: error.message || "Could not generate letter",
        variant: "destructive" 
      });
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const handleAutoScore = async () => {
    if (!selectedSubmission) return;
    
    setIsAutoScoring(true);
    setAutoScoreResults(null);
    
    try {
      const response = await fetch(`/api/submissions/${selectedSubmission.id}/auto-score`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to auto-score submission');
      }
      
      const results = await response.json();
      setAutoScoreResults(results);
      refetchScores();
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      toast({ 
        title: "Scoring Complete!", 
        description: `Tentative score: ${results.totalScore}/${results.maxPossibleScore} points` 
      });
    } catch (error: any) {
      toast({ 
        title: "Scoring Failed", 
        description: error.message || "Could not score the submission",
        variant: "destructive" 
      });
    } finally {
      setIsAutoScoring(false);
    }
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
                    <TableHead className="text-center">Docs Missing</TableHead>
                    <TableHead className="text-center">Total Score</TableHead>
                    <TableHead className="text-center">B-BBEE</TableHead>
                    <TableHead className="text-center">Compliance %</TableHead>
                    <TableHead className="text-center">Days in Stage</TableHead>
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
                        <TableCell className="text-center">
                          {(() => {
                            const stats = submissionStats?.[submission.id];
                            if (!stats) return "-";
                            if (stats.documentsMissing === 0) {
                              return <Badge variant="default" className="bg-green-600">0</Badge>;
                            }
                            return <Badge variant="destructive">{stats.documentsMissing}</Badge>;
                          })()}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{submission.technicalScore || 0}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {vendor?.bbbeeLevel ? (
                            <Badge variant="outline">{vendor.bbbeeLevel}</Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {(() => {
                            const stats = submissionStats?.[submission.id];
                            if (!stats) return "-";
                            const pct = stats.compliancePercentage;
                            return (
                              <Badge 
                                variant={pct >= 80 ? "default" : pct >= 50 ? "secondary" : "destructive"}
                                className={pct >= 80 ? "bg-green-600" : ""}
                              >
                                {pct}%
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-center">
                          {(() => {
                            const stats = submissionStats?.[submission.id];
                            if (!stats) return "-";
                            const days = stats.daysInStage;
                            return (
                              <span className={days > 7 ? "text-amber-600 font-medium" : ""}>
                                {days}d
                              </span>
                            );
                          })()}
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
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
                <TabsTrigger value="scoring" data-testid="tab-scoring">Scoring</TabsTrigger>
                <TabsTrigger value="compliance" data-testid="tab-compliance">Compliance</TabsTrigger>
                <TabsTrigger value="actions" data-testid="tab-actions">Actions</TabsTrigger>
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

              <TabsContent value="scoring" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      Tentative Scoring
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      AI-powered evaluation based on tender scoring criteria
                    </p>
                  </div>
                  <Button 
                    onClick={handleAutoScore}
                    disabled={isAutoScoring || !scoringCriteria?.length}
                    className="gap-2"
                    data-testid="button-auto-score"
                  >
                    {isAutoScoring ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {isAutoScoring ? "Scoring..." : "Auto Score Submission"}
                  </Button>
                </div>

                {!scoringCriteria?.length ? (
                  <EmptyState
                    icon={BarChart3}
                    title="No scoring criteria"
                    description="The tender doesn't have scoring criteria defined. Upload a tender PDF and extract scoring criteria first."
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Scoring Summary */}
                    {(evaluationScores?.length || autoScoreResults) && (
                      <Card className="border-blue-200 dark:border-blue-900" data-testid="card-score-summary">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center justify-between">
                            <span>Current Score</span>
                            <span className="text-2xl text-blue-600" data-testid="text-total-score">
                              {evaluationScores?.reduce((sum, s) => sum + s.score, 0) || autoScoreResults?.totalScore || 0}
                              <span className="text-sm text-muted-foreground font-normal">
                                / {scoringCriteria.reduce((sum, c) => sum + (c.maxScore || 0), 0)}
                              </span>
                            </span>
                          </CardTitle>
                        </CardHeader>
                        {autoScoreResults?.overallAssessment && (
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              {autoScoreResults.overallAssessment}
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    )}

                    {/* SA Preferential Procurement Scoring Reference */}
                    <Card data-testid="card-sa-scoring-reference">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileCheck className="w-5 h-5 text-teal-600" />
                          SA Preferential Procurement Scoring
                        </CardTitle>
                        <CardDescription>
                          {selectedSubmission.scoringSystem === "90/10" ? 
                            "90/10 System (Contracts over R50 Million)" : 
                            "80/20 System (Contracts under R50 Million)"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Price Scoring Formula */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800" data-testid="section-price-formula">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-green-700 dark:text-green-300">Ps</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-green-800 dark:text-green-200 mb-1">Price Scoring Formula</div>
                              <div className="font-mono text-sm bg-white/60 dark:bg-black/20 rounded px-2 py-1 mb-2" data-testid="text-price-formula">
                                Ps = {selectedSubmission.scoringSystem === "90/10" ? "90" : "80"} × (1 - (Pt - Pmin) / Pmin)
                              </div>
                              <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                                <p><strong>Ps</strong> = Points scored for price</p>
                                <p><strong>Pt</strong> = Rand value of bid under consideration (R{selectedSubmission.bidAmount?.toLocaleString() || "N/A"})</p>
                                <p><strong>Pmin</strong> = Lowest acceptable bid price</p>
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground italic">
                                For income-generating contracts: Ps = {selectedSubmission.scoringSystem === "90/10" ? "90" : "80"} × (1 + (Pt - Pmax) / Pmax)
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* B-BBEE Points Table */}
                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800" data-testid="section-bbbee-table">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-purple-700 dark:text-purple-300">B</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-purple-800 dark:text-purple-200 mb-2">B-BBEE Status Level Points</div>
                              
                              {/* Points Table */}
                              <div className="grid grid-cols-4 gap-1 text-xs">
                                <div className="font-semibold text-center bg-purple-100 dark:bg-purple-900 rounded py-1">Level</div>
                                <div className="font-semibold text-center bg-purple-100 dark:bg-purple-900 rounded py-1">80/20</div>
                                <div className="font-semibold text-center bg-purple-100 dark:bg-purple-900 rounded py-1">90/10</div>
                                <div className="font-semibold text-center bg-purple-100 dark:bg-purple-900 rounded py-1">Status</div>
                                
                                {/* Level 1 */}
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 1" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>1</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 1" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>20</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 1" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>10</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 1" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>{vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 1" ? "Current" : ""}</div>
                                
                                {/* Level 2 */}
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 2" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>2</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 2" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>18</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 2" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>9</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 2" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>{vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 2" ? "Current" : ""}</div>
                                
                                {/* Level 3 */}
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 3" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>3</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 3" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>14</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 3" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>6</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 3" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>{vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 3" ? "Current" : ""}</div>
                                
                                {/* Level 4 */}
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 4" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>4</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 4" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>12</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 4" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>5</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 4" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>{vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 4" ? "Current" : ""}</div>
                                
                                {/* Level 5 */}
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 5" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>5</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 5" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>8</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 5" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>4</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 5" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>{vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 5" ? "Current" : ""}</div>
                                
                                {/* Level 6 */}
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 6" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>6</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 6" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>6</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 6" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>3</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 6" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>{vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 6" ? "Current" : ""}</div>
                                
                                {/* Level 7 */}
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 7" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>7</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 7" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>4</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 7" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>2</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 7" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>{vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 7" ? "Current" : ""}</div>
                                
                                {/* Level 8 */}
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 8" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>8</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 8" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>2</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 8" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>1</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 8" ? "bg-purple-200 dark:bg-purple-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>{vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Level 8" ? "Current" : ""}</div>
                                
                                {/* Non-Compliant */}
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Non-Compliant" ? "bg-red-200 dark:bg-red-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>N/C</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Non-Compliant" ? "bg-red-200 dark:bg-red-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>0</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Non-Compliant" ? "bg-red-200 dark:bg-red-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>0</div>
                                <div className={`text-center py-1 ${vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Non-Compliant" ? "bg-red-200 dark:bg-red-800 font-bold" : "bg-white/60 dark:bg-black/20"}`}>{vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel === "Non-Compliant" ? "Current" : ""}</div>
                              </div>
                              
                              <div className="mt-3 text-xs text-purple-700 dark:text-purple-300">
                                <p><strong>Current B-BBEE Level:</strong> {vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel || "Not specified"}</p>
                                <p><strong>Points Awarded:</strong> {selectedSubmission.bbbeePoints ?? 
                                  (() => {
                                    const level = vendors?.find(v => v.id === selectedSubmission.vendorId)?.bbbeeLevel;
                                    const is90_10 = selectedSubmission.scoringSystem === "90/10";
                                    const points80_20: Record<string, number> = { "Level 1": 20, "Level 2": 18, "Level 3": 14, "Level 4": 12, "Level 5": 8, "Level 6": 6, "Level 7": 4, "Level 8": 2, "Non-Compliant": 0 };
                                    const points90_10: Record<string, number> = { "Level 1": 10, "Level 2": 9, "Level 3": 6, "Level 4": 5, "Level 5": 4, "Level 6": 3, "Level 7": 2, "Level 8": 1, "Non-Compliant": 0 };
                                    return level ? (is90_10 ? points90_10[level] : points80_20[level]) || 0 : 0;
                                  })()
                                }</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Scoring Grid */}
                    <Table data-testid="table-scoring-grid">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Criteria</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Max</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                          <TableHead>Comments</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scoringCriteria.map((criterion) => {
                          const score = evaluationScores?.find(s => s.criteriaName === criterion.criteriaName);
                          return (
                            <TableRow key={criterion.id} data-testid={`row-criterion-${criterion.id}`}>
                              <TableCell>
                                <div className="font-medium" data-testid={`text-criterion-name-${criterion.id}`}>{criterion.criteriaName}</div>
                                {criterion.description && (
                                  <div className="text-xs text-muted-foreground max-w-xs truncate">
                                    {criterion.description}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  criterion.criteriaCategory === 'Technical' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  criterion.criteriaCategory === 'Price' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  criterion.criteriaCategory === 'BBBEE' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                  criterion.criteriaCategory === 'Experience' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}>
                                  {criterion.criteriaCategory}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-medium">{criterion.maxScore}</TableCell>
                              <TableCell className="text-right">
                                {score ? (
                                  <span className={`font-semibold ${score.score >= (criterion.maxScore || 0) * 0.7 ? 'text-green-600' : score.score >= (criterion.maxScore || 0) * 0.5 ? 'text-yellow-600' : 'text-red-600'}`} data-testid={`text-score-${criterion.id}`}>
                                    {score.score}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground" data-testid={`text-score-${criterion.id}`}>-</span>
                                )}
                              </TableCell>
                              <TableCell className="max-w-xs">
                                <span className="text-sm text-muted-foreground truncate">
                                  {score?.comments || "-"}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {/* Category Breakdown */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2" data-testid="section-category-breakdown">
                      <div className="font-medium text-sm">Score by Category</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(
                          scoringCriteria.reduce((acc, c) => {
                            const score = evaluationScores?.find(s => s.criteriaName === c.criteriaName);
                            if (!acc[c.criteriaCategory]) {
                              acc[c.criteriaCategory] = { score: 0, max: 0 };
                            }
                            acc[c.criteriaCategory].max += c.maxScore || 0;
                            acc[c.criteriaCategory].score += score?.score || 0;
                            return acc;
                          }, {} as Record<string, { score: number; max: number }>)
                        ).map(([category, data]) => (
                          <div key={category} className="bg-background rounded p-2 text-center" data-testid={`card-category-${category.toLowerCase().replace(/\s+/g, '-')}`}>
                            <div className="text-xs text-muted-foreground">{category}</div>
                            <div className="text-lg font-semibold" data-testid={`text-category-score-${category.toLowerCase().replace(/\s+/g, '-')}`}>
                              {data.score}<span className="text-sm text-muted-foreground font-normal">/{data.max}</span>
                            </div>
                            <Progress 
                              value={(data.score / data.max) * 100} 
                              className="h-1 mt-1" 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
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

                {complianceResults && complianceResults.summary && (
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
                            value={complianceResults.summary.totalRequirements > 0 ? (complianceResults.summary.passedCount / complianceResults.summary.totalRequirements) * 100 : 0} 
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
                      <CardTitle className="text-base flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-600" />
                        Communications
                      </CardTitle>
                      <CardDescription>Generate letters from templates with auto-filled details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        className="w-full gap-2"
                        onClick={handleOpenLetterDialog}
                        data-testid="button-open-letter-dialog"
                      >
                        <Mail className="w-4 h-4" />
                        Generate Communication
                      </Button>
                      
                      {generatedLetters && generatedLetters.length > 0 && (
                        <div className="space-y-2 pt-2 border-t">
                          <p className="text-xs text-muted-foreground font-medium">Recent Letters</p>
                          {generatedLetters.slice(0, 3).map((letter) => (
                            <div key={letter.id} className="p-2 bg-muted rounded text-sm flex items-center justify-between">
                              <span className="truncate">{letter.subject}</span>
                              <Badge variant="outline" className="text-xs ml-2 shrink-0">
                                {letter.letterType}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {letterTemplates?.length || 0} templates available
                      </p>
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

      <Dialog open={letterDialogOpen} onOpenChange={setLetterDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Generate Communication
            </DialogTitle>
            <DialogDescription>
              Select a template and generate a communication letter for this submission
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Template</Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                <SelectTrigger data-testid="select-letter-template">
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {letterTemplates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {letterPreview && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Preview</Label>
                <div className="p-4 bg-muted rounded-md whitespace-pre-wrap font-mono text-sm max-h-64 overflow-y-auto">
                  {letterPreview}
                </div>
                <p className="text-xs text-muted-foreground">
                  Placeholders in [brackets] will be replaced with actual values when generated
                </p>
              </div>
            )}

            {generatedLetter && (
              <div className="space-y-3 border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Letter Generated Successfully</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Subject</Label>
                  <div className="p-2 bg-background rounded border text-sm font-medium">
                    {generatedLetter.subject}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Body</Label>
                  <div className="p-3 bg-background rounded border whitespace-pre-wrap text-sm max-h-48 overflow-y-auto">
                    {generatedLetter.body}
                  </div>
                </div>
              </div>
            )}

            {generatedLetters && generatedLetters.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Previously Generated Letters</Label>
                <div className="border rounded-lg divide-y">
                  {generatedLetters.map((letter) => (
                    <div key={letter.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{letter.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {letter.createdAt ? format(new Date(letter.createdAt), "PPp") : "N/A"}
                          {letter.sentAt && " • Sent"}
                        </p>
                      </div>
                      <Badge variant="outline">{letter.letterType}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLetterDialogOpen(false)}>
              Close
            </Button>
            <Button 
              onClick={handleGenerateLetter}
              disabled={!selectedTemplateId || isGeneratingLetter}
              data-testid="button-generate-letter"
            >
              {isGeneratingLetter ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Letter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
