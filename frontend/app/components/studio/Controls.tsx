"use client";
import { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
export function Action({
  children,
  busy,
  primary,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  busy?: boolean;
  primary?: boolean;
}) {
  return (
    <Button
      type="button"
      {...props}
      disabled={busy || props.disabled}
      aria-busy={busy || undefined}
      variant={primary ? "default" : "outline"}
      className={`studio-action ${props.className || ""}`}
    >
      {busy && <LoaderCircle size={16} className="studio-spin" />}
      {children}
    </Button>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      role={error ? "alert" : "status"}
      className={`studio-notice ${error ? "error" : ""}`}
    >
      <AlertCircle size={16} />
      <span>{children}</span>
    </div>
  );
}
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="studio-empty">
      <span className="studio-empty-icon">
        <Sparkles size={28} />
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
export type Confirmation = {
  title: string;
  description: string;
  action: () => void | Promise<void>;
};
export function Confirm({
  value,
  close,
}: {
  value: Confirmation | null;
  close: () => void;
}) {
  return (
    <Dialog
      open={!!value}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="app-surface studio-dialog">
        <DialogHeader>
          <DialogTitle>{value?.title}</DialogTitle>
        </DialogHeader>
        <p className="text-white/70">{value?.description}</p>
        <DialogFooter>
          <Action onClick={close}>取消</Action>
          <Action
            primary
            onClick={() => {
              const task = value?.action;
              close();
              void task?.();
            }}
          >
            确认
          </Action>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
