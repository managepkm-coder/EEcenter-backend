#!/bin/bash
#
# 서버가 스스로 GitHub 을 확인해서 새 커밋이 있으면 받아 재시작한다(2026-11-15 요청 — "맨날 이렇게 반영해야 해? 자동으로 해줘").
# cron 이 5분마다 부른다(설치 방법은 이 파일 맨 아래).
#
#   GitHub 에 올라감  →  5분 안에 서버가 알아서 반영
#
# 캠카 서버의 scripts/auto-deploy.sh 와 같은 방식이다. 사람이 확인하고 반영하던 단계가 없어지므로 두 가지를 둔다.
#
#   ① 멈춤 스위치 — .no-deploy 파일이 있으면 아무것도 하지 않는다. 손댈 게 있어 잠시 멈추고 싶을 때.
#   ② 되돌리기 — 재시작 뒤 /health 가 응답하지 않으면 직전 커밋으로 되돌리고 다시 띄운다.
#      사이트가 뜨지 않는 커밋이 나가도 손님은 이전 화면을 그대로 본다.
#
# 값은 환경 변수로 바꿀 수 있다 — 기본값이 이 서버(ibizinfo1)의 실제 자리다. 시험할 때만 바꿔 부른다.

set -u

APP_DIR=${APP_DIR:-/var/www/ee-upbattery}
BRANCH=${BRANCH:-main}
PM2_NAME=${PM2_NAME:-ee-upbattery}
HEALTH_URL=${HEALTH_URL:-http://127.0.0.1:3300/health}
LOCK_DIR=${LOCK_DIR:-/tmp/ee-upbattery-deploy.lock}
LOG_FILE=${LOG_FILE:-/var/log/ee-upbattery-deploy.log}
LOG_MAX_BYTES=1000000

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# 앞선 배포가 아직 돌고 있으면 건너뛴다. npm ci 가 길어지면 두 배포가 같은 폴더를 동시에 건드릴 수 있다.
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  exit 0
fi
trap 'rmdir "$LOCK_DIR" 2>/dev/null' EXIT

cd "$APP_DIR" || { log "폴더를 찾을 수 없음: $APP_DIR"; exit 1; }

# 멈춤 스위치.
[ -f "$APP_DIR/.no-deploy" ] && exit 0

git fetch origin "$BRANCH" --quiet 2>/dev/null || { log "git fetch 실패 (네트워크?)"; exit 1; }

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")

# 새 커밋이 없으면 조용히 끝낸다. 5분마다 도는 작업이라 로그를 남기지 않는다.
[ "$LOCAL" = "$REMOTE" ] && exit 0

# 한 번 되돌린 커밋은 다시 시도하지 않는다. 그대로 두면 5분마다 같은 커밋을 받아 재시작 → 되돌리기를 되풀이해
# 그때마다 사이트가 20초쯤 끊긴다(시험하다 확인함). 그 뒤에 새 커밋이 올라오면(고친 것) 그때 다시 받는다.
FAILED_FILE="$APP_DIR/.deploy-failed"
[ -f "$FAILED_FILE" ] && [ "$(cat "$FAILED_FILE")" = "$REMOTE" ] && exit 0

# 서버에서 직접(FTP 등으로) 고친 파일이 있으면 받아오면서 덮어쓰게 된다. 덮어쓰지 않고 사람에게 넘긴다.
# .env 와 data/ 의 DB 는 저장소에 없는 파일이라 여기에 걸리지 않는다.
if ! git diff --quiet || ! git diff --cached --quiet; then
  log "서버에서 고친 파일이 있어 배포를 멈춤. git status 로 확인 필요."
  exit 1
fi

log "새 커밋 발견: ${LOCAL:0:7} → ${REMOTE:0:7}"

# --ff-only: 서버에서는 합치기(merge)를 하지 않는다. 갈라졌다면 사람이 봐야 할 상황이다.
if ! git merge --ff-only "origin/$BRANCH" --quiet; then
  log "fast-forward 할 수 없음(갈라짐). 사람이 확인해야 함."
  exit 1
fi

# 의존성은 자물쇠 파일이 바뀌었을 때만 다시 깐다. 매번 돌리면 5분마다 수십 초씩 쓴다.
if git diff --name-only "$LOCAL" "$REMOTE" | grep -q '^package-lock\.json$'; then
  log "package-lock.json 변경 → npm ci"
  npm ci --omit=dev >/dev/null 2>&1 || log "npm ci 실패 (계속 진행)"
fi

pm2 restart "$PM2_NAME" --update-env >/dev/null 2>&1

# 뜨는 데 몇 초 걸린다(부팅 때 migrate 가 돈다). 나눠서 확인한다.
OK=0
for _ in 1 2 3 4 5 6 7 8 9 10; do
  sleep 2
  if curl -fsS --max-time 3 "$HEALTH_URL" >/dev/null 2>&1; then OK=1; break; fi
done

if [ "$OK" = "1" ]; then
  log "배포 완료: $(git log -1 --oneline)"
  rm -f "$FAILED_FILE"
else
  # 되돌리기. 새 코드가 뜨지 않으므로 직전 커밋으로 돌아가 다시 띄운다.
  log "!! /health 응답 없음 — ${LOCAL:0:7} 로 되돌립니다"
  git reset --hard "$LOCAL" --quiet
  echo "$REMOTE" > "$FAILED_FILE"
  pm2 restart "$PM2_NAME" --update-env >/dev/null 2>&1
  sleep 4
  if curl -fsS --max-time 3 "$HEALTH_URL" >/dev/null 2>&1; then
    log "되돌리기 성공 — 사이트는 이전 코드로 정상 동작 중. 문제 커밋 확인 필요: ${REMOTE:0:7}"
  else
    log "!! 되돌린 뒤에도 응답 없음. 사람이 봐야 함: pm2 logs $PM2_NAME"
  fi
fi

# 로그가 무한정 커지지 않도록 뒤쪽만 남긴다.
if [ -f "$LOG_FILE" ] && [ "$(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)" -gt "$LOG_MAX_BYTES" ]; then
  tail -n 500 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi

# --- 설치 (서버에서 한 번만) ---------------------------------------------
# 이 서버의 다른 사이트(캠카 등)가 쓰는 cron 줄은 건드리지 않는다 — 이 파일 경로가 들어간 줄만 바꾼다.
#
#   chmod +x /var/www/ee-upbattery/scripts/auto-deploy.sh
#   (crontab -l 2>/dev/null | grep -v 'ee-upbattery/scripts/auto-deploy.sh'; \
#    echo '*/5 * * * * /var/www/ee-upbattery/scripts/auto-deploy.sh >> /var/log/ee-upbattery-deploy.log 2>&1') | crontab -
#
# 잠시 멈추기:  touch /var/www/ee-upbattery/.no-deploy
# 다시 켜기:    rm /var/www/ee-upbattery/.no-deploy
# 기록 보기:    tail -30 /var/log/ee-upbattery-deploy.log
