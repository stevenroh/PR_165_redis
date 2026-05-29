# PR_165_redis

## Objectif

Analyser l'utilisation de Redis pour une base de données de chat :

**Aperçu des types de données**
Redis propose plusieurs types de données adaptés à différents besoins. Dans le cadre d'une chatbox, trois types sont particulièrement pertinents : les *Lists* pour stocker des séquences ordonnées de messages, les *Sets* pour gérer des collections sans doublons comme les rooms disponibles, et les *Strings* pour des valeurs simples comme des compteurs.

**Stocker les rooms existantes**
Les rooms sont stockées dans un *Set* Redis sous la clé `rooms`. Le Set garantit l'unicité de chaque room et permet une vérification d'existence en O(1). Chaque room est ajoutée via `SADD rooms "general"` et la liste complète est récupérée avec `SMEMBERS rooms`. Le Set est idéal ici car l'ordre des rooms n'a pas d'importance et on ne veut pas de doublons.

**Stocker le nombre d'utilisateurs connectés**
Le compteur de connectés par room est stocké dans une *String* numérique sous la clé `connected:{roomName}`. Redis permet d'incrémenter (`INCR connected:general`) et décrémenter (`DECR connected:general`) ce compteur de façon **atomique**, ce qui garantit un résultat correct même si plusieurs utilisateurs se connectent ou se déconnectent simultanément. Le compteur est remis à 0 si la valeur devient négative, afin d'éviter un état incohérent.

**Stocker les messages**
Les messages de chaque room sont stockés dans une *List* sous la clé `room:{roomName}:messages`. Les messages sont insérés en tête de liste via `LPUSH`, ce qui permet de récupérer les plus récents en premier avec `LRANGE`. La liste est limitée à 200 entrées via `LTRIM` et expire automatiquement après 24h grâce à un TTL (`EXPIRE`), garantissant que les données restent éphémères sans intervention manuelle.

**Diffuser les messages en temps réel (Pub/Sub)**
En parallèle du stockage, chaque message est publié sur un canal Pub/Sub via `PUBLISH chat:{roomName}`. Les clients connectés au chat s'abonnent à ce canal via `SUBSCRIBE chat:{roomName}` et reçoivent les nouveaux messages instantanément, sans avoir à interroger Redis périodiquement.

**Différence entre List et Pub/Sub pour les messages**
Ces deux mécanismes sont complémentaires et remplissent des rôles opposés :

| | List (`room:x:messages`) | Pub/Sub (`chat:x`) |
|---|---|---|
| **Persistance** | Oui, stocké en mémoire Redis | Non, éphémère |
| **Usage** | Historique pour les nouveaux arrivants | Diffusion temps réel aux connectés |
| **Si personne n'écoute** | Le message est conservé | Le message est perdu |
| **Lecture** | `LRANGE` à la demande | Réception automatique via `SUBSCRIBE` |
| **TTL** | Oui, 24h | Sans objet |

Concrètement, quand un utilisateur envoie un message, les deux sont utilisés simultanément via un pipeline : la *List* garantit que les nouveaux arrivants voient l'historique en chargeant les derniers messages, tandis que le *Pub/Sub* notifie en temps réel les utilisateurs déjà connectés sans qu'ils aient besoin de recharger la page.