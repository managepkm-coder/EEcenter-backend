# EE Up Battery 캠핑카 업그레이드 센터 홈페이지

Korea BTS · EE Up Battery 의 정보 전달용 홈페이지입니다. 캠카(campcar-backend)와 같은 방식으로 만들었습니다.

| | |
| --- | --- |
| 서버 | Node.js 24 · Express 5 — 화면과 데이터(`/api/*`)를 서버 하나가 내보냅니다 |
| 데이터베이스 | SQLite — `data/upgrade.db` 파일 하나. SQL 을 직접 쓰고 ORM 은 없습니다 |
| 화면 | HTML · CSS · JavaScript · Bootstrap 5 (프레임워크 · 빌드 없음) |
| 운영 | nginx · PM2 · 카페24 |

DB 를 쓰는 곳은 **견적 및 상담 문의 · 작업 예약 신청** 두 폼뿐입니다. 접수 내용은 `/admin`(비밀번호)에서 봅니다.
나머지 화면은 모두 정보 화면입니다.

## 실행

```bash
cp .env.example .env      # ADMIN_PASSWORD 를 채운다
npm install
npm run dev               # 개발 — 화면 · 코드를 고치면 바로 반영
npm start                 # 운영
npm run check             # 모든 화면을 그려보고 빈 표시 · 죽은 링크를 찾는다
npm run export            # 오프라인 미리보기 — ./offline 폴더의 index.html 을 서버 없이 연다(접수는 안 됨)
```

브라우저에서 http://127.0.0.1:3300 을 엽니다.

## 폴더

```
src/
  content/site.js      회사 정보 · 메뉴 · 서비스 · FAQ · 공지 · 시공 사례 — 글 대부분을 여기서 고친다
  views/layout.html    모든 화면의 뼈대(머리말 · 바닥글은 서버가 끼운다)
  views/pages/*.html   화면 본문. 첫 줄 <!--meta {...}--> 에 제목 · 설명
  render.js            화면 조립. <!--=이름--> 자리에 목록을, {{이름}} 자리에 회사 정보를 넣는다
  pages.js             주소 → 화면 목록(여기 적힌 주소만 열린다 · sitemap.xml 도 여기서)
  routes · controllers · models · db   문의 접수와 관리
public/assets/         CSS · 스크립트 · 그림
deploy/nginx.conf.example
ecosystem.config.js    PM2
```

### 자주 하는 일

- **전화번호 · 주소 바꾸기** — `src/content/site.js` 의 `company`. 머리말 · 바닥글 · 오시는 길 · 폼 안내가 함께 바뀝니다.
- **메뉴 바꾸기** — 같은 파일의 `nav`. 머리말 · 전체메뉴가 함께 바뀝니다. 새 화면이면 `src/pages.js` 에도 한 줄.
- **공지 올리기** — `notices` 에 `{ date, title, body }` 를 더합니다.
- **시공 사례 올리기** — 사진을 `public/assets/images/` 에 넣고 `gallery` 에 `{ title, service, vehicle, image }` 를 더합니다.
  `before`·`after` 를 주면 Before & After 칸에, `featured: true` 면 이달의 튜닝에 섭니다.
- **사진 자리 채우기** — 인사말 · 시설안내의 `photo-slot` 을 `<img>` 로 바꿉니다(파일 안에 주석이 있습니다).

## 카페24 서버에 올리기

**처음 받은 빈 서버라면 [deploy/SERVER.md](deploy/SERVER.md) 를 위에서부터 따라 하세요**(Node · nginx 설치부터 HTTPS · 방화벽까지). 아래는 이미 준비된 서버의 요약입니다.

```bash
cd /root/www && git clone https://github.com/managepkm-coder/EEcenter-backend.git ee-upbattery && cd ee-upbattery
cp .env.example .env && vi .env                       # ADMIN_PASSWORD · SITE_URL
npm ci --omit=dev
pm2 start ecosystem.config.js && pm2 save
# nginx: deploy/nginx.conf.example 을 /etc/nginx/sites-available/ 에 두고 server_name 을 바꾼 뒤
ln -s /etc/nginx/sites-available/ee-upbattery /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d <도메인>                            # HTTPS — /admin 비밀번호가 평문으로 오가지 않게
```

- 포트 3300 · 127.0.0.1 로만 받습니다(캠카 3000 · MRJBJ 3100 · koreabts 3200/3201 과 겹치지 않게).
- Node 22.5 이상이 필요합니다(`node:sqlite`). Node 22 에서는 실행할 때 SQLite 시험 기능 경고가 한 줄 찍히는데 정상입니다.
- 백업할 것은 `data/upgrade.db` 와 `.env` 뿐입니다.
