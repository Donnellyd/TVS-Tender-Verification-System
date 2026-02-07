import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO } from "date-fns";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, CalendarDays, List, Clock, FileText } from "lucide-react";

interface Tender {
  id: string;
  title: string;
  tenderNumber: string;
  status: string;
  closingDate?: string;
  evaluationDate?: string;
  category?: string;
  municipality?: string;
}

interface CalendarEvent {
  id: string;
  tenderId: string;
  title: string;
  tenderNumber: string;
  date: Date;
  eventType: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-400",
  published: "bg-blue-500",
  evaluation: "bg-amber-500",
  awarded: "bg-green-500",
  closed: "bg-red-500",
};

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  published: "default",
  evaluation: "outline",
  awarded: "default",
  closed: "destructive",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TenderCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "list">("month");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMunicipality, setFilterMunicipality] = useState("all");

  const { data: tenders, isLoading } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });

  const events = useMemo(() => {
    if (!tenders) return [];
    const result: CalendarEvent[] = [];
    for (const tender of tenders) {
      if (filterStatus !== "all" && tender.status !== filterStatus) continue;
      if (filterCategory !== "all" && tender.category !== filterCategory) continue;
      if (filterMunicipality !== "all" && tender.municipality !== filterMunicipality) continue;

      if (tender.closingDate) {
        try {
          result.push({
            id: `${tender.id}-closing`,
            tenderId: tender.id,
            title: tender.title,
            tenderNumber: tender.tenderNumber,
            date: parseISO(tender.closingDate),
            eventType: "Closing Date",
            status: tender.status,
          });
        } catch { /* skip invalid dates */ }
      }
      if (tender.evaluationDate) {
        try {
          result.push({
            id: `${tender.id}-evaluation`,
            tenderId: tender.id,
            title: tender.title,
            tenderNumber: tender.tenderNumber,
            date: parseISO(tender.evaluationDate),
            eventType: "Evaluation Deadline",
            status: tender.status,
          });
        } catch { /* skip invalid dates */ }
      }
    }
    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [tenders, filterStatus, filterCategory, filterMunicipality]);

  const categories = useMemo(() => {
    if (!tenders) return [];
    return Array.from(new Set(tenders.map((t) => t.category).filter(Boolean))) as string[];
  }, [tenders]);

  const municipalities = useMemo(() => {
    if (!tenders) return [];
    return Array.from(new Set(tenders.map((t) => t.municipality).filter(Boolean))) as string[];
  }, [tenders]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = new Date(day.getTime() + 86400000);
    }
    return days;
  }, [currentMonth]);

  const getEventsForDay = (day: Date) => events.filter((e) => isSameDay(e.date, day));

  const listEvents = useMemo(() => {
    const now = new Date();
    const upcoming = events.filter((e) => e.date >= now);
    const grouped: Record<string, CalendarEvent[]> = {};
    for (const event of upcoming) {
      const weekStart = startOfWeek(event.date);
      const key = format(weekStart, "yyyy-MM-dd");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(event);
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, evts]) => ({
        weekLabel: `Week of ${format(parseISO(key), "MMM d, yyyy")}`,
        events: evts,
      }));
  }, [events]);

  const goToToday = () => setCurrentMonth(new Date());
  const goPrev = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goNext = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <PageHeader
        title="Tender Calendar"
        description="View tender deadlines, events, and milestones"
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("month")}
            data-testid="button-view-month"
          >
            <CalendarDays className="h-4 w-4 mr-1" />
            Month
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            data-testid="button-view-list"
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
        </div>

        <Select value={filterMunicipality} onValueChange={setFilterMunicipality}>
          <SelectTrigger className="w-[180px]" data-testid="select-municipality-filter">
            <SelectValue placeholder="Municipality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Municipalities</SelectItem>
            {municipalities.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="evaluation">Evaluation</SelectItem>
            <SelectItem value="awarded">Awarded</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px]" data-testid="select-category-filter">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">Loading calendar data...</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && viewMode === "month" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goPrev} data-testid="button-prev-month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-base" data-testid="text-current-month">
                {format(currentMonth, "MMMM yyyy")}
              </CardTitle>
              <Button variant="outline" size="icon" onClick={goNext} data-testid="button-next-month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday} data-testid="button-today">
              Today
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-visible">
              {WEEKDAYS.map((day) => (
                <div key={day} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const inMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);
                return (
                  <div
                    key={idx}
                    className={`bg-background p-1.5 min-h-[80px] ${!inMonth ? "opacity-40" : ""} ${today ? "ring-2 ring-primary ring-inset" : ""}`}
                    data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                  >
                    <div className="text-xs text-right mb-1">
                      <span className={today ? "font-bold text-primary" : "text-muted-foreground"}>
                        {format(day, "d")}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((event) => (
                        <Popover key={event.id}>
                          <PopoverTrigger asChild>
                            <button
                              className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate text-white ${STATUS_COLORS[event.status] || "bg-gray-400"}`}
                              data-testid={`event-badge-${event.id}`}
                            >
                              {event.title}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-3" align="start">
                            <div className="space-y-2">
                              <p className="font-medium text-sm" data-testid={`popover-title-${event.id}`}>{event.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <FileText className="h-3 w-3" />
                                {event.tenderNumber}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {event.eventType}: {format(event.date, "PPP")}
                              </div>
                              <Badge variant={STATUS_BADGE_VARIANT[event.status] || "outline"} data-testid={`popover-status-${event.id}`}>
                                {event.status}
                              </Badge>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-muted-foreground px-1">
                          +{dayEvents.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && viewMode === "list" && (
        <div className="space-y-6">
          {listEvents.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground" data-testid="text-no-events">
                  No upcoming events
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  There are no upcoming tender events matching the current filters
                </p>
              </CardContent>
            </Card>
          )}
          {listEvents.map((group) => (
            <div key={group.weekLabel} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground" data-testid={`text-week-${group.weekLabel}`}>
                {group.weekLabel}
              </h3>
              <div className="space-y-2">
                {group.events.map((event) => (
                  <Card key={event.id} data-testid={`list-event-${event.id}`}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3 px-4">
                      <div className="flex-1 min-w-[200px]">
                        <p className="font-medium text-sm" data-testid={`list-event-title-${event.id}`}>{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.tenderNumber}</p>
                      </div>
                      <Badge variant="outline" data-testid={`list-event-type-${event.id}`}>
                        {event.eventType}
                      </Badge>
                      <span className="text-sm text-muted-foreground" data-testid={`list-event-date-${event.id}`}>
                        {format(event.date, "PPP")}
                      </span>
                      <Badge variant={STATUS_BADGE_VARIANT[event.status] || "outline"} data-testid={`list-event-status-${event.id}`}>
                        {event.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}