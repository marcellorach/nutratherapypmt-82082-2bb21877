import React from 'react';
import { useTranslation } from 'react-i18next';

interface CsvPreviewProps {
  previewData: any[] | null;
}

const CsvPreview: React.FC<CsvPreviewProps> = ({ previewData }) => {
  const { t } = useTranslation();
  
  if (!previewData || previewData.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">{t('import.nutraceuticals.preview.title')}</h3>
      <div className="bg-gray-50 p-2 rounded-md overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              {Object.keys(previewData[0] || {}).map(header => (
                <th key={header} className="p-2 text-left border-b border-gray-200">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.map((row, i) => (
              <tr key={i}>
                {Object.values(row).map((val, j) => (
                  <td key={j} className="p-2 border-b border-gray-200">
                    {val as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {t('import.nutraceuticals.preview.showing', { count: previewData.length })}
      </p>
    </div>
  );
};

export default CsvPreview;
