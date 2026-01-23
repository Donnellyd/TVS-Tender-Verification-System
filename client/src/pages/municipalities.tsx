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
import { Plus, Search, Filter, X, Building2, Trash2, MapPin, Mail, Phone } from "lucide-react";
import type { Municipality, InsertMunicipality } from "@shared/schema";

const provinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

const municipalityStatuses = ["active", "suspended"];

export default function Municipalities() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMunicipality, setEditingMunicipality] = useState<Municipality | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [municipalityToDelete, setMunicipalityToDelete] = useState<Municipality | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState<string>("");

  const [formData, setFormData] = useState<Partial<InsertMunicipality>>({
    name: "",
    code: "",
    province: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    status: "active",
  });

  const { data: municipalities, isLoading } = useQuery<Municipality[]>({
    queryKey: ["/api/municipalities"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertMunicipality) => apiRequest("POST", "/api/municipalities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/municipalities"] });
      toast({ title: "Success", description: "Municipality created successfully" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      const message = error.message || "Failed to create municipality";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertMunicipality> }) =>
      apiRequest("PUT", `/api/municipalities/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/municipalities"] });
      toast({ title: "Success", description: "Municipality updated successfully" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      const message = error.message || "Failed to update municipality";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/municipalities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/municipalities"] });
      toast({ title: "Success", description: "Municipality deleted successfully" });
      setDeleteDialogOpen(false);
      setMunicipalityToDelete(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete municipality", variant: "destructive" });
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMunicipality(null);
    setFormData({
      name: "",
      code: "",
      province: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      status: "active",
    });
  };

  const handleAddNew = () => {
    setEditingMunicipality(null);
    setFormData({
      name: "",
      code: "",
      province: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      status: "active",
    });
    setDialogOpen(true);
  };

  const handleEdit = (municipality: Municipality) => {
    setEditingMunicipality(municipality);
    setFormData({
      name: municipality.name,
      code: municipality.code,
      province: municipality.province,
      contactEmail: municipality.contactEmail || "",
      contactPhone: municipality.contactPhone || "",
      address: municipality.address || "",
      status: municipality.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.code || !formData.province) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (editingMunicipality) {
      updateMutation.mutate({ id: editingMunicipality.id, data: formData });
    } else {
      createMutation.mutate(formData as InsertMunicipality);
    }
  };

  const filteredMunicipalities = municipalities?.filter((m) => {
    const matchesSearch =
      !searchTerm ||
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvince = !provinceFilter || m.province === provinceFilter;
    return matchesSearch && matchesProvince;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setProvinceFilter("");
  };

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <PageHeader
        title="Municipality Management"
        description="Manage municipalities and their configurations"
        action={{
          label: "Add Municipality",
          icon: <Plus className="h-4 w-4 mr-2" />,
          onClick: handleAddNew,
          testId: "button-add-municipality",
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
                  placeholder="Search by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-municipalities"
                />
              </div>
            </div>
            <div className="w-[180px]">
              <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                <SelectTrigger data-testid="select-province">
                  <SelectValue placeholder="Filter by province" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(searchTerm || provinceFilter) && (
              <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Municipalities Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <DataTableSkeleton columns={6} rows={5} />
          ) : !filteredMunicipalities || filteredMunicipalities.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No municipalities found"
              description={searchTerm || provinceFilter ? "Try adjusting your filters" : "Add your first municipality"}
              actionLabel={!searchTerm && !provinceFilter ? "Add Municipality" : undefined}
              onAction={handleAddNew}
              testId="empty-municipalities"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMunicipalities.map((municipality) => (
                  <TableRow key={municipality.id} data-testid={`row-municipality-${municipality.id}`}>
                    <TableCell>
                      <button
                        onClick={() => handleEdit(municipality)}
                        className="hover:opacity-80 transition-opacity"
                        data-testid={`button-edit-municipality-${municipality.id}`}
                        aria-label="Edit municipality"
                      >
                        <FilledPencilIcon />
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {municipality.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{municipality.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {municipality.province}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {municipality.contactEmail && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {municipality.contactEmail}
                          </div>
                        )}
                        {municipality.contactPhone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {municipality.contactPhone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={municipality.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setMunicipalityToDelete(municipality);
                          setDeleteDialogOpen(true);
                        }}
                        data-testid={`button-delete-municipality-${municipality.id}`}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMunicipality ? "Edit Municipality" : "Add New Municipality"}</DialogTitle>
            <DialogDescription>
              {editingMunicipality ? "Update municipality details" : "Enter the municipality information"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="input-municipality-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., CPT, JHB"
                  data-testid="input-municipality-code"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province">Province *</Label>
                <Select
                  value={formData.province}
                  onValueChange={(value) => setFormData({ ...formData, province: value })}
                >
                  <SelectTrigger data-testid="select-province-form">
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || "active"}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-status-form">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {municipalityStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  data-testid="input-contact-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  data-testid="input-contact-phone"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                data-testid="input-address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-municipality"
            >
              {editingMunicipality ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Municipality</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{municipalityToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => municipalityToDelete && deleteMutation.mutate(municipalityToDelete.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-municipality"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
