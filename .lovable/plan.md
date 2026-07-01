## Cause

L'erreur `unauthorized` de GHCR signifie l'une de ces deux choses (jamais une vraie erreur d'auth Docker) :

1. **L'image n'existe pas** à ce nom → GHCR renvoie `unauthorized` au lieu de `404` pour ne pas divulguer l'existence des repos privés.
2. **L'image existe mais le package GHCR est privé** → il faut soit le rendre public, soit `docker login ghcr.io`.

Dans ton cas le nom `ghcr.io/bordecielnas-alt/spot-on-5s` ne correspond pas à ce que le workflow publie. Le workflow utilise `${{ github.repository }}`, donc l'image publiée est :

```
ghcr.io/bordecielnas-alt/5sproject-dev:latest
```

(le nom du **repo GitHub**, pas le nom d'app Lovable `spot-on-5s`).

## Plan de résolution (aucune modif de code nécessaire)

### 1. Vérifier que le workflow a bien tourné
- Aller sur `https://github.com/bordecielnas-alt/5sproject-dev/actions`
- Confirmer qu'un run "Build & push Docker image" est passé au vert sur `main`
- Si aucun run : pousser un commit vide ou déclencher `workflow_dispatch`

### 2. Vérifier le package sur GHCR
- Aller sur `https://github.com/bordecielnas-alt?tab=packages`
- Ouvrir le package `5sproject-dev`
- **Package settings → Change visibility → Public** (sinon il faut login)

### 3. Corriger la commande docker sur le serveur
Utiliser le bon nom d'image :

```bash
docker pull ghcr.io/bordecielnas-alt/5sproject-dev:latest
```

Et dans `docker-compose.yml` sur l'hôte :

```yaml
services:
  5sproject:
    image: ghcr.io/bordecielnas-alt/5sproject-dev:latest
    container_name: 5sproject
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      TZ: "Europe/Paris"
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /mnt/user/appdata/5sproject:/data
```

### 4. Si tu préfères garder le package privé
Créer un PAT GitHub avec scope `read:packages`, puis sur l'hôte :

```bash
echo <PAT> | docker login ghcr.io -u bordecielnas-alt --password-stdin
docker compose pull && docker compose up -d
```

## Résumé

Le nom d'image correct est **`ghcr.io/bordecielnas-alt/5sproject-dev:latest`** (nom du repo GitHub), pas `spot-on-5s` (nom d'app Lovable). Rends le package GHCR public ou fais `docker login ghcr.io` avec un PAT `read:packages`.

Aucun changement de code n'est requis — veux-tu que je fasse autre chose (par ex. renommer l'image dans le workflow, ou ajouter un tag custom) ?
