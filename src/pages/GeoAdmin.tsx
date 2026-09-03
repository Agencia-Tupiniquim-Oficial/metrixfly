import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GeoAdmin() {
  return (
    <main className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Geo Admin</CardTitle>
        </CardHeader>
        <CardContent>Administração de configurações geográficas.</CardContent>
      </Card>
    </main>
  );
}
