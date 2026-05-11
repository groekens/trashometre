// ─────────────────────────────────────────────────────────────────────────────
// Trashomètre — Traductions FR / NL / EN
// ─────────────────────────────────────────────────────────────────────────────

export const MONTHS = {
  fr: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  nl: ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
};

export const T = {
  fr: {
    // Loader / login
    loading: 'Chargement…',
    login_sub: 'Connectez-vous pour suivre vos collectes.',
    login_note: 'Vos données sont sauvegardées dans le cloud.',
    btn_google: 'Continuer avec Google',
    btn_signin: 'Se connecter',
    btn_register: 'Créer mon compte',
    btn_forgot: 'Mot de passe oublié ?',
    tab_login: 'Connexion',
    tab_register: 'Créer un compte',
    lbl_email: 'Adresse e-mail',
    lbl_password: 'Mot de passe',
    lbl_password_confirm: 'Confirmer le mot de passe',
    placeholder_pwd_new: '8 caractères minimum',
    placeholder_pwd: '••••••••',

    // Setup
    setup_title: 'Configurez<br/><span class="hl">votre ménage</span>',
    setup_sub: 'Quelques informations pour calculer vos quotas et votre taxe selon le barème Rixensart 2026.',
    l_persons: 'Nombre de personnes dans le ménage',
    btn_start: 'Commencer le suivi →',

    // Dashboard
    yr_lbl: p => `Bilan 2026 — ${p} pers.`,
    lbl_settings: 'Paramètres',
    lbl_current_cost: 'Surcoût en cours',
    forfait_line: (f, t) => `+ forfait ${f} € · total ${t}`,
    lbl_residuel: 'Résiduel',
    lbl_organique: 'Organique',
    lbl_levees: 'Levées',
    lbl_poids: 'Poids',
    lbl_projection: "Projection fin d'année",
    lbl_proj_cost: 'Coût total projeté',
    lbl_proj_over: 'Dont surcoût estimé',
    lbl_proj_nl: 'Levées ⬛ restantes',
    lbl_proj_vl: 'Levées 🟩 restantes',
    fnote_ok: (days, f) => `Projection basée sur ${days} jours de données. Coût total = forfait ${f} € + surcoûts estimés à fin décembre.`,
    fnote_unreliable: 'Plus de 14 jours de données sont nécessaires pour une projection fiable.',
    epuisees: 'épuisées',
    levee: '1 levée',

    // Chart
    lbl_chart: "Évolution mensuelle",
    chart_residuel: 'Résiduel (kg)',
    chart_organique: 'Organique (kg)',
    chart_quota_n: 'Quota résiduel',
    chart_quota_v: 'Quota organique',

    // Info links
    lbl_info: 'Informations utiles',
    prime_title: 'Demande de prime / dérogation',
    prime_sub: 'Enfants < 2 ans, raison médicale — rixensart.be',
    taxe_title: 'Comprendre le calcul de la taxe',
    taxe_sub: 'Barème complet 2026 — adapté à votre ménage',

    // Log form
    lbl_add: 'Enregistrer une collecte',
    lbl_date: 'Date de la collecte',
    lbl_kg: 'Poids (kg, optionnel)',
    lbl_type: 'Type de conteneur',
    rlbl_noir: 'Résiduel',
    rlbl_vert: 'Organique',
    lbl_hint: 'Chaque enregistrement = 1 levée.',
    btn_add: '+ Ajouter',

    // History
    lbl_history: 'Historique',
    filt_all: 'Tous',
    filt_noir: 'Résiduel',
    filt_vert: 'Organique',
    lbl_empty: 'Aucune collecte enregistrée.<br/>Ajoutez votre première collecte ci-dessus.',

    // Info page
    lbl_back: 'Retour',
    info_title: 'Calcul de la taxe déchets 2026',
    info_sub: 'Commune de Rixensart — Conteneurs à puce',
    info_personal: persons => `Pour votre ménage de <strong>${persons} personne${persons>1?'s':''}</strong>, le forfait annuel est de <strong>${FORFAITS_FR[Math.min(persons,5)]} €</strong>.`,
    th_forfait: 'Taxe forfaitaire annuelle (due par tous)',
    th_included: 'Service minimum inclus dans le forfait',
    th_extra: 'Tarifs proportionnels (au-delà du service minimum)',
    th_type: 'Type', th_levees: 'Levées incluses', th_poids: 'Poids inclus',
    th_noir_lev: '⬛ Levées supplémentaires',
    th_noir_kg: '⬛ Poids supplémentaire (par habitant/an)',
    th_vert_lev: '🟩 Levées supplémentaires',
    th_vert_kg: '🟩 Poids supplémentaire',
    info_note: "Les tarifs sont applicables pour l'année 2026. La taxe forfaitaire est due indépendamment de la consommation. En cas de déménagement en cours d'année, la taxe est calculée au prorata.",

    // Settings
    lbl_modal_title: 'Paramètres',
    lbl_modal_persons: 'Nombre de personnes',
    lbl_lang: 'Langue / Language / Taal',
    btn_cancel: 'Annuler',
    btn_save: 'Enregistrer',
    lbl_danger: 'Zone danger',
    btn_logout: 'Se déconnecter',
    btn_reset: 'Effacer toutes les données',

    // Confirms
    confirm_delete_entry: 'Supprimer cette collecte ?',
    confirm_delete_entry_yes: 'Supprimer',
    confirm_reset: 'Effacer toutes les collectes ? Cette action est irréversible.',
    confirm_reset_yes: 'Tout effacer',

    // Toasts
    login: 'Connexion',
    logout_toast: 'Déconnecté',
    login_toast: 'Connecté ✓',
    cancel_toast: 'Connexion annulée',
    added_toast: 'Collecte enregistrée ✓',
    deleted_toast: 'Entrée supprimée',
    saved_toast: 'Paramètres sauvegardés ✓',
    reset_toast: 'Données effacées',
    reset_email_toast: 'E-mail de réinitialisation envoyé ✓',
    error_generic: 'Une erreur est survenue. Réessayez.',
    error_offline: 'Hors ligne — vos modifications seront synchronisées.',
    error_network: 'Erreur réseau. Vérifiez votre connexion.',

    // Validation errors
    err_date_required: 'Date requise.',
    err_kg_negative: 'Le poids ne peut pas être négatif.',
    err_kg_too_high: 'Poids invalide (max 200 kg).',
    err_date_future: 'La date ne peut pas être dans le futur.',
    err_date_too_old: 'Date trop ancienne.',
    err_date_invalid: 'Date invalide.',
    err_type_invalid: 'Type de conteneur invalide.',
    err_fields_required: 'Veuillez remplir tous les champs.',
    err_pwd_mismatch: 'Les mots de passe ne correspondent pas.',
    err_pwd_short: 'Le mot de passe doit contenir au moins 6 caractères.',
    err_email_for_reset: 'Entrez votre e-mail pour recevoir le lien de réinitialisation.',

    // Firebase auth errors
    fb_user_not_found: 'Aucun compte trouvé avec cet e-mail.',
    fb_wrong_password: 'Mot de passe incorrect.',
    fb_invalid_credential: 'E-mail ou mot de passe incorrect.',
    fb_email_in_use: 'Cet e-mail est déjà utilisé.',
    fb_weak_password: 'Le mot de passe doit contenir au moins 6 caractères.',
    fb_invalid_email: 'Adresse e-mail invalide.',
    fb_too_many_requests: 'Trop de tentatives. Réessayez dans quelques minutes.',

    // PWA / offline
    offline: 'Hors ligne',
    update_available: 'Une nouvelle version est disponible.',
    update_apply: 'Mettre à jour',
  },

  nl: {
    loading: 'Laden…',
    login_sub: 'Meld u aan om uw ophalingen te volgen.',
    login_note: 'Uw gegevens worden opgeslagen in de cloud.',
    btn_google: 'Doorgaan met Google',
    btn_signin: 'Aanmelden',
    btn_register: 'Account aanmaken',
    btn_forgot: 'Wachtwoord vergeten?',
    tab_login: 'Aanmelden',
    tab_register: 'Account aanmaken',
    lbl_email: 'E-mailadres',
    lbl_password: 'Wachtwoord',
    lbl_password_confirm: 'Bevestig wachtwoord',
    placeholder_pwd_new: 'minimum 8 tekens',
    placeholder_pwd: '••••••••',

    setup_title: 'Configureer<br/><span class="hl">uw huishouden</span>',
    setup_sub: 'Enkele gegevens om uw jaarlijkse quota en belasting te berekenen op basis van het Rixensart-tarief 2026.',
    l_persons: 'Aantal personen in het huishouden',
    btn_start: 'Begin opvolging →',

    yr_lbl: p => `Overzicht 2026 — ${p} pers.`,
    lbl_settings: 'Instellingen',
    lbl_current_cost: 'Lopende meerkosten',
    forfait_line: (f, t) => `+ forfait ${f} € · totaal ${t}`,
    lbl_residuel: 'Restafval',
    lbl_organique: 'Organisch',
    lbl_levees: 'Ophalen',
    lbl_poids: 'Gewicht',
    lbl_projection: 'Prognose einde jaar',
    lbl_proj_cost: 'Geraamde totale kost',
    lbl_proj_over: 'Waarvan meerkosten',
    lbl_proj_nl: 'Resterende ⬛ ophalen',
    lbl_proj_vl: 'Resterende 🟩 ophalen',
    fnote_ok: (days, f) => `Prognose gebaseerd op ${days} dagen gegevens. Totale kost = forfait ${f} € + geschatte meerkosten einde december.`,
    fnote_unreliable: 'Meer dan 14 dagen gegevens zijn nodig voor een betrouwbare prognose.',
    epuisees: 'opgebruikt',
    levee: '1 ophaling',

    lbl_chart: 'Maandelijkse evolutie',
    chart_residuel: 'Restafval (kg)',
    chart_organique: 'Organisch (kg)',
    chart_quota_n: 'Quota restafval',
    chart_quota_v: 'Quota organisch',

    lbl_info: 'Nuttige informatie',
    prime_title: 'Aanvraag premie / afwijking',
    prime_sub: 'Kinderen < 2 jaar, medische reden — rixensart.be',
    taxe_title: 'Berekening van de belasting',
    taxe_sub: 'Volledig tarief 2026 — aangepast aan uw huishouden',

    lbl_add: 'Ophalingen registreren',
    lbl_date: 'Datum van ophaling',
    lbl_kg: 'Gewicht (kg, optioneel)',
    lbl_type: 'Type container',
    rlbl_noir: 'Restafval',
    rlbl_vert: 'Organisch',
    lbl_hint: 'Elke registratie = 1 ophaling.',
    btn_add: '+ Toevoegen',

    lbl_history: 'Geschiedenis',
    filt_all: 'Alle',
    filt_noir: 'Restafval',
    filt_vert: 'Organisch',
    lbl_empty: 'Geen ophaling geregistreerd.<br/>Voeg uw eerste ophaling hierboven toe.',

    lbl_back: 'Terug',
    info_title: 'Berekening afvalbelasting 2026',
    info_sub: 'Gemeente Rixensart — Containers met chip',
    info_personal: persons => `Voor uw huishouden van <strong>${persons} ${persons===1?'persoon':'personen'}</strong> bedraagt het jaarlijkse forfait <strong>${FORFAITS_FR[Math.min(persons,5)]} €</strong>.`,
    th_forfait: 'Jaarlijkse forfaitaire belasting (voor iedereen verschuldigd)',
    th_included: 'Minimale dienst inbegrepen in het forfait',
    th_extra: 'Proportionele tarieven (boven de minimale dienst)',
    th_type: 'Type', th_levees: 'Ophalen inbegrepen', th_poids: 'Gewicht inbegrepen',
    th_noir_lev: '⬛ Extra ophalen',
    th_noir_kg: '⬛ Extra gewicht (per inwoner/jaar)',
    th_vert_lev: '🟩 Extra ophalen',
    th_vert_kg: '🟩 Extra gewicht',
    info_note: 'De tarieven zijn van toepassing voor het jaar 2026. De forfaitaire belasting is verschuldigd ongeacht het verbruik. Bij verhuizing tijdens het jaar wordt de belasting pro rata berekend.',

    lbl_modal_title: 'Instellingen',
    lbl_modal_persons: 'Aantal personen',
    lbl_lang: 'Langue / Language / Taal',
    btn_cancel: 'Annuleren',
    btn_save: 'Opslaan',
    lbl_danger: 'Gevaarzone',
    btn_logout: 'Afmelden',
    btn_reset: 'Alle gegevens wissen',

    confirm_delete_entry: 'Deze ophaling verwijderen?',
    confirm_delete_entry_yes: 'Verwijderen',
    confirm_reset: 'Alle ophalingen wissen? Onomkeerbare actie.',
    confirm_reset_yes: 'Alles wissen',

    login: 'Aanmelden',
    logout_toast: 'Afgemeld',
    login_toast: 'Aangemeld ✓',
    cancel_toast: 'Aanmelding geannuleerd',
    added_toast: 'Ophaling geregistreerd ✓',
    deleted_toast: 'Verwijderd',
    saved_toast: 'Instellingen opgeslagen ✓',
    reset_toast: 'Gegevens gewist',
    reset_email_toast: 'Reset e-mail verzonden ✓',
    error_generic: 'Er is een fout opgetreden. Probeer opnieuw.',
    error_offline: 'Offline — uw wijzigingen worden gesynchroniseerd.',
    error_network: 'Netwerkfout. Controleer uw verbinding.',

    err_date_required: 'Datum verplicht.',
    err_kg_negative: 'Gewicht kan niet negatief zijn.',
    err_kg_too_high: 'Ongeldig gewicht (max 200 kg).',
    err_date_future: 'Datum mag niet in de toekomst liggen.',
    err_date_too_old: 'Datum te oud.',
    err_date_invalid: 'Ongeldige datum.',
    err_type_invalid: 'Ongeldig containertype.',
    err_fields_required: 'Vul alle velden in.',
    err_pwd_mismatch: 'Wachtwoorden komen niet overeen.',
    err_pwd_short: 'Wachtwoord moet minstens 6 tekens bevatten.',
    err_email_for_reset: 'Voer uw e-mail in om de resetlink te ontvangen.',

    fb_user_not_found: 'Geen account gevonden met dit e-mailadres.',
    fb_wrong_password: 'Onjuist wachtwoord.',
    fb_invalid_credential: 'E-mail of wachtwoord onjuist.',
    fb_email_in_use: 'Dit e-mailadres is al in gebruik.',
    fb_weak_password: 'Wachtwoord moet minstens 6 tekens bevatten.',
    fb_invalid_email: 'Ongeldig e-mailadres.',
    fb_too_many_requests: 'Te veel pogingen. Probeer over enkele minuten opnieuw.',

    offline: 'Offline',
    update_available: 'Een nieuwe versie is beschikbaar.',
    update_apply: 'Bijwerken',
  },

  en: {
    loading: 'Loading…',
    login_sub: 'Sign in to track your collections.',
    login_note: 'Your data is saved in the cloud and accessible from any device.',
    btn_google: 'Continue with Google',
    btn_signin: 'Sign in',
    btn_register: 'Create account',
    btn_forgot: 'Forgot password?',
    tab_login: 'Sign in',
    tab_register: 'Create account',
    lbl_email: 'Email address',
    lbl_password: 'Password',
    lbl_password_confirm: 'Confirm password',
    placeholder_pwd_new: 'minimum 8 characters',
    placeholder_pwd: '••••••••',

    setup_title: 'Set up<br/><span class="hl">your household</span>',
    setup_sub: 'A few details to calculate your annual quotas and tax based on the Rixensart 2026 rates.',
    l_persons: 'Number of people in the household',
    btn_start: 'Start tracking →',

    yr_lbl: p => `2026 overview — ${p} pers.`,
    lbl_settings: 'Settings',
    lbl_current_cost: 'Current surcharge',
    forfait_line: (f, t) => `+ flat fee ${f} € · total ${t}`,
    lbl_residuel: 'Residual',
    lbl_organique: 'Organic',
    lbl_levees: 'Collections',
    lbl_poids: 'Weight',
    lbl_projection: 'Year-end projection',
    lbl_proj_cost: 'Projected total cost',
    lbl_proj_over: 'Of which surcharge',
    lbl_proj_nl: '⬛ collections remaining',
    lbl_proj_vl: '🟩 collections remaining',
    fnote_ok: (days, f) => `Projection based on ${days} days of data. Total cost = flat fee ${f} € + estimated surcharges by year-end.`,
    fnote_unreliable: 'More than 14 days of data are needed for a reliable projection.',
    epuisees: 'used up',
    levee: '1 collection',

    lbl_chart: 'Monthly evolution',
    chart_residuel: 'Residual (kg)',
    chart_organique: 'Organic (kg)',
    chart_quota_n: 'Residual quota',
    chart_quota_v: 'Organic quota',

    lbl_info: 'Useful information',
    prime_title: 'Request a rebate / exemption',
    prime_sub: 'Children under 2, medical reason — rixensart.be',
    taxe_title: 'Understanding the tax',
    taxe_sub: 'Full 2026 schedule — adapted to your household',

    lbl_add: 'Log a collection',
    lbl_date: 'Collection date',
    lbl_kg: 'Weight (kg, optional)',
    lbl_type: 'Container type',
    rlbl_noir: 'Residual',
    rlbl_vert: 'Organic',
    lbl_hint: 'Each entry = 1 collection.',
    btn_add: '+ Add',

    lbl_history: 'History',
    filt_all: 'All',
    filt_noir: 'Residual',
    filt_vert: 'Organic',
    lbl_empty: 'No collections logged yet.<br/>Add your first one above.',

    lbl_back: 'Back',
    info_title: 'Waste tax calculation 2026',
    info_sub: 'Rixensart municipality — Smart bins',
    info_personal: persons => `For your household of <strong>${persons} ${persons===1?'person':'people'}</strong>, the annual flat fee is <strong>${FORFAITS_FR[Math.min(persons,5)]} €</strong>.`,
    th_forfait: 'Annual flat fee (owed by everyone)',
    th_included: 'Minimum service included in the flat fee',
    th_extra: 'Proportional rates (beyond the minimum service)',
    th_type: 'Type', th_levees: 'Collections included', th_poids: 'Weight included',
    th_noir_lev: '⬛ Additional collections',
    th_noir_kg: '⬛ Additional weight (per inhabitant/year)',
    th_vert_lev: '🟩 Additional collections',
    th_vert_kg: '🟩 Additional weight',
    info_note: 'Rates apply for 2026. The flat fee is due regardless of consumption. In case of a move during the year, the tax is calculated pro rata.',

    lbl_modal_title: 'Settings',
    lbl_modal_persons: 'Number of people',
    lbl_lang: 'Langue / Language / Taal',
    btn_cancel: 'Cancel',
    btn_save: 'Save',
    lbl_danger: 'Danger zone',
    btn_logout: 'Sign out',
    btn_reset: 'Delete all data',

    confirm_delete_entry: 'Delete this collection?',
    confirm_delete_entry_yes: 'Delete',
    confirm_reset: 'Delete all collections? This cannot be undone.',
    confirm_reset_yes: 'Delete all',

    login: 'Sign in',
    logout_toast: 'Signed out',
    login_toast: 'Signed in ✓',
    cancel_toast: 'Sign-in cancelled',
    added_toast: 'Collection logged ✓',
    deleted_toast: 'Entry deleted',
    saved_toast: 'Settings saved ✓',
    reset_toast: 'Data cleared',
    reset_email_toast: 'Password reset email sent ✓',
    error_generic: 'An error occurred. Please try again.',
    error_offline: 'Offline — your changes will be synced later.',
    error_network: 'Network error. Check your connection.',

    err_date_required: 'Date required.',
    err_kg_negative: 'Weight cannot be negative.',
    err_kg_too_high: 'Invalid weight (max 200 kg).',
    err_date_future: 'Date cannot be in the future.',
    err_date_too_old: 'Date too old.',
    err_date_invalid: 'Invalid date.',
    err_type_invalid: 'Invalid container type.',
    err_fields_required: 'Please fill in all fields.',
    err_pwd_mismatch: 'Passwords do not match.',
    err_pwd_short: 'Password must be at least 6 characters.',
    err_email_for_reset: 'Enter your email to receive the reset link.',

    fb_user_not_found: 'No account found with this email.',
    fb_wrong_password: 'Incorrect password.',
    fb_invalid_credential: 'Invalid email or password.',
    fb_email_in_use: 'This email is already in use.',
    fb_weak_password: 'Password must be at least 6 characters.',
    fb_invalid_email: 'Invalid email address.',
    fb_too_many_requests: 'Too many attempts. Try again in a few minutes.',

    offline: 'Offline',
    update_available: 'A new version is available.',
    update_apply: 'Update',
  },
};

const FORFAITS_FR = { 1:70, 2:105, 3:140, 4:181, 5:181 };

let currentLang = 'fr';

export function setLang(lang) {
  if (T[lang]) currentLang = lang;
}

export function getLang() {
  return currentLang;
}

export function t(key, ...args) {
  const value = T[currentLang]?.[key] ?? T.fr[key] ?? key;
  return typeof value === 'function' ? value(...args) : value;
}

export function monthName(monthIndex) {
  return MONTHS[currentLang]?.[monthIndex] ?? MONTHS.fr[monthIndex];
}

/** Maps Firebase auth error codes to translation keys. */
export function firebaseErrorKey(code) {
  const map = {
    'auth/user-not-found': 'fb_user_not_found',
    'auth/wrong-password': 'fb_wrong_password',
    'auth/invalid-credential': 'fb_invalid_credential',
    'auth/email-already-in-use': 'fb_email_in_use',
    'auth/weak-password': 'fb_weak_password',
    'auth/invalid-email': 'fb_invalid_email',
    'auth/too-many-requests': 'fb_too_many_requests',
    'auth/network-request-failed': 'error_network',
  };
  return map[code] || 'error_generic';
}
