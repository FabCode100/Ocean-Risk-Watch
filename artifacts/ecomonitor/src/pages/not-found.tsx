import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative bg */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <img src={`${import.meta.env.BASE_URL}images/ocean-bg.png`} alt="" className="w-full h-full object-cover" />
      </div>
      
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl relative z-10">
        <CardContent className="pt-10 pb-8 px-8 flex flex-col items-center text-center">
          <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-6">
            <ShieldAlert className="h-10 w-10" />
          </div>
          
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">404 Not Found</h1>
          <p className="text-muted-foreground text-sm mb-8">
            The requested monitoring sector does not exist or has been restricted. 
            Return to the main dashboard to continue surveillance.
          </p>
          
          <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            <Link href="/">Return to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
