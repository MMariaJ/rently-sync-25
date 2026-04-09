import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Send, Image, Paperclip, Plus,
  MessageSquare, Wrench, AlertCircle,
  ChevronRight, Clock,
} from "lucide-react";
import { type Property } from "@/data/constants";

interface CommsTabProps {
  property: Property;
}

interface Thread {
  id: string;
  context: string;
  subject: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  repairStage?: number;
}

const THREAD_CONTEXTS = ["Repair Request", "Deposit Deduction", "Rent Review", "Pre-existing Damage", "General"];
const REPAIR_STAGES = ["Reported", "Responded", "Contractor Assigned", "Visit Logged", "Resolved"];

const MOCK_THREADS: Record<string, Thread[]> = {
  p1: [],
  p2: [
    { id: "th1", context: "Repair Request", subject: "Kitchen tap leaking", lastMessage: "I've contacted a plumber who can come Thursday", timestamp: "2 Mar 2026", unread: 1, repairStage: 2 },
    { id: "th2", context: "General", subject: "Parking space query", lastMessage: "Thanks for confirming", timestamp: "18 Feb 2026", unread: 0 },
  ],
  p3: [
    { id: "th3", context: "Rent Review", subject: "2026 rent adjustment", lastMessage: "Waiting for tenant confirmation", timestamp: "5 Mar 2026", unread: 0 },
    { id: "th4", context: "Repair Request", subject: "Bathroom extractor fan", lastMessage: "Engineer visit scheduled for 15 Mar", timestamp: "1 Mar 2026", unread: 0, repairStage: 3 },
    { id: "th5", context: "Pre-existing Damage", subject: "Living room wall scuff", lastMessage: "Photo evidence uploaded", timestamp: "3 Jan 2026", unread: 0 },
  ],
};

const MOCK_MESSAGES = [
  { id: "m1", sender: "tenant", text: "Hi, the kitchen tap has been dripping steadily for the past few days. It's getting worse.", time: "10:32 AM", date: "28 Feb" },
  { id: "m2", sender: "landlord", text: "Thanks for letting me know. Can you send a photo or video of the leak?", time: "11:15 AM", date: "28 Feb" },
  { id: "m3", sender: "tenant", text: "Here's a photo of the tap.", time: "11:22 AM", date: "28 Feb", attachment: { type: "image", name: "tap_leak.jpg" } },
  { id: "m4", sender: "system", text: "📎 Image attachment saved to Evidence Vault", time: "11:22 AM", date: "28 Feb" },
  { id: "m5", sender: "landlord", text: "I've contacted a plumber who can come Thursday. Does 2pm work for you?", time: "2:45 PM", date: "2 Mar" },
];

