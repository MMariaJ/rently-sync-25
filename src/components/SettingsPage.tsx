// Top-level Settings page. Profile, notifications, and account.
// Local state only — this is a demo, no persistence.

import { useState } from "react";
import { LANDLORD_PROFILE, TENANT_INFO } from "@/data/constants";

interface SettingsPageProps {
  isLandlord: boolean;
  onSignOut: () => void;
}

export function SettingsPage({ isLandlord, onSignOut }: SettingsPageProps) {
  const profile = isLandlord
    ? { name: LANDLORD_PROFILE.name, email: "david.patel@homebound.app", avatar: LANDLORD_PROFILE.avatarUrl }
    : {
        name: TENANT_INFO.p1?.name ?? "Sarah Mitchell",
        email: "sarah.mitchell@homebound.app",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face",
      };

  const [notifyDeadlines, setNotifyDeadlines] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyReviews, setNotifyReviews] = useState(false);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <p
          className="text-[12px] text-muted-foreground"
          style={{ letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 500 }}
        >
          Settings
        </p>
        <h1 className="text-[24px] font-medium text-foreground tracking-tight mt-1">
          Your account
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Profile, notifications, and access.
        </p>
      </div>

      {/* Profile */}
      <section>
        <SectionHead>Profile</SectionHead>
        <div className="bg-card hairline rounded-xl" style={{ padding: "14px 16px" }}>
          <div className="flex items-center gap-3">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="rounded-full object-cover shrink-0"
              style={{ width: "44px", height: "44px" }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-foreground truncate">{profile.name}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{profile.email}</p>
            </div>
            <button className="text-[13px] text-foreground hairline rounded-lg shrink-0" style={{ padding: "6px 14px" }}>
              Edit
            </button>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section>
        <SectionHead>Notifications</SectionHead>
        <div className="bg-card hairline rounded-xl overflow-hidden">
          <ToggleRow
            label="Deadline reminders"
            sub="Compliance, renewals, and rent due"
            checked={notifyDeadlines}
            onChange={setNotifyDeadlines}
          />
          <ToggleRow
            label="Messages"
            sub={isLandlord ? "Tenant messages and replies" : "Landlord messages and replies"}
            checked={notifyMessages}
            onChange={setNotifyMessages}
            divider
          />
          <ToggleRow
            label="Review requests"
            sub="Prompts to leave or reply to a review"
            checked={notifyReviews}
            onChange={setNotifyReviews}
            divider
          />
        </div>
      </section>

      {/* Account */}
      <section>
        <SectionHead>Account</SectionHead>
        <div className="bg-card hairline rounded-xl overflow-hidden">
          <Row label="Plan" value="HomeBound · Demo" />
          <Row label="Role" value={isLandlord ? "Landlord" : "Tenant"} divider />
          <button
            onClick={onSignOut}
            className="w-full text-left px-4 py-3 text-[13px] hover:bg-secondary/40 transition-colors"
            style={{ borderTop: "0.5px solid hsl(var(--border))", color: "#A32D2D" }}
          >
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-medium text-muted-foreground"
      style={{ fontSize: "12px", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "10px" }}
    >
      {children}
    </h2>
  );
}

function Row({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={divider ? { borderTop: "0.5px solid hsl(var(--border))" } : undefined}
    >
      <p className="text-[13px] text-foreground">{label}</p>
      <p className="text-[13px] text-muted-foreground tabular-nums">{value}</p>
    </div>
  );
}

function ToggleRow({
  label, sub, checked, onChange, divider,
}: {
  label: string; sub: string; checked: boolean; onChange: (v: boolean) => void; divider?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 gap-4"
      style={divider ? { borderTop: "0.5px solid hsl(var(--border))" } : undefined}
    >
      <div className="min-w-0">
        <p className="text-[13px] text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        className="shrink-0 transition-colors"
        style={{
          width: "36px", height: "20px", borderRadius: "999px",
          backgroundColor: checked ? "#534AB7" : "hsl(var(--border))",
          position: "relative",
        }}
      >
        <span
          className="block transition-transform"
          style={{
            position: "absolute", top: "2px", left: "2px",
            width: "16px", height: "16px", borderRadius: "999px",
            backgroundColor: "white",
            transform: checked ? "translateX(16px)" : "translateX(0)",
          }}
        />
      </button>
    </div>
  );
}
