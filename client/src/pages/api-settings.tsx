import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Key, Copy, Trash2, Eye, EyeOff, Code, Webhook, FileCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  lastUsedAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function ApiSettingsPage() {
  const { toast } = useToast();
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const demoTenantId = "demo-tenant";

  const form = useForm({
    defaultValues: {
      name: "",
      rateLimit: 1000,
    },
  });

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const API_DOCS = [
    {
      method: "POST",
      endpoint: "/api/v1/bids",
      description: "Submit a new bid for evaluation",
    },
    {
      method: "GET",
      endpoint: "/api/v1/bids/{id}",
      description: "Get bid evaluation results",
    },
    {
      method: "POST",
      endpoint: "/api/v1/documents/verify",
      description: "Verify a single document",
    },
    {
      method: "GET",
      endpoint: "/api/v1/compliance/rules",
      description: "List available compliance rules",
    },
    {
      method: "POST",
      endpoint: "/api/v1/webhooks",
      description: "Register a webhook endpoint",
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Settings</h1>
          <p className="text-muted-foreground">Manage API keys and integrate with external systems</p>
        </div>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api-keys" data-testid="tab-api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks" data-testid="tab-webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="docs" data-testid="tab-docs">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Keys
                  </CardTitle>
                  <CardDescription>
                    Create and manage API keys for programmatic access
                  </CardDescription>
                </div>
                <Dialog open={isAddingKey} onOpenChange={(open) => {
                  setIsAddingKey(open);
                  if (!open) setNewKeyValue(null);
                }}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-api-key">
                      <Plus className="h-4 w-4 mr-2" />
                      Create API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    {newKeyValue ? (
                      <>
                        <DialogHeader>
                          <DialogTitle>API Key Created</DialogTitle>
                          <DialogDescription>
                            Make sure to copy your API key now. You won't be able to see it again!
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center justify-between gap-2">
                              <code className="text-sm font-mono break-all">
                                {showKey ? newKeyValue : "gtvs_" + "•".repeat(48)}
                              </code>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setShowKey(!showKey)}
                                >
                                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(newKeyValue)}
                                  data-testid="button-copy-key"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Store this key securely. It provides access to your API.
                          </p>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => {
                            setIsAddingKey(false);
                            setNewKeyValue(null);
                          }}>
                            Done
                          </Button>
                        </DialogFooter>
                      </>
                    ) : (
                      <>
                        <DialogHeader>
                          <DialogTitle>Create API Key</DialogTitle>
                          <DialogDescription>
                            Generate a new API key for programmatic access
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit((data) => {
                            setNewKeyValue("gtvs_" + "abcd1234efgh5678ijkl9012mnop3456");
                          })} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Key Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., Production API Key" data-testid="input-api-key-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="rateLimit"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Rate Limit (requests/hour)</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" data-testid="input-api-rate-limit" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setIsAddingKey(false)}>Cancel</Button>
                              <Button type="submit" data-testid="button-generate-key">
                                Generate Key
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No API keys created yet</p>
                <p className="text-sm">Create an API key to start integrating</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5" />
                    Webhooks
                  </CardTitle>
                  <CardDescription>
                    Receive real-time notifications when events occur
                  </CardDescription>
                </div>
                <Button data-testid="button-add-webhook">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Webhook
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No webhooks configured</p>
                <p className="text-sm">Add a webhook to receive event notifications</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Events</CardTitle>
              <CardDescription>Events you can subscribe to via webhooks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { event: "bid.submitted", description: "When a new bid is submitted" },
                  { event: "bid.evaluated", description: "When bid evaluation completes" },
                  { event: "document.verified", description: "When a document is verified" },
                  { event: "document.rejected", description: "When a document is rejected" },
                  { event: "compliance.passed", description: "When compliance check passes" },
                  { event: "compliance.failed", description: "When compliance check fails" },
                ].map((item) => (
                  <div key={item.event} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Badge variant="outline" className="font-mono text-xs">{item.event}</Badge>
                    <span className="text-sm text-muted-foreground">{item.description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                API Reference
              </CardTitle>
              <CardDescription>
                Quick reference for available API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {API_DOCS.map((doc, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Badge variant={doc.method === "GET" ? "secondary" : "default"}>
                          {doc.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{doc.endpoint}</TableCell>
                      <TableCell className="text-muted-foreground">{doc.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>How to authenticate API requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Include your API key in the Authorization header:
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <code className="text-sm font-mono">
                  Authorization: Bearer gtvs_your_api_key_here
                </code>
              </div>
              <p className="text-sm text-muted-foreground">
                Or use the X-API-Key header:
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <code className="text-sm font-mono">
                  X-API-Key: gtvs_your_api_key_here
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Example Request</CardTitle>
              <CardDescription>Submit a bid for evaluation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg overflow-x-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap">
{`curl -X POST https://api.globaltvs.com/v1/bids \\
  -H "Authorization: Bearer gtvs_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tender_id": "TENDER-001",
    "vendor_id": "VENDOR-123",
    "bid_amount": 150000,
    "documents": [
      {
        "type": "tax_clearance",
        "file_url": "https://..."
      }
    ]
  }'`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
