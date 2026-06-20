# Deployment — One-Time Setup

These steps are performed once. After they're done, every push to `main`
deploys automatically.

---

## 1. Create the deploy user on the VPS

```bash
# On the server, as root or a sudo user
adduser deploy --disabled-password --gecos ""
usermod -aG docker deploy        # must be able to run docker without sudo
```

---

## 2. Generate an SSH key pair for CI

Run this **locally** (not on the server):

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/serve_os_deploy -N ""
```

Copy the public key to the server:

```bash
ssh-copy-id -i ~/.ssh/serve_os_deploy.pub deploy@<YOUR_SERVER_IP>
```

Test it:

```bash
ssh -i ~/.ssh/serve_os_deploy deploy@<YOUR_SERVER_IP> "echo ok"
```

---

## 3. Add GitHub Secrets

Go to **GitHub → Repository → Settings → Secrets and variables → Actions → Secrets**
and add:

| Secret name  | Value |
|--------------|-------|
| `SSH_HOST`   | Your server's IP or hostname |
| `DEPLOY_USER`| `deploy` (or whatever user you created) |
| `SSH_KEY`    | Contents of `~/.ssh/serve_os_deploy` (the **private** key) |
| `GHCR_TOKEN` | A GitHub PAT with **`read:packages`** scope — see step 5 |

---

## 4. Add the GitHub Variable

Go to **GitHub → Repository → Settings → Secrets and variables → Actions → Variables**
and add:

| Variable name       | Value |
|---------------------|-------|
| `VITE_API_BASE_URL` | The public URL of your backend API, e.g. `https://api.yourdomain.com/api` |

This is public (shipped to the browser bundle), so a Variable — not a Secret — is appropriate.

---

## 5. Create a GHCR Personal Access Token

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**
   (or classic tokens with `read:packages` scope).
2. Grant **`read:packages`** (classic) or the equivalent repo package read permission
   (fine-grained).
3. Copy the token value and add it as the `GHCR_TOKEN` secret in step 3.

The CI workflow uses your `GITHUB_TOKEN` (automatic) to **push** the image.
The server uses `GHCR_TOKEN` (your PAT) to **pull** it at deploy time.

---

## 6. Create the deploy directory on the server

```bash
# On the server
mkdir -p /opt/serve-os
chown deploy:deploy /opt/serve-os
```

---

## 7. Create `.env.production` on the server

```bash
# On the server, as the deploy user (or root + chown)
cat > /opt/serve-os/.env.production <<'EOF'
API_BASE_URL=https://api.yourdomain.com/api
EOF
```

`VITE_API_BASE_URL` is baked into the Docker image at build time (via the
GitHub Variable) and is **not** needed here. Only `API_BASE_URL` — the
runtime backend URL read by the Nitro SSR server — belongs in this file.

---

## 8. Push to `main` to trigger the first deploy

```bash
git push origin main
```

The workflow will:
1. Run Biome check + Vitest (gate).
2. Build the Docker image with `VITE_API_BASE_URL` baked in, push it to
   `ghcr.io/albertbarsegyan/serve-os:latest` and `:<sha>`.
3. Copy `docker-compose.prod.yml` to `/opt/serve-os/` on the server.
4. SSH in, `docker login` to GHCR, `docker compose pull`, `docker compose up -d`,
   and prune old images.

---

## Network note

If your backend runs in Docker on the same server and is on a different
Compose network, update `API_BASE_URL` in `.env.production` to use the
container name/network alias instead of `localhost`.

Example: if the backend exposes itself as `serve_os_app_dev` on an
`serve_os_shared` network, add `external: true` to that network block in
`docker-compose.prod.yml` and set:

```
API_BASE_URL=http://serve_os_app_dev:4000/api
```
