"use client";

import { useEffect, useState } from "react";

import type { Locale } from "@/lib/i18n";

const TEAM_STORAGE_KEY = "brotherstudio-team-workspace-v1";
const CLIENT_STATUSES = [
  "new",
  "attempting",
  "follow_up",
  "qualified",
  "proposal",
  "closed",
] as const;

type TeamClientStatus = (typeof CLIENT_STATUSES)[number];

type TeamTodoItem = {
  id: string;
  text: string;
  done: boolean;
};

type TeamClient = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  project: string;
  status: TeamClientStatus;
  lastCall: string;
  nextFollowUp: string;
  notes: string;
};

type TeamStoragePayload = {
  quickNote: string;
  todos: TeamTodoItem[];
  clients: TeamClient[];
};

type TeamGuidedScriptOutcome = {
  text: string;
  nextStepId?: string;
};

type TeamGuidedScriptDecisionStep = {
  id: string;
  title: string;
  kind: "decision";
  intro: string;
  question: string;
  yesLabel: string;
  noLabel: string;
  yesOutcome: TeamGuidedScriptOutcome;
  noOutcome: TeamGuidedScriptOutcome;
};

type TeamGuidedScriptClosingStep = {
  id: string;
  title: string;
  kind: "closing";
  intro: string;
};

type TeamGuidedScriptStep = TeamGuidedScriptDecisionStep | TeamGuidedScriptClosingStep;

type TeamCopy = {
  callTitle: string;
  callIntro: string;
  callNewClientLabel: string;
  callCloseClientFormLabel: string;
  callClientsLabel: string;
  callClientInfoTitle: string;
  callEmptyClientSelection: string;
  callNoteTitle: string;
  callNoteIntro: string;
  notesTitle: string;
  notesIntro: string;
  quickNotesLabel: string;
  quickNotesPlaceholder: string;
  todoLabel: string;
  todoPlaceholder: string;
  addTodoLabel: string;
  emptyTodos: string;
  clientsTitle: string;
  clientsIntro: string;
  addClientTitle: string;
  addClientLabel: string;
  emptyClients: string;
  removeLabel: string;
  unnamedClient: string;
  labels: {
    name: string;
    company: string;
    phone: string;
    email: string;
    project: string;
    status: string;
    lastCall: string;
    nextFollowUp: string;
    notes: string;
  };
  statusLabels: Record<TeamClientStatus, string>;
  guidedScript: TeamGuidedScriptStep[];
};

