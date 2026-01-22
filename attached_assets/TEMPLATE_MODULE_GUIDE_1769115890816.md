# Fleet ERP Module Template Guide

## Overview
This guide provides reusable templates and patterns extracted from the Resource Planning module. Use these templates to create new modules with consistent styling, navigation, CRUD operations, and analytics.

## Quick Start Checklist

### Creating a New Module in 5 Steps:

1. **Copy Template Files**
   - `template-module-layout.tsx` → `your-module-layout.tsx`
   - `template-module-dashboard.tsx` → `your-module-dashboard.tsx`
   - `template-module-crud.tsx` → `your-module-crud.tsx`
   - `template-module-analytics.tsx` → `your-module-analytics.tsx`

2. **Find & Replace Module Name**
   - Replace `TemplateModule` with `YourModule`
   - Replace `template-module` with `your-module`
   - Replace `Template Module` with `Your Module Name`

3. **Customize Colors & Icons**
   - Update color scheme (see Color Schemes section)
   - Change icons from lucide-react
   - Modify navigation items

4. **Update Data Models**
   - Define your schema in `shared/schema.ts`
   - Update API endpoints in `server/routes.ts`
   - Replace form fields with your data structure

5. **Register Routes**
   - Add routes to `client/src/App.tsx`
   - Update sidebar navigation if needed

---

## Color Schemes & Theming

### Standard Module Color Palette

Use these color patterns for consistent module branding:

#### Background Colors for Cards/Icons
```tsx
// Blue (Primary/Dashboard)
"bg-blue-50 text-blue-700"          // Light mode
"dark:bg-blue-900/20 dark:text-blue-300" // Dark mode

// Green (Success/Active)
"bg-green-50 text-green-700"
"dark:bg-green-900/20 dark:text-green-300"

// Orange (Warning/Moderate)
"bg-orange-50 text-orange-700"
"dark:bg-orange-900/20 dark:text-orange-300"

// Red (Error/Critical)
"bg-red-50 text-red-700"
"dark:bg-red-900/20 dark:text-red-300"

// Purple (Secondary)
"bg-purple-50 text-purple-700"
"dark:bg-purple-900/20 dark:text-purple-300"

// Teal (Tertiary)
"bg-teal-50 text-teal-700"
"dark:bg-teal-900/20 dark:text-teal-300"

// Indigo (Accent)
"bg-indigo-50 text-indigo-700"
"dark:bg-indigo-900/20 dark:text-indigo-300"
```

#### Solid Colors for Badges/Buttons
```tsx
// Status Badges
"bg-green-500 text-white"    // Active/Success
"bg-orange-500 text-white"   // Warning/Pending
"bg-red-500 text-white"      // Error/Critical
"bg-blue-500 text-white"     // Info/Default
"bg-gray-500 text-white"     // Disabled/Inactive
```

#### Progress Bar Colors
```tsx
const getProgressColor = (value: number) => {
  if (value >= 90) return 'bg-green-500';
  if (value >= 70) return 'bg-yellow-500';
  if (value >= 50) return 'bg-orange-500';
  return 'bg-red-500';
};
```

### Badge Utility Functions

```tsx
// Status badges
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active': return 'default';
    case 'pending': return 'secondary';
    case 'completed': return 'outline';
    case 'cancelled': return 'destructive';
    default: return 'outline';
  }
};

// Priority badges
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-500 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-blue-500 text-white';
    case 'low': return 'bg-gray-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

// Utilization status
const getUtilizationColor = (status: string) => {
  switch (status) {
    case 'optimal': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    case 'moderate': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    case 'underutilized': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
  }
};
```

---

## Layout Pattern

### Top Navigation Header with Logo

```tsx
<header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
  <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <YourIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            Module Name
          </span>
        </div>
        
        <nav className="hidden md:flex space-x-1 ml-8">
          <Link href="/your-module/dashboard">
            <Button variant={currentPage === "dashboard" ? "default" : "ghost"}>
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          {/* Add more nav items */}
        </nav>
      </div>

      <Button variant="ghost" onClick={handleLogout}>
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </div>
  </div>
</header>
```

### Alternative: Sidebar + Header Layout (Fleet Style)

