import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, PawPrint, Stethoscope, Pill, TestTube, FileText, Brain, Loader2 } from 'lucide-react';
import { usePetProfileDetail } from '@/hooks/usePetProfile';
import PetClinicalChat from '@/components/pet/PetClinicalChat';

const severityColors: Record<string, string> = {
  mild: 'bg-yellow-100 text-yellow-800',
  moderate: 'bg-orange-100 text-orange-800',
  severe: 'bg-red-100 text-red-800',
};

const statusColors: Record<string, string> = {
  active: 'bg-red-100 text-red-800',
  monitoring: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
};

const PetProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading, error } = usePetProfileDetail(id);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error || !data?.profile) {
    return (
      <Layout>
        <div className="container mx-auto py-6 px-4">
          <Button variant="ghost" onClick={() => navigate('/veterinario')}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('common.back')}
          </Button>
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('petRegistration.profile.notFound')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const { profile, conditions, medications, exams, clinicalNotes } = data;

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/veterinario')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <PawPrint className="h-6 w-6" />
              {profile.name}
            </h1>
            <p className="text-muted-foreground">
              {profile.breed} · {profile.age_years} {t('petRegistration.profile.years')} · {profile.weight_kg}kg · {profile.sex === 'male' ? t('petRegistration.form.male') : t('petRegistration.form.female')}
              {profile.neutered && ` · ${t('petRegistration.form.neutered')}`}
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Brain className="h-4 w-4" />
            {t('petRegistration.profile.analyzeWithKG')}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Stethoscope className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{conditions.length}</p>
                <p className="text-xs text-muted-foreground">{t('petRegistration.conditions.title')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Pill className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{medications.length}</p>
                <p className="text-xs text-muted-foreground">{t('petRegistration.medications.title')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <TestTube className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{exams.length}</p>
                <p className="text-xs text-muted-foreground">{t('petRegistration.exams.title')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{clinicalNotes.length}</p>
                <p className="text-xs text-muted-foreground">{t('petRegistration.profile.clinicalNotes')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="conditions">
              <TabsList className="mb-4">
                <TabsTrigger value="conditions" className="gap-1">
                  <Stethoscope className="h-3.5 w-3.5" />
                  {t('petRegistration.conditions.title')}
                </TabsTrigger>
                <TabsTrigger value="medications" className="gap-1">
                  <Pill className="h-3.5 w-3.5" />
                  {t('petRegistration.medications.title')}
                </TabsTrigger>
                <TabsTrigger value="exams" className="gap-1">
                  <TestTube className="h-3.5 w-3.5" />
                  {t('petRegistration.exams.title')}
                </TabsTrigger>
                <TabsTrigger value="notes" className="gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {t('petRegistration.profile.clinicalNotes')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="conditions">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('petRegistration.conditions.active')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {conditions.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        {t('petRegistration.conditions.none')}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {conditions.map((c: any) => (
                          <div key={c.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                            <div>
                              <p className="font-medium text-sm">{c.condition_name}</p>
                              {c.notes && <p className="text-xs text-muted-foreground">{c.notes}</p>}
                            </div>
                            <div className="flex gap-2">
                              {c.severity && (
                                <Badge variant="outline" className={severityColors[c.severity]}>
                                  {c.severity}
                                </Badge>
                              )}
                              <Badge variant="outline" className={statusColors[c.status]}>
                                {c.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="medications">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('petRegistration.medications.current')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {medications.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        {t('petRegistration.medications.none')}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {medications.map((m: any) => (
                          <div key={m.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                            <div>
                              <p className="font-medium text-sm">{m.medication_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {m.dosage && `${m.dosage}`}
                                {m.frequency && ` · ${m.frequency}`}
                              </p>
                            </div>
                            {!m.end_date && (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                {t('petRegistration.medications.active')}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="exams">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('petRegistration.exams.results')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {exams.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        {t('petRegistration.exams.none')}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {exams.map((e: any) => (
                          <div key={e.id} className="border-b pb-3 last:border-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm">{e.exam_type}</p>
                              {e.exam_date && (
                                <span className="text-xs text-muted-foreground">{e.exam_date}</span>
                              )}
                            </div>
                            {e.results && (
                              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(e.results, null, 2)}
                              </pre>
                            )}
                            {e.notes && <p className="text-xs text-muted-foreground mt-1">{e.notes}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('petRegistration.profile.clinicalHistory')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {clinicalNotes.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        {t('petRegistration.profile.noNotes')}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {clinicalNotes.map((n: any) => (
                          <div key={n.id} className="border-b pb-3 last:border-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {n.note_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(n.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm">{n.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Chat Sidebar */}
          <div className="min-h-[500px]">
            <PetClinicalChat
              petId={id!}
              petBreed={profile.breed}
              petAge={profile.age_years}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PetProfilePage;
