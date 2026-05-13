import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, Microscope, TrendingUp, FlaskConical } from 'lucide-react';
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0, 0, 0.2, 1] as const }
  })
};

const OpportunitySection: React.FC = () => {
  const { t } = useTranslation();

  const pillars = [
    { icon: FlaskConical, key: 'pillar1' },
    { icon: TrendingUp, key: 'pillar2' },
    { icon: Users, key: 'pillar3' },
  ];

  return (
    <section id="opportunity" className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* 3 Strategic Pillars */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        >
          <motion.h3 variants={fadeUp} custom={0} className="text-2xl font-bold text-center text-gray-900 mb-8">
            {t('landing.opportunity.pillarsTitle')}
          </motion.h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((p, i) => (
              <motion.div
                key={p.key}
                variants={fadeUp}
                custom={i + 1}
                className="bg-white rounded-2xl p-6 border border-gray-200 text-center hover:shadow-md transition-shadow"
              >
                <div className="rounded-full bg-gray-100 w-14 h-14 flex items-center justify-center mx-auto mb-4">
                  <p.icon size={28} className="text-gray-800" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {t(`landing.opportunity.${p.key}.title`)}
                </h4>
                <p className="text-gray-500 text-sm">
                  {t(`landing.opportunity.${p.key}.desc`)}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default OpportunitySection;
