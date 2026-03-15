import { Link, useLocation } from "wouter";
import { Activity, Map, Database, BrainCircuit, ShieldAlert } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: Activity },
  { title: "Heatmap", url: "/heatmap", icon: Map },
  { title: "Temperature Data", url: "/temperature", icon: Database },
  { title: "AI Insights", url: "/insights", icon: BrainCircuit },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r border-border/50 bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/80">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-border/50">
        <Link href="/" className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-wide text-foreground">
            EcoMonitor
          </span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">
            System Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title} className="mb-1">
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link 
                        href={item.url} 
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? "bg-primary/10 text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <div className="mt-auto p-6 text-xs text-muted-foreground/60 font-medium">
        <p>SMPT Core v2.4.1</p>
        <p className="mt-1">Marine Biodiversity Protection</p>
      </div>
    </Sidebar>
  );
}
