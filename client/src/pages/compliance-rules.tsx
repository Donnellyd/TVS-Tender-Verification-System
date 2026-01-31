import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Globe, Shield, FileCheck, AlertTriangle, Play, History, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface Country {
  code: string;
  name: string;
  currency: string;
}

interface ComplianceRuleSet {
  id: string;
  name: string;
  description: string;
  country: string;
  version: number;
  isActive: boolean;
  isDefault: boolean;
  publishedAt: string | null;
  createdAt: string;
}

interface ComplianceRule {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  ruleType: string;
  operator: string;
  field: string;
  value: string;
  threshold: number;
  weight: number;
  maxScore: number;
  severity: string;
  isMandatory: boolean;
  isActive: boolean;
  sortOrder: number;
}

const RULE_TYPES = [
  { value: "document_required", label: "Document Required" },
  { value: "document_validity", label: "Document Validity" },
  { value: "scoring_criteria", label: "Scoring Criteria" },
  { value: "preferential_points", label: "Preferential Points" },
  { value: "blacklist_check", label: "Blacklist Check" },
  { value: "threshold_check", label: "Threshold Check" },
  { value: "date_validation", label: "Date Validation" },
  { value: "value_comparison", label: "Value Comparison" },
];

const RULE_OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "exists", label: "Exists" },
  { value: "not_exists", label: "Not Exists" },
  { value: "is_valid", label: "Is Valid" },
  { value: "is_expired", label: "Is Expired" },
];

const CATEGORIES = [
  "Document Verification",
  "Tax Compliance",
  "Preferential Points",
  "Risk Assessment",
  "Scoring",
  "Eligibility",
];

