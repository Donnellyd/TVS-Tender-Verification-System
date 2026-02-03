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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { DataTableSkeleton } from "@/components/DataTableSkeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Filter, X, ClipboardCheck, CheckCircle, XCircle, AlertTriangle, Play } from "lucide-react";
import { format } from "date-fns";
import type { ComplianceCheck, InsertComplianceCheck, Vendor, Tender, ComplianceRule } from "@shared/schema";

const checkTypes = ["CSD Verification", "VAT Status", "Tax Clearance", "BBBEE Level", "Debarment Status", "Document Validity", "Company Registration"];
const resultOptions = ["passed", "failed", "pending", "flagged"];

export default function Compliance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("checks");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [resultFilter, setResultFilter] = useState<string>("");

  const [formData, setFormData] = useState<Partial<InsertComplianceCheck>>({
    checkType: "CSD Verification",
    result: "pending",
    notes: "",
  });

  const { data: complianceChecks, isLoading } = useQuery<ComplianceCheck[]>({
    queryKey: ["/api/compliance-checks"],
  });

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: tenders } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });

  const { data: rules } = useQuery<ComplianceRule[]>({
    queryKey: ["/api/compliance-rules"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertComplianceCheck) => apiRequest("POST", "/api/compliance-checks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance-checks"] });
      toast({ title: "Success", description: "Compliance check recorded" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to record compliance check", variant: "destructive" });
    },
  });

  const runCheckMutation = useMutation({
    mutationFn: (data: { vendorId?: string; tenderId?: string }) =>
      apiRequest("POST", "/api/compliance-checks/run", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance-checks"] });
      toast({ title: "Success", description: "Compliance checks completed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to run compliance checks", variant: "destructive" });
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      checkType: "CSD Verification",
      result: "pending",
      notes: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.checkType || !formData.result) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData as InsertComplianceCheck);
  };

  const filteredChecks = complianceChecks?.filter((check) => {
    const matchesSearch =
      !searchTerm ||
      check.checkType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResult = !resultFilter || check.result === resultFilter;
    return matchesSearch && matchesResult;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setResultFilter("");
  };

  const getVendorName = (vendorId: string | null | undefined) => {
    if (!vendorId) return "-";
    const vendor = vendors?.find((v) => v.id === vendorId);
    return vendor?.companyName || "-";
  };

  const getTenderNumber = (tenderId: string | null | undefined) => {
    if (!tenderId) return "-";
    const tender = tenders?.find((t) => t.id === tenderId);
    return tender?.tenderNumber || "-";
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "flagged":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <ClipboardCheck className="h-4 w-4 text-blue-600" />;
    }
  };

  // Stats calculation
  const stats = {
    total: complianceChecks?.length || 0,
    passed: complianceChecks?.filter((c) => c.result === "passed").length || 0,
    failed: complianceChecks?.filter((c) => c.result === "failed").length || 0,
    pending: complianceChecks?.filter((c) => c.result === "pending").length || 0,
  };

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <PageHeader
        title="Compliance Management"
        description="Manage compliance checks and verification results"
        moduleId="compliance"
        action={{
          label: "New Check",
          icon: <Plus className="h-4 w-4 mr-2" />,
          onClick: () => setDialogOpen(true),
          testId: "button-add-check",
        }}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Checks</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 p-3 rounded-lg">
                <ClipboardCheck className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
              </div>
              <div className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <div className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-lg">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <div className="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 p-3 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="checks" data-testid="tab-checks">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Compliance Checks
          </TabsTrigger>
          <TabsTrigger value="rules" data-testid="tab-rules">
            <CheckCircle className="h-4 w-4 mr-2" />
            Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checks" className="space-y-6">
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
                      placeholder="Search by check type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-checks"
                    />
                  </div>
                </div>
                <div className="w-[150px]">
                  <Select value={resultFilter} onValueChange={setResultFilter}>
                    <SelectTrigger data-testid="select-result">
                      <SelectValue placeholder="Result" />
                    </SelectTrigger>
                    <SelectContent>
                      {resultOptions.map((result) => (
                        <SelectItem key={result} value={result}>
                          {result.charAt(0).toUpperCase() + result.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(searchTerm || resultFilter) && (
                  <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters">
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Checks Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <DataTableSkeleton columns={6} rows={5} />
              ) : !filteredChecks || filteredChecks.length === 0 ? (
                <EmptyState
                  icon={ClipboardCheck}
                  title="No compliance checks found"
                  description={searchTerm || resultFilter ? "Try adjusting your filters" : "Record your first compliance check"}
                  actionLabel={!searchTerm && !resultFilter ? "New Check" : undefined}
                  onAction={() => setDialogOpen(true)}
                  testId="empty-checks"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Check Type</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Tender</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredChecks.map((check) => (
                      <TableRow key={check.id} data-testid={`row-check-${check.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getResultIcon(check.result)}
                            <span className="font-medium">{check.checkType}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getVendorName(check.vendorId)}</TableCell>
                        <TableCell className="font-mono text-sm">{getTenderNumber(check.tenderId)}</TableCell>
                        <TableCell>
                          {check.score !== null && check.score !== undefined ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    check.score >= 80 ? "bg-green-500" :
                                    check.score >= 60 ? "bg-yellow-500" :
                                    check.score >= 40 ? "bg-orange-500" :
                                    "bg-red-500"
                                  }`}
                                  style={{ width: `${check.score}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{check.score}%</span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={check.result} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {check.performedAt ? format(new Date(check.performedAt), "dd MMM yyyy HH:mm") : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardContent className="p-0">
              {!rules || rules.length === 0 ? (
                <EmptyState
                  icon={CheckCircle}
                  title="No compliance rules configured"
                  description="Configure compliance rules to automate verification"
                  testId="empty-rules"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Check Type</TableHead>
                      <TableHead>Threshold</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>{rule.category}</TableCell>
                        <TableCell>{rule.checkType}</TableCell>
                        <TableCell>{rule.threshold || "-"}</TableCell>
                        <TableCell>{rule.weight || 1}</TableCell>
                        <TableCell>
                          <StatusBadge status={rule.isActive ? "active" : "suspended"} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Check Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Compliance Check</DialogTitle>
            <DialogDescription>Enter the compliance check details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="checkType">Check Type *</Label>
              <Select
                value={formData.checkType}
                onValueChange={(value) => setFormData({ ...formData, checkType: value })}
              >
                <SelectTrigger data-testid="select-check-type">
                  <SelectValue placeholder="Select check type" />
                </SelectTrigger>
                <SelectContent>
                  {checkTypes.map((type) => (
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
                  <SelectTrigger data-testid="select-vendor-check">
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
                  <SelectTrigger data-testid="select-tender-check">
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
                <Label htmlFor="result">Result *</Label>
                <Select
                  value={formData.result}
                  onValueChange={(value) => setFormData({ ...formData, result: value })}
                >
                  <SelectTrigger data-testid="select-result-form">
                    <SelectValue placeholder="Select result" />
                  </SelectTrigger>
                  <SelectContent>
                    {resultOptions.map((result) => (
                      <SelectItem key={result} value={result}>
                        {result.charAt(0).toUpperCase() + result.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="score">Score (%)</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.score || ""}
                  onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || undefined })}
                  data-testid="input-score"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                data-testid="input-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              data-testid="button-save-check"
            >
              Record Check
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
