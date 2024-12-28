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
} from "@/penalty";
import { getCarryDataFromServer } from "@/api";

export function BallPhysicsCalculator() {
  const [speed, setSpeed] = useState<number>(0);
  const [vla, setVLA] = useState<number>(0);
  const [spin, setSpin] = useState<number>(0);
  const [materialIndex, setMaterialIndex] = useState<number>(1);
  const [rawCarry, setRawCarry] = useState<number | null>(null);
  const [modifiedCarry, setModifiedCarry] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Calculate modified values
  const modifiedSpeed = speed * speedPenalty;
  const modifiedSpin = spin * spinPenalty;
  const modifiedVLA = vla * vlaPenalty;

  // Filter PhyMatList to only include materials that have entries in the penalty tables
  const validMaterialIndices = [1, 3, 4, 6, 11, 12, 13, 16, 17];
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
        const rawResponse = await fetch(
          `/trajectory?ballSpeed=${speed}&spin=${spin}&vla=${vla}`
        );
        const rawData = await rawResponse.json();
        setRawCarry(rawData.Carry);

        // Fetch modified carry
        const modData = await getCarryDataFromServer(
          modifiedSpeed,
          modifiedSpin,
          modifiedVLA
        );
        setModifiedCarry(modData.Carry);
      } catch (error) {
        console.error("Error fetching carry distances:", error);
        setRawCarry(null);
        setModifiedCarry(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="p-6 min-h-[600px]">
      <h2 className="text-2xl font-bold mb-6">Ball Physics Calculator</h2>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="speed">Ball Speed</Label>
            <Input
              id="speed"
              type="number"
              min="0"
              max="150"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vla">Vertical Launch Angle</Label>
            <Input
              id="vla"
              type="number"
              min="0"
              max="45"
              value={vla}
              onChange={(e) => setVLA(Number(e.target.value))}
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="material">Lie/Material</Label>
            <Select
              value={materialIndex.toString()}
              onValueChange={(value) => setMaterialIndex(Number(value))}
            >
              <SelectTrigger>
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
                {rawCarry ? `${rawCarry.toFixed(1)} meters` : "Not calculated"}
              </p>
            </div>
            <div>
              <p className="font-medium">Modified Carry:</p>
              <p>
                {modifiedCarry
                  ? `${modifiedCarry.toFixed(1)} meters`
                  : "Not calculated"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
