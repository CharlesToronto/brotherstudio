import { Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import styles from "./LandingFaq.module.css";

export function LandingFaq({ locale }: { locale: Locale }) {
  const isFrench = locale === "fr";
  const questions = isFrench ? [
    { question: "L’estimation est-elle gratuite ?", answer: "Oui. Vous pouvez demander une estimation gratuite de votre bien en remplissant le formulaire de cette page. Cette demande constitue une première prise de contact pour discuter de votre bien et de votre projet de vente." },
    { question: "Comment êtes-vous rémunérés ?", answer: "Nous sommes rémunérés à la commission, uniquement si la vente de votre bien est réalisée. Pas de vente, pas de rémunération." },
    { question: "Comment estimez-vous la valeur de mon bien ?", answer: "Nous nous appuyons sur notre expérience du marché immobilier et sur les logiciels de statistiques immobilières suisses que nous utilisons. Nous comparons également votre bien à des biens similaires dans les environs pour évaluer son positionnement sur le marché local. La visite nous permet ensuite d’affiner l’estimation en tenant compte de son état, de ses caractéristiques et de ses atouts." },
    { question: "Une visite est-elle nécessaire ?", answer: "Nous pouvons préparer une pré-estimation à partir des informations que vous nous transmettez. Une visite permet ensuite de vérifier les caractéristiques du bien et d’affiner l’estimation. La pré-estimation ne remplace donc pas cette évaluation sur place." },
    { question: "Quels types de biens puis-je faire estimer ?", answer: "Le formulaire vous permet de présenter un appartement, une maison ou une villa, un immeuble, un terrain, un local commercial ou un raccard. Pour un autre type de bien, sélectionnez « Autre » : nous échangerons avec vous sur votre demande." },
    { question: "Que se passe-t-il après ma demande ?", answer: "Nous vous recontactons pour échanger sur votre bien, préciser votre projet et préparer votre estimation. Vous pouvez également choisir directement un créneau dans l’agenda situé en bas de cette page pour un premier rendez-vous en vidéo." },
  ] : [
    { question: "Is the property valuation free?", answer: "Yes. You can request a free valuation by completing the form on this page. This is an initial enquiry to discuss your property and your plans to sell." },
    { question: "How are you paid?", answer: "We are paid on commission, only if your property is sold. No sale, no fee." },
    { question: "How do you estimate my property’s value?", answer: "We draw on our experience of the property market and the Swiss real estate statistics software we use. We also compare your property with similar properties nearby to assess its position in the local market. A visit then helps us refine the valuation based on its condition, features and strengths." },
    { question: "Is a property visit necessary?", answer: "We can prepare a preliminary valuation using the information you provide. A visit then helps us verify the property’s characteristics and refine the estimate. The preliminary valuation does not replace an assessment on site." },
    { question: "What types of property can I submit?", answer: "The form accepts apartments, houses or villas, buildings, land, commercial properties and traditional granaries. For another property type, select “Other” and we will discuss your enquiry with you." },
    { question: "What happens after I submit my request?", answer: "We contact you to discuss your property, clarify your plans and prepare your valuation. You can also choose a time in the calendar at the bottom of this page for an initial video meeting." },
  ];

  return (
    <section id="faq" className={styles.section} aria-labelledby="landing-faq-title">
      <div className={styles.heading}>
        <p>{isFrench ? "Questions fréquentes" : "Frequently asked questions"}</p>
        <h2 id="landing-faq-title">{isFrench ? "Avant de vous lancer." : "Before you get started."}</h2>
      </div>
      <div className={styles.list}>
        {questions.map(({ question, answer }) => (
          <details key={question} className={styles.item}>
            <summary><span>{question}</span><Plus size={20} strokeWidth={1.5} aria-hidden="true" /></summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

