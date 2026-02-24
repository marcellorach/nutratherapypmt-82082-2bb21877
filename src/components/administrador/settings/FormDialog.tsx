
import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { FormItem, FormLabel } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';

interface FormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title: string;
  description: string;
  onSubmit: () => void;
  children?: React.ReactNode;
  submitText?: string;
}

const FormDialog: React.FC<FormDialogProps> = ({
  isOpen, setIsOpen, title, description, onSubmit, children, submitText
}) => {
  const { t } = useTranslation();
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>{t('formDialog.cancel')}</Button>
          <Button onClick={onSubmit} variant="default">{submitText || t('formDialog.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const FormSelectField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: {value: string, label: string}[];
}> = ({ label, value, onChange, placeholder, options }) => {
  const { t } = useTranslation();
  return (
    <FormItem className="space-y-1 mb-4">
      <FormLabel>{label}</FormLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder || t('formDialog.selectOption')} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormItem>
  );
};

export const FormInputField: React.FC<{
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; type?: string;
}> = ({ label, value, onChange, placeholder = "", type = "text" }) => (
  <FormItem className="space-y-1 mb-4">
    <FormLabel>{label}</FormLabel>
    <Input type={type} value={value} onChange={onChange} placeholder={placeholder} />
  </FormItem>
);

export const FormTextareaField: React.FC<{
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string; rows?: number;
}> = ({ label, value, onChange, placeholder = "", rows = 3 }) => (
  <FormItem className="space-y-1 mb-4">
    <FormLabel>{label}</FormLabel>
    <Textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} />
  </FormItem>
);

export default FormDialog;
