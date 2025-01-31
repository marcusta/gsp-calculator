import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import {
  analyzeClubShot,
  type ShotIncrementResult,
  getClubs,
  type ClubInfo,
  getMaterials,
  type MaterialInfo,
} from "@/api";
import { Switch } from "@/components/ui/switch";
import { DistanceUnit, convertMetersToYards } from "@/types/units";
import { Input } from "@/components/ui/input";
import { useUnit } from "../contexts/UnitContext";

export function ClubShotAnalyzer() {
  const { unitSystem } = useUnit();
  const [club, setClub] = useState<string>("7 Iron"); // Default to 7 iron
  const [clubs, setClubs] = useState<ClubInfo[]>([]);
  const [material, setMaterial] = useState<string>("fairway");
  const [results, setResults] = useState<(ShotIncrementResult | null)[] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upDownLie, setUpDownLie] = useState<string>("0");
  const [rightLeftLie, setRightLeftLie] = useState<string>("0");
  const [altitude, setAltitude] = useState<string>("0");
  const [elevation, setElevation] = useState<string>("0");
  const [materials, setMaterials] = useState<MaterialInfo[]>([]);

  // Update useEffect to remove dependency
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clubList, materialList] = await Promise.all([
          getClubs(),
          getMaterials(),
        ]);

        setClubs(clubList);
        setMaterials(materialList);

        // Set default club if current selection isn't in the list
        if (!clubList.some((c) => c.name === club)) {
          setClub(clubList[0]?.name ?? "");
        }
        // Set default material if current selection isn't in the list
        if (!materialList.some((m) => m.name === material)) {
          setMaterial(materialList[0]?.name ?? "");
        }
      } catch (err) {
        console.error("Failed to load initial data:", err);
        setError("Failed to load clubs and materials");
      }
    };

    loadData();
  }, []); // Empty dependency array since we're caching

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await analyzeClubShot(
        club,
        material,
        validateLieInput(upDownLie),
        validateLieInput(rightLeftLie),
        validateLieInput(elevation),
        validateLieInput(altitude)
      );
      setResults(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const validateLieInput = (value: string): number => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const formatDistance = (meters: number): string => {
    const distance =
      unitSystem === "imperial" ? convertMetersToYards(meters) : meters;
    return `${distance.toFixed(1)}${
      unitSystem === "imperial" ? "yards" : "meters"
    }`;
  };

  return (
    <div className="p-6 min-h-[600px]">
      <h2 className="text-2xl font-bold mb-6">Club Shot Calculator</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="club">Club</Label>
            <Select value={club} onValueChange={setClub}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select club" />
              </SelectTrigger>
              <SelectContent>
                {clubs.map((club) => (
                  <SelectItem key={club.name} value={club.name}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="material">Lie/Material</Label>
            <Select value={material} onValueChange={setMaterial}>
              <SelectTrigger className="bg-background">
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
          <Label htmlFor="elevation">
            Elevation Difference (
            {unitSystem === "imperial" ? "yards" : "meters"})
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
            id="elevation"
            type="number"
            value={elevation}
            onChange={(e) => setElevation(e.target.value)}
            className="bg-background"
          />
        </div>

        <Button onClick={handleCalculate} disabled={loading}>
          {loading ? "Calculating..." : "Calculate"}
        </Button>

        {error && <div className="text-red-500">{error}</div>}

        {results && (
          <div className="mt-4 space-y-4">
            <h3 className="font-semibold">Shot Parameters for {club}:</h3>

            {results.map(
              (result, index) =>
                result && (
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
                              {(
                                (1 - result.modifiers.speedPenalty) *
                                100
                              ).toFixed(1)}
                              % reduction
                            </p>
                            <p>
                              Spin:{" "}
                              {(
                                (result.modifiers.spinPenalty - 1) *
                                100
                              ).toFixed(1)}
                              % increase
                            </p>
                            <p>
                              Launch Angle:{" "}
                              {(
                                (result.modifiers.vlaPenalty - 1) *
                                100
                              ).toFixed(1)}
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
                      <p>Raw Carry: {formatDistance(result.rawCarry)}</p>
                      <p>
                        With Penalties: {formatDistance(result.estimatedCarry)}
                      </p>
                      <p>With Environment: {formatDistance(result.envCarry)}</p>
                      <p className="text-red-500">
                        Carry Reduced by{" "}
                        {(
                          (1 - result.estimatedCarry / result.rawCarry) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                      {result.offlineDeviation !== 0 && (
                        <p className="text-yellow-500">
                          Ball will travel{" "}
                          {formatDistance(Math.abs(result.offlineDeviation))}{" "}
                          {result.offlineDeviation > 0 ? "right" : "left"} of
                          target
                        </p>
                      )}
                    </div>
                  </div>
                )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
