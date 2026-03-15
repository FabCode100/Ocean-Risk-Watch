import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full bg-background overflow-hidden relative">
        {/* Subtle background glow effect */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
        
        <AppSidebar />
        
        <div className="flex flex-col flex-1 relative z-10 w-full overflow-hidden">
          <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" className="hover:bg-muted rounded-lg p-2 transition-colors" />
              <div className="h-4 w-px bg-border/50 hidden md:block" />
              <h2 className="text-sm font-medium text-muted-foreground hidden md:block">
                System Overview
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Sensors Active</span>
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-4 md:p-8 w-full scroll-smooth">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
