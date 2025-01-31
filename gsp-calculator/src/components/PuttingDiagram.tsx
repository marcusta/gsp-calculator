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
import { useUnit } from "../contexts/UnitContext";

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
  const { unitSystem } = useUnit();
  const [selectedStimp, setSelectedStimp] = useState(11);
  const availableStimps = getAvailableStimps();

  // Generate data points from 2mph to 16mph in 0.5mph increments
  const smoothData = generateSpeedBasedData(
    2, // start speed (mph)
    16, // end speed (mph)
    0.5, // speed increment (mph)
    selectedStimp,
    unitSystem === "metric"
  );

  const data = {
    labels: smoothData.map((point) => point.distance.toFixed(1)),
    datasets: [
      {
        label: `Ball Speed vs Distance (Stimp ${selectedStimp})`,
        data: smoothData.map((point) => point.speed),
        borderColor: "rgb(25, 99, 232)",
        backgroundColor: "rgba(25, 99, 232, 0.1)",
        borderWidth: 2,
        pointRadius: 1,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#fff",
          font: {
            size: 14,
          },
        },
      },
      title: {
        display: true,
        text: "Putting Speed vs Distance Relationship",
        color: "#fff",
        font: {
          size: 16,
          weight: "bold",
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: `Distance (${unitSystem === "imperial" ? "feet" : "meters"})`,
          color: "#fff",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#fff",
        },
      },
      y: {
        title: {
          display: true,
          text: "Ball Speed (mph)",
          color: "#fff",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#fff",
        },
        min: 0,
        max: 20,
        suggestedMax: 20,
      },
    },
  };

  return (
    <div className="p-6 min-h-[400px]">
      <h2 className="text-2xl font-bold mb-6">
        Putting Distance-Speed Diagram
      </h2>

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
      <div className="w-full max-w-3xl mx-auto h-[400px]">
        <Line options={options} data={data} />
      </div>
    </div>
  );
}
