import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingDown, Search, ArrowLeftRight, Users } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0, 0, 0.2, 1] as const }
  })
};

const metrics = [
  { key: 'fewer', icon: TrendingDown, value: '20-30%' },
  { key: 'detection', icon: Search, value: '~' },
  { key: 'translational', icon: ArrowLeftRight, value: '→' },
  { key: 'personalized', icon: Users, value: '1.4M' },
];

const breeds = ['golden', 'cavalier', 'beagle'];

const OutcomesSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section id="outcomes" className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}
        >
          <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold tracking-widest uppercase text-gray-500 mb-4">
            {t('landing.outcomes.badge')}
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold text-gray-900 mb-4">
            {t('landing.outcomes.title')}
          </motion.h2>
        </motion.div>

        {/* Metrics */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        >
          {metrics.map((m, i) => (
            <motion.div
              key={m.key}
              variants={fadeUp}
              custom={i}
              className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100"
            >
              <m.icon size={28} className="mx-auto text-gray-700 mb-3" />
              <div className="text-2xl font-black text-gray-900 mb-1">{m.value}</div>
              <p className="text-sm text-gray-600">{t(`landing.outcomes.metrics.${m.key}`)}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Breed-specific use cases */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        >
          <motion.h3 variants={fadeUp} custom={0} className="text-2xl font-bold text-center text-gray-900 mb-8">
            {t('landing.outcomes.breedTitle')}
          </motion.h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {breeds.map((breed, i) => (
              <motion.div
                key={breed}
                variants={fadeUp}
                custom={i + 1}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  {t(`landing.outcomes.breeds.${breed}.name`)}
                </h4>
                <p className="text-sm text-red-600 font-medium mb-2">
                  {t(`landing.outcomes.breeds.${breed}.risk`)}
                </p>
                <p className="text-sm text-gray-500">
                  {t(`landing.outcomes.breeds.${breed}.approach`)}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default OutcomesSection;
