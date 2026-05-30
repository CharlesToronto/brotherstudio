"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import type { Locale } from "@/lib/i18n";
import type {
  TeamClientContactRecord,
  TeamClientRecord,
  TeamClientStatus,
} from "@/lib/teamStore";

type TeamContactsTabProps = {
  locale: Locale;
};

type ContactsTabCopy = {
  title: string;
  intro: string;
  addContact: string;
  addClient: string;
  cancel: string;
  save: string;
  loading: string;
  emptyClients: string;
  emptyContacts: string;
  saving: string;
  saved: string;
  clientFallback: string;
  fields: {
    clientName: string;
    company: string;
    address: string;
    country: string;
    phone: string;
    email: string;
    project: string;
    status: string;
    nextFollowUp: string;
    name: string;
    lastContact: string;
    note: string;
    nextContact: string;
  };
  deleteLabel: string;
};

const copyByLocale: Record<Locale, ContactsTabCopy> = {
  fr: {
    title: "Contacts clients",
    intro:
      "Chaque client affiche sa liste de contacts sur des lignes numérotées, modifiables directement.",
    addContact: "+ Ajouter un contact",
    addClient: "+ Ajouter un client",
    cancel: "Annuler",
    save: "Sauvegarder",
    loading: "Chargement...",
    emptyClients: "Aucun client disponible pour le moment.",
    emptyContacts: "Aucun contact pour ce client.",
    saving: "Enregistrement...",
    saved: "Sauvegardé",
    clientFallback: "Client sans nom",
    fields: {
      clientName: "Nom du client",
      company: "Entreprise",
      address: "Adresse",
      country: "Pays",
      phone: "Téléphone",
      email: "Email",
      project: "Projet",
      status: "Statut",
      nextFollowUp: "Prochain suivi",
      name: "Contact",
      lastContact: "Dernier contact",
      note: "Note",
      nextContact: "Prochain rappel / contact",
    },
    deleteLabel: "Supprimer",
  },
  en: {
    title: "Client contacts",
    intro:
      "Each client shows a numbered contact list that can be edited directly inline.",
    addContact: "+ Add contact",
    addClient: "+ Add client",
    cancel: "Cancel",
    save: "Save",
    loading: "Loading...",
    emptyClients: "No clients available yet.",
    emptyContacts: "No contacts for this client yet.",
    saving: "Saving...",
    saved: "Saved",
    clientFallback: "Unnamed client",
    fields: {
      clientName: "Client name",
      company: "Company",
      address: "Address",
      country: "Country",
      phone: "Phone",
      email: "Email",
      project: "Project",
      status: "Status",
      nextFollowUp: "Next follow-up",
      name: "Contact",
      lastContact: "Last contact",
      note: "Note",
      nextContact: "Next reminder / contact",
    },
    deleteLabel: "Delete",
  },
};

type ContactsWorkspacePayload = {
  clients: TeamClientRecord[];
  contacts: TeamClientContactRecord[];
};

const TEAM_CLIENT_STATUSES: TeamClientStatus[] = ["new", "contacted", "follow_up", "closed"];

const emptyClientDraft = {
  name: "",
  company: "",
  address: "",
  country: "",
  phone: "",
  email: "",
  project: "",
  status: "new" as TeamClientStatus,
  nextFollowUp: "",
};

const statusLabelByLocale: Record<Locale, Record<TeamClientStatus, string>> = {
  fr: {
    new: "New",
    contacted: "Contacted",
    follow_up: "Follow-up",
    closed: "Closed",
  },
  en: {
    new: "New",
    contacted: "Contacted",
    follow_up: "Follow-up",
    closed: "Closed",
  },
};

type ContactPatch = Partial<
  Pick<TeamClientContactRecord, "name" | "lastContact" | "note" | "nextContact">
>;

