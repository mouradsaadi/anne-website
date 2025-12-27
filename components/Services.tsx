import React from 'react';
import { Users, User, HeartHandshake, Phone, BookOpen, Sparkles } from 'lucide-react';
import { ServiceItem } from '../types';

const services: ServiceItem[] = [
  {
    title: "Thérapie de couple",
    description: "Réparer le dialogue, prévenir la rupture, gérer les crises ou préparer un projet commun.",
    duration: "60 min",
    price: "50€"
  },
  {
    title: "Thérapie familiale",
    description: "Aligner parents et enfants, clarifier les rôles, apaiser les tensions intergénérationnelles.",
    duration: "60 min",
    price: "50€"
  },
  {
    title: "Accompagnement individuelle",
    description: "Accompagnement individuel centré sur le lien : couple, famille, communication et restauration des relations.",
    duration: "50 min",
    price: "50€"
  },
  {
    title: "Consultations à distance",
    description: "Entretiens téléphoniques ou visio pour avancer où que vous soyez.",
    duration: "40-60 min",
    price: "45€"
  },
  {
    title: "Ateliers & parcours",
    description: "Groupes de parole, ateliers émotions, parentalité, affectivité & sexualité, estime de soi.",
    duration: "Format modulable",
    price: "Programme dédié"
  },
  {
    title: "Interventions scolaires",
    description: "Sensibilisation, éducation affective et sexuelle, prévention en milieu scolaire ou associatif.",
    duration: "Demi-journée / journée",
    price: "Sur projet"
  }
];

const Services: React.FC = () => {
  return (
    <div className="py-16 bg-stone-50 dark:bg-stone-950 transition-colors duration-200" id="services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h2 className="text-base text-sage-600 dark:text-sage-400 font-semibold tracking-wide uppercase">Services et prestations</h2>
          <p className="mt-2 text-3xl leading-8 font-serif font-extrabold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
            Pour les couples, familles et individus
          </p>
          <p className="mt-4 max-w-3xl text-xl text-stone-500 dark:text-stone-400 mx-auto">
            Interventions en cabinet, à distance, en milieu scolaire ou associatif. Du lundi au vendredi, 9h - 19h.
          </p>
        </div>

        <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
            {services.map((service, index) => (
              <div key={service.title} className="relative bg-white dark:bg-stone-800 p-8 rounded-xl shadow-sm hover:shadow-lg transition-all border border-stone-100 dark:border-stone-700 group">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-sage-500 group-hover:bg-sage-600 text-white transition-colors">
                    {index === 0 ? <HeartHandshake className="h-6 w-6" /> : index === 1 ? <Users className="h-6 w-6" /> : index === 2 ? <User className="h-6 w-6" /> : index === 3 ? <Phone className="h-6 w-6" /> : index === 4 ? <Sparkles className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
                  </div>
                  <p className="ml-16 text-xl leading-6 font-medium text-stone-900 dark:text-stone-100 font-serif">{service.title}</p>
                </dt>
                <dd className="mt-4 ml-16 text-base text-stone-500 dark:text-stone-400 min-h-[80px]">
                  {service.description}
                </dd>
                <div className="mt-6 ml-16 flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-700">
                   <div className="text-sm font-semibold text-stone-400 dark:text-stone-500 flex items-center">
                      {service.duration}
                   </div>
                   <div className="text-lg font-bold text-sage-700 dark:text-sage-300">
                      {service.price}
                   </div>
                </div>
              </div>
            ))}
        </dl>
      </div>
    </div>
  );
};

export default Services;
