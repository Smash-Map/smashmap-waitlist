# Site de la liste d'attente — mode d'emploi

Deux pages, le même site : `index.html` (anglais, la page par défaut) et
`fr/index.html` (français, sur `smashmap.app/fr/`). Le sélecteur EN/FR en haut à
droite bascule d'une page à l'autre ; pas de redirection automatique.
Les liens de bio français pointent donc sur `/fr/`.

Mis à jour le 18/10/2026 : domaine `smashmap.app`, version anglaise, police servie
depuis le site, image de partage, formulaire branché sur Supabase.
Puis, le même jour : les téléphones de la page d'accueil montrent les **vraies
captures de l'app** (`img/app-carte*.jpg`, `img/app-fil*.jpg`, sorties de
`09-captures-app/`), et la vidéo est devenue **SMASHMAP POCKET**
(`video/arcade-fr.mp4` et `arcade-en.mp4`). La vidéo de la série est archivée dans
`06-archives/2026-10-18_site-avant-supabase/video-serie/`.

## 1. Mettre en ligne (Vercel)

Les réglages de build sont dans `vercel.json` (`node env.mjs`, sortie `.`) ;
`.vercelignore` garde `.env` hors ligne.

1. Depuis `waitlist/` : `npx vercel` (connexion, puis « Set up and deploy » :
   nouveau projet `smashmap-waitlist`, dossier `./`, ne pas modifier les réglages).
2. Variables : `npx vercel env add SUPABASE_URL` puis `npx vercel env add SUPABASE_ANON_KEY`
   (environnements Production et Preview), ou dans le dashboard,
   **Settings > Environment Variables**.
3. Mise en ligne : `npx vercel --prod`. À refaire après chaque modification.
4. Domaine : **Settings > Domains** → `smashmap.app`, puis chez Infomaniak (zone DNS)
   l'enregistrement indiqué par Vercel (`A` sur la racine, `CNAME` pour `www`).
   Le HTTPS se fait tout seul.

Rien d'autre à installer : la police est dans `fonts/`, aucun appel à Google,
aucun traceur, aucune dépendance externe.

## 2. Supabase : le formulaire crée le compte

Le formulaire inscrit directement dans **le projet Supabase de l'app** (branche
`main`, la prod) : e-mail + mot de passe, comme l'inscription dans l'app.
Supabase envoie l'e-mail de confirmation. Le jour J, l'inscrit se connecte dans
l'app avec son e-mail et son mot de passe, puis choisit son nom d'utilisateur
(unique). Un e-mail déjà inscrit est signalé, rien n'est doublé.

**Les bandes** : chaque inscrit reçoit un code tiré au hasard (son lien
`?b=CODE`). S'inscrire par le lien de quelqu'un = vous vous suivez
mutuellement dans l'app. Le code est un secret : avoir le lien, c'est être
invité. Règles : `apps/api/db/schema/crews`.

**Configuration** — le site a son propre `.env` :

1. `cp .env.example .env`, remplir `SUPABASE_URL` et `SUPABASE_ANON_KEY`
   (les mêmes que `apps/mobile/.env`).
2. `node env.mjs` → génère `env.js`, lu par les deux pages. À relancer après
   chaque changement de `.env` (sur Vercel, le build le fait).
3. Sans `env.js` (ou vide), le site tourne en **mode démo** : rien n'est envoyé.

`.env` et `env.js` sont ignorés par git. La clé anon est publique par nature
(elle finit dans la page), la sécurité reste dans les règles RLS.

**Ce qui part dans le compte** (`raw_user_meta_data`) : `source` (`ig`, `tt`,
`direct`…), `lang`, `crew_code` et `crew_ref`. Le champ piège à
robots (`website`) n'envoie rien.

Taille des bandes (SQL editor) :

```sql
select c.code, count(f.*) + 1 as membres
from public.crew_codes c
join public.follows f on f.followed_id = c.user_id
join auth.users u on u.id = f.follower_id and u.raw_user_meta_data->>'crew_ref' = c.code
group by 1 order by 2 desc;
```

**À régler côté Supabase avant la campagne :**

- **Limite anti-spam** : `pnpm --filter @smashmap/api auth:limits` (depuis la racine
  du dépôt, avec `SUPABASE_URL` + `SUPABASE_ACCESS_TOKEN` du projet visé) → 10
  inscriptions max par IP toutes les 5 minutes, appliqué par Supabase. La clé anon
  étant publique, c'est cette limite qui protège la base, pas le site. Le formulaire
  ajoute un garde-fou (3 envois par navigateur toutes les 10 minutes), contournable.
- **SMTP perso** (Authentication → Emails → SMTP) : le SMTP intégré de Supabase
  n'envoie que quelques e-mails par heure, au-delà le formulaire répond « réessaie
  dans quelques minutes ».
- **Redirect URLs** (Authentication → URL Configuration) : ajouter
  `https://smashmap.app/**`, sinon le lien de l'e-mail renvoie vers la Site URL.
- Optionnel : un modèle d'e-mail SmashMap pour la confirmation
  (`apps/api/supabase/templates`, poussé par `auth:emails`).

Le compteur public « X bandes déjà formées » n'est pas branché : la phrase fixe
reste, jamais de faux chiffre.

## 3. Ce qui reste à compléter

- **Mentions légales** : la ligne « Éditeur » est masquée tant que la SAS n'a pas de SIREN.
  Dès qu'il arrive : `EDITEUR: "SMASHMAP SAS, <adresse>, SIREN 000 000 000"` dans `CONFIG`,
  la ligne réapparaît toute seule. À faire dans les deux fichiers.
- **Adresse de contact** : `contact@smashmap.app` doit exister (alias chez le registrar
  ou boîte Google Workspace) avant la première campagne.
- **Région Supabase** : les mentions annoncent « région Union européenne ». Si le projet
  est hébergé ailleurs, corriger la phrase dans les deux fichiers.
- **Mentions légales** (obligatoires, LCEN art. 6) : hébergeur = Vercel (site),
  Infomaniak (domaine et e-mail). Si les rôles sont différents, corriger la ligne
  dans les deux fichiers.

## 3 bis. Changer les captures ou la vidéo

Les captures d'app viennent de `09-captures-app/ecrans-hd/`, réduites à 620 px de
large. Pour en mettre d'autres : même traitement, même nom de fichier, et la page
suit. La vidéo se remplace de la même façon dans `video/` — penser à changer aussi
l'image `poster` dans les deux `index.html`.

## 4. Les bandes

Chaque inscrit reçoit un lien `?b=CODE`. Toute personne qui s'inscrit avec ce lien
rejoint la même bande. Les 50 premières bandes de 4 personnes et plus deviennent
fondatrices (badge dans l'app). La ligne à surveiller : la part des inscriptions
arrivées par un lien de bande — cible, plus de 50 %.

## 5. Liens à mettre en bio

- Instagram : `https://smashmap.app/?src=ig` (en français : `https://smashmap.app/fr/?src=ig`)
- TikTok : `https://smashmap.app/?src=tt` (en français : `https://smashmap.app/fr/?src=tt`)

Le site reconnaît aussi tout seul les visiteurs qui ouvrent la page depuis l'app
Instagram ou TikTok.

## 6. Si le texte change

Les deux fichiers sont indépendants : **toute modification de texte doit être faite
dans `index.html` et dans `fr/index.html`**. Le script qui a servi à générer la version
anglaise est rangé dans `06-archives/2026-10-18_site-avant-supabase/` (il écrase les
fichiers, ne pas le relancer sans prévenir).
