// Audience router — the unauthenticated landing page.
//
// Photo-led, Airbnb-warmth aesthetic. The hero photograph is the headline
// and the two role cards sit on a soft warm background with subtle
// elevation and a gentle hover lift.

import { Home, User, Shield, ArrowRight } from "lucide-react";
import landingHero from "@/assets/landing-hero.jpg";

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
    <div className="min-h-screen bg-background">
      {/* Top brand bar — minimal, generous */}
      <header className="w-full">
        <div
          className="mx-auto flex items-center justify-between"
          style={{ maxWidth: "1240px", padding: "24px 32px" }}
        >
          <div className="flex items-center" style={{ gap: "10px" }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                backgroundColor: PURPLE,
              }}
              aria-hidden="true"
            >
              <Shield size={16} strokeWidth={2} color="#ffffff" />
            </div>
            <span
              style={{
                fontSize: "17px",
                fontWeight: 500,
                letterSpacing: "-0.01em",
                color: PURPLE_DEEP,
              }}
            >
              Homebound
            </span>
          </div>
          <span
            className="text-muted-foreground"
            style={{ fontSize: "13px" }}
          >
            UK landlord & tenant compliance
          </span>
        </div>
      </header>

      <main
        className="mx-auto"
        style={{ maxWidth: "1240px", padding: "32px 32px 80px" }}
      >
        <div
          className="grid items-center"
          style={{
            gridTemplateColumns: "1fr 1fr",
            gap: "56px",
          }}
        >
          {/* LEFT — copy + cards */}
          <div>
            <span
              style={{
                display: "inline-block",
                fontSize: "12px",
                fontWeight: 500,
                color: PURPLE,
                backgroundColor: PURPLE_TINT,
                padding: "6px 12px",
                borderRadius: "999px",
                marginBottom: "24px",
              }}
            >
              Built for the Renters' Rights Act 2026
            </span>
            <h1
              className="text-foreground"
              style={{
                fontSize: "52px",
                fontWeight: 500,
                lineHeight: 1.08,
                letterSpacing: "-0.025em",
                marginBottom: "20px",
              }}
            >
              Stay compliant.<br />
              Stay <span style={{ color: PURPLE }}>protected</span>.
            </h1>
            <p
              className="text-muted-foreground"
              style={{
                fontSize: "17px",
                lineHeight: 1.55,
                maxWidth: "480px",
                marginBottom: "40px",
              }}
            >
              Track every obligation, deadline and document — so nothing
              slips through the cracks. Trusted by landlords and tenants
              across the UK.
            </p>

            {/* Audience cards */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <AudienceCard
                onClick={() => onSelectRole("landlord")}
                topBorder={PURPLE}
                iconBg={PURPLE_TINT}
                icon={<Home size={18} strokeWidth={1.8} color={PURPLE} />}
                title="I'm a landlord"
                titleColor={PURPLE_DEEP}
                description="Manage properties, track compliance, stay ahead of deadlines."
                continueColor={PURPLE}
              />
              <AudienceCard
                onClick={() => onSelectRole("tenant")}
                topBorder={TEAL}
                iconBg={TEAL_TINT}
                icon={<User size={18} strokeWidth={1.8} color={TEAL} />}
                title="I'm a tenant"
                titleColor={TEAL_DEEP}
                description="Know your rights, verify obligations, keep everything documented."
                continueColor={TEAL}
              />
            </div>

            <p
              className="text-muted-foreground"
              style={{ fontSize: "12px", marginTop: "24px" }}
            >
              No account required to explore the demo.
            </p>
          </div>

          {/* RIGHT — hero photograph */}
          <div
            style={{
              borderRadius: "24px",
              overflow: "hidden",
              boxShadow: "var(--shadow-photo)",
              aspectRatio: "4 / 5",
              backgroundColor: "hsl(var(--secondary))",
            }}
          >
            <img
              src={landingHero}
              alt="A calm, sunlit modern living room"
              className="w-full h-full object-cover"
              style={{ display: "block" }}
            />
          </div>
        </div>
      </main>
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
        borderRadius: "16px",
        padding: "20px",
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <div
        className="flex items-center"
        style={{ gap: "12px", marginBottom: "12px" }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: "36px",
            height: "36px",
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
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
      </div>

      <p
        className="text-muted-foreground"
        style={{
          fontSize: "13px",
          lineHeight: 1.55,
          marginBottom: "16px",
          minHeight: "44px",
        }}
      >
        {description}
      </p>

      <div className="flex items-center justify-between">
        <span style={{ fontSize: "12px", fontWeight: 500, color: continueColor }}>
          Continue
        </span>
        <ArrowRight size={14} strokeWidth={2} color={continueColor} />
      </div>
    </a>
  );
}
