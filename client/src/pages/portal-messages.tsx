import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { portalFetch, portalApi } from "@/lib/portalApi";
import { MessageSquare, Mail, Phone, ChevronDown, ChevronUp } from "lucide-react";

const channelIcons: Record<string, any> = {
  whatsapp: Phone,
  email: Mail,
  system: MessageSquare,
};

const channelColors: Record<string, string> = {
  whatsapp: "bg-green-500 text-white border-green-600",
  email: "bg-blue-500 text-white border-blue-600",
  system: "bg-gray-500 text-white border-gray-600",
};

export default function PortalMessages() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["portal", "messages"],
    queryFn: async () => {
      const res = await portalFetch("/api/portal/messages");
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await portalApi("POST", `/api/portal/messages/${messageId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "messages"] });
      queryClient.invalidateQueries({ queryKey: ["portal", "profile"] });
    },
  });

  const handleToggle = (msg: any) => {
    if (expandedId === msg.id) {
      setExpandedId(null);
    } else {
      setExpandedId(msg.id);
      if (!msg.readAt && !msg.isRead) {
        markReadMutation.mutate(msg.id);
      }
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground">Communication history and notifications.</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : !messages || messages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No messages yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {messages.map((msg: any) => {
              const isUnread = !msg.readAt && !msg.isRead;
              const isExpanded = expandedId === msg.id;
              const ChannelIcon = channelIcons[msg.channel] || MessageSquare;

              return (
                <Card
                  key={msg.id}
                  className={`hover-elevate cursor-pointer transition-colors ${isUnread ? "border-primary/30" : ""}`}
                  onClick={() => handleToggle(msg)}
                  data-testid={`card-message-${msg.id}`}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {isUnread && (
                        <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" data-testid={`unread-indicator-${msg.id}`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className={`text-sm truncate ${isUnread ? "font-bold" : "font-medium"}`}>
                              {msg.subject || "No Subject"}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={channelColors[msg.channel] || "bg-gray-500 text-white border-gray-600"}>
                              <ChannelIcon className="h-3 w-3 mr-1" />
                              {(msg.channel || "system").charAt(0).toUpperCase() + (msg.channel || "system").slice(1)}
                            </Badge>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {!isExpanded && (
                          <p className="text-sm text-muted-foreground truncate">
                            {msg.body?.substring(0, 120) || "No content"}
                          </p>
                        )}

                        {isExpanded && (
                          <div className="mt-2 text-sm whitespace-pre-wrap" data-testid={`message-body-${msg.id}`}>
                            {msg.body || "No content"}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : msg.sentAt ? new Date(msg.sentAt).toLocaleString() : ""}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
