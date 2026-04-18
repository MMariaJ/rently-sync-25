interface SplashScreenProps {
  onSelectRole: (role: "landlord" | "tenant") => void;
}

export function SplashScreen({ onSelectRole }: SplashScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-8 h-14 max-w-[1100px] mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-primary" />
          <span className="text-[15px] font-medium text-foreground tracking-tight">HomeBound</span>
        </div>
        <p className="text-[13px] text-muted-foreground">Rental compliance, simplified</p>
      </header>

      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-xl">
          <div className="text-center mb-12">
            <h1 className="text-[40px] leading-tight tracking-tight text-foreground mb-3 font-medium">
              Stay compliant. <span className="text-primary">Stay protected.</span>
            </h1>
            <p className="text-muted-foreground text-[15px] max-w-md mx-auto leading-relaxed">
              Track every obligation, deadline, and document — so nothing slips through the cracks.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onSelectRole("landlord")}
              className="text-left p-5 bg-card hairline rounded-xl hover:border-primary/40 transition-colors"
            >
              <p className="text-[15px] text-foreground font-medium mb-1">I'm a landlord</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Manage properties, track compliance, and stay ahead of deadlines.
              </p>
            </button>

            <button
              onClick={() => onSelectRole("tenant")}
              className="text-left p-5 bg-card hairline rounded-xl hover:border-primary/40 transition-colors"
            >
              <p className="text-[15px] text-foreground font-medium mb-1">I'm a tenant</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Know your rights, verify obligations, and keep everything documented.
              </p>
            </button>
          </div>

          <p className="text-center text-muted-foreground text-[12px] mt-8">
            Know · Remind · Track
          </p>
        </div>
      </div>
    </div>
  );
}
