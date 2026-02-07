import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Edit, Copy, Scale, Users, ListChecks, CheckCircle, XCircle, ArrowRight, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { DataTableSkeleton } from "@/components/DataTableSkeleton";
import { EmptyState } from "@/components/EmptyState";

interface ScoringCriterion {
  name: string;
  category: string;
  maxScore: number;
  weight: number;
  scoringMethod: string;
  description: string;
}

interface ScoringTemplate {
  id: string;
  name: string;
  description: string;
  scoringSystem: string;
  isDefault: boolean;
  criteria: ScoringCriterion[];
  createdAt: string;
}

interface Tender {
  id: string;
  title: string;
  tenderNumber: string;
  status: string;
}

interface AdjudicationLevel {
  level: number;
  label: string;
  adjudicators: { userId: string; userName: string; userEmail: string }[];
}

interface AdjudicationConfig {
  id: string;
  tenderId: string;
  totalLevels: number;
  currentLevel: number;
  status: string;
  levels: AdjudicationLevel[];
  decisions: AdjudicationDecision[];
}

interface AdjudicationDecision {
  id: string;
  submissionId: string;
  vendorName: string;
  level: number;
  decision: string;
  comments: string;
  decidedBy: string;
  decidedAt: string;
}

interface CommitteeMember {
  id: string;
  userName: string;
  userEmail: string;
  role: string;
  scoringStatus: string;
}

interface EvaluationCommittee {
  id: string;
  tenderId: string;
  tenderNumber?: string;
  tenderTitle?: string;
  name: string;
  status: string;
  scoringDeadline: string;
  members: CommitteeMember[];
}

interface AggregatedScore {
  submissionId: string;
  vendorName: string;
  totalWeightedScore: number;
  criteriaScores: { criterionName: string; averageScore: number; weight: number; weightedScore: number }[];
}

const CATEGORIES = ["Technical", "Price", "BBBEE", "Experience", "Functionality", "Quality", "Local Content", "Other"];
const SCORING_METHODS = ["Manual", "Auto Price", "Auto BBBEE", "Auto Compliance"];
const MEMBER_ROLES = ["evaluator", "chairperson", "observer"];

const emptyCriterion: ScoringCriterion = {
  name: "",
  category: "Technical",
  maxScore: 100,
  weight: 0,
  scoringMethod: "Manual",
  description: "",
};