async function fetchContactsWorkspace(): Promise<ContactsWorkspacePayload> {
  const [clientsResponse, contactsResponse] = await Promise.all([
    fetch("/api/team/clients", { cache: "no-store" }),
    fetch("/api/team/contacts", { cache: "no-store" }),
  ]);

  if (!clientsResponse.ok) {
    const payload = (await clientsResponse.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Failed to load team clients.");
  }

  if (!contactsResponse.ok) {
    const payload = (await contactsResponse.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Failed to load team contacts.");
  }

  const clientsPayload = (await clientsResponse.json()) as { clients?: TeamClientRecord[] };
  const contactsPayload = (await contactsResponse.json()) as {
    contacts?: TeamClientContactRecord[];
  };

  return {
    clients: clientsPayload.clients ?? [],
    contacts: contactsPayload.contacts ?? [],
  };
}

export function TeamContactsTab({ locale }: TeamContactsTabProps) {
  const copy = copyByLocale[locale] ?? copyByLocale.en;
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [clients, setClients] = useState<TeamClientRecord[]>([]);
  const [contacts, setContacts] = useState<TeamClientContactRecord[]>([]);
  const [pendingPatches, setPendingPatches] = useState<Record<string, ContactPatch>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientDraft, setNewClientDraft] = useState(emptyClientDraft);

  useEffect(() => {
    let isCancelled = false;

    async function loadWorkspace() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const payload = await fetchContactsWorkspace();
        if (isCancelled) return;
        setClients(payload.clients);
        setContacts(payload.contacts);
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load contacts workspace.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadWorkspace();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const pendingEntries = Object.entries(pendingPatches);
    if (pendingEntries.length === 0) return;

    const timeout = window.setTimeout(async () => {
      setPendingPatches((current) => {
        const next = { ...current };
        for (const [contactId] of pendingEntries) {
          delete next[contactId];
        }
        return next;
      });
      setSaveState("saving");

      try {
        const updatedContacts = await Promise.all(
          pendingEntries.map(async ([contactId, patch]) => {
            const response = await fetch(`/api/team/contacts/${contactId}`, {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(patch),
            });

            if (!response.ok) {
              const payload = (await response.json().catch(() => null)) as { error?: string } | null;
              throw new Error(payload?.error ?? "Failed to update team contact.");
            }

            const payload = (await response.json()) as {
              contact?: TeamClientContactRecord;
            };
            return payload.contact ?? null;
          }),
        );

        setContacts((current) =>
          current.map((contact) => {
            const updated = updatedContacts.find((entry) => entry?.id === contact.id);
            return updated ?? contact;
          }),
        );
        setSaveState("saved");
      } catch (error) {
        setSaveState("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to update team contact.",
        );

        try {
          const payload = await fetchContactsWorkspace();
          setClients(payload.clients);
          setContacts(payload.contacts);
        } catch {}
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [pendingPatches]);

  const contactsByClientId = useMemo(() => {
    return contacts.reduce<Record<string, TeamClientContactRecord[]>>((groups, contact) => {
      if (!groups[contact.clientId]) {
        groups[contact.clientId] = [];
      }
      groups[contact.clientId].push(contact);
      return groups;
    }, {});
  }, [contacts]);

  const updateContactField = (
    contactId: string,
    patch: ContactPatch,
  ) => {
    setContacts((current) =>
      current.map((contact) =>
        contact.id === contactId ? { ...contact, ...patch } : contact,
      ),
    );
    setPendingPatches((current) => ({
      ...current,
      [contactId]: {
        ...current[contactId],
        ...patch,
      },
    }));
  };

  const addContact = async (clientId: string) => {
    setErrorMessage("");
    setSaveState("saving");

    try {
      const response = await fetch("/api/team/contacts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientId }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to create team contact.");
      }

      const payload = (await response.json()) as { contact?: TeamClientContactRecord };
      if (!payload.contact) {
        throw new Error("Failed to create team contact.");
      }
      const createdContact = payload.contact;

      setContacts((current) => [...current, createdContact]);
      setSaveState("saved");
    } catch (error) {
      setSaveState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create team contact.",
      );
    }
  };

  const addClient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newClientDraft.name.trim()) return;

    setErrorMessage("");
    setSaveState("saving");

    try {
      const response = await fetch("/api/team/clients", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(newClientDraft),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to create team client.");
      }

      const payload = (await response.json()) as { client?: TeamClientRecord };
      if (!payload.client) {
        throw new Error("Failed to create team client.");
      }
      const createdClient = payload.client;

      setClients((current) => [createdClient, ...current]);
      setNewClientDraft(emptyClientDraft);
      setShowNewClientForm(false);
      setSaveState("saved");
    } catch (error) {
      setSaveState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create team client.",
      );
    }
  };

  const removeContact = async (contactId: string) => {
    const previousContacts = contacts;
    setErrorMessage("");
    setSaveState("saving");
    setContacts((current) => current.filter((contact) => contact.id !== contactId));
    setPendingPatches((current) => {
      const next = { ...current };
      delete next[contactId];
      return next;
    });

    try {
      const response = await fetch(`/api/team/contacts/${contactId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to delete team contact.");
      }

      setSaveState("saved");
    } catch (error) {
      setContacts(previousContacts);
      setSaveState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete team contact.",
      );
    }
  };

  if (isLoading) {
    return (
      <section className="teamCallColumn teamCallContactsPanel">
        <p className="teamCallLoading">{copy.loading}</p>
      </section>
    );
  }

  return (
    <section className="teamCallColumn teamCallContactsPanel">
      <div className="teamCallColumnHeader teamCallContactsHeader">
        <div>
          <h2 className="teamCallColumnTitle">{copy.title}</h2>
          <p className="teamPanelText">{copy.intro}</p>
        </div>
        <div className="teamContactsHeaderActions">
          <button
            className="teamGhostButton"
            type="button"
            onClick={() => setShowNewClientForm((current) => !current)}
          >
            {copy.addClient}
          </button>
          <p className="teamCallAutosaveMeta">
            {saveState === "saving" ? copy.saving : saveState === "saved" ? copy.saved : null}
          </p>
        </div>
      </div>

      {errorMessage ? (
        <p className="projectFeedbackMessage projectFeedbackMessageError">{errorMessage}</p>
      ) : null}

      {showNewClientForm ? (
        <form className="teamContactsAddClientForm" onSubmit={addClient}>
          <input
            className="teamInput"
            type="text"
            placeholder={copy.fields.clientName}
            value={newClientDraft.name}
            onChange={(event) =>
              setNewClientDraft((current) => ({ ...current, name: event.target.value }))
            }
            required
          />
          <input
            className="teamInput"
            type="text"
            placeholder={copy.fields.company}
            value={newClientDraft.company}
            onChange={(event) =>
              setNewClientDraft((current) => ({ ...current, company: event.target.value }))
            }
          />
          <input
            className="teamInput"
            type="text"
            placeholder={copy.fields.address}
            value={newClientDraft.address}
            onChange={(event) =>
              setNewClientDraft((current) => ({ ...current, address: event.target.value }))
            }
          />
          <input
            className="teamInput"
            type="text"
            placeholder={copy.fields.country}
            value={newClientDraft.country}
            onChange={(event) =>
              setNewClientDraft((current) => ({ ...current, country: event.target.value }))
            }
          />
          <input
            className="teamInput"
            type="tel"
            placeholder={copy.fields.phone}
            value={newClientDraft.phone}
            onChange={(event) =>
              setNewClientDraft((current) => ({ ...current, phone: event.target.value }))
            }
          />
          <input
            className="teamInput"
            type="email"
            placeholder={copy.fields.email}
            value={newClientDraft.email}
            onChange={(event) =>
              setNewClientDraft((current) => ({ ...current, email: event.target.value }))
            }
          />
          <input
            className="teamInput"
            type="text"
            placeholder={copy.fields.project}
            value={newClientDraft.project}
            onChange={(event) =>
              setNewClientDraft((current) => ({ ...current, project: event.target.value }))
            }
          />
          <select
            className="teamSelect"
            value={newClientDraft.status}
            onChange={(event) =>
              setNewClientDraft((current) => ({
                ...current,
                status: event.target.value as TeamClientStatus,
              }))
            }
            aria-label={copy.fields.status}
          >
            {TEAM_CLIENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {(statusLabelByLocale[locale] ?? statusLabelByLocale.en)[status]}
              </option>
            ))}
          </select>
          <input
            className="teamInput"
            type="date"
            value={newClientDraft.nextFollowUp}
            onChange={(event) =>
              setNewClientDraft((current) => ({
                ...current,
                nextFollowUp: event.target.value,
              }))
            }
            aria-label={copy.fields.nextFollowUp}
          />
          <div className="teamContactsAddClientActions">
            <button className="teamButton" type="submit">
              {copy.save}
            </button>
            <button
              className="teamGhostButton"
              type="button"
              onClick={() => {
                setShowNewClientForm(false);
                setNewClientDraft(emptyClientDraft);
              }}
            >
              {copy.cancel}
            </button>
          </div>
        </form>
      ) : null}

      {clients.length > 0 ? (
        <div className="teamContactsClientSections">
          {clients.map((client) => {
            const clientContacts = contactsByClientId[client.id] ?? [];

            return (
              <section key={client.id} className="teamContactsClientSection">
                <div className="teamContactsClientHeader">
                  <div className="teamContactsClientIdentity">
                    <h3 className="teamClientName">{client.name || copy.clientFallback}</h3>
                    <p className="teamClientMeta">
                      {client.company || client.project || client.email}
                    </p>
                  </div>
                  <button
                    className="teamGhostButton"
                    type="button"
                    onClick={() => void addContact(client.id)}
                  >
                    {copy.addContact}
                  </button>
                </div>

                {clientContacts.length > 0 ? (
                  <ol className="teamContactList">
                    {clientContacts.map((contact, index) => (
                      <li key={contact.id} className="teamContactItem">
                        <span className="teamContactIndex">{index + 1}</span>
                        <div className="teamContactRow">
                          <input
                            className="teamInput"
                            type="text"
                            placeholder={copy.fields.name}
                            value={contact.name}
                            onChange={(event) =>
                              updateContactField(contact.id, { name: event.target.value })
                            }
                          />
                          <input
                            className="teamInput"
                            type="date"
                            aria-label={copy.fields.lastContact}
                            value={contact.lastContact}
                            onChange={(event) =>
                              updateContactField(contact.id, {
                                lastContact: event.target.value,
                              })
                            }
                          />
                          <input
                            className="teamInput"
                            type="text"
                            placeholder={copy.fields.note}
                            value={contact.note}
                            onChange={(event) =>
                              updateContactField(contact.id, { note: event.target.value })
                            }
                          />
                          <input
                            className="teamInput"
                            type="date"
                            aria-label={copy.fields.nextContact}
                            value={contact.nextContact}
                            onChange={(event) =>
                              updateContactField(contact.id, {
                                nextContact: event.target.value,
                              })
                            }
                          />
                          <button
                            className="teamGhostButton"
                            type="button"
                            onClick={() => void removeContact(contact.id)}
                          >
                            {copy.deleteLabel}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="teamEmpty">{copy.emptyContacts}</p>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <p className="teamEmpty">{copy.emptyClients}</p>
      )}
    </section>
  );
}