export default function ComplianceRulesPage() {
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState("ZA");
  const [selectedRuleSet, setSelectedRuleSet] = useState<string | null>(null);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [isAddingRuleSet, setIsAddingRuleSet] = useState(false);

  const { data: countries } = useQuery<Country[]>({
    queryKey: ["/api/compliance/countries"],
  });

  const { data: ruleSets, isLoading: loadingRuleSets } = useQuery<ComplianceRuleSet[]>({
    queryKey: ["/api/compliance/rule-sets", { country: selectedCountry }],
  });

  const { data: rules } = useQuery<ComplianceRule[]>({
    queryKey: ["/api/compliance/rule-sets", selectedRuleSet, "rules"],
    enabled: !!selectedRuleSet,
  });

  const createRuleSetMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/compliance/rule-sets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/rule-sets"] });
      setIsAddingRuleSet(false);
      toast({ title: "Rule set created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create rule set", variant: "destructive" });
    },
  });

  const publishRuleSetMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/compliance/rule-sets/${id}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/rule-sets"] });
      toast({ title: "Rule set published successfully" });
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/compliance/rule-sets/${selectedRuleSet}/rules`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/rule-sets", selectedRuleSet, "rules"] });
      setIsAddingRule(false);
      toast({ title: "Rule created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create rule", variant: "destructive" });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/compliance/rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/rule-sets", selectedRuleSet, "rules"] });
      toast({ title: "Rule deleted" });
    },
  });

  const ruleForm = useForm({
    defaultValues: {
      code: "",
      name: "",
      description: "",
      category: "Document Verification",
      ruleType: "document_required",
      operator: "exists",
      field: "",
      value: "",
      weight: 1,
      severity: "error",
      isMandatory: true,
    },
  });

  const ruleSetForm = useForm({
    defaultValues: {
      name: "",
      description: "",
      country: selectedCountry,
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500";
      case "error": return "bg-orange-500";
      case "warning": return "bg-yellow-500";
      default: return "bg-blue-500";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compliance Rules Engine</h1>
          <p className="text-muted-foreground">Configure country-specific compliance rules and scoring criteria</p>
        </div>
      </div>

      <Tabs defaultValue="rule-sets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rule-sets" data-testid="tab-rule-sets">Rule Sets</TabsTrigger>
          <TabsTrigger value="countries" data-testid="tab-countries">Country Modules</TabsTrigger>
        </TabsList>

        <TabsContent value="rule-sets" className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-[200px]" data-testid="select-country">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries?.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={isAddingRuleSet} onOpenChange={setIsAddingRuleSet}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-ruleset">
                  <Plus className="h-4 w-4 mr-2" />
                  New Rule Set
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Rule Set</DialogTitle>
                  <DialogDescription>
                    Create a new compliance rule set for {countries?.find(c => c.code === selectedCountry)?.name}
                  </DialogDescription>
                </DialogHeader>
                <Form {...ruleSetForm}>
                  <form onSubmit={ruleSetForm.handleSubmit((data) => createRuleSetMutation.mutate({ ...data, country: selectedCountry }))} className="space-y-4">
                    <FormField
                      control={ruleSetForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., BBBEE Compliance Rules v2" data-testid="input-ruleset-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={ruleSetForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Describe the purpose of this rule set" data-testid="input-ruleset-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddingRuleSet(false)}>Cancel</Button>
                      <Button type="submit" disabled={createRuleSetMutation.isPending} data-testid="button-create-ruleset">
                        Create
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Rule Sets</h3>
              {loadingRuleSets ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : ruleSets && ruleSets.length > 0 ? (
                ruleSets.map((ruleSet) => (
                  <Card 
                    key={ruleSet.id} 
                    className={`cursor-pointer transition-colors ${selectedRuleSet === ruleSet.id ? "border-primary" : ""}`}
                    onClick={() => setSelectedRuleSet(ruleSet.id)}
                    data-testid={`card-ruleset-${ruleSet.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">{ruleSet.name}</CardTitle>
                        <div className="flex items-center gap-1">
                          {ruleSet.isDefault && <Badge variant="secondary">Default</Badge>}
                          <Badge variant={ruleSet.isActive ? "default" : "outline"}>
                            v{ruleSet.version}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="text-xs">{ruleSet.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{ruleSet.publishedAt ? "Published" : "Draft"}</span>
                        <span>{ruleSet.country}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No rule sets for this country</p>
                  <p className="text-sm">Create one to get started</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-4">
              {selectedRuleSet ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Rules</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => publishRuleSetMutation.mutate(selectedRuleSet)}
                        disabled={publishRuleSetMutation.isPending}
                        data-testid="button-publish-ruleset"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Publish
                      </Button>
                      <Dialog open={isAddingRule} onOpenChange={setIsAddingRule}>
                        <DialogTrigger asChild>
                          <Button size="sm" data-testid="button-add-rule">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Rule
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Add Compliance Rule</DialogTitle>
                            <DialogDescription>
                              Define a new compliance rule for this rule set
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...ruleForm}>
                            <form onSubmit={ruleForm.handleSubmit((data) => createRuleMutation.mutate(data))} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={ruleForm.control}
                                  name="code"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Rule Code</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="e.g., TAX_CLEARANCE_001" data-testid="input-rule-code" />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={ruleForm.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Name</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="Tax Clearance Required" data-testid="input-rule-name" />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={ruleForm.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                      <Textarea {...field} placeholder="Describe what this rule checks" data-testid="input-rule-description" />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={ruleForm.control}
                                  name="category"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Category</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="select-rule-category">
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={ruleForm.control}
                                  name="ruleType"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Rule Type</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="select-rule-type">
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {RULE_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <FormField
                                  control={ruleForm.control}
                                  name="operator"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Operator</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="select-rule-operator">
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {RULE_OPERATORS.map((op) => (
                                            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={ruleForm.control}
                                  name="severity"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Severity</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="select-rule-severity">
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="info">Info</SelectItem>
                                          <SelectItem value="warning">Warning</SelectItem>
                                          <SelectItem value="error">Error</SelectItem>
                                          <SelectItem value="critical">Critical</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={ruleForm.control}
                                  name="weight"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Weight</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="number" min={1} data-testid="input-rule-weight" />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={ruleForm.control}
                                name="isMandatory"
                                render={({ field }) => (
                                  <FormItem className="flex items-center gap-2">
                                    <FormControl>
                                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-rule-mandatory" />
                                    </FormControl>
                                    <FormLabel className="!mt-0">Mandatory (failure disqualifies bid)</FormLabel>
                                  </FormItem>
                                )}
                              />
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsAddingRule(false)}>Cancel</Button>
                                <Button type="submit" disabled={createRuleMutation.isPending} data-testid="button-create-rule">
                                  Create Rule
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {rules && rules.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rules.map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell className="font-mono text-xs">{rule.code}</TableCell>
                            <TableCell>{rule.name}</TableCell>
                            <TableCell>{rule.category}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{rule.ruleType}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getSeverityColor(rule.severity)}>
                                {rule.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteRuleMutation.mutate(rule.id)}
                                data-testid={`button-delete-rule-${rule.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground border rounded-lg">
                      <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No rules defined yet</p>
                      <p className="text-sm">Add rules to define compliance checks</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground border rounded-lg">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a rule set to view and manage rules</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="countries" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {countries?.map((country) => (
              <Card key={country.code} className="hover-elevate cursor-pointer" data-testid={`card-country-${country.code}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {country.name}
                  </CardTitle>
                  <CardDescription>{country.code} - {country.currency}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSelectedCountry(country.code)}
                  >
                    View Rules
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
