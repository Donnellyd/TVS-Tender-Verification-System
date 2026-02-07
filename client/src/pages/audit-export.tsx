import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableSkeleton } from "@/components/DataTableSkeleton";
import { Activity, CalendarDays, AlertTriangle, FileOutput, Download, FileJson, Search } from "lucide-react";

interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: string;
}

interface ExportRecord {
  id: string;
  format: string;
  count: number;
  exportedAt: string;
}

export default function AuditExport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("");
  const [sessionExports, setSessionExports] = useState<ExportRecord[]>([]);

  const { data: auditLogs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const filteredLogs = useMemo(() => {
    if (!auditLogs) return [];

    return auditLogs.filter((log) => {
      if (startDate && log.createdAt) {
        if (new Date(log.createdAt) < new Date(startDate)) return false;
      }
      if (endDate && log.createdAt) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(log.createdAt) > end) return false;
      }
      if (actionFilter !== "all" && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) {
        return false;
      }
      if (userFilter && log.userId && !log.userId.toLowerCase().includes(userFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [auditLogs, startDate, endDate, actionFilter, userFilter]);

  const stats = useMemo(() => {
    if (!auditLogs) return { total: 0, today: 0, critical: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = auditLogs.filter((log) => {
      if (!log.createdAt) return false;
      return new Date(log.createdAt) >= today;
    }).length;

    const criticalCount = auditLogs.filter((log) =>
      log.action.toLowerCase().includes("delete") || log.action.toLowerCase().includes("security")
    ).length;

    return { total: auditLogs.length, today: todayCount, critical: criticalCount };
  }, [auditLogs]);

  const actionBadgeVariant = (action: string) => {
    const lower = action.toLowerCase();
    if (lower.includes("create")) return "default" as const;
    if (lower.includes("update")) return "secondary" as const;
    if (lower.includes("delete")) return "destructive" as const;
    if (lower.includes("login") || lower.includes("auth")) return "outline" as const;
    if (lower.includes("export")) return "secondary" as const;
    return "outline" as const;
  };

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const formatDetails = (details?: Record<string, unknown>) => {
    if (!details) return "N/A";
    try {
      const entries = Object.entries(details).slice(0, 3);
      return entries.map(([key, val]) => `${key}: ${String(val)}`).join(", ");
    } catch {
      return "N/A";
    }
  };

  const generateExport = (format: "csv" | "json") => {
    const dataToExport = filteredLogs;
    let content: string;
    let mimeType: string;
    let extension: string;

    if (format === "csv") {
      const headers = ["Timestamp", "User", "Action", "Resource", "Details", "IP Address"];
      const rows = dataToExport.map((log) => [
        log.createdAt || "",
        log.userId || "",
        log.action,
        `${log.entityType}${log.entityId ? `:${log.entityId}` : ""}`,
        log.details ? JSON.stringify(log.details) : "",
        log.ipAddress || "",
      ]);
      content = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
      mimeType = "text/csv";
      extension = "csv";
    } else {
      content = JSON.stringify(dataToExport, null, 2);
      mimeType = "application/json";
      extension = "json";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-export-${new Date().toISOString().slice(0, 10)}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const exportRecord: ExportRecord = {
      id: crypto.randomUUID(),
      format: format.toUpperCase(),
      count: dataToExport.length,
      exportedAt: new Date().toISOString(),
    };
    setSessionExports((prev) => [exportRecord, ...prev]);
  };

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <PageHeader
        title="Audit Trail & Reports"
        description="View audit logs and export compliance reports"
      />

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">Start Date</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            data-testid="input-start-date"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">End Date</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            data-testid="input-end-date"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">Action Type</label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-40" data-testid="select-action-type">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="export">Export</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">User</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by user..."
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="pl-9 w-48"
              data-testid="input-user-filter"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Events" value={stats.total} icon={Activity} iconColor="blue" testId="stat-total-events" />
        <StatsCard title="Today's Events" value={stats.today} icon={CalendarDays} iconColor="green" testId="stat-today-events" />
        <StatsCard title="Critical Events" value={stats.critical} icon={AlertTriangle} iconColor="red" testId="stat-critical-events" />
        <StatsCard title="Exports Generated" value={sessionExports.length} icon={FileOutput} iconColor="purple" testId="stat-exports-generated" />
      </div>

      {isLoading && <DataTableSkeleton columns={6} rows={8} />}

      {!isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audit Log ({filteredLogs.length} events)</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground" data-testid="text-no-logs">
                  No audit logs found
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table data-testid="table-audit-logs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[160px]">Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead className="min-w-[200px]">Details</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id} data-testid={`row-audit-${log.id}`}>
                        <TableCell className="text-sm" data-testid={`td-timestamp-${log.id}`}>
                          {formatTimestamp(log.createdAt)}
                        </TableCell>
                        <TableCell data-testid={`td-user-${log.id}`}>
                          {log.userId || "System"}
                        </TableCell>
                        <TableCell data-testid={`td-action-${log.id}`}>
                          <Badge variant={actionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`td-resource-${log.id}`}>
                          {log.entityType}
                          {log.entityId && (
                            <span className="text-muted-foreground text-xs ml-1">#{log.entityId.slice(0, 8)}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate" data-testid={`td-details-${log.id}`}>
                          {formatDetails(log.details as Record<string, unknown>)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground" data-testid={`td-ip-${log.id}`}>
                          {log.ipAddress || "N/A"}
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileOutput className="h-4 w-4 text-muted-foreground" />
            Export Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export {filteredLogs.length} filtered audit log entries. Use the date range and filters above to narrow the export scope.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => generateExport("csv")} data-testid="button-export-csv">
              <Download className="h-4 w-4 mr-2" />
              Export as CSV
            </Button>
            <Button variant="outline" onClick={() => generateExport("json")} data-testid="button-export-json">
              <FileJson className="h-4 w-4 mr-2" />
              Export as JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {sessionExports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Exports (This Session)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table data-testid="table-recent-exports">
              <TableHeader>
                <TableRow>
                  <TableHead>Format</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Exported At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionExports.map((exp) => (
                  <TableRow key={exp.id} data-testid={`row-export-${exp.id}`}>
                    <TableCell>
                      <Badge variant="secondary">{exp.format}</Badge>
                    </TableCell>
                    <TableCell>{exp.count} events</TableCell>
                    <TableCell>{formatTimestamp(exp.exportedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
