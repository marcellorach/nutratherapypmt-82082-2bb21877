
import React from 'react';
import EstudosHeader from './estudos/EstudosHeader';
import SciImportSection from './estudos/import/SciImportSection';
import SystemGuideCard from './estudos/SystemGuideCard';
import './estudos/estudos.css';

const EstudosTab: React.FC = () => {
  return (
    <>
      <EstudosHeader onAddEstudo={() => {}} />
      
      <div className="space-y-6">
        <SystemGuideCard />
        
        <SciImportSection />
      </div>
    </>
  );
};

export default EstudosTab;
