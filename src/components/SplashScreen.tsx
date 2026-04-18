// Audience router — the unauthenticated landing page.
//
// One job: ask "are you a landlord or a tenant?" and route accordingly.
// No top nav, no marketing chrome, no scroll content. Two distinct cards
// differentiated on two axes (colour + icon) so the choice reads at a
// glance, in greyscale, and for colour-blind users.

import { Home, User } from "lucide-react";

interface SplashScreenProps {
  onSelectRole: (role: "landlord" | "tenant") => void;
}

const PURPLE = "#534AB7";
const PURPLE_DEEP = "#3C3489";
const PURPLE_TINT = "#EEEDFE";

const TEAL = "#0F6E56";
const TEAL_DEEP = "#085041";
const TEAL_TINT = "#E1F5EE";

export function SplashScreen({ onSelectRole }: SplashScreenProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-16">
      <div className="w-full mx-auto" style={{ maxWidth: "920px" }}>
        {/* Headline block */}
        <div className="text-center" style={{ marginBottom: "3.5rem" }}>
          <h1
            className="text-foreground"
            style={{
              fontSize: "44px",
              fontWeight: 500,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              marginBottom: "1.25rem",
            }}
          >
            Stay compliant. Stay <span style={{ color: PURPLE }}>protected</span>.
          </h1>
          <p
            className="text-muted-foreground mx-auto"
            style={{
              fontSize: "16px",
              lineHeight: 1.5,
              maxWidth: "540px",
            }}
          >
            Track every obligation, deadline, and document — so nothing slips through the cracks.
          </p>
        </div>

        {/* Audience cards */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "2.5rem",
          }}
        >
          <AudienceCard
            onClick={() => onSelectRole("landlord")}
            topBorder={PURPLE}
            iconBg={PURPLE_TINT}
            icon={<Home size={16} strokeWidth={1.8} color={PURPLE} />}
            title="I'm a landlord"
            titleColor={PURPLE_DEEP}
            description="Manage properties, track compliance, and stay ahead of deadlines."
            continueColor={PURPLE}
          />
          <AudienceCard
            onClick={() => onSelectRole("tenant")}
            topBorder={TEAL}
            iconBg={TEAL_TINT}
            icon={<User size={16} strokeWidth={1.8} color={TEAL} />}
            title="I'm a tenant"
            titleColor={TEAL_DEEP}
            description="Know your rights, verify obligations, and keep everything documented."
            continueColor={TEAL}
          />
        </div>

        {/* Trust line footer */}
        <div
          className="text-center"
          style={{
            borderTop: "0.5px solid hsl(var(--border))",
            paddingTop: "1.5rem",
          }}
        >
          <p
            className="text-muted-foreground"
            style={{
              fontSize: "11px",
              letterSpacing: "0.3px",
              color: "hsl(var(--muted-foreground) / 0.7)",
            }}
          >
            Built for UK landlords and tenants · Compliant with the Housing Act 2004
          </p>
        </div>
      </div>
    </div>
  );
}

interface AudienceCardProps {
  onClick: () => void;
  topBorder: string;
  iconBg: string;
  icon: React.ReactNode;
  title: string;
  titleColor: string;
  description: string;
  continueColor: string;
}

function AudienceCard({
  onClick, topBorder, iconBg, icon, title, titleColor, description, continueColor,
}: AudienceCardProps) {
  return (
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className="audience-card block"
      style={{
        backgroundColor: "hsl(var(--card))",
        borderTop: `3px solid ${topBorder}`,
        borderRight: "0.5px solid hsl(var(--border))",
        borderBottom: "0.5px solid hsl(var(--border))",
        borderLeft: "0.5px solid hsl(var(--border))",
        borderRadius: "12px",
        padding: "1.5rem 1.5rem 1.25rem 1.5rem",
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
        transition: "border-color 0.15s ease",
      }}
    >
      {/* Icon + title row */}
      <div
        className="flex items-center"
        style={{ gap: "10px", marginBottom: "10px" }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "9999px",
            backgroundColor: iconBg,
          }}
        >
          {icon}
        </div>
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 500,
            color: titleColor,
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>

      {/* Description */}
      <p
        className="text-muted-foreground"
        style={{
          fontSize: "13px",
          lineHeight: 1.55,
          marginBottom: "1rem",
        }}
      >
        {description}
      </p>

      {/* Continue affordance */}
      <div className="flex justify-end">
        <span
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: continueColor,
          }}
        >
          Continue →
        </span>
      </div>
    </a>
  );
}
