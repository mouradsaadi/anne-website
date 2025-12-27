
import React from 'react';

const Legal: React.FC = () => {
  return (
    <div className="bg-white dark:bg-stone-900 py-12 transition-colors duration-200 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
            <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">Mentions Légales & Politique de Confidentialité</h1>
          <p className="mt-4 text-stone-500 dark:text-stone-400">
            Conformément aux dispositions des Articles 6-III et 19 de la Loi n°2004-575 du 21 juin 2004 pour la Confiance dans l’économie numérique, dite L.C.E.N.
          </p>
        </div>

        <div className="space-y-12 text-stone-700 dark:text-stone-300">
          
          {/* 1. ÉDITEUR DU SITE */}
          <section>
            <h2 className="text-xl font-bold text-sage-600 dark:text-sage-400 mb-4 border-b border-stone-200 dark:border-stone-700 pb-2">1. Éditeur du site</h2>
            <div className="bg-stone-50 dark:bg-stone-800 p-6 rounded-lg">
              <p><strong>Propriétaire :</strong> Anne Robin</p>
              <p><strong>Statut :</strong> Conseillère Conjugale et Familiale</p>
              <p><strong>SIRET :</strong> 447924382</p>
              <p><strong>Adresse :</strong> 109 ter, Rue Pierre Loti, 17300 Rochefort</p>
              <p><strong>Téléphone :</strong> 06 13 37 56 58</p>
              <p><strong>Email :</strong> annerobinccf@outlook.fr</p>
              <p><strong>Directeur de la publication :</strong> Anne Robin</p>
            </div>
          </section>

          {/* 2. HÉBERGEMENT */}
          <section>
            <h2 className="text-xl font-bold text-sage-600 dark:text-sage-400 mb-4 border-b border-stone-200 dark:border-stone-700 pb-2">2. Hébergement</h2>
            <p className="mb-2">Le site est hébergé par :</p>
            <div className="bg-stone-50 dark:bg-stone-800 p-6 rounded-lg">
              <p><strong>Nom de l'hébergeur :</strong> OVHcloud</p>
              <p><strong>Adresse :</strong> 2 rue Kellermann, 59100 Roubaix, France</p>
              <p><strong>Site web :</strong> https://www.ovhcloud.com</p>
            </div>
          </section>

          {/* 3. RGPD & DONNÉES PERSONNELLES */}
          <section>
            <h2 className="text-xl font-bold text-sage-600 dark:text-sage-400 mb-4 border-b border-stone-200 dark:border-stone-700 pb-2">3. Politique de Confidentialité (RGPD)</h2>
            <div className="space-y-4">
              <p>
                Dans le cadre de son activité, Anne Robin est amenée à collecter et traiter des informations dont certaines sont qualifiées de "données personnelles". Elle attache une grande importance au respect de la vie privée, et n’utilise que des données de manière responsable et confidentielle et dans une finalité précise.
              </p>
              
              <h3 className="font-bold text-stone-900 dark:text-stone-100 mt-4">Données collectées :</h3>
              <p>
                Sur le formulaire de prise de rendez-vous, nous collectons : Nom, Prénom, Email, Numéro de téléphone, et les notes éventuelles laissées par le patient.
              </p>

              <h3 className="font-bold text-stone-900 dark:text-stone-100 mt-4">Finalité des données :</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Gestion des rendez-vous et de l'agenda.</li>
                <li>Communication avec le patient (confirmation, rappel, annulation).</li>
                <li>Facturation et comptabilité.</li>
              </ul>
              <p className="text-sm italic mt-2">Ces données ne sont jamais vendues ni cédées à des tiers à des fins commerciales.</p>

              <h3 className="font-bold text-stone-900 dark:text-stone-100 mt-4">Conservation :</h3>
              <p>
                Les données sont conservées pendant la durée nécessaire au suivi thérapeutique et aux obligations légales (comptabilité), puis archivées ou supprimées de manière sécurisée.
              </p>

              <h3 className="font-bold text-stone-900 dark:text-stone-100 mt-4">Vos droits :</h3>
              <p>
                Vous disposez d'un droit d'accès, de rectification, d'effacement ou de portabilité de vos données. Vous pouvez exercer ce droit en nous contactant à : <strong>annerobinccf@outlook.fr</strong>.
              </p>
            </div>
          </section>

          {/* 4. PROPRIÉTÉ INTELLECTUELLE */}
          <section>
            <h2 className="text-xl font-bold text-sage-600 dark:text-sage-400 mb-4 border-b border-stone-200 dark:border-stone-700 pb-2">4. Propriété Intellectuelle</h2>
            <p>
              L’ensemble de ce site relève de la législation française et internationale sur le droit d’auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Legal;