export default function Evaluation() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("scoring-templates");

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ScoringTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    scoringSystem: "80/20",
    isDefault: false,
    criteria: [{ ...emptyCriterion }] as ScoringCriterion[],
  });
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyTemplateId, setApplyTemplateId] = useState("");
  const [applyTenderId, setApplyTenderId] = useState("");

  const [adjSelectedTenderId, setAdjSelectedTenderId] = useState("");
  const [adjSetupDialogOpen, setAdjSetupDialogOpen] = useState(false);
  const [adjSetupForm, setAdjSetupForm] = useState({
    totalLevels: 2,
    levels: [
      { level: 1, label: "Automated Compliance Check", adjudicators: [] as { userId: string; userName: string; userEmail: string }[] },
      { level: 2, label: "Technical Evaluation", adjudicators: [{ userId: "", userName: "", userEmail: "" }] },
    ] as AdjudicationLevel[],
  });
  const [adjDecisionDialogOpen, setAdjDecisionDialogOpen] = useState(false);
  const [adjDecisionForm, setAdjDecisionForm] = useState({
    submissionId: "",
    decision: "approve",
    comments: "",
  });
  const [adjDecisionConfigId, setAdjDecisionConfigId] = useState("");

  const [committeeDialogOpen, setCommitteeDialogOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<EvaluationCommittee | null>(null);
  const [committeeForm, setCommitteeForm] = useState({
    tenderId: "",
    name: "",
    scoringDeadline: "",
    members: [{ userName: "", userEmail: "", role: "evaluator" }] as { userName: string; userEmail: string; role: string }[],
  });
  const [viewingCommitteeId, setViewingCommitteeId] = useState("");
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  const { data: templates, isLoading: templatesLoading } = useQuery<ScoringTemplate[]>({
    queryKey: ["/api/scoring-templates"],
  });

  const { data: tenders } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });

  const { data: adjConfig, isLoading: adjConfigLoading } = useQuery<AdjudicationConfig>({
    queryKey: ["/api/tenders", adjSelectedTenderId, "adjudication"],
    enabled: !!adjSelectedTenderId,
  });

  const { data: committees, isLoading: committeesLoading } = useQuery<EvaluationCommittee[]>({
    queryKey: ["/api/evaluation-committees"],
  });

  const { data: committeeDetails } = useQuery<EvaluationCommittee>({
    queryKey: ["/api/evaluation-committees", viewingCommitteeId],
    enabled: !!viewingCommitteeId,
  });

  const { data: committeeMembers } = useQuery<CommitteeMember[]>({
    queryKey: ["/api/evaluation-committees", viewingCommitteeId, "members"],
    enabled: !!viewingCommitteeId,
  });

  const { data: aggregatedScores } = useQuery<AggregatedScore[]>({
    queryKey: ["/api/evaluation-committees", viewingCommitteeId, "aggregated-scores"],
    enabled: !!viewingCommitteeId,
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data: typeof templateForm) => apiRequest("POST", "/api/scoring-templates", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/scoring-templates"] });
      toast({ title: "Success", description: "Scoring template created" });
      closeTemplateDialog();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to create template", variant: "destructive" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof templateForm }) =>
      apiRequest("PUT", `/api/scoring-templates/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/scoring-templates"] });
      toast({ title: "Success", description: "Scoring template updated" });
      closeTemplateDialog();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to update template", variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/scoring-templates/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/scoring-templates"] });
      toast({ title: "Success", description: "Template deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to delete template", variant: "destructive" });
    },
  });

  const copyTemplateMutation = useMutation({
    mutationFn: (template: ScoringTemplate) =>
      apiRequest("POST", "/api/scoring-templates", {
        name: `${template.name} (Copy)`,
        description: template.description,
        scoringSystem: template.scoringSystem,
        isDefault: false,
        criteria: template.criteria,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/scoring-templates"] });
      toast({ title: "Success", description: "Template copied" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to copy template", variant: "destructive" });
    },
  });

  const applyTemplateMutation = useMutation({
    mutationFn: ({ tenderId, templateId }: { tenderId: string; templateId: string }) =>
      apiRequest("POST", `/api/tenders/${tenderId}/apply-scoring-template`, { templateId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/tenders"] });
      toast({ title: "Success", description: "Template applied to tender" });
      setApplyDialogOpen(false);
      setApplyTemplateId("");
      setApplyTenderId("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to apply template", variant: "destructive" });
    },
  });

  const createAdjudicationMutation = useMutation({
    mutationFn: (data: { tenderId: string; totalLevels: number; levels: AdjudicationLevel[] }) =>
      apiRequest("POST", `/api/tenders/${data.tenderId}/adjudication`, { totalLevels: data.totalLevels, levels: data.levels }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/tenders", adjSelectedTenderId, "adjudication"] });
      toast({ title: "Success", description: "Adjudication configured" });
      setAdjSetupDialogOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to configure adjudication", variant: "destructive" });
    },
  });

  const adjDecisionMutation = useMutation({
    mutationFn: (data: { configId: string; submissionId: string; decision: string; comments: string }) =>
      apiRequest("POST", `/api/adjudication/${data.configId}/decide`, {
        submissionId: data.submissionId,
        decision: data.decision,
        comments: data.comments,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/tenders", adjSelectedTenderId, "adjudication"] });
      toast({ title: "Success", description: "Decision recorded" });
      setAdjDecisionDialogOpen(false);
      setAdjDecisionForm({ submissionId: "", decision: "approve", comments: "" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to record decision", variant: "destructive" });
    },
  });

  const createCommitteeMutation = useMutation({
    mutationFn: (data: typeof committeeForm) =>
      apiRequest("POST", "/api/evaluation-committees", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/evaluation-committees"] });
      toast({ title: "Success", description: "Committee created" });
      closeCommitteeDialog();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to create committee", variant: "destructive" });
    },
  });

  const updateCommitteeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof committeeForm }) =>
      apiRequest("PUT", `/api/evaluation-committees/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/evaluation-committees"] });
      qc.invalidateQueries({ queryKey: ["/api/evaluation-committees", viewingCommitteeId] });
      toast({ title: "Success", description: "Committee updated" });
      closeCommitteeDialog();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to update committee", variant: "destructive" });
    },
  });

  const deleteCommitteeMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/evaluation-committees/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/evaluation-committees"] });
      toast({ title: "Success", description: "Committee deleted" });
      if (viewingCommitteeId) setViewingCommitteeId("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to delete committee", variant: "destructive" });
    },
  });

  function closeTemplateDialog() {
    setTemplateDialogOpen(false);
    setEditingTemplate(null);
    setTemplateForm({ name: "", description: "", scoringSystem: "80/20", isDefault: false, criteria: [{ ...emptyCriterion }] });
  }

  function openEditTemplate(t: ScoringTemplate) {
    setEditingTemplate(t);
    setTemplateForm({
      name: t.name,
      description: t.description,
      scoringSystem: t.scoringSystem,
      isDefault: t.isDefault,
      criteria: t.criteria?.length ? t.criteria : [{ ...emptyCriterion }],
    });
    setTemplateDialogOpen(true);
  }

  function handleTemplateSubmit() {
    if (!templateForm.name.trim()) {
      toast({ title: "Validation Error", description: "Template name is required", variant: "destructive" });
      return;
    }
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: templateForm });
    } else {
      createTemplateMutation.mutate(templateForm);
    }
  }

  function addCriterion() {
    setTemplateForm((f) => ({ ...f, criteria: [...f.criteria, { ...emptyCriterion }] }));
  }

  function removeCriterion(idx: number) {
    setTemplateForm((f) => ({ ...f, criteria: f.criteria.filter((_, i) => i !== idx) }));
  }

  function updateCriterion(idx: number, field: keyof ScoringCriterion, value: string | number) {
    setTemplateForm((f) => ({
      ...f,
      criteria: f.criteria.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
    }));
  }

  const totalWeight = templateForm.criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

  function closeCommitteeDialog() {
    setCommitteeDialogOpen(false);
    setEditingCommittee(null);
    setCommitteeForm({ tenderId: "", name: "", scoringDeadline: "", members: [{ userName: "", userEmail: "", role: "evaluator" }] });
  }

  function openEditCommittee(c: EvaluationCommittee) {
    setEditingCommittee(c);
    setCommitteeForm({
      tenderId: c.tenderId,
      name: c.name,
      scoringDeadline: c.scoringDeadline ? c.scoringDeadline.split("T")[0] : "",
      members: c.members?.length
        ? c.members.map((m) => ({ userName: m.userName, userEmail: m.userEmail, role: m.role }))
        : [{ userName: "", userEmail: "", role: "evaluator" }],
    });
    setCommitteeDialogOpen(true);
  }

  function handleCommitteeSubmit() {
    if (!committeeForm.tenderId || !committeeForm.name.trim()) {
      toast({ title: "Validation Error", description: "Tender and committee name are required", variant: "destructive" });
      return;
    }
    if (editingCommittee) {
      updateCommitteeMutation.mutate({ id: editingCommittee.id, data: committeeForm });
    } else {
      createCommitteeMutation.mutate(committeeForm);
    }
  }

  function addMember() {
    setCommitteeForm((f) => ({ ...f, members: [...f.members, { userName: "", userEmail: "", role: "evaluator" }] }));
  }

  function removeMember(idx: number) {
    setCommitteeForm((f) => ({ ...f, members: f.members.filter((_, i) => i !== idx) }));
  }

  function updateMember(idx: number, field: string, value: string) {
    setCommitteeForm((f) => ({
      ...f,
      members: f.members.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }));
  }

  function handleAdjSetupLevels(val: string) {
    const num = parseInt(val);
    setAdjSetupForm((f) => {
      const levels = [...f.levels];
      if (num === 3 && levels.length < 3) {
        levels.push({ level: 3, label: "Final Review", adjudicators: [{ userId: "", userName: "", userEmail: "" }] });
      } else if (num === 2 && levels.length > 2) {
        levels.splice(2, 1);
      }
      return { ...f, totalLevels: num, levels };
    });
  }

  function handleAdjSetupSubmit() {
    if (!adjSelectedTenderId) return;
    createAdjudicationMutation.mutate({
      tenderId: adjSelectedTenderId,
      totalLevels: adjSetupForm.totalLevels,
      levels: adjSetupForm.levels,
    });
  }

  function handleAdjDecisionSubmit() {
    if (!adjDecisionForm.submissionId || !adjDecisionConfigId) {
      toast({ title: "Validation Error", description: "Select a submission", variant: "destructive" });
      return;
    }
    adjDecisionMutation.mutate({
      configId: adjDecisionConfigId,
      submissionId: adjDecisionForm.submissionId,
      decision: adjDecisionForm.decision,
      comments: adjDecisionForm.comments,
    });
  }

  function getDecisionBadge(decision: string) {
    switch (decision) {
      case "approve":
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-300"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "reject":
        return <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-300"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "send_back":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-300"><ArrowRight className="h-3 w-3 mr-1" />Sent Back</Badge>;
      default:
        return <Badge variant="outline">{decision}</Badge>;
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Evaluation Engine" description="Manage scoring templates, adjudication, and evaluation committees" />

      <div className="flex-1 p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList data-testid="tabs-evaluation">
            <TabsTrigger value="scoring-templates" data-testid="tab-scoring-templates">
              <ListChecks className="h-4 w-4 mr-2" />
              Scoring Templates
            </TabsTrigger>
            <TabsTrigger value="adjudication" data-testid="tab-adjudication">
              <Scale className="h-4 w-4 mr-2" />
              Adjudication
            </TabsTrigger>
            <TabsTrigger value="committees" data-testid="tab-committees">
              <Users className="h-4 w-4 mr-2" />
              Evaluation Committees
            </TabsTrigger>
          </TabsList>

          {/* ───── Tab 1: Scoring Templates ───── */}
          <TabsContent value="scoring-templates" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
                <CardTitle className="text-lg">Scoring Templates</CardTitle>
                <Button onClick={() => { closeTemplateDialog(); setTemplateDialogOpen(true); }} data-testid="button-create-template">
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <DataTableSkeleton columns={6} rows={5} />
                ) : !templates || templates.length === 0 ? (
                  <EmptyState
                    icon={ListChecks}
                    title="No Scoring Templates"
                    description="Create a scoring template to define evaluation criteria for tenders."
                    actionLabel="New Template"
                    onAction={() => { closeTemplateDialog(); setTemplateDialogOpen(true); }}
                    testId="empty-state-templates"
                  />
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Scoring System</TableHead>
                          <TableHead>Criteria Count</TableHead>
                          <TableHead>Default</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {templates.map((t) => (
                          <TableRow key={t.id} data-testid={`row-template-${t.id}`}>
                            <TableCell data-testid={`text-template-name-${t.id}`}>{t.name}</TableCell>
                            <TableCell data-testid={`text-template-system-${t.id}`}>
                              <Badge variant="outline">{t.scoringSystem}</Badge>
                            </TableCell>
                            <TableCell data-testid={`text-template-criteria-${t.id}`}>
                              {t.criteria?.length ?? 0}
                            </TableCell>
                            <TableCell data-testid={`text-template-default-${t.id}`}>
                              {t.isDefault ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-300">
                                  <CheckCircle className="h-3 w-3 mr-1" />Default
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 flex-wrap">
                                <Button variant="ghost" size="icon" onClick={() => openEditTemplate(t)} data-testid={`button-edit-template-${t.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => copyTemplateMutation.mutate(t)} data-testid={`button-copy-template-${t.id}`}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => { setApplyTemplateId(t.id); setApplyDialogOpen(true); }} data-testid={`button-apply-template-${t.id}`}>
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteTemplateMutation.mutate(t.id)} data-testid={`button-delete-template-${t.id}`}>
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

          {/* ───── Tab 2: Adjudication ───── */}
          <TabsContent value="adjudication" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
                <CardTitle className="text-lg">Adjudication</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-64">
                    <Select value={adjSelectedTenderId} onValueChange={setAdjSelectedTenderId}>
                      <SelectTrigger data-testid="select-tender-adjudication">
                        <SelectValue placeholder="Select a tender" />
                      </SelectTrigger>
                      <SelectContent>
                        {(tenders || []).map((t) => (
                          <SelectItem key={t.id} value={t.id} data-testid={`select-adj-tender-${t.id}`}>
                            {t.tenderNumber} - {t.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {adjSelectedTenderId && !adjConfig && (
                    <Button onClick={() => setAdjSetupDialogOpen(true)} data-testid="button-setup-adjudication">
                      <Settings2 className="h-4 w-4 mr-2" />
                      Setup Adjudication
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!adjSelectedTenderId ? (
                  <EmptyState
                    icon={Scale}
                    title="Select a Tender"
                    description="Choose a tender to view or configure adjudication."
                    testId="empty-state-adjudication"
                  />
                ) : adjConfigLoading ? (
                  <DataTableSkeleton columns={5} rows={3} />
                ) : !adjConfig ? (
                  <EmptyState
                    icon={Scale}
                    title="No Adjudication Configured"
                    description="Set up adjudication levels and assign adjudicators for this tender."
                    actionLabel="Setup Adjudication"
                    onAction={() => setAdjSetupDialogOpen(true)}
                    testId="empty-state-no-adjudication"
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Current Level:</span>
                        <Badge variant="outline" data-testid="badge-adj-current-level">{adjConfig.currentLevel} / {adjConfig.totalLevels}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge variant="outline" data-testid="badge-adj-status">
                          {adjConfig.status === "completed" ? <CheckCircle className="h-3 w-3 mr-1" /> : <Scale className="h-3 w-3 mr-1" />}
                          {adjConfig.status}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => { setAdjDecisionConfigId(adjConfig.id); setAdjDecisionDialogOpen(true); }}
                        data-testid="button-make-decision"
                      >
                        <Scale className="h-4 w-4 mr-2" />
                        Make Decision
                      </Button>
                    </div>

                    <CardDescription>Levels</CardDescription>
                    {adjConfig.levels?.map((lvl) => (
                      <Card key={lvl.level}>
                        <CardHeader className="py-3 px-4">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <CardTitle className="text-sm">Level {lvl.level}: {lvl.label}</CardTitle>
                            {adjConfig.currentLevel === lvl.level && <Badge variant="outline">Active</Badge>}
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-3">
                          {lvl.adjudicators?.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {lvl.adjudicators.map((a, i) => (
                                <Badge key={i} variant="secondary" data-testid={`badge-adjudicator-${lvl.level}-${i}`}>
                                  <Users className="h-3 w-3 mr-1" />{a.userName || a.userEmail}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {adjConfig.decisions && adjConfig.decisions.length > 0 && (
                      <>
                        <CardDescription>Decisions</CardDescription>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Decision</TableHead>
                                <TableHead>Comments</TableHead>
                                <TableHead>Decided By</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {adjConfig.decisions.map((d) => (
                                <TableRow key={d.id} data-testid={`row-decision-${d.id}`}>
                                  <TableCell data-testid={`text-decision-vendor-${d.id}`}>{d.vendorName}</TableCell>
                                  <TableCell>{d.level}</TableCell>
                                  <TableCell>{getDecisionBadge(d.decision)}</TableCell>
                                  <TableCell className="max-w-xs truncate">{d.comments || "-"}</TableCell>
                                  <TableCell>{d.decidedBy}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ───── Tab 3: Evaluation Committees ───── */}
          <TabsContent value="committees" className="space-y-4">
            {viewingCommitteeId ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-lg">{committeeDetails?.name || "Committee Details"}</CardTitle>
                    <CardDescription>
                      {committeeDetails?.tenderNumber} - {committeeDetails?.tenderTitle}
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setViewingCommitteeId("")} data-testid="button-back-committees">
                    Back to List
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Members</h3>
                    {committeeMembers && committeeMembers.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Scoring Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {committeeMembers.map((m) => (
                              <TableRow key={m.id} data-testid={`row-member-${m.id}`}>
                                <TableCell data-testid={`text-member-name-${m.id}`}>{m.userName}</TableCell>
                                <TableCell>{m.userEmail}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{m.role}</Badge>
                                </TableCell>
                                <TableCell>
                                  {m.scoringStatus === "submitted" ? (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-300">
                                      <CheckCircle className="h-3 w-3 mr-1" />Submitted
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-300">
                                      Pending
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No members assigned yet.</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Aggregated Scores</h3>
                    {aggregatedScores && aggregatedScores.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Rank</TableHead>
                              <TableHead>Vendor</TableHead>
                              <TableHead>Weighted Score</TableHead>
                              <TableHead>Details</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...aggregatedScores]
                              .sort((a, b) => b.totalWeightedScore - a.totalWeightedScore)
                              .map((s, idx) => (
                                <>
                                  <TableRow key={s.submissionId} data-testid={`row-score-${s.submissionId}`}>
                                    <TableCell data-testid={`text-rank-${s.submissionId}`}>{idx + 1}</TableCell>
                                    <TableCell data-testid={`text-vendor-score-${s.submissionId}`}>{s.vendorName}</TableCell>
                                    <TableCell data-testid={`text-weighted-score-${s.submissionId}`}>
                                      <Badge variant="outline">{s.totalWeightedScore.toFixed(2)}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setExpandedSubmission(expandedSubmission === s.submissionId ? null : s.submissionId)}
                                        data-testid={`button-expand-score-${s.submissionId}`}
                                      >
                                        {expandedSubmission === s.submissionId ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                  {expandedSubmission === s.submissionId && s.criteriaScores?.map((cs, ci) => (
                                    <TableRow key={`${s.submissionId}-${ci}`} className="bg-muted/30">
                                      <TableCell />
                                      <TableCell className="text-sm text-muted-foreground" data-testid={`text-criterion-${s.submissionId}-${ci}`}>
                                        {cs.criterionName}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        Avg: {cs.averageScore.toFixed(1)} | Wt: {cs.weight}% | Score: {cs.weightedScore.toFixed(2)}
                                      </TableCell>
                                      <TableCell />
                                    </TableRow>
                                  ))}
                                </>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <EmptyState
                        icon={ListChecks}
                        title="No Scores Yet"
                        description="Evaluation scores will appear here once committee members submit their assessments."
                        testId="empty-state-no-scores"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
                  <CardTitle className="text-lg">Evaluation Committees</CardTitle>
                  <Button onClick={() => { closeCommitteeDialog(); setCommitteeDialogOpen(true); }} data-testid="button-create-committee">
                    <Plus className="h-4 w-4 mr-2" />
                    New Committee
                  </Button>
                </CardHeader>
                <CardContent>
                  {committeesLoading ? (
                    <DataTableSkeleton columns={6} rows={5} />
                  ) : !committees || committees.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title="No Evaluation Committees"
                      description="Create an evaluation committee to manage scoring for a tender."
                      actionLabel="New Committee"
                      onAction={() => { closeCommitteeDialog(); setCommitteeDialogOpen(true); }}
                      testId="empty-state-committees"
                    />
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tender</TableHead>
                            <TableHead>Committee Name</TableHead>
                            <TableHead>Members</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Scoring Deadline</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {committees.map((c) => (
                            <TableRow key={c.id} data-testid={`row-committee-${c.id}`}>
                              <TableCell data-testid={`text-committee-tender-${c.id}`}>
                                {c.tenderNumber || c.tenderId}
                              </TableCell>
                              <TableCell data-testid={`text-committee-name-${c.id}`}>{c.name}</TableCell>
                              <TableCell data-testid={`text-committee-members-${c.id}`}>
                                <Badge variant="outline">{c.members?.length ?? 0}</Badge>
                              </TableCell>
                              <TableCell data-testid={`text-committee-status-${c.id}`}>
                                <Badge variant="outline">{c.status}</Badge>
                              </TableCell>
                              <TableCell data-testid={`text-committee-deadline-${c.id}`}>
                                {c.scoringDeadline ? new Date(c.scoringDeadline).toLocaleDateString() : "-"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 flex-wrap">
                                  <Button variant="ghost" size="icon" onClick={() => setViewingCommitteeId(c.id)} data-testid={`button-view-committee-${c.id}`}>
                                    <ListChecks className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => openEditCommittee(c)} data-testid={`button-edit-committee-${c.id}`}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => deleteCommitteeMutation.mutate(c.id)} data-testid={`button-delete-committee-${c.id}`}>
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
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ───── Create/Edit Template Dialog ───── */}
      <Dialog open={templateDialogOpen} onOpenChange={(o) => { if (!o) closeTemplateDialog(); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Scoring Template" : "New Scoring Template"}</DialogTitle>
            <DialogDescription>Define the scoring criteria and weights for tender evaluations.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Standard 80/20"
                  data-testid="input-template-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scoring-system">Scoring System</Label>
                <Select
                  value={templateForm.scoringSystem}
                  onValueChange={(v) => setTemplateForm((f) => ({ ...f, scoringSystem: v }))}
                >
                  <SelectTrigger data-testid="select-scoring-system">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="80/20">80/20</SelectItem>
                    <SelectItem value="90/10">90/10</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-desc">Description</Label>
              <Textarea
                id="template-desc"
                value={templateForm.description}
                onChange={(e) => setTemplateForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe when to use this template"
                data-testid="input-template-description"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is-default"
                checked={templateForm.isDefault}
                onCheckedChange={(c) => setTemplateForm((f) => ({ ...f, isDefault: !!c }))}
                data-testid="checkbox-is-default"
              />
              <Label htmlFor="is-default">Set as default template</Label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label>Criteria</Label>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${totalWeight === 100 ? "text-green-600" : "text-yellow-600"}`} data-testid="text-total-weight">
                    Total Weight: {totalWeight}%
                  </span>
                  <Button variant="outline" size="sm" onClick={addCriterion} data-testid="button-add-criterion">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Criteria
                  </Button>
                </div>
              </div>

              {templateForm.criteria.map((c, idx) => (
                <Card key={idx}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Criterion {idx + 1}</span>
                      {templateForm.criteria.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeCriterion(idx)} data-testid={`button-remove-criterion-${idx}`}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={c.name}
                          onChange={(e) => updateCriterion(idx, "name", e.target.value)}
                          placeholder="Criterion name"
                          data-testid={`input-criterion-name-${idx}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Category</Label>
                        <Select value={c.category} onValueChange={(v) => updateCriterion(idx, "category", v)}>
                          <SelectTrigger data-testid={`select-criterion-category-${idx}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Max Score</Label>
                        <Input
                          type="number"
                          value={c.maxScore}
                          onChange={(e) => updateCriterion(idx, "maxScore", parseInt(e.target.value) || 0)}
                          data-testid={`input-criterion-maxscore-${idx}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Weight (%)</Label>
                        <Input
                          type="number"
                          value={c.weight}
                          onChange={(e) => updateCriterion(idx, "weight", parseFloat(e.target.value) || 0)}
                          data-testid={`input-criterion-weight-${idx}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Scoring Method</Label>
                        <Select value={c.scoringMethod} onValueChange={(v) => updateCriterion(idx, "scoringMethod", v)}>
                          <SelectTrigger data-testid={`select-criterion-method-${idx}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SCORING_METHODS.map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={c.description}
                        onChange={(e) => updateCriterion(idx, "description", e.target.value)}
                        placeholder="Optional description"
                        data-testid={`input-criterion-desc-${idx}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeTemplateDialog} data-testid="button-cancel-template">Cancel</Button>
            <Button
              onClick={handleTemplateSubmit}
              disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
              data-testid="button-save-template"
            >
              {(createTemplateMutation.isPending || updateTemplateMutation.isPending) ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───── Apply Template to Tender Dialog ───── */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Template to Tender</DialogTitle>
            <DialogDescription>Select a tender to apply this scoring template to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tender</Label>
              <Select value={applyTenderId} onValueChange={setApplyTenderId}>
                <SelectTrigger data-testid="select-apply-tender">
                  <SelectValue placeholder="Select a tender" />
                </SelectTrigger>
                <SelectContent>
                  {(tenders || []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.tenderNumber} - {t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialogOpen(false)} data-testid="button-cancel-apply">Cancel</Button>
            <Button
              onClick={() => { if (applyTenderId && applyTemplateId) applyTemplateMutation.mutate({ tenderId: applyTenderId, templateId: applyTemplateId }); }}
              disabled={!applyTenderId || applyTemplateMutation.isPending}
              data-testid="button-confirm-apply"
            >
              {applyTemplateMutation.isPending ? "Applying..." : "Apply Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───── Setup Adjudication Dialog ───── */}
      <Dialog open={adjSetupDialogOpen} onOpenChange={setAdjSetupDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Setup Adjudication</DialogTitle>
            <DialogDescription>Configure adjudication levels and assign adjudicators.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Total Levels</Label>
              <Select value={String(adjSetupForm.totalLevels)} onValueChange={handleAdjSetupLevels}>
                <SelectTrigger data-testid="select-adj-levels">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Levels</SelectItem>
                  <SelectItem value="3">3 Levels</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {adjSetupForm.levels.map((lvl, li) => (
              <Card key={lvl.level}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="text-sm font-medium">Level {lvl.level}</h4>
                    {lvl.level === 1 && <Badge variant="secondary">Automated</Badge>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={lvl.label}
                      disabled={lvl.level === 1}
                      onChange={(e) => {
                        setAdjSetupForm((f) => ({
                          ...f,
                          levels: f.levels.map((l, i) => (i === li ? { ...l, label: e.target.value } : l)),
                        }));
                      }}
                      data-testid={`input-adj-level-label-${lvl.level}`}
                    />
                  </div>
                  {lvl.level > 1 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Label className="text-xs">Adjudicators</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAdjSetupForm((f) => ({
                              ...f,
                              levels: f.levels.map((l, i) =>
                                i === li ? { ...l, adjudicators: [...l.adjudicators, { userId: "", userName: "", userEmail: "" }] } : l
                              ),
                            }));
                          }}
                          data-testid={`button-add-adjudicator-${lvl.level}`}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                      {lvl.adjudicators.map((a, ai) => (
                        <div key={ai} className="grid grid-cols-3 gap-2 items-end">
                          <div className="space-y-1">
                            <Label className="text-xs">Name</Label>
                            <Input
                              value={a.userName}
                              onChange={(e) => {
                                setAdjSetupForm((f) => ({
                                  ...f,
                                  levels: f.levels.map((l, i) =>
                                    i === li
                                      ? { ...l, adjudicators: l.adjudicators.map((adj, j) => (j === ai ? { ...adj, userName: e.target.value } : adj)) }
                                      : l
                                  ),
                                }));
                              }}
                              placeholder="Name"
                              data-testid={`input-adj-name-${lvl.level}-${ai}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Email</Label>
                            <Input
                              value={a.userEmail}
                              onChange={(e) => {
                                setAdjSetupForm((f) => ({
                                  ...f,
                                  levels: f.levels.map((l, i) =>
                                    i === li
                                      ? { ...l, adjudicators: l.adjudicators.map((adj, j) => (j === ai ? { ...adj, userEmail: e.target.value } : adj)) }
                                      : l
                                  ),
                                }));
                              }}
                              placeholder="Email"
                              data-testid={`input-adj-email-${lvl.level}-${ai}`}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setAdjSetupForm((f) => ({
                                ...f,
                                levels: f.levels.map((l, i) =>
                                  i === li ? { ...l, adjudicators: l.adjudicators.filter((_, j) => j !== ai) } : l
                                ),
                              }));
                            }}
                            data-testid={`button-remove-adjudicator-${lvl.level}-${ai}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjSetupDialogOpen(false)} data-testid="button-cancel-adj-setup">Cancel</Button>
            <Button
              onClick={handleAdjSetupSubmit}
              disabled={createAdjudicationMutation.isPending}
              data-testid="button-save-adj-setup"
            >
              {createAdjudicationMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───── Adjudication Decision Dialog ───── */}
      <Dialog open={adjDecisionDialogOpen} onOpenChange={setAdjDecisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Adjudication Decision</DialogTitle>
            <DialogDescription>Record a decision for a submission at the current adjudication level.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Submission ID</Label>
              <Input
                value={adjDecisionForm.submissionId}
                onChange={(e) => setAdjDecisionForm((f) => ({ ...f, submissionId: e.target.value }))}
                placeholder="Enter submission ID"
                data-testid="input-decision-submission"
              />
            </div>
            <div className="space-y-2">
              <Label>Decision</Label>
              <Select value={adjDecisionForm.decision} onValueChange={(v) => setAdjDecisionForm((f) => ({ ...f, decision: v }))}>
                <SelectTrigger data-testid="select-decision">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="send_back">Send Back</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Comments</Label>
              <Textarea
                value={adjDecisionForm.comments}
                onChange={(e) => setAdjDecisionForm((f) => ({ ...f, comments: e.target.value }))}
                placeholder="Provide reasons for the decision"
                data-testid="input-decision-comments"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjDecisionDialogOpen(false)} data-testid="button-cancel-decision">Cancel</Button>
            <Button
              onClick={handleAdjDecisionSubmit}
              disabled={adjDecisionMutation.isPending}
              data-testid="button-submit-decision"
            >
              {adjDecisionMutation.isPending ? "Submitting..." : "Submit Decision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───── Create/Edit Committee Dialog ───── */}
      <Dialog open={committeeDialogOpen} onOpenChange={(o) => { if (!o) closeCommitteeDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCommittee ? "Edit Committee" : "New Evaluation Committee"}</DialogTitle>
            <DialogDescription>Set up an evaluation committee for a tender and assign members.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tender</Label>
                <Select value={committeeForm.tenderId} onValueChange={(v) => setCommitteeForm((f) => ({ ...f, tenderId: v }))}>
                  <SelectTrigger data-testid="select-committee-tender">
                    <SelectValue placeholder="Select a tender" />
                  </SelectTrigger>
                  <SelectContent>
                    {(tenders || []).map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.tenderNumber} - {t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Committee Name</Label>
                <Input
                  value={committeeForm.name}
                  onChange={(e) => setCommitteeForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Technical Evaluation Panel"
                  data-testid="input-committee-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Scoring Deadline</Label>
              <Input
                type="date"
                value={committeeForm.scoringDeadline}
                onChange={(e) => setCommitteeForm((f) => ({ ...f, scoringDeadline: e.target.value }))}
                data-testid="input-committee-deadline"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label>Members</Label>
                <Button variant="outline" size="sm" onClick={addMember} data-testid="button-add-member">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Member
                </Button>
              </div>
              {committeeForm.members.map((m, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={m.userName}
                      onChange={(e) => updateMember(idx, "userName", e.target.value)}
                      placeholder="Name"
                      data-testid={`input-member-name-${idx}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input
                      value={m.userEmail}
                      onChange={(e) => updateMember(idx, "userEmail", e.target.value)}
                      placeholder="Email"
                      data-testid={`input-member-email-${idx}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Role</Label>
                    <Select value={m.role} onValueChange={(v) => updateMember(idx, "role", v)}>
                      <SelectTrigger data-testid={`select-member-role-${idx}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEMBER_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {committeeForm.members.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeMember(idx)} data-testid={`button-remove-member-${idx}`}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCommitteeDialog} data-testid="button-cancel-committee">Cancel</Button>
            <Button
              onClick={handleCommitteeSubmit}
              disabled={createCommitteeMutation.isPending || updateCommitteeMutation.isPending}
              data-testid="button-save-committee"
            >
              {(createCommitteeMutation.isPending || updateCommitteeMutation.isPending) ? "Saving..." : "Save Committee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}