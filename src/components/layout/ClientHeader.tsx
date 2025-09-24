import { SidebarTrigger } from "@/components/ui/sidebar";

export function ClientHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
    </header>
  );
}
