
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Import, Database, CheckCircle, X, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowDown } from "lucide-react";
import TabInfoButton from '../common/TabInfoButton';
import { adminTabsInfo } from '@/data/admin-tabs-info';

const ImportStep: React.FC = () => {
  const { t } = useTranslation();
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importStats, setImportStats] = useState({
    totalRecords: 0,
    petsImported: 0,
    prontuariosImported: 0,
    examsImported: 0,
    eligiblePets: 0
  });
  
  const simulateImport = () => {
    setImporting(true);
    setStatus('importing');
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setImporting(false);
          setStatus('success');
          setImportStats({
            totalRecords: 5877,
            petsImported: 5222,
            prontuariosImported: 4002,
            examsImported: 3987,
            eligiblePets: 3981
          });
          return 100;
        }
        
        return newProgress;
      });
    }, 200);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('dataImport.title')}</h2>
          <p className="text-gray-600">{t('dataImport.description')}</p>
        </div>
        <div className="flex gap-2">
          <TabInfoButton
            tabId="import"
            title={t('admin.sidebar.dataProcessing.title')}
            content={adminTabsInfo['import']}
          />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('dataImport.petlove.title')}</h3>
            <Database className="h-6 w-6 text-gray-500" />
          </div>
          
          <p className="mb-6 text-sm text-gray-600">
            {t('dataImport.petlove.description')}
          </p>
          
          {status === 'success' ? (
            <Alert className="mb-4 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle>{t('dataImport.petlove.success.title')}</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t('dataImport.petlove.success.totalRecords')}</span>
                    <span className="font-bold">{importStats.totalRecords}</span>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <span>{t('dataImport.petlove.success.petsCorrelated')}</span>
                      <span className="font-medium">{importStats.petsImported}</span>
                    </div>
                    <div className="flex justify-center">
                      <ArrowDown className="h-4 w-4 text-blue-500" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>{t('dataImport.petlove.success.medicalRecords')}</span>
                      <span className="font-medium">{importStats.prontuariosImported}</span>
                    </div>
                    <div className="flex justify-center">
                      <ArrowDown className="h-4 w-4 text-blue-500" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>{t('dataImport.petlove.success.exams')}</span>
                      <span className="font-medium">{importStats.examsImported}</span>
                    </div>
                    <div className="flex justify-center">
                      <ArrowDown className="h-4 w-4 text-blue-500" />
                    </div>
                    
                    <div className="flex items-center justify-between mt-1 p-2 bg-purple-50 border border-purple-200 rounded-md">
                      <span className="font-medium text-purple-900">{t('dataImport.petlove.success.eligible')}</span>
                      <div className="flex items-center">
                        <span className="font-bold text-purple-800">{importStats.eligiblePets}</span>
                        <ArrowRight className="h-4 w-4 ml-1 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ) : status === 'error' ? (
            <Alert className="mb-4 bg-red-50" variant="destructive">
              <X className="h-5 w-5" />
              <AlertTitle>{t('dataImport.petlove.error.title')}</AlertTitle>
              <AlertDescription>
                {t('dataImport.petlove.error.description')}
              </AlertDescription>
            </Alert>
          ) : null}
          
          {status === 'importing' && (
            <div className="mb-4 space-y-2">
              <Progress value={progress} className="h-2 w-full" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{t('dataImport.petlove.importing')}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          )}
          
          <Button 
            onClick={simulateImport}
            disabled={importing}
            className="w-full"
          >
            {importing ? (
              <span className="flex items-center">
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('dataImport.petlove.importing')}
              </span>
            ) : (
              <>
                <Import className="mr-2 h-4 w-4" />
                {status === 'success' ? t('dataImport.petlove.importAgain') : t('dataImport.petlove.startImport')}
              </>
            )}
          </Button>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-6 text-lg font-semibold">{t('dataImport.sources.title')}</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border border-gray-200 p-3">
              <div className="flex items-center">
                <div className="mr-3 h-10 w-10 rounded-full bg-blue-100 p-2">
                  <img src="https://via.placeholder.com/24" alt="PetLove" className="h-full w-full" />
                </div>
                <div>
                  <h4 className="font-medium">{t('dataImport.sources.petlove.name')}</h4>
                  <p className="text-xs text-gray-500">{t('dataImport.sources.petlove.description')}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">{t('dataImport.sources.connect')}</Button>
            </div>
            
            <div className="flex items-center justify-between rounded-md border border-gray-200 p-3">
              <div className="flex items-center">
                <div className="mr-3 h-10 w-10 rounded-full bg-green-100 p-2">
                  <img src="https://via.placeholder.com/24" alt="VetSmart" className="h-full w-full" />
                </div>
                <div>
                  <h4 className="font-medium">{t('dataImport.sources.vetsmart.name')}</h4>
                  <p className="text-xs text-gray-500">{t('dataImport.sources.vetsmart.description')}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">{t('dataImport.sources.connect')}</Button>
            </div>
            
            <div className="flex items-center justify-between rounded-md border border-gray-200 p-3">
              <div className="flex items-center">
                <div className="mr-3 h-10 w-10 rounded-full bg-yellow-100 p-2">
                  <img src="https://via.placeholder.com/24" alt="PetShop" className="h-full w-full" />
                </div>
                <div>
                  <h4 className="font-medium">{t('dataImport.sources.petshop.name')}</h4>
                  <p className="text-xs text-gray-500">{t('dataImport.sources.petshop.description')}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">{t('dataImport.sources.connect')}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportStep;

