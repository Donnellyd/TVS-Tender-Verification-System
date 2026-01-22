import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Search, Filter, X, FolderOpen, Trash2, FileCheck, Upload, Download, Eye } from "lucide-react";
import { format } from "date-fns";
import type { Document, InsertDocument, Vendor, Tender } from "@shared/schema";

const documentTypes = [
  "VAT Certificate",
  "Tax Clearance",
  "BBBEE Certificate",
  "Company Registration",
  "Health & Safety Certificate",
  "Professional Indemnity",
  "Bank Confirmation",
  "Other",
];

const verificationStatuses = ["pending", "verified", "rejected", "expired"];

export default function Documents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [formData, setFormData] = useState<Partial<InsertDocument>>({
    name: "",
    documentType: "VAT Certificate",
    verificationStatus: "pending",
    notes: "",
  });

  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: tenders } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertDocument) => apiRequest("POST", "/api/documents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "Success", description: "Document created successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create document", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertDocument> }) =>
      apiRequest("PUT", `/api/documents/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "Success", description: "Document updated successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update document", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "Success", description: "Document deleted successfully" });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete document", variant: "destructive" });
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDocument(null);
    setFormData({
      name: "",
      documentType: "VAT Certificate",
      verificationStatus: "pending",
      notes: "",
    });
  };

  const handleEdit = (doc: Document) => {
    setEditingDocument(doc);
    setFormData({
      name: doc.name,
      documentType: doc.documentType,
      verificationStatus: doc.verificationStatus || "pending",
      notes: doc.notes || "",
      vendorId: doc.vendorId || undefined,
      tenderId: doc.tenderId || undefined,
      expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : undefined,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.documentType) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (editingDocument) {
      updateMutation.mutate({ id: editingDocument.id, data: formData });
    } else {
      createMutation.mutate(formData as InsertDocument);
    }
  };

  const filteredDocuments = documents?.filter((doc) => {
    const matchesSearch =
      !searchTerm ||
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || doc.documentType === typeFilter;
    const matchesStatus = !statusFilter || doc.verificationStatus === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setStatusFilter("");
  };

  const getVendorName = (vendorId: string | null) => {
    if (!vendorId) return "-";
    const vendor = vendors?.find((v) => v.id === vendorId);
    return vendor?.companyName || "-";
  };

  const getTenderNumber = (tenderId: string | null) => {
    if (!tenderId) return "-";
    const tender = tenders?.find((t) => t.id === tenderId);
    return tender?.tenderNumber || "-";
  };

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <PageHeader
        title="Document Management"
        description="Manage vendor documents and certificates"
        action={{
          label: "Add Document",
          icon: <Plus className="h-4 w-4 mr-2" />,
          onClick: () => setDialogOpen(true),
          testId: "button-add-document",
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
                  placeholder="Search by document name or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-documents"
                />
              </div>
            </div>
            <div className="w-[180px]">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger data-testid="select-document-type">
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-document-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {verificationStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(searchTerm || typeFilter || statusFilter) && (
              <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <DataTableSkeleton columns={7} rows={5} />
          ) : !filteredDocuments || filteredDocuments.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No documents found"
              description={searchTerm || typeFilter || statusFilter ? "Try adjusting your filters" : "Add your first document to get started"}
              actionLabel={!searchTerm && !typeFilter && !statusFilter ? "Add Document" : undefined}
              onAction={() => setDialogOpen(true)}
              testId="empty-documents"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Tender</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id} data-testid={`row-document-${doc.id}`}>
                    <TableCell>
                      <button
                        onClick={() => handleEdit(doc)}
                        className="hover:opacity-80 transition-opacity"
                        data-testid={`button-edit-document-${doc.id}`}
                        aria-label="Edit document"
                      >
                        <FilledPencilIcon />
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                        <span>{doc.name}</span>
                        {doc.version && doc.version > 1 && (
                          <span className="text-xs text-muted-foreground">(v{doc.version})</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 rounded text-xs font-medium">
                        {doc.documentType}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{getVendorName(doc.vendorId)}</TableCell>
                    <TableCell className="text-sm font-mono">{getTenderNumber(doc.tenderId)}</TableCell>
                    <TableCell>
                      {doc.expiryDate ? (
                        <span className={`text-sm ${
                          new Date(doc.expiryDate) < new Date() ? "text-red-600 dark:text-red-400" : ""
                        }`}>
                          {format(new Date(doc.expiryDate), "dd MMM yyyy")}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={doc.verificationStatus || "pending"} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setDocumentToDelete(doc);
                            setDeleteDialogOpen(true);
                          }}
                          data-testid={`button-delete-document-${doc.id}`}
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
        <DialogContent className="max-w-lg flex flex-col max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{editingDocument ? "Edit Document" : "Add New Document"}</DialogTitle>
            <DialogDescription>
              {editingDocument ? "Update document details" : "Enter document information"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1 py-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Document Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="input-document-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type *</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                >
                  <SelectTrigger data-testid="select-document-type-form">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Select
                    value={formData.vendorId || ""}
                    onValueChange={(value) => setFormData({ ...formData, vendorId: value || undefined })}
                  >
                    <SelectTrigger data-testid="select-vendor">
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors?.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tender">Tender</Label>
                  <Select
                    value={formData.tenderId || ""}
                    onValueChange={(value) => setFormData({ ...formData, tenderId: value || undefined })}
                  >
                    <SelectTrigger data-testid="select-tender">
                      <SelectValue placeholder="Select tender" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenders?.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.tenderNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate ? format(new Date(formData.expiryDate), "yyyy-MM-dd") : ""}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value ? new Date(e.target.value) : undefined })}
                    data-testid="input-expiry-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Verification Status</Label>
                  <Select
                    value={formData.verificationStatus || "pending"}
                    onValueChange={(value) => setFormData({ ...formData, verificationStatus: value })}
                  >
                    <SelectTrigger data-testid="select-verification-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {verificationStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  data-testid="input-notes"
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
              data-testid="button-save-document"
            >
              {editingDocument ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{documentToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => documentToDelete && deleteMutation.mutate(documentToDelete.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-document"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
