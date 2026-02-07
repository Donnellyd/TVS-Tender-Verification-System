import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { DataTableSkeleton } from "@/components/DataTableSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, MessageSquare, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, Trash2, Edit, Eye, EyeOff, HelpCircle, Send, Globe, Lock } from "lucide-react";
import { format } from "date-fns";

interface Tender {
  id: string;
  title: string;
  tenderNumber: string;
  status: string;
}

interface Clarification {
  id: string;
  tenderId: string;
  vendorName: string;
  questionText: string;
  answerText?: string;
  answeredBy?: string;
  answeredAt?: string;
  status: string;
  isPublic: boolean;
  createdAt: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "answered":
      return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-300" data-testid={`badge-clarification-${status}`}><CheckCircle className="h-3 w-3 mr-1" />Answered</Badge>;
    case "rejected":
      return <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-300" data-testid={`badge-clarification-${status}`}><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    default:
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-300" data-testid={`badge-clarification-${status}`}><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  }
}

export default function TenderClarifications() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedTenderId, setSelectedTenderId] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [answerTexts, setAnswerTexts] = useState<Record<string, string>>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingClarification, setEditingClarification] = useState<Clarification | null>(null);
  const [addForm, setAddForm] = useState({ questionText: "", vendorName: "", isPublic: false });
  const [editForm, setEditForm] = useState({ answerText: "" });

  const { data: tenders } = useQuery<Tender[]>({ queryKey: ["/api/tenders"] });

  const { data: clarifications, isLoading: clarificationsLoading } = useQuery<Clarification[]>({
    queryKey: ["/api/tenders", selectedTenderId, "clarifications"],
    enabled: !!selectedTenderId,
  });

  const createClarificationMutation = useMutation({
    mutationFn: (data: typeof addForm) =>
      apiRequest("POST", `/api/tenders/${selectedTenderId}/clarifications`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/tenders", selectedTenderId, "clarifications"] });
      toast({ title: "Success", description: "Question added" });
      setAddDialogOpen(false);
      setAddForm({ questionText: "", vendorName: "", isPublic: false });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to add question", variant: "destructive" });
    },
  });

  const answerClarificationMutation = useMutation({
    mutationFn: ({ id, answerText }: { id: string; answerText: string }) =>
      apiRequest("POST", `/api/clarifications/${id}/answer`, { answerText }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/tenders", selectedTenderId, "clarifications"] });
      toast({ title: "Success", description: "Answer submitted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to submit answer", variant: "destructive" });
    },
  });

  const updateClarificationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { answerText: string } }) =>
      apiRequest("PUT", `/api/clarifications/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/tenders", selectedTenderId, "clarifications"] });
      toast({ title: "Success", description: "Answer updated" });
      setEditDialogOpen(false);
      setEditingClarification(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to update", variant: "destructive" });
    },
  });

  const deleteClarificationMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/clarifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/tenders", selectedTenderId, "clarifications"] });
      toast({ title: "Success", description: "Question deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to delete", variant: "destructive" });
    },
  });

  const togglePublicMutation = useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      apiRequest("PUT", `/api/clarifications/${id}`, { isPublic }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/tenders", selectedTenderId, "clarifications"] });
      toast({ title: "Success", description: "Visibility updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to update visibility", variant: "destructive" });
    },
  });

  function handleAnswer(id: string) {
    const text = answerTexts[id];
    if (!text?.trim()) {
      toast({ title: "Validation Error", description: "Answer text is required", variant: "destructive" });
      return;
    }
    answerClarificationMutation.mutate({ id, answerText: text });
    setAnswerTexts((prev) => ({ ...prev, [id]: "" }));
  }

  function handleAddSubmit() {
    if (!addForm.questionText.trim() || !addForm.vendorName.trim()) {
      toast({ title: "Validation Error", description: "Question text and vendor name are required", variant: "destructive" });
      return;
    }
    createClarificationMutation.mutate(addForm);
  }

  function openEditDialog(c: Clarification) {
    setEditingClarification(c);
    setEditForm({ answerText: c.answerText || "" });
    setEditDialogOpen(true);
  }

  function handleEditSubmit() {
    if (!editingClarification) return;
    updateClarificationMutation.mutate({ id: editingClarification.id, data: editForm });
  }

  const items = clarifications || [];
  const totalQuestions = items.length;
  const answeredCount = items.filter((c) => c.status === "answered").length;
  const pendingCount = items.filter((c) => c.status === "pending").length;
  const publicCount = items.filter((c) => c.isPublic).length;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Tender Q&A / Clarifications" description="Manage tender questions, answers, and public clarifications" />
      <div className="flex-1 p-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <CardTitle className="text-lg">Tender Clarifications</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-72">
                <Select value={selectedTenderId} onValueChange={setSelectedTenderId}>
                  <SelectTrigger data-testid="select-tender-trigger">
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
              {selectedTenderId && (
                <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-question">
                  <Plus className="h-4 w-4 mr-2" />Add Question
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedTenderId ? (
              <EmptyState icon={MessageSquare} title="Select a Tender" description="Choose a tender from the dropdown above to view its clarifications" testId="empty-state-no-tender" />
            ) : clarificationsLoading ? (
              <DataTableSkeleton columns={4} rows={5} />
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-2xl font-bold" data-testid="stat-total-questions">{totalQuestions}</p>
                          <p className="text-xs text-muted-foreground">Total Questions</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-2xl font-bold" data-testid="stat-answered">{answeredCount}</p>
                          <p className="text-xs text-muted-foreground">Answered</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <div>
                          <p className="text-2xl font-bold" data-testid="stat-pending">{pendingCount}</p>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-2xl font-bold" data-testid="stat-public">{publicCount}</p>
                          <p className="text-xs text-muted-foreground">Public</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {items.length === 0 ? (
                  <EmptyState icon={MessageSquare} title="No Clarifications" description="No questions have been asked for this tender yet." actionLabel="Add Question" onAction={() => setAddDialogOpen(true)} testId="empty-state-no-clarifications" />
                ) : (
                  <div className="space-y-3">
                    {items.map((c) => {
                      const isExpanded = expandedId === c.id;
                      return (
                        <Card key={c.id} data-testid={`card-clarification-${c.id}`}>
                          <CardHeader
                            className="flex flex-row items-center justify-between gap-4 space-y-0 cursor-pointer pb-3"
                            onClick={() => setExpandedId(isExpanded ? null : c.id)}
                            data-testid={`button-expand-${c.id}`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate" data-testid={`text-question-preview-${c.id}`}>
                                  {c.questionText.length > 80 ? c.questionText.slice(0, 80) + "..." : c.questionText}
                                </p>
                                <p className="text-xs text-muted-foreground" data-testid={`text-vendor-${c.id}`}>
                                  {c.vendorName} &middot; {c.createdAt ? format(new Date(c.createdAt), "dd MMM yyyy") : ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                              {c.isPublic ? (
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-300"><Globe className="h-3 w-3 mr-1" />Public</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-300"><Lock className="h-3 w-3 mr-1" />Private</Badge>
                              )}
                              {getStatusBadge(c.status)}
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </CardHeader>
                          {isExpanded && (
                            <CardContent className="pt-0 space-y-4">
                              <div className="rounded-md bg-muted/50 p-4">
                                <p className="text-sm font-medium text-muted-foreground mb-1">Question</p>
                                <p className="text-sm" data-testid={`text-question-full-${c.id}`}>{c.questionText}</p>
                              </div>

                              {c.status === "answered" && c.answerText && (
                                <div className="rounded-md bg-green-500/5 border border-green-200 p-4">
                                  <p className="text-sm font-medium text-green-700 mb-1">Answer</p>
                                  <p className="text-sm" data-testid={`text-answer-${c.id}`}>{c.answerText}</p>
                                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                    {c.answeredBy && <span data-testid={`text-answered-by-${c.id}`}>By: {c.answeredBy}</span>}
                                    {c.answeredAt && <span data-testid={`text-answered-at-${c.id}`}>&middot; {format(new Date(c.answeredAt), "dd MMM yyyy HH:mm")}</span>}
                                  </div>
                                </div>
                              )}

                              {c.status === "pending" && (
                                <div className="space-y-2">
                                  <Label>Your Answer</Label>
                                  <Textarea
                                    value={answerTexts[c.id] || ""}
                                    onChange={(e) => setAnswerTexts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                                    placeholder="Type your answer..."
                                    data-testid={`input-answer-${c.id}`}
                                  />
                                  <Button
                                    onClick={() => handleAnswer(c.id)}
                                    disabled={answerClarificationMutation.isPending}
                                    data-testid={`button-submit-answer-${c.id}`}
                                  >
                                    <Send className="h-4 w-4 mr-2" />Answer
                                  </Button>
                                </div>
                              )}

                              <div className="flex items-center gap-1 border-t pt-3 flex-wrap">
                                {c.status === "answered" && (
                                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(c)} data-testid={`button-edit-answer-${c.id}`}>
                                    <Edit className="h-4 w-4 mr-1" />Edit Answer
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => togglePublicMutation.mutate({ id: c.id, isPublic: !c.isPublic })}
                                  data-testid={`button-toggle-public-${c.id}`}
                                >
                                  {c.isPublic ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                                  {c.isPublic ? "Make Private" : "Make Public"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteClarificationMutation.mutate(c.id)}
                                  data-testid={`button-delete-clarification-${c.id}`}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />Delete
                                </Button>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={(open) => { if (!open) { setAddDialogOpen(false); setAddForm({ questionText: "", vendorName: "", isPublic: false }); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Question</DialogTitle>
            <DialogDescription>Add a question on behalf of a vendor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="q-vendor">Vendor Name</Label>
              <Input id="q-vendor" value={addForm.vendorName} onChange={(e) => setAddForm((f) => ({ ...f, vendorName: e.target.value }))} placeholder="Enter vendor name" data-testid="input-question-vendor" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-text">Question</Label>
              <Textarea id="q-text" value={addForm.questionText} onChange={(e) => setAddForm((f) => ({ ...f, questionText: e.target.value }))} placeholder="Enter the question" data-testid="input-question-text" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="q-public" checked={addForm.isPublic} onCheckedChange={(checked) => setAddForm((f) => ({ ...f, isPublic: !!checked }))} data-testid="checkbox-question-public" />
              <Label htmlFor="q-public" className="text-sm">Set as public (visible to all vendors)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} data-testid="button-cancel-question">Cancel</Button>
            <Button onClick={handleAddSubmit} disabled={createClarificationMutation.isPending} data-testid="button-save-question">Add Question</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={(open) => { if (!open) { setEditDialogOpen(false); setEditingClarification(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Answer</DialogTitle>
            <DialogDescription>Update the answer for this clarification</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {editingClarification && (
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-sm font-medium text-muted-foreground mb-1">Question</p>
                <p className="text-sm">{editingClarification.questionText}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-answer">Answer</Label>
              <Textarea id="edit-answer" value={editForm.answerText} onChange={(e) => setEditForm({ answerText: e.target.value })} placeholder="Enter updated answer" data-testid="input-edit-answer" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={updateClarificationMutation.isPending} data-testid="button-save-edit">Update Answer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
