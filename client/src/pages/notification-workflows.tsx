import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { StatsCard } from "@/components/StatsCard";
import { Zap, Send, Clock, AlertTriangle, Plus, Mail, MessageCircle, Trash2 } from "lucide-react";

interface Workflow {
  id: string;
  name: string;
  trigger: string;
  triggerDays: number;
  channels: string[];
  recipients: string[];
  active: boolean;
  lastTriggered: string | null;
}

const TRIGGER_LABELS: Record<string, string> = {
  document_expiry: "Document Expiry",
  bid_received: "Bid Received",
  tender_closing: "Tender Closing",
  award_decision: "Award Decision",
  compliance_failure: "Compliance Failure",
  new_clarification: "New Clarification",
};

const TRIGGER_DESCRIPTIONS: Record<string, (days: number) => string> = {
  document_expiry: (d) => `Document expires in ${d} days`,
  bid_received: () => "Bid received",
  tender_closing: (d) => `Tender closes in ${d} days`,
  award_decision: () => "Award decision made",
  compliance_failure: () => "Compliance check failed",
  new_clarification: () => "New clarification posted",
};

const DEFAULT_WORKFLOWS: Workflow[] = [
  { id: "1", name: "Document Expiry Alert", trigger: "document_expiry", triggerDays: 30, channels: ["email", "whatsapp"], recipients: ["vendor"], active: true, lastTriggered: null },
  { id: "2", name: "Bid Received Confirmation", trigger: "bid_received", triggerDays: 0, channels: ["email"], recipients: ["vendor"], active: true, lastTriggered: null },
  { id: "3", name: "Tender Closing Reminder", trigger: "tender_closing", triggerDays: 7, channels: ["email", "whatsapp"], recipients: ["vendor", "admin"], active: true, lastTriggered: null },
  { id: "4", name: "Award Decision Notification", trigger: "award_decision", triggerDays: 0, channels: ["email", "whatsapp"], recipients: ["vendor", "admin"], active: true, lastTriggered: null },
];

const HAS_DAYS_TRIGGERS = ["document_expiry", "tender_closing"];

