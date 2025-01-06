import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getDistanceForSpeed, getSpeedForDistance } from "@/putting";
import { Switch } from "@/components/ui/switch";

export function PuttCalculator() {
  const [mode, setMode] = useState<"speedToDistance" | "distanceToSpeed">(
    "speedToDistance"
  );
  const [speed, setSpeed] = useState<string>("");
  const [distance, setDistance] = useState<string>("");

  const handleCalculate = () => {
    if (mode === "speedToDistance" && speed) {
      const result = getDistanceForSpeed(Number(speed));
      setDistance(result.toFixed(2));
    } else if (mode === "distanceToSpeed" && distance) {
      const result = getSpeedForDistance(Number(distance));
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
            <Label htmlFor="distance">Distance (meters)</Label>
            <Input
              id="distance"
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              disabled={mode === "speedToDistance"}
              className="w-40"
            />
          </div>

          <div className="space-x-4">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleCalculate}
            >
              Calculate
            </button>
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
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
