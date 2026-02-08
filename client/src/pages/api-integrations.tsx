import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTableSkeleton } from "@/components/DataTableSkeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Shield,
  Building2,
  MapPin,
  AlertTriangle,
  MessageSquare,
  Plug,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Send,
  Search,
  Globe,
  Fingerprint,
  FileCheck,
  Users,
  LocateFixed,
  ScanFace,
} from "lucide-react";

const categoryIcons: Record<string, any> = {
  Shield: Shield,
  Building2: Building2,
  MapPin: MapPin,
  AlertTriangle: AlertTriangle,
  MessageSquare: MessageSquare,
};

const integrationIcons: Record<string, any> = {
  "sa-id-validation": Fingerprint,
  "dha-verification": Shield,
  "facial-recognition": ScanFace,
  "cipc-verification": Building2,
  "sars-tax-clearance": FileCheck,
  "coj-utility": MapPin,
  "eskom-utility": Zap,
  "capetown-utility": MapPin,
  "ethekwini-utility": MapPin,
  "duplicate-detection": Users,
  "fraud-scoring": AlertTriangle,
  "geolocation": LocateFixed,
  "whatsapp-otp": MessageSquare,
  "sendgrid-email": Send,
};

interface Integration {
  id: string;
  name: string;
  description: string;
  status: "live" | "ready" | "planned";
  endpoint: string;
  method: string;
  category: string;
}

interface Category {
  name: string;
  icon: string;
  integrations: Integration[];
}

interface CatalogData {
  totalIntegrations: number;
  categories: Category[];
}

function StatusBadge({ status }: { status: string }) {
  if (status === "live") {
    return <Badge variant="default" className="bg-green-600 border-green-700" data-testid={`badge-status-${status}`}><CheckCircle2 className="w-3 h-3 mr-1" />Live</Badge>;
  }
  if (status === "ready") {
    return <Badge variant="secondary" data-testid={`badge-status-${status}`}><Clock className="w-3 h-3 mr-1" />Ready</Badge>;
  }
  return <Badge variant="outline" data-testid={`badge-status-${status}`}><XCircle className="w-3 h-3 mr-1" />Planned</Badge>;
}

