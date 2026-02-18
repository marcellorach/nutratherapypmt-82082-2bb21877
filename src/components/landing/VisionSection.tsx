import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Clock, ArrowRight, BarChart3, FlaskConical } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0, 0, 0.2, 1] as const }
  })
};

const dogMilestones = [
  { key: 'puppy', pos: 0 },
  { key: 'adult', pos: 23 },   // ~3/13
  { key: 'senior', pos: 54 },  // ~7/13
  { key: 'geriatric', pos: 77 } // ~10/13
];

const humanMilestones = [
  { key: 'puppy', pos: 0 },
  { key: 'adult', pos: 24 },   // ~20/85
  { key: 'senior', pos: 59 },  // ~50/85
  { key: 'geriatric', pos: 82 } // ~70/85
];

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

          {/* === LAYER 1: Comparative Life Timelines === */}
          <motion.div variants={fadeUp} custom={2} className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              {t('landing.vision.translational.timelineTitle')}
            </p>

            {/* Dog timeline */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-bold text-gray-800 w-16">{t('landing.vision.translational.dogTimeline')}</span>
                <span className="text-xs text-gray-400">0–13 {t('landing.vision.translational.years')}</span>
              </div>
              <div className="relative h-8 rounded-full bg-gray-900 overflow-visible">
                {dogMilestones.map((m) => (
                  <div key={m.key} className="absolute top-full mt-1" style={{ left: `${m.pos}%` }}>
                    <div className="w-px h-3 bg-gray-400 mx-auto" />
                    <span className="text-[10px] text-gray-500 whitespace-nowrap block -translate-x-1/2 ml-[0.5px]">
                      {t(`landing.vision.translational.${m.key}`)}
                    </span>
                  </div>
                ))}
                {/* Intervention window marker */}
                <div className="absolute top-0 bottom-0 rounded-r-full bg-emerald-500/30 border-l-2 border-emerald-500" style={{ left: '54%', right: '0%' }} />
                <div className="absolute -top-7 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap" style={{ left: '54%' }}>
                  {t('landing.vision.translational.interventionWindow')}
                </div>
              </div>
            </div>

            {/* Human timeline */}
            <div className="mt-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-bold text-gray-800 w-16">{t('landing.vision.translational.humanTimeline')}</span>
                <span className="text-xs text-gray-400">0–85 {t('landing.vision.translational.years')}</span>
              </div>
              <div className="relative h-8 rounded-full bg-gray-300 overflow-visible">
                {humanMilestones.map((m) => (
                  <div key={m.key} className="absolute top-full mt-1" style={{ left: `${m.pos}%` }}>
                    <div className="w-px h-3 bg-gray-300 mx-auto" />
                    <span className="text-[10px] text-gray-400 whitespace-nowrap block -translate-x-1/2 ml-[0.5px]">
                      {t(`landing.vision.translational.${m.key}`)}
                    </span>
                  </div>
                ))}
                {/* Equivalent intervention window */}
                <div className="absolute top-0 bottom-0 rounded-r-full bg-emerald-500/15 border-l-2 border-emerald-300" style={{ left: '59%', right: '0%' }} />
              </div>
            </div>
          </motion.div>

          {/* === LAYER 2: Time to Clinical Results === */}
          <motion.div variants={fadeUp} custom={3} className="mb-10 bg-gray-50 rounded-xl p-6 border border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-5">
              {t('landing.vision.translational.clinicalResultsTitle')}
            </p>

            <div className="flex items-center gap-3 mb-4">
              <FlaskConical size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">{t('landing.vision.translational.treatmentStart')}</span>
            </div>

            {/* Dog: short arrow */}
            <div className="flex items-center gap-4 mb-3">
              <span className="text-xs font-semibold text-gray-700 w-16 shrink-0">{t('landing.vision.translational.dogTimeline')}</span>
              <div className="relative flex-1">
                <div className="h-4 rounded-full bg-emerald-500 flex items-center justify-end pr-3" style={{ width: '20%' }}>
                  <ArrowRight size={12} className="text-white" />
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">{t('landing.vision.translational.dogResults')}</span>
            </div>

            {/* Human: long arrow */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xs font-semibold text-gray-700 w-16 shrink-0">{t('landing.vision.translational.humanTimeline')}</span>
              <div className="relative flex-1">
                <div className="h-4 rounded-full bg-gray-300 flex items-center justify-end pr-3" style={{ width: '85%' }}>
                  <ArrowRight size={12} className="text-gray-500" />
                </div>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">{t('landing.vision.translational.humanResults')}</span>
            </div>

            {/* 7x badge */}
            <div className="text-center">
              <span className="inline-block bg-gray-900 text-white text-lg font-black px-5 py-2 rounded-full">
                {t('landing.vision.translational.fasterLabel')}
              </span>
            </div>
          </motion.div>

          {/* === LAYER 3: Statistical Nuances === */}
          <motion.div variants={fadeUp} custom={4} className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 size={20} className="text-blue-700" />
              <h5 className="text-sm font-bold text-blue-900">{t('landing.vision.translational.statisticalTitle')}</h5>
            </div>
            <ul className="space-y-3 mb-4">
              {['stat1', 'stat2', 'stat3'].map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-sm text-gray-700">{t(`landing.vision.translational.${key}`)}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-blue-400 italic">
              {t('landing.vision.translational.reference')}
            </p>
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
              {['item1', 'item2', 'item3', 'item4'].map((key) => (
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
              {['item1', 'item2', 'item3', 'item4'].map((key) => (
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
