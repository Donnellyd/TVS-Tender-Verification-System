import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { EmptyState } from "@/components/EmptyState";
import { DataTableSkeleton } from "@/components/DataTableSkeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  MessageCircle, 
  Edit, 
  Trash2, 
  Eye, 
  Copy,
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  Send,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import type { WhatsappTemplate, InsertWhatsappTemplate, Vendor } from "@shared/schema";

const triggerLabels: Record<string, string> = {
  tender_published: "Tender Published",
  tender_closing_soon: "Closing Soon Reminder",
  tender_closed: "Tender Closed",
  under_evaluation: "Under Evaluation",
  clarification_requested: "Clarification Requested",
  shortlisted: "Shortlisted",
  standstill_period: "Standstill Period",
  awarded: "Tender Awarded",
  unsuccessful: "Unsuccessful Bid",
  tender_cancelled: "Tender Cancelled",
  submission_received: "Submission Received",
  document_verified: "Document Verified",
  document_rejected: "Document Rejected",
};

const triggerIcons: Record<string, { icon: typeof Bell; color: string }> = {
  tender_published: { icon: Bell, color: "text-blue-500" },
  tender_closing_soon: { icon: Clock, color: "text-orange-500" },
  tender_closed: { icon: XCircle, color: "text-gray-500" },
  under_evaluation: { icon: FileText, color: "text-purple-500" },
  clarification_requested: { icon: AlertTriangle, color: "text-yellow-500" },
  shortlisted: { icon: CheckCircle, color: "text-green-500" },
  standstill_period: { icon: Clock, color: "text-blue-500" },
  awarded: { icon: CheckCircle, color: "text-green-600" },
  unsuccessful: { icon: XCircle, color: "text-red-500" },
  tender_cancelled: { icon: XCircle, color: "text-red-600" },
  submission_received: { icon: CheckCircle, color: "text-blue-500" },
  document_verified: { icon: CheckCircle, color: "text-green-500" },
  document_rejected: { icon: XCircle, color: "text-red-500" },
};

const placeholders = [
  { key: "[VendorName]", desc: "Company name" },
  { key: "[TenderNo]", desc: "Tender reference" },
  { key: "[TenderTitle]", desc: "Tender title" },
  { key: "[ClosingDate]", desc: "Closing date" },
  { key: "[Amount]", desc: "Bid amount" },
  { key: "[Status]", desc: "Tender status" },
  { key: "[Municipality]", desc: "Municipality name" },
  { key: "[ContactPerson]", desc: "Contact person" },
];

