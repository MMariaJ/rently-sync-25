import { useState } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/components/Dashboard";
import { LandlordHome } from "@/components/LandlordHome";
import { PropertyOverview, type TabKey } from "@/components/PropertyOverview";
import { TenantHome } from "@/components/TenantHome";
import { TenantPropertyView } from "@/components/TenantPropertyView";
import { AlertsPage } from "@/components/AlertsPage";
import { ReviewsPage } from "@/components/ReviewsPage";
import { SettingsPage } from "@/components/SettingsPage";
import { PORTFOLIO, type Property } from "@/data/constants";
import { useAppStore } from "@/state/useAppStore";

// In a real app the tenant identity comes from auth. For the demo, the
// "I'm a tenant" splash signs you in as Sarah Mitchell at 14 Elmwood Road.
const TENANT_PROP_ID = "p1";

type SidebarTab = "home" | "properties" | "alerts" | "reviews" | "settings";

export default function Index() {
  const [role, setRole] = useState<"landlord" | "tenant" | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("home");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeProp, setActiveProp] = useState<string | null>(null);
  const [propInitialTab, setPropInitialTab] = useState<TabKey | undefined>(undefined);
  const [portfolio] = useState<Property[]>(PORTFOLIO);

  const store = useAppStore();

  if (!role) {
    return <SplashScreen onSelectRole={(r) => { setRole(r); setSidebarTab("home"); }} />;
  }

  const isLL = role === "landlord";
  const tenantProperty = portfolio.find(p => p.id === TENANT_PROP_ID)!;
  const visibleProperties = isLL ? portfolio : [tenantProperty];

  const handleSignOut = () => {
    setRole(null);
    setActiveProp(null);
    setPropInitialTab(undefined);
    setSidebarTab("home");
  };

  const openProperty = (propId: string, tab?: TabKey) => {
    setActiveProp(propId);
    setPropInitialTab(tab);
  };

  const openAlert = (propId: string, linkedTab?: string) => {
    const tab: TabKey | undefined =
      linkedTab === "vault" ? "Vault" :
      linkedTab === "tasks" ? "Tasks" :
      linkedTab === "payments" ? "Payments" :
      linkedTab === "comms" ? "Comms" :
      undefined;
    openProperty(propId, tab);
  };

  const renderContent = () => {
    // ---------- Property detail (both roles) ----------
    if (activeProp) {
      const prop = portfolio.find(p => p.id === activeProp);
      if (prop) {
        const onBack = () => { setActiveProp(null); setPropInitialTab(undefined); };
        if (isLL) {
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
              onBack={onBack}
              initialTab={propInitialTab}
            />
          );
        }
        // Tenant property view (only valid for their own property)
        const tenantTab =
          propInitialTab === "Tasks" || propInitialTab === "Reviews" ? propInitialTab : undefined;
        return (
          <TenantPropertyView
            property={prop}
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
            onBack={onBack}
            initialTab={tenantTab}
          />
        );
      }
    }

    // ---------- Top-level pages ----------
    if (sidebarTab === "alerts") {
      return (
        <AlertsPage
          portfolio={visibleProperties}
          allVaults={store.vaults}
          onOpenAlert={openAlert}
        />
      );
    }

    if (sidebarTab === "reviews") {
      return (
        <ReviewsPage
          portfolio={visibleProperties}
          isLandlord={isLL}
          onOpenProperty={(id) => openProperty(id, "Reviews")}
        />
      );
    }

    if (sidebarTab === "settings") {
      return <SettingsPage isLandlord={isLL} onSignOut={handleSignOut} />;
    }

    // ---------- Home / properties (role-specific) ----------
    if (!isLL) {
      // Tenant home only
      return (
        <TenantHome
          property={tenantProperty}
          completed={store.completed}
          allVaults={store.vaults}
          onOpenProperty={() => openProperty(tenantProperty.id)}
        />
      );
    }

    if (sidebarTab === "home") {
      return (
        <Dashboard
          portfolio={portfolio}
          completed={store.completed}
          allVaults={store.vaults}
          onSelectProperty={(id) => openProperty(id)}
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
          onSelectProperty={(id) => openProperty(id)}
          onAddProperty={() => {}}
        />
      );
    }

    return null;
  };

  // Compute live alert count for the sidebar badge.
  const alertCount = visibleProperties.reduce((sum, p) => {
    const vault = store.vaults[p.id] ?? [];
    // Inline import to avoid circular complications
    return sum + getAlertCount(p.id, vault);
  }, 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(240 6% 98%)" }}>
      <AppSidebar
        activeTab={sidebarTab}
        onTabChange={(tab) => {
          setSidebarTab(tab);
          setActiveProp(null);
          setPropInitialTab(undefined);
        }}
        onSignOut={handleSignOut}
        isLandlord={isLL}
        alertCount={alertCount}
        expanded={sidebarExpanded}
        onExpandedChange={setSidebarExpanded}
      />

      <main className="max-w-[1100px] mx-auto px-6 py-8">
        {renderContent()}
      </main>
    </div>
  );
}

// Light wrapper to avoid an extra import at the top of the module's body
import { getPropertyAlerts } from "@/data/helpers";
import type { VaultDoc } from "@/data/constants";
function getAlertCount(propId: string, vault: VaultDoc[]) {
  return getPropertyAlerts(propId, vault).length;
}
