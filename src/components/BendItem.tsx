import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";

export interface BendItemValue {
  angle: number;
  distance: number;
  innerRadius: number;
  kFactor: number;
  direction: 1 | -1;
  tolerance: number;
}

interface BendItemProps {
  index: number;
  value: BendItemValue;
  onChange: (v: BendItemValue) => void;
  onRemove: () => void;
  canRemove: boolean;
  defaultRadius: number;
  defaultK: number;
}

const BendItem = ({ index, value, onChange, onRemove, canRemove, defaultRadius, defaultK }: BendItemProps) => {
  const set = <K extends keyof BendItemValue>(k: K, v: BendItemValue[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="bg-muted/30 p-4 rounded-lg border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground h-6 w-6 rounded-full p-0 flex items-center justify-center">
            {index + 1}
          </Badge>
          <Label className="text-sm font-semibold">Plegado {index + 1}</Label>
        </div>
        <div className="flex items-center gap-1">
          <Toggle
            size="sm"
            pressed={value.direction === 1}
            onPressedChange={(p) => set('direction', p ? 1 : -1)}
            aria-label="Sentido"
            className="h-8 px-2"
          >
            {value.direction === 1 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            <span className="ml-1 text-xs">{value.direction === 1 ? '+' : '−'}</span>
          </Toggle>
          {canRemove && (
            <Button variant="ghost" size="sm" onClick={onRemove}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {index === 0 ? "Distancia desde el borde (mm)" : `Distancia desde plegado ${index} (mm)`}
        </Label>
        <Input type="number" value={value.distance} min="0" step="0.1"
          onChange={(e) => set('distance', parseFloat(e.target.value) || 0)} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Ángulo de plegado</span>
          <span className="text-lg font-semibold text-primary">{value.angle}°</span>
        </div>
        <Slider value={[value.angle]} onValueChange={(v) => set('angle', v[0])}
          min={5} max={180} step={1} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>5°</span><span>90°</span><span>180°</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/50">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Radio int. (mm)</Label>
          <Input type="number" step="0.1" min="0" value={value.innerRadius}
            placeholder={String(defaultRadius)}
            onChange={(e) => set('innerRadius', parseFloat(e.target.value) || 0)}
            className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Factor K</Label>
          <Input type="number" step="0.01" min="0" max="0.5" value={value.kFactor}
            placeholder={String(defaultK)}
            onChange={(e) => set('kFactor', parseFloat(e.target.value) || 0)}
            className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Tol. ± (mm)</Label>
          <Input type="number" step="0.05" min="0" value={value.tolerance}
            onChange={(e) => set('tolerance', parseFloat(e.target.value) || 0)}
            className="h-8 text-xs" />
        </div>
      </div>
    </div>
  );
};

export default BendItem;
