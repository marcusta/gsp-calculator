import {
  SpeedDistanceData,
  getAvailableStimps,
  getDistanceForSpeed,
} from "@/putting";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Generate data points for speed increments
function generateSpeedBasedData(
  startSpeed: number,
  endSpeed: number,
  speedStep: number,
  stimp: number,
  useMetric: boolean
) {
  const data: SpeedDistanceData[] = [];

  for (let speed = startSpeed; speed <= endSpeed; speed += speedStep) {
    let distance = getDistanceForSpeed(speed, stimp);
    // Convert to feet if using imperial
    if (!useMetric) {
      distance = distance * 3.28084;
    }
    data.push({ distance, speed });
  }
  return data;
}

export function PuttingDiagram() {
  const [selectedStimp, setSelectedStimp] = useState(11);
  const [useMetric, setUseMetric] = useState(true);
  const availableStimps = getAvailableStimps();

  // Generate data points from 2mph to 16mph in 0.5mph increments
  const smoothData = generateSpeedBasedData(
    2, // start speed (mph)
    16, // end speed (mph)
    0.5, // speed increment (mph)
    selectedStimp,
    useMetric
  );

  const data = {
    labels: smoothData.map((point) => point.distance.toFixed(1)),
    datasets: [
      {
        label: `Ball Speed vs Distance (Stimp ${selectedStimp})`,
        data: smoothData.map((point) => point.speed),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        pointRadius: 2,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Putting Speed vs Distance Relationship",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: `Distance (${useMetric ? "meters" : "feet"})`,
        },
      },
      y: {
        title: {
          display: true,
          text: "Ball Speed (mph)",
        },
      },
    },
  };

  return (
    <div className="p-6 min-h-[400px]">
      <h2 className="text-2xl font-bold mb-6">
        Putting Distance-Speed Diagram
      </h2>

      <div className="flex items-center space-x-2 mb-4">
        <Switch
          id="unit-toggle"
          checked={useMetric}
          onCheckedChange={setUseMetric}
        />
        <Label htmlFor="unit-toggle">
          {useMetric ? "Metric (meters)" : "Imperial (feet)"}
        </Label>
      </div>

      <div className="flex gap-2 mb-4">
        {availableStimps.map((stimp) => (
          <button
            key={stimp}
            onClick={() => setSelectedStimp(stimp)}
            className={`px-4 py-2 rounded font-medium ${
              selectedStimp === stimp
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            Stimp {stimp}
          </button>
        ))}
      </div>
      <div className="w-full max-w-3xl mx-auto">
        <Line options={options} data={data} />
      </div>
    </div>
  );
}
