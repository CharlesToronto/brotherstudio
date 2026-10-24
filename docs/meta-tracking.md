# Suivi Meta — BrotherStudio

Pixel : `1625433562404303`. Actif en production uniquement. Les pages admin,
dashboard, team, myreview, myexperience et API sont exclues. Le cookie
`bs_analytics_disabled=1` désactive les envois navigateur et serveur.

## Événements installés

- `PageView` : ouverture et changement de chemin public.
- `ViewContent` : fiche immobilière, site Plantaz/Maretset, ouverture d'une image du portfolio.
- `FormStart` (personnalisé) : première saisie dans chacun des quatre formulaires de contact.
- `FormStepCompleted` / `FormError` (personnalisés) : étape 1 validée / échec du formulaire d'estimation.
- `Lead` : réponse confirmée du serveur aux formulaires contact, estimation, Plantaz, Maretset. Les réponses honeypot ne portent aucun identifiant de conversion.
- `ContactClick` (personnalisé) : lien téléphone, courriel, WhatsApp ; paramètre `channel` uniquement.
- `ContactFormClick`, `BookingClick`, `DownloadClick` (personnalisés) : liens vers #contact, Calendly/#booking, téléchargement/PDF. Ce sont des intentions, pas des conversions confirmées.
- `Schedule` : notification `calendly.event_scheduled` provenant de l'iframe Calendly intégrée. L'origine et la fenêtre source sont vérifiées, les notifications répétées sont ignorées. Une réservation sur un onglet Calendly externe n'est pas confirmable par ce code.

Aucun `Purchase` : aucun paiement confirmé n'a été identifié dans le site.
Les messages, adresses de biens, budgets et champs libres ne sont pas transmis comme paramètres.

## API Conversions : activation nécessaire

Les `Lead` sont préparés côté serveur après un succès du traitement de contact.
Configurer uniquement dans l'environnement serveur de l'hébergeur :

- `META_CONVERSIONS_ACCESS_TOKEN` : jeton du dataset/pixel Meta ; jamais de préfixe `NEXT_PUBLIC_`.
- `META_GRAPH_API_VERSION` : version Graph API encore supportée, format `vNN.0`, choisie lors de la configuration Meta.
- `META_TEST_EVENT_CODE` : facultatif, code de Test Events pendant la recette ; retirer pour l'exploitation normale.

En l'absence du jeton ou de la version, aucun appel CAPI n'est effectué.
Le serveur transmet l'e-mail normalisé et haché SHA-256, le user-agent et les
cookies `_fbp`/`_fbc` disponibles. URL source limitée à la même origine, sans
query string ni fragment. `event_id` est identique au `eventID` du pixel pour
la déduplication. Le hash de l'e-mail reste une donnée de rapprochement publicitaire.

Le code conserve l'option d'exclusion existante ; il n'ajoute pas de gestionnaire de consentement.
Un échec Meta est journalisé sans contenu personnel et ne fait pas échouer le formulaire.
Il n'existe pas de file persistante de réessai CAPI : vérifier les erreurs de livraison.

## Vérification

Commande locale : `node scripts/test-meta-tracking.cjs` (appels externes simulés).
Après déploiement, ouvrir Test Events dans Meta, consulter une fiche, commencer
un formulaire puis envoyer une demande de test. Vérifier un seul Lead après
déduplication navigateur/serveur et le paramètre `form_name`. Tester une réservation
Calendly et vérifier `Schedule`. Vérifier également l'absence d'événements avec
le cookie d'exclusion. Le mode `npm run dev` n'envoie aucun événement Meta.