export function CommsTab({ property: p }: CommsTabProps) {
  const threads = MOCK_THREADS[p.id] || [];
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);

  if (activeThread) {
    return (
      <ThreadView
        thread={activeThread}
        onBack={() => setActiveThread(null)}
        property={p}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm font-bold text-foreground">Threads</h3>
          {totalUnread > 0 && (
            <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {totalUnread}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowNewThread(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          New thread
        </button>
      </div>

      {threads.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center shadow-soft">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No conversations yet</p>
          <p className="text-xs text-muted-foreground">Start a thread to communicate with your tenant</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden divide-y divide-border">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setActiveThread(thread)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-secondary/30 transition-colors"
            >
              {/* Context icon */}
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                thread.context === "Repair Request" ? "bg-warning-muted" :
                thread.context === "Rent Review" ? "bg-landlord-light" :
                thread.context === "Deposit Deduction" ? "bg-danger-muted" :
                "bg-secondary"
              )}>
                {thread.context === "Repair Request" ? <Wrench className="w-4 h-4 text-warning" /> :
                 thread.context === "Deposit Deduction" ? <AlertCircle className="w-4 h-4 text-danger" /> :
                 <MessageSquare className="w-4 h-4 text-muted-foreground" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-foreground truncate">{thread.subject}</span>
                  {thread.unread > 0 && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{thread.lastMessage}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-medium text-primary bg-landlord-light rounded-full px-2 py-0.5">
                    {thread.context}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{thread.timestamp}</span>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* New thread modal */}
      {showNewThread && (
        <NewThreadModal onClose={() => setShowNewThread(false)} />
      )}
    </motion.div>
  );
}

function ThreadView({ thread, onBack, property }: { thread: Thread; onBack: () => void; property: Property }) {
  const [message, setMessage] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Thread header */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-soft">
        <button onClick={onBack} className="text-xs font-medium text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1">
          ← Back to threads
        </button>
        <h3 className="font-display text-base font-bold text-foreground">{thread.subject}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-medium text-primary bg-landlord-light rounded-full px-2 py-0.5">
            {thread.context}
          </span>
          <span className="text-[10px] text-muted-foreground">{thread.timestamp}</span>
        </div>
      </div>

      {/* Repair workflow tracker */}
      {thread.context === "Repair Request" && thread.repairStage !== undefined && (
        <div className="bg-card rounded-xl border border-border p-4 shadow-soft">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Repair Progress</h4>
          <div className="flex items-center gap-1">
            {REPAIR_STAGES.map((stage, i) => {
              const isComplete = i < (thread.repairStage || 0);
              const isCurrent = i === (thread.repairStage || 0);
              return (
                <div key={stage} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all",
                    isComplete ? "bg-success border-success text-success-foreground" :
                    isCurrent ? "bg-primary border-primary text-primary-foreground" :
                    "bg-secondary border-border text-muted-foreground"
                  )}>
                    {i + 1}
                  </div>
                  <span className={cn(
                    "text-[9px] font-medium text-center leading-tight",
                    isComplete || isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
        <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
          {MOCK_MESSAGES.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.sender === "landlord" ? "justify-end" :
                msg.sender === "system" ? "justify-center" : "justify-start"
              )}
            >
              {msg.sender === "system" ? (
                <div className="text-[10px] text-muted-foreground bg-secondary/60 rounded-full px-3 py-1 italic">
                  {msg.text}
                </div>
              ) : (
                <div className={cn(
                  "max-w-[75%] rounded-xl px-4 py-2.5",
                  msg.sender === "landlord"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary text-foreground rounded-bl-sm"
                )}>
                  {msg.attachment && (
                    <div className={cn(
                      "flex items-center gap-2 p-2 rounded-lg mb-2 text-xs",
                      msg.sender === "landlord" ? "bg-primary-foreground/10" : "bg-card"
                    )}>
                      <Image className="w-4 h-4" />
                      <span className="font-medium">{msg.attachment.name}</span>
                    </div>
                  )}
                  <p className="text-sm">{msg.text}</p>
                  <p className={cn(
                    "text-[10px] mt-1",
                    msg.sender === "landlord" ? "text-primary-foreground/60" : "text-muted-foreground"
                  )}>
                    {msg.date} · {msg.time}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Message input */}
        <div className="border-t border-border p-3 flex items-center gap-2">
          <button className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Image className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center pb-2">
          All attachments are timestamped and stored as evidence
        </p>
      </div>
    </motion.div>
  );
}

function NewThreadModal({ onClose }: { onClose: () => void }) {
  const [context, setContext] = useState("");
  const [subject, setSubject] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-xl border border-border shadow-elevated w-full max-w-md p-6"
      >
        <h3 className="font-display text-lg font-bold text-foreground mb-4">New Thread</h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Context</label>
            <div className="flex flex-wrap gap-2">
              {THREAD_CONTEXTS.map(c => (
                <button
                  key={c}
                  onClick={() => setContext(c)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    context === c
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-foreground border-border hover:border-primary/30"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
            <input
              type="text"
              placeholder="Describe the issue..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-secondary text-foreground text-sm font-semibold">
            Cancel
          </button>
          <button
            disabled={!context || !subject}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            Create Thread
          </button>
        </div>
      </motion.div>
    </div>
  );
}
