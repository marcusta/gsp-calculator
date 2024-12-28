import { useState } from "react";
import { BallPhysicsCalculator } from "./BallPhysicsCalculator";
import { ShotSuggester } from "./ShotSuggester";

export function BallPhysicsTools() {
  const [activeTab, setActiveTab] = useState<"calculator" | "suggester">(
    "calculator"
  );

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
      </div>

      {/* Content */}
      <div className="text-slate-200">
        {activeTab === "calculator" ? (
          <BallPhysicsCalculator />
        ) : (
          <ShotSuggester />
        )}
      </div>
    </div>
  );
}
