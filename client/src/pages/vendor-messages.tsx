import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MessageSquare, Phone, Mail, Search, Send, ChevronDown, ChevronUp, Clock, CheckCircle2, AlertCircle, Filter } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

interface VendorMessage {
  id: string;
  vendorId: string;
  tenderId: string | null;
  tenantId: string | null;
  channel: string;
  direction: string;
  subject: string | null;
  body: string;
  recipientPhone: string | null;
  recipientEmail: string | null;
  senderName: string | null;
  triggerType: string | null;
  status: string;
  externalId: string | null;
  readByVendor: boolean;
  readByAdmin: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface Vendor {
  id: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  whatsappPhone: string | null;
  portalRegistered: boolean;
}

export default function VendorMessages() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({ vendorId: "", channel: "whatsapp", subject: "", body: "" });

  const { data: messages = [], isLoading } = useQuery<VendorMessage[]>({
    queryKey: ["/api/vendor-messages"],
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const sendMutation = useMutation({
    mutationFn: async (data: { vendorId: string; channel: string; subject: string; body: string }) => {
      const res = await apiRequest("POST", "/api/vendor-messages/send", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Message sent successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-messages"] });
      setSendDialogOpen(false);
      setNewMessage({ vendorId: "", channel: "whatsapp", subject: "", body: "" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to send message", description: err.message, variant: "destructive" });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await apiRequest("POST", `/api/vendor-messages/${messageId}/read-admin`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-messages"] });
    },
  });

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = searchQuery === "" || 
      msg.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.senderName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = channelFilter === "all" || msg.channel === channelFilter;
    return matchesSearch && matchesChannel;
  });

  const getVendorName = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.companyName || "Unknown Vendor";
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "whatsapp": return <Phone className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed": return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const unreadCount = messages.filter(m => !m.readByAdmin).length;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <PageHeader 
        title="Vendor Messages" 
        description={`Message tracking and communication with vendors${unreadCount > 0 ? ` - ${unreadCount} unread` : ""}`}
        moduleId="vendors"
      />

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between flex-wrap">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="input-search-messages"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-40" data-testid="select-channel-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-send-message">
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Message to Vendor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={newMessage.vendorId} onValueChange={(v) => setNewMessage(prev => ({ ...prev, vendorId: v }))}>
                <SelectTrigger data-testid="select-vendor">
                  <SelectValue placeholder="Select vendor..." />
                </SelectTrigger>
                <SelectContent>
                  {vendors.filter(v => v.portalRegistered).map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newMessage.channel} onValueChange={(v) => setNewMessage(prev => ({ ...prev, channel: v }))}>
                <SelectTrigger data-testid="select-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
              <Input
                data-testid="input-message-subject"
                placeholder="Subject (optional)"
                value={newMessage.subject}
                onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
              />
              <Textarea
                data-testid="input-message-body"
                placeholder="Message body..."
                value={newMessage.body}
                onChange={(e) => setNewMessage(prev => ({ ...prev, body: e.target.value }))}
                className="min-h-[120px]"
              />
              <Button
                data-testid="button-confirm-send"
                onClick={() => sendMutation.mutate(newMessage)}
                disabled={!newMessage.vendorId || !newMessage.body || sendMutation.isPending}
                className="w-full"
              >
                {sendMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold" data-testid="text-total-messages">{messages.length}</div>
            <p className="text-sm text-muted-foreground">Total Messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600" data-testid="text-unread-count">{unreadCount}</div>
            <p className="text-sm text-muted-foreground">Unread</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600" data-testid="text-whatsapp-count">{messages.filter(m => m.channel === "whatsapp").length}</div>
            <p className="text-sm text-muted-foreground">WhatsApp</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600" data-testid="text-email-count">{messages.filter(m => m.channel === "email").length}</div>
            <p className="text-sm text-muted-foreground">Email</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Loading messages...</CardContent>
        </Card>
      ) : filteredMessages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No messages yet</h3>
            <p className="text-muted-foreground mt-1">Messages from vendor portal interactions will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredMessages.map(msg => {
            const isExpanded = expandedId === msg.id;
            return (
              <Card 
                key={msg.id} 
                className={`cursor-pointer transition-colors ${!msg.readByAdmin ? "border-l-4 border-l-primary" : ""}`}
                data-testid={`card-message-${msg.id}`}
              >
                <CardContent
                  className="py-4"
                  onClick={() => {
                    setExpandedId(isExpanded ? null : msg.id);
                    if (!msg.readByAdmin) {
                      markReadMutation.mutate(msg.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center gap-1">
                        {getChannelIcon(msg.channel)}
                        <Badge variant="secondary" className="text-xs">
                          {msg.channel}
                        </Badge>
                      </div>
                      <Badge variant={msg.direction === "outbound" ? "default" : "outline"} className="text-xs">
                        {msg.direction === "outbound" ? "Sent" : "Received"}
                      </Badge>
                      {!msg.readByAdmin && (
                        <Badge variant="destructive" className="text-xs">New</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                      {getStatusIcon(msg.status)}
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{getVendorName(msg.vendorId)}</span>
                      {msg.triggerType && (
                        <Badge variant="outline" className="text-xs">{msg.triggerType.replace(/_/g, " ")}</Badge>
                      )}
                    </div>
                    {msg.subject && <p className="text-sm font-medium mt-1">{msg.subject}</p>}
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{msg.body}</p>
                  </div>
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                        {msg.recipientPhone && <span>Phone: {msg.recipientPhone}</span>}
                        {msg.recipientEmail && <span>Email: {msg.recipientEmail}</span>}
                        {msg.externalId && <span>ID: {msg.externalId}</span>}
                        <span>Read by vendor: {msg.readByVendor ? "Yes" : "No"}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
