import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GeoAdmin() {
  return (
    <main className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Administração GEO/AEO</CardTitle>
        </CardHeader>
        <CardContent>Gerencie projetos, prompts e evidências.</CardContent>
      </Card>
    </main>
  );
}