const copyByLocale = {
  fr: {
    callTitle: "Call",
    callIntro:
      "Choisissez un client, ouvrez sa fiche, puis gardez le script et les notes d'appel sous les yeux pendant la conversation.",
    callNewClientLabel: "Nouveau client",
    callCloseClientFormLabel: "Fermer",
    callClientsLabel: "Clients",
    callClientInfoTitle: "Informations client",
    callEmptyClientSelection:
      "Selectionnez un client pour afficher ses informations et ses notes d'appel.",
    callNoteTitle: "Note",
    callNoteIntro:
      "Mettez a jour le statut, les dates et les notes du client pendant l'appel.",
    notesTitle: "Notes & To-do",
    notesIntro:
      "Gardez un bloc-note rapide et une liste d'actions a faire entre les appels.",
    quickNotesLabel: "Notes rapides",
    quickNotesPlaceholder:
      "Ex: client interesse par 4 rendus exterieurs, envoyer exemples apres l'appel.",
    todoLabel: "Nouvelle tache",
    todoPlaceholder: "Ex: rappeler Marc mardi a 14h",
    addTodoLabel: "Ajouter",
    emptyTodos: "Aucune tache pour l'instant.",
    clientsTitle: "Clients & Follow-up",
    clientsIntro:
      "Ajoutez les prospects, modifiez leurs infos, puis gardez les dates et notes de suivi a jour.",
    addClientTitle: "Ajouter un client",
    addClientLabel: "Ajouter le client",
    emptyClients: "Aucun client ajoute pour l'instant.",
    removeLabel: "Supprimer",
    unnamedClient: "Client sans nom",
    labels: {
      name: "Nom",
      company: "Entreprise",
      phone: "Telephone",
      email: "Courriel",
      project: "Projet",
      status: "Statut",
      lastCall: "Dernier appel",
      nextFollowUp: "Prochain suivi",
      notes: "Notes d'appel / prochaines actions",
    },
    statusLabels: {
      new: "Nouveau",
      attempting: "Tentative",
      follow_up: "Follow-up",
      qualified: "Qualifie",
      proposal: "Proposition",
      closed: "Clos",
    },
    guidedScript: [
      {
        id: "script_1",
        title: "Script 1",
        kind: "decision",
        intro:
          "Bonjour, ici Muriella de BrotherStudio. On aide les architectes et developpeurs a mieux presenter et vendre leurs projets grace a des visualisations haut de gamme.",
        question:
          "Est-ce que le manager ou l'architecte principal est disponible ?",
        yesLabel: "Oui",
        noLabel: "Non",
        yesOutcome: {
          text: "Parfait, je vais aller droit au but avec la bonne personne.",
          nextStepId: "script_2",
        },
        noOutcome: {
          text:
            "Pas de probleme. Je vais simplement essayer de recuperer la meilleure facon de reprendre contact.",
          nextStepId: "script_3",
        },
      },
      {
        id: "script_2",
        title: "Script 2",
        kind: "decision",
        intro:
          "Bonjour [Nom], ici [Votre prenom] de BrotherStudio. Je vous appelle rapidement pour voir si vous avez un projet ou des visuels pourraient aider.",
        question: "Avez-vous 30 secondes maintenant ?",
        yesLabel: "Oui",
        noLabel: "Non",
        yesOutcome: {
          text: "Parfait, je vais faire tres court.",
          nextStepId: "script_4",
        },
        noOutcome: {
          text:
            "Pas de probleme. Je vais d'abord voir si un bref rappel ou un email serait plus utile.",
          nextStepId: "script_5",
        },
      },
      {
        id: "script_3",
        title: "Script 3",
        kind: "decision",
        intro:
          "Je comprends. Je veux simplement faire parvenir quelque chose de pertinent a la bonne personne.",
        question: "Pouvez-vous partager un email direct ou une extension ?",
        yesLabel: "Oui",
        noLabel: "Non",
        yesOutcome: {
          text:
            "Parfait, je vais envoyer quelque chose de tres cible avant de reprendre contact.",
          nextStepId: "script_6",
        },
        noOutcome: {
          text:
            "D'accord. Je vais essayer de laisser un message simple et utile.",
          nextStepId: "script_7",
        },
      },
      {
        id: "script_4",
        title: "Script 4",
        kind: "decision",
        intro:
          "J'aimerais simplement comprendre si un besoin existe maintenant ou dans les prochaines semaines.",
        question:
          "Avez-vous un projet actif ou a venir qui pourrait avoir besoin de visuels ?",
        yesLabel: "Oui",
        noLabel: "Non",
        yesOutcome: {
          text:
            "Tres bien. Je vais voir si vous etes deja pret a partager quelque chose.",
          nextStepId: "script_8",
        },
        noOutcome: {
          text:
            "Aucun souci. Je vais verifier si des exemples pourraient quand meme vous etre utiles pour plus tard.",
          nextStepId: "script_9",
        },
      },
      {
        id: "script_5",
        title: "Script 5",
        kind: "decision",
        intro:
          "Je peux m'adapter et garder cela tres simple.",
        question:
          "Est-ce qu'un rapide rappel plus tard aujourd'hui ou demain serait plus adapte ?",
        yesLabel: "Oui",
        noLabel: "Non",
        yesOutcome: {
          text:
            "Parfait, je verrouille un rappel rapide avec un contexte clair.",
          nextStepId: "close_callback",
        },
        noOutcome: {
          text:
            "D'accord. Je vais proposer une alternative par email.",
          nextStepId: "script_6",
        },
      },
      {
        id: "script_6",
        title: "Script 6",
        kind: "decision",
        intro:
          "Je peux envoyer quelque chose de tres court et pertinent.",
        question:
          "Est-ce utile si j'envoie deux exemples cibles avant de vous recontacter ?",
        yesLabel: "Oui",
        noLabel: "Non",
        yesOutcome: {
          text: "Parfait, je vais envoyer un email bref avec les bons exemples.",
          nextStepId: "close_email",
        },
        noOutcome: {
          text:
            "Compris. Je vais simplement proposer un rappel plus tard.",
          nextStepId: "close_follow_up",
        },
      },
      {
        id: "script_7",
        title: "Script 7",
        kind: "decision",
        intro:
          "Je peux laisser un message tres simple pour que ce soit clair et utile.",
        question:
          "Pouvez-vous lui dire que nous aidons a presenter et vendre les projets avec des visualisations haut de gamme ?",
        yesLabel: "Oui",
        noLabel: "Non",
        yesOutcome: {
          text:
            "Merci, je ferai ensuite un suivi leger au bon moment.",
          nextStepId: "close_message",
        },
        noOutcome: {
          text:
            "D'accord, merci quand meme pour votre temps.",
          nextStepId: "close_polite",
        },
      },
      {
        id: "script_8",
        title: "Script 8",
        kind: "decision",
        intro:
          "Si c'est concret, la prochaine etape peut rester tres simple.",
        question:
          "Avez-vous deja des plans ou references prets a partager ?",
        yesLabel: "Oui",
        noLabel: "Non",
        yesOutcome: {
          text:
            "Parfait, je vais orienter la discussion vers le bon prochain pas.",
          nextStepId: "script_10",
        },
        noOutcome: {
          text:
            "Pas de probleme. Je peux clarifier exactement ce qu'il faudrait preparer.",
          nextStepId: "script_11",
        },
      },
      {
        id: "script_9",
        title: "Script 9",
        kind: "decision",
        intro:
          "Ce n'est pas grave si rien n'est actif aujourd'hui.",
        question:
          "Est-ce qu'un petit pack d'exemples pourrait tout de meme vous etre utile pour un futur projet ?",
        yesLabel: "Oui",
        noLabel: "Non",
        yesOutcome: {
          text:
            "Parfait, je vais envoyer quelque chose de leger et pertinent.",
          nextStepId: "close_email",
        },
        noOutcome: {
          text:
            "Compris. Je clos l'appel proprement et je reviendrai plus tard si besoin.",
          nextStepId: "close_polite",
        },
      },
      {
        id: "script_10",
        title: "Script 10",
        kind: "decision",
        intro:
          "Comme vous avez deja de la matiere, on peut facilement avancer.",
        question:
          "Est-ce utile si j'envoie des exemples ou un devis rapide ?",
        yesLabel: "Oui",
        noLabel: "Non",
        yesOutcome: {
          text:
            "Parfait, je vais envoyer cela et confirmer le bon contact.",
          nextStepId: "close_quote",
        },
        noOutcome: {
          text:
            "Dans ce cas, un second echange semble plus pertinent.",
          nextStepId: "script_12",
        },
      },
      {
        id: "script_11",
        title: "Script 11",
        kind: "decision",
        intro:
          "Je peux simplifier la suite pour que ce soit facile a lancer.",
        question:
          "Est-ce utile si j'envoie une courte checklist de ce qu'il faut pour commencer ?",
        yesLabel: "Oui",
        noLabel: "Non",
        yesOutcome: {
          text:
            "Parfait, je vous envoie un recap tres simple par email.",
          nextStepId: "close_checklist",
        },
        noOutcome: {
          text:
            "D'accord. Mieux vaut peut-etre refaire un point plus tard.",
          nextStepId: "script_12",
        },
      },
      {
        id: "script_12",
        title: "Script 12",
        kind: "decision",
        intro:
          "Pour ne pas perdre le fil, je veux simplement confirmer la bonne suite.",
        question:
          "Est-ce qu'un deuxieme appel avec le decision maker serait plus pertinent ?",
        yesLabel: "Oui",
        noLabel: "Non",
        yesOutcome: {
          text:
            "Parfait, on verrouille un prochain appel.",
          nextStepId: "close_second_call",
        },
        noOutcome: {
          text:
            "Compris, je clos ici de facon propre.",
          nextStepId: "close_polite",
        },
      },
      {
        id: "close_callback",
        title: "Fin d'appel",
        kind: "closing",
        intro:
          "Merci. Confirmez l'heure du rappel, notez-la dans l'outil, puis remerciez la personne avant de raccrocher.",
      },
      {
        id: "close_email",
        title: "Fin d'appel",
        kind: "closing",
        intro:
          "Confirmez l'email, dites que vous enverrez deux exemples tres cibles, puis terminez l'appel proprement.",
      },
      {
        id: "close_follow_up",
        title: "Fin d'appel",
        kind: "closing",
        intro:
          "Proposez un suivi leger dans quelques jours, remerciez, puis raccrochez.",
      },
      {
        id: "close_message",
        title: "Fin d'appel",
        kind: "closing",
        intro:
          "Remerciez le gatekeeper, notez qu'un message doit etre transmis, puis terminez l'appel.",
      },
      {
        id: "close_quote",
        title: "Fin d'appel",
        kind: "closing",
        intro:
          "Recuperez le bon email, promettez l'envoi d'exemples ou d'un devis rapide, puis raccrochez.",
      },
      {
        id: "close_checklist",
        title: "Fin d'appel",
        kind: "closing",
        intro:
          "Annoncez l'envoi de la checklist, confirmez le contact, puis terminez l'appel.",
      },
      {
        id: "close_second_call",
        title: "Fin d'appel",
        kind: "closing",
        intro:
          "Confirmez le prochain appel avec le decision maker, ajoutez le suivi, puis raccrochez.",
      },
      {
        id: "close_polite",
        title: "Fin d'appel",
        kind: "closing",
        intro:
          "Remerciez la personne pour son temps, notez le resultat de l'appel, puis raccrochez.",
      },
    ],
  },
  en: {
    callTitle: "Call",
    callIntro:
      "Pick a client, open their details, and keep the script plus call notes visible during the conversation.",
    callNewClientLabel: "New client",
    callCloseClientFormLabel: "Close",
    callClientsLabel: "Clients",
    callClientInfoTitle: "Client information",
    callEmptyClientSelection:
      "Select a client to display their information and call notes.",
    callNoteTitle: "Note",
    callNoteIntro:
      "Update the client status, follow-up dates, and notes while you are on the call.",
    notesTitle: "Notes & To-do",
    notesIntro:
      "Keep a quick note area and a short action list between calls.",
    quickNotesLabel: "Quick notes",
    quickNotesPlaceholder:
      "Example: prospect interested in 4 exterior views, send samples after the call.",
    todoLabel: "New task",
    todoPlaceholder: "Example: call Marc back Tuesday at 2 PM",
    addTodoLabel: "Add",
    emptyTodos: "No tasks yet.",
    clientsTitle: "Clients & Follow-up",
    clientsIntro:
      "Add prospects, update their info, and keep follow-up dates and call notes current.",
    addClientTitle: "Add a client",
    addClientLabel: "Add client",
    emptyClients: "No clients added yet.",
    removeLabel: "Remove",
    unnamedClient: "Unnamed client",
    labels: {
      name: "Name",
      company: "Company",
      phone: "Phone",
      email: "Email",
      project: "Project",
      status: "Status",
      lastCall: "Last call",
      nextFollowUp: "Next follow-up",
      notes: "Call notes / next actions",
    },
    statusLabels: {
      new: "New",
      attempting: "Attempting",
      follow_up: "Follow-up",
      qualified: "Qualified",
      proposal: "Proposal",
      closed: "Closed",
    },
    guidedScript: [
      {
        id: "script_1",
        title: "Script 1",
        kind: "decision",
        intro:
          "Hi [Name], this is Muriella from BrotherStudio. We help architects and developers present and sell their projects through high-end visualizations.",
        question:
          "I would like to talk to a manager or the senior architect if possible, is that person available?",
        yesLabel: "Yes",
        noLabel: "No",
        yesOutcome: {
          text: "Perfect, I will keep it short with the right person.",
          nextStepId: "script_2",
        },
        noOutcome: {
          text:
            "No problem. I will simply try to get the best way to reconnect.",
          nextStepId: "script_3",
        },
      },
      {
        id: "script_2",
        title: "Script 2",
        kind: "decision",
        intro:
          "Hi [Name], this is [Your name] from BrotherStudio. I am calling quickly to see whether you have a project where strong visuals could help.",
        question: "Do you have 30 seconds right now?",
        yesLabel: "Yes",
        noLabel: "No",
        yesOutcome: {
          text: "Perfect, I will keep it very short.",
          nextStepId: "script_4",
        },
        noOutcome: {
          text:
            "No problem. I will check whether a short callback or an email would be more useful.",
          nextStepId: "script_5",
        },
      },
      {
        id: "script_3",
        title: "Script 3",
        kind: "decision",
        intro:
          "I understand. I just want to get something relevant to the right person.",
        question: "Would you be able to share their direct email or extension?",
        yesLabel: "Yes",
        noLabel: "No",
        yesOutcome: {
          text:
            "Perfect. I will send something targeted before I reconnect.",
          nextStepId: "script_6",
        },
        noOutcome: {
          text:
            "Understood. I will try to leave a simple and useful message.",
          nextStepId: "script_7",
        },
      },
      {
        id: "script_4",
        title: "Script 4",
        kind: "decision",
        intro:
          "I just want to understand whether there is something active or coming up.",
        question: "Do you have an active or upcoming project that could use visuals?",
        yesLabel: "Yes",
        noLabel: "No",
        yesOutcome: {
          text:
            "Great. I will see whether you already have material ready to send.",
          nextStepId: "script_8",
        },
        noOutcome: {
          text:
            "No problem. I will check whether a few examples would still be useful for later.",
          nextStepId: "script_9",
        },
      },
      {
        id: "script_5",
        title: "Script 5",
        kind: "decision",
        intro:
          "I can adapt and keep this very simple.",
        question:
          "Would a quick callback later today or tomorrow make more sense?",
        yesLabel: "Yes",
        noLabel: "No",
        yesOutcome: {
          text: "Perfect. I will lock a short callback with clear context.",
          nextStepId: "close_callback",
        },
        noOutcome: {
          text:
            "Understood. I will offer a lighter follow-up by email instead.",
          nextStepId: "script_6",
        },
      },
      {
        id: "script_6",
        title: "Script 6",
        kind: "decision",
        intro:
          "I can send something short and relevant.",
        question:
          "Would it help if I emailed two targeted examples before I reconnect?",
        yesLabel: "Yes",
        noLabel: "No",
        yesOutcome: {
          text: "Perfect. I will send a brief email with the right examples.",
          nextStepId: "close_email",
        },
        noOutcome: {
          text:
            "Understood. I will simply suggest a lighter follow-up later on.",
          nextStepId: "close_follow_up",
        },
      },
      {
        id: "script_7",
        title: "Script 7",
        kind: "decision",
        intro:
          "I can leave a very simple message so it stays useful.",
        question:
          "Could you let them know we help present and sell projects through high-end visualizations?",
        yesLabel: "Yes",
        noLabel: "No",
        yesOutcome: {
          text: "Thank you. I will follow up lightly at the right time.",
          nextStepId: "close_message",
        },
        noOutcome: {
          text: "Understood. Thank you anyway for your time.",
          nextStepId: "close_polite",
        },
      },
      {
        id: "script_8",
        title: "Script 8",
        kind: "decision",
        intro:
          "If this is real and active, the next step can stay simple.",
        question:
          "Do you already have plans or references ready to share?",
        yesLabel: "Yes",
        noLabel: "No",
        yesOutcome: {
          text:
            "Perfect. I will move the discussion toward the right next step.",
          nextStepId: "script_10",
        },
        noOutcome: {
          text:
            "No problem. I can clarify exactly what we would need to start.",
          nextStepId: "script_11",
        },
      },
      {
        id: "script_9",
        title: "Script 9",
        kind: "decision",
        intro:
          "That is fine if nothing is active today.",
        question:
          "Would a small sample pack still be useful for a future project?",
        yesLabel: "Yes",
        noLabel: "No",
        yesOutcome: {
          text: "Perfect. I will send something light and relevant.",
          nextStepId: "close_email",
        },
        noOutcome: {
          text: "Understood. I will close the call cleanly here.",
          nextStepId: "close_polite",
        },
      },
      {
        id: "script_10",
        title: "Script 10",
        kind: "decision",
        intro:
          "Since you already have material, we can move easily.",
        question:
          "Would it help if I sent examples or a quick quote?",
        yesLabel: "Yes",
        noLabel: "No",
        yesOutcome: {
          text:
            "Perfect. I will send that and confirm the best contact.",
          nextStepId: "close_quote",
        },
        noOutcome: {
          text:
            "In that case, a second conversation probably makes more sense.",
          nextStepId: "script_12",
        },
      },
      {
        id: "script_11",
        title: "Script 11",
        kind: "decision",
        intro:
          "I can make the next step easier for you.",
        question:
          "Would it help if I sent a short checklist of what we need to start?",
        yesLabel: "Yes",
        noLabel: "No",
        yesOutcome: {
          text:
            "Perfect. I will send a simple recap by email.",
          nextStepId: "close_checklist",
        },
        noOutcome: {
          text:
            "Understood. It may be better to reconnect later on.",
          nextStepId: "script_12",
        },
      },
      {
        id: "script_12",
        title: "Script 12",
        kind: "decision",
        intro:
          "I just want to confirm the best next move before we hang up.",
        question:
          "Would a second call with the decision maker make more sense?",
        yesLabel: "Yes",
        noLabel: "No",
        yesOutcome: {
          text:
            "Perfect. We will lock the next call.",
          nextStepId: "close_second_call",
        },
        noOutcome: {
          text:
            "Understood. I will close things cleanly here.",
          nextStepId: "close_polite",
        },
      },
      {
        id: "close_callback",
        title: "Close call",
        kind: "closing",
        intro:
          "Confirm the callback time, log it in the tool, thank them, and hang up.",
      },
      {
        id: "close_email",
        title: "Close call",
        kind: "closing",
        intro:
          "Confirm the email, mention you will send two targeted examples, then close the call.",
      },
      {
        id: "close_follow_up",
        title: "Close call",
        kind: "closing",
        intro:
          "Suggest a light follow-up in a few days, thank them, and hang up.",
      },
      {
        id: "close_message",
        title: "Close call",
        kind: "closing",
        intro:
          "Thank the gatekeeper, note that a message should be passed on, and end the call.",
      },
      {
        id: "close_quote",
        title: "Close call",
        kind: "closing",
        intro:
          "Get the right email, promise the examples or quick quote, and hang up.",
      },
      {
        id: "close_checklist",
        title: "Close call",
        kind: "closing",
        intro:
          "Mention that you will send the checklist, confirm the contact, and close the call.",
      },
      {
        id: "close_second_call",
        title: "Close call",
        kind: "closing",
        intro:
          "Confirm the next call with the decision maker, log the follow-up, and hang up.",
      },
      {
        id: "close_polite",
        title: "Close call",
        kind: "closing",
        intro:
          "Thank them for their time, log the call result, and hang up.",
      },
    ],
  },
} satisfies Record<Locale, TeamCopy>;

