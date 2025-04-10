
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Microscope } from "lucide-react";

const EstudosTab: React.FC = () => {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Estudos Científicos</h2>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Estudo
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Journal of Veterinary Medicine, 2023</CardTitle>
            <CardDescription>Estudo sobre ômega 3 e 6 em cães</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Fundamentação:</span>
                <span className="text-sm">4.5/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Eficiência:</span>
                <span className="text-sm">4.2/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Constância:</span>
                <span className="text-sm">4.0/5</span>
              </div>
              <Button variant="outline" className="w-full mt-4" size="sm">
                <Microscope className="mr-2 h-4 w-4" />
                Ver detalhes
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Animal Care Journal, 2023</CardTitle>
            <CardDescription>Eficácia de glucosamina em cães idosos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Fundamentação:</span>
                <span className="text-sm">4.3/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Eficiência:</span>
                <span className="text-sm">4.1/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Constância:</span>
                <span className="text-sm">3.8/5</span>
              </div>
              <Button variant="outline" className="w-full mt-4" size="sm">
                <Microscope className="mr-2 h-4 w-4" />
                Ver detalhes
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
          <CardContent className="flex flex-col items-center justify-center h-full py-12">
            <Plus className="h-12 w-12 text-gray-400" />
            <p className="text-gray-500 mt-2">Adicionar novo estudo</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default EstudosTab;
