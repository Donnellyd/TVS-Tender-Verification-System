import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableSkeleton } from "@/components/DataTableSkeleton";
import { FileSpreadsheet, Download, Eye } from "lucide-react";

type DataSource = "" | "vendors" | "tenders" | "submissions" | "compliance" | "audit" | "documents";

const dataSourceLabels: Record<string, string> = {
  vendors: "Vendors",
  tenders: "Tenders",
  submissions: "Submissions",
  compliance: "Compliance Checks",
  audit: "Audit Logs",
  documents: "Documents",
};

const columnsBySource: Record<string, string[]> = {
  vendors: ["name", "email", "phone", "contactPerson", "status", "bbbeeLevel", "registrationNumber"],
  tenders: ["title", "tenderNumber", "status", "closingDate", "estimatedValue", "category", "municipality"],
  submissions: ["vendorName", "bidAmount", "status", "complianceResult", "totalScore", "submissionDate"],
  compliance: ["vendorName", "checkType", "result", "issueDate", "expiryDate"],
  audit: ["action", "entityType", "userId", "ipAddress", "createdAt"],
  documents: ["name", "type", "status", "uploadedAt", "size"],
};

const apiEndpoints: Record<string, string> = {
  vendors: "/api/vendors",
  tenders: "/api/tenders",
  submissions: "/api/submissions",
  compliance: "/api/compliance",
  audit: "/api/audit-logs",
  documents: "/api/documents",
};

