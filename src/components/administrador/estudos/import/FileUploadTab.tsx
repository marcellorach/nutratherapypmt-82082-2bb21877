import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Progress } from "@/components/ui/progress";
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { createSafeStoragePath, sanitizeFileName } from '@/utils/fileNameSanitizer';
import { calculateFileHash, DuplicateCheckResult } from '@/utils/fileHashUtils';
import { calculateSimilarity } from '@/services/name-harmonization-service';
import DuplicateAlert from './DuplicateAlert';

const NAME_SIMILARITY_THRESHOLD = 0.75;

const FileUploadTab: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [importing, setImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadedCount, setUploadedCount] = useState(0);
  const [importedStudyIds, setImportedStudyIds] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<{ count: number; studyIds: string[] } | null>(null);
  const [duplicateChecks, setDuplicateChecks] = useState<Record<string, DuplicateCheckResult>>({});
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { t } = useTranslation();

  const checkForDuplicates = useCallback(async (files: File[]) => {
    setCheckingDuplicates(true);
    const results: Record<string, DuplicateCheckResult> = {};

    try {
      // Fetch existing studies for comparison
      const { data: existingStudies } = await supabase
        .from('processed_studies')
        .select('id, study_id, title, original_filename, kanban_status, content_hash')
        .is('deleted_at', null);

      if (!existingStudies || existingStudies.length === 0) {
        files.forEach(f => { results[f.name] = { type: 'none' }; });
        setDuplicateChecks(prev => ({ ...prev, ...results }));
        setCheckingDuplicates(false);
        return;
      }

      for (const file of files) {
        // 1. Check hash (exact match)
        const hash = await calculateFileHash(file);
        const hashMatch = existingStudies.find(s => (s as any).content_hash === hash);
        if (hashMatch) {
          results[file.name] = {
            type: 'exact',
            existingStudy: {
              id: hashMatch.id,
              title: hashMatch.title || '',
              study_id: hashMatch.study_id || '',
              kanban_status: hashMatch.kanban_status || '',
              original_filename: hashMatch.original_filename || '',
            },
          };
          continue;
        }

        // 2. Check filename similarity
        let bestMatch: { study: typeof existingStudies[0]; similarity: number } | null = null;
        for (const study of existingStudies) {
          if (!study.original_filename) continue;
          const sim = calculateSimilarity(file.name, study.original_filename);
          if (sim >= NAME_SIMILARITY_THRESHOLD && (!bestMatch || sim > bestMatch.similarity)) {
            bestMatch = { study, similarity: sim };
          }
        }

        if (bestMatch) {
          results[file.name] = {
            type: 'similar',
            existingStudy: {
              id: bestMatch.study.id,
              title: bestMatch.study.title || '',
              study_id: bestMatch.study.study_id || '',
              kanban_status: bestMatch.study.kanban_status || '',
              original_filename: bestMatch.study.original_filename || '',
            },
            similarity: bestMatch.similarity,
          };
        } else {
          results[file.name] = { type: 'none' };
        }
      }
    } catch (err) {
      console.error('Duplicate check error:', err);
      files.forEach(f => { results[f.name] = { type: 'none' }; });
    }

    setDuplicateChecks(prev => ({ ...prev, ...results }));
    setCheckingDuplicates(false);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length < acceptedFiles.length) {
      toast({
        title: t('fileUpload.invalidFiles'),
        description: t('fileUpload.onlyPdf'),
        variant: "destructive"
      });
    }
    
    setSelectedFiles(prev => {
      const newFiles = [...prev, ...pdfFiles];
      checkForDuplicates(pdfFiles);
      return newFiles;
    });
  }, [toast, t, checkForDuplicates]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 20 * 1024 * 1024,
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const removed = prev[index];
      if (removed) {
        setDuplicateChecks(dc => {
          const copy = { ...dc };
          delete copy[removed.name];
          return copy;
        });
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleImport = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: t('fileUpload.noFileSelected'),
        description: t('fileUpload.selectAtLeastOne'),
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    setUploadProgress({});
    setUploadedCount(0);
    const newImportedIds: string[] = [];

    try {
      let successCount = 0;

      const { data: importData, error: importError } = await supabase
        .from('scispace_imports')
        .insert({
          import_type: 'manual',
          scispace_status: 'completed'
        })
        .select()
        .single();

      if (importError) throw importError;

      const uploadPromises = selectedFiles.map(async (file) => {
        const fileName = file.name;
        const studyId = uuidv4();
        const storagePath = createSafeStoragePath(studyId, fileName);

        try {
          const uploadInterval = setInterval(() => {
            setUploadProgress(prev => {
              const current = prev[fileName] || 0;
              if (current >= 90) {
                clearInterval(uploadInterval);
                return prev;
              }
              return { ...prev, [fileName]: Math.min(current + 10, 90) };
            });
          }, 200);

          const { error: storageError } = await supabase.storage
            .from('study_pdfs')
            .upload(storagePath, file);

          clearInterval(uploadInterval);
          
          if (storageError) throw storageError;

          setUploadProgress(prev => ({ ...prev, [fileName]: 100 }));

          // Calculate hash to store
          const contentHash = await calculateFileHash(file);

          // Build duplicate check log
          const dupCheck = duplicateChecks[fileName];
          const duplicateLog = dupCheck && dupCheck.type !== 'none' ? [{
            check_type: dupCheck.type,
            similar_to: dupCheck.existingStudy?.title || dupCheck.existingStudy?.original_filename || '',
            similarity: dupCheck.similarity || (dupCheck.type === 'exact' ? 1.0 : 0),
            action: 'imported',
            checked_at: new Date().toISOString(),
          }] : [{
            check_type: 'none',
            action: 'imported',
            checked_at: new Date().toISOString(),
          }];

          const { error: dbError } = await supabase
            .from('processed_studies')
            .insert({
              study_id: studyId,
              title: fileName.replace('.pdf', ''),
              original_filename: fileName,
              storage_path: storagePath,
              import_type: 'manual',
              kanban_status: 'new',
              source_import_id: importData.id,
              description: 'Awaiting processing',
              journal: 'Manual Import',
              content_hash: contentHash,
              duplicate_check_log: duplicateLog,
              analysis_data: {
                studyId: studyId,
                qualityScore: 0,
                relevanceScore: 0,
                extractedNutraceuticals: [],
                extractedConditions: [],
                extractedInteractions: [],
                extractedSideEffects: []
              }
            } as any);

          if (dbError) throw dbError;

          newImportedIds.push(studyId);
          successCount++;
          setUploadedCount(successCount);
          
          return { success: true, fileName };
        } catch (fileError) {
          console.error(`Error importing ${fileName}:`, fileError);
          setUploadProgress(prev => ({ ...prev, [fileName]: -1 }));
          return { success: false, fileName, error: fileError };
        }
      });

      await Promise.all(uploadPromises);

      setImportedStudyIds(newImportedIds);

      const event = new CustomEvent('studyImported', { 
        detail: { studyIds: newImportedIds, count: successCount } 
      });
      window.dispatchEvent(event);

      setSuccessMessage({
        count: successCount,
        studyIds: newImportedIds
      });

      setTimeout(() => {
        setSelectedFiles([]);
        setUploadProgress({});
        setUploadedCount(0);
        setDuplicateChecks({});
        setDismissedAlerts(new Set());
      }, 2000);

      setTimeout(() => {
        setSuccessMessage(null);
      }, 10000);

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: t('fileUpload.importError'),
        description: error instanceof Error ? error.message : t('common.tryAgain'),
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const hasBlockingDuplicates = selectedFiles.some(
    f => duplicateChecks[f.name]?.type === 'exact' && !dismissedAlerts.has(f.name)
  );

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  {t('studies.import.successInline', { count: successMessage.count })}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {t('studies.import.successInlineDesc')}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('step', 'processamento-ia');
                window.history.pushState({}, '', url);
                window.location.reload();
              }}
              className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20"
            >
              {t('studies.import.viewImported')}
            </Button>
          </div>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium text-primary">
            {t('fileUpload.dropHere')}
          </p>
        ) : (
          <>
            <p className="text-lg font-medium mb-2">
              {t('fileUpload.dragOrClick')}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {t('fileUpload.supportedFormats')}
            </p>
            <Button variant="outline" type="button">
              <Upload className="mr-2 h-4 w-4" />
              {t('fileUpload.selectFiles')}
            </Button>
          </>
        )}
      </div>

      {checkingDuplicates && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('fileUpload.duplicate.checking')}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">
              {selectedFiles.length} {selectedFiles.length === 1 ? t('fileUpload.fileSelected') : t('fileUpload.filesSelected')}
            </p>
            {importing && (
              <p className="text-sm text-muted-foreground">
                {uploadedCount} / {selectedFiles.length} {t('fileUpload.completed')}
              </p>
            )}
          </div>
          
          {selectedFiles.map((file, index) => {
            const progress = uploadProgress[file.name] || 0;
            const hasError = progress === -1;
            const dupCheck = duplicateChecks[file.name];
            const showAlert = dupCheck && dupCheck.type !== 'none' && !dismissedAlerts.has(file.name);
            
            return (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      {sanitizeFileName(file.name) !== file.name && (
                        <p className="text-xs text-yellow-600 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="h-3 w-3" />
                          {t('studies.import.fileNameSanitized')}: {sanitizeFileName(file.name)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  {!importing && (
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {importing && progress === 100 && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  
                  {hasError && (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>

                {showAlert && (
                  <DuplicateAlert
                    fileName={file.name}
                    result={dupCheck}
                    onDismiss={() => setDismissedAlerts(prev => new Set([...prev, file.name]))}
                    onRemoveFile={() => removeFile(index)}
                  />
                )}
                
                {importing && !hasError && (
                  <div className="space-y-1">
                    <Progress value={progress} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">
                      {progress === 100 ? t('fileUpload.done') : t('fileUpload.uploading', { progress })}
                    </p>
                  </div>
                )}
                
                {hasError && (
                  <p className="text-xs text-destructive">
                    {t('fileUpload.uploadError')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={handleImport}
          disabled={selectedFiles.length === 0 || importing || checkingDuplicates}
          className="min-w-[200px]"
        >
          {importing ? (
            <>{t('fileUpload.importing', { current: uploadedCount, total: selectedFiles.length })}</>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {selectedFiles.length > 0 ? t('fileUpload.importFiles', { count: selectedFiles.length }) : t('fileUpload.importButton')}
            </>
          )}
        </Button>
      </div>

      {hasBlockingDuplicates && (
        <p className="text-xs text-destructive text-center">
          {t('fileUpload.duplicate.blockingWarning')}
        </p>
      )}
    </div>
  );
};

export default FileUploadTab;
