import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ExternalLink, Heart, PawPrint, FlaskConical, Rocket } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0, 0, 0.2, 1] as const }
  })
};

const MarketSection: React.FC = () => {
  const { t } = useTranslation();

  const winCards = [
    { icon: Heart, titleKey: 'landing.market.winPetloveTitle', descKey: 'landing.market.winPetlove' },
    { icon: PawPrint, titleKey: 'landing.market.winTutorsTitle', descKey: 'landing.market.winTutors' },
    { icon: FlaskConical, titleKey: 'landing.market.winScienceTitle', descKey: 'landing.market.winScience' },
    { icon: Rocket, titleKey: 'landing.market.winPlatformTitle', descKey: 'landing.market.winPlatform' },
  ];

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
          {/* Concentric circles TAM/SAM/SOM — redesigned */}
          <motion.div variants={fadeUp} custom={0} className="flex-1 flex items-center justify-center">
            <div className="relative" style={{ width: 380, height: 380 }}>
              {/* TAM — outer ring */}
              <div
                className="absolute inset-0 rounded-full flex flex-col items-center justify-start pt-7"
                style={{
                  background: 'radial-gradient(circle, transparent 55%, #f3f4f6 56%)',
                  border: '2px solid #e5e7eb',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                }}
              >
                <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">TAM</span>
                <span className="text-3xl font-black text-gray-900 leading-tight">85M</span>
                <span className="text-[11px] text-gray-500 max-w-[120px] text-center leading-tight">{t('landing.market.tam')}</span>
              </div>

              {/* SAM — middle ring */}
              <div
                className="absolute rounded-full flex flex-col items-center justify-start pt-5"
                style={{
                  top: 65, left: 65, right: 65, bottom: 65,
                  background: 'radial-gradient(circle, transparent 50%, #e5e7eb 51%)',
                  border: '2px solid #d1d5db',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
                }}
              >
                <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">SAM</span>
                <span className="text-2xl font-black text-gray-800 leading-tight">28M</span>
                <span className="text-[10px] text-gray-500 max-w-[100px] text-center leading-tight">{t('landing.market.sam')}</span>
              </div>

              {/* SOM — center circle */}
              <div
                className="absolute rounded-full flex flex-col items-center justify-center"
                style={{
                  top: 130, left: 130, right: 130, bottom: 130,
                  background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                  border: '2px solid #374151',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}
              >
                <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">SOM</span>
                <span className="text-xl font-black text-white leading-tight">5.6M</span>
                <span className="text-[9px] text-gray-400 max-w-[80px] text-center leading-tight">{t('landing.market.som')}</span>
              </div>
            </div>
          </motion.div>

          {/* Side metrics */}
          <motion.div variants={fadeUp} custom={1} className="flex-1 space-y-4">
            {[
              { value: '3rd', label: t('landing.market.metric1') },
              { value: '14%+', label: t('landing.market.metric2') },
              { value: 'US$12B', label: t('landing.market.metric3') },
              { value: '33%', label: t('landing.market.metric4') },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="text-2xl font-black text-gray-900 min-w-[80px]">{m.value}</div>
                <p className="text-sm text-gray-600">{m.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* B2C — Already in Market */}
        <motion.div
          className="mt-20"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
        >
          <motion.div variants={fadeUp} custom={0} className="text-center mb-8">
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold tracking-wide uppercase border border-emerald-200">
              {t('landing.market.b2cTitle')}
            </span>
          </motion.div>
          <motion.div
            variants={fadeUp}
            custom={1}
            className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 p-8 shadow-sm flex flex-col md:flex-row items-center gap-6"
          >
            <div className="flex-1">
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                {t('landing.market.b2cDesc')}
              </p>
              <a
                href="https://www.petmoretime.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors"
              >
                {t('landing.market.b2cLink')}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center border border-emerald-200">
              <PawPrint className="w-8 h-8 text-emerald-600" />
            </div>
          </motion.div>
        </motion.div>

        {/* Business Model — Win-Win */}
        <motion.div
          className="mt-20"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
        >
          <motion.div variants={fadeUp} custom={0} className="text-center mb-4">
            <h3 className="text-2xl font-bold text-gray-900">{t('landing.market.monetizationTitle')}</h3>
          </motion.div>
          <motion.p variants={fadeUp} custom={1} className="text-center text-sm text-gray-500 max-w-2xl mx-auto mb-10">
            {t('landing.market.monetizationDesc')}
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {winCards.map((card, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i + 2}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex gap-4"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <card.icon className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">{t(card.titleKey)}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{t(card.descKey)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MarketSection;
