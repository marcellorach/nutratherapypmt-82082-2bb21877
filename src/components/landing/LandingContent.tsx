import React from 'react';
import LandingSectionNav from './LandingSectionNav';
import VisionSection from './VisionSection';
import OpportunitySection from './OpportunitySection';
import TechnologySection from './TechnologySection';
import OutcomesSection from './OutcomesSection';
import MarketSection from './MarketSection';
import InvestmentSection from './InvestmentSection';

const LandingContent: React.FC = () => {
  return (
    <>
      <LandingSectionNav />
      <VisionSection />
      <OpportunitySection />
      <TechnologySection />
      <OutcomesSection />
      <MarketSection />
      <InvestmentSection />
    </>
  );
};

export default LandingContent;
