import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, TrendingUp, FlaskConical, Heart, Shield } from 'lucide-react';
import { useIsPetloveVariant } from '@/contexts/SiteVariantContext';
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0, 0, 0.2, 1] as const }
  })
};

const OpportunitySection: React.FC = () => {
  const { t } = useTranslation();
  const isPetlove = useIsPetloveVariant();

  const pillars = [
    { icon: FlaskConical, key: 'pillar1' },
    { icon: TrendingUp, key: 'pillar2' },
    { icon: Users, key: 'pillar3' },
  ];

  return (
    <section id="opportunity" className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {isPetlove && (
          <motion.div
            className="text-center mb-16"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold tracking-widest uppercase text-gray-500 mb-4">
              {t('landing.opportunity.badge')}
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold text-gray-900 mb-4">
              {t('landing.opportunity.title')}
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t('landing.opportunity.subtitle')}
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="mt-4 inline-flex items-center gap-2 text-xs text-gray-400 italic">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
              {t('landing.partnership.inDevelopment')}
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 max-w-4xl mx-auto text-left">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <Heart className="w-5 h-5 text-gray-700" />
                  <h3 className="font-semibold text-gray-900">1.4M</h3>
                </div>
                <p className="text-sm text-gray-600 mb-1">{t('landing.opportunity.petlove.dogs')}</p>
                <p className="text-xs text-gray-500">{t('landing.opportunity.petlove.desc')}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-gray-700" />
                  <h3 className="font-semibold text-gray-900">PAMEC · 11</h3>
                </div>
                <p className="text-sm text-gray-600 mb-1">{t('landing.opportunity.pamec.forces')}</p>
                <p className="text-xs text-gray-500">{t('landing.opportunity.pamec.desc')}</p>
              </div>
            </div>
          </motion.div>
        )}

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
