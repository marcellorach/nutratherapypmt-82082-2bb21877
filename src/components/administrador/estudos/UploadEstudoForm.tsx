import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Upload } from 'lucide-react';

export const UploadEstudoForm = () => {
  return (
    <Card className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Upload className="h-6 w-6" />
          🤖 GEMINI AI - Upload de PDF
        </CardTitle>
        <CardDescription className="text-base">
          Sistema de extração automática com Inteligência Artificial
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg text-center">
          <p className="text-xl font-bold">🚀 TESTE - Componente Gemini AI está funcionando!</p>
          <p className="mt-2 text-sm">Se você está vendo isso, o componente está renderizando corretamente.</p>
        </div>
      </CardContent>
    </Card>
  );
};