export default function ReportBuilder() {
  const [reportName, setReportName] = useState("");
  const [dataSource, setDataSource] = useState<DataSource>("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [outputFormat, setOutputFormat] = useState("csv");

  const endpoint = dataSource ? apiEndpoints[dataSource] : "";

  const { data: rawData, isLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: [endpoint],
    enabled: !!endpoint,
  });

  const handleDataSourceChange = (value: string) => {
    setDataSource(value as DataSource);
    setSelectedColumns([]);
    setStatusFilter("all");
  };

  const toggleColumn = (col: string) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const toggleAllColumns = () => {
    if (!dataSource) return;
    const available = columnsBySource[dataSource] || [];
    if (selectedColumns.length === available.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns([...available]);
    }
  };

  const filteredData = useMemo(() => {
    if (!rawData) return [];
    let result = [...rawData];

    if (statusFilter !== "all") {
      result = result.filter((row) => {
        const status = String(row.status || row.result || "").toLowerCase();
        return status.includes(statusFilter.toLowerCase());
      });
    }

    if (dateFrom) {
      result = result.filter((row) => {
        const dateField = row.createdAt || row.closingDate || row.submissionDate || row.issueDate || row.uploadedAt;
        if (!dateField) return true;
        return new Date(String(dateField)) >= new Date(dateFrom);
      });
    }

    if (dateTo) {
      result = result.filter((row) => {
        const dateField = row.createdAt || row.closingDate || row.submissionDate || row.issueDate || row.uploadedAt;
        if (!dateField) return true;
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        return new Date(String(dateField)) <= end;
      });
    }

    return result;
  }, [rawData, statusFilter, dateFrom, dateTo]);

  const previewData = useMemo(() => {
    if (!filteredData.length || !selectedColumns.length) return [];
    return filteredData.slice(0, 10).map((row) => {
      const mapped: Record<string, string> = {};
      selectedColumns.forEach((col) => {
        const val = row[col];
        mapped[col] = val !== undefined && val !== null ? String(val) : "N/A";
      });
      return mapped;
    });
  }, [filteredData, selectedColumns]);

  const generateReport = () => {
    if (!filteredData.length || !selectedColumns.length) return;

    const exportRows = filteredData.map((row) => {
      const mapped: Record<string, string> = {};
      selectedColumns.forEach((col) => {
        mapped[col] = row[col] !== undefined && row[col] !== null ? String(row[col]) : "";
      });
      return mapped;
    });

    let content: string;
    let mimeType: string;
    let extension: string;
    const fileName = reportName || `report-${dataSource}`;

    if (outputFormat === "csv") {
      const headers = selectedColumns.join(",");
      const rows = exportRows.map((r) =>
        selectedColumns.map((col) => `"${String(r[col]).replace(/"/g, '""')}"`).join(",")
      );
      content = [headers, ...rows].join("\n");
      mimeType = "text/csv";
      extension = "csv";
    } else if (outputFormat === "json") {
      content = JSON.stringify(exportRows, null, 2);
      mimeType = "application/json";
      extension = "json";
    } else {
      const lines = [
        `Report: ${reportName || "Untitled Report"}`,
        `Data Source: ${dataSourceLabels[dataSource] || dataSource}`,
        `Generated: ${new Date().toLocaleString("en-ZA")}`,
        `Total Records: ${exportRows.length}`,
        `Columns: ${selectedColumns.join(", ")}`,
        "",
        "--- Summary ---",
        "",
      ];
      exportRows.forEach((row, i) => {
        lines.push(`Record ${i + 1}:`);
        selectedColumns.forEach((col) => {
          lines.push(`  ${col}: ${row[col]}`);
        });
        lines.push("");
      });
      content = lines.join("\n");
      mimeType = "text/plain";
      extension = "txt";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const availableColumns = dataSource ? columnsBySource[dataSource] || [] : [];

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <PageHeader
        title="Report Builder"
        description="Create custom reports by selecting data sources, columns, filters, and output formats"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="report-name">Report Name</Label>
              <Input
                id="report-name"
                placeholder="Enter report name..."
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                data-testid="input-report-name"
              />
            </div>

            <div className="space-y-2">
              <Label>Data Source</Label>
              <Select value={dataSource} onValueChange={handleDataSourceChange}>
                <SelectTrigger data-testid="select-data-source">
                  <SelectValue placeholder="Select a data source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendors">Vendors</SelectItem>
                  <SelectItem value="tenders">Tenders</SelectItem>
                  <SelectItem value="submissions">Submissions</SelectItem>
                  <SelectItem value="compliance">Compliance Checks</SelectItem>
                  <SelectItem value="audit">Audit Logs</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dataSource && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Columns</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAllColumns}
                    data-testid="button-toggle-all-columns"
                  >
                    {selectedColumns.length === availableColumns.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {availableColumns.map((col) => (
                    <div key={col} className="flex items-center gap-2">
                      <Checkbox
                        id={`col-${col}`}
                        checked={selectedColumns.includes(col)}
                        onCheckedChange={() => toggleColumn(col)}
                        data-testid={`checkbox-col-${col}`}
                      />
                      <Label htmlFor={`col-${col}`} className="text-sm font-normal cursor-pointer">
                        {col}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dataSource && (
              <div className="space-y-3">
                <Label>Filters</Label>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger data-testid="select-status-filter">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">From</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      data-testid="input-date-from"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">To</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      data-testid="input-date-to"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Output Format</Label>
              <RadioGroup value={outputFormat} onValueChange={setOutputFormat} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="csv" id="format-csv" data-testid="radio-format-csv" />
                  <Label htmlFor="format-csv" className="font-normal cursor-pointer">CSV</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="json" id="format-json" data-testid="radio-format-json" />
                  <Label htmlFor="format-json" className="font-normal cursor-pointer">JSON</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="pdf" id="format-pdf" data-testid="radio-format-pdf" />
                  <Label htmlFor="format-pdf" className="font-normal cursor-pointer">PDF Summary</Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              onClick={generateReport}
              disabled={!dataSource || selectedColumns.length === 0}
              className="w-full"
              data-testid="button-generate-report"
            >
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4 text-muted-foreground" />
              Report Preview
              {previewData.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-auto">
                  Showing {previewData.length} of {filteredData.length} rows
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!dataSource && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground" data-testid="text-no-source">
                  Select a data source to preview
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a data source and columns from the configuration panel
                </p>
              </div>
            )}

            {dataSource && isLoading && <DataTableSkeleton columns={3} rows={5} />}

            {dataSource && !isLoading && selectedColumns.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground" data-testid="text-no-columns">
                  Select columns to see a preview
                </p>
              </div>
            )}

            {dataSource && !isLoading && selectedColumns.length > 0 && previewData.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground" data-testid="text-no-data">
                  No data matches the current filters
                </p>
              </div>
            )}

            {previewData.length > 0 && (
              <div className="overflow-x-auto">
                <Table data-testid="table-report-preview">
                  <TableHeader>
                    <TableRow>
                      {selectedColumns.map((col) => (
                        <TableHead key={col} className="min-w-[120px]">{col}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, i) => (
                      <TableRow key={i} data-testid={`row-preview-${i}`}>
                        {selectedColumns.map((col) => (
                          <TableCell key={col} className="text-sm">
                            {row[col]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
