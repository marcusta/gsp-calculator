import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhyMatList } from "@/material";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import {
  DistanceUnit,
  convertMetersToYards,
  convertYardsToMeters,
} from "@/types/units";
import { suggestShot } from "@/trajectory";
import { getRoughSpeedPenalty } from "@/penalty";
import { getRoughSpinPenalty, getRoughVLAPenalty } from "@/penalty";
import { calculateOfflineDeviation } from "@/lie-calculation";

interface ShotSuggestion {
  club: string;
  power: number;
  estimatedCarry: number;
  rawCarry: number;
  ballSpeed: number;
  speedModifier: number;
  spin: number;
  spinModifier: number;
  launchAngle: number;
  vlaModifier: number;
  offlineDeviation: number;
}

export function ShotSuggester() {
  const [targetCarry, setTargetCarry] = useState<string>("");
  const [materialIndex, setMaterialIndex] = useState<number>(1);
  const [suggestions, setSuggestions] = useState<ShotSuggestion[] | null>(null);
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

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const targetDistance =
        unit === "yards"
          ? convertYardsToMeters(parseFloat(targetCarry))
          : parseFloat(targetCarry);

      if (isNaN(targetDistance)) {
        throw new Error("Please enter a valid target distance");
      }

      const suggestion = await suggestShot(
        targetDistance,
        materialIndex,
        parseFloat(upDownLie) || 0
      );

      // Get the modifiers
      const speedModifier = getRoughSpeedPenalty(
        materialIndex,
        suggestion.ballSpeed,
        suggestion.vla
      );
      const spinModifier = getRoughSpinPenalty(
        materialIndex,
        suggestion.ballSpeed,
        suggestion.vla
      );
      const vlaModifier = getRoughVLAPenalty(
        materialIndex,
        suggestion.ballSpeed,
        suggestion.vla
      );

      // Calculate offline deviation
      const offlineDeviation = calculateOfflineDeviation(
        suggestion.vla,
        parseFloat(rightLeftLie) || 0,
        suggestion.estimatedCarry
      );

      setSuggestions([
        {
          club: suggestion.clubName,
          power: suggestion.powerPercentage,
          estimatedCarry: suggestion.estimatedCarry,
          rawCarry: suggestion.rawCarry,
          ballSpeed: suggestion.ballSpeed / speedModifier, // Convert back to raw speed
          speedModifier,
          spin: suggestion.spin / spinModifier, // Convert back to raw spin
          spinModifier,
          launchAngle: suggestion.vla / vlaModifier, // Convert back to raw VLA
          vlaModifier,
          offlineDeviation,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-[600px]">
      <h2 className="text-2xl font-bold mb-6">Shot Suggester</h2>

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
            <Label htmlFor="target-carry">Target Carry Distance ({unit})</Label>
            <Input
              id="target-carry"
              type="number"
              value={targetCarry}
              onChange={(e) => setTargetCarry(e.target.value)}
              className="bg-background"
            />
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
          {loading ? "Calculating..." : "Get Shot Suggestions"}
        </Button>

        {error && <div className="text-red-500">{error}</div>}

        {suggestions && (
          <div className="mt-4 space-y-4">
            <h3 className="font-semibold">Suggested Shots:</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="border p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">{suggestion.club}</h4>
                  <p>Power: {suggestion.power.toFixed(1)}%</p>
                  <p>
                    Ball Speed: {suggestion.ballSpeed.toFixed(1)} mph
                    <span className="text-muted-foreground ml-2">
                      (×{suggestion.speedModifier.toFixed(3)})
                    </span>
                  </p>
                  <p>
                    Spin Rate: {suggestion.spin.toFixed(0)} rpm
                    <span className="text-muted-foreground ml-2">
                      (×{suggestion.spinModifier.toFixed(3)})
                    </span>
                  </p>
                  <p>
                    Launch Angle: {suggestion.launchAngle.toFixed(1)}°
                    <span className="text-muted-foreground ml-2">
                      (×{suggestion.vlaModifier.toFixed(3)})
                    </span>
                  </p>
                  <p>
                    Raw Carry:{" "}
                    {(unit === "yards"
                      ? convertMetersToYards(suggestion.rawCarry)
                      : suggestion.rawCarry
                    ).toFixed(1)}{" "}
                    {unit}
                  </p>
                  <p>
                    Estimated Carry:{" "}
                    {(unit === "yards"
                      ? convertMetersToYards(suggestion.estimatedCarry)
                      : suggestion.estimatedCarry
                    ).toFixed(1)}{" "}
                    {unit}
                  </p>
                  <p>
                    Aim{" "}
                    {(unit === "yards"
                      ? convertMetersToYards(
                          Math.abs(suggestion.offlineDeviation)
                        )
                      : Math.abs(suggestion.offlineDeviation)
                    ).toFixed(1)}{" "}
                    {unit} {suggestion.offlineDeviation > 0 ? "left" : "right"}
                    {suggestion.offlineDeviation === 0 ? "straight" : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
