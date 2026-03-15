import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useGetHeatmapData } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Filter, Layers } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { formatTemp, getRiskHexColor, getRiskColor, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Heatmap() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");
  const [riskFilter, setRiskFilter] = useState<"all" | "normal" | "attention" | "critical">("all");
  
  // To avoid SSR issues with Leaflet, we only render it after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data, isLoading } = useGetHeatmapData({
    period,
    ...(riskFilter !== "all" && { riskLevel: riskFilter as any })
  });

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Thermal Heatmap</h1>
            <p className="text-muted-foreground mt-1">Interactive spatial anomaly detection</p>
          </div>
          
          <div className="flex items-center gap-3 bg-card/50 backdrop-blur-md p-2 rounded-xl border border-border/50 shadow-lg">
            <div className="flex items-center gap-2 px-3 border-r border-border/50">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filters</span>
            </div>
            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger className="w-[130px] border-none bg-transparent shadow-none focus:ring-0">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            <div className="w-px h-6 bg-border/50" />
            <Select value={riskFilter} onValueChange={(v: any) => setRiskFilter(v)}>
              <SelectTrigger className="w-[140px] border-none bg-transparent shadow-none focus:ring-0">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="critical">Critical Only</SelectItem>
                <SelectItem value="attention">Attention Only</SelectItem>
                <SelectItem value="normal">Normal Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
          {/* Stats Sidebar */}
          <div className="flex flex-col gap-4 overflow-y-auto pr-2">
            <Card className="bg-card/40 backdrop-blur-md border-border/50 p-5 rounded-2xl shrink-0">
              <div className="flex items-center gap-3 mb-4">
                <Layers className="w-5 h-5 text-primary" />
                <h3 className="font-display font-semibold text-lg">Map Overview</h3>
              </div>
              
              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-10 bg-muted/50 rounded-lg" />
                  <div className="h-10 bg-muted/50 rounded-lg" />
                  <div className="h-10 bg-muted/50 rounded-lg" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-muted/20 border border-border/30">
                    <span className="text-sm text-muted-foreground">Total Points</span>
                    <span className="font-bold text-foreground">{data?.stats.total || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <span className="text-sm text-rose-500/80">Critical Risk</span>
                    <span className="font-bold text-rose-500">{data?.stats.critical || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-xl bg-amber-400/5 border border-amber-400/20">
                    <span className="text-sm text-amber-400/80">Attention Needed</span>
                    <span className="font-bold text-amber-400">{data?.stats.attention || 0}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <span className="text-sm text-emerald-500/80">Normal Zones</span>
                    <span className="font-bold text-emerald-500">{data?.stats.normal || 0}</span>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Global Avg Temperature</p>
                    <p className="text-2xl font-display font-bold text-foreground">
                      {formatTemp(data?.stats.avgTemperature || 0)}
                    </p>
                  </div>
                  
                  <div className="pb-2">
                    <p className="text-xs text-muted-foreground mb-1">Peak Risk Score</p>
                    <p className="text-xl font-mono text-foreground">
                      {(data?.stats.maxRiskScore || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </Card>
            
            <div className="mt-auto hidden lg:block">
              <p className="text-xs text-muted-foreground/60 leading-relaxed">
                Map data is optimized for high-performance rendering. Click on any point to view detailed historical data and trigger AI insights.
              </p>
            </div>
          </div>

          {/* Map Area */}
          <Card className="col-span-1 lg:col-span-3 rounded-2xl overflow-hidden border-border/50 relative min-h-[400px]">
            {!mounted || isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-card/20 animate-pulse">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <MapContainer 
                center={[-15, -38]} // Center of Brazil coast
                zoom={4} 
                className="w-full h-full z-0"
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <ZoomControl position="bottomright" />
                
                {data?.points.map((p, i) => {
                  const color = getRiskHexColor(p.riskLevel);
                  return (
                    <CircleMarker
                      key={i}
                      center={[p.lat, p.lng]}
                      radius={p.riskLevel === 'critical' ? 12 : p.riskLevel === 'attention' ? 8 : 5}
                      pathOptions={{
                        fillColor: color,
                        fillOpacity: 0.6,
                        color: color,
                        weight: 2
                      }}
                    >
                      <Popup className="bg-transparent border-none shadow-none">
                        <div className="p-2 space-y-3 min-w-[200px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground font-mono">
                              {p.lat.toFixed(2)}, {p.lng.toFixed(2)}
                            </span>
                            <Badge variant="outline" className={cn("text-[10px] uppercase", getRiskColor(p.riskLevel))}>
                              {p.riskLevel}
                            </Badge>
                          </div>
                          
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Current Temp</p>
                            <p className="text-xl font-bold text-foreground">
                              {formatTemp(p.intensity)}
                            </p>
                          </div>
                          
                          <Button asChild size="sm" className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20">
                            <Link href={`/insights?lat=${p.lat}&lng=${p.lng}&temp=${p.intensity}&risk=${p.riskLevel}`}>
                              <BrainCircuit className="w-3.5 h-3.5 mr-2" />
                              Get AI Insights
                            </Link>
                          </Button>
                        </div>
                      </Popup>
                    </CircleMarker>
                  )
                })}
              </MapContainer>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
