import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface BendItemProps {
  index: number;
  angle: number;
  onAngleChange: (angle: number) => void;
  onRemove: () => void;
  canRemove: boolean;
}

const BendItem = ({ index, angle, onAngleChange, onRemove, canRemove }: BendItemProps) => {
  return (
    <div className="bg-muted/30 p-4 rounded-lg border space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Plegado {index + 1}</Label>
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Ángulo</span>
          <span className="text-lg font-semibold text-primary">{angle}°</span>
        </div>
        
        <Slider
          value={[angle]}
          onValueChange={(values) => onAngleChange(values[0])}
          min={30}
          max={180}
          step={5}
          className="w-full"
        />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>30°</span>
          <span>90°</span>
          <span>180°</span>
        </div>
      </div>
    </div>
  );
};

export default BendItem;
