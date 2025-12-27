import React from 'react';

interface HeroProps {
  onBookNow: () => void;
}

const Hero: React.FC<HeroProps> = ({ onBookNow }) => {
  const assetBaseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  return (
    <div className="relative bg-sage-50 dark:bg-stone-900 overflow-hidden transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20 md:py-24 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl tracking-tight font-serif font-extrabold text-stone-900 dark:text-stone-100 sm:text-5xl md:text-6xl">
              <span className="block">Accompagnement conjugal,</span>
              <span className="block text-sage-600 dark:text-sage-400">familial et individuel.</span>
            </h1>
            <p className="mt-4 text-base text-stone-500 dark:text-stone-400 sm:mt-6 sm:text-lg md:text-xl">
              Guidance sur-mesure pour couples, parents, familles et jeunes : restaurer le dialogue, apaiser les crises, prévenir les ruptures et avancer avec sérénité.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center lg:justify-start gap-3">
              <a
                href="#/contact"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-white bg-sage-600 hover:bg-sage-700 dark:bg-sage-700 dark:hover:bg-sage-600 transition-colors"
              >
                Me contacter
              </a>
              <a
                href="#/about"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-sage-700 bg-sage-100 hover:bg-sage-200 dark:text-sage-300 dark:bg-stone-800 dark:hover:bg-stone-700 transition-colors"
              >
                À propos de moi
              </a>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <img
              src={`${assetBaseUrl}assets/images/photo_anne.jpeg`}
              alt="Anne Robin"
              className="w-full max-w-xs sm:max-w-sm lg:max-w-md rounded-2xl object-cover shadow-lg border border-stone-200/60 dark:border-stone-700/60"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
