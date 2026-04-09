import { motion } from "framer-motion";
import { KeyRound, Home, Shield } from "lucide-react";

interface SplashScreenProps {
  onSelectRole: (role: "landlord" | "tenant") => void;
}

export function SplashScreen({ onSelectRole }: SplashScreenProps) {
  return (
    <div className="min-h-screen bg-primary flex items-center justify-center relative overflow-hidden">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
        backgroundSize: "32px 32px",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md px-8"
      >
        {/* Logo */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-success" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">
              <span className="text-primary-foreground">Home</span>
              <span className="text-success">Bound</span>
            </h1>
          </div>
          <p className="text-primary-foreground/40 text-xs font-semibold tracking-[0.25em] uppercase">
            Rental Compliance, Simplified
          </p>
        </div>

        {/* Role selection */}
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectRole("landlord")}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-landlord text-landlord-foreground font-semibold text-[15px] transition-all hover:brightness-110"
          >
            <KeyRound className="w-[18px] h-[18px]" />
            I'm a Landlord
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectRole("tenant")}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-tenant text-tenant-foreground font-semibold text-[15px] transition-all hover:brightness-110"
          >
            <Home className="w-[18px] h-[18px]" />
            I'm a Tenant
          </motion.button>
        </div>

        <p className="text-center text-primary-foreground/25 text-xs mt-8">
          Know. Remind. Track.
        </p>
      </motion.div>
    </div>
  );
}