export default function WhatsappTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsappTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<WhatsappTemplate | null>(null);
  const [sendTemplate, setSendTemplate] = useState<WhatsappTemplate | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState<Partial<InsertWhatsappTemplate>>({
    name: "",
    trigger: "tender_published",
    body: "",
    isActive: true,
  });

  const { data: templates, isLoading } = useQuery<WhatsappTemplate[]>({
    queryKey: ["/api/whatsapp-templates"],
  });

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const sendMutation = useMutation({
    mutationFn: async ({ trigger, vendorId }: { trigger: string; vendorId: string }) => {
      return apiRequest("POST", "/api/notifications/whatsapp/send", {
        trigger,
        vendorId,
        context: {}
      });
    },
    onSuccess: (data: any) => {
      if (data.success) {
        toast({ title: "WhatsApp message sent successfully" });
      } else {
        toast({ title: "Failed to send", description: data.error || "Unknown error", variant: "destructive" });
      }
      setSendDialogOpen(false);
      setSendTemplate(null);
      setSelectedVendorId("");
    },
    onError: () => {
      toast({ title: "Failed to send WhatsApp message", variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertWhatsappTemplate) => {
      return apiRequest("POST", "/api/whatsapp-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-templates"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Template created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create template", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertWhatsappTemplate> }) => {
      return apiRequest("PUT", `/api/whatsapp-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-templates"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Template updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update template", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/whatsapp-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-templates"] });
      toast({ title: "Template deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete template", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      trigger: "tender_published",
      body: "",
      isActive: true,
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: WhatsappTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      trigger: template.trigger as any,
      body: template.body,
      isActive: template.isActive,
    });
    setDialogOpen(true);
  };

  const handleCopy = (template: WhatsappTemplate) => {
    setFormData({
      name: `${template.name} (Copy)`,
      trigger: template.trigger as any,
      body: template.body,
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.trigger || !formData.body) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData as InsertWhatsappTemplate });
    } else {
      createMutation.mutate(formData as InsertWhatsappTemplate);
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    setFormData((prev) => ({
      ...prev,
      body: (prev.body || "") + placeholder,
    }));
  };

  const filteredTemplates = templates?.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.trigger.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="WhatsApp Templates"
        description="Manage WhatsApp notification templates for tender status updates"
        action={{
          label: "Add Template",
          icon: <Plus className="h-4 w-4 mr-2" />,
          onClick: () => {
            resetForm();
            setDialogOpen(true);
          },
        }}
      />

      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                  WhatsApp Notification Templates
                </CardTitle>
                <CardDescription>
                  Templates sent to vendors when tender status changes
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-templates"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <DataTableSkeleton columns={5} rows={5} />
            ) : !filteredTemplates?.length ? (
              <EmptyState
                icon={MessageCircle}
                title="No WhatsApp templates"
                description="Create your first WhatsApp notification template to start sending status updates to vendors."
                actionLabel="Add Template"
                onAction={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Trigger Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => {
                    const triggerInfo = triggerIcons[template.trigger] || { icon: Bell, color: "text-gray-500" };
                    const TriggerIcon = triggerInfo.icon;
                    return (
                      <TableRow key={template.id} data-testid={`row-template-${template.id}`}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TriggerIcon className={`h-4 w-4 ${triggerInfo.color}`} />
                            <span>{triggerLabels[template.trigger] || template.trigger}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {template.updatedAt ? format(new Date(template.updatedAt), "PP") : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSendTemplate(template);
                                setSendDialogOpen(true);
                              }}
                              title="Send Test Message"
                              data-testid={`button-send-${template.id}`}
                            >
                              <Send className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setPreviewTemplate(template);
                                setPreviewOpen(true);
                              }}
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
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(template.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Available Placeholders</CardTitle>
            <CardDescription>Use these placeholders in your templates - they will be replaced with actual values</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {placeholders.map((p) => (
                <Badge key={p.key} variant="outline" className="font-mono">
                  {p.key} - {p.desc}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setDialogOpen(open);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit WhatsApp Template" : "Add WhatsApp Template"}
            </DialogTitle>
            <DialogDescription>
              Create a WhatsApp message template for tender notifications
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Tender Award Notification"
                  data-testid="input-template-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trigger">Trigger Event *</Label>
                <Select
                  value={formData.trigger}
                  onValueChange={(value) => setFormData({ ...formData, trigger: value as any })}
                >
                  <SelectTrigger data-testid="select-trigger">
                    <SelectValue placeholder="Select trigger event" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(triggerLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Message Body *</Label>
              <Textarea
                id="body"
                value={formData.body || ""}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Enter the WhatsApp message content..."
                className="min-h-[150px] font-mono text-sm"
                data-testid="input-template-body"
              />
              <div className="flex flex-wrap gap-1">
                {placeholders.slice(0, 5).map((p) => (
                  <Button
                    key={p.key}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertPlaceholder(p.key)}
                  >
                    {p.key}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Template is active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-template"
            >
              {editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              {previewTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Trigger: {triggerLabels[previewTemplate?.trigger || ""] || previewTemplate?.trigger}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  G-TVS
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-sm font-medium text-green-800 dark:text-green-200">
                    GLOBAL - Tender Vetting System
                  </div>
                  <div className="whitespace-pre-wrap text-sm bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                    {previewTemplate?.body}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(), "h:mm a")}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sendDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setSendTemplate(null);
          setSelectedVendorId("");
        }
        setSendDialogOpen(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-500" />
              Send WhatsApp Message
            </DialogTitle>
            <DialogDescription>
              Send a test message using the "{sendTemplate?.name}" template
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendor">Select Vendor</Label>
              <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                <SelectTrigger data-testid="select-send-vendor">
                  <SelectValue placeholder="Choose a vendor..." />
                </SelectTrigger>
                <SelectContent>
                  {vendors?.filter(v => v.whatsappPhone && v.whatsappOptIn).map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.companyName} ({vendor.whatsappPhone})
                    </SelectItem>
                  ))}
                  {vendors?.filter(v => v.whatsappPhone && v.whatsappOptIn).length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground">
                      No vendors with WhatsApp opt-in found
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only vendors with WhatsApp opt-in are shown
              </p>
            </div>

            {sendTemplate && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs font-medium mb-1">Message Preview:</p>
                <p className="text-sm whitespace-pre-wrap">{sendTemplate.body}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (sendTemplate && selectedVendorId) {
                  sendMutation.mutate({
                    trigger: sendTemplate.trigger,
                    vendorId: selectedVendorId
                  });
                }
              }}
              disabled={!selectedVendorId || sendMutation.isPending}
              data-testid="button-confirm-send"
            >
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
