import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getDistanceForSpeed, getSpeedForDistance } from "@/putting";
import { Switch } from "@/components/ui/switch";
import { useUnit } from "../contexts/UnitContext";

export function PuttCalculator() {
  const { unitSystem } = useUnit();
  const [mode, setMode] = useState<"speedToDistance" | "distanceToSpeed">(
    "speedToDistance"
  );
  const [speed, setSpeed] = useState<string>("");
  const [distance, setDistance] = useState<string>("");
  const [stimp, setStimp] = useState<number>(11);

  // Add available stimp values
  const stimpValues = [10, 11, 12, 13];

  const handleCalculate = () => {
    if (mode === "speedToDistance" && speed) {
      let result = getDistanceForSpeed(Number(speed), stimp);
      // Convert meters to feet if using imperial
      if (unitSystem === "imperial") {
        result = result * 3.28084;
      }
      setDistance(result.toFixed(2));
    } else if (mode === "distanceToSpeed" && distance) {
      // Convert feet to meters if using imperial
      const distanceInMeters =
        unitSystem === "imperial"
          ? Number(distance) / 3.28084
          : Number(distance);
      const result = getSpeedForDistance(distanceInMeters, stimp);
      setSpeed(result.toFixed(2));
    }
  };

  const handleClear = () => {
    setSpeed("");
    setDistance("");
  };

  return (
    <div className="p-6 min-h-[400px]">
      <h2 className="text-2xl font-bold mb-6">Putt Calculator</h2>

      <div className="space-y-6 max-w-xl">
        {/* Stimp Selection */}
        <div className="space-y-2">
          <Label>Stimp Speed</Label>
          <div className="flex gap-2 mb-4">
            {stimpValues.map((stimpValue) => (
              <button
                key={stimpValue}
                onClick={() => setStimp(stimpValue)}
                className={`px-4 py-2 rounded font-medium ${
                  stimp === stimpValue
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-100"
                }`}
              >
                Stimp {stimpValue}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="mode-toggle"
            checked={mode === "distanceToSpeed"}
            onCheckedChange={(checked) =>
              setMode(checked ? "distanceToSpeed" : "speedToDistance")
            }
          />
          <Label htmlFor="mode-toggle">
            {mode === "speedToDistance"
              ? "Calculate Distance from Speed"
              : "Calculate Speed from Distance"}
          </Label>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="speed">Ball Speed (mph)</Label>
            <Input
              id="speed"
              type="number"
              min="0"
              max="15"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
              disabled={mode === "distanceToSpeed"}
              className="w-40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="distance">
              Distance ({unitSystem === "imperial" ? "feet" : "meters"})
            </Label>
            <Input
              id="distance"
              type="number"
              min="0"
              max={unitSystem === "imperial" ? 65 : 20} // Adjusted max for feet
              step="0.1"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              disabled={mode === "speedToDistance"}
              className="w-40"
            />
          </div>

          <div className="space-x-4">
            <button
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-lg"
              onClick={handleCalculate}
            >
              Calculate
            </button>
            <button
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-lg"
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
