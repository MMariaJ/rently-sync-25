import { useState } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/components/Dashboard";
import { LandlordHome } from "@/components/LandlordHome";
import { PropertyOverview } from "@/components/PropertyOverview";
import { TenantHome } from "@/components/TenantHome";
import { TenantPropertyView } from "@/components/TenantPropertyView";
import { PORTFOLIO, type Property } from "@/data/constants";
import { useAppStore } from "@/state/useAppStore";

// In a real app the tenant identity comes from auth. For the demo, the
// "I'm a tenant" splash signs you in as Sarah Mitchell at 14 Elmwood Road.
const TENANT_PROP_ID = "p1";

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
  const tenantProperty = portfolio.find(p => p.id === TENANT_PROP_ID)!;
  const prop = activeProp ? portfolio.find(p => p.id === activeProp) : null;

  const handleSignOut = () => {
    setRole(null);
    setActiveProp(null);
    setSidebarTab("home");
  };

  const renderContent = () => {
    // ---------- TENANT ----------
    if (!isLL) {
      // Map sidebar tabs into the tenant's single property.
      // home  → TenantHome dashboard
      // alerts → property Tasks tab (the tenant's actionable alerts)
      // reviews → property Reviews tab
      // settings → placeholder
      const sidebarToPropertyTab: Record<string, "Tasks" | "Reviews" | null> = {
        alerts: "Tasks",
        reviews: "Reviews",
      };
      const deepLinkTab = sidebarToPropertyTab[sidebarTab] ?? null;

      if (activeProp || deepLinkTab) {
        return (
          <TenantPropertyView
            property={tenantProperty}
            completed={store.completed}
            allVaults={store.vaults}
            taskUploads={store.taskUploads}
            extractedFacts={store.extractedFacts}
            events={store.events}
            reviews={store.reviews}
            onUploadDocDirect={store.uploadDocDirect}
            onMarkTaskDone={store.markTaskDone}
            onUnmarkTaskDone={store.unmarkTaskDone}
            onSetReminder={store.setReminder}
            onFileCommsAttachment={store.fileCommsAttachment}
            onAddReview={store.addReview}
            onBack={() => { setActiveProp(null); setSidebarTab("home"); }}
            initialTab={deepLinkTab ?? undefined}
          />
        );
      }

      if (sidebarTab === "home") {
        return (
          <TenantHome
            property={tenantProperty}
            completed={store.completed}
            allVaults={store.vaults}
            onOpenProperty={() => setActiveProp(tenantProperty.id)}
          />
        );
      }

      // settings → placeholder
      return (
        <div className="bg-card hairline rounded-xl p-12 text-center">
          <p className="text-muted-foreground text-[13px]">
            {sidebarTab.charAt(0).toUpperCase() + sidebarTab.slice(1)} — coming in the next iteration
          </p>
        </div>
      );
    }

    // ---------- LANDLORD ----------
    if (activeProp && prop) {
      return (
        <PropertyOverview
          property={prop}
          completed={store.completed}
          allVaults={store.vaults}
          taskUploads={store.taskUploads}
          extractedFacts={store.extractedFacts}
          events={store.events}
          reviews={store.reviews}
          onUploadDoc={store.uploadDoc}
          onUploadDocDirect={store.uploadDocDirect}
          onMarkTaskDone={store.markTaskDone}
          onUnmarkTaskDone={store.unmarkTaskDone}
          onSetReminder={store.setReminder}
          onFileCommsAttachment={store.fileCommsAttachment}
          onAddReview={store.addReview}
          onBack={() => setActiveProp(null)}
        />
      );
    }

    if (sidebarTab === "home") {
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

    if (sidebarTab === "properties") {
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
        alertCount={isLL ? 3 : 1}
        expanded={sidebarExpanded}
        onExpandedChange={setSidebarExpanded}
      />

      <main className="max-w-[1100px] mx-auto px-6 py-8">
        {renderContent()}
      </main>
    </div>
  );
}
