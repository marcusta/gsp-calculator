import { Button } from "./ui/button";
import { useUnit } from "../contexts/UnitContext";

interface UnitToggleProps {
  className?: string;
}

export function UnitToggle({ className = "" }: UnitToggleProps) {
  const { unitSystem, setUnitSystem } = useUnit();

  return (
    <Button
      variant="outline"
      size="sm"
      className={`${className}`}
      onClick={() =>
        setUnitSystem(unitSystem === "metric" ? "imperial" : "metric")
      }
    >
      {unitSystem === "metric" ? "Meters" : "Yards"}
    </Button>
  );
}
