import { cn } from "@/lib/utils";
import {
  Home, Building2, Bell, Star, Settings, LogOut,
  Shield,
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
  { id: "home" as const, icon: Home, label: "Home" },
  { id: "properties" as const, icon: Building2, label: "Properties" },
  { id: "alerts" as const, icon: Bell, label: "Alerts" },
  { id: "reviews" as const, icon: Star, label: "Reviews" },
  { id: "settings" as const, icon: Settings, label: "Settings" },
];

const tenantNav = [
  { id: "home" as const, icon: Home, label: "Home" },
  { id: "alerts" as const, icon: Bell, label: "Alerts" },
  { id: "reviews" as const, icon: Star, label: "Reviews" },
  { id: "settings" as const, icon: Settings, label: "Settings" },
];

export function AppSidebar({
  activeTab, onTabChange, onSignOut, isLandlord,
  alertCount = 0, expanded, onExpandedChange,
}: AppSidebarProps) {
  const nav = isLandlord ? landlordNav : tenantNav;

  return (
    <div
      onMouseEnter={() => onExpandedChange(true)}
      onMouseLeave={() => onExpandedChange(false)}
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar z-50 flex flex-col transition-all duration-200 ease-out overflow-hidden",
        expanded ? "w-56 shadow-elevated" : "w-[60px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-success" />
        </div>
        {expanded && (
          <span className="text-lg font-black tracking-tight whitespace-nowrap">
            <span className="text-sidebar-foreground">Home</span>
            <span className="text-success">Bound</span>
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 px-2 mt-4">
        {nav.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex items-center gap-3 h-10 rounded-lg px-3 text-sm font-medium transition-colors whitespace-nowrap relative",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {expanded && <span>{item.label}</span>}
              {item.id === "alerts" && alertCount > 0 && (
                <span className="absolute top-1.5 left-7 w-2 h-2 rounded-full bg-danger" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-2 pb-4">
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 h-10 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/40 hover:text-sidebar-foreground/60 hover:bg-sidebar-accent/30 transition-colors w-full whitespace-nowrap"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {expanded && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
