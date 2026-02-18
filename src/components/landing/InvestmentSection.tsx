import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Calendar, FileText, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0, 0, 0.2, 1] as const }
  })
};

const moats = ['moat1', 'moat2', 'moat3', 'moat4'];

const roadmap = [
  { key: 'phase1', done: true },
  { key: 'phase2', done: true },
  { key: 'phase3', done: false },
  { key: 'phase4', done: false },
];

const InvestmentSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section id="invest" className="py-24 px-4 bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}
        >
          <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-4">
            {t('landing.investment.badge')}
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold mb-4">
            {t('landing.investment.title')}
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-gray-400 max-w-2xl mx-auto">
            {t('landing.investment.subtitle')}
          </motion.p>
        </motion.div>

        {/* Competitive Moats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        >
          {moats.map((key, i) => (
            <motion.div
              key={key}
              variants={fadeUp}
              custom={i}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <h4 className="font-bold text-white mb-2">{t(`landing.investment.${key}.title`)}</h4>
              <p className="text-sm text-gray-400">{t(`landing.investment.${key}.desc`)}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Roadmap */}
        <motion.div
          className="mb-16"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        >
          <motion.h3 variants={fadeUp} custom={0} className="text-2xl font-bold text-center mb-8">
            {t('landing.investment.roadmapTitle')}
          </motion.h3>
          <motion.div variants={fadeUp} custom={1} className="flex flex-col md:flex-row gap-4">
            {roadmap.map((phase, i) => (
              <div key={phase.key} className={`flex-1 rounded-xl p-6 border ${phase.done ? 'bg-gray-700 border-gray-600' : 'bg-gray-800 border-gray-700'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {phase.done ? (
                    <CheckCircle2 size={18} className="text-emerald-400" />
                  ) : (
                    <Circle size={18} className="text-gray-500" />
                  )}
                  <span className="text-xs font-semibold text-gray-400 uppercase">{t(`landing.investment.${phase.key}.phase`)}</span>
                </div>
                <h4 className="font-bold mb-1">{t(`landing.investment.${phase.key}.title`)}</h4>
                <p className="text-xs text-gray-500">{t(`landing.investment.${phase.key}.desc`)}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="text-center"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          <motion.div variants={fadeUp} custom={0} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 text-base px-8 py-6">
              <Calendar size={20} className="mr-2" />
              {t('landing.investment.cta1')}
            </Button>
            <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 text-base px-8 py-6">
              <FileText size={20} className="mr-2" />
              {t('landing.investment.cta2')}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default InvestmentSection;
