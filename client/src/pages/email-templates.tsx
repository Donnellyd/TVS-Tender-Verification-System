import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/EmptyState";
import { DataTableSkeleton } from "@/components/DataTableSkeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  FileText, 
  Edit, 
  Trash2, 
  Eye, 
  Copy,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Send
} from "lucide-react";
import { format } from "date-fns";
import type { LetterTemplate, InsertLetterTemplate } from "@shared/schema";

const letterTypeCategories = {
  outcome: {
    label: "Outcome",
    description: "Final decision communications",
    types: ["award", "rejection", "not_shortlisted", "disqualification", "non_compliant"],
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
  },
  process: {
    label: "Process",
    description: "Evaluation stage communications",
    types: ["shortlisted", "request_clarification", "request_information", "addendum", "extension", "correction_notice", "re_tender"],
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
  },
  standstill: {
    label: "Standstill",
    description: "Standstill period communications",
    types: ["standstill_notice", "standstill_expiry"],
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
  },
  debrief: {
    label: "Debrief",
    description: "Feedback and debrief communications",
    types: ["debrief_invitation", "debrief_response"],
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
  },
  other: {
    label: "Other",
    description: "Other communications",
    types: ["tender_cancelled", "regret"],
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }
};

const letterTypeLabels: Record<string, string> = {
  award: "Award Notification",
  rejection: "Rejection Letter",
  regret: "Regret Letter",
  disqualification: "Disqualification Notice",
  not_shortlisted: "Not Shortlisted",
  shortlisted: "Shortlisted",
  request_clarification: "Request for Clarification",
  request_information: "Request for Information",
  addendum: "Addendum",
  extension: "Extension Notice",
  non_compliant: "Non-Compliant Bid",
  standstill_notice: "Standstill Notice",
  standstill_expiry: "Standstill Expiry",
  debrief_invitation: "Debrief Invitation",
  debrief_response: "Debrief Response",
  tender_cancelled: "Tender Cancelled",
  correction_notice: "Correction Notice",
  re_tender: "Re-Tender Notice"
};

function getTypeCategory(letterType: string): string {
  for (const [key, category] of Object.entries(letterTypeCategories)) {
    if (category.types.includes(letterType)) {
      return key;
    }
  }
  return "other";
}

function getCategoryBadge(letterType: string) {
  const categoryKey = getTypeCategory(letterType);
  const category = letterTypeCategories[categoryKey as keyof typeof letterTypeCategories];
  return (
    <Badge className={category.color}>
      {category.label}
    </Badge>
  );
}

