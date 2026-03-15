import { db, temperatureReadings } from "@workspace/db";

const BRAZILIAN_REGIONS = [
  { name: "Amazônia Azul - Norte", centerLat: -1.5, centerLng: -44.0, historicalAvg: 27.8, stdDev: 0.9 },
  { name: "Atol das Rocas", centerLat: -3.85, centerLng: -33.81, historicalAvg: 27.2, stdDev: 0.8 },
  { name: "Arquipélago de Fernando de Noronha", centerLat: -3.85, centerLng: -32.43, historicalAvg: 27.5, stdDev: 0.7 },
  { name: "Costa do Maranhão", centerLat: -2.5, centerLng: -44.5, historicalAvg: 27.4, stdDev: 1.0 },
  { name: "Costa do Ceará", centerLat: -3.7, centerLng: -38.5, historicalAvg: 27.1, stdDev: 0.9 },
  { name: "Costa do Rio Grande do Norte", centerLat: -5.0, centerLng: -35.5, historicalAvg: 26.8, stdDev: 0.8 },
  { name: "Costa da Paraíba e Pernambuco", centerLat: -8.0, centerLng: -34.9, historicalAvg: 26.5, stdDev: 1.1 },
  { name: "Costa de Alagoas e Sergipe", centerLat: -10.5, centerLng: -36.5, historicalAvg: 26.3, stdDev: 1.0 },
  { name: "Costa Sul da Bahia", centerLat: -15.0, centerLng: -38.9, historicalAvg: 25.8, stdDev: 1.2 },
  { name: "Costa Norte da Bahia", centerLat: -12.5, centerLng: -37.8, historicalAvg: 26.0, stdDev: 1.1 },
  { name: "Abrolhos", centerLat: -17.98, centerLng: -38.69, historicalAvg: 25.2, stdDev: 1.3 },
  { name: "Costa do Espírito Santo", centerLat: -20.3, centerLng: -40.0, historicalAvg: 24.5, stdDev: 1.4 },
  { name: "Costa do Rio de Janeiro", centerLat: -23.0, centerLng: -43.5, historicalAvg: 23.2, stdDev: 1.6 },
  { name: "Costa de São Paulo", centerLat: -24.5, centerLng: -46.0, historicalAvg: 22.5, stdDev: 1.8 },
  { name: "Costa do Paraná e Santa Catarina", centerLat: -27.5, centerLng: -48.5, historicalAvg: 21.0, stdDev: 2.0 },
  { name: "Costa do Rio Grande do Sul", centerLat: -32.0, centerLng: -52.0, historicalAvg: 19.5, stdDev: 2.3 },
];

function gaussianRandom(mean: number, std: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function calculateRiskScore(temp: number, avg: number, std: number): number {
  return (temp - avg) / std;
}

function getRiskLevel(score: number): "normal" | "attention" | "critical" {
  if (score > 2.0) return "critical";
  if (score >= 1.0) return "attention";
  return "normal";
}

function generatePointsForRegion(region: typeof BRAZILIAN_REGIONS[0], pointsPerRegion = 6) {
  const points = [];
  const latRange = 1.5;
  const lngRange = 1.5;

  for (let i = 0; i < pointsPerRegion; i++) {
    const lat = region.centerLat + (Math.random() - 0.5) * latRange;
    const lng = region.centerLng + (Math.random() - 0.5) * lngRange;

    const anomalyBias = Math.random() < 0.15 ? gaussianRandom(2.5, 0.5) :
                        Math.random() < 0.25 ? gaussianRandom(1.5, 0.3) :
                        gaussianRandom(0.0, 0.5);

    const temp = region.historicalAvg + anomalyBias * region.stdDev;
    const riskScore = calculateRiskScore(temp, region.historicalAvg, region.stdDev);
    const riskLevel = getRiskLevel(riskScore);
    const trend7d = gaussianRandom(0, 0.3);

    points.push({
      latitude: lat,
      longitude: lng,
      temperature: Math.round(temp * 100) / 100,
      historicalAvg: region.historicalAvg,
      historicalStdDev: region.stdDev,
      riskScore: Math.round(riskScore * 1000) / 1000,
      riskLevel,
      regionName: region.name,
      trend7d: Math.round(trend7d * 100) / 100,
      source: "noaa-erddap-simulated",
      timestamp: new Date(),
    });
  }
  return points;
}

export async function collectOceanData() {
  const allPoints = [];

  for (const region of BRAZILIAN_REGIONS) {
    const points = generatePointsForRegion(region, 6);
    allPoints.push(...points);
  }

  const inserted = await db.insert(temperatureReadings).values(allPoints).returning({ id: temperatureReadings.id });
  return inserted.length;
}

export { BRAZILIAN_REGIONS };
