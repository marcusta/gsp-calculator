import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clubRanges, clubNames } from "@/trajectory";
import { PhyMatList } from "@/material";
import {
  getRoughSpeedPenalty,
  getRoughSpinPenalty,
  getRoughVLAPenalty,
} from "@/penalty";
import { getCarryFromServer } from "@/api";

interface CarryResult {
  ballSpeed: number;
  spin: number;
  vla: number;
  rawCarry: number;
  estimatedCarry: number;
}

export function ShotSuggester() {
  const [clubIndex, setClubIndex] = useState<number>(5); // Default to 7 iron
  const [materialIndex, setMaterialIndex] = useState<number>(1);
  const [results, setResults] = useState<CarryResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter PhyMatList to only include materials that have entries in the penalty tables
  const validMaterialIndices = [1, 3, 4, 6, 11, 12, 13, 16, 17];
  const validMaterials = validMaterialIndices.map((index) => ({
    index,
    name: PhyMatList[index],
  }));

  const calculateCarry = async (
    ballSpeed: number,
    spin: number,
    vla: number
  ): Promise<number> => {
    return await getCarryFromServer(ballSpeed, spin, vla);
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const club = clubRanges[clubIndex];
      const speedRange = club.speedMax - club.speedMin;
      const avgSpin = (club.spinMax + club.spinMin) / 2;
      const avgVLA = (club.vlaMax + club.vlaMin) / 2;

      // Calculate for three different speeds: min, middle, and max
      const speeds = [
        club.speedMin,
        club.speedMin + speedRange / 2,
        club.speedMax,
      ];

      const results = await Promise.all(
        speeds.map(async (speed) => {
          // Apply penalties
          const speedPenalty = getRoughSpeedPenalty(
            materialIndex,
            speed,
            avgVLA
          );
          const spinPenalty = getRoughSpinPenalty(materialIndex, speed, avgVLA);
          const vlaPenalty = getRoughVLAPenalty(materialIndex, speed, avgVLA);

          const adjustedSpeed = speed * speedPenalty;
          const adjustedSpin = avgSpin * spinPenalty;
          const adjustedVLA = avgVLA * vlaPenalty;

          // Get raw carry
          const rawCarry = await calculateCarry(speed, avgSpin, avgVLA);
          // Get estimated carry with penalties
          const estimatedCarry = await calculateCarry(
            adjustedSpeed,
            adjustedSpin,
            adjustedVLA
          );

          return {
            ballSpeed: speed,
            spin: avgSpin,
            vla: avgVLA,
            rawCarry,
            estimatedCarry,
          };
        })
      );

      setResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const calculatePenaltyPercentage = (raw: number, withPenalty: number) => {
    const reduction = ((raw - withPenalty) / raw) * 100;
    return reduction.toFixed(1);
  };

  return (
    <div className="p-6 min-h-[600px]">
      <h2 className="text-2xl font-bold mb-6">Club Shot Calculator</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="club">Club</Label>
            <Select
              value={clubIndex.toString()}
              onValueChange={(value) => setClubIndex(Number(value))}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select club" />
              </SelectTrigger>
              <SelectContent>
                {clubNames.map((name, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="material">Lie/Material</Label>
            <Select
              value={materialIndex.toString()}
              onValueChange={(value) => setMaterialIndex(Number(value))}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {validMaterials.map(({ index, name }) => (
                  <SelectItem key={index} value={index.toString()}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleCalculate} disabled={loading}>
          {loading ? "Calculating..." : "Calculate"}
        </Button>

        {error && <div className="text-red-500">{error}</div>}

        {results && (
          <div className="mt-4 space-y-4">
            <h3 className="font-semibold">
              Shot Parameters for {clubNames[clubIndex]}:
            </h3>

            {results.map((result, index) => (
              <div key={index} className="border p-4 rounded-lg">
                <h4 className="font-semibold mb-2">
                  {index === 0 ? "Minimum" : index === 1 ? "Middle" : "Maximum"}{" "}
                  Power
                </h4>
                <p>Ball Speed: {result.ballSpeed.toFixed(1)} mph</p>
                <p>Spin Rate: {result.spin.toFixed(0)} rpm</p>
                <p>Launch Angle: {result.vla.toFixed(1)}°</p>
                <div className="mt-2">
                  <p>Raw Carry: {result.rawCarry.toFixed(1)}m</p>
                  <p>With Penalties: {result.estimatedCarry.toFixed(1)}m</p>
                  <p className="text-red-500">
                    Carry Reduced by{" "}
                    {calculatePenaltyPercentage(
                      result.rawCarry,
                      result.estimatedCarry
                    )}
                    %
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
