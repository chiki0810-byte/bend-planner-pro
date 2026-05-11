import { useState } from "react";
import { GitBranch, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Pliegue {
  longitud: number;
  angulo: number;
  cierra: boolean;
}

const materiales = [
  "Acero Dulce",
  "Acero Inoxidable",
  "Aluminio",
  "Cobre",
  "Latón",
  "Galvanizado",
];

const PlieguesPorPuntaPage = () => {
  const [material, setMaterial] = useState("Acero Dulce");
  const [espesor, setEspesor] = useState(1.0);
  const [kFactor, setKFactor] = useState(0.5);
  const [radioInterior, setRadioInterior] = useState(1.0);
  const [plieguesA, setPlieguesA] = useState<Pliegue[]>([]);
  const [plieguesB, setPlieguesB] = useState<Pliegue[]>([]);

  const addPliegueA = () =>
    setPlieguesA([...plieguesA, { longitud: 0, angulo: 90, cierra: false }]);

  const addPliegueB = () =>
    setPlieguesB([...plieguesB, { longitud: 0, angulo: 90, cierra: false }]);

  const updatePliegueA = (
    index: number,
    field: keyof Pliegue,
    value: number | boolean
  ) => {
    const next = [...plieguesA];
    next[index] = { ...next[index], [field]: value };
    setPlieguesA(next);
  };

  const updatePliegueB = (
    index: number,
    field: keyof Pliegue,
    value: number | boolean
  ) => {
    const next = [...plieguesB];
    next[index] = { ...next[index], [field]: value };
    setPlieguesB(next);
  };

  const removePliegueA = (index: number) =>
    setPlieguesA(plieguesA.filter((_, i) => i !== index));

  const removePliegueB = (index: number) =>
    setPlieguesB(plieguesB.filter((_, i) => i !== index));

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <header className="flex items-center gap-3">
        <GitBranch className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Pliegues por Punta</h1>
          <p className="text-sm text-muted-foreground">
            Definición de pliegues por punta A y B
          </p>
        </div>
      </header>

      {/* Encabezado global */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parámetros Globales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Material</Label>
            <Select value={material} onValueChange={setMaterial}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {materiales.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Espesor (mm)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              value={espesor}
              onChange={(e) =>
                setEspesor(parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>K-Factor</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="0.5"
              value={kFactor}
              onChange={(e) =>
                setKFactor(parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Radio Interior (mm)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              value={radioInterior}
              onChange={(e) =>
                setRadioInterior(parseFloat(e.target.value) || 0)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Punta A */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Punta A – Lista de Pliegues
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plieguesA.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              Sin pliegues definidos para la punta A.
            </p>
          )}
          {plieguesA.map((p, i) => (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end bg-muted/30 p-3 rounded-lg"
            >
              <div className="space-y-1">
                <Label className="text-xs">Longitud (mm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={p.longitud}
                  onChange={(e) =>
                    updatePliegueA(
                      i,
                      "longitud",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ángulo (°)</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max="180"
                  value={p.angulo}
                  onChange={(e) =>
                    updatePliegueA(
                      i,
                      "angulo",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cierra</Label>
                <Toggle
                  pressed={p.cierra}
                  onPressedChange={(v) => updatePliegueA(i, "cierra", v)}
                  className="w-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {p.cierra ? "Sí" : "No"}
                </Toggle>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removePliegueA(i)}
                className="h-10"
              >
                <Trash2 className="w-4 h-4 mr-1" /> Eliminar
              </Button>
            </div>
          ))}
          <Button onClick={addPliegueA} className="w-full">
            <Plus className="w-4 h-4 mr-2" /> Añadir pliegue A
          </Button>
        </CardContent>
      </Card>

      {/* Punta B */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Punta B – Lista de Pliegues
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plieguesB.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              Sin pliegues definidos para la punta B.
            </p>
          )}
          {plieguesB.map((p, i) => (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end bg-muted/30 p-3 rounded-lg"
            >
              <div className="space-y-1">
                <Label className="text-xs">Longitud (mm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={p.longitud}
                  onChange={(e) =>
                    updatePliegueB(
                      i,
                      "longitud",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ángulo (°)</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max="180"
                  value={p.angulo}
                  onChange={(e) =>
                    updatePliegueB(
                      i,
                      "angulo",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cierra</Label>
                <Toggle
                  pressed={p.cierra}
                  onPressedChange={(v) => updatePliegueB(i, "cierra", v)}
                  className="w-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {p.cierra ? "Sí" : "No"}
                </Toggle>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removePliegueB(i)}
                className="h-10"
              >
                <Trash2 className="w-4 h-4 mr-1" /> Eliminar
              </Button>
            </div>
          ))}
          <Button onClick={addPliegueB} className="w-full">
            <Plus className="w-4 h-4 mr-2" /> Añadir pliegue B
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlieguesPorPuntaPage;
