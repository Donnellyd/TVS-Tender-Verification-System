import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { DataTableSkeleton } from "@/components/DataTableSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit, FileText, AlertTriangle, Shield, Bell, Search, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Vendor {
  id: string;
  companyName: string;
}

interface VaultDocument {
  id: string;
  vendorId: string;
  documentName: string;
  documentType: string;
  documentNumber: string;
  expiryDate: string;
  issueDate?: string;
  status: string;
  notes?: string;
  lastUsed?: string;
  verificationStatus?: string;
}

interface ExpiryAlert {
  id: string;
  documentId: string;
  documentName?: string;
  vendorId: string;
  vendorName?: string;
  alertType: string;
  channel: string;
  sentAt: string;
  acknowledged: boolean;
}

const DOC_TYPES = [
  "Tax Clearance",
  "Company Registration",
  "BBBEE Certificate",
  "COIDA Certificate",
  "Public Liability Insurance",
  "Municipal Rates Clearance",
  "Audited Financials",
  "Other",
];

const VERIFICATION_STATUSES = ["pending", "verified", "expired", "rejected"];

function getStatusBadge(status: string) {
  switch (status) {
    case "verified":
      return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-300" data-testid={`badge-status-${status}`}><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
    case "expired":
      return <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-300" data-testid={`badge-status-${status}`}><AlertTriangle className="h-3 w-3 mr-1" />Expired</Badge>;
    case "rejected":
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-300" data-testid={`badge-status-${status}`}><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    default:
      return <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-300" data-testid={`badge-status-${status}`}><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  }
}

function getAlertTypeBadge(type: string) {
  switch (type) {
    case "expiring_soon":
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-300" data-testid={`badge-alert-${type}`}><AlertTriangle className="h-3 w-3 mr-1" />Expiring Soon</Badge>;
    case "expired":
      return <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-300" data-testid={`badge-alert-${type}`}><XCircle className="h-3 w-3 mr-1" />Expired</Badge>;
    default:
      return <Badge variant="outline" data-testid={`badge-alert-${type}`}>{type}</Badge>;
  }
}

export default function VendorVault() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("vaults");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<VaultDocument | null>(null);
  const [docForm, setDocForm] = useState({
    documentName: "",
    documentType: "",
    documentNumber: "",
    expiryDate: "",
    issueDate: "",
    notes: "",
    verificationStatus: "pending",
  });
  const [alertTypeFilter, setAlertTypeFilter] = useState("all");
  const [acknowledgedFilter, setAcknowledgedFilter] = useState("all");

  const { data: vendors } = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });

  const { data: vaultDocuments, isLoading: vaultLoading } = useQuery<VaultDocument[]>({
    queryKey: ["/api/vendors", selectedVendorId, "vault"],
    enabled: !!selectedVendorId,
  });

  const { data: expiryAlerts, isLoading: alertsLoading } = useQuery<ExpiryAlert[]>({
    queryKey: ["/api/expiry-alerts"],
  });

  const createDocMutation = useMutation({
    mutationFn: (data: typeof docForm) =>
      apiRequest("POST", `/api/vendors/${selectedVendorId}/vault`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/vendors", selectedVendorId, "vault"] });
      toast({ title: "Success", description: "Document added to vault" });
      closeDocDialog();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to add document", variant: "destructive" });
    },
  });

  const updateDocMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof docForm }) =>
      apiRequest("PUT", `/api/vault-documents/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/vendors", selectedVendorId, "vault"] });
      toast({ title: "Success", description: "Document updated" });
      closeDocDialog();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to update document", variant: "destructive" });
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/vault-documents/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/vendors", selectedVendorId, "vault"] });
      toast({ title: "Success", description: "Document deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to delete document", variant: "destructive" });
    },
  });

  const checkExpiringMutation = useMutation({
    mutationFn: () => apiRequest("GET", "/api/vault-documents/expiring/30"),
    onSuccess: async (res) => {
      const data = await res.json();
      const count = Array.isArray(data) ? data.length : 0;
      toast({ title: "Expiry Check Complete", description: `Found ${count} document(s) expiring within 30 days` });
      qc.invalidateQueries({ queryKey: ["/api/expiry-alerts"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to check expiring documents", variant: "destructive" });
    },
  });

  function closeDocDialog() {
    setDocDialogOpen(false);
    setEditingDoc(null);
    setDocForm({ documentName: "", documentType: "", documentNumber: "", expiryDate: "", issueDate: "", notes: "", verificationStatus: "pending" });
  }

  function openEditDoc(doc: VaultDocument) {
    setEditingDoc(doc);
    setDocForm({
      documentName: doc.documentName || "",
      documentType: doc.documentType || "",
      documentNumber: doc.documentNumber || "",
      expiryDate: doc.expiryDate ? doc.expiryDate.split("T")[0] : "",
      issueDate: doc.issueDate ? doc.issueDate.split("T")[0] : "",
      notes: doc.notes || "",
      verificationStatus: doc.verificationStatus || doc.status || "pending",
    });
    setDocDialogOpen(true);
  }

  function handleDocSubmit() {
    if (!docForm.documentName.trim() || !docForm.documentType) {
      toast({ title: "Validation Error", description: "Document name and type are required", variant: "destructive" });
      return;
    }
    if (editingDoc) {
      updateDocMutation.mutate({ id: editingDoc.id, data: docForm });
    } else {
      createDocMutation.mutate(docForm);
    }
  }

  const filteredAlerts = (expiryAlerts || []).filter((a) => {
    if (alertTypeFilter !== "all" && a.alertType !== alertTypeFilter) return false;
    if (acknowledgedFilter === "yes" && !a.acknowledged) return false;
    if (acknowledgedFilter === "no" && a.acknowledged) return false;
    return true;
  });

  const vendorMap = new Map((vendors || []).map((v) => [v.id, v.companyName]));

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Document Vault & Expiry Alerts" description="Manage vendor document vaults and track document expiry alerts" />
      <div className="flex-1 p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList data-testid="tabs-vendor-vault">
            <TabsTrigger value="vaults" data-testid="tab-document-vaults"><Shield className="h-4 w-4 mr-2" />Document Vaults</TabsTrigger>
            <TabsTrigger value="alerts" data-testid="tab-expiry-alerts"><Bell className="h-4 w-4 mr-2" />Expiry Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="vaults" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
                <CardTitle className="text-lg">Vault Documents</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-64">
                    <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                      <SelectTrigger data-testid="select-vendor-trigger">
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {(vendors || []).map((v) => (
                          <SelectItem key={v.id} value={v.id} data-testid={`select-vendor-option-${v.id}`}>{v.companyName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedVendorId && (
                    <Button onClick={() => setDocDialogOpen(true)} data-testid="button-add-document">
                      <Plus className="h-4 w-4 mr-2" />Add Document
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedVendorId ? (
                  <EmptyState icon={Shield} title="Select a Vendor" description="Choose a vendor from the dropdown above to view their document vault" testId="empty-state-no-vendor" />
                ) : vaultLoading ? (
                  <DataTableSkeleton columns={7} rows={5} />
                ) : !vaultDocuments || vaultDocuments.length === 0 ? (
                  <EmptyState icon={FileText} title="No Documents" description="No documents found in this vendor's vault. Add one to get started." actionLabel="Add Document" onAction={() => setDocDialogOpen(true)} testId="empty-state-no-documents" />
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Document #</TableHead>
                          <TableHead>Expiry Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Used</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vaultDocuments.map((doc) => (
                          <TableRow key={doc.id} data-testid={`row-vault-doc-${doc.id}`}>
                            <TableCell data-testid={`text-doc-name-${doc.id}`}>{doc.documentName}</TableCell>
                            <TableCell data-testid={`text-doc-type-${doc.id}`}>{doc.documentType}</TableCell>
                            <TableCell data-testid={`text-doc-number-${doc.id}`}>{doc.documentNumber || "-"}</TableCell>
                            <TableCell data-testid={`text-doc-expiry-${doc.id}`}>
                              {doc.expiryDate ? format(new Date(doc.expiryDate), "dd MMM yyyy") : "-"}
                            </TableCell>
                            <TableCell data-testid={`text-doc-status-${doc.id}`}>{getStatusBadge(doc.status)}</TableCell>
                            <TableCell data-testid={`text-doc-last-used-${doc.id}`}>
                              {doc.lastUsed ? format(new Date(doc.lastUsed), "dd MMM yyyy") : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 flex-wrap">
                                <Button variant="ghost" size="icon" onClick={() => openEditDoc(doc)} data-testid={`button-edit-doc-${doc.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteDocMutation.mutate(doc.id)} data-testid={`button-delete-doc-${doc.id}`}>
                                  <Trash2 className="h-4 w-4" />
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

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
                <CardTitle className="text-lg">Expiry Alerts</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={alertTypeFilter} onValueChange={setAlertTypeFilter}>
                    <SelectTrigger className="w-40" data-testid="select-alert-type-filter">
                      <SelectValue placeholder="Alert Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={acknowledgedFilter} onValueChange={setAcknowledgedFilter}>
                    <SelectTrigger className="w-40" data-testid="select-acknowledged-filter">
                      <SelectValue placeholder="Acknowledged" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="yes">Acknowledged</SelectItem>
                      <SelectItem value="no">Not Acknowledged</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => checkExpiringMutation.mutate()} disabled={checkExpiringMutation.isPending} data-testid="button-check-expiring">
                    <Search className="h-4 w-4 mr-2" />Check Expiring
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {alertsLoading ? (
                  <DataTableSkeleton columns={6} rows={5} />
                ) : filteredAlerts.length === 0 ? (
                  <EmptyState icon={Bell} title="No Expiry Alerts" description="No expiry alerts found. Use the check button to scan for expiring documents." testId="empty-state-no-alerts" />
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Alert Type</TableHead>
                          <TableHead>Channel</TableHead>
                          <TableHead>Sent At</TableHead>
                          <TableHead>Acknowledged</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAlerts.map((alert) => (
                          <TableRow key={alert.id} data-testid={`row-alert-${alert.id}`}>
                            <TableCell data-testid={`text-alert-doc-${alert.id}`}>{alert.documentName || alert.documentId}</TableCell>
                            <TableCell data-testid={`text-alert-vendor-${alert.id}`}>{alert.vendorName || vendorMap.get(alert.vendorId) || alert.vendorId}</TableCell>
                            <TableCell data-testid={`text-alert-type-${alert.id}`}>{getAlertTypeBadge(alert.alertType)}</TableCell>
                            <TableCell data-testid={`text-alert-channel-${alert.id}`}>{alert.channel}</TableCell>
                            <TableCell data-testid={`text-alert-sent-${alert.id}`}>
                              {alert.sentAt ? format(new Date(alert.sentAt), "dd MMM yyyy HH:mm") : "-"}
                            </TableCell>
                            <TableCell data-testid={`text-alert-ack-${alert.id}`}>
                              {alert.acknowledged ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-300"><CheckCircle className="h-3 w-3 mr-1" />Yes</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-300"><Clock className="h-3 w-3 mr-1" />No</Badge>
                              )}
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
        </Tabs>
      </div>

      <Dialog open={docDialogOpen} onOpenChange={(open) => { if (!open) closeDocDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDoc ? "Edit Document" : "Add Document"}</DialogTitle>
            <DialogDescription>{editingDoc ? "Update vault document details" : "Add a new document to the vendor's vault"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doc-name">Document Name</Label>
              <Input id="doc-name" value={docForm.documentName} onChange={(e) => setDocForm((f) => ({ ...f, documentName: e.target.value }))} placeholder="Enter document name" data-testid="input-doc-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-type">Document Type</Label>
              <Select value={docForm.documentType} onValueChange={(v) => setDocForm((f) => ({ ...f, documentType: v }))}>
                <SelectTrigger data-testid="select-doc-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-number">Document Number</Label>
              <Input id="doc-number" value={docForm.documentNumber} onChange={(e) => setDocForm((f) => ({ ...f, documentNumber: e.target.value }))} placeholder="Enter document number" data-testid="input-doc-number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doc-expiry">Expiry Date</Label>
                <Input id="doc-expiry" type="date" value={docForm.expiryDate} onChange={(e) => setDocForm((f) => ({ ...f, expiryDate: e.target.value }))} data-testid="input-doc-expiry" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-issue">Issue Date</Label>
                <Input id="doc-issue" type="date" value={docForm.issueDate} onChange={(e) => setDocForm((f) => ({ ...f, issueDate: e.target.value }))} data-testid="input-doc-issue" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-status">Verification Status</Label>
              <Select value={docForm.verificationStatus} onValueChange={(v) => setDocForm((f) => ({ ...f, verificationStatus: v }))}>
                <SelectTrigger data-testid="select-doc-verification"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {VERIFICATION_STATUSES.map((s) => (<SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-notes">Notes</Label>
              <Textarea id="doc-notes" value={docForm.notes} onChange={(e) => setDocForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" data-testid="input-doc-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDocDialog} data-testid="button-cancel-doc">Cancel</Button>
            <Button onClick={handleDocSubmit} disabled={createDocMutation.isPending || updateDocMutation.isPending} data-testid="button-save-doc">
              {editingDoc ? "Update" : "Add"} Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
