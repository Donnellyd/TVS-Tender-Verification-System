import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Check, Clock, AlertCircle, Mail, Phone, Building2, Users, Pencil, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CountryLaunchStatus, CountryEnquiry } from "@shared/schema";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Check }> = {
  active: { label: "Active", color: "bg-green-500", icon: Check },
  enquiry_only: { label: "Enquiry Only", color: "bg-yellow-500", icon: Clock },
  coming_soon: { label: "Coming Soon", color: "bg-blue-500", icon: Clock },
  disabled: { label: "Disabled", color: "bg-gray-500", icon: AlertCircle },
};

const enquiryStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "New", variant: "default" },
  contacted: { label: "Contacted", variant: "secondary" },
  qualified: { label: "Qualified", variant: "outline" },
  closed: { label: "Closed", variant: "destructive" },
};

export default function CountryLaunchPage() {
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState<CountryLaunchStatus | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<CountryEnquiry | null>(null);
  const [enquiryDialogOpen, setEnquiryDialogOpen] = useState(false);

  const { data: countries, isLoading: countriesLoading } = useQuery<CountryLaunchStatus[]>({
    queryKey: ["/api/country-launch-status"],
  });

  const { data: enquiries, isLoading: enquiriesLoading } = useQuery<CountryEnquiry[]>({
    queryKey: ["/api/country-enquiries"],
  });

  const updateCountryMutation = useMutation({
    mutationFn: async ({ countryCode, data }: { countryCode: string; data: Partial<CountryLaunchStatus> }) => {
      return await apiRequest(`/api/country-launch-status/${countryCode}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/country-launch-status"] });
      setEditDialogOpen(false);
      toast({ title: "Country status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update country status", variant: "destructive" });
    },
  });

  const updateEnquiryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CountryEnquiry> }) => {
      return await apiRequest(`/api/country-enquiries/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/country-enquiries"] });
      setEnquiryDialogOpen(false);
      toast({ title: "Enquiry updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update enquiry", variant: "destructive" });
    },
  });

  const deleteEnquiryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/country-enquiries/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/country-enquiries"] });
      toast({ title: "Enquiry deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete enquiry", variant: "destructive" });
    },
  });

  const activeCountries = countries?.filter((c) => c.status === "active") || [];
  const enquiryCountries = countries?.filter((c) => c.status === "enquiry_only") || [];
  const newEnquiries = enquiries?.filter((e) => e.status === "new") || [];

  const groupedCountries = countries?.reduce((acc, country) => {
    if (!acc[country.region]) acc[country.region] = [];
    acc[country.region].push(country);
    return acc;
  }, {} as Record<string, CountryLaunchStatus[]>) || {};

  const handleEditCountry = (country: CountryLaunchStatus) => {
    setSelectedCountry(country);
    setEditDialogOpen(true);
  };

  const handleViewEnquiry = (enquiry: CountryEnquiry) => {
    setSelectedEnquiry(enquiry);
    setEnquiryDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Country Launch Management"
        description="Control which countries have active payment vs enquiry-only access"
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeCountries.length}</p>
                  <p className="text-sm text-muted-foreground">Active Countries</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{enquiryCountries.length}</p>
                  <p className="text-sm text-muted-foreground">Enquiry Only</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{enquiries?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Enquiries</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{newEnquiries.length}</p>
                  <p className="text-sm text-muted-foreground">New Enquiries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="countries" className="space-y-4">
          <TabsList>
            <TabsTrigger value="countries" data-testid="tab-countries">Countries</TabsTrigger>
            <TabsTrigger value="enquiries" data-testid="tab-enquiries">
              Enquiries
              {newEnquiries.length > 0 && (
                <Badge variant="destructive" className="ml-2">{newEnquiries.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="countries">
            <Card>
              <CardHeader>
                <CardTitle>Country Launch Status</CardTitle>
                <CardDescription>
                  Manage which countries have active payment gateways. Countries marked as "Enquiry Only" will show a contact form instead of payment options.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {countriesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading countries...</div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedCountries).map(([region, regionCountries]) => (
                      <div key={region}>
                        <h3 className="font-semibold text-lg mb-3">{region}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {regionCountries.map((country) => {
                            const config = statusConfig[country.status] || statusConfig.disabled;
                            return (
                              <div
                                key={country.countryCode}
                                className="flex items-center justify-between p-3 border rounded-lg hover-elevate cursor-pointer"
                                onClick={() => handleEditCountry(country)}
                                data-testid={`country-card-${country.countryCode}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="text-2xl">{country.countryCode}</div>
                                  <div>
                                    <p className="font-medium">{country.countryName}</p>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${config.color}`} />
                                      <span className="text-xs text-muted-foreground">{config.label}</span>
                                      {country.paymentGateway && (
                                        <Badge variant="outline" className="text-xs">
                                          {country.paymentGateway}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enquiries">
            <Card>
              <CardHeader>
                <CardTitle>Customer Enquiries</CardTitle>
                <CardDescription>
                  Enquiries from customers in countries without active payment gateways
                </CardDescription>
              </CardHeader>
              <CardContent>
                {enquiriesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading enquiries...</div>
                ) : enquiries?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No enquiries yet</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enquiries?.map((enquiry) => {
                        const statusInfo = enquiryStatusConfig[enquiry.status] || enquiryStatusConfig.new;
                        return (
                          <TableRow key={enquiry.id} data-testid={`enquiry-row-${enquiry.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{enquiry.companyName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p>{enquiry.contactName}</p>
                                <p className="text-sm text-muted-foreground">{enquiry.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{enquiry.countryCode}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{enquiry.interestedTier || "Not specified"}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                            </TableCell>
                            <TableCell>
                              {enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleDateString() : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleViewEnquiry(enquiry)}
                                  data-testid={`button-view-enquiry-${enquiry.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => deleteEnquiryMutation.mutate(enquiry.id)}
                                  data-testid={`button-delete-enquiry-${enquiry.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
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
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Country Status - {selectedCountry?.countryName}</DialogTitle>
            <DialogDescription>
              Update the launch status and payment configuration for this country
            </DialogDescription>
          </DialogHeader>
          {selectedCountry && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateCountryMutation.mutate({
                  countryCode: selectedCountry.countryCode,
                  data: {
                    status: formData.get("status") as string,
                    paymentGateway: formData.get("paymentGateway") as string || undefined,
                    currency: formData.get("currency") as string || undefined,
                    notes: formData.get("notes") as string || undefined,
                  },
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="status">Launch Status</Label>
                <Select name="status" defaultValue={selectedCountry.status}>
                  <SelectTrigger data-testid="select-country-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active - Full Payment Access</SelectItem>
                    <SelectItem value="enquiry_only">Enquiry Only - Contact Form</SelectItem>
                    <SelectItem value="coming_soon">Coming Soon</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentGateway">Payment Gateway</Label>
                <Select name="paymentGateway" defaultValue={selectedCountry.paymentGateway || ""}>
                  <SelectTrigger data-testid="select-payment-gateway">
                    <SelectValue placeholder="Select gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="yoco">Yoco (ZAR)</SelectItem>
                    <SelectItem value="paystack">Paystack (Africa)</SelectItem>
                    <SelectItem value="flutterwave">Flutterwave (Africa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  name="currency"
                  placeholder="e.g. ZAR, USD, KES"
                  defaultValue={selectedCountry.currency || ""}
                  data-testid="input-currency"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Internal notes about this country launch"
                  defaultValue={selectedCountry.notes || ""}
                  data-testid="textarea-notes"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCountryMutation.isPending} data-testid="button-save-country">
                  {updateCountryMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={enquiryDialogOpen} onOpenChange={setEnquiryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enquiry Details</DialogTitle>
            <DialogDescription>View and manage this customer enquiry</DialogDescription>
          </DialogHeader>
          {selectedEnquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Company</Label>
                  <p className="font-medium">{selectedEnquiry.companyName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact</Label>
                  <p className="font-medium">{selectedEnquiry.contactName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${selectedEnquiry.email}`} className="text-primary hover:underline">
                      {selectedEnquiry.email}
                    </a>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {selectedEnquiry.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Country</Label>
                  <p className="font-medium">{selectedEnquiry.countryCode}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Organization Type</Label>
                  <p className="font-medium">{selectedEnquiry.organizationType || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expected Users</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {selectedEnquiry.expectedUsers || "Not specified"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Interested Tier</Label>
                  <Badge variant="outline">{selectedEnquiry.interestedTier || "Not specified"}</Badge>
                </div>
              </div>
              {selectedEnquiry.message && (
                <div>
                  <Label className="text-muted-foreground">Message</Label>
                  <p className="mt-1 p-3 bg-muted rounded-lg">{selectedEnquiry.message}</p>
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  updateEnquiryMutation.mutate({
                    id: selectedEnquiry.id,
                    data: {
                      status: formData.get("status") as string,
                      notes: formData.get("notes") as string || undefined,
                    },
                  });
                }}
                className="space-y-4 pt-4 border-t"
              >
                <div className="space-y-2">
                  <Label htmlFor="enquiryStatus">Status</Label>
                  <Select name="status" defaultValue={selectedEnquiry.status}>
                    <SelectTrigger data-testid="select-enquiry-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enquiryNotes">Internal Notes</Label>
                  <Textarea
                    id="enquiryNotes"
                    name="notes"
                    placeholder="Add notes about follow-up, conversations, etc."
                    defaultValue={selectedEnquiry.notes || ""}
                    data-testid="textarea-enquiry-notes"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEnquiryDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateEnquiryMutation.isPending} data-testid="button-save-enquiry">
                    {updateEnquiryMutation.isPending ? "Saving..." : "Update Enquiry"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
