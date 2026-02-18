import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, RotateCcw } from 'lucide-react';
import businessCycleFlywheel from '@/assets/business-cycle-flywheel.png';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0, 0, 0.2, 1] as const }
  })
};

const layers = [
  { key: 'L0', color: 'bg-teal-600', label: 'Compounds' },
  { key: 'L1', color: 'bg-teal-500', label: 'Targets' },
  { key: 'L2', color: 'bg-cyan-500', label: 'Mechanisms' },
  { key: 'L3', color: 'bg-sky-500', label: 'Effects' },
  { key: 'L4', color: 'bg-blue-600', label: 'Clinical Outcomes' },
];

const pipelineSteps = [
  'massData', 'aiAnalysis', 'knowledgeGraph', 'treatment', 'tracking', 'feedback'
];

const TechnologySection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section id="technology" className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}
        >
          <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold tracking-widest uppercase text-gray-500 mb-4">
            {t('landing.technology.badge')}
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold text-gray-900 mb-4">
            {t('landing.technology.title')}
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-gray-500 max-w-3xl mx-auto">
            {t('landing.technology.subtitle')}
          </motion.p>
        </motion.div>

        {/* 5-Layer KG Model */}
        <motion.div
          className="bg-white rounded-2xl border border-gray-200 p-8 mb-12 shadow-sm"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        >
          <motion.h3 variants={fadeUp} custom={0} className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
            <Brain size={24} className="text-gray-700" />
            {t('landing.technology.layersTitle')}
          </motion.h3>

          {/* Layers */}
          <motion.div variants={fadeUp} custom={1} className="flex flex-col md:flex-row items-stretch gap-0">
            {layers.map((layer, i) => (
              <React.Fragment key={layer.key}>
                <div className={`flex-1 ${layer.color} text-white rounded-lg md:rounded-none ${i === 0 ? 'md:rounded-l-xl' : ''} ${i === layers.length - 1 ? 'md:rounded-r-xl' : ''} p-4 text-center`}>
                  <div className="text-xs font-mono opacity-80">{layer.key}</div>
                  <div className="text-sm font-bold mt-1">{t(`landing.technology.layers.${layer.key}`)}</div>
                </div>
                {i < layers.length - 1 && (
                  <div className="hidden md:flex items-center justify-center px-1">
                    <ArrowRight size={16} className="text-gray-400" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </motion.div>

          <motion.p variants={fadeUp} custom={2} className="text-gray-500 text-sm mt-6 text-center">
            {t('landing.technology.layersDesc')}
          </motion.p>
        </motion.div>

        {/* Business Cycle Flywheel */}
        <motion.div
          className="mb-12"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        >
          <motion.div variants={fadeUp} custom={0} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <motion.h3 variants={fadeUp} custom={0} className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <RotateCcw size={24} className="text-gray-700" />
              {t('landing.technology.flywheelTitle')}
            </motion.h3>
            <img
              src={businessCycleFlywheel}
              alt="Business cycle flywheel - from data acquisition to treatment, sales and feedback"
              className="w-full rounded-lg"
            />
          </motion.div>
        </motion.div>

        {/* Pipeline Flow */}
        <motion.div
          className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        >
          <motion.h3 variants={fadeUp} custom={0} className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
            <RotateCcw size={24} className="text-gray-700" />
            {t('landing.technology.pipelineTitle')}
          </motion.h3>

          {/* Circular pipeline */}
          <motion.div variants={fadeUp} custom={1} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {pipelineSteps.map((step, i) => (
              <div key={step} className="relative">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors h-full">
                  <div className="text-2xl font-black text-gray-300 mb-1">{String(i + 1).padStart(2, '0')}</div>
                  <div className="text-sm font-semibold text-gray-900">{t(`landing.technology.pipeline.${step}.title`)}</div>
                  <div className="text-xs text-gray-500 mt-1">{t(`landing.technology.pipeline.${step}.desc`)}</div>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} custom={2} className="mt-8 bg-gray-900 text-white rounded-xl p-6 text-center">
            <p className="text-sm font-medium">{t('landing.technology.mlInsight')}</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default TechnologySection;
