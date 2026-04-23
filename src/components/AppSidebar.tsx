import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

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

const landlordNav: { id: SidebarTab; label: string }[] = [
  { id: "home", label: "Dashboard" },
  { id: "properties", label: "Properties" },
  { id: "alerts", label: "Alerts" },
  { id: "reviews", label: "Reviews" },
  { id: "settings", label: "Settings" },
];

// Tenant has a single property, so "Properties" doesn't belong — the
// "Tenancy" page already contains everything about that one tenancy.
// Reviews and Alerts at this level span every tenancy (current + past),
// while the per-tenancy Reviews tab is scoped to just this landlord.
const tenantNav: { id: SidebarTab; label: string }[] = [
  { id: "home", label: "Tenancy" },
  { id: "alerts", label: "Alerts" },
  { id: "reviews", label: "Reviews" },
  { id: "settings", label: "Settings" },
];

export function AppSidebar({
  activeTab, onTabChange, onSignOut, isLandlord, alertCount = 0,
}: AppSidebarProps) {
  const nav = isLandlord ? landlordNav : tenantNav;

  return (
    <header className="sticky top-0 z-50 bg-background/85 hairline-b backdrop-blur-md">
      <div className="max-w-[1100px] mx-auto px-6 flex items-center h-16">
        <div className="flex items-center gap-2 mr-10">
          <div
            className="w-7 h-7 rounded-[8px] flex items-center justify-center"
            style={{ backgroundColor: "hsl(var(--primary))" }}
          >
            <span style={{ color: "#fff", fontSize: "13px", fontWeight: 500 }}>H</span>
          </div>
          <span className="text-[15px] font-medium text-foreground tracking-tight">Homebound</span>
        </div>

        <nav className="flex items-center gap-1 flex-1">
          {nav.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex items-center gap-2 h-9 rounded-full px-4 text-[13px] transition-all",
                  isActive
                    ? "text-primary-foreground bg-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          onClick={onSignOut}
          className="flex items-center gap-1.5 h-9 rounded-full px-3 text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
