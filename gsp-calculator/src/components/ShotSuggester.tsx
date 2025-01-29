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
import { suggestShot } from "@/api";

interface ShotSuggestion {
  club: string;
  estimatedCarry: number;
  rawCarry: number;
  offlineDeviation: number;
}

// Add mapping between indices and material names
const validMaterials = [
  { name: "fairway", title: "Fairway" },
  { name: "rough", title: "Rough" },
  { name: "sand", title: "Sand" },
  { name: "deeprough", title: "Deep rough" },
  { name: "semirough", title: "Semi rough" },
  { name: "tee", title: "Tee" },
  { name: "pinestraw", title: "Pine straw" },
  { name: "concrete", title: "Concrete" },
  { name: "earth", title: "Earth" },
  { name: "leaves", title: "Leaves" },
  { name: "stone", title: "Stone" },
];

export function ShotSuggester() {
  const [targetCarry, setTargetCarry] = useState<string>("");
  const [suggestions, setSuggestions] = useState<ShotSuggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<DistanceUnit>("meters");
  const [upDownLie, setUpDownLie] = useState<string>("0");
  const [rightLeftLie, setRightLeftLie] = useState<string>("0");
  const [altitude, setAltitude] = useState<string>("0");
  const [elevationDiff, setElevationDiff] = useState<string>("0");
  const [material, setMaterial] = useState<string>("");

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const targetDistance =
        unit === "yards"
          ? convertYardsToMeters(parseFloat(targetCarry))
          : parseFloat(targetCarry);

      const elevationDiffMeters =
        unit === "yards"
          ? convertYardsToMeters(parseFloat(elevationDiff) || 0)
          : parseFloat(elevationDiff) || 0;

      if (isNaN(targetDistance)) {
        throw new Error("Please enter a valid target distance");
      }

      const suggestion = await suggestShot(
        targetDistance,
        material,
        parseFloat(upDownLie) || 0,
        parseFloat(rightLeftLie) || 0,
        elevationDiffMeters,
        parseFloat(altitude) || 0
      );

      setSuggestions([
        {
          club: suggestion.clubName,
          estimatedCarry: suggestion.estimatedCarry,
          rawCarry: suggestion.rawCarry,
          offlineDeviation: suggestion.offlineAimAdjustment,
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
              value={material}
              onValueChange={(value) => setMaterial(value)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {validMaterials.map(({ name, title }) => (
                  <SelectItem key={name} value={name}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
              className="bg-background"
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
              className="bg-background"
            />
          </div>
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
            <h3 className="font-semibold">Suggested Shot:</h3>
            <div className="grid gap-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="border p-4 rounded-lg">
                  <p className="text-lg font-semibold mb-2">
                    Club: {suggestion.club}
                  </p>
                  <p>
                    Plays as:{" "}
                    {(unit === "yards"
                      ? convertMetersToYards(suggestion.rawCarry)
                      : suggestion.rawCarry
                    ).toFixed(1)}{" "}
                    {unit}
                  </p>
                  {suggestion.offlineDeviation !== 0 && (
                    <p>
                      Aim{" "}
                      {(unit === "yards"
                        ? convertMetersToYards(
                            Math.abs(suggestion.offlineDeviation)
                          )
                        : Math.abs(suggestion.offlineDeviation)
                      ).toFixed(1)}{" "}
                      {unit}{" "}
                      {suggestion.offlineDeviation < 0 ? "left" : "right"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
