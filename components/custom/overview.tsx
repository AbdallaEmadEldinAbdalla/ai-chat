import { motion } from "framer-motion";
import Link from "next/link";

import { LogoOpenAI, MessageIcon, VercelIcon } from "./icons";

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-[700px] mt-20 mx-4 md:mx-0"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="border rounded-lg p-6 flex flex-col gap-4 text-zinc-500 text-sm dark:text-zinc-400 dark:border-zinc-700">
        {/* <p className="flex flex-row justify-center gap-4 items-center text-zinc-900 dark:text-zinc-50">
          <VercelIcon />
          <span>+</span>
          <MessageIcon />
        </p> */}
        <p>
          Le <strong>chatbot immobilier</strong> est une solution innovante pour faciliter la recherche et la gestion de biens immobiliers en France. Ce service est disponible 24h/24 et 7j/7 pour répondre à vos questions, vous guider dans vos démarches, et vous proposer des biens correspondant à vos critères.
        </p>

        <p><strong>Fonctionnalités principales :</strong></p>
        <ul>
          <li><strong>Recherche de biens immobiliers</strong> : Le chatbot peut vous aider à trouver des appartements, maisons ou bureaux en fonction de votre localisation et de votre budget.</li>
          <li><strong>Informations sur le marché</strong> : Il fournit des données actualisées sur le marché immobilier en France, telles que les prix moyens dans différentes régions.</li>
          <li><strong>Conseils personnalisés</strong> : Le chatbot offre des conseils sur les démarches administratives, les prêts immobiliers, et les aspects juridiques de l&lsquo;achat ou de la location en France.</li>
          <li><strong>Prise de rendez-vous</strong> : Il peut organiser des visites avec des agents immobiliers ou des vendeurs en fonction de vos disponibilités.</li>
        </ul>

        <p>
          Grâce à l’intelligence artificielle, ce <strong>chatbot intelligent</strong> améliore votre expérience utilisateur en vous proposant des recommandations personnalisées et un accompagnement tout au long de votre projet immobilier.
        </p>
      </div>
    </motion.div>
  );
};