const emptyClientDraft = {
  name: "",
  company: "",
  phone: "",
  email: "",
  project: "",
  status: "new" as TeamClientStatus,
  nextFollowUp: "",
};

const emptyStore: TeamStoragePayload = {
  quickNote: "",
  todos: [],
  clients: [],
};

function getCopy(locale: Locale) {
  return copyByLocale[locale];
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isClientStatus(value: unknown): value is TeamClientStatus {
  return (
    typeof value === "string" &&
    (CLIENT_STATUSES as readonly string[]).includes(value)
  );
}

function normalizeTodo(value: unknown): TeamTodoItem | null {
  if (!isRecord(value) || typeof value.text !== "string") return null;

  return {
    id: typeof value.id === "string" ? value.id : createId(),
    text: value.text,
    done: value.done === true,
  };
}

function normalizeClient(value: unknown): TeamClient | null {
  if (!isRecord(value)) return null;

  return {
    id: typeof value.id === "string" ? value.id : createId(),
    name: typeof value.name === "string" ? value.name : "",
    company: typeof value.company === "string" ? value.company : "",
    phone: typeof value.phone === "string" ? value.phone : "",
    email: typeof value.email === "string" ? value.email : "",
    project: typeof value.project === "string" ? value.project : "",
    status: isClientStatus(value.status) ? value.status : "new",
    lastCall: typeof value.lastCall === "string" ? value.lastCall : "",
    nextFollowUp:
      typeof value.nextFollowUp === "string" ? value.nextFollowUp : "",
    notes: typeof value.notes === "string" ? value.notes : "",
  };
}

function readStore(): TeamStoragePayload {
  if (typeof window === "undefined") return emptyStore;

  try {
    const stored = window.localStorage.getItem(TEAM_STORAGE_KEY);
    if (!stored) return emptyStore;

    const parsed: unknown = JSON.parse(stored);
    if (!isRecord(parsed)) return emptyStore;

    return {
      quickNote: typeof parsed.quickNote === "string" ? parsed.quickNote : "",
      todos: Array.isArray(parsed.todos)
        ? parsed.todos
            .map(normalizeTodo)
            .filter((item): item is TeamTodoItem => item !== null)
        : [],
      clients: Array.isArray(parsed.clients)
        ? parsed.clients
            .map(normalizeClient)
            .filter((item): item is TeamClient => item !== null)
        : [],
    };
  } catch {
    return emptyStore;
  }
}

function writeStore(patch: Partial<TeamStoragePayload>) {
  const current = readStore();
  const next: TeamStoragePayload = {
    ...current,
    ...patch,
  };

  window.localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(next));
}

