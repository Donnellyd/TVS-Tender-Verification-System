import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { DataTableSkeleton } from "@/components/DataTableSkeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, ArrowLeft, FileText, Trash2, CheckCircle, AlertCircle, 
  Sparkles, Loader2, Upload, ChevronRight, Edit2, File
} from "lucide-react";
import type { Tender, TenderRequirement, InsertTenderRequirement } from "@shared/schema";

const requirementTypes = [
  "CSD Registration", 
  "Tax Clearance", 
  "BBBEE Certificate", 
  "Company Registration", 
  "COIDA Certificate", 
  "Public Liability Insurance", 
  "Municipal Rates Clearance", 
  "Audited Financials", 
  "Declaration of Interest", 
  "Bid Defaulters Check", 
  "Professional Registration", 
  "Safety Certification", 
  "Other"
];

export default function TenderRequirements() {
  const params = useParams<{ id: string }>();
  const tenderId = params.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<TenderRequirement | null>(null);
  const [extractDialogOpen, setExtractDialogOpen] = useState(false);
  const [pdfContent, setPdfContent] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<InsertTenderRequirement>>({
    requirementType: "CSD Registration",
    description: "",
    isMandatory: true,
    maxAgeDays: undefined,
    minValue: undefined,
    validityPeriod: "",
  });

  const { data: tender, isLoading: tenderLoading } = useQuery<Tender>({
    queryKey: ["/api/tenders", tenderId],
    enabled: !!tenderId,
  });

  const { data: requirements, isLoading: requirementsLoading } = useQuery<TenderRequirement[]>({
    queryKey: ["/api/tenders", tenderId, "requirements"],
    enabled: !!tenderId,
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertTenderRequirement) => 
      apiRequest("POST", `/api/tenders/${tenderId}/requirements`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders", tenderId, "requirements"] });
      toast({ title: "Success", description: "Requirement added successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add requirement", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertTenderRequirement> }) =>
      apiRequest("PUT", `/api/tender-requirements/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders", tenderId, "requirements"] });
      toast({ title: "Success", description: "Requirement updated successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update requirement", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/tender-requirements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders", tenderId, "requirements"] });
      toast({ title: "Success", description: "Requirement deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete requirement", variant: "destructive" });
    },
  });

  const extractMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest("POST", `/api/tenders/${tenderId}/extract-requirements`, { pdfContent: content }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders", tenderId, "requirements"] });
      toast({ 
        title: "Success", 
        description: `Extracted ${data.requirements?.length || 0} requirements from tender document` 
      });
      setExtractDialogOpen(false);
      setPdfContent("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to extract requirements", variant: "destructive" });
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRequirement(null);
    setFormData({
      requirementType: "CSD Registration",
      description: "",
      isMandatory: true,
      maxAgeDays: undefined,
      minValue: undefined,
      validityPeriod: "",
    });
  };

  const handleEdit = (requirement: TenderRequirement) => {
    setEditingRequirement(requirement);
    setFormData({
      requirementType: requirement.requirementType as any,
      description: requirement.description,
      isMandatory: requirement.isMandatory ?? true,
      maxAgeDays: requirement.maxAgeDays || undefined,
      minValue: requirement.minValue || undefined,
      validityPeriod: requirement.validityPeriod || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.requirementType || !formData.description) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (editingRequirement) {
      updateMutation.mutate({ id: editingRequirement.id, data: formData });
    } else {
      createMutation.mutate({
        ...formData,
        tenderId: tenderId!,
      } as InsertTenderRequirement);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({ title: "Invalid File", description: "Please select a PDF file", variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File Too Large", description: "PDF file must be less than 10MB", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
      setPdfContent(""); // Clear manual text if file is selected
    }
  };

  const handleUploadAndExtract = async () => {
    if (!selectedFile && !pdfContent.trim()) {
      toast({ title: "Validation Error", description: "Please upload a PDF file or paste the tender document content", variant: "destructive" });
      return;
    }

    try {
      let textContent = pdfContent;

      // If a file is selected, upload and parse it first
      if (selectedFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await fetch(`/api/tenders/${tenderId}/upload-pdf`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to process PDF');
        }

        const result = await response.json();
        textContent = result.text;
        setIsUploading(false);
        
        toast({ 
          title: "PDF Processed", 
          description: `Extracted ${result.pages} pages of text. Now analyzing for requirements...` 
        });
      }

      // Now extract requirements using AI
      extractMutation.mutate(textContent);
    } catch (error: any) {
      setIsUploading(false);
      toast({ title: "Error", description: error.message || "Failed to process PDF", variant: "destructive" });
    }
  };

  const handleExtract = () => {
    handleUploadAndExtract();
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type !== 'application/pdf') {
        toast({ title: "Invalid File", description: "Please drop a PDF file", variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File Too Large", description: "PDF file must be less than 10MB", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
      setPdfContent("");
    }
  };

  const mandatoryCount = requirements?.filter(r => r.isMandatory).length || 0;
  const optionalCount = (requirements?.length || 0) - mandatoryCount;
  const aiExtractedCount = requirements?.filter(r => r.aiExtracted).length || 0;

  if (tenderLoading || !tender) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <DataTableSkeleton columns={4} rows={5} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/tenders" className="hover:text-foreground">Tenders</Link>
        <ChevronRight className="w-4 h-4" />
        <span>{tender.tenderNumber}</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Requirements</span>
      </div>

      <PageHeader
        title={`Requirements: ${tender.tenderNumber}`}
        description={tender.title}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Requirements</CardDescription>
            <CardTitle className="text-2xl">{requirements?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mandatory</CardDescription>
            <CardTitle className="text-2xl text-red-600">{mandatoryCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Optional</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{optionalCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI Extracted</CardDescription>
            <CardTitle className="text-2xl text-purple-600">{aiExtractedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Tender Requirements Checklist</CardTitle>
              <CardDescription>Define the documents and criteria vendors must submit</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setExtractDialogOpen(true)} className="gap-2" data-testid="button-extract-ai">
                <Sparkles className="w-4 h-4" />
                AI Extract from PDF
              </Button>
              <Button onClick={() => setDialogOpen(true)} className="gap-2" data-testid="button-add-requirement">
                <Plus className="w-4 h-4" />
                Add Requirement
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {requirementsLoading ? (
            <DataTableSkeleton columns={4} rows={5} />
          ) : !requirements?.length ? (
            <EmptyState
              icon={FileText}
              title="No requirements defined"
              description="Add requirements manually or use AI to extract from a tender PDF"
            />
          ) : (
            <div className="space-y-3">
              {requirements.map((requirement) => (
                <div 
                  key={requirement.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={`requirement-${requirement.id}`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      {requirement.isMandatory ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{requirement.requirementType}</span>
                        {requirement.isMandatory && (
                          <Badge variant="destructive" className="text-xs">Mandatory</Badge>
                        )}
                        {requirement.aiExtracted && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI Extracted
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{requirement.description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        {requirement.maxAgeDays && (
                          <span>Max age: {requirement.maxAgeDays} days</span>
                        )}
                        {requirement.minValue && (
                          <span>Min value: R{requirement.minValue.toLocaleString()}</span>
                        )}
                        {requirement.validityPeriod && (
                          <span>Validity: {requirement.validityPeriod}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEdit(requirement)}
                      data-testid={`button-edit-${requirement.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteMutation.mutate(requirement.id)}
                      data-testid={`button-delete-${requirement.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRequirement ? "Edit" : "Add"} Requirement</DialogTitle>
            <DialogDescription>
              Define a document or criteria that vendors must submit
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="requirementType">Requirement Type *</Label>
              <Select 
                value={formData.requirementType} 
                onValueChange={(v) => setFormData({ ...formData, requirementType: v as any })}
              >
                <SelectTrigger data-testid="select-requirement-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {requirementTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the requirement in detail..."
                rows={3}
                data-testid="input-description"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isMandatory"
                checked={formData.isMandatory}
                onCheckedChange={(checked) => setFormData({ ...formData, isMandatory: checked as boolean })}
                data-testid="checkbox-mandatory"
              />
              <Label htmlFor="isMandatory" className="cursor-pointer">
                This is a mandatory requirement
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxAgeDays">Max Age (days)</Label>
                <Input
                  id="maxAgeDays"
                  type="number"
                  value={formData.maxAgeDays || ""}
                  onChange={(e) => setFormData({ ...formData, maxAgeDays: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="e.g., 10"
                  data-testid="input-max-age"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minValue">Min Value (Rands)</Label>
                <Input
                  id="minValue"
                  type="number"
                  value={formData.minValue || ""}
                  onChange={(e) => setFormData({ ...formData, minValue: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="e.g., 500000"
                  data-testid="input-min-value"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="validityPeriod">Validity Period</Label>
              <Input
                id="validityPeriod"
                value={formData.validityPeriod}
                onChange={(e) => setFormData({ ...formData, validityPeriod: e.target.value })}
                placeholder="e.g., 12 months, 3 years"
                data-testid="input-validity"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingRequirement ? "Update" : "Add"} Requirement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={extractDialogOpen} onOpenChange={(open) => {
        setExtractDialogOpen(open);
        if (!open) {
          clearFileSelection();
          setPdfContent("");
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI-Powered Requirement Extraction
            </DialogTitle>
            <DialogDescription>
              Upload a tender PDF document or paste the content below. The AI will automatically extract compliance requirements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <div className="space-y-3">
              <Label>Upload Tender PDF</Label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                data-testid="dropzone-pdf"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pdf-upload"
                  data-testid="input-pdf-file"
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <File className="w-8 h-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={clearFileSelection}
                      data-testid="button-clear-file"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ) : isDragging ? (
                  <div>
                    <Upload className="w-10 h-10 mx-auto text-primary mb-2" />
                    <p className="font-medium text-primary">Drop PDF here</p>
                  </div>
                ) : (
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="font-medium">Click to upload PDF</p>
                    <p className="text-sm text-muted-foreground">or drag and drop (max 10MB)</p>
                  </label>
                )}
              </div>
            </div>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t"></div>
              <span className="flex-shrink mx-4 text-sm text-muted-foreground">or paste content</span>
              <div className="flex-grow border-t"></div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pdfContent">Tender Document Content</Label>
              <Textarea
                id="pdfContent"
                value={pdfContent}
                onChange={(e) => {
                  setPdfContent(e.target.value);
                  if (e.target.value) clearFileSelection();
                }}
                placeholder="Paste the tender document text here... The AI will identify requirements such as CSD registration, Tax Clearance, B-BBEE certificates, insurance requirements, etc."
                rows={8}
                className="font-mono text-sm"
                data-testid="input-pdf-content"
                disabled={!!selectedFile}
              />
            </div>
            
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">The AI will look for:</h4>
              <ul className="text-sm text-muted-foreground grid grid-cols-2 gap-1">
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> CSD Registration</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Tax Clearance</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> B-BBEE Certificate</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Company Registration</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> COIDA Certificate</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Public Liability Insurance</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Municipal Rates</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Audited Financials</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 border-t pt-4">
            <Button variant="outline" onClick={() => setExtractDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleExtract} 
              disabled={extractMutation.isPending || isUploading || (!selectedFile && !pdfContent.trim())}
              className="gap-2"
              data-testid="button-extract"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing PDF...
                </>
              ) : extractMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting Requirements...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Extract Requirements
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
