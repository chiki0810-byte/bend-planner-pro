import { Settings, Info, Database, Smartphone, Monitor } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const ConfiguracionPage = () => {
  const [dark, setDark] = useState<boolean>(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <header className="mb-2">
        <div className="flex items-center gap-3">
          <Settings className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Configuración</h1>
            <p className="text-sm text-muted-foreground">Preferencias generales de la app</p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apariencia</CardTitle>
          <CardDescription>Cambia entre tema claro y oscuro</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Label htmlFor="dark-mode" className="text-sm font-medium">Tema oscuro</Label>
          <Switch id="dark-mode" checked={dark} onCheckedChange={setDark} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4" /> Datos locales
          </CardTitle>
          <CardDescription>La app guarda todo en tu dispositivo. No se envía nada a Internet.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            if (confirm("¿Borrar historial local?")) {
              localStorage.clear();
              indexedDB.deleteDatabase("BendCalcDB");
              alert("Datos locales borrados. Recarga la app.");
            }
          }}>Borrar datos locales</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4" /> Acerca de
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Calculadora de Plegado</strong> v1.0</p>
          <p>Cálculo profesional de chapa con validación contra máquinas reales del taller.</p>
          <div className="flex items-center gap-4 pt-2 text-xs">
            <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> Android (Capacitor)</span>
            <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> Windows (Electron)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfiguracionPage;
