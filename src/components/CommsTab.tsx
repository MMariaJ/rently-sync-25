import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Send, Image, Paperclip, Plus, ChevronRight, ArrowLeft,
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

const THREAD_CONTEXTS = ["Repair request", "Deposit deduction", "Rent review", "Pre-existing damage", "General"];
const REPAIR_STAGES = ["Reported", "Responded", "Contractor assigned", "Visit logged", "Resolved"];

const MOCK_THREADS: Record<string, Thread[]> = {
  p1: [],
  p2: [
    { id: "th1", context: "Repair request", subject: "Kitchen tap leaking", lastMessage: "I've contacted a plumber who can come Thursday", timestamp: "2 Mar 2026", unread: 1, repairStage: 2 },
    { id: "th2", context: "General", subject: "Parking space query", lastMessage: "Thanks for confirming", timestamp: "18 Feb 2026", unread: 0 },
  ],
  p3: [
    { id: "th3", context: "Rent review", subject: "2026 rent adjustment", lastMessage: "Waiting for tenant confirmation", timestamp: "5 Mar 2026", unread: 0 },
    { id: "th4", context: "Repair request", subject: "Bathroom extractor fan", lastMessage: "Engineer visit scheduled for 15 Mar", timestamp: "1 Mar 2026", unread: 0, repairStage: 3 },
    { id: "th5", context: "Pre-existing damage", subject: "Living room wall scuff", lastMessage: "Photo evidence uploaded", timestamp: "3 Jan 2026", unread: 0 },
  ],
};

const MOCK_MESSAGES = [
  { id: "m1", sender: "tenant", text: "Hi, the kitchen tap has been dripping steadily for the past few days. It's getting worse.", time: "10:32 AM", date: "28 Feb" },
  { id: "m2", sender: "landlord", text: "Thanks for letting me know. Can you send a photo or video of the leak?", time: "11:15 AM", date: "28 Feb" },
  { id: "m3", sender: "tenant", text: "Here's a photo of the tap.", time: "11:22 AM", date: "28 Feb", attachment: { type: "image", name: "tap_leak.jpg" } },
  { id: "m4", sender: "system", text: "Image attachment saved to evidence vault", time: "11:22 AM", date: "28 Feb" },
  { id: "m5", sender: "landlord", text: "I've contacted a plumber who can come Thursday. Does 2pm work for you?", time: "2:45 PM", date: "2 Mar" },
];

export function CommsTab({ property: p }: CommsTabProps) {
  const threads = MOCK_THREADS[p.id] || [];
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);

  if (activeThread) {
    return <ThreadView thread={activeThread} onBack={() => setActiveThread(null)} property={p} />;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h3 className="text-[16px] text-foreground font-medium">Threads</h3>
          {totalUnread > 0 && (
            <span className="text-[12px] text-primary tabular-nums">{totalUnread} unread</span>
          )}
        </div>
        <button
          onClick={() => setShowNewThread(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          New thread
        </button>
      </div>

      {threads.length === 0 ? (
        <div className="bg-card hairline rounded-xl p-12 text-center">
          <p className="text-[14px] text-foreground font-medium mb-1">No conversations yet</p>
          <p className="text-[13px] text-muted-foreground">Start a thread to communicate with your tenant.</p>
        </div>
      ) : (
        <div className="bg-card hairline rounded-xl overflow-hidden">
          {threads.map((thread, idx) => (
            <button
              key={thread.id}
              onClick={() => setActiveThread(thread)}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-secondary/40 transition-colors",
                idx > 0 && "hairline-t"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-foreground font-medium truncate">{thread.subject}</span>
                  {thread.unread > 0 && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                </div>
                <p className="text-[13px] text-muted-foreground truncate mt-0.5">{thread.lastMessage}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[12px] text-muted-foreground">
                  <span>{thread.context}</span>
                  <span>·</span>
                  <span>{thread.timestamp}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {showNewThread && <NewThreadModal onClose={() => setShowNewThread(false)} />}
    </div>
  );
}

function ThreadView({ thread, onBack }: { thread: Thread; onBack: () => void; property: Property }) {
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to threads
        </button>
        <h3 className="text-[18px] text-foreground font-medium tracking-tight">{thread.subject}</h3>
        <div className="flex items-center gap-2 mt-1 text-[12px] text-muted-foreground">
          <span>{thread.context}</span>
          <span>·</span>
          <span>{thread.timestamp}</span>
        </div>
      </div>

      {thread.context === "Repair request" && thread.repairStage !== undefined && (
        <div className="bg-card hairline rounded-xl p-5">
          <p className="label-eyebrow mb-4">Repair progress</p>
          <div className="flex items-center gap-1">
            {REPAIR_STAGES.map((stage, i) => {
              const isComplete = i < (thread.repairStage || 0);
              const isCurrent = i === (thread.repairStage || 0);
              return (
                <div key={stage} className="flex-1 flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-[11px] tabular-nums transition-all",
                    isComplete ? "bg-foreground text-background" :
                    isCurrent ? "bg-primary text-primary-foreground font-medium" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    {i + 1}
                  </div>
                  <span className={cn(
                    "text-[11px] text-center leading-tight",
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

      <div className="bg-card hairline rounded-xl overflow-hidden">
        <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
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
                <div className="text-[11px] text-muted-foreground">{msg.text}</div>
              ) : (
                <div className={cn(
                  "max-w-[75%] rounded-xl px-3.5 py-2.5",
                  msg.sender === "landlord"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                )}>
                  {msg.attachment && (
                    <div className={cn(
                      "flex items-center gap-2 p-2 rounded-lg mb-2 text-[12px]",
                      msg.sender === "landlord" ? "bg-primary-foreground/10" : "bg-card"
                    )}>
                      <Image className="w-3.5 h-3.5" />
                      <span>{msg.attachment.name}</span>
                    </div>
                  )}
                  <p className="text-[13px] leading-relaxed">{msg.text}</p>
                  <p className={cn(
                    "text-[11px] mt-1",
                    msg.sender === "landlord" ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {msg.date} · {msg.time}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="hairline-t p-3 flex items-center gap-2">
          <button aria-label="Attach image" className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Image className="w-4 h-4" />
          </button>
          <button aria-label="Attach file" className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="text"
            placeholder="Type a message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-secondary rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button aria-label="Send" className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center pb-3">
          All attachments are timestamped and stored as evidence.
        </p>
      </div>
    </div>
  );
}

function NewThreadModal({ onClose }: { onClose: () => void }) {
  const [context, setContext] = useState("");
  const [subject, setSubject] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card hairline rounded-xl w-full max-w-md p-6 mx-4">
        <h3 className="text-[18px] text-foreground font-medium mb-5 tracking-tight">New thread</h3>

        <div className="space-y-4">
          <div>
            <label className="text-[12px] text-muted-foreground mb-2 block">Context</label>
            <div className="flex flex-wrap gap-2">
              {THREAD_CONTEXTS.map(c => (
                <button
                  key={c}
                  onClick={() => setContext(c)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12px] transition-colors",
                    context === c
                      ? "bg-primary text-primary-foreground font-medium"
                      : "bg-secondary text-foreground hover:bg-secondary/70"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[12px] text-muted-foreground mb-2 block">Subject</label>
            <input
              type="text"
              placeholder="Describe the issue…"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-secondary rounded-lg px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:bg-background focus:hairline transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-secondary text-foreground text-[13px] font-medium hover:bg-secondary/70 transition-colors">
            Cancel
          </button>
          <button
            disabled={!context || !subject}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            Create thread
          </button>
        </div>
      </div>
    </div>
  );
}