```tsx
<div className="min-h-screen flex bg-background">
  <Sidebar />
  
  <main className="flex-1 ml-64">
    <header className="bg-card border-b border-border p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Page Title</h2>
          <p className="text-muted-foreground mt-1">Page description</p>
        </div>
        <Button onClick={handleAction}>
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>
    </header>

    <div className="p-6">
      {/* Page content */}
    </div>
  </main>
</div>
```

---

## Stats Dashboard Pattern

### 4-Column Stats Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {stats.map((stat, index) => (
    <Card key={index}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {stat.title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {stat.value}
            </p>
          </div>
          <div className={`${stat.color} p-3 rounded-lg`}>
            <stat.icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

### Stats with shadcn Card Components (Fleet Style)

```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
    <Car className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold" data-testid="stat-total">
      {stats.total}
    </div>
    <p className="text-xs text-muted-foreground">In fleet</p>
  </CardContent>
</Card>
```

---

## CRUD Pattern

### Table with Edit Icons

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-12"></TableHead>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map((item) => (
      <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
        <TableCell>
          <button
            onClick={() => handleEdit(item)}
            className="hover:opacity-80 transition-opacity"
            data-testid={`button-edit-${item.id}`}
            aria-label="Edit item"
          >
            <FilledPencilIcon />
          </button>
        </TableCell>
        <TableCell className="font-medium">
          {item.name}
        </TableCell>
        <TableCell>
          <Badge variant={getStatusBadge(item.status)}>
            {item.status}
          </Badge>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Create/Edit Dialog with Sticky Footer

```tsx
<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <DialogContent className="max-w-2xl flex flex-col max-h-[85vh]">
    <DialogHeader>
      <DialogTitle>
        {editing ? 'Edit Item' : 'Add New Item'}
      </DialogTitle>
      <DialogDescription>
        {editing ? 'Update item details' : 'Enter item information'}
      </DialogDescription>
    </DialogHeader>

    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="grid gap-4">
        {/* Form fields */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            data-testid="input-name"
          />
        </div>
      </div>
    </div>

    <DialogFooter className="sticky bottom-0 bg-background border-t px-6 py-4 mt-auto">
      <Button variant="outline" onClick={() => setDialogOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSave} data-testid="button-save">
        {editing ? 'Update' : 'Create'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### State Management for CRUD

```tsx
const [dialogOpen, setDialogOpen] = useState(false);
const [editingItem, setEditingItem] = useState<any>(null);
const [formData, setFormData] = useState({
  name: "",
  status: "active",
  // ... other fields
});

const createMutation = useMutation({
  mutationFn: async (data: any) => {
    return await apiRequest("/api/items", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/items"] });
    toast({ title: "Success", description: "Item created successfully" });
    setDialogOpen(false);
    resetForm();
  },
});

const updateMutation = useMutation({
  mutationFn: async ({ id, data }: { id: string; data: any }) => {
    return await apiRequest(`/api/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/items"] });
    toast({ title: "Success", description: "Item updated successfully" });
    setDialogOpen(false);
    setEditingItem(null);
    resetForm();
  },
});

const handleSubmit = () => {
  if (editingItem) {
    updateMutation.mutate({ id: editingItem.id, data: formData });
  } else {
    createMutation.mutate(formData);
  }
};
```

---

## Filters Pattern

```tsx
<Card className="mb-6">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Filter className="h-5 w-5" />
      Filters
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
          data-testid="input-search"
        />
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger data-testid="select-status">
          <SelectValue placeholder="Filter by Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      {(searchTerm || statusFilter) && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="flex items-center gap-2"
          data-testid="button-clear-filters"
        >
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  </CardContent>
</Card>
```

---

## Tabs Pattern (Analytics/Configuration)

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
  <TabsList>
    <TabsTrigger value="overview" className="flex items-center space-x-2" data-testid="tab-overview">
      <BarChart3 className="w-4 h-4" />
      <span>Overview</span>
    </TabsTrigger>
    <TabsTrigger value="analytics" className="flex items-center space-x-2" data-testid="tab-analytics">
      <TrendingUp className="w-4 h-4" />
      <span>Analytics</span>
    </TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    <OverviewComponent />
  </TabsContent>

  <TabsContent value="analytics">
    <AnalyticsComponent />
  </TabsContent>
</Tabs>
```

---

## Progress Bars & Utilization

### Simple Progress Bar

```tsx
<div className="space-y-1">
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-600 dark:text-gray-400">Progress</span>
    <span className="font-medium text-gray-900 dark:text-white">
      {percentage}%
    </span>
  </div>
  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
    <div 
      className={`h-full ${getProgressColor(percentage)} transition-all`}
      style={{ width: `${Math.min(percentage, 100)}%` }}
    />
  </div>
</div>
```

### shadcn Progress Component

```tsx
import { Progress } from "@/components/ui/progress";

<Progress value={percentage} className="h-2" />
```

---

## Empty States

```tsx
{items.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-12">
    <Icon className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="text-lg font-medium text-foreground mb-2">No items found</h3>
    <p className="text-muted-foreground text-center mb-4">
      Add items to get started
    </p>
    <Button onClick={handleAdd}>
      <Plus className="h-4 w-4 mr-2" />
      Add Item
    </Button>
  </div>
) : (
  // Display items
)}
```

---

## Quick Actions Pattern

```tsx
<Card>
  <CardHeader>
    <CardTitle>Quick Actions</CardTitle>
    <CardDescription>Common tasks and operations</CardDescription>
  </CardHeader>
  <CardContent className="space-y-2">
    <Link href="/module/action1">
      <Button variant="outline" className="w-full justify-start" data-testid="action-1">
        <Icon className="w-4 h-4 mr-2" />
        Action 1
      </Button>
    </Link>
    <Link href="/module/action2">
      <Button variant="outline" className="w-full justify-start" data-testid="action-2">
        <Icon className="w-4 h-4 mr-2" />
        Action 2
      </Button>
    </Link>
  </CardContent>
</Card>
```

---

## Recent Activity List

```tsx
<Card>
  <CardHeader>
    <CardTitle>Recent Activity</CardTitle>
    <CardDescription>Latest updates and changes</CardDescription>
  </CardHeader>
  <CardContent>
    {activities && activities.length > 0 ? (
      <div className="space-y-3">
        {activities.slice(0, 5).map((activity: any) => (
          <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              {activity.status === 'pending' && <Clock className="w-4 h-4 text-orange-500" />}
              {activity.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {activity.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-gray-600 dark:text-gray-400">No recent activity</p>
    )}
  </CardContent>
</Card>
```

---

## Data Loading States

```tsx
const { data: items, isLoading } = useQuery({
  queryKey: ["/api/items"],
});

if (isLoading) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );
}
```

---

## Test IDs Convention

Always add `data-testid` attributes:

- **Buttons**: `button-{action}` (e.g., `button-add`, `button-save`, `button-edit-${id}`)
- **Inputs**: `input-{field}` (e.g., `input-name`, `input-email`)
- **Selects**: `select-{field}` (e.g., `select-status`, `select-category`)
- **Tabs**: `tab-{name}` (e.g., `tab-overview`, `tab-analytics`)
- **Cards**: `card-{type}` (e.g., `card-stats`, `card-total`)
- **Rows**: `row-{type}-${id}` (e.g., `row-item-${item.id}`)
- **Links**: `link-{destination}` (e.g., `link-dashboard`)

---

## Authentication Pattern

```tsx
useEffect(() => {
  fetch("/api/module/session")
    .then(res => res.json())
    .then(data => {
      if (!data.authenticated) {
        setLocation("/module/login");
      }
    });
}, [setLocation]);
```

---

## Common Imports

```tsx
// Layout & UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

// Icons
import { 
  Plus, Search, Filter, X, Home, Settings, LogOut, 
  BarChart3, Users, TrendingUp, AlertTriangle, CheckCircle2, 
  Clock, Pencil, Trash2 
} from "lucide-react";

// Routing & State
import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

// Utilities
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
```

---

## Summary

This guide covers all the major patterns used in the Fleet ERP system:
- Layout structures (top nav + sidebar)
- Color schemes and theming
- Stats dashboards with cards
- CRUD operations with dialogs
- Filters and search
- Tabs for multi-page modules
- Progress bars and utilization displays
- Empty states and loading states
- Quick actions and recent activity
- Badge utilities and status indicators

Copy the template files and follow the 5-step checklist to create a new module in minutes!
