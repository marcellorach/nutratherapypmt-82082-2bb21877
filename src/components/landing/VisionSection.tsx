import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Dna, ShieldCheck, AlertTriangle, Clock, ArrowRight } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0, 0, 0.2, 1] as const }
  })
};

const VisionSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section id="vision" className="py-24 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold tracking-widest uppercase text-gray-500 mb-4">
            {t('landing.vision.badge')}
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 leading-tight">
            {t('landing.vision.slogan1')}
          </motion.h2>
          <motion.h3 variants={fadeUp} custom={2} className="text-2xl md:text-3xl font-semibold text-gray-600 mb-6">
            {t('landing.vision.slogan2')}
          </motion.h3>
          <motion.p variants={fadeUp} custom={3} className="text-lg text-gray-500 max-w-2xl mx-auto">
            {t('landing.vision.subtitle')}
          </motion.p>
        </motion.div>

        {/* Translational Model */}
        <motion.div
          className="bg-white rounded-2xl border border-gray-200 p-8 mb-12 shadow-sm"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        >
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-6">
            <Clock size={24} className="text-gray-700" />
            <h4 className="text-xl font-semibold text-gray-900">{t('landing.vision.translational.title')}</h4>
          </motion.div>
          <motion.p variants={fadeUp} custom={1} className="text-gray-600 mb-8 max-w-3xl">
            {t('landing.vision.translational.desc')}
          </motion.p>

          {/* 7x faster visual */}
          <motion.div variants={fadeUp} custom={2} className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center">
              <div className="text-6xl font-black text-gray-900">7×</div>
              <p className="text-sm text-gray-500 mt-2">{t('landing.vision.translational.faster')}</p>
            </div>
            <div className="flex-1">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-3 rounded-full bg-gray-800" style={{ width: '100%' }} />
                  <span className="text-xs text-gray-500 whitespace-nowrap">{t('landing.vision.translational.dogLife')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 rounded-full bg-gray-300" style={{ width: '14%' }} />
                  <span className="text-xs text-gray-500 whitespace-nowrap">{t('landing.vision.translational.humanEquiv')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Geroprotection vs Gerogenic Infographic */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        >
          {/* Geroprotection side */}
          <motion.div variants={fadeUp} custom={0} className="bg-emerald-50 p-8 border-b md:border-b-0 md:border-r border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck size={28} className="text-emerald-700" />
              <h4 className="text-xl font-bold text-emerald-900">{t('landing.vision.geroprotection.title')}</h4>
            </div>
            <ul className="space-y-4">
              {['item1', 'item2', 'item3', 'item4'].map((key, i) => (
                <li key={key} className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-gray-700">{t(`landing.vision.geroprotection.${key}`)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 text-center">
              <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full">
                {t('landing.vision.geroprotection.label')}
              </span>
            </div>
          </motion.div>

          {/* Gerogenic side */}
          <motion.div variants={fadeUp} custom={1} className="bg-red-50 p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle size={28} className="text-red-700" />
              <h4 className="text-xl font-bold text-red-900">{t('landing.vision.gerogenic.title')}</h4>
            </div>
            <ul className="space-y-4">
              {['item1', 'item2', 'item3', 'item4'].map((key, i) => (
                <li key={key} className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <span className="text-gray-700">{t(`landing.vision.gerogenic.${key}`)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 text-center">
              <span className="inline-block bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full">
                {t('landing.vision.gerogenic.label')}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Central insight */}
        <motion.div
          variants={fadeUp} custom={0}
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-lg font-medium text-gray-700 max-w-2xl mx-auto flex items-center justify-center gap-2">
            <ArrowRight size={18} className="text-gray-400" />
            {t('landing.vision.rootCause')}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default VisionSection;
