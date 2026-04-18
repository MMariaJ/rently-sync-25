import { useState } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/components/Dashboard";
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

    if (isLL && sidebarTab === "home") {
      return (
        <Dashboard
          portfolio={portfolio}
          completed={completed}
          allVaults={allVaults}
          onSelectProperty={(id) => setActiveProp(id)}
          onNavigateToProperties={() => setSidebarTab("properties")}
        />
      );
    }

    if (isLL && sidebarTab === "properties") {
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

    return (
      <div className="bg-card hairline rounded-xl p-12 text-center">
        <p className="text-muted-foreground text-[13px]">
          {sidebarTab.charAt(0).toUpperCase() + sidebarTab.slice(1)} — coming in the next iteration
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(240 6% 98%)" }}>
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

      <main className="max-w-[1100px] mx-auto px-6 py-8">
        {renderContent()}
      </main>
    </div>
  );
}
