"use client";

type WorkflowContentProps = {
  className?: string;
  children: React.ReactNode;
};

export default function WorkflowContent({
  className,
  children,
}: WorkflowContentProps) {
  return <div className={className}>{children}</div>;
}