export default function NotificationWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>(DEFAULT_WORKFLOWS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formTrigger, setFormTrigger] = useState("document_expiry");
  const [formDays, setFormDays] = useState(7);
  const [formChannels, setFormChannels] = useState<string[]>(["email"]);
  const [formRecipients, setFormRecipients] = useState<string[]>(["vendor"]);
  const [formAutoActivate, setFormAutoActivate] = useState(true);

  const activeCount = workflows.filter((w) => w.active).length;

  const toggleWorkflow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w))
    );
  };

  const deleteWorkflow = (id: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  };

  const toggleChannel = (channel: string) => {
    setFormChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const toggleRecipient = (recipient: string) => {
    setFormRecipients((prev) =>
      prev.includes(recipient) ? prev.filter((r) => r !== recipient) : [...prev, recipient]
    );
  };

  const resetForm = () => {
    setFormName("");
    setFormTrigger("document_expiry");
    setFormDays(7);
    setFormChannels(["email"]);
    setFormRecipients(["vendor"]);
    setFormAutoActivate(true);
  };

  const handleAddWorkflow = () => {
    if (!formName.trim()) return;
    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      name: formName.trim(),
      trigger: formTrigger,
      triggerDays: HAS_DAYS_TRIGGERS.includes(formTrigger) ? formDays : 0,
      channels: formChannels,
      recipients: formRecipients,
      active: formAutoActivate,
      lastTriggered: null,
    };
    setWorkflows((prev) => [...prev, newWorkflow]);
    setDialogOpen(false);
    resetForm();
  };

  const getTriggerDescription = (w: Workflow) => {
    const fn = TRIGGER_DESCRIPTIONS[w.trigger];
    return fn ? fn(w.triggerDays) : w.trigger;
  };

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <PageHeader
        title="Notification Workflows"
        description="Configure automated notification triggers and rules"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Active Workflows" value={activeCount} icon={Zap} />
        <StatsCard title="Sent Today" value={0} icon={Send} />
        <StatsCard title="Pending" value={0} icon={Clock} />
        <StatsCard title="Failed" value={0} icon={AlertTriangle} />
      </div>

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Configured Workflows</h2>
        <Button
          size="sm"
          onClick={() => { resetForm(); setDialogOpen(true); }}
          data-testid="button-add-workflow"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Workflow
        </Button>
      </div>

      <div className="space-y-3">
        {workflows.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Zap className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground" data-testid="text-no-workflows">
                No workflows configured
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Add a workflow to start automating notifications
              </p>
            </CardContent>
          </Card>
        )}

        {workflows.map((workflow) => (
          <Card key={workflow.id} data-testid={`workflow-card-${workflow.id}`}>
            <CardContent className="flex flex-wrap items-center gap-4 py-4 px-5">
              <div className="flex-1 min-w-[200px]">
                <p className="font-medium text-sm" data-testid={`workflow-name-${workflow.id}`}>
                  {workflow.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5" data-testid={`workflow-trigger-${workflow.id}`}>
                  {getTriggerDescription(workflow)}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {workflow.channels.includes("email") && (
                  <Badge variant="outline" data-testid={`workflow-channel-email-${workflow.id}`}>
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </Badge>
                )}
                {workflow.channels.includes("whatsapp") && (
                  <Badge variant="outline" data-testid={`workflow-channel-whatsapp-${workflow.id}`}>
                    <MessageCircle className="h-3 w-3 mr-1" />
                    WhatsApp
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {workflow.recipients.map((r) => (
                  <Badge key={r} variant="secondary" data-testid={`workflow-recipient-${r}-${workflow.id}`}>
                    {r}
                  </Badge>
                ))}
              </div>

              <span className="text-xs text-muted-foreground min-w-[100px]" data-testid={`workflow-last-triggered-${workflow.id}`}>
                {workflow.lastTriggered ? `Last: ${workflow.lastTriggered}` : "Never triggered"}
              </span>

              <div className="flex items-center gap-2">
                <Switch
                  checked={workflow.active}
                  onCheckedChange={() => toggleWorkflow(workflow.id)}
                  data-testid={`workflow-toggle-${workflow.id}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteWorkflow(workflow.id)}
                  data-testid={`workflow-delete-${workflow.id}`}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Notification Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="workflow-name">Workflow Name</Label>
              <Input
                id="workflow-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Expiry Alert"
                data-testid="input-workflow-name"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Trigger Type</Label>
              <Select value={formTrigger} onValueChange={setFormTrigger}>
                <SelectTrigger data-testid="select-trigger-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {HAS_DAYS_TRIGGERS.includes(formTrigger) && (
              <div className="space-y-1.5">
                <Label htmlFor="trigger-days">Days Before</Label>
                <Input
                  id="trigger-days"
                  type="number"
                  min={1}
                  value={formDays}
                  onChange={(e) => setFormDays(parseInt(e.target.value) || 1)}
                  data-testid="input-trigger-days"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Channels</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={formChannels.includes("email")}
                    onCheckedChange={() => toggleChannel("email")}
                    data-testid="checkbox-channel-email"
                  />
                  Email
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={formChannels.includes("whatsapp")}
                    onCheckedChange={() => toggleChannel("whatsapp")}
                    data-testid="checkbox-channel-whatsapp"
                  />
                  WhatsApp
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Recipients</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={formRecipients.includes("vendor")}
                    onCheckedChange={() => toggleRecipient("vendor")}
                    data-testid="checkbox-recipient-vendor"
                  />
                  Vendor
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={formRecipients.includes("admin")}
                    onCheckedChange={() => toggleRecipient("admin")}
                    data-testid="checkbox-recipient-admin"
                  />
                  Admin
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={formRecipients.includes("manager")}
                    onCheckedChange={() => toggleRecipient("manager")}
                    data-testid="checkbox-recipient-manager"
                  />
                  Manager
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-activate">Auto-activate</Label>
              <Switch
                id="auto-activate"
                checked={formAutoActivate}
                onCheckedChange={setFormAutoActivate}
                data-testid="switch-auto-activate"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-workflow">
              Cancel
            </Button>
            <Button onClick={handleAddWorkflow} disabled={!formName.trim()} data-testid="button-save-workflow">
              Add Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}