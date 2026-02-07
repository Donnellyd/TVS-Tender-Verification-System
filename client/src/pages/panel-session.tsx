import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { DataTableSkeleton } from "@/components/DataTableSkeleton";
import { EmptyState } from "@/components/EmptyState";
import {
  Plus, Trash2, Edit, Play, Monitor, ArrowLeft, ArrowRight,
  Users, ChevronDown, ChevronUp, Copy, CheckCircle, Clock,
  SkipForward, Trophy, UserCheck, UserX, Link2, Info
} from "lucide-react";

interface PanelSessionData {
  id: string;
  tenderId: string;
  tenantId: string | null;
  name: string;
  description: string | null;
  status: string;
  currentSubmissionId: string | null;
  currentRound: number;
  totalRounds: number;
  facilitatorId: string | null;
  facilitatorName: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  members?: PanelMemberData[];
}

interface PanelMemberData {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  role: string;
  isPresent: boolean;
  joinedAt: string | null;
}

interface PanelResultsData {
  session: { id: string; name: string; status: string; currentRound: number; totalRounds: number };
  members: { id: string; userName: string; role: string; isPresent: boolean }[];
  results: {
    submissionId: string;
    vendorId: string;
    bidAmount: number | null;
    totalScore: number;
    criteriaScores: {
      criteriaId: string;
      criteriaName: string;
      criteriaCategory: string;
      maxScore: number;
      weight: number | null;
      averageScore: number;
      voteCount: number;
      totalPanelists: number;
      votes: { memberId: string; memberName: string; score: number; comments: string | null }[];
    }[];
    allVotesIn: boolean;
  }[];
}

interface Tender {
  id: string;
  title: string;
  tenderNumber: string;
  status: string;
}

