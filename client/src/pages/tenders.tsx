import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { StatusBadge } from "@/components/StatusBadge";
import { FilledPencilIcon } from "@/components/FilledPencilIcon";
import { EmptyState } from "@/components/EmptyState";
import { DataTableSkeleton } from "@/components/DataTableSkeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Filter, X, FileText, Trash2, Calendar, ClipboardList, BarChart3, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { format, isValid } from "date-fns";
import type { Tender, InsertTender, Municipality, Vendor, TenderScoringCriteria } from "@shared/schema";

const formatDateForInput = (date: Date | string | null | undefined): string => {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!isValid(d)) return "";
  return format(d, "yyyy-MM-dd");
};

const tenderTypes = ["RFQ", "RFP", "RFT", "EOI"];
const tenderStatuses = ["open", "closed", "under_review", "awarded", "cancelled"];
const tenderCategories = ["Goods", "Services", "Works", "Consulting", "IT", "Construction", "Transport"];
const priorities = ["low", "medium", "high", "critical"];

export default function Tenders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tenderToDelete, setTenderToDelete] = useState<Tender | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [scoringDialogOpen, setScoringDialogOpen] = useState(false);
  const [selectedTenderForScoring, setSelectedTenderForScoring] = useState<Tender | null>(null);

  const [formData, setFormData] = useState<Partial<InsertTender>>({
    tenderNumber: "",
    title: "",
    description: "",
    tenderType: "RFQ",
    category: "Goods",
    closingDate: new Date(),
    status: "open",
    priority: "medium",
    issuer: "",
    requirements: "",
    bbbeeRequirement: "",
  });

  const { data: tenders, isLoading } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });

  const { data: municipalities } = useQuery<Municipality[]>({
    queryKey: ["/api/municipalities"],
  });

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  // Query for scoring criteria when a tender is selected
  const { data: scoringCriteria, isLoading: scoringLoading } = useQuery<TenderScoringCriteria[]>({
    queryKey: ["/api/tenders", selectedTenderForScoring?.id, "scoring-criteria"],
    enabled: !!selectedTenderForScoring?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertTender) => apiRequest("POST", "/api/tenders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      toast({ title: "Success", description: "Tender created successfully" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      const message = error.message || "Failed to create tender";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertTender> }) =>
      apiRequest("PUT", `/api/tenders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      toast({ title: "Success", description: "Tender updated successfully" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      const message = error.message || "Failed to update tender";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/tenders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      toast({ title: "Success", description: "Tender deleted successfully" });
      setDeleteDialogOpen(false);
      setTenderToDelete(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete tender", variant: "destructive" });
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTender(null);
    setFormData({
      tenderNumber: "",
      title: "",
      description: "",
      tenderType: "RFQ",
      category: "Goods",
      closingDate: new Date(),
      status: "open",
      priority: "medium",
      issuer: "",
      requirements: "",
      bbbeeRequirement: "",
    });
  };

  const handleEdit = (tender: Tender) => {
    setEditingTender(tender);
    setFormData({
      tenderNumber: tender.tenderNumber,
      title: tender.title,
      description: tender.description || "",
      tenderType: tender.tenderType,
      category: tender.category,
      closingDate: tender.closingDate ? new Date(tender.closingDate) : new Date(),
      status: tender.status,
      priority: tender.priority || "medium",
      issuer: tender.issuer || "",
      requirements: tender.requirements || "",
      bbbeeRequirement: tender.bbbeeRequirement || "",
      municipalityId: tender.municipalityId || undefined,
      vendorId: tender.vendorId || undefined,
      estimatedValue: tender.estimatedValue || undefined,
      localContentRequirement: tender.localContentRequirement || undefined,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.tenderNumber || !formData.title || !formData.tenderType || !formData.category) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (editingTender) {
      updateMutation.mutate({ id: editingTender.id, data: formData });
    } else {
      createMutation.mutate(formData as InsertTender);
    }
  };

  const filteredTenders = tenders?.filter((tender) => {
    const matchesSearch =
      !searchTerm ||
      tender.tenderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || tender.status === statusFilter;
    const matchesType = !typeFilter || tender.tenderType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setTypeFilter("");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-blue-500 text-white";
      case "low": return "bg-gray-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <PageHeader
        title="Tender Management"
        description="Create and manage tenders for procurement"
        moduleId="tenders"
        action={{
          label: "Add Tender",
          icon: <Plus className="h-4 w-4 mr-2" />,
          onClick: () => setDialogOpen(true),
          testId: "button-add-tender",
        }}
      />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by tender number or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-tenders"
                />
              </div>
            </div>
            <div className="w-[150px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-tender-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {tenderStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[120px]">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger data-testid="select-tender-type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {tenderTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(searchTerm || statusFilter || typeFilter) && (
              <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tenders Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <DataTableSkeleton columns={8} rows={5} />
          ) : !filteredTenders || filteredTenders.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No tenders found"
              description={searchTerm || statusFilter || typeFilter ? "Try adjusting your filters" : "Create your first tender to get started"}
              actionLabel={!searchTerm && !statusFilter && !typeFilter ? "Add Tender" : undefined}
              onAction={() => setDialogOpen(true)}
              testId="empty-tenders"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Tender No.</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Closing Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenders.map((tender) => (
                  <TableRow key={tender.id} data-testid={`row-tender-${tender.id}`}>
                    <TableCell>
                      <button
                        onClick={() => handleEdit(tender)}
                        className="hover:opacity-80 transition-opacity"
                        data-testid={`button-edit-tender-${tender.id}`}
                        aria-label="Edit tender"
                      >
                        <FilledPencilIcon />
                      </button>
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium">{tender.tenderNumber}</TableCell>
                    <TableCell>
                      <div className="max-w-[250px]">
                        <p className="truncate font-medium">{tender.title}</p>
                        {tender.description && (
                          <p className="text-xs text-muted-foreground truncate">{tender.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 rounded text-xs font-medium">
                        {tender.tenderType}
                      </span>
                    </TableCell>
                    <TableCell>{tender.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">
                          {tender.closingDate ? format(new Date(tender.closingDate), "dd MMM yyyy") : "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(tender.priority || "medium")}`}>
                        {(tender.priority || "medium").charAt(0).toUpperCase() + (tender.priority || "medium").slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tender.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link href={`/tenders/${tender.id}/requirements`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-requirements-${tender.id}`}
                            title="Manage Requirements"
                          >
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTenderForScoring(tender);
                            setScoringDialogOpen(true);
                          }}
                          data-testid={`button-scoring-grid-${tender.id}`}
                          title="Scoring Grid"
                        >
                          <BarChart3 className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setTenderToDelete(tender);
                            setDeleteDialogOpen(true);
                          }}
                          data-testid={`button-delete-tender-${tender.id}`}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl flex flex-col max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{editingTender ? "Edit Tender" : "Create New Tender"}</DialogTitle>
            <DialogDescription>
              {editingTender ? "Update tender details" : "Enter the tender information"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1 py-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenderNumber">Tender Number *</Label>
                  <Input
                    id="tenderNumber"
                    value={formData.tenderNumber}
                    onChange={(e) => setFormData({ ...formData, tenderNumber: e.target.value })}
                    placeholder="e.g., SCM/2024/001"
                    data-testid="input-tender-number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenderType">Type *</Label>
                  <Select
                    value={formData.tenderType}
                    onValueChange={(value) => setFormData({ ...formData, tenderType: value })}
                  >
                    <SelectTrigger data-testid="select-tender-type-form">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenderTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  data-testid="input-tender-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  data-testid="input-tender-description"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenderCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority || "medium"}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger data-testid="select-priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || "open"}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger data-testid="select-status-form">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenderStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="closingDate">Closing Date *</Label>
                  <Input
                    id="closingDate"
                    type="date"
                    value={formatDateForInput(formData.closingDate)}
                    onChange={(e) => setFormData({ ...formData, closingDate: e.target.value ? new Date(e.target.value) : undefined })}
                    data-testid="input-closing-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedValue">Estimated Value (ZAR)</Label>
                  <Input
                    id="estimatedValue"
                    type="number"
                    value={formData.estimatedValue || ""}
                    onChange={(e) => setFormData({ ...formData, estimatedValue: parseInt(e.target.value) || undefined })}
                    data-testid="input-estimated-value"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="municipality">Municipality</Label>
                  <Select
                    value={formData.municipalityId || ""}
                    onValueChange={(value) => setFormData({ ...formData, municipalityId: value || undefined })}
                  >
                    <SelectTrigger data-testid="select-municipality-form">
                      <SelectValue placeholder="Select municipality" />
                    </SelectTrigger>
                    <SelectContent>
                      {municipalities?.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bbbeeRequirement">BBBEE Requirement</Label>
                  <Input
                    id="bbbeeRequirement"
                    value={formData.bbbeeRequirement || ""}
                    onChange={(e) => setFormData({ ...formData, bbbeeRequirement: e.target.value })}
                    placeholder="e.g., Level 4 or higher"
                    data-testid="input-bbbee-requirement"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issuer">Issuer</Label>
                <Input
                  id="issuer"
                  value={formData.issuer || ""}
                  onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                  data-testid="input-issuer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements || ""}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={3}
                  data-testid="input-requirements"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-tender"
            >
              {editingTender ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tender</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete tender "{tenderToDelete?.tenderNumber}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => tenderToDelete && deleteMutation.mutate(tenderToDelete.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-tender"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scoring Grid Dialog */}
      <Dialog open={scoringDialogOpen} onOpenChange={(open) => {
        setScoringDialogOpen(open);
        if (!open) setSelectedTenderForScoring(null);
      }}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Scoring Grid
            </DialogTitle>
            <DialogDescription>
              {selectedTenderForScoring?.tenderNumber} - {selectedTenderForScoring?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {scoringLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Scoring Criteria Section - conditional */}
                {scoringCriteria && scoringCriteria.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Total Maximum Score: <span className="font-medium text-foreground">
                          {scoringCriteria.reduce((sum, c) => sum + (c.maxScore || 0), 0)} points
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {scoringCriteria.length} criteria
                      </div>
                    </div>
                    <Table data-testid="table-scoring-grid">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Criteria</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Max Score</TableHead>
                          <TableHead className="text-right">Weight</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scoringCriteria.map((criterion) => (
                          <TableRow key={criterion.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{criterion.criteriaName}</div>
                                {criterion.description && (
                                  <div className="text-sm text-muted-foreground">{criterion.description}</div>
                                )}
                              </div>
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
                            <TableCell className="text-right font-medium">
                              {criterion.maxScore}
                            </TableCell>
                            <TableCell className="text-right">
                              {criterion.weight}x
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="font-medium text-sm">Score Breakdown by Category</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(
                          scoringCriteria.reduce((acc, c) => {
                            acc[c.criteriaCategory] = (acc[c.criteriaCategory] || 0) + (c.maxScore || 0);
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([category, total]) => (
                          <div key={category} className="bg-background rounded p-2 text-center">
                            <div className="text-xs text-muted-foreground">{category}</div>
                            <div className="text-lg font-semibold">{total}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-2">No scoring criteria extracted yet.</p>
                    <p className="text-sm text-muted-foreground">
                      Upload a tender PDF and extract scoring criteria from the Requirements page.
                    </p>
                  </div>
                )}

                {/* SA Preferential Procurement Reference - always visible */}
                <div className="mt-4 space-y-3">
                  <div className="font-medium text-sm">SA Preferential Procurement Systems</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 80/20 System */}
                    <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 rounded-lg p-3 border border-teal-200 dark:border-teal-800" data-testid="section-80-20-system">
                      <div className="font-semibold text-teal-800 dark:text-teal-200 text-sm mb-2">
                        80/20 System (Under R50M)
                      </div>
                      <div className="text-xs text-teal-700 dark:text-teal-300 space-y-1">
                        <p><strong>Price:</strong> 80 points max</p>
                        <p><strong>B-BBEE:</strong> 20 points max</p>
                        <p className="font-mono bg-white/50 dark:bg-black/20 rounded px-1 mt-1">
                          Ps = 80(1 - (Pt - Pmin)/Pmin)
                        </p>
                      </div>
                    </div>
                    
                    {/* 90/10 System */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800" data-testid="section-90-10-system">
                      <div className="font-semibold text-blue-800 dark:text-blue-200 text-sm mb-2">
                        90/10 System (Over R50M)
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                        <p><strong>Price:</strong> 90 points max</p>
                        <p><strong>B-BBEE:</strong> 10 points max</p>
                        <p className="font-mono bg-white/50 dark:bg-black/20 rounded px-1 mt-1">
                          Ps = 90(1 - (Pt - Pmin)/Pmin)
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* B-BBEE Points Table */}
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 rounded-lg p-3 border border-purple-200 dark:border-purple-800" data-testid="section-bbbee-points-reference">
                    <div className="font-semibold text-purple-800 dark:text-purple-200 text-sm mb-2">
                      B-BBEE Status Level Points
                    </div>
                    <div className="grid grid-cols-9 gap-1 text-xs">
                      <div className="font-semibold text-center bg-purple-100 dark:bg-purple-900 rounded py-1">Level</div>
                      <div className="text-center bg-purple-100 dark:bg-purple-900 rounded py-1">1</div>
                      <div className="text-center bg-purple-100 dark:bg-purple-900 rounded py-1">2</div>
                      <div className="text-center bg-purple-100 dark:bg-purple-900 rounded py-1">3</div>
                      <div className="text-center bg-purple-100 dark:bg-purple-900 rounded py-1">4</div>
                      <div className="text-center bg-purple-100 dark:bg-purple-900 rounded py-1">5</div>
                      <div className="text-center bg-purple-100 dark:bg-purple-900 rounded py-1">6</div>
                      <div className="text-center bg-purple-100 dark:bg-purple-900 rounded py-1">7</div>
                      <div className="text-center bg-purple-100 dark:bg-purple-900 rounded py-1">8</div>
                      
                      <div className="font-semibold text-center bg-white/60 dark:bg-black/20 rounded py-1">80/20</div>
                      <div className="text-center bg-white/60 dark:bg-black/20 rounded py-1">20</div>
                      <div className="text-center bg-white/60 dark:bg-black/20 rounded py-1">18</div>
                      <div className="text-center bg-white/60 dark:bg-black/20 rounded py-1">14</div>
                      <div className="text-center bg-white/60 dark:bg-black/20 rounded py-1">12</div>
                      <div className="text-center bg-white/60 dark:bg-black/20 rounded py-1">8</div>
                      <div className="text-center bg-white/60 dark:bg-black/20 rounded py-1">6</div>
                      <div className="text-center bg-white/60 dark:bg-black/20 rounded py-1">4</div>
                      <div className="text-center bg-white/60 dark:bg-black/20 rounded py-1">2</div>
                      
                      <div className="font-semibold text-center bg-white/60 dark:bg-black/20 rounded py-1">90/10</div>
                      <div className="text-center bg-white/60 dark:bg-black/20 rounded py-1">10</div>
                      <div className="text-center bg-white/60 dark:bg-black/20 rounded py-1">9</div>
                      <div className="text-center bg-white/60 dark:bg-black/20 rounded py-1">6</div>
                      <div className="text-center bg-white/60 dark:bg-black/20 rounded py-1">5</div>
                      <div className="text-center bg-white/60 dark:bg-black/20 rounded py-1">4</div>
                      <div className="text-center bg-white/60 dark:bg-black/20 rounded py-1">3</div>
                      <div className="text-center bg-white/60 dark:bg-black/20 rounded py-1">2</div>
                      <div className="text-center bg-white/60 dark:bg-black/20 rounded py-1">1</div>
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 italic">
                      Non-Compliant bidders receive 0 points
                    </p>
                  </div>

                  {/* Compliance Requirements */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-lg p-3 border border-orange-200 dark:border-orange-800" data-testid="section-compliance-requirements">
                    <div className="font-semibold text-orange-800 dark:text-orange-200 text-sm mb-2">
                      Mandatory Compliance Requirements
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-orange-700 dark:text-orange-300">
                      <p>CSD Registration (max 10 days old)</p>
                      <p>Tax Clearance (valid)</p>
                      <p>B-BBEE Certificate (current)</p>
                      <p>Company Registration</p>
                      <p>COIDA Letter of Good Standing</p>
                      <p>Municipal Rates Clearance (max 90 days)</p>
                      <p>Public Liability Insurance (min R5M)</p>
                      <p>Audited Financials (3 years)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setScoringDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
