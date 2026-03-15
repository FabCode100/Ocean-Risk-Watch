import { useGetRegionsRiskSummary, useTriggerDataCollection } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Activity, Map, ArrowUpRight, ArrowDownRight, RefreshCw, ThermometerSun, ShieldAlert, BrainCircuit } from "lucide-react";
import { cn, formatTemp, formatRiskScore, getRiskColor } from "@/lib/utils";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: regions, isLoading, refetch } = useGetRegionsRiskSummary();
  const { mutate: triggerCollection, isPending } = useTriggerDataCollection();
  const { toast } = useToast();

  const handleTrigger = () => {
    triggerCollection(undefined, {
      onSuccess: (res) => {
        toast({
          title: "Collection Triggered",
          description: res.message || `Collected ${res.pointsCollected} new data points.`,
        });
        refetch();
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to trigger data collection. Check API connection.",
          variant: "destructive",
        });
      }
    });
  };

  const totalPoints = regions?.reduce((acc, r) => acc + r.pointsCount, 0) || 0;
  const totalCritical = regions?.reduce((acc, r) => acc + r.criticalCount, 0) || 0;
  const totalAttention = regions?.reduce((acc, r) => acc + r.attentionCount, 0) || 0;
  
  const overallAvgTemp = regions && regions.length > 0 
    ? regions.reduce((acc, r) => acc + r.avgTemperature, 0) / regions.length 
    : 0;

  let systemStatus = "Normal";
  let statusColor = "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
  let statusGlow = "shadow-[0_0_40px_rgba(52,211,153,0.15)]";

  if (totalCritical > 0) {
    systemStatus = "Critical Alert";
    statusColor = "text-rose-500 bg-rose-500/10 border-rose-500/20";
    statusGlow = "shadow-[0_0_40px_rgba(244,63,94,0.25)]";
  } else if (totalAttention > 0) {
    systemStatus = "Attention Required";
    statusColor = "text-amber-400 bg-amber-400/10 border-amber-400/20";
    statusGlow = "shadow-[0_0_40px_rgba(251,191,36,0.15)]";
  }

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Global Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time systemic thermal monitoring</p>
        </div>
        
        <Button 
          onClick={handleTrigger} 
          disabled={isPending || isLoading}
          className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 shadow-lg shadow-primary/5 rounded-xl px-6"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isPending && "animate-spin")} />
          {isPending ? "Collecting..." : "Force Data Sync"}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-card rounded-2xl border border-border/50" />
          ))}
        </div>
      ) : (
        <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-8">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div variants={itemVars}>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-colors">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Sensors</p>
                      <h3 className="text-3xl font-display font-bold mt-2 text-foreground">{totalPoints}</h3>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <Activity className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVars}>
              <Card className={cn("bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-colors", statusGlow)}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">System Status</p>
                      <h3 className={cn("text-xl font-display font-bold mt-3", statusColor.split(' ')[0])}>
                        {systemStatus}
                      </h3>
                    </div>
                    <div className={cn("p-3 rounded-xl border", statusColor)}>
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVars}>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-colors">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Critical Zones</p>
                      <h3 className="text-3xl font-display font-bold mt-2 text-rose-500">{totalCritical}</h3>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVars}>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-colors">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Global Avg Temp</p>
                      <h3 className="text-3xl font-display font-bold mt-2 text-foreground">
                        {formatTemp(overallAvgTemp)}
                      </h3>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                      <ThermometerSun className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Regional Summary Table/Cards */}
          <motion.div variants={itemVars}>
            <Card className="border-border/50 bg-card/30 backdrop-blur-md overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-card/50 pb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl font-display">Regional Risk Profiles</CardTitle>
                    <CardDescription className="mt-1">Detailed breakdown of oceanic temperature anomalies</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild className="rounded-lg border-border/50">
                    <Link href="/heatmap">
                      <Map className="w-4 h-4 mr-2" /> View Map
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/50">
                      <tr>
                        <th className="px-6 py-4 font-semibold tracking-wider">Region</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Avg Temp</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Max Risk Score</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Trend (7d)</th>
                        <th className="px-6 py-4 text-right font-semibold tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {regions?.map((region) => (
                        <tr key={region.regionName} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4 font-medium text-foreground">{region.regionName}</td>
                          <td className="px-6 py-4">{formatTemp(region.avgTemperature)}</td>
                          <td className="px-6 py-4 font-mono text-muted-foreground">{formatRiskScore(region.maxRiskScore)}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={cn("px-2.5 py-1 text-xs uppercase tracking-wider font-semibold border", getRiskColor(region.dominantRiskLevel))}>
                              {region.dominantRiskLevel}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              {region.trend7d > 0 ? (
                                <ArrowUpRight className="w-4 h-4 text-rose-500" />
                              ) : (
                                <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                              )}
                              <span className={region.trend7d > 0 ? "text-rose-500 font-medium" : "text-emerald-400 font-medium"}>
                                {Math.abs(region.trend7d).toFixed(2)}°
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 hover:text-primary rounded-lg transition-colors">
                              <Link href={`/insights?region=${encodeURIComponent(region.regionName)}`}>
                                Analyze <BrainCircuit className="w-3 h-3 ml-2" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {(!regions || regions.length === 0) && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                            No regional data available. Trigger a collection to gather data.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </motion.div>
      )}
    </MainLayout>
  );
}
