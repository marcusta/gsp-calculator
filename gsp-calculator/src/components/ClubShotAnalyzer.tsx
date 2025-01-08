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
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCarryDataFromServer, type CarryData } from "@/api";
import { Switch } from "@/components/ui/switch";
import { DistanceUnit, convertMetersToYards } from "@/types/units";
import { Input } from "@/components/ui/input";
import {
  getModifiedLieVla,
  calculateOfflineDeviation,
} from "@/lie-calculation";

interface CarryResult {
  ballSpeed: number;
  spin: number;
  vla: number;
  rawCarry: number;
  estimatedCarry: number;
  offlineDeviation: number;
  modifiers: {
    speedPenalty: number;
    spinPenalty: number;
    vlaPenalty: number;
  };
}

export function ClubShotAnalyzer() {
  const [clubIndex, setClubIndex] = useState<number>(5); // Default to 7 iron
  const [materialIndex, setMaterialIndex] = useState<number>(1);
  const [results, setResults] = useState<CarryResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<DistanceUnit>("meters");
  const [upDownLie, setUpDownLie] = useState<string>("0");
  const [rightLeftLie, setRightLeftLie] = useState<string>("0");

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
  ): Promise<CarryData> => {
    console.log("calculateCarry by getting from server", ballSpeed, spin, vla);
    return await getCarryDataFromServer(ballSpeed, spin, vla);
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const club = clubRanges[clubIndex];
      const speedRange = club.speedMax - club.speedMin;
      const avgSpin = (club.spinMax + club.spinMin) / 2;
      const avgVLA = (club.vlaMax + club.vlaMin) / 2;

      // Calculate for five different speeds instead of three
      const speeds = [
        club.speedMin,
        club.speedMin + speedRange * 0.25, // 25% power
        club.speedMin + speedRange * 0.5, // 50% power
        club.speedMin + speedRange * 0.75, // 75% power
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

          // Apply lie angle modifications to VLA
          const baseVLA = avgVLA * vlaPenalty;
          const modifiedVLA = getModifiedLieVla(
            baseVLA,
            validateLieInput(upDownLie)
          );

          // Get raw carry (without lie angle)
          const rawCarry = await calculateCarry(speed, avgSpin, avgVLA);
          // Get estimated carry with penalties and lie angle
          const estimatedCarry = await calculateCarry(
            adjustedSpeed,
            adjustedSpin,
            modifiedVLA
          );

          // Calculate offline deviation if there's a right/left lie angle
          const offlineDeviation =
            validateLieInput(rightLeftLie) !== 0
              ? calculateOfflineDeviation(
                  modifiedVLA,
                  validateLieInput(rightLeftLie),
                  estimatedCarry.Carry
                )
              : 0;

          return {
            ballSpeed: speed,
            spin: avgSpin,
            vla: modifiedVLA,
            rawCarry: rawCarry.Carry,
            estimatedCarry: estimatedCarry.Carry,
            offlineDeviation,
            modifiers: {
              speedPenalty,
              spinPenalty,
              vlaPenalty,
            },
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

  const validateLieInput = (value: string): number => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  return (
    <div className="p-6 min-h-[600px]">
      <h2 className="text-2xl font-bold mb-6">Club Shot Calculator</h2>

      <div className="flex items-center space-x-2 mb-4">
        <Switch
          id="unit-toggle"
          checked={unit === "yards"}
          onCheckedChange={(checked) => setUnit(checked ? "yards" : "meters")}
        />
        <Label htmlFor="unit-toggle" className="text-sm font-medium">
          Show distances in yards
        </Label>
      </div>

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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="updown-lie">
              Up/Down Slope (degrees)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground ml-2 inline" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Positive value = uphill lie
                    <br />
                    Negative value = downhill lie
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="updown-lie"
              type="number"
              value={upDownLie}
              onChange={(e) => setUpDownLie(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rightleft-lie">
              Right/Left Slope (degrees)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground ml-2 inline" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Positive value = right slope
                    <br />
                    Negative value = left slope
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="rightleft-lie"
              type="number"
              value={rightLeftLie}
              onChange={(e) => setRightLeftLie(e.target.value)}
              className="bg-background"
            />
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
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold mb-2">
                    {index === 0
                      ? "Minimum"
                      : index === 1
                      ? "Quarter"
                      : index === 2
                      ? "Half"
                      : index === 3
                      ? "Three-Quarter"
                      : "Maximum"}{" "}
                    Power
                  </h4>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground -translate-y-1" />
                      </TooltipTrigger>
                      <TooltipContent className="space-y-2 bg-blue-800">
                        <p className="font-semibold">Applied Modifiers:</p>
                        <p>
                          Speed:{" "}
                          {((1 - result.modifiers.speedPenalty) * 100).toFixed(
                            1
                          )}
                          % reduction
                        </p>
                        <p>
                          Spin:{" "}
                          {((result.modifiers.spinPenalty - 1) * 100).toFixed(
                            1
                          )}
                          % increase
                        </p>
                        <p>
                          Launch Angle:{" "}
                          {((result.modifiers.vlaPenalty - 1) * 100).toFixed(1)}
                          % change
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p>Ball Speed: {result.ballSpeed.toFixed(1)} mph</p>
                <p>Spin Rate: {result.spin.toFixed(0)} rpm</p>
                <p>Launch Angle: {result.vla.toFixed(1)}°</p>
                <div className="mt-2">
                  <p>
                    Raw Carry:{" "}
                    {(unit === "yards"
                      ? convertMetersToYards(result.rawCarry)
                      : result.rawCarry
                    ).toFixed(1)}
                    {unit}
                  </p>
                  <p>
                    With Penalties:{" "}
                    {(unit === "yards"
                      ? convertMetersToYards(result.estimatedCarry)
                      : result.estimatedCarry
                    ).toFixed(1)}
                    {unit}
                  </p>
                  <p className="text-red-500">
                    Carry Reduced by{" "}
                    {calculatePenaltyPercentage(
                      result.rawCarry,
                      result.estimatedCarry
                    )}
                    %
                  </p>
                  {result.offlineDeviation !== 0 && (
                    <p className="text-yellow-500">
                      Ball will travel{" "}
                      {unit === "yards"
                        ? convertMetersToYards(
                            Math.abs(result.offlineDeviation)
                          ).toFixed(1)
                        : Math.abs(result.offlineDeviation).toFixed(1)}
                      {unit} {result.offlineDeviation > 0 ? "right" : "left"} of
                      target
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
