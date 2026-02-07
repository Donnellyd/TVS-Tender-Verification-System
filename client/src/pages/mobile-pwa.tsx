import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Smartphone,
  Wifi,
  WifiOff,
  Bell,
  Camera,
  Download,
  Share2,
  PlusSquare,
  CheckCircle2,
  Monitor,
  Chrome,
  MoreVertical,
  QrCode,
} from "lucide-react";
import { SiApple, SiAndroid } from "react-icons/si";

interface PwaSettings {
  pushNotifications: boolean;
  autoSync: boolean;
  offlineMode: boolean;
  cacheDuration: string;
}

const DEFAULT_SETTINGS: PwaSettings = {
  pushNotifications: true,
  autoSync: true,
  offlineMode: false,
  cacheDuration: "4",
};

const MANIFEST = {
  appName: "VeritasAI Procurement",
  shortName: "VeritasAI",
  description: "AI-Powered Procurement & Bid Evaluation Platform",
  themeColor: "#1e40af",
  backgroundColor: "#ffffff",
  displayMode: "standalone",
  orientation: "any",
};

const STATUS_ITEMS = [
  { label: "Installable", value: "Yes", variant: "default" as const },
  { label: "Offline Support", value: "Partial", variant: "secondary" as const },
  { label: "Push Notifications", value: "Available", variant: "default" as const },
  { label: "Camera Access", value: "Available", variant: "default" as const },
];

export default function MobilePwa() {
  const [settings, setSettings] = useState<PwaSettings>({ ...DEFAULT_SETTINGS });

  const updateSetting = <K extends keyof PwaSettings>(key: K, value: PwaSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <PageHeader
        title="Mobile App (PWA)"
        description="Configure Progressive Web App settings, view installation instructions, and manage offline capabilities."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-4 w-4" />
              Status & Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">PWA Capabilities</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_ITEMS.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-md border p-2" data-testid={`status-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
                    <span className="text-sm">{item.label}</span>
                    <Badge
                      variant={item.variant}
                      className={
                        item.value === "Partial"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 no-default-hover-elevate no-default-active-elevate"
                          : item.variant === "default"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 no-default-hover-elevate no-default-active-elevate"
                            : ""
                      }
                    >
                      {item.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Settings</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                </div>
                <Switch id="push-notifications" checked={settings.pushNotifications} onCheckedChange={(v) => updateSetting("pushNotifications", v)} data-testid="switch-push-notifications" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="auto-sync">Auto-sync when online</Label>
                </div>
                <Switch id="auto-sync" checked={settings.autoSync} onCheckedChange={(v) => updateSetting("autoSync", v)} data-testid="switch-auto-sync" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="offline-mode">Offline Mode</Label>
                </div>
                <Switch id="offline-mode" checked={settings.offlineMode} onCheckedChange={(v) => updateSetting("offlineMode", v)} data-testid="switch-offline-mode" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <Label>Data Cache Duration</Label>
                </div>
                <Select value={settings.cacheDuration} onValueChange={(v) => updateSetting("cacheDuration", v)}>
                  <SelectTrigger className="w-32" data-testid="select-cache-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-4 w-4" />
              Installation Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="android">
              <TabsList className="w-full">
                <TabsTrigger value="android" className="flex-1 gap-1" data-testid="tab-android">
                  <SiAndroid className="h-3.5 w-3.5" />
                  Android
                </TabsTrigger>
                <TabsTrigger value="ios" className="flex-1 gap-1" data-testid="tab-ios">
                  <SiApple className="h-3.5 w-3.5" />
                  iOS
                </TabsTrigger>
                <TabsTrigger value="desktop" className="flex-1 gap-1" data-testid="tab-desktop">
                  <Monitor className="h-3.5 w-3.5" />
                  Desktop
                </TabsTrigger>
              </TabsList>

              <TabsContent value="android" className="mt-4 space-y-3">
                <Step num={1} icon={Chrome} text="Open the app in Google Chrome" />
                <Step num={2} icon={MoreVertical} text="Tap the three-dot menu in the top right" />
                <Step num={3} icon={PlusSquare} text='Select "Install App" or "Add to Home Screen"' />
                <Step num={4} icon={CheckCircle2} text='Tap "Install" to confirm' />
              </TabsContent>

              <TabsContent value="ios" className="mt-4 space-y-3">
                <Step num={1} icon={Chrome} text="Open the app in Safari" />
                <Step num={2} icon={Share2} text="Tap the Share button at the bottom" />
                <Step num={3} icon={PlusSquare} text='Scroll down and tap "Add to Home Screen"' />
                <Step num={4} icon={CheckCircle2} text='Tap "Add" in the top right to confirm' />
              </TabsContent>

              <TabsContent value="desktop" className="mt-4 space-y-3">
                <Step num={1} icon={Chrome} text="Open the app in Chrome or Edge" />
                <Step num={2} icon={Download} text="Click the install icon in the address bar" />
                <Step num={3} icon={PlusSquare} text='Click "Install" in the prompt' />
                <Step num={4} icon={CheckCircle2} text="The app will open in its own window" />
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="flex flex-col items-center gap-2">
              <div className="h-32 w-32 rounded-md border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground" data-testid="qr-code-placeholder">
                <QrCode className="h-10 w-10 mb-1" />
                <span className="text-xs text-center">Scan to open on mobile</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">App Manifest</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries({
              "App Name": MANIFEST.appName,
              "Short Name": MANIFEST.shortName,
              "Description": MANIFEST.description,
              "Theme Color": MANIFEST.themeColor,
              "Background Color": MANIFEST.backgroundColor,
              "Display Mode": MANIFEST.displayMode,
              "Orientation": MANIFEST.orientation,
            }).map(([label, value]) => (
              <div key={label} className="space-y-1" data-testid={`manifest-${label.toLowerCase().replace(/\s+/g, "-")}`}>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-sm font-mono truncate">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Step({ num, icon: Icon, text }: { num: number; icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
        {num}
      </div>
      <div className="flex items-center gap-2 pt-0.5">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm">{text}</span>
      </div>
    </div>
  );
}
