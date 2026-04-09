import { motion } from "framer-motion";
import { KeyRound, Home, ShieldCheck, ArrowRight } from "lucide-react";

interface SplashScreenProps {
  onSelectRole: (role: "landlord" | "tenant") => void;
}

export function SplashScreen({ onSelectRole }: SplashScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 h-16">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            HomeBound
          </span>
        </div>
        <p className="text-xs text-muted-foreground font-medium">Rental compliance, simplified</p>
      </header>

      {/* Center content */}
      <div className="flex-1 flex items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-2xl"
        >
          {/* Hero text */}
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-[1.15] mb-4"
            >
              Stay compliant.
              <br />
              <span className="text-primary">Stay protected.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-muted-foreground text-base max-w-md mx-auto"
            >
              Track every obligation, deadline, and document — so nothing slips through the cracks.
            </motion.p>
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectRole("landlord")}
              className="group relative bg-card border border-border rounded-2xl p-6 text-left transition-all hover:shadow-card-hover hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <div className="w-12 h-12 rounded-xl bg-landlord-light flex items-center justify-center mb-4">
                <KeyRound className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-1">I'm a Landlord</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manage properties, track compliance, and stay ahead of deadlines.
              </p>
              <div className="flex items-center gap-1.5 text-primary text-sm font-semibold">
                Get started <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectRole("tenant")}
              className="group relative bg-card border border-border rounded-2xl p-6 text-left transition-all hover:shadow-card-hover hover:border-tenant/30 focus:outline-none focus:ring-2 focus:ring-tenant/20"
            >
              <div className="w-12 h-12 rounded-xl bg-tenant-light flex items-center justify-center mb-4">
                <Home className="w-5 h-5 text-tenant" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-1">I'm a Tenant</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Know your rights, verify obligations, and keep everything documented.
              </p>
              <div className="flex items-center gap-1.5 text-tenant text-sm font-semibold">
                Get started <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </motion.button>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            className="text-center text-muted-foreground/60 text-xs mt-8"
          >
            Know · Remind · Track
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
