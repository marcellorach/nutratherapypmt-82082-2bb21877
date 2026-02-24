
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from 'react-i18next';

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
}) => {
  const { t } = useTranslation();

  return (
    <div className="mb-4 grid md:grid-cols-2 gap-4">
      <div>
        <label className="block mb-1 text-sm font-medium">
          {t('consensoForm.nameLabel')} <span className="text-destructive">*</span>
        </label>
        <Input
          value={consensoName}
          onChange={e => setConsensoName(e.target.value)}
          disabled={disabled}
          placeholder={t('consensoForm.namePlaceholder')}
          required
        />
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium">{t('consensoForm.commentsLabel')}</label>
        <Textarea
          value={comentarios}
          onChange={e => setComentarios(e.target.value)}
          disabled={disabled}
          placeholder={t('consensoForm.commentsPlaceholder')}
          rows={2}
        />
      </div>
    </div>
  );
};

export default ConsensoForm;
