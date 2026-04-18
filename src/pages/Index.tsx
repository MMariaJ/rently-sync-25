import { useState } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/components/Dashboard";
import { LandlordHome } from "@/components/LandlordHome";
import { PropertyOverview } from "@/components/PropertyOverview";
import { PORTFOLIO, type Property } from "@/data/constants";
import { useAppStore } from "@/state/useAppStore";

export default function Index() {
  const [role, setRole] = useState<"landlord" | "tenant" | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"home" | "properties" | "alerts" | "reviews" | "settings">("home");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeProp, setActiveProp] = useState<string | null>(null);
  const [portfolio] = useState<Property[]>(PORTFOLIO);

  const store = useAppStore();

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
        <PropertyOverview
          property={prop}
          completed={store.completed}
          allVaults={store.vaults}
          taskUploads={store.taskUploads}
          extractedFacts={store.extractedFacts}
          events={store.events}
          onUploadDoc={store.uploadDoc}
          onUploadDocDirect={store.uploadDocDirect}
          onMarkTaskDone={store.markTaskDone}
          onUnmarkTaskDone={store.unmarkTaskDone}
          onSetReminder={store.setReminder}
          onBack={() => setActiveProp(null)}
        />
      );
    }

    if (isLL && sidebarTab === "home") {
      return (
        <Dashboard
          portfolio={portfolio}
          completed={store.completed}
          allVaults={store.vaults}
          onSelectProperty={(id) => setActiveProp(id)}
          onNavigateToProperties={() => setSidebarTab("properties")}
        />
      );
    }

    if (isLL && sidebarTab === "properties") {
      return (
        <LandlordHome
          portfolio={portfolio}
          completed={store.completed}
          allVaults={store.vaults}
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
