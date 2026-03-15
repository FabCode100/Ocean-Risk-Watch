import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useListTemperaturePoints, useGetTemperatureHistory } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { formatTemp, formatRiskScore, getRiskColor, getRiskHexColor, cn } from "@/lib/utils";
import { Database, Filter, ExternalLink } from "lucide-react";

export default function TemperatureData() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");
  const [riskFilter, setRiskFilter] = useState<"all" | "normal" | "attention" | "critical">("all");
  
  const [selectedPointId, setSelectedPointId] = useState<number | null>(null);

  const { data: points, isLoading } = useListTemperaturePoints({
    period,
    ...(riskFilter !== "all" && { riskLevel: riskFilter as any }),
    limit: 100
  });

  const { data: historyData, isLoading: isLoadingHistory } = useGetTemperatureHistory(
    selectedPointId || 0,
    { query: { enabled: !!selectedPointId } }
  );

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Temperature Data</h1>
          <p className="text-muted-foreground mt-1">Raw telemetry and historical point analysis</p>
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

      <Card className="border-border/50 bg-card/30 backdrop-blur-md overflow-hidden shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Region</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Coordinates</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Temp</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Historical Avg</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Risk Score</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-4"><div className="h-6 bg-muted/50 rounded w-full" /></td>
                  </tr>
                ))
              ) : points?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <Database className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No data points found for the selected criteria.
                  </td>
                </tr>
              ) : (
                points?.map((point) => (
                  <tr 
                    key={point.id} 
                    onClick={() => setSelectedPointId(point.id)}
                    className="hover:bg-muted/20 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      {point.regionName}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      {point.latitude.toFixed(2)}, {point.longitude.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-foreground font-semibold">
                      {formatTemp(point.temperature)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {formatTemp(point.historicalAvg)}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {formatRiskScore(point.riskScore)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold border", getRiskColor(point.riskLevel))}>
                        {point.riskLevel}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {format(new Date(point.timestamp), "MMM d, HH:mm")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!selectedPointId} onOpenChange={(open) => !open && setSelectedPointId(null)}>
        <DialogContent className="max-w-3xl bg-card border-border/50 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Thermal History Analysis</DialogTitle>
            <DialogDescription>
              Historical view for {historyData?.point.regionName} ({historyData?.point.latitude.toFixed(2)}, {historyData?.point.longitude.toFixed(2)})
            </DialogDescription>
          </DialogHeader>

          {isLoadingHistory ? (
            <div className="h-[400px] flex items-center justify-center animate-pulse">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : historyData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Current</p>
                  <p className="text-2xl font-bold">{formatTemp(historyData.point.temperature)}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Historical Avg</p>
                  <p className="text-2xl font-bold">{formatTemp(historyData.point.historicalAvg)}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/20 border border-border/50 flex flex-col justify-center">
                  <p className="text-xs text-muted-foreground mb-1">Risk Status</p>
                  <Badge variant="outline" className={cn("w-fit px-2.5 py-1 uppercase text-xs border", getRiskColor(historyData.point.riskLevel))}>
                    {historyData.point.riskLevel}
                  </Badge>
                </div>
              </div>

              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData.history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(val) => format(new Date(val), "MMM d")}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(val) => `${val}°`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      labelFormatter={(val) => format(new Date(val), "PPP HH:mm")}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    
                    {/* Add reference line for historical average */}
                    <ReferenceLine 
                      y={historyData.point.historicalAvg} 
                      stroke="hsl(var(--primary))" 
                      strokeDasharray="5 5" 
                      label={{ position: 'insideTopLeft', value: 'Historical Avg', fill: 'hsl(var(--primary))', fontSize: 10 }}
                    />
                    
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke={getRiskHexColor(historyData.point.riskLevel)} 
                      strokeWidth={3}
                      dot={{ r: 4, fill: 'hsl(var(--card))', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: getRiskHexColor(historyData.point.riskLevel) }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
