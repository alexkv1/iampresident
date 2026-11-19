# Deployment

CI/CD mirrors the `yuz` pipeline: **push to `main` → GitHub Actions → `rsync` over
SSH to the VM → build `conf.php` on the VM from secrets → restart services.**

The workflow is [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## What happens on every push to `main`

1. `rsync` the repo to `runner@VM:/home/runner/iampresident` (excludes `.git`,
   `conf.php`, `node_modules`).
2. `sudo rsync` into `/var/www/iampresident` (the VM's `conf.php` and
   `node_modules` are preserved).
3. **Build `/var/www/iampresident/conf.php`** via `sudo tee` from GitHub secrets.
4. Write `/var/www/iampresident/deploy/realtime.env` (Node's `INTERNAL_KEY`, kept
   in sync with `conf.php`).
5. `npm install --omit=dev`, `chown` to `www-data`, and
   `systemctl restart iampresident-realtime iampresident-tick`.

Apache serves `/var/www/iampresident/public`; the engine (`utils/`, `worker/`,
`realtime/`) and `conf.php` live outside the web root.

---

## GitHub secrets (Settings → Secrets and variables → Actions)

| Secret | Example | Notes |
|--------|---------|-------|
| `SSH_KEY` | *(ed25519 private key)* | Deploy key; its public half goes in the VM's `runner` authorized_keys |
| `MAIN_IP` | `203.0.113.10` | VM host / IP |
| `DB_HOST` | `127.0.0.1` | On a Linux VM, TCP to localhost works (no socket quirk) |
| `DB_USER` | `iampresident` | |
| `DB_PASS` | `…` | ⚠️ avoid single quotes (values are wrapped in `'…'` in `conf.php`) |
| `DB_NAME` | `iampresident` | |
| `INTERNAL_KEY` | *(long random string)* | Shared by PHP ↔ Node for `/emit` and `/api/tick/run`; make it alphanumeric |
| `REALTIME_WS_URL` | `wss://your.host/ws` | Public WS URL the browser connects to (Apache proxies `/ws`) |

Generate a deploy key locally:
```bash
ssh-keygen -t ed25519 -f iampresident-deploy -N ''   # private -> SSH_KEY secret
# append iampresident-deploy.pub to the VM runner's ~/.ssh/authorized_keys
```

---

## One-time VM provisioning (Ubuntu)

```bash
# 1. Packages
sudo apt update
sudo apt install -y apache2 php php-mysqli php-curl php-mbstring \
                    mysql-server nodejs npm rsync

# 2. Deploy user (matches the pipeline's runner@)
sudo adduser --disabled-password --gecos '' runner
sudo mkdir -p /home/runner/.ssh && sudo nano /home/runner/.ssh/authorized_keys  # paste deploy pubkey
sudo chown -R runner:runner /home/runner/.ssh && sudo chmod 700 /home/runner/.ssh
sudo chmod 600 /home/runner/.ssh/authorized_keys

# 3. Passwordless sudo for the deploy steps (rsync/tee/npm/systemctl)
echo 'runner ALL=(ALL) NOPASSWD: /usr/bin/rsync, /usr/bin/tee, /usr/bin/npm, /usr/bin/systemctl, /usr/bin/mkdir, /usr/bin/chown' \
  | sudo tee /etc/sudoers.d/iampresident
sudo mkdir -p /var/www/iampresident && sudo chown runner:runner /var/www/iampresident

# 4. Database (one time)
sudo mysql -e "CREATE DATABASE iampresident CHARACTER SET utf8mb4;"
sudo mysql -e "CREATE USER 'iampresident'@'localhost' IDENTIFIED BY 'CHANGE_ME';"
sudo mysql -e "GRANT ALL ON iampresident.* TO 'iampresident'@'localhost'; FLUSH PRIVILEGES;"
#   After the first deploy has placed the files, load schema + seeds:
sudo mysql iampresident < /var/www/iampresident/db/schema.sql
sudo mysql iampresident < /var/www/iampresident/db/seeds/countries.sql
sudo mysql iampresident < /var/www/iampresident/db/seeds/leaders.sql

# 5. Apache vhost + WS proxy
sudo a2enmod rewrite proxy proxy_http proxy_wstunnel
sudo cp /var/www/iampresident/deploy/apache-vhost.conf /etc/apache2/sites-available/iampresident.conf
sudo nano /etc/apache2/sites-available/iampresident.conf   # set ServerName
sudo a2ensite iampresident && sudo a2dissite 000-default && sudo systemctl reload apache2

# 6. systemd services (tick worker + WS relay)
sudo cp /var/www/iampresident/deploy/iampresident-tick.service     /etc/systemd/system/
sudo cp /var/www/iampresident/deploy/iampresident-realtime.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now iampresident-tick iampresident-realtime
```

Order note: do a first `git push` (or run the workflow) **before** step 4's schema
load and step 5/6, so the files exist at `/var/www/iampresident`. The workflow's
`systemctl restart` is a no-op until the units are installed.

---

## Verifying a deploy

```bash
# on the VM
systemctl status iampresident-tick iampresident-realtime --no-pager
curl -s http://127.0.0.1:8081/health          # {"ok":true,...}
tail -f /var/log/apache2/iampresident_error.log
```

## Schema changes

Schema/seed updates are **not** auto-applied (to avoid data loss). After a deploy
that changes `db/schema.sql`, apply the delta manually on the VM, or add a
migrations step to the workflow.

## Updating leaders in production

```bash
curl -X POST https://your.host/api/admin/setLeader \
  -H "Authorization: Bearer <INTERNAL_KEY>" \
  -d "code=USA&name=New Name&title=President"
```
