import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhyMatList } from "@/material";
import {
  getRoughSpeedPenalty,
  getRoughSpinPenalty,
  getRoughVLAPenalty,
  getAltitudeModifier,
  getElevationDistanceModifier,
} from "@/penalty";
import { getCarryDataFromServer } from "@/api";
import { Switch } from "@/components/ui/switch";
import { DistanceUnit, convertMetersToYards } from "@/types/units";
import {
  getModifiedLieVla,
  calculateOfflineDeviation,
} from "@/lie-calculation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { formatMaterialNameForUI } from "../material";

export function BallPhysicsCalculator() {
  const [speed, setSpeed] = useState<number>(0);
  const [vla, setVLA] = useState<number>(0);
  const [spin, setSpin] = useState<number>(0);
  const [materialIndex, setMaterialIndex] = useState<number>(1);
  const [rawCarry, setRawCarry] = useState<number | null>(null);
  const [modifiedCarry, setModifiedCarry] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unit, setUnit] = useState<DistanceUnit>("meters");
  const [upDownLie, setUpDownLie] = useState<string>("0");
  const [rightLeftLie, setRightLeftLie] = useState<string>("0");
  const [offlineDeviation, setOfflineDeviation] = useState<number | null>(null);
  const [altitude, setAltitude] = useState<string>("0");
  const [elevationDiff, setElevationDiff] = useState<string>("0");

  // Calculate modifiers with error handling
  const calculatePenalties = () => {
    try {
      return {
        speedPenalty: getRoughSpeedPenalty(materialIndex, speed, vla),
        spinPenalty: getRoughSpinPenalty(materialIndex, speed, vla),
        vlaPenalty: getRoughVLAPenalty(materialIndex, speed, vla),
      };
    } catch (error) {
      console.error("Error calculating penalties:", error);
      return {
        speedPenalty: 1,
        spinPenalty: 1,
        vlaPenalty: 1,
      };
    }
  };

  const { speedPenalty, spinPenalty, vlaPenalty } = calculatePenalties();

  const validateLieInput = (value: string): number => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Calculate modified values
  const modifiedSpeed = speed * speedPenalty;
  const modifiedSpin = spin * spinPenalty;
  const modifiedVLA = getModifiedLieVla(
    vla * vlaPenalty,
    validateLieInput(upDownLie)
  );

  // Filter PhyMatList to only include materials that have entries in the penalty tables
  const validMaterialIndices = [18, 2, 1, 3, 4, 6, 11, 12, 13, 16, 17];
  const validMaterials = validMaterialIndices.map((index) => ({
    index,
    name: PhyMatList[index],
  }));

  // Modify the fetch function to handle loading state
  const fetchCarryDistances = async () => {
    if (speed && vla && spin) {
      setIsLoading(true);
      try {
        // Fetch raw carry
        const rawData = await getCarryDataFromServer(speed, spin, vla);
        setRawCarry(rawData.Carry);

        // Fetch modified carry
        const modData = await getCarryDataFromServer(
          modifiedSpeed,
          modifiedSpin,
          modifiedVLA
        );
        setModifiedCarry(modData.Carry);

        // Calculate offline deviation if there's a right/left lie angle
        if (validateLieInput(rightLeftLie) !== 0) {
          const deviation = calculateOfflineDeviation(
            modifiedVLA,
            validateLieInput(rightLeftLie),
            modData.Carry
          );
          setOfflineDeviation(deviation);
        } else {
          setOfflineDeviation(null);
        }
      } catch (error) {
        console.error("Error fetching carry distances:", error);
        setRawCarry(null);
        setModifiedCarry(null);
        setOfflineDeviation(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatDistance = (
    modifiedCarry: number,
    unit: string,
    elevationDiff: string,
    modifiedSpeed: number,
    modifiedSpin: number,
    modifiedVLA: number
  ): string => {
    const elevationValue =
      unit === "yards"
        ? convertMetersToYards(parseFloat(elevationDiff) || 0)
        : parseFloat(elevationDiff) || 0;

    const altitudeModifier = getAltitudeModifier(
      parseFloat(altitude) || 0,
      modifiedCarry
    );
    const elevationModifier = getElevationDistanceModifier(
      modifiedCarry,
      elevationValue,
      modifiedSpeed,
      modifiedSpin,
      modifiedVLA
    );

    const totalDistance =
      unit === "yards"
        ? convertMetersToYards(
            modifiedCarry * altitudeModifier + elevationModifier
          )
        : modifiedCarry * altitudeModifier + elevationModifier;

    return `${totalDistance.toFixed(1)} ${unit}`;
  };

  const formatElevationEffect = (
    modifiedCarry: number,
    unit: string,
    elevationDiff: string,
    modifiedSpeed: number,
    modifiedSpin: number,
    modifiedVLA: number
  ): string => {
    const elevationValue =
      unit === "yards"
        ? convertMetersToYards(parseFloat(elevationDiff) || 0)
        : parseFloat(elevationDiff) || 0;

    const elevationModifier = getElevationDistanceModifier(
      modifiedCarry,
      elevationValue,
      modifiedSpeed,
      modifiedSpin,
      modifiedVLA
    );

    const convertedModifier =
      unit === "yards"
        ? convertMetersToYards(elevationModifier)
        : elevationModifier;

    const direction = elevationModifier > 0 ? "shorter" : "longer";

    return `${convertedModifier.toFixed(1)} ${unit} ${direction}`;
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
            <Select
              value={materialIndex.toString()}
              onValueChange={(value) => setMaterialIndex(Number(value))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {validMaterials.map(({ index, name }) => (
                  <SelectItem key={index} value={index.toString()}>
                    {formatMaterialNameForUI(name)}
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

        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">Modifiers:</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium">Speed Modifier:</p>
              <p>{speedPenalty.toFixed(3)}</p>
            </div>
            <div>
              <p className="font-medium">Spin Modifier:</p>
              <p>{spinPenalty.toFixed(3)}</p>
            </div>
            <div>
              <p className="font-medium">VLA Modifier:</p>
              <p>{vlaPenalty.toFixed(3)}</p>
            </div>
          </div>

          <h3 className="text-lg font-semibold">Modified Values:</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium">Modified Speed:</p>
              <p>{modifiedSpeed.toFixed(2)}</p>
            </div>
            <div>
              <p className="font-medium">Modified Spin:</p>
              <p>{modifiedSpin.toFixed(2)}</p>
            </div>
            <div>
              <p className="font-medium">Modified VLA:</p>
              <p>{modifiedVLA.toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-4 mb-4">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              onClick={fetchCarryDistances}
              disabled={isLoading || !speed || !vla || !spin}
            >
              {isLoading ? "Calculating..." : "Calculate Carry"}
            </button>
          </div>

          <h3 className="text-lg font-semibold">Carry Distances:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Raw Carry:</p>
              <p>
                {rawCarry
                  ? `${(unit === "yards"
                      ? convertMetersToYards(rawCarry)
                      : rawCarry
                    ).toFixed(1)} ${unit}`
                  : "Not calculated"}
              </p>
            </div>
            <div>
              <p className="font-medium">Modified Carry:</p>
              <p>
                {modifiedCarry
                  ? formatDistance(
                      modifiedCarry,
                      unit,
                      elevationDiff,
                      modifiedSpeed,
                      modifiedSpin,
                      modifiedVLA
                    )
                  : "Not calculated"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="font-medium">Elevation Effect:</p>
              <p>
                {modifiedCarry
                  ? formatElevationEffect(
                      modifiedCarry,
                      unit,
                      elevationDiff,
                      modifiedSpeed,
                      modifiedSpin,
                      modifiedVLA
                    )
                  : "Not calculated"}
              </p>
            </div>
            {offlineDeviation !== null && (
              <div className="col-span-2">
                <p className="font-medium text-yellow-500">
                  Ball will travel{" "}
                  {unit === "yards"
                    ? convertMetersToYards(Math.abs(offlineDeviation)).toFixed(
                        1
                      )
                    : Math.abs(offlineDeviation).toFixed(1)}{" "}
                  {unit} {offlineDeviation > 0 ? "right" : "left"} of target
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
