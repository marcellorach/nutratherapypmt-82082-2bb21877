import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const sections = ['vision', 'opportunity', 'technology', 'outcomes', 'market', 'invest'];

const LandingSectionNav: React.FC = () => {
  const { t } = useTranslation();
  const [active, setActive] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show nav after scrolling past hero area
      setVisible(window.scrollY > 600);

      // Determine active section
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActive(id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm animate-fade-in">
      <div className="max-w-6xl mx-auto px-4">
        <nav className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-none">
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => scrollTo(s)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                active === s
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {t(`landing.nav.${s}`)}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default LandingSectionNav;
