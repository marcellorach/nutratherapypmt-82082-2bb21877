import React, { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

interface PetPhotoUploaderProps {
  /** Selected file (in-memory before pet is created). */
  file: File | null;
  onFileChange: (file: File | null) => void;
}

const PetPhotoUploader: React.FC<PetPhotoUploaderProps> = ({ file, onFileChange }) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-20 w-20 border">
        {previewUrl ? <AvatarImage src={previewUrl} alt="pet" /> : null}
        <AvatarFallback>
          <Camera className="h-6 w-6 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          {file
            ? t('petRegistration.form.photoUploader.change', { defaultValue: 'Trocar foto' })
            : t('petRegistration.form.photoUploader.add', { defaultValue: 'Adicionar foto' })}
        </Button>
        {file && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-7"
            onClick={() => onFileChange(null)}
          >
            <X className="h-3 w-3 mr-1" />
            {t('common.remove', { defaultValue: 'Remover' })}
          </Button>
        )}
        <p className="text-[11px] text-muted-foreground">
          {t('petRegistration.form.photoUploader.hint', { defaultValue: 'JPG ou PNG até 5MB' })}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 5 * 1024 * 1024) return;
          onFileChange(f);
          e.target.value = '';
        }}
      />
    </div>
  );
};

/**
 * Uploads the file to the `pet-photos` bucket under `{petId}/avatar.{ext}`
 * and returns the public URL. Updates `pet_profiles.photo_url` as a
 * convenience for callers.
 */
export async function uploadPetPhoto(petId: string, file: File): Promise<string | null> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${petId}/avatar.${ext}`;
  const { error: upErr } = await supabase.storage
    .from('pet-photos')
    .upload(path, file, { contentType: file.type, upsert: true });
  if (upErr) { console.error('Pet photo upload failed', upErr); return null; }
  const { data } = supabase.storage.from('pet-photos').getPublicUrl(path);
  const publicUrl = data.publicUrl;
  await supabase.from('pet_profiles').update({ photo_url: publicUrl }).eq('id', petId);
  return publicUrl;
}

export default PetPhotoUploader;