function SaIdTester() {
  const [idNumber, setIdNumber] = useState("");
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", "/api/gov/validate-sa-id", { idNumber: id });
      return res.json();
    },
    onSuccess: (data) => setResult(data),
    onError: () => toast({ title: "Validation failed", variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      <Label>SA ID Number</Label>
      <div className="flex gap-2 flex-wrap">
        <Input
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          placeholder="Enter 13-digit SA ID number"
          className="flex-1 min-w-[200px]"
          maxLength={13}
          data-testid="input-sa-id"
        />
        <Button
          onClick={() => mutation.mutate(idNumber)}
          disabled={mutation.isPending || idNumber.length < 13}
          data-testid="button-validate-id"
        >
          {mutation.isPending ? "Validating..." : "Validate"}
        </Button>
      </div>
      {result && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Result:</span>
              {result.valid ? (
                <Badge className="bg-green-600 border-green-700">Valid</Badge>
              ) : (
                <Badge variant="destructive">Invalid</Badge>
              )}
            </div>
            {result.valid && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Date of Birth:</span> {result.dateOfBirth}</div>
                <div><span className="text-muted-foreground">Age:</span> {result.age}</div>
                <div><span className="text-muted-foreground">Gender:</span> {result.gender}</div>
                <div><span className="text-muted-foreground">Citizenship:</span> {result.citizenship}</div>
                <div><span className="text-muted-foreground">Luhn Check:</span> {result.luhnChecksum}</div>
              </div>
            )}
            {!result.valid && <p className="text-sm text-destructive">{result.reason}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DhaTester() {
  const [idNumber, setIdNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/gov/dha-verify", { idNumber, firstName, lastName });
      return res.json();
    },
    onSuccess: (data) => setResult(data),
    onError: () => toast({ title: "Verification failed", variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <Label>ID Number</Label>
          <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="ID Number" data-testid="input-dha-id" />
        </div>
        <div>
          <Label>First Name</Label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" data-testid="input-dha-first" />
        </div>
        <div>
          <Label>Last Name</Label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" data-testid="input-dha-last" />
        </div>
      </div>
      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !idNumber} data-testid="button-dha-verify">
        {mutation.isPending ? "Verifying..." : "Verify with DHA"}
      </Button>
      {result && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{result.status === "integration_ready" ? "Endpoint Ready" : "Connected"}</Badge>
              <span className="text-sm text-muted-foreground">Provider: {result.provider}</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Capabilities:</p>
              <ul className="text-sm text-muted-foreground space-y-0.5">
                {result.capabilities?.map((c: string, i: number) => (
                  <li key={i} className="flex items-start gap-1"><CheckCircle2 className="w-3 h-3 mt-0.5 text-green-500 shrink-0" />{c}</li>
                ))}
              </ul>
            </div>
            {result.approvedProviders && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Approved Providers:</p>
                <div className="flex gap-1 flex-wrap">
                  {result.approvedProviders.map((p: any, i: number) => (
                    <Badge key={i} variant="outline">{p.name}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CipcTester() {
  const [regNumber, setRegNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/gov/cipc-verify", { registrationNumber: regNumber, companyName });
      return res.json();
    },
    onSuccess: (data) => setResult(data),
    onError: () => toast({ title: "Verification failed", variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <Label>Registration Number</Label>
          <Input value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="e.g. 2024/123456/07" data-testid="input-cipc-reg" />
        </div>
        <div>
          <Label>Company Name</Label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company Name" data-testid="input-cipc-name" />
        </div>
      </div>
      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || (!regNumber && !companyName)} data-testid="button-cipc-verify">
        {mutation.isPending ? "Verifying..." : "Verify with CIPC"}
      </Button>
      {result && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{result.status === "integration_ready" ? "Endpoint Ready" : "Connected"}</Badge>
              <span className="text-sm text-muted-foreground">Provider: {result.provider}</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Available Data Fields:</p>
              <div className="flex gap-1 flex-wrap">
                {result.dataFields?.map((f: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Capabilities:</p>
              <ul className="text-sm text-muted-foreground space-y-0.5">
                {result.capabilities?.map((c: string, i: number) => (
                  <li key={i} className="flex items-start gap-1"><CheckCircle2 className="w-3 h-3 mt-0.5 text-green-500 shrink-0" />{c}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function UtilityTester() {
  const [accountNumber, setAccountNumber] = useState("");
  const [provider, setProvider] = useState("coj");
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/gov/utility-verify", { accountNumber, provider });
      return res.json();
    },
    onSuccess: (data) => setResult(data),
    onError: () => toast({ title: "Verification failed", variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <Label>Utility Provider</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger data-testid="select-utility-provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coj">City of Johannesburg</SelectItem>
              <SelectItem value="eskom">Eskom</SelectItem>
              <SelectItem value="capetown">City of Cape Town</SelectItem>
              <SelectItem value="ethekwini">eThekwini (Durban)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Account Number</Label>
          <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Account or meter number" data-testid="input-utility-account" />
        </div>
      </div>
      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !accountNumber} data-testid="button-utility-verify">
        {mutation.isPending ? "Verifying..." : "Verify Utility Account"}
      </Button>
      {result && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{result.status === "integration_ready" ? "Endpoint Ready" : "Connected"}</Badge>
              <span className="text-sm text-muted-foreground">{result.provider}</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Available Providers:</p>
              <div className="flex gap-1 flex-wrap">
                {result.availableProviders?.map((p: any, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{p.name} ({p.services.length} services)</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Capabilities:</p>
              <ul className="text-sm text-muted-foreground space-y-0.5">
                {result.capabilities?.map((c: string, i: number) => (
                  <li key={i} className="flex items-start gap-1"><CheckCircle2 className="w-3 h-3 mt-0.5 text-green-500 shrink-0" />{c}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ApiIntegrations() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: catalog, isLoading } = useQuery<CatalogData>({
    queryKey: ["/api/gov/integrations-catalog"],
  });

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <PageHeader title="API Integrations" description="Government and third-party API integrations" />
        <DataTableSkeleton columns={4} />
      </div>
    );
  }

  const allIntegrations = catalog?.categories.flatMap((c) => c.integrations) || [];
  const liveCount = allIntegrations.filter((i) => i.status === "live").length;
  const readyCount = allIntegrations.filter((i) => i.status === "ready").length;
  const plannedCount = allIntegrations.filter((i) => i.status === "planned").length;

  const filteredCategories = catalog?.categories.map((cat) => ({
    ...cat,
    integrations: cat.integrations.filter((int) => {
      const matchesSearch = !searchQuery ||
        int.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        int.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || int.status === filterStatus;
      return matchesSearch && matchesStatus;
    }),
  })).filter((cat) => cat.integrations.length > 0) || [];

  const renderTester = (integrationId: string) => {
    switch (integrationId) {
      case "sa-id-validation": return <SaIdTester />;
      case "dha-verification": return <DhaTester />;
      case "cipc-verification": return <CipcTester />;
      case "coj-utility":
      case "eskom-utility": return <UtilityTester />;
      default: return null;
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <PageHeader
        title="API Integrations"
        description="Government and third-party API integrations available for vendor verification, fraud prevention, and compliance validation"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Integrations" value={catalog?.totalIntegrations || 0} icon={Plug} />
        <StatsCard title="Live" value={liveCount} icon={CheckCircle2} />
        <StatsCard title="Ready to Connect" value={readyCount} icon={Clock} />
        <StatsCard title="Planned" value={plannedCount} icon={Globe} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search integrations..."
            className="pl-9"
            data-testid="input-search-integrations"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]" data-testid="select-filter-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredCategories.map((category) => {
          const CategoryIcon = categoryIcons[category.icon] || Plug;
          const isExpanded = expandedCategory === category.name;

          return (
            <Card key={category.name}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => setExpandedCategory(isExpanded ? null : category.name)}
                data-testid={`card-category-${category.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="h-5 w-5 text-primary" />
                    <span>{category.name}</span>
                    <Badge variant="secondary" className="ml-1">{category.integrations.length}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {category.integrations.some((i) => i.status === "live") && (
                        <Badge className="bg-green-600 border-green-700 text-xs">
                          {category.integrations.filter((i) => i.status === "live").length} Live
                        </Badge>
                      )}
                      {category.integrations.some((i) => i.status === "ready") && (
                        <Badge variant="secondary" className="text-xs">
                          {category.integrations.filter((i) => i.status === "ready").length} Ready
                        </Badge>
                      )}
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardTitle>
              </CardHeader>
              {isExpanded && (
                <CardContent className="space-y-3 pt-0">
                  {category.integrations.map((integration) => {
                    const IntIcon = integrationIcons[integration.id] || Plug;
                    const isIntExpanded = expandedIntegration === integration.id;
                    const tester = renderTester(integration.id);

                    return (
                      <Card key={integration.id} className="border-border/50">
                        <CardContent className="p-4 space-y-3">
                          <div
                            className="flex items-start justify-between gap-3 cursor-pointer"
                            onClick={() => setExpandedIntegration(isIntExpanded ? null : integration.id)}
                            data-testid={`integration-${integration.id}`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="rounded-md p-2 bg-muted shrink-0">
                                <IntIcon className="h-5 w-5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium text-sm">{integration.name}</h4>
                                  <StatusBadge status={integration.status} />
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{integration.description}</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs font-mono">{integration.method}</Badge>
                                  <code className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{integration.endpoint}</code>
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0">
                              {tester && (
                                isIntExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                          {isIntExpanded && tester && (
                            <div className="border-t pt-3 mt-3">
                              <p className="text-sm font-medium mb-2">Test Integration</p>
                              {tester}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No integrations match your search criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