export default function EmailTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LetterTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<LetterTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState<Partial<InsertLetterTemplate>>({
    name: "",
    letterType: "award",
    subject: "",
    bodyTemplate: "",
    isDefault: false,
  });

  const { data: templates, isLoading } = useQuery<LetterTemplate[]>({
    queryKey: ["/api/letter-templates"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertLetterTemplate) => 
      apiRequest("POST", "/api/letter-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/letter-templates"] });
      toast({ title: "Success", description: "Template created successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create template", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertLetterTemplate> }) =>
      apiRequest("PUT", `/api/letter-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/letter-templates"] });
      toast({ title: "Success", description: "Template updated successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update template", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/letter-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/letter-templates"] });
      toast({ title: "Success", description: "Template deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setFormData({
      name: "",
      letterType: "award",
      subject: "",
      bodyTemplate: "",
      isDefault: false,
    });
  };

  const handleEdit = (template: LetterTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      letterType: template.letterType,
      subject: template.subject,
      bodyTemplate: template.bodyTemplate,
      isDefault: template.isDefault ?? false,
    });
    setDialogOpen(true);
  };

  const handlePreview = (template: LetterTemplate) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const handleCopy = (template: LetterTemplate) => {
    setFormData({
      name: `${template.name} (Copy)`,
      letterType: template.letterType,
      subject: template.subject,
      bodyTemplate: template.bodyTemplate,
      isDefault: false,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData as Partial<InsertLetterTemplate> });
    } else {
      createMutation.mutate(formData as InsertLetterTemplate);
    }
  };

  const filteredTemplates = templates?.filter((template) => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.letterType.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    
    const category = letterTypeCategories[activeTab as keyof typeof letterTypeCategories];
    if (category) {
      return matchesSearch && category.types.includes(template.letterType);
    }
    return matchesSearch;
  });

  const placeholders = [
    "[TenderNo]", "[TenderTitle]", "[BidderName]", "[Date]", "[Amount]",
    "[YourName]", "[Position]", "[Organisation]", "[ContactDetails]",
    "[ContractorName]", "[Currency + Amount]", "[X]", "[Link]", "[Venue/Link]"
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Email Templates"
        description="Manage email templates for tender communications (award, rejection, clarification letters)"
        action={{
          label: "Add Template",
          icon: <Plus className="h-4 w-4 mr-2" />,
          onClick: () => setDialogOpen(true),
          testId: "button-add-template"
        }}
      />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(letterTypeCategories).map(([key, category]) => {
            const count = templates?.filter(t => category.types.includes(t.letterType)).length || 0;
            return (
              <Card 
                key={key} 
                className={`cursor-pointer hover-elevate ${activeTab === key ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setActiveTab(key)}
                data-testid={`card-category-${key}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{category.label}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                    <Badge className={category.color}>{category.types.length} types</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Templates</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                  data-testid="input-search-templates"
                />
              </div>
              <Button 
                variant={activeTab === "all" ? "default" : "outline"} 
                size="sm"
                onClick={() => setActiveTab("all")}
                data-testid="button-show-all"
              >
                Show All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <DataTableSkeleton columns={5} rows={5} />
            ) : !filteredTemplates?.length ? (
              <EmptyState
                icon={FileText}
                title="No templates found"
                description={searchTerm ? "Try adjusting your search" : "Create your first template to get started"}
                actionLabel="Add Template"
                onAction={() => setDialogOpen(true)}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id} data-testid={`row-template-${template.id}`}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {letterTypeLabels[template.letterType] || template.letterType}
                        </Badge>
                      </TableCell>
                      <TableCell>{getCategoryBadge(template.letterType)}</TableCell>
                      <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                      <TableCell>
                        {template.isDefault ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handlePreview(template)}
                            data-testid={`button-preview-${template.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEdit(template)}
                            data-testid={`button-edit-${template.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleCopy(template)}
                            data-testid={`button-copy-${template.id}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this template?")) {
                                deleteMutation.mutate(template.id);
                              }
                            }}
                            data-testid={`button-delete-${template.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create New Template"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate 
                ? "Update the template details below"
                : "Create a new communication template with placeholders"
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Award Notification"
                  required
                  data-testid="input-template-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="letterType">Letter Type</Label>
                <Select
                  value={formData.letterType}
                  onValueChange={(value) => setFormData({ ...formData, letterType: value })}
                >
                  <SelectTrigger data-testid="select-letter-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(letterTypeCategories).map(([catKey, category]) => (
                      <div key={catKey}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {category.label}
                        </div>
                        {category.types.map((type) => (
                          <SelectItem key={type} value={type}>
                            {letterTypeLabels[type] || type}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., [TenderNo] – Tender Award Notice"
                required
                data-testid="input-template-subject"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bodyTemplate">Template Body</Label>
                <div className="text-xs text-muted-foreground">
                  Available placeholders:
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {placeholders.map((ph) => (
                  <Badge
                    key={ph}
                    variant="secondary"
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      const textarea = document.getElementById("bodyTemplate") as HTMLTextAreaElement;
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const text = formData.bodyTemplate || "";
                        const newText = text.substring(0, start) + ph + text.substring(end);
                        setFormData({ ...formData, bodyTemplate: newText });
                      }
                    }}
                  >
                    {ph}
                  </Badge>
                ))}
              </div>
              <Textarea
                id="bodyTemplate"
                value={formData.bodyTemplate}
                onChange={(e) => setFormData({ ...formData, bodyTemplate: e.target.value })}
                placeholder="Enter the template body with placeholders..."
                rows={12}
                required
                data-testid="textarea-template-body"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded border-gray-300"
                data-testid="checkbox-default"
              />
              <Label htmlFor="isDefault" className="text-sm font-normal">
                Set as default template for this type
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-template"
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Template Preview
            </DialogTitle>
            <DialogDescription>
              {previewTemplate?.name}
            </DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getCategoryBadge(previewTemplate.letterType)}
                <Badge variant="outline">
                  {letterTypeLabels[previewTemplate.letterType] || previewTemplate.letterType}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Subject</Label>
                <div className="p-3 bg-muted rounded-md font-medium">
                  {previewTemplate.subject}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Body</Label>
                <div className="p-4 bg-muted rounded-md whitespace-pre-wrap font-mono text-sm">
                  {previewTemplate.bodyTemplate}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Created: {previewTemplate.createdAt 
                    ? format(new Date(previewTemplate.createdAt), "PPp") 
                    : "N/A"}
                </span>
                {previewTemplate.isDefault && (
                  <Badge variant="secondary">Default Template</Badge>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              if (previewTemplate) {
                handleEdit(previewTemplate);
                setPreviewOpen(false);
              }
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