function useTeamClients() {
  const [clients, setClients] = useState<TeamClient[]>([]);
  const [clientDraft, setClientDraft] = useState(emptyClientDraft);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const store = readStore();
      setClients(store.clients);
      setHasLoaded(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    writeStore({ clients });
  }, [clients, hasLoaded]);

  const createClient = () => {
    const name = clientDraft.name.trim();
    if (!name) return null;

    const newClient: TeamClient = {
      id: createId(),
      name,
      company: clientDraft.company.trim(),
      phone: clientDraft.phone.trim(),
      email: clientDraft.email.trim(),
      project: clientDraft.project.trim(),
      status: clientDraft.status,
      lastCall: "",
      nextFollowUp: clientDraft.nextFollowUp,
      notes: "",
    };

    setClients((current) => [newClient, ...current]);
    setClientDraft(emptyClientDraft);
    return newClient.id;
  };

  const addClient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createClient();
  };

  const updateClient = (id: string, patch: Partial<TeamClient>) => {
    setClients((current) =>
      current.map((client) => (client.id === id ? { ...client, ...patch } : client)),
    );
  };

  const removeClient = (id: string) => {
    setClients((current) => current.filter((client) => client.id !== id));
  };

  return {
    clients,
    clientDraft,
    setClientDraft,
    addClient,
    createClient,
    updateClient,
    removeClient,
  };
}

