import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Calendar, FileText, CheckCircle2, Circle, Mail, Phone } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0, 0, 0.2, 1] as const }
  })
};

const moats = ['moat1', 'moat2', 'moat3', 'moat4'];

const roadmap = [
  { key: 'phase1', progress: 100 },
  { key: 'phase2', progress: 100 },
  { key: 'phase3', progress: 90 },
  { key: 'phase4', progress: 100 },
  { key: 'phase5', progress: 10 },
  { key: 'phase6', progress: 0 },
];

const InvestmentSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section id="invest" className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}
        >
          <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold tracking-widest uppercase text-gray-500 mb-4">
            {t('landing.investment.badge')}
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold text-gray-900 mb-4">
            {t('landing.investment.title')}
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-gray-500 max-w-2xl mx-auto">
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
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <h4 className="font-bold text-gray-900 mb-2">{t(`landing.investment.${key}.title`)}</h4>
              <p className="text-sm text-gray-500">{t(`landing.investment.${key}.desc`)}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Roadmap */}
        <motion.div
          className="mb-16"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        >
          <motion.h3 variants={fadeUp} custom={0} className="text-2xl font-bold text-gray-900 text-center mb-8">
            {t('landing.investment.roadmapTitle')}
          </motion.h3>
          <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roadmap.map((phase) => {
              const progressColor = phase.progress === 100
                ? 'bg-emerald-500'
                : phase.progress > 0
                  ? 'bg-amber-500'
                  : 'bg-gray-300';

              return (
                <div key={phase.key} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    {phase.progress === 100 ? (
                      <span className="text-xs font-bold text-emerald-500 shrink-0">100%</span>
                    ) : phase.progress > 0 ? (
                      <span className="text-xs font-bold text-amber-500 shrink-0">{phase.progress}%</span>
                    ) : (
                      <Circle size={18} className="text-gray-400 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-gray-400 uppercase">{t(`landing.investment.${phase.key}.phase`)}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">{t(`landing.investment.${phase.key}.title`)}</h4>
                  <p className="text-xs text-gray-500 mb-4 min-h-[2.5rem]">{t(`landing.investment.${phase.key}.desc`)}</p>
                  <div className="space-y-1">
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${progressColor}`}
                        style={{ width: `${phase.progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 text-right">
                      {phase.progress === 100 ? 'Done' : phase.progress === 0 ? 'Planned' : `${phase.progress}%`}
                    </p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="text-center"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          <motion.div variants={fadeUp} custom={0} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800 text-base px-8 py-6">
                  <Calendar size={20} className="mr-2" />
                  {t('landing.investment.cta1')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4" side="top">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Contact Marcello Rachlyn</p>
                  <a
                    href="mailto:marcello@lifespan.com.br"
                    className="flex items-center gap-3 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Mail size={16} className="shrink-0" />
                    marcello@lifespan.com.br
                  </a>
                  <a
                    href="https://wa.me/5511972059371"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Phone size={16} className="shrink-0" />
                    +55 11 97205-9371
                  </a>
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 text-base px-8 py-6">
                  <FileText size={20} className="mr-2" />
                  {t('landing.investment.cta2')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4" side="top">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Contact Marcello Rachlyn</p>
                  <a
                    href="mailto:marcello@lifespan.com.br?subject=Pitch%20Deck%20Request%20-%20NutraTherapy%20Pet"
                    className="flex items-center gap-3 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Mail size={16} className="shrink-0" />
                    marcello@lifespan.com.br
                  </a>
                  <a
                    href="https://wa.me/5511972059371"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Phone size={16} className="shrink-0" />
                    +55 11 97205-9371
                  </a>
                </div>
              </PopoverContent>
            </Popover>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default InvestmentSection;
