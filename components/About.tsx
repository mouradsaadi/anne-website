import React from 'react';
import { Award, BookOpen, Heart } from 'lucide-react';

const About: React.FC = () => {
  const assetBaseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  return (
    <div className="bg-white dark:bg-stone-900 py-12 transition-colors duration-200" id="about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          {/* Image Section */}
          <div className="relative mb-10 lg:mb-0">
            <div className="aspect-w-3 aspect-h-4 rounded-xl overflow-hidden shadow-lg">
               <img 
                className="object-cover w-full h-full"
                src={`${assetBaseUrl}assets/images/therapy-about.png`} 
                alt="Illustration thérapeute" 
               />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-sage-100 dark:bg-stone-800 p-6 rounded-xl shadow-sm hidden md:block transition-colors duration-200">
               <p className="font-serif text-xl text-sage-800 dark:text-sage-200 font-bold">"Écouter pour comprendre,<br/>pas pour répondre."</p>
            </div>
          </div>

          {/* Content Section */}
          <div>
            <h2 className="text-base text-sage-600 dark:text-sage-400 font-semibold tracking-wide uppercase">À Propos de Moi</h2>
            <p className="mt-2 text-3xl leading-8 font-serif font-extrabold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
              Anne Robin
            </p>
            <p className="text-sm font-semibold text-sage-600 dark:text-sage-400 uppercase tracking-wide mt-1">Conseillère Conjugale et Familiale</p>
            <p className="mt-4 text-lg text-stone-500 dark:text-stone-400">
              J’accompagne couples, parents, familles et individus pour retrouver confiance, apaiser les tensions et réinventer la communication, en cabinet ou à distance.
            </p>
            <p className="mt-4 text-base text-stone-500 dark:text-stone-400">
              Mon approche est intégrative : écoute active, outils de thérapie comportementale et ateliers thématiques (estime de soi, émotions, parentalité, affectivité et sexualité) adaptés aux adultes comme aux adolescents.
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <Award className="h-6 w-6 text-sage-500 dark:text-sage-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-stone-900 dark:text-stone-200">Certifiée</h3>
                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Conseillère conjugale et familiale</p>
                    </div>
                </div>
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <Heart className="h-6 w-6 text-sage-500 dark:text-sage-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-stone-900 dark:text-stone-200">Passionnée</h3>
                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Dialogue, médiation et prévention des crises</p>
                    </div>
                </div>
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <BookOpen className="h-6 w-6 text-sage-500 dark:text-sage-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-stone-900 dark:text-stone-200">Formatrice</h3>
                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Interventions en écoles, associations et entreprises</p>
            </div>
                </div>
            </div>

            <div className="mt-8 p-4 bg-sand-50 dark:bg-stone-800 rounded-lg border border-stone-100 dark:border-stone-700">
              <p className="text-sm font-semibold text-sage-600 dark:text-sage-400 uppercase tracking-wide mb-2">Clientèle & publics</p>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                Enfants, adolescents, étudiants, adultes et couples (en solo ou duo), parents et éducateurs, établissements scolaires, associations et structures accueillant des familles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
