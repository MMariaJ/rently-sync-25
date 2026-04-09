import { useState } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { AppSidebar } from "@/components/AppSidebar";
import { LandlordHome } from "@/components/LandlordHome";
import { PropertyDetail } from "@/components/PropertyDetail";
import {
  PORTFOLIO, VAULT_INIT, COMPLETED_INIT,
  type Property, type VaultDoc,
} from "@/data/constants";

const P1_VAULT_INIT: VaultDoc[] = VAULT_INIT.map(d =>
  d.name === "Tenancy Agreement (AST)" ? { ...d, status: "uploaded" as const, timestamp: "01 Feb 2026" } : d
);

const P2_VAULT_INIT: VaultDoc[] = VAULT_INIT.map(d =>
  d.name === "EPC Certificate" ? { ...d, status: "pending" as const } :
    ["Tenancy Agreement (AST)", "Gas Safety Certificate", "EICR Report", "How to Rent Guide",
      "Deposit Protection Certificate", "Move-In Inventory"].includes(d.name)
      ? { ...d, status: "uploaded" as const, timestamp: "15 Mar 2025" } : d
);

const P3_VAULT_INIT: VaultDoc[] = VAULT_INIT.map(d =>
  ["Tenancy Agreement (AST)", "Gas Safety Certificate", "EPC Certificate", "EICR Report",
    "How to Rent Guide", "Deposit Protection Certificate", "Move-In Inventory"].includes(d.name)
    ? { ...d, status: "uploaded" as const, timestamp: "01 Jan 2026" } : d
);

export default function Index() {
  const [role, setRole] = useState<"landlord" | "tenant" | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"home" | "properties" | "alerts" | "reviews" | "settings">("home");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeProp, setActiveProp] = useState<string | null>(null);
  const [portfolio] = useState<Property[]>(PORTFOLIO);
  const [completed] = useState<Record<string, boolean>>({ ...COMPLETED_INIT });
  const [allVaults] = useState<Record<string, VaultDoc[]>>({
    p1: P1_VAULT_INIT,
    p2: P2_VAULT_INIT,
    p3: P3_VAULT_INIT,
  });

  // Splash screen
  if (!role) {
    return <SplashScreen onSelectRole={(r) => { setRole(r); setSidebarTab("home"); }} />;
  }

  const isLL = role === "landlord";
  const prop = activeProp ? portfolio.find(p => p.id === activeProp) : null;

  const handleSignOut = () => {
    setRole(null);
    setActiveProp(null);
    setSidebarTab("home");
  };

  const renderContent = () => {
    // Property detail view
    if (isLL && activeProp && prop) {
      return (
        <PropertyDetail
          property={prop}
          completed={completed}
          allVaults={allVaults}
          onBack={() => setActiveProp(null)}
        />
      );
    }

    // Landlord home / portfolio
    if (isLL && (sidebarTab === "home" || sidebarTab === "properties")) {
      return (
        <LandlordHome
          portfolio={portfolio}
          completed={completed}
          allVaults={allVaults}
          onSelectProperty={(id) => setActiveProp(id)}
          onAddProperty={() => {}}
        />
      );
    }

    // Other tabs — placeholder
    return (
      <div className="bg-card rounded-2xl border border-border p-12 text-center">
        <p className="text-muted-foreground text-sm">
          {sidebarTab.charAt(0).toUpperCase() + sidebarTab.slice(1)} — coming in next iteration
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        activeTab={sidebarTab}
        onTabChange={(tab) => {
          setSidebarTab(tab);
          if (activeProp) setActiveProp(null);
        }}
        onSignOut={handleSignOut}
        isLandlord={isLL}
        alertCount={3}
        expanded={sidebarExpanded}
        onExpandedChange={setSidebarExpanded}
      />

      {/* Main content */}
      <main className="ml-[60px] min-h-screen">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              {activeProp && prop
                ? prop.address.split(",")[0]
                : sidebarTab === "home" || sidebarTab === "properties"
                  ? "Portfolio"
                  : sidebarTab.charAt(0).toUpperCase() + sidebarTab.slice(1)
              }
            </h1>
            {!activeProp && (sidebarTab === "home" || sidebarTab === "properties") && (
              <p className="text-sm text-muted-foreground mt-0.5">Manage your properties and compliance</p>
            )}
          </div>

          {renderContent()}
        </div>
      </main>
    </div>
  );
}
