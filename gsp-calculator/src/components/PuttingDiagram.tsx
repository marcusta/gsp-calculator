import { getSpeedForDistance, SpeedDistanceData } from "@/putting";
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

// Generate data points for a smooth curve
function generateSmoothData(start: number, end: number, steps: number) {
  const data: SpeedDistanceData[] = [];
  for (
    let distance = start;
    distance <= end;
    distance += (end - start) / steps
  ) {
    const speed = getSpeedForDistance(distance);
    data.push({ distance, speed });
  }
  return data;
}

export function PuttingDiagram() {
  const smoothData = generateSmoothData(2, 22, 30);

  const data = {
    labels: smoothData.map((point) => point.distance.toFixed(1)),
    datasets: [
      {
        label: "Ball Speed vs Distance",
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
          text: "Distance (meters)",
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
      <div className="w-full max-w-3xl mx-auto">
        <Line options={options} data={data} />
      </div>
    </div>
  );
}
