import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, RefreshCw, Pencil } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import PetExamReviewDialog from './PetExamReviewDialog';

type ExamRow = {
  id: string;
  exam_type: string;
  exam_date: string | null;
  lab_name: string | null;
  file_url: string | null;
  flags_abnormal: string[] | null;
  extraction_status: 'pending' | 'processing' | 'done' | 'failed' | null;
  extraction_error: string | null;
  results: Record<string, any> | null;
  clinical_comments: string | null;
  consultation_id: string | null;
  approved: boolean | null;
};

type Consultation = { id: string; consultation_date: string; chief_complaint: string | null };

export default function PetExamPdfUploader({ petId }: { petId: string }) {
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [linkConsultationId, setLinkConsultationId] = useState<string>('auto');
  const [reviewExamId, setReviewExamId] = useState<string | null>(null);

  const load = async () => {
    const [{ data, error }, { data: cons }] = await Promise.all([
      supabase
        .from('pet_exams')
        .select('id, exam_type, exam_date, lab_name, file_url, flags_abnormal, extraction_status, extraction_error, results, clinical_comments, consultation_id, approved')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false }),
      supabase
        .from('pet_consultations')
        .select('id, consultation_date, chief_complaint')
        .eq('pet_id', petId)
        .order('consultation_date', { ascending: false }),
    ]);
    if (error) { toast.error(error.message); return; }
    setExams((data ?? []) as ExamRow[]);
    setConsultations((cons ?? []) as Consultation[]);
  };

  useEffect(() => { void load(); }, [petId]);

  // poll while any exam is processing
  useEffect(() => {
    const hasProcessing = exams.some(e => e.extraction_status === 'processing' || e.extraction_status === 'pending');
    if (!hasProcessing) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [exams]);

  const triggerExtract = async (examId: string, storagePath: string) => {
    const { error } = await supabase.functions.invoke('parse-pet-exam-pdf', {
      body: { exam_id: examId, file_url: storagePath },
    });
    if (error) toast.error(`Extração falhou: ${error.message}`);
  };

  const handleFiles = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${petId}/${Date.now()}_${safe}`;
        const { error: upErr } = await supabase.storage.from('pet_exams_pdfs').upload(path, file, {
          contentType: 'application/pdf', upsert: false,
        });
        if (upErr) { toast.error(`Upload falhou: ${upErr.message}`); continue; }

        const { data: ins, error: insErr } = await supabase.from('pet_exams').insert({
          pet_id: petId,
          exam_type: 'Aguardando extração',
          file_url: path,
          extraction_status: 'pending',
          consultation_id: linkConsultationId !== 'auto' && linkConsultationId !== 'none' ? linkConsultationId : null,
        }).select('id').single();
        if (insErr || !ins) { toast.error(`Registro falhou: ${insErr?.message}`); continue; }

        toast.success(`${file.name} enviado. Extraindo dados…`);
        void triggerExtract(ins.id, path);
      }
      await load();
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFiles,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    disabled: uploading,
  });

  const reExtract = async (e: ExamRow) => {
    if (!e.file_url) return;
    await supabase.from('pet_exams').update({ extraction_status: 'processing' }).eq('id', e.id);
    await load();
    void triggerExtract(e.id, e.file_url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" /> Exames em PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {consultations.length > 0 && (
          <div className="flex items-center gap-2">
            <Label className="text-xs whitespace-nowrap">Vincular novos uploads à consulta:</Label>
            <Select value={linkConsultationId} onValueChange={setLinkConsultationId}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automático (por data)</SelectItem>
                <SelectItem value="none">Sem vínculo</SelectItem>
                {consultations.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.consultation_date}{c.chief_complaint ? ` — ${c.chief_complaint.slice(0, 30)}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-5 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
          } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
          )}
          <p className="text-sm mt-2">
            {isDragActive ? 'Solte os PDFs aqui' : 'Arraste PDFs ou clique para enviar'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Hemograma, bioquímico, urinálise, etc.</p>
        </div>

        {exams.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">Nenhum exame enviado ainda.</p>
        )}

        <div className="space-y-2">
          {exams.map((e) => (
            <div key={e.id} className="border rounded-md p-3 text-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {e.extraction_status === 'done' && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
                  {e.extraction_status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />}
                  {e.extraction_status === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
                  {e.extraction_status === 'failed' && <AlertCircle className="h-4 w-4 text-destructive shrink-0" />}
                  <span className="font-medium truncate">{e.exam_type}</span>
                  {e.exam_date && <Badge variant="outline" className="text-[10px]">{e.exam_date}</Badge>}
                  {e.lab_name && <Badge variant="secondary" className="text-[10px]">{e.lab_name}</Badge>}
                  {e.extraction_status === 'done' && (
                    e.approved
                      ? <Badge className="text-[10px] bg-green-600 hover:bg-green-600">Aprovado</Badge>
                      : <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-700">Pendente revisão</Badge>
                  )}
                </div>
                {e.extraction_status === 'done' && (
                  <Button size="sm" variant={e.approved ? 'ghost' : 'default'} onClick={() => setReviewExamId(e.id)}>
                    <Pencil className="h-3 w-3 mr-1" /> {e.approved ? 'Editar' : 'Revisar'}
                  </Button>
                )}
                {(e.extraction_status === 'failed' || e.extraction_status === 'done') && (
                  <Button size="sm" variant="ghost" onClick={() => reExtract(e)}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Reextrair
                  </Button>
                )}
              </div>
              {e.extraction_status === 'failed' && (
                <p className="text-xs text-destructive mt-1">Erro: {e.extraction_error}</p>
              )}
              {e.flags_abnormal && e.flags_abnormal.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-2">
                  {e.flags_abnormal.map((f) => (
                    <Badge key={f} variant="destructive" className="text-[10px]">{f}</Badge>
                  ))}
                </div>
              )}
              {e.clinical_comments && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{e.clinical_comments}</p>
              )}
              {e.results && Object.keys(e.results).length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-primary cursor-pointer">Ver {Object.keys(e.results).length} resultados</summary>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                    {Object.entries(e.results).slice(0, 30).map(([k, v]: [string, any]) => (
                      <div key={k} className="flex justify-between border-b py-0.5">
                        <span className="text-muted-foreground truncate">{k}</span>
                        <span className={v?.flag === 'high' || v?.flag === 'low' ? 'text-destructive font-medium' : ''}>
                          {typeof v === 'object' ? `${v.value ?? '-'} ${v.unit ?? ''}` : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>

        {reviewExamId && (
          <PetExamReviewDialog
            examId={reviewExamId}
            petId={petId}
            open={!!reviewExamId}
            onOpenChange={(v) => { if (!v) setReviewExamId(null); }}
            onApproved={() => { void load(); }}
          />
        )}
      </CardContent>
    </Card>
  );
}