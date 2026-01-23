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
import { Plus, Search, Filter, X, FileText, Trash2, Calendar, ClipboardList } from "lucide-react";
import { Link } from "wouter";
import { format, isValid } from "date-fns";
import type { Tender, InsertTender, Municipality, Vendor } from "@shared/schema";

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
    </div>
  );
}