function useTeamNotes() {
  const [quickNote, setQuickNote] = useState("");
  const [todoDraft, setTodoDraft] = useState("");
  const [todos, setTodos] = useState<TeamTodoItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const store = readStore();
      setQuickNote(store.quickNote);
      setTodos(store.todos);
      setHasLoaded(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    writeStore({ quickNote, todos });
  }, [hasLoaded, quickNote, todos]);

  const addTodo = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = todoDraft.trim();
    if (!text) return;

    setTodos((current) => [{ id: createId(), text, done: false }, ...current]);
    setTodoDraft("");
  };

  const removeTodo = (id: string) => {
    setTodos((current) => current.filter((item) => item.id !== id));
  };

  return {
    quickNote,
    setQuickNote,
    todoDraft,
    setTodoDraft,
    todos,
    setTodos,
    addTodo,
    removeTodo,
  };
}

function TeamGuidedScriptFlow({ copy }: { copy: TeamCopy }) {
  const [answers, setAnswers] = useState<Record<string, "yes" | "no">>({});
  const getStepById = (stepId: string) =>
    copy.guidedScript.find((step) => step.id === stepId);
  const visibleStepIds = new Set<string>();
  const getNextStepId = (
    stepId: string,
    outcome: TeamGuidedScriptOutcome,
  ): string | undefined => {
    if (outcome.nextStepId) return outcome.nextStepId;
    const currentIndex = copy.guidedScript.findIndex((step) => step.id === stepId);
    return copy.guidedScript[currentIndex + 1]?.id;
  };
  let currentStepId: string | undefined = copy.guidedScript[0]?.id;

  while (currentStepId) {
    visibleStepIds.add(currentStepId);
    const currentStep = getStepById(currentStepId);
    if (!currentStep) break;
    if (currentStep.kind === "closing") break;

    const answer: "yes" | "no" | undefined = currentStepId
      ? answers[currentStepId]
      : undefined;
    if (!answer) break;

    currentStepId = getNextStepId(
      currentStep.id,
      answer === "yes" ? currentStep.yesOutcome : currentStep.noOutcome,
    );
  }

  const setStepAnswer = (stepId: string, answer: "yes" | "no") => {
    setAnswers((current) => {
      const next = { ...current, [stepId]: answer };
      const stepIndex = copy.guidedScript.findIndex((step) => step.id === stepId);
      copy.guidedScript.slice(stepIndex + 1).forEach((step) => {
        delete next[step.id];
      });
      return next;
    });
  };

  return (
    <div className="teamGuidedScriptList">
      {copy.guidedScript.map((step, index) => {
        if (!visibleStepIds.has(step.id)) return null;

        if (step.kind === "closing") {
          return (
            <section
              key={step.id}
              className="teamGuidedScriptCard"
              data-kind="closing"
            >
              <div className="teamGuidedScriptHeader">
                <p className="teamGuidedScriptTitle">{step.title}</p>
                <span className="teamGuidedScriptIndex">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="teamGuidedScriptIntro">
                <p className="teamScriptText">{step.intro}</p>
              </div>
            </section>
          );
        }

        const answer = answers[step.id];
        const outcome =
          answer === "yes"
            ? step.yesOutcome
            : answer === "no"
              ? step.noOutcome
              : null;

        return (
          <section key={step.id} className="teamGuidedScriptCard" data-kind="decision">
            <div className="teamGuidedScriptHeader">
              <p className="teamGuidedScriptTitle">{step.title}</p>
              <span className="teamGuidedScriptIndex">{String(index + 1).padStart(2, "0")}</span>
            </div>

            <div className="teamGuidedScriptIntro">
              <p className="teamScriptText">{step.intro}</p>
            </div>

            <div className="teamGuidedScriptDecision">
              <p className="teamGuidedScriptQuestion">{step.question}</p>

              <div className="teamGuidedScriptAnswers">
                <button
                  className="teamGhostButton teamGuidedScriptAnswer"
                  type="button"
                  data-active={answer === "yes"}
                  onClick={() => setStepAnswer(step.id, "yes")}
                >
                  {step.yesLabel}
                </button>
                <button
                  className="teamGhostButton teamGuidedScriptAnswer"
                  type="button"
                  data-active={answer === "no"}
                  onClick={() => setStepAnswer(step.id, "no")}
                >
                  {step.noLabel}
                </button>
              </div>
            </div>

            {outcome ? (
              <div className="teamGuidedScriptOutcome" data-answer={answer ?? undefined}>
                <p className="teamScriptText">{outcome.text}</p>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

export function TeamCallPanel({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const {
    clients,
    clientDraft,
    setClientDraft,
    createClient,
    updateClient,
    removeClient,
  } = useTeamClients();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const resolvedSelectedClientId =
    selectedClientId && clients.some((client) => client.id === selectedClientId)
      ? selectedClientId
      : (clients[0]?.id ?? null);
  const selectedClient =
    clients.find((client) => client.id === resolvedSelectedClientId) ?? null;
  const shouldShowClientForm = showClientForm || clients.length === 0;

  const handleCreateClient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newClientId = createClient();
    if (!newClientId) return;
    setSelectedClientId(newClientId);
    setShowClientForm(false);
  };

  return (
    <section className="teamSection" aria-labelledby="teamCallTitle">
      <div className="teamPanel teamPanelWide">
        <div className="teamPanelHeader">
          <h1 id="teamCallTitle" className="teamPanelTitle">
            {copy.callTitle}
          </h1>
          <p className="teamPanelText">{copy.callIntro}</p>
        </div>

        <div className="teamCallToolbar">
          <button
            className="teamButton teamCallToolbarButton"
            type="button"
            onClick={() => setShowClientForm((current) => !current)}
          >
            {copy.callNewClientLabel}
          </button>

          <div className="teamCallClientRail">
            <span className="teamFieldLabel">{copy.callClientsLabel}</span>
            <div className="teamCallClientTabs" role="tablist" aria-label={copy.callClientsLabel}>
              {clients.map((client) => (
                <button
                  key={client.id}
                  className="teamCallClientTab"
                  type="button"
                  role="tab"
                  aria-selected={resolvedSelectedClientId === client.id}
                  data-active={resolvedSelectedClientId === client.id}
                  onClick={() => setSelectedClientId(client.id)}
                >
                  {client.name || copy.unnamedClient}
                </button>
              ))}
            </div>
          </div>
        </div>

        {shouldShowClientForm ? (
          <form className="teamClientForm teamCallClientForm" onSubmit={handleCreateClient}>
            <div className="teamClientFormHeader">
              <h2 className="teamClientFormTitle">{copy.addClientTitle}</h2>
              <button
                className="teamGhostButton teamCallToolbarButton"
                type="button"
                onClick={() => setShowClientForm(false)}
              >
                {copy.callCloseClientFormLabel}
              </button>
            </div>

            <label className="teamField">
              <span className="teamFieldLabel">{copy.labels.name}</span>
              <input
                className="teamInput"
                type="text"
                value={clientDraft.name}
                onChange={(event) =>
                  setClientDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label className="teamField">
              <span className="teamFieldLabel">{copy.labels.company}</span>
              <input
                className="teamInput"
                type="text"
                value={clientDraft.company}
                onChange={(event) =>
                  setClientDraft((current) => ({
                    ...current,
                    company: event.target.value,
                  }))
                }
              />
            </label>

            <label className="teamField">
              <span className="teamFieldLabel">{copy.labels.phone}</span>
              <input
                className="teamInput"
                type="tel"
                value={clientDraft.phone}
                onChange={(event) =>
                  setClientDraft((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
              />
            </label>

            <label className="teamField">
              <span className="teamFieldLabel">{copy.labels.email}</span>
              <input
                className="teamInput"
                type="email"
                value={clientDraft.email}
                onChange={(event) =>
                  setClientDraft((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </label>

            <label className="teamField">
              <span className="teamFieldLabel">{copy.labels.project}</span>
              <input
                className="teamInput"
                type="text"
                value={clientDraft.project}
                onChange={(event) =>
                  setClientDraft((current) => ({
                    ...current,
                    project: event.target.value,
                  }))
                }
              />
            </label>

            <label className="teamField">
              <span className="teamFieldLabel">{copy.labels.status}</span>
              <select
                className="teamSelect"
                value={clientDraft.status}
                onChange={(event) =>
                  setClientDraft((current) => ({
                    ...current,
                    status: event.target.value as TeamClientStatus,
                  }))
                }
              >
                {CLIENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {copy.statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>

            <label className="teamField">
              <span className="teamFieldLabel">{copy.labels.nextFollowUp}</span>
              <input
                className="teamInput"
                type="date"
                value={clientDraft.nextFollowUp}
                onChange={(event) =>
                  setClientDraft((current) => ({
                    ...current,
                    nextFollowUp: event.target.value,
                  }))
                }
              />
            </label>

            <div className="teamCallClientFormActions">
              <button className="teamButton teamCallToolbarButton" type="submit">
                {copy.addClientLabel}
              </button>
            </div>
          </form>
        ) : null}

        {selectedClient ? (
          <section
            className="teamPanel teamCallClientPanel"
            aria-labelledby="teamCallClientInfoTitle"
          >
            <div className="teamClientCardHeader">
              <div className="teamPanelHeader">
                <h2 id="teamCallClientInfoTitle" className="teamPanelTitle">
                  {copy.callClientInfoTitle}
                </h2>
                <p className="teamClientMeta">
                  {selectedClient.name || copy.unnamedClient}
                </p>
              </div>

              <button
                className="teamGhostButton teamCallToolbarButton"
                type="button"
                onClick={() => removeClient(selectedClient.id)}
              >
                {copy.removeLabel}
              </button>
            </div>

            <div className="teamClientGrid teamCallClientGrid">
              <label className="teamField">
                <span className="teamFieldLabel">{copy.labels.name}</span>
                <input
                  className="teamInput"
                  type="text"
                  value={selectedClient.name}
                  onChange={(event) =>
                    updateClient(selectedClient.id, { name: event.target.value })
                  }
                />
              </label>

              <label className="teamField">
                <span className="teamFieldLabel">{copy.labels.company}</span>
                <input
                  className="teamInput"
                  type="text"
                  value={selectedClient.company}
                  onChange={(event) =>
                    updateClient(selectedClient.id, { company: event.target.value })
                  }
                />
              </label>

              <label className="teamField">
                <span className="teamFieldLabel">{copy.labels.phone}</span>
                <input
                  className="teamInput"
                  type="tel"
                  value={selectedClient.phone}
                  onChange={(event) =>
                    updateClient(selectedClient.id, { phone: event.target.value })
                  }
                />
              </label>

              <label className="teamField">
                <span className="teamFieldLabel">{copy.labels.email}</span>
                <input
                  className="teamInput"
                  type="email"
                  value={selectedClient.email}
                  onChange={(event) =>
                    updateClient(selectedClient.id, { email: event.target.value })
                  }
                />
              </label>

              <label className="teamField">
                <span className="teamFieldLabel">{copy.labels.project}</span>
                <input
                  className="teamInput"
                  type="text"
                  value={selectedClient.project}
                  onChange={(event) =>
                    updateClient(selectedClient.id, { project: event.target.value })
                  }
                />
              </label>
            </div>
          </section>
        ) : (
          <p className="teamEmpty">{copy.callEmptyClientSelection}</p>
        )}

        <div className="teamCallColumns">
          <section className="teamPanel" aria-labelledby="teamCallScriptTitle">
            <div className="teamPanelHeader">
              <h2 id="teamCallScriptTitle" className="teamPanelTitle">
                Script
              </h2>
            </div>
            <TeamGuidedScriptFlow copy={copy} />
          </section>

          <section className="teamPanel" aria-labelledby="teamCallNoteTitle">
            <div className="teamPanelHeader">
              <h2 id="teamCallNoteTitle" className="teamPanelTitle">
                {copy.callNoteTitle}
              </h2>
              <p className="teamPanelText">{copy.callNoteIntro}</p>
            </div>

            {selectedClient ? (
              <div className="teamCallNoteFields">
                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.status}</span>
                  <select
                    className="teamSelect"
                    value={selectedClient.status}
                    onChange={(event) =>
                      updateClient(selectedClient.id, {
                        status: event.target.value as TeamClientStatus,
                      })
                    }
                  >
                    {CLIENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {copy.statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.lastCall}</span>
                  <input
                    className="teamInput"
                    type="date"
                    value={selectedClient.lastCall}
                    onChange={(event) =>
                      updateClient(selectedClient.id, { lastCall: event.target.value })
                    }
                  />
                </label>

                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.nextFollowUp}</span>
                  <input
                    className="teamInput"
                    type="date"
                    value={selectedClient.nextFollowUp}
                    onChange={(event) =>
                      updateClient(selectedClient.id, {
                        nextFollowUp: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.notes}</span>
                  <textarea
                    className="teamTextarea teamCallNotesTextarea"
                    value={selectedClient.notes}
                    onChange={(event) =>
                      updateClient(selectedClient.id, { notes: event.target.value })
                    }
                  />
                </label>
              </div>
            ) : (
              <p className="teamEmpty">{copy.callEmptyClientSelection}</p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

export function TeamClientsPanel({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const {
    clients,
    clientDraft,
    setClientDraft,
    addClient,
    updateClient,
    removeClient,
  } = useTeamClients();

  return (
    <section className="teamPanel teamPanelWide" aria-labelledby="teamClientsTitle">
      <div className="teamPanelHeader">
        <h1 id="teamClientsTitle" className="teamPanelTitle">
          {copy.clientsTitle}
        </h1>
        <p className="teamPanelText">{copy.clientsIntro}</p>
      </div>

      <form className="teamClientForm" onSubmit={addClient}>
        <div className="teamClientFormHeader">
          <h2 className="teamClientFormTitle">{copy.addClientTitle}</h2>
          <button className="teamButton" type="submit">
            {copy.addClientLabel}
          </button>
        </div>

        <label className="teamField">
          <span className="teamFieldLabel">{copy.labels.name}</span>
          <input
            className="teamInput"
            type="text"
            value={clientDraft.name}
            onChange={(event) =>
              setClientDraft((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            required
          />
        </label>

        <label className="teamField">
          <span className="teamFieldLabel">{copy.labels.company}</span>
          <input
            className="teamInput"
            type="text"
            value={clientDraft.company}
            onChange={(event) =>
              setClientDraft((current) => ({
                ...current,
                company: event.target.value,
              }))
            }
          />
        </label>

        <label className="teamField">
          <span className="teamFieldLabel">{copy.labels.phone}</span>
          <input
            className="teamInput"
            type="tel"
            value={clientDraft.phone}
            onChange={(event) =>
              setClientDraft((current) => ({
                ...current,
                phone: event.target.value,
              }))
            }
          />
        </label>

        <label className="teamField">
          <span className="teamFieldLabel">{copy.labels.email}</span>
          <input
            className="teamInput"
            type="email"
            value={clientDraft.email}
            onChange={(event) =>
              setClientDraft((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
          />
        </label>

        <label className="teamField">
          <span className="teamFieldLabel">{copy.labels.project}</span>
          <input
            className="teamInput"
            type="text"
            value={clientDraft.project}
            onChange={(event) =>
              setClientDraft((current) => ({
                ...current,
                project: event.target.value,
              }))
            }
          />
        </label>

        <label className="teamField">
          <span className="teamFieldLabel">{copy.labels.status}</span>
          <select
            className="teamSelect"
            value={clientDraft.status}
            onChange={(event) =>
              setClientDraft((current) => ({
                ...current,
                status: event.target.value as TeamClientStatus,
              }))
            }
          >
            {CLIENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {copy.statusLabels[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="teamField">
          <span className="teamFieldLabel">{copy.labels.nextFollowUp}</span>
          <input
            className="teamInput"
            type="date"
            value={clientDraft.nextFollowUp}
            onChange={(event) =>
              setClientDraft((current) => ({
                ...current,
                nextFollowUp: event.target.value,
              }))
            }
          />
        </label>
      </form>

      {clients.length > 0 ? (
        <div className="teamClientList">
          {clients.map((client) => (
            <article key={client.id} className="teamClientCard">
              <div className="teamClientCardHeader">
                <div className="teamClientIdentity">
                  <h2 className="teamClientName">
                    {client.name || copy.unnamedClient}
                  </h2>
                  <p className="teamClientMeta">
                    {client.company || client.project || copy.statusLabels[client.status]}
                  </p>
                </div>

                <button
                  className="teamGhostButton"
                  type="button"
                  onClick={() => removeClient(client.id)}
                >
                  {copy.removeLabel}
                </button>
              </div>

              <div className="teamClientGrid">
                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.name}</span>
                  <input
                    className="teamInput"
                    type="text"
                    value={client.name}
                    onChange={(event) =>
                      updateClient(client.id, { name: event.target.value })
                    }
                  />
                </label>

                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.company}</span>
                  <input
                    className="teamInput"
                    type="text"
                    value={client.company}
                    onChange={(event) =>
                      updateClient(client.id, { company: event.target.value })
                    }
                  />
                </label>

                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.phone}</span>
                  <input
                    className="teamInput"
                    type="tel"
                    value={client.phone}
                    onChange={(event) =>
                      updateClient(client.id, { phone: event.target.value })
                    }
                  />
                </label>

                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.email}</span>
                  <input
                    className="teamInput"
                    type="email"
                    value={client.email}
                    onChange={(event) =>
                      updateClient(client.id, { email: event.target.value })
                    }
                  />
                </label>

                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.project}</span>
                  <input
                    className="teamInput"
                    type="text"
                    value={client.project}
                    onChange={(event) =>
                      updateClient(client.id, { project: event.target.value })
                    }
                  />
                </label>

                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.status}</span>
                  <select
                    className="teamSelect"
                    value={client.status}
                    onChange={(event) =>
                      updateClient(client.id, {
                        status: event.target.value as TeamClientStatus,
                      })
                    }
                  >
                    {CLIENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {copy.statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.lastCall}</span>
                  <input
                    className="teamInput"
                    type="date"
                    value={client.lastCall}
                    onChange={(event) =>
                      updateClient(client.id, { lastCall: event.target.value })
                    }
                  />
                </label>

                <label className="teamField">
                  <span className="teamFieldLabel">{copy.labels.nextFollowUp}</span>
                  <input
                    className="teamInput"
                    type="date"
                    value={client.nextFollowUp}
                    onChange={(event) =>
                      updateClient(client.id, {
                        nextFollowUp: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="teamField teamFieldWide">
                  <span className="teamFieldLabel">{copy.labels.notes}</span>
                  <textarea
                    className="teamTextarea"
                    value={client.notes}
                    onChange={(event) =>
                      updateClient(client.id, { notes: event.target.value })
                    }
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="teamEmpty">{copy.emptyClients}</p>
      )}
    </section>
  );
}

export function TeamScriptPanel({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);

  return (
    <section className="teamPanel" aria-labelledby="teamScriptTitle">
      <div className="teamPanelHeader">
        <h1 id="teamScriptTitle" className="teamPanelTitle">
          Script
        </h1>
      </div>

      <TeamGuidedScriptFlow copy={copy} />
    </section>
  );
}

export function TeamNotesPanel({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const {
    quickNote,
    setQuickNote,
    todoDraft,
    setTodoDraft,
    todos,
    setTodos,
    addTodo,
    removeTodo,
  } = useTeamNotes();

  return (
    <section className="teamPanel" aria-labelledby="teamNotesTitle">
      <div className="teamPanelHeader">
        <h1 id="teamNotesTitle" className="teamPanelTitle">
          {copy.notesTitle}
        </h1>
        <p className="teamPanelText">{copy.notesIntro}</p>
      </div>

      <label className="teamField">
        <span className="teamFieldLabel">{copy.quickNotesLabel}</span>
        <textarea
          className="teamTextarea"
          value={quickNote}
          onChange={(event) => setQuickNote(event.target.value)}
          placeholder={copy.quickNotesPlaceholder}
        />
      </label>

      <form className="teamInlineForm" onSubmit={addTodo}>
        <label className="teamField">
          <span className="teamFieldLabel">{copy.todoLabel}</span>
          <input
            className="teamInput"
            type="text"
            value={todoDraft}
            onChange={(event) => setTodoDraft(event.target.value)}
            placeholder={copy.todoPlaceholder}
          />
        </label>
        <button className="teamButton" type="submit">
          {copy.addTodoLabel}
        </button>
      </form>

      {todos.length > 0 ? (
        <ul className="teamTodoList">
          {todos.map((item) => (
            <li key={item.id} className="teamTodoItem">
              <label className="teamTodoCheck">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={(event) =>
                    setTodos((current) =>
                      current.map((todo) =>
                        todo.id === item.id
                          ? { ...todo, done: event.target.checked }
                          : todo,
                      ),
                    )
                  }
                />
                <span data-done={item.done}>{item.text}</span>
              </label>
              <button
                className="teamGhostButton"
                type="button"
                onClick={() => removeTodo(item.id)}
              >
                {copy.removeLabel}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="teamEmpty">{copy.emptyTodos}</p>
      )}
    </section>
  );
}