interface MemberFormEntry {
  userName: string;
  userEmail: string;
  role: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted/50 text-muted-foreground border-border",
  active: "bg-blue-500/10 text-blue-700 border-blue-300",
  voting: "bg-amber-500/10 text-amber-700 border-amber-300",
  completed: "bg-green-500/10 text-green-700 border-green-300",
  cancelled: "bg-red-500/10 text-red-700 border-red-300",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status] || ""} data-testid={`badge-status-${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

const emptyMember: MemberFormEntry = { userName: "", userEmail: "", role: "panelist" };

export default function PanelSession() {
  const { toast } = useToast();

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<PanelSessionData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedRanking, setExpandedRanking] = useState<string | null>(null);
  const [facilitatorSubmissionId, setFacilitatorSubmissionId] = useState<string | null>(null);

  const [form, setForm] = useState({
    tenderId: "",
    name: "",
    description: "",
    totalRounds: 3,
    facilitatorName: "",
    facilitatorId: "",
    members: [{ ...emptyMember }] as MemberFormEntry[],
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery<PanelSessionData[]>({
    queryKey: ["/api/panel-sessions"],
  });

  const { data: tenders } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });

  const { data: sessionDetail } = useQuery<PanelSessionData>({
    queryKey: ["/api/panel-sessions", selectedSessionId],
    enabled: !!selectedSessionId,
  });

  const { data: resultsData } = useQuery<PanelResultsData>({
    queryKey: ["/api/panel-sessions", selectedSessionId, "results"],
    enabled: !!selectedSessionId,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/panel-sessions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/panel-sessions"] });
      toast({ title: "Success", description: "Panel session created" });
      closeDialog();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to create session", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof form }) =>
      apiRequest("PUT", `/api/panel-sessions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/panel-sessions"] });
      toast({ title: "Success", description: "Panel session updated" });
      closeDialog();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to update session", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/panel-sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/panel-sessions"] });
      toast({ title: "Success", description: "Session deleted" });
      setDeleteConfirmId(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to delete session", variant: "destructive" });
    },
  });

  const advanceMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiRequest("POST", `/api/panel-sessions/${sessionId}/advance`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/panel-sessions", selectedSessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/panel-sessions", selectedSessionId, "results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/panel-sessions"] });
      toast({ title: "Success", description: "Advanced to next item" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to advance", variant: "destructive" });
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("PUT", `/api/panel-sessions/${id}`, { status: "active" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/panel-sessions"] });
      toast({ title: "Success", description: "Session started" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to start session", variant: "destructive" });
    },
  });

  const completeSessionMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("PUT", `/api/panel-sessions/${id}`, { status: "completed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/panel-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/panel-sessions", selectedSessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/panel-sessions", selectedSessionId, "results"] });
      toast({ title: "Success", description: "Session completed" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to complete session", variant: "destructive" });
    },
  });

  function closeDialog() {
    setDialogOpen(false);
    setEditingSession(null);
    setForm({
      tenderId: "", name: "", description: "", totalRounds: 3,
      facilitatorName: "", facilitatorId: "",
      members: [{ ...emptyMember }],
    });
  }

  function openEdit(s: PanelSessionData) {
    setEditingSession(s);
    setForm({
      tenderId: s.tenderId,
      name: s.name,
      description: s.description || "",
      totalRounds: s.totalRounds,
      facilitatorName: s.facilitatorName || "",
      facilitatorId: s.facilitatorId || "",
      members: s.members?.length
        ? s.members.map((m) => ({ userName: m.userName, userEmail: m.userEmail || "", role: m.role }))
        : [{ ...emptyMember }],
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      toast({ title: "Validation Error", description: "Session name is required", variant: "destructive" });
      return;
    }
    if (!form.tenderId) {
      toast({ title: "Validation Error", description: "Please select a tender", variant: "destructive" });
      return;
    }
    if (editingSession) {
      updateMutation.mutate({ id: editingSession.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  function addMember() {
    setForm((f) => ({ ...f, members: [...f.members, { ...emptyMember }] }));
  }

  function removeMember(idx: number) {
    setForm((f) => ({ ...f, members: f.members.filter((_, i) => i !== idx) }));
  }

  function updateMember(idx: number, field: keyof MemberFormEntry, value: string) {
    setForm((f) => ({
      ...f,
      members: f.members.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }));
  }

  function getTenderLabel(tenderId: string) {
    const t = tenders?.find((t) => t.id === tenderId);
    return t ? `${t.tenderNumber} - ${t.title}` : tenderId;
  }

  function copyLink(sessionId: string) {
    const url = `${window.location.origin}/evaluation?panelSession=${sessionId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Copied", description: "Scoring link copied to clipboard" });
  }

  if (selectedSessionId) {
    return <FacilitatorView
      sessionId={selectedSessionId}
      sessionDetail={sessionDetail}
      resultsData={resultsData}
      facilitatorSubmissionId={facilitatorSubmissionId}
      setFacilitatorSubmissionId={setFacilitatorSubmissionId}
      expandedRanking={expandedRanking}
      setExpandedRanking={setExpandedRanking}
      onBack={() => { setSelectedSessionId(null); setFacilitatorSubmissionId(null); }}
      onAdvance={() => advanceMutation.mutate(selectedSessionId)}
      onComplete={() => completeSessionMutation.mutate(selectedSessionId)}
      advancePending={advanceMutation.isPending}
      completePending={completeSessionMutation.isPending}
    />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Panel Evaluation Sessions"
        description="Manage panel sessions for large tenders with multiple evaluators scoring together"
        action={{
          label: "Create Session",
          icon: <Plus className="h-4 w-4 mr-2" />,
          onClick: () => setDialogOpen(true),
          testId: "button-create-session",
        }}
      />

      <div className="flex-1 p-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <CardTitle className="text-lg" data-testid="text-sessions-title">All Panel Sessions</CardTitle>
            <Badge variant="outline" data-testid="badge-session-count">
              <Users className="h-3 w-3 mr-1" />
              {sessions?.length || 0} sessions
            </Badge>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <DataTableSkeleton columns={5} rows={4} />
            ) : !sessions || sessions.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No Panel Sessions"
                description="Create a panel session to coordinate evaluators for large tenders."
                actionLabel="Create Session"
                onAction={() => setDialogOpen(true)}
                testId="empty-state-no-sessions"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sessions.map((s) => (
                  <Card key={s.id} data-testid={`card-session-${s.id}`}>
                    <CardHeader className="pb-2 space-y-0">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base" data-testid={`text-session-name-${s.id}`}>
                          {s.name}
                        </CardTitle>
                        <StatusBadge status={s.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1" data-testid={`text-session-tender-${s.id}`}>
                        {getTenderLabel(s.tenderId)}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1" data-testid={`text-member-count-${s.id}`}>
                          <Users className="h-3.5 w-3.5" />
                          {s.members?.length || 0} members
                        </span>
                        <span data-testid={`text-round-${s.id}`}>
                          Round {s.currentRound}/{s.totalRounds}
                        </span>
                      </div>
                      {s.facilitatorName && (
                        <p className="text-xs text-muted-foreground" data-testid={`text-facilitator-${s.id}`}>
                          Facilitator: {s.facilitatorName}
                        </p>
                      )}
                      <div className="flex items-center gap-1 flex-wrap pt-1">
                        <Button variant="outline" size="sm" onClick={() => openEdit(s)} data-testid={`button-edit-${s.id}`}>
                          <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        {s.status === "draft" && (
                          <Button variant="outline" size="sm" onClick={() => startSessionMutation.mutate(s.id)} data-testid={`button-start-${s.id}`}>
                            <Play className="h-3.5 w-3.5 mr-1" /> Start
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setSelectedSessionId(s.id)} data-testid={`button-facilitator-${s.id}`}>
                          <Monitor className="h-3.5 w-3.5 mr-1" /> Facilitator
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => copyLink(s.id)} data-testid={`button-copy-link-${s.id}`}>
                          <Copy className="h-3.5 w-3.5 mr-1" /> Link
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(s.id)} data-testid={`button-delete-${s.id}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium" data-testid="text-panelist-notice">Individual Panelist Scoring</p>
                <p className="text-sm text-muted-foreground">
                  Panelists score submissions through the committee scoring interface. Use the "Copy Scoring Link" button above to share access with panel members.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">
              {editingSession ? "Edit Panel Session" : "Create Panel Session"}
            </DialogTitle>
            <DialogDescription>
              Configure a panel evaluation session for coordinated scoring by multiple evaluators.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session-tender">Tender</Label>
              <Select value={form.tenderId} onValueChange={(v) => setForm((f) => ({ ...f, tenderId: v }))} data-testid="select-tender">
                <SelectTrigger id="session-tender" data-testid="select-tender-trigger">
                  <SelectValue placeholder="Select a tender" />
                </SelectTrigger>
                <SelectContent>
                  {(tenders || []).map((t) => (
                    <SelectItem key={t.id} value={t.id} data-testid={`select-tender-option-${t.id}`}>
                      {t.tenderNumber} - {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session-name">Session Name</Label>
                <Input
                  id="session-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Q1 Fleet Tender Panel"
                  data-testid="input-session-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-rounds">Total Rounds</Label>
                <Select
                  value={String(form.totalRounds)}
                  onValueChange={(v) => setForm((f) => ({ ...f, totalRounds: Number(v) }))}
                  data-testid="select-rounds"
                >
                  <SelectTrigger id="session-rounds" data-testid="select-rounds-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)} data-testid={`select-rounds-option-${n}`}>{n} round{n > 1 ? "s" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-desc">Description</Label>
              <Textarea
                id="session-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description for this session"
                rows={2}
                data-testid="input-session-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facilitator-name">Facilitator Name</Label>
                <Input
                  id="facilitator-name"
                  value={form.facilitatorName}
                  onChange={(e) => setForm((f) => ({ ...f, facilitatorName: e.target.value }))}
                  placeholder="e.g., John Smith"
                  data-testid="input-facilitator-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facilitator-id">Facilitator ID</Label>
                <Input
                  id="facilitator-id"
                  value={form.facilitatorId}
                  onChange={(e) => setForm((f) => ({ ...f, facilitatorId: e.target.value }))}
                  placeholder="User ID"
                  data-testid="input-facilitator-id"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Panel Members</Label>
                <Button variant="outline" size="sm" onClick={addMember} data-testid="button-add-member">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Member
                </Button>
              </div>
              {form.members.map((m, idx) => (
                <div key={idx} className="flex items-end gap-2" data-testid={`member-row-${idx}`}>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={m.userName}
                      onChange={(e) => updateMember(idx, "userName", e.target.value)}
                      placeholder="Member name"
                      data-testid={`input-member-name-${idx}`}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input
                      value={m.userEmail}
                      onChange={(e) => updateMember(idx, "userEmail", e.target.value)}
                      placeholder="email@example.com"
                      data-testid={`input-member-email-${idx}`}
                    />
                  </div>
                  <div className="w-36 space-y-1">
                    <Label className="text-xs">Role</Label>
                    <Select value={m.role} onValueChange={(v) => updateMember(idx, "role", v)}>
                      <SelectTrigger data-testid={`select-member-role-${idx}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="panelist" data-testid={`role-panelist-${idx}`}>Panelist</SelectItem>
                        <SelectItem value="facilitator" data-testid={`role-facilitator-${idx}`}>Facilitator</SelectItem>
                        <SelectItem value="observer" data-testid={`role-observer-${idx}`}>Observer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.members.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeMember(idx)} data-testid={`button-remove-member-${idx}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} data-testid="button-cancel-dialog">Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit-session"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingSession ? "Update Session" : "Create Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle data-testid="text-delete-title">Delete Panel Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this panel session? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} data-testid="button-cancel-delete">Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface FacilitatorViewProps {
  sessionId: string;
  sessionDetail: PanelSessionData | undefined;
  resultsData: PanelResultsData | undefined;
  facilitatorSubmissionId: string | null;
  setFacilitatorSubmissionId: (id: string | null) => void;
  expandedRanking: string | null;
  setExpandedRanking: (id: string | null) => void;
  onBack: () => void;
  onAdvance: () => void;
  onComplete: () => void;
  advancePending: boolean;
  completePending: boolean;
}

function FacilitatorView({
  sessionId, sessionDetail, resultsData, facilitatorSubmissionId,
  setFacilitatorSubmissionId, expandedRanking, setExpandedRanking,
  onBack, onAdvance, onComplete, advancePending, completePending,
}: FacilitatorViewProps) {
  const session = resultsData?.session;
  const members = resultsData?.members || [];
  const results = resultsData?.results || [];
  const currentSubId = facilitatorSubmissionId || sessionDetail?.currentSubmissionId;
  const currentResult = results.find((r) => r.submissionId === currentSubId);
  const sortedResults = [...results].sort((a, b) => b.totalScore - a.totalScore);
  const panelists = members.filter((m) => m.role === "panelist" || m.role === "facilitator");

  return (
    <div className="flex flex-col min-h-screen" data-testid="facilitator-view">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex h-16 items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-to-sessions">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground" data-testid="text-facilitator-session-name">
                {session?.name || sessionDetail?.name || "Panel Session"}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span data-testid="text-facilitator-round">
                  Round {session?.currentRound || sessionDetail?.currentRound || 1}/{session?.totalRounds || sessionDetail?.totalRounds || 1}
                </span>
                <StatusBadge status={session?.status || sessionDetail?.status || "draft"} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onAdvance}
              disabled={advancePending}
              data-testid="button-advance"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              {advancePending ? "Advancing..." : "Advance"}
            </Button>
            <Button
              variant="outline"
              onClick={onComplete}
              disabled={completePending}
              data-testid="button-complete-session"
            >
              <Trophy className="h-4 w-4 mr-2" />
              {completePending ? "Completing..." : "Complete Session"}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="flex gap-6">
          <div className="flex-1 space-y-6">
            {results.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2" data-testid="submission-navigator">
                {results.map((r) => (
                  <Button
                    key={r.submissionId}
                    variant={r.submissionId === currentSubId ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFacilitatorSubmissionId(r.submissionId)}
                    className="shrink-0"
                    data-testid={`button-nav-submission-${r.submissionId}`}
                  >
                    {r.vendorId || r.submissionId.slice(0, 8)}
                    {r.allVotesIn && <CheckCircle className="h-3 w-3 ml-1" />}
                  </Button>
                ))}
              </div>
            )}

            {currentResult ? (
              <Card data-testid="card-current-submission">
                <CardHeader className="pb-3 space-y-0">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-lg" data-testid="text-current-vendor">
                      {currentResult.vendorId || "Vendor"}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {currentResult.bidAmount != null && (
                        <Badge variant="outline" data-testid="badge-bid-amount">
                          R {Number(currentResult.bidAmount).toLocaleString()}
                        </Badge>
                      )}
                      {currentResult.allVotesIn ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-300" data-testid="badge-votes-complete">
                          <CheckCircle className="h-3 w-3 mr-1" /> All votes in
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-300" data-testid="badge-votes-pending">
                          <Clock className="h-3 w-3 mr-1" /> Voting in progress
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">Live Scoring Results</p>
                  {currentResult.criteriaScores.map((cs) => {
                    const pct = cs.totalPanelists > 0 ? (cs.voteCount / cs.totalPanelists) * 100 : 0;
                    const allIn = cs.voteCount >= cs.totalPanelists;
                    return (
                      <div key={cs.criteriaId} className="space-y-1.5" data-testid={`criteria-row-${cs.criteriaId}`}>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium" data-testid={`text-criteria-name-${cs.criteriaId}`}>{cs.criteriaName}</span>
                            <Badge variant="outline" className="text-xs" data-testid={`badge-criteria-category-${cs.criteriaId}`}>
                              {cs.criteriaCategory}
                            </Badge>
                          </div>
                          <span className="text-muted-foreground" data-testid={`text-vote-progress-${cs.criteriaId}`}>
                            {cs.voteCount}/{cs.totalPanelists} votes
                          </span>
                        </div>
                        <Progress value={pct} className="h-2" data-testid={`progress-votes-${cs.criteriaId}`} />
                        {allIn && (
                          <p className="text-sm font-medium" data-testid={`text-avg-score-${cs.criteriaId}`}>
                            Average: {cs.averageScore.toFixed(1)} / {cs.maxScore}
                            {cs.weight != null && <span className="text-muted-foreground ml-2">(weight: {cs.weight})</span>}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Monitor}
                    title="No Submission Selected"
                    description="Select a submission from the navigator above or wait for results data to load."
                    testId="empty-state-no-submission"
                  />
                </CardContent>
              </Card>
            )}

            <Card data-testid="card-rankings">
              <CardHeader className="pb-3 space-y-0">
                <CardTitle className="text-base">Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                {sortedResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-rankings">
                    No results available yet.
                  </p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>Submission</TableHead>
                          <TableHead>Bid Amount</TableHead>
                          <TableHead>Weighted Score</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-12" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedResults.map((r, idx) => (
                          <>
                            <TableRow key={r.submissionId} data-testid={`row-ranking-${r.submissionId}`}>
                              <TableCell className="font-medium" data-testid={`text-rank-${r.submissionId}`}>
                                {idx + 1}
                              </TableCell>
                              <TableCell data-testid={`text-ranking-submission-${r.submissionId}`}>
                                {r.vendorId || r.submissionId.slice(0, 12)}
                              </TableCell>
                              <TableCell data-testid={`text-ranking-bid-${r.submissionId}`}>
                                {r.bidAmount != null ? `R ${Number(r.bidAmount).toLocaleString()}` : "-"}
                              </TableCell>
                              <TableCell data-testid={`text-ranking-score-${r.submissionId}`}>
                                {r.totalScore.toFixed(1)}
                              </TableCell>
                              <TableCell>
                                {r.allVotesIn ? (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-300" data-testid={`badge-ranking-complete-${r.submissionId}`}>
                                    <CheckCircle className="h-3 w-3 mr-1" /> Complete
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-300" data-testid={`badge-ranking-pending-${r.submissionId}`}>
                                    <Clock className="h-3 w-3 mr-1" /> Pending
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setExpandedRanking(expandedRanking === r.submissionId ? null : r.submissionId)}
                                  data-testid={`button-expand-ranking-${r.submissionId}`}
                                >
                                  {expandedRanking === r.submissionId ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              </TableCell>
                            </TableRow>
                            {expandedRanking === r.submissionId && (
                              <TableRow key={`${r.submissionId}-detail`} data-testid={`row-ranking-detail-${r.submissionId}`}>
                                <TableCell colSpan={6} className="bg-muted/30">
                                  <div className="p-3 space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">Criteria Breakdown</p>
                                    {r.criteriaScores.map((cs) => (
                                      <div key={cs.criteriaId} className="flex items-center justify-between text-sm" data-testid={`detail-criteria-${r.submissionId}-${cs.criteriaId}`}>
                                        <span>{cs.criteriaName} ({cs.criteriaCategory})</span>
                                        <span className="font-medium">
                                          {cs.averageScore.toFixed(1)} / {cs.maxScore}
                                          {cs.weight != null && <span className="text-muted-foreground ml-1">x{cs.weight}</span>}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="w-72 shrink-0">
            <Card data-testid="card-panel-members">
              <CardHeader className="pb-3 space-y-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" /> Panel Members
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {panelists.length === 0 && members.length === 0 ? (
                  <p className="text-sm text-muted-foreground" data-testid="text-no-members">No members loaded</p>
                ) : (
                  (panelists.length > 0 ? panelists : members).map((m) => {
                    const hasVoted = currentResult?.criteriaScores.some((cs) =>
                      cs.votes?.some((v) => v.memberId === m.id)
                    );
                    return (
                      <div key={m.id} className="flex items-center justify-between gap-2 py-1.5" data-testid={`member-item-${m.id}`}>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" data-testid={`text-member-name-${m.id}`}>{m.userName}</p>
                          <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {m.isPresent ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-300 text-xs" data-testid={`badge-present-${m.id}`}>
                              <UserCheck className="h-3 w-3" />
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-muted/50 text-muted-foreground text-xs" data-testid={`badge-absent-${m.id}`}>
                              <UserX className="h-3 w-3" />
                            </Badge>
                          )}
                          {currentResult && (
                            hasVoted ? (
                              <CheckCircle className="h-3.5 w-3.5 text-green-600" data-testid={`icon-voted-${m.id}`} />
                            ) : (
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" data-testid={`icon-not-voted-${m.id}`} />
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
