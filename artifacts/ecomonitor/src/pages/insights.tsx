import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { useGetRegionsRiskSummary, useGenerateInsights } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, AlertTriangle, Info, MapPin, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { getRiskColor, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { RegionRiskSummary } from "@workspace/api-client-react";

export default function Insights() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialRegion = searchParams.get("region");
  
  const [selectedRegion, setSelectedRegion] = useState<RegionRiskSummary | null>(null);
  
  const { data: regions, isLoading: isLoadingRegions } = useGetRegionsRiskSummary();
  const { mutate: generateInsights, data: insightData, isPending, reset } = useGenerateInsights();

  // Auto-select region from URL or first available
  useEffect(() => {
    if (regions && regions.length > 0 && !selectedRegion) {
      const match = initialRegion ? regions.find(r => r.regionName === initialRegion) : null;
      handleSelectRegion(match || regions[0]);
    }
  }, [regions, initialRegion]);

  const handleSelectRegion = (region: RegionRiskSummary) => {
    setSelectedRegion(region);
    reset(); // clear previous insights
    
    // Trigger insight generation
    generateInsights({
      data: {
        regionName: region.regionName,
        latitude: region.centerLat,
        longitude: region.centerLng,
        temperature: region.avgTemperature,
        historicalAvg: region.avgTemperature - (region.trend7d / 2), // Estimation for prompt
        historicalStdDev: 1.2, // Mocked for systemic representation
        riskLevel: region.dominantRiskLevel,
        trend7d: region.trend7d
      }
    });
  };

  return (
    <MainLayout>
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-2xl bg-primary/20 text-primary border border-primary/20 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
          <BrainCircuit className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">AI Oceanography Analyst</h1>
          <p className="text-muted-foreground mt-1">Claude-powered ecological diagnostics and intervention planning</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Column: Region List */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground ml-1 mb-2">
            Target Regions
          </h3>
          
          {isLoadingRegions ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-card/50 rounded-xl border border-border/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto pr-2 pb-10">
              {regions?.map(region => {
                const isSelected = selectedRegion?.regionName === region.regionName;
                return (
                  <button
                    key={region.regionName}
                    onClick={() => handleSelectRegion(region)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group",
                      isSelected 
                        ? "bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]" 
                        : "bg-card/40 border-border/50 hover:bg-card hover:border-border"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(6,182,212,1)]" />
                    )}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={cn("font-semibold", isSelected ? "text-primary" : "text-foreground")}>
                          {region.regionName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {region.pointsCount} telemetry points
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("uppercase text-[10px] px-2 py-0 border", getRiskColor(region.dominantRiskLevel))}>
                        {region.dominantRiskLevel}
                      </Badge>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: AI Analysis Panel */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {isPending ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-[600px] flex flex-col items-center justify-center bg-card/30 border border-border/50 rounded-2xl backdrop-blur-md relative overflow-hidden"
              >
                {/* Decorative background image blended */}
                <div className="absolute inset-0 opacity-10 mix-blend-screen pointer-events-none">
                  <img src={`${import.meta.env.BASE_URL}images/ocean-bg.png`} alt="" className="w-full h-full object-cover" />
                </div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                    <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
                  </div>
                  <h3 className="text-xl font-display font-semibold text-foreground">Claude is analyzing data...</h3>
                  <p className="text-muted-foreground mt-2 max-w-sm text-center text-sm">
                    Processing thermal anomalies, historical variances, and marine ecosystem impact for {selectedRegion?.regionName}.
                  </p>
                </div>
              </motion.div>
            ) : insightData ? (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <img src={`${import.meta.env.BASE_URL}images/logo-mark.png`} alt="Logo" className="w-48 h-48 object-contain mix-blend-screen" />
                  </div>
                  
                  <div className="p-8 relative z-10">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-border/50">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-display font-bold">{insightData.regionName}</h2>
                          {insightData.cached && (
                            <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
                              Cached Result
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Sparkles className="w-4 h-4 text-primary" />
                          Generated by Claude 3.5 Sonnet
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Assessed Risk</p>
                        <Badge className={cn("px-4 py-1.5 text-sm uppercase border", getRiskColor(insightData.riskLevel))}>
                          {insightData.riskLevel}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <section>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-foreground">
                          <Info className="w-5 h-5 text-primary" />
                          Ecological Diagnosis
                        </h3>
                        <div className="p-5 rounded-xl bg-muted/20 border border-border/50 text-foreground/90 leading-relaxed text-sm">
                          {insightData.diagnosis}
                        </div>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-foreground">
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                          Vulnerable Species
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {insightData.vulnerableSpecies.map((species, i) => (
                            <Badge key={i} variant="outline" className="bg-amber-400/5 text-amber-400 border-amber-400/20 px-3 py-1 text-sm">
                              {species}
                            </Badge>
                          ))}
                        </div>
                      </section>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section>
                          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-foreground">
                            <AlertCircle className="w-5 h-5 text-rose-500" />
                            Immediate Actions
                          </h3>
                          <ul className="space-y-3">
                            {insightData.immediateActions.map((action, i) => (
                              <li key={i} className="flex gap-3 text-sm text-foreground/80 bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
                                <span className="font-bold text-rose-500 shrink-0">{i + 1}.</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </section>

                        <section>
                          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-foreground">
                            <MapPin className="w-5 h-5 text-blue-400" />
                            30-Day Projection
                          </h3>
                          <div className="h-full p-5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-blue-100/90 leading-relaxed text-sm">
                            {insightData.projection30d}
                          </div>
                        </section>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center bg-card/30 border border-border/50 rounded-2xl border-dashed">
                <BrainCircuit className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-display font-medium text-muted-foreground">Select a region to begin analysis</h3>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
}
