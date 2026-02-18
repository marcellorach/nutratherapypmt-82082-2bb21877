import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, Microscope, TrendingUp, FlaskConical } from 'lucide-react';
import petloveLogo from '@/assets/petlove-logo.svg';
import pamecLogo from '@/assets/pamec-logo.png';

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
        <motion.div
          className="text-center mb-16"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}
        >
          <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold tracking-widest uppercase text-gray-500 mb-4">
            {t('landing.opportunity.badge')}
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold text-gray-900 mb-4">
            {t('landing.opportunity.title')}
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-gray-500 max-w-2xl mx-auto">
            {t('landing.opportunity.subtitle')}
          </motion.p>
        </motion.div>

        {/* PetLove + PAMEC */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        >
          <motion.div variants={fadeUp} custom={0} className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <img src={petloveLogo} alt="PetLove" className="h-7 w-auto" />
              <h4 className="text-lg font-bold text-gray-900">PetLove</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center bg-white rounded-xl p-4 border border-gray-100">
                <div className="text-3xl font-black text-gray-900">1.4M</div>
                <p className="text-xs text-gray-500 mt-1">{t('landing.opportunity.petlove.dogs')}</p>
              </div>
              <div className="text-center bg-white rounded-xl p-4 border border-gray-100">
                <div className="text-3xl font-black text-gray-900">+30K</div>
                <p className="text-xs text-gray-500 mt-1">{t('landing.opportunity.petlove.monthly')}</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">{t('landing.opportunity.petlove.desc')}</p>
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <img src={pamecLogo} alt="PAMEC" className="h-8 w-auto" />
              <h4 className="text-lg font-bold text-gray-900">PAMEC</h4>
            </div>
            <div className="text-center bg-white rounded-xl p-4 border border-gray-100 mb-4">
              <div className="text-3xl font-black text-gray-900">11</div>
              <p className="text-xs text-gray-500 mt-1">{t('landing.opportunity.pamec.forces')}</p>
            </div>
            <p className="text-gray-600 text-sm">{t('landing.opportunity.pamec.desc')}</p>
          </motion.div>
        </motion.div>

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
