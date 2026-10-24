# 새 서버에 처음 올리기

캠카와 **다른 서버**에 처음 올리는 순서입니다. 카페24 등에서 받은 Ubuntu(22.04 · 24.04) 서버를 기준으로 하고,
`root` 로 접속한 터미널에서 위에서부터 차례로 칩니다. `<도메인>` · `<서버IP>` 는 실제 값으로 바꿉니다.

이미 다른 프로그램이 도는 서버라면 ① 은 건너뛰고, ⑤ 의 nginx 설정 파일 이름이 겹치지 않는지만 봅니다.
이 사이트는 3300 포트를 쓰고 127.0.0.1 로만 받습니다(바깥에서는 nginx 를 거쳐서만 들어옵니다).

## ① 프로그램 설치 (서버마다 한 번)

```bash
apt update && apt -y upgrade
apt -y install git nginx curl
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt -y install nodejs
npm install -g pm2
node -v        # v24.x 이면 정상 (22.5 이상이어야 합니다 — node:sqlite)
```

## ② 코드 받기

```bash
mkdir -p /root/www && cd /root/www
git clone https://github.com/managepkm-coder/EEcenter-backend.git ee-upbattery
cd ee-upbattery
npm ci --omit=dev
```

저장소가 공개라 로그인 없이 받아집니다.

## ③ 설정 파일

```bash
cp .env.example .env
nano .env
```

바꿀 줄은 둘입니다.

- `ADMIN_PASSWORD=` — 관리 화면(/admin) 비밀번호. **비워두면 관리 화면이 아예 열리지 않습니다.**
- `SITE_URL=https://<도메인>` — sitemap.xml · 공유 미리보기 주소에 쓰입니다.

`.env` 는 저장소에 올라가지 않습니다. 비밀번호는 이 파일에만 있습니다.

## ④ 띄우기

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup      # 나오는 명령 한 줄을 그대로 복사해 한 번 더 칩니다 — 서버를 껐다 켜도 저절로 뜹니다
curl -s http://127.0.0.1:3300/health      # {"ok":true} 이면 정상
```

## ⑤ nginx 연결

먼저 도메인 관리 화면(가비아 · 카페24 등)에서 **A 레코드를 `<서버IP>` 로** 걸어 둡니다(반영에 몇 분~몇 시간).

```bash
cp deploy/nginx.conf.example /etc/nginx/sites-available/ee-upbattery
sed -i 's/upbattery.example.com/<도메인> www.<도메인>/' /etc/nginx/sites-available/ee-upbattery
ln -s /etc/nginx/sites-available/ee-upbattery /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default      # nginx 기본 환영 화면을 내림 — 이 서버에 다른 사이트가 없을 때만
nginx -t && systemctl reload nginx
```

이제 `http://<도메인>` 으로 열립니다.

## ⑥ HTTPS

```bash
apt -y install certbot python3-certbot-nginx
certbot --nginx -d <도메인> -d www.<도메인>
```

HTTPS 없이는 관리 화면 비밀번호가 평문으로 오갑니다. 도메인 A 레코드가 반영된 뒤에 돌립니다(아니면 인증이 실패합니다).
인증서는 certbot 이 저절로 갱신합니다.

## ⑦ 방화벽

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

**OpenSSH 줄을 빠뜨리면 서버에 다시 접속할 수 없습니다.** 반드시 그 줄부터 칩니다.

## 고친 코드를 다시 올릴 때

```bash
cd /root/www/ee-upbattery
git pull
npm ci --omit=dev        # package.json 이 바뀌었을 때만 필요하지만, 매번 쳐도 됩니다
pm2 restart ee-upbattery
```

## 확인 · 문제가 생겼을 때

- `pm2 logs ee-upbattery --lines 50` — 서버 기록
- `pm2 status` — 떠 있는지
- 502 Bad Gateway 가 뜨면 앱이 내려가 있는 것입니다 → `pm2 restart ee-upbattery` 후 로그를 봅니다.

## 백업

남겨야 할 것은 `data/upgrade.db`(문의 · 예약 접수)와 `.env` 둘뿐입니다. 나머지는 저장소에서 다시 받으면 됩니다.
