import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calculateCarry,
  type CalculateCarryResponse,
  getMaterials,
  type MaterialInfo,
} from "@/api";
import { Switch } from "@/components/ui/switch";
import { DistanceUnit, convertMetersToYards } from "@/types/units";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export function BallPhysicsCalculator() {
  const [speed, setSpeed] = useState<number>(0);
  const [vla, setVLA] = useState<number>(0);
  const [spin, setSpin] = useState<number>(0);
  const [material, setMaterial] = useState<string>("fairway");
  const [materials, setMaterials] = useState<MaterialInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unit, setUnit] = useState<DistanceUnit>("meters");
  const [upDownLie, setUpDownLie] = useState<string>("0");
  const [rightLeftLie, setRightLeftLie] = useState<string>("0");
  const [altitude, setAltitude] = useState<string>("0");
  const [elevationDiff, setElevationDiff] = useState<string>("0");
  const [result, setResult] = useState<CalculateCarryResponse | null>(null);
  const [_, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        const materialList = await getMaterials();
        setMaterials(materialList);
        // Set default material if current selection isn't in the list
        if (!materialList.some((m) => m.name === material)) {
          setMaterial(materialList[0]?.name ?? "");
        }
      } catch (err) {
        console.error("Failed to load materials:", err);
        setError("Failed to load materials");
      }
    };

    loadMaterials();
  }, [material, materials]); // Empty dependency array since we're caching

  const handleCalculate = async () => {
    if (speed && vla && spin) {
      setIsLoading(true);
      try {
        const calculatedResult = await calculateCarry({
          ballSpeed: speed,
          spin,
          vla,
          material,
          upDownLie: parseFloat(upDownLie) || 0,
          rightLeftLie: parseFloat(rightLeftLie) || 0,
          elevation: parseFloat(elevationDiff) || 0,
          altitude: parseFloat(altitude) || 0,
        });
        setResult(calculatedResult);
      } catch (error) {
        console.error("Error calculating carry:", error);
        setResult(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatDistance = (distance: number): string => {
    const convertedDistance =
      unit === "yards" ? convertMetersToYards(distance) : distance;
    return `${convertedDistance.toFixed(1)} ${unit}`;
  };

  return (
    <div className="p-6 min-h-[600px]">
      <h2 className="text-2xl font-bold mb-6">Ball Physics Calculator</h2>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 max-w-xl">
          <div className="space-y-2">
            <Label htmlFor="speed">Ball Speed</Label>
            <Input
              id="speed"
              type="number"
              min="0"
              max="150"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vla">VLA</Label>
            <Input
              id="vla"
              type="number"
              min="0"
              max="45"
              value={vla}
              onChange={(e) => setVLA(Number(e.target.value))}
              className="w-40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="spin">Spin</Label>
            <Input
              id="spin"
              type="number"
              min="0"
              value={spin}
              onChange={(e) => setSpin(Number(e.target.value))}
              className="w-40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="material">Lie/Material</Label>
            <Select value={material} onValueChange={setMaterial}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {materials.map((mat) => (
                  <SelectItem key={mat.name} value={mat.name}>
                    {mat.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="altitude">
              Altitude (feet)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground ml-2 inline" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Height above sea level.
                    <br />
                    Shots travel ~1% further per 500ft of altitude
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="altitude"
              type="number"
              value={altitude}
              onChange={(e) => setAltitude(e.target.value)}
              className="w-40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="elevation-diff">
              Elevation Difference ({unit})
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground ml-2 inline" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Height difference between ball and target.
                    <br />
                    Positive = uphill
                    <br />
                    Negative = downhill
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="elevation-diff"
              type="number"
              value={elevationDiff}
              onChange={(e) => setElevationDiff(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md">
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
              className="w-24"
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
              className="w-24"
            />
          </div>
        </div>

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

        <div className="mt-4 mb-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            onClick={handleCalculate}
            disabled={isLoading || !speed || !vla || !spin}
          >
            {isLoading ? "Calculating..." : "Calculate Carry"}
          </button>
        </div>

        {result && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Speed Modifier:</p>
                <p>{result.speedPenalty.toFixed(3)}</p>
              </div>
              <div>
                <p className="font-medium">Spin Modifier:</p>
                <p>{result.spinPenalty.toFixed(3)}</p>
              </div>
              <div>
                <p className="font-medium">VLA Modifier:</p>
                <p>{result.vlaPenalty.toFixed(3)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Modified Speed:</p>
                <p>{result.speedModified.toFixed(2)}</p>
              </div>
              <div>
                <p className="font-medium">Modified Spin:</p>
                <p>{result.spinModified.toFixed(2)}</p>
              </div>
              <div>
                <p className="font-medium">Modified VLA:</p>
                <p>{result.vlaModified.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Raw Carry:</p>
                <p>{formatDistance(result.carryRaw)}</p>
              </div>
              <div>
                <p className="font-medium">Modified Carry:</p>
                <p>{formatDistance(result.carryModified)}</p>
              </div>
              <div>
                <p className="font-medium">Final Carry:</p>
                <p>{formatDistance(result.envCarry)}</p>
              </div>
              {result.offlineDeviation !== 0 && (
                <div>
                  <p className="font-medium text-yellow-500">
                    Ball will travel{" "}
                    {formatDistance(Math.abs(result.offlineDeviation))}
                    {result.offlineDeviation > 0 ? " right" : " left"} of target
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
