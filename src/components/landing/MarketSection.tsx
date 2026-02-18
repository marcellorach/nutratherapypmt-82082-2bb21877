import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0, 0, 0.2, 1] as const }
  })
};

const MarketSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section id="market" className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}
        >
          <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold tracking-widest uppercase text-gray-500 mb-4">
            {t('landing.market.badge')}
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold text-gray-900 mb-4">
            {t('landing.market.title')}
          </motion.h2>
        </motion.div>

        <motion.div
          className="flex flex-col md:flex-row items-center gap-12"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        >
          {/* Concentric circles TAM/SAM/SOM */}
          <motion.div variants={fadeUp} custom={0} className="flex-1 flex items-center justify-center">
            <div className="relative w-80 h-80">
              {/* TAM */}
              <div className="absolute inset-0 rounded-full bg-gray-100 border-2 border-gray-200 flex items-start justify-center pt-6">
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-500">TAM</div>
                  <div className="text-2xl font-black text-gray-900">85M</div>
                  <div className="text-xs text-gray-500">{t('landing.market.tam')}</div>
                </div>
              </div>
              {/* SAM */}
              <div className="absolute top-12 left-12 right-12 bottom-12 rounded-full bg-gray-200 border-2 border-gray-300 flex items-start justify-center pt-6">
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-500">SAM</div>
                  <div className="text-xl font-black text-gray-900">28M</div>
                  <div className="text-xs text-gray-500">{t('landing.market.sam')}</div>
                </div>
              </div>
              {/* SOM */}
              <div className="absolute top-24 left-24 right-24 bottom-24 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-400">SOM</div>
                  <div className="text-xl font-black text-white">5.6M</div>
                  <div className="text-xs text-gray-400">{t('landing.market.som')}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Side metrics */}
          <motion.div variants={fadeUp} custom={1} className="flex-1 space-y-6">
            {[
              { value: '3rd', label: t('landing.market.metric1') },
              { value: '14%+', label: t('landing.market.metric2') },
              { value: 'US$12B', label: t('landing.market.metric3') },
              { value: '33%', label: t('landing.market.metric4') },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-2xl font-black text-gray-900 min-w-[80px]">{m.value}</div>
                <p className="text-sm text-gray-600">{m.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default MarketSection;
