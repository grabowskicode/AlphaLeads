import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <h1 className="text-2xl font-bold text-sidebar-foreground">
        AlphaLeads
      </h1>
    </div>
  );
}
