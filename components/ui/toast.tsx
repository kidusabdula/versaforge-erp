"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastVariant = "success" | "error" | "info";
type Toast = { id: string; title?: string; description?: string; variant?: ToastVariant; durationMs?: number };

type ToastContextType = {
  push: (t: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timers = useRef<Record<string, any>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const toast: Toast = { id, durationMs: 2800, variant: "info", ...t };
      setToasts((prev) => [...prev, toast]);
      timers.current[id] = setTimeout(() => dismiss(id), toast.durationMs);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`min-w-64 max-w-96 rounded-md border px-4 py-3 shadow-lg ${
                t.variant === "success"
                  ? "border-green-700 bg-green-500/10 text-green-300"
                  : t.variant === "error"
                  ? "border-red-700 bg-red-500/10 text-red-300"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)]"
              }`}
            >
              {t.title && <div className="text-sm font-semibold">{t.title}</div>}
              {t.description && <div className="text-xs opacity-90 mt-0.5">{t.description}</div>}
              <button
                aria-label="Dismiss"
                onClick={() => dismiss(t.id)}
                className="absolute top-1 right-2 text-xs opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function Toaster() {
  // Alias component if someone wants a dedicated import, ToastProvider already renders the container
  return null;
}


