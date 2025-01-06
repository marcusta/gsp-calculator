import { useState } from "react";
import { BallPhysicsCalculator } from "./BallPhysicsCalculator";
import { ShotSuggester } from "./ShotSuggester";
import { PuttCalculator } from "./PuttCalculator";
import { PuttingDiagram } from "./PuttingDiagram";

export function BallPhysicsTools() {
  const [activeTab, setActiveTab] = useState<
    "calculator" | "suggester" | "putter" | "puttDiagram"
  >("calculator");

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex border-b border-white/10">
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "calculator"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("calculator")}
        >
          Physics Calculator
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "suggester"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("suggester")}
        >
          Club Values
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "putter"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("putter")}
        >
          Putt Calculator
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "puttDiagram"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("puttDiagram")}
        >
          Putt Diagram
        </button>
      </div>

      {/* Content */}
      <div className="text-slate-200">
        {activeTab === "calculator" ? (
          <BallPhysicsCalculator />
        ) : activeTab === "suggester" ? (
          <ShotSuggester />
        ) : activeTab === "putter" ? (
          <PuttCalculator />
        ) : (
          <PuttingDiagram />
        )}
      </div>
    </div>
  );
}
