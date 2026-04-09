import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Building2, Bell, Star, Settings, LogOut,
  ShieldCheck,
} from "lucide-react";

type SidebarTab = "home" | "properties" | "alerts" | "reviews" | "settings";

interface AppSidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onSignOut: () => void;
  isLandlord: boolean;
  alertCount?: number;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

const landlordNav = [
  { id: "home" as const, icon: LayoutDashboard, label: "Dashboard" },
  { id: "properties" as const, icon: Building2, label: "Properties" },
  { id: "alerts" as const, icon: Bell, label: "Alerts" },
  { id: "reviews" as const, icon: Star, label: "Reviews" },
  { id: "settings" as const, icon: Settings, label: "Settings" },
];

const tenantNav = [
  { id: "home" as const, icon: LayoutDashboard, label: "Dashboard" },
  { id: "alerts" as const, icon: Bell, label: "Alerts" },
  { id: "reviews" as const, icon: Star, label: "Reviews" },
  { id: "settings" as const, icon: Settings, label: "Settings" },
];

export function AppSidebar({
  activeTab, onTabChange, onSignOut, isLandlord,
  alertCount = 0,
}: AppSidebarProps) {
  const nav = isLandlord ? landlordNav : tenantNav;

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-6 flex items-center h-14">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mr-8">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-display text-base font-bold tracking-tight text-foreground">
            HomeBound
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex items-center gap-1 flex-1">
          {nav.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex items-center gap-2 h-9 rounded-lg px-3.5 text-sm font-medium transition-all relative",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.id === "alerts" && alertCount > 0 && (
                  <span className={cn(
                    "min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-danger text-primary-foreground"
                  )}>
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sign out */}
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 h-9 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
