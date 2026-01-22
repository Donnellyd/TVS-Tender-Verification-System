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
import { Plus, Search, Filter, X, Users, Trash2 } from "lucide-react";
import type { Vendor, InsertVendor, Municipality } from "@shared/schema";

const vendorStatuses = ["pending", "approved", "suspended", "debarred"];
const bbbeeeLevels = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6", "Level 7", "Level 8", "Non-Compliant"];

export default function Vendors() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [formData, setFormData] = useState<Partial<InsertVendor>>({
    companyName: "",
    tradingName: "",
    registrationNumber: "",
    vatNumber: "",
    csdId: "",
    bbbeeLevel: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    physicalAddress: "",
    status: "pending",
  });

  const { data: vendors, isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: municipalities } = useQuery<Municipality[]>({
    queryKey: ["/api/municipalities"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertVendor) => apiRequest("POST", "/api/vendors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Success", description: "Vendor created successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create vendor", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertVendor> }) =>
      apiRequest("PUT", `/api/vendors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Success", description: "Vendor updated successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update vendor", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/vendors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Success", description: "Vendor deleted successfully" });
      setDeleteDialogOpen(false);
      setVendorToDelete(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete vendor", variant: "destructive" });
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingVendor(null);
    setFormData({
      companyName: "",
      tradingName: "",
      registrationNumber: "",
      vatNumber: "",
      csdId: "",
      bbbeeLevel: "",
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
      physicalAddress: "",
      status: "pending",
    });
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      companyName: vendor.companyName,
      tradingName: vendor.tradingName || "",
      registrationNumber: vendor.registrationNumber,
      vatNumber: vendor.vatNumber || "",
      csdId: vendor.csdId || "",
      bbbeeLevel: vendor.bbbeeLevel || "",
      contactPerson: vendor.contactPerson,
      contactEmail: vendor.contactEmail,
      contactPhone: vendor.contactPhone,
      physicalAddress: vendor.physicalAddress || "",
      status: vendor.status,
      municipalityId: vendor.municipalityId || undefined,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.companyName || !formData.registrationNumber || !formData.contactPerson || !formData.contactEmail || !formData.contactPhone) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (editingVendor) {
      updateMutation.mutate({ id: editingVendor.id, data: formData });
    } else {
      createMutation.mutate(formData as InsertVendor);
    }
  };

  const filteredVendors = vendors?.filter((vendor) => {
    const matchesSearch =
      !searchTerm ||
      vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.csdId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || vendor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
  };

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <PageHeader
        title="Vendor Management"
        description="Register and manage vendors for tender submissions"
        action={{
          label: "Add Vendor",
          icon: <Plus className="h-4 w-4 mr-2" />,
          onClick: () => setDialogOpen(true),
          testId: "button-add-vendor",
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
                  placeholder="Search by company name, registration, or CSD ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-vendors"
                />
              </div>
            </div>
            <div className="w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-vendor-status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {vendorStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(searchTerm || statusFilter) && (
              <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <DataTableSkeleton columns={7} rows={5} />
          ) : !filteredVendors || filteredVendors.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No vendors found"
              description={searchTerm || statusFilter ? "Try adjusting your filters" : "Add your first vendor to get started"}
              actionLabel={!searchTerm && !statusFilter ? "Add Vendor" : undefined}
              onAction={() => setDialogOpen(true)}
              testId="empty-vendors"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Registration No.</TableHead>
                  <TableHead>CSD ID</TableHead>
                  <TableHead>BBBEE Level</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id} data-testid={`row-vendor-${vendor.id}`}>
                    <TableCell>
                      <button
                        onClick={() => handleEdit(vendor)}
                        className="hover:opacity-80 transition-opacity"
                        data-testid={`button-edit-vendor-${vendor.id}`}
                        aria-label="Edit vendor"
                      >
                        <FilledPencilIcon />
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <p>{vendor.companyName}</p>
                        {vendor.tradingName && (
                          <p className="text-xs text-muted-foreground">t/a {vendor.tradingName}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{vendor.registrationNumber}</TableCell>
                    <TableCell className="font-mono text-sm">{vendor.csdId || "-"}</TableCell>
                    <TableCell>{vendor.bbbeeLevel || "-"}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{vendor.contactPerson}</p>
                        <p className="text-xs text-muted-foreground">{vendor.contactEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={vendor.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setVendorToDelete(vendor);
                          setDeleteDialogOpen(true);
                        }}
                        data-testid={`button-delete-vendor-${vendor.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
            <DialogTitle>{editingVendor ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
            <DialogDescription>
              {editingVendor ? "Update vendor information" : "Enter the vendor's details"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1 py-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    data-testid="input-company-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tradingName">Trading Name</Label>
                  <Input
                    id="tradingName"
                    value={formData.tradingName}
                    onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                    data-testid="input-trading-name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number *</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder="e.g., 2021/123456/07"
                    data-testid="input-registration-number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">VAT Number</Label>
                  <Input
                    id="vatNumber"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                    data-testid="input-vat-number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="csdId">CSD ID</Label>
                  <Input
                    id="csdId"
                    value={formData.csdId}
                    onChange={(e) => setFormData({ ...formData, csdId: e.target.value })}
                    placeholder="Central Supplier Database ID"
                    data-testid="input-csd-id"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bbbeeLevel">BBBEE Level</Label>
                  <Select
                    value={formData.bbbeeLevel || ""}
                    onValueChange={(value) => setFormData({ ...formData, bbbeeLevel: value })}
                  >
                    <SelectTrigger data-testid="select-bbbee-level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {bbbeeeLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    data-testid="input-contact-person"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    data-testid="input-contact-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone *</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    data-testid="input-contact-phone"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="physicalAddress">Physical Address</Label>
                <Input
                  id="physicalAddress"
                  value={formData.physicalAddress}
                  onChange={(e) => setFormData({ ...formData, physicalAddress: e.target.value })}
                  data-testid="input-physical-address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || "pending"}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="municipality">Municipality</Label>
                  <Select
                    value={formData.municipalityId || ""}
                    onValueChange={(value) => setFormData({ ...formData, municipalityId: value || undefined })}
                  >
                    <SelectTrigger data-testid="select-municipality">
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
              data-testid="button-save-vendor"
            >
              {editingVendor ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vendor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{vendorToDelete?.companyName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => vendorToDelete && deleteMutation.mutate(vendorToDelete.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
