import { BallPhysicsCalculator } from "./BallPhysicsCalculator";
import { ClubShotAnalyzer } from "./ClubShotAnalyzer";
import { PuttCalculator } from "./PuttCalculator";
import { PuttingDiagram } from "./PuttingDiagram";
import { ShotSuggester } from "./ShotSuggester";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";

export function BallPhysicsTools() {
  return (
    <Tabs defaultValue="calculator" className="w-full">
      <div className="w-full overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <TabsList className="w-max min-w-full flex-nowrap">
          <TabsTrigger value="calculator">Ball Physics</TabsTrigger>
          <TabsTrigger value="club-analyzer">Club Analysis</TabsTrigger>
          <TabsTrigger value="shot-suggester">Shot Suggester</TabsTrigger>
          <TabsTrigger value="putting">Putting</TabsTrigger>
          <TabsTrigger value="putting-diagram">Putting Diagram</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="calculator">
        <BallPhysicsCalculator />
      </TabsContent>
      <TabsContent value="club-analyzer">
        <ClubShotAnalyzer />
      </TabsContent>
      <TabsContent value="shot-suggester">
        <ShotSuggester />
      </TabsContent>
      <TabsContent value="putting">
        <PuttCalculator />
      </TabsContent>
      <TabsContent value="putting-diagram">
        <PuttingDiagram />
      </TabsContent>
    </Tabs>
  );
}
