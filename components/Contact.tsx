import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const Contact: React.FC = () => {
  return (
    <div className="bg-white dark:bg-stone-900 py-12 transition-colors duration-200 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">Contact</h1>
          <p className="mt-3 text-stone-500 dark:text-stone-400">
            Pour toute demande, contactez Anne Robin directement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-stone-50 dark:bg-stone-950 p-6 rounded-xl border border-stone-100 dark:border-stone-800 shadow-sm text-center">
            <Mail className="h-6 w-6 text-sage-500 mx-auto mb-3" />
            <p className="text-sm text-stone-500 dark:text-stone-400">Email</p>
            <a href="mailto:annerobinccf@outlook.fr" className="mt-2 block font-medium text-stone-900 dark:text-stone-100">
              annerobinccf@outlook.fr
            </a>
          </div>
          <div className="bg-stone-50 dark:bg-stone-950 p-6 rounded-xl border border-stone-100 dark:border-stone-800 shadow-sm text-center">
            <Phone className="h-6 w-6 text-sage-500 mx-auto mb-3" />
            <p className="text-sm text-stone-500 dark:text-stone-400">Téléphone</p>
            <a href="tel:+33613375658" className="mt-2 block font-medium text-stone-900 dark:text-stone-100">
              06 13 37 56 58
            </a>
          </div>
          <div className="bg-stone-50 dark:bg-stone-950 p-6 rounded-xl border border-stone-100 dark:border-stone-800 shadow-sm text-center">
            <MapPin className="h-6 w-6 text-sage-500 mx-auto mb-3" />
            <p className="text-sm text-stone-500 dark:text-stone-400">Adresse</p>
            <p className="mt-2 font-medium text-stone-900 dark:text-stone-100">
              109 ter, Rue Pierre Loti<br />17300 Rochefort
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
