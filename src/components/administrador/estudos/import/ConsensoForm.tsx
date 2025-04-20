
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ConsensoFormProps {
  consensoName: string;
  setConsensoName: (v: string) => void;
  comentarios: string;
  setComentarios: (v: string) => void;
  disabled?: boolean;
}

const ConsensoForm: React.FC<ConsensoFormProps> = ({
  consensoName,
  setConsensoName,
  comentarios,
  setComentarios,
  disabled = false
}) => (
  <div className="mb-4 grid md:grid-cols-2 gap-4">
    <div>
      <label className="block mb-1 text-sm font-medium">
        Nome do Consenso Integrativo <span className="text-red-500">*</span>
      </label>
      <Input
        value={consensoName}
        onChange={e => setConsensoName(e.target.value)}
        disabled={disabled}
        placeholder="Ex: Consenso Brasileiro de Saúde Articular 2025"
        required
      />
    </div>
    <div>
      <label className="block mb-1 text-sm font-medium">Comentários Gerais</label>
      <Textarea
        value={comentarios}
        onChange={e => setComentarios(e.target.value)}
        disabled={disabled}
        placeholder="Observações importantes sobre este consenso ou base de estudos."
        rows={2}
      />
    </div>
  </div>
);

export default ConsensoForm;
