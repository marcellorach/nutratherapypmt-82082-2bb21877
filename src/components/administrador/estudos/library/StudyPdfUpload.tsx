import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { FileText, Upload, Download, Trash2, RefreshCw, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSafeTranslation } from '@/hooks/useSafeTranslation';
import { sanitizeFileName } from '@/utils/fileNameSanitizer';

interface StudyPdfUploadProps {
  studyId: string;
  studyTitle: string;
  pdfStoragePath: string | null;
  pdfFilename: string | null;
  onUploadComplete: () => void;
  onNavigateToUpload?: () => void;
}

const StudyPdfUpload: React.FC<StudyPdfUploadProps> = ({
  studyId,
  studyTitle,
  pdfStoragePath,
  pdfFilename,
  onUploadComplete,
  onNavigateToUpload,
}) => {
  const { t } = useSafeTranslation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const hasPdf = !!pdfStoragePath;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  const uploadPdf = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      // If there's an existing PDF, delete it first
      if (pdfStoragePath) {
        await supabase.storage.from('study_pdfs').remove([pdfStoragePath]);
      }

      setUploadProgress(30);

      // Create safe filename
      const sanitizedName = sanitizeFileName(selectedFile.name);
      const storagePath = `${studyId}/${sanitizedName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('study_pdfs')
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      // Update study record with type assertion
      const { error: updateError } = await (supabase as any)
        .from('scientific_studies')
        .update({
          pdf_storage_path: storagePath,
          pdf_filename: selectedFile.name,
          pdf_uploaded_at: new Date().toISOString(),
        })
        .eq('id', studyId);

      if (updateError) throw updateError;

      setUploadProgress(100);

      toast({
        title: t('studies.library.pdfUploadSuccess', 'PDF uploaded successfully'),
        description: selectedFile.name,
      });

      setIsDialogOpen(false);
      setSelectedFile(null);
      onUploadComplete();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: t('studies.library.pdfUploadError', 'Error uploading PDF'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadPdf = async () => {
    if (!pdfStoragePath) return;

    try {
      const { data, error } = await supabase.storage
        .from('study_pdfs')
        .download(pdfStoragePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfFilename || 'study.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: t('studies.library.pdfDownloadError', 'Error downloading PDF'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const removePdf = async () => {
    if (!pdfStoragePath) return;

    try {
      // Remove from storage
      await supabase.storage.from('study_pdfs').remove([pdfStoragePath]);

      // Update study record with type assertion
      await (supabase as any)
        .from('scientific_studies')
        .update({
          pdf_storage_path: null,
          pdf_filename: null,
          pdf_uploaded_at: null,
        })
        .eq('id', studyId);

      toast({
        title: t('studies.library.pdfRemoved', 'PDF removed'),
      });

      onUploadComplete();
    } catch (error: any) {
      toast({
        title: t('studies.library.pdfRemoveError', 'Error removing PDF'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // If PDF exists, show dropdown with options
  if (hasPdf) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950"
          >
            <FileText className="h-3 w-3" />
            PDF
            <Check className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={downloadPdf} className="gap-2">
            <Download className="h-4 w-4" />
            {t('studies.library.downloadPdf', 'Download PDF')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDialogOpen(true)} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t('studies.library.replacePdf', 'Replace PDF')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={removePdf} className="gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            {t('studies.library.removePdf', 'Remove PDF')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // If no PDF, show button that navigates to File Upload tab
  if (onNavigateToUpload) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1 text-muted-foreground hover:text-foreground"
        onClick={onNavigateToUpload}
      >
        <FileText className="h-3 w-3" />
        PDF
        <Upload className="h-3 w-3" />
      </Button>
    );
  }

  // Fallback: show upload dialog (for cases without navigation)
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <FileText className="h-3 w-3" />
          PDF
          <Upload className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('studies.library.uploadPdf', 'Upload PDF')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {studyTitle}
          </p>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive
                    ? t('studies.library.dropHere', 'Drop the PDF here')
                    : t('studies.library.dragOrClick', 'Drag PDF here or click to select')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('studies.library.maxSize', 'Max 20MB')}
                </p>
              </>
            )}
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {t('studies.library.uploading', 'Uploading...')} {uploadProgress}%
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedFile(null);
              }}
              disabled={uploading}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={uploadPdf} disabled={!selectedFile || uploading}>
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('studies.library.uploading', 'Uploading...')}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('studies.library.upload', 'Upload')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudyPdfUpload;
