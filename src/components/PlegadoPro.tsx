import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cone, Layers, ListOrdered } from "lucide-react";
import PlegadoConico from "./PlegadoConico";
import CanalAsimetrico from "./CanalAsimetrico";
import SecuenciaPlegado from "./SecuenciaPlegado";

const PlegadoPro = () => (
  <div className="p-4 max-w-5xl mx-auto space-y-4">
    <header className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight">Plegado Pro</h1>
      <p className="text-sm text-muted-foreground">
        Módulo profesional offline: cónico/enchufable, canal asimétrico y secuencia inteligente.
      </p>
    </header>

    <Tabs defaultValue="conico" className="w-full">
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="conico" className="gap-2"><Cone className="w-4 h-4" /> Cónico</TabsTrigger>
        <TabsTrigger value="canal" className="gap-2"><Layers className="w-4 h-4" /> Canal asimétrico</TabsTrigger>
        <TabsTrigger value="secuencia" className="gap-2"><ListOrdered className="w-4 h-4" /> Secuencia</TabsTrigger>
      </TabsList>
      <TabsContent value="conico" className="mt-4"><PlegadoConico /></TabsContent>
      <TabsContent value="canal" className="mt-4"><CanalAsimetrico /></TabsContent>
      <TabsContent value="secuencia" className="mt-4"><SecuenciaPlegado /></TabsContent>
    </Tabs>
  </div>
);

export default PlegadoPro;
