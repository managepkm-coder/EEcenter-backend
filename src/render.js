const fs = require('fs');
const path = require('path');
const env = require('./config/env');
const site = require('./content/site');

// 화면은 빌드 없는 정적 HTML 이지만, 머리말 · 바닥글 · 전체메뉴는 서버가 여기서 한 번만 그려 끼운다.
// 화면 파일마다 복사해 두면 메뉴 한 줄을 바꿀 때마다 모든 화면을 고쳐야 하고, 언젠가 하나를 놓친다.
// 브라우저에서 스크립트로 끼우지 않는 이유 — 스크립트가 돌기 전까지 메뉴가 비어 보이고 검색엔진도 못 읽는다.

const VIEWS = path.join(__dirname, 'views');
const cache = new Map();

function readView(name) {
  // 개발 중에는 고칠 때마다 서버를 다시 띄우지 않아도 되게 매번 읽는다.
  if (env.nodeEnv === 'production' && cache.has(name)) return cache.get(name);
  const text = fs.readFileSync(path.join(VIEWS, `${name}.html`), 'utf8');
  cache.set(name, text);
  return text;
}

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const telHref = (tel) => `tel:${String(tel).replace(/[^0-9+]/g, '')}`;
const icon = (name) => `<i class="bi ${esc(name)}" aria-hidden="true"></i>`;

// 화면 파일 첫 줄의 <!--meta {...}--> 에 제목 · 설명을 적는다. 화면 정보가 그 파일 안에 함께 있어야
// 화면을 하나 더 만들 때 다른 파일을 찾아 고칠 일이 없다.
function splitMeta(text) {
  const m = text.match(/^\s*<!--meta\s+([\s\S]*?)-->/);
  if (!m) return { meta: {}, body: text };
  return { meta: JSON.parse(m[1]), body: text.slice(m[0].length) };
}

// 지금 화면이 메뉴의 어느 칸인지. 같은 화면 안의 구역(#) 은 따지지 않는다.
function sectionOf(pathname) {
  const seg = pathname.split('/')[1] || '';
  return site.nav.find((n) => n.href.split('/')[1] === seg) || null;
}

function headerHtml(pathname) {
  const current = sectionOf(pathname);
  const items = site.nav.map((n) => {
    const active = current === n;
    const children = n.children.map((c) => {
      const here = c.href === pathname;
      return `<li><a href="${esc(c.href)}"${here ? ' aria-current="page"' : ''}>${esc(c.label)}</a></li>`;
    }).join('');
    return `<li class="gnb-item${active ? ' is-active' : ''}">
          <a class="gnb-link" href="${esc(n.href)}"${active ? ' aria-current="true"' : ''}>${esc(n.label)}</a>
          <ul class="gnb-dropdown">${children}</ul>
        </li>`;
  }).join('');

  return `<a class="skip-link" href="#main">본문 바로가기</a>
  <header class="site-header">
    <div class="site-header-inner">
      <a href="/" class="site-logo" aria-label="${esc(site.company.siteName)} 홈">
        ${icon('bi-lightning-charge-fill')}<span class="site-logo-co">${esc(site.company.logoCompany)}</span> <span class="site-logo-brand">${esc(site.company.siteName)}</span>
      </a>
      <nav class="gnb" aria-label="주 메뉴">
        <ul class="gnb-list">${items}</ul>
      </nav>
      <div class="site-header-actions">
        <a class="header-tel" href="${telHref(site.company.tel)}">${icon('bi-telephone-fill')}<span>${esc(site.company.tel)}</span></a>
        <button type="button" class="btn-all-menu" data-open-menu aria-haspopup="dialog" aria-controls="fullMenu">
          ${icon('bi-list')}<span>전체메뉴</span>
        </button>
      </div>
    </div>
  </header>
  <div class="notice-bar">
    ${icon('bi-patch-check-fill')}
    안전한 캠핑을 위한 규격 준수: <strong>${esc(site.conversion.headline)}</strong>을 센터에서 원스톱으로 지원합니다.
  </div>`;
}

function fullMenuHtml() {
  const cols = site.nav.map((n, i) => `<div class="sitemap-col">
          <h3 class="sitemap-title">${icon(n.icon)} ${i + 1}. ${esc(n.label)}</h3>
          <ul class="sitemap-list">${n.children.map((c) => `<li><a href="${esc(c.href)}">${esc(c.label)}</a></li>`).join('')}</ul>
        </div>`).join('');
  return `<div id="fullMenu" class="full-menu" role="dialog" aria-modal="true" aria-labelledby="fullMenuTitle" hidden>
    <div class="full-menu-box">
      <div class="full-menu-top">
        <h2 id="fullMenuTitle">${icon('bi-grid-3x3-gap-fill')} 전체메뉴</h2>
        <button type="button" class="full-menu-close" data-close-menu aria-label="전체메뉴 닫기">${icon('bi-x-lg')}</button>
      </div>
      <div class="sitemap-grid">${cols}</div>
    </div>
  </div>`;
}

function footerHtml() {
  const c = site.company;
  return `<div class="floating-contact">
    <a href="${telHref(c.tel)}" class="float-btn float-tel" aria-label="전화 상담 ${esc(c.tel)}" title="전화 상담 바로 연결">${icon('bi-telephone-fill')}</a>
    <a href="/support/inquiry" class="float-btn float-inquiry" aria-label="견적 및 상담 문의" title="견적 및 상담 문의">${icon('bi-chat-dots-fill')}</a>
  </div>
  <footer class="site-footer">
    <div class="container">
      <div class="footer-brand">${icon('bi-lightning-charge-fill')} ${esc(c.logoCompany)} <span>${esc(c.siteName)}</span></div>
      <dl class="footer-info">
        <div><dt>상호</dt><dd>${esc(c.companyName)}</dd></div>
        <div><dt>대표</dt><dd>${esc(c.ceo)}</dd></div>
        <div><dt>사업자등록번호</dt><dd>${esc(c.bizNo)}</dd></div>
        <div><dt>주소</dt><dd>${esc(c.addressKo)}</dd></div>
        <div><dt>전화</dt><dd><a href="${telHref(c.tel)}">${esc(c.tel)}</a></dd></div>
        <div><dt>팩스</dt><dd>${esc(c.fax)}</dd></div>
        <div><dt>이메일</dt><dd><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></dd></div>
      </dl>
      <p class="footer-links"><a href="/privacy">개인정보처리방침</a> <span aria-hidden="true">|</span> <a href="/about/location">오시는 길</a></p>
      <p class="footer-copy">Copyright &copy; <b>${esc(c.companyName)}</b> All rights reserved ${new Date().getFullYear()}.</p>
    </div>
    <button type="button" class="top-btn" data-top aria-label="맨 위로">${icon('bi-arrow-up')}</button>
  </footer>`;
}

function subHeroHtml(meta, pathname) {
  if (!meta.heroTitle) return '';
  const section = sectionOf(pathname);
  const crumbs = ['<li><a href="/">홈</a></li>'];
  if (section) crumbs.push(`<li><a href="${esc(section.href)}">${esc(section.label)}</a></li>`);
  crumbs.push(`<li aria-current="page">${esc(meta.crumb || meta.heroTitle)}</li>`);
  return `<section class="sub-hero">
    <div class="container">
      <ol class="sub-crumb" aria-label="현재 위치">${crumbs.join('')}</ol>
      <h1 class="sub-hero-title">${esc(meta.heroTitle)}</h1>
      ${meta.heroDesc ? `<p class="sub-hero-desc">${esc(meta.heroDesc)}</p>` : ''}
    </div>
  </section>`;
}

// 화면 파일의 <!--=이름--> 자리에 넣는 조각. 같은 목록(서비스 · FAQ)을 여러 화면이 쓰므로 여기서 한 번만 그린다.
const blocks = {
  serviceCards() {
    return site.services.map((s) => `<a class="service-card" href="/services/${esc(s.slug)}">
        <span class="service-card-icon">${icon(s.icon)}</span>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.summary)}</p>
        <span class="service-card-more">자세히 보기 ${icon('bi-arrow-right')}</span>
      </a>`).join('');
  },
  serviceSections() {
    return site.services.map((s) => `<article class="service-row" id="${esc(s.slug)}">
        <div class="service-row-head">
          <span class="service-card-icon">${icon(s.icon)}</span>
          <div>
            <h3>${esc(s.title)}</h3>
            <p>${esc(s.summary)}</p>
          </div>
        </div>
        <ul class="service-row-items">${s.items.map((it) => `<li>${esc(it.title)}</li>`).join('')}</ul>
        <a class="btn btn-outline-brand btn-sm" href="/services/${esc(s.slug)}">${esc(s.title)} 자세히 보기</a>
      </article>`).join('');
  },
  conversionSteps() {
    return site.conversion.steps.map((st, i) => `<li class="step">
        <span class="step-no">${i + 1}</span>
        <strong>${esc(st.title)}</strong>
        <span>${esc(st.desc)}</span>
      </li>`).join('');
  },
  serviceDetail(ctx) {
    const s = ctx.service;
    const others = site.services.filter((o) => o !== s).map((o) =>
      `<a class="chip-link" href="/services/${esc(o.slug)}">${icon(o.icon)} ${esc(o.title)}</a>`).join('');
    return `<div class="row g-4 g-lg-5 align-items-start">
        <div class="col-lg-7">
          <p class="lead-text">${esc(s.lead)}</p>
          <div class="detail-items">${s.items.map((it) => `<div class="detail-item">
              <h3>${icon('bi-check2-circle')} ${esc(it.title)}</h3>
              <p>${esc(it.desc)}</p>
            </div>`).join('')}</div>
        </div>
        <aside class="col-lg-5">
          <div class="aside-card">
            <h3>시공 상담</h3>
            <p>차량마다 전기 구성과 공간이 달라 진단 뒤에 견적을 드립니다. 차종과 원하시는 작업을 남겨주세요.</p>
            <a class="btn btn-brand w-100 mb-2" href="/support/inquiry?service=${esc(s.slug)}">견적 및 상담 문의</a>
            <a class="btn btn-outline-brand w-100" href="/support/booking?service=${esc(s.slug)}">작업 예약 신청</a>
            <p class="aside-tel">${icon('bi-telephone')} <a href="${telHref(site.company.tel)}">${esc(site.company.tel)}</a></p>
          </div>
          <div class="aside-card mt-3">
            <h3>다른 서비스</h3>
            <div class="chip-links">${others}</div>
          </div>
        </aside>
      </div>`;
  },
  serviceCheckboxes(ctx) {
    return site.services.map((s) => `<label class="check-chip">
        <input type="checkbox" name="services" value="${esc(s.slug)}"${ctx.preselect === s.slug ? ' checked' : ''}>
        <span>${icon(s.icon)} ${esc(s.title)}</span>
      </label>`).join('') + `<label class="check-chip">
        <input type="checkbox" name="services" value="conversion"${ctx.preselect === 'conversion' ? ' checked' : ''}>
        <span>${icon('bi-file-earmark-check')} 구조변경 대행</span>
      </label>`;
  },
  // 견적 문의와 작업 예약이 함께 쓰는 칸. 두 화면에 따로 적으면 한쪽 칸 이름만 바뀐다.
  contactFields() {
    return `<div class="row g-3">
        <div class="col-md-6">
          <label class="form-label" for="fName">이름 <span class="req">(필수)</span></label>
          <input class="form-control" id="fName" name="name" maxlength="30" autocomplete="name" required>
        </div>
        <div class="col-md-6">
          <label class="form-label" for="fPhone">휴대폰 번호 <span class="req">(필수)</span></label>
          <input class="form-control" id="fPhone" name="phone" inputmode="numeric" autocomplete="tel" placeholder="010-0000-0000" maxlength="13" required>
        </div>
        <div class="col-12">
          <label class="form-label" for="fVehicle">차종 · 연식</label>
          <input class="form-control" id="fVehicle" name="vehicle" maxlength="60" placeholder="예: 스타리아 캠퍼 2023년식">
        </div>
      </div>`;
  },
  consentField() {
    return `<div class="consent-box">
        <p class="consent-title">개인정보 수집 · 이용 안내</p>
        <ul>
          <li>수집 항목: 이름, 휴대폰 번호, 차종 · 연식, 문의 내용</li>
          <li>이용 목적: 견적 · 상담 및 작업 일정 안내를 위한 연락</li>
          <li>보유 기간: 상담 완료 후 1년 (그 뒤 파기합니다)</li>
        </ul>
        <label class="form-check">
          <input class="form-check-input" type="checkbox" name="agree" id="fAgree" required>
          <span class="form-check-label">위 내용에 동의합니다. <span class="req">(필수)</span></span>
        </label>
        <a class="consent-more" href="/privacy" target="_blank" rel="noopener">개인정보처리방침 전문 보기</a>
      </div>
      <!-- 사람 눈에는 보이지 않는 칸. 자동 등록 프로그램이 채워 보내면 서버가 받은 척만 한다. -->
      <div class="hp-field" aria-hidden="true"><label>웹사이트 <input name="website" tabindex="-1" autocomplete="off"></label></div>`;
  },
  faqList() {
    return site.faqs.map((f) => `<details class="faq-item">
        <summary>${esc(f.q)}</summary>
        <p>${esc(f.a)}</p>
      </details>`).join('');
  },
  noticeList() {
    if (!site.notices.length) return '<p class="empty-note">등록된 공지사항이 없습니다.</p>';
    return `<ul class="notice-list">${site.notices.map((n) => `<li>
        <details>
          <summary><time datetime="${esc(n.date)}">${esc(n.date)}</time> ${esc(n.title)}</summary>
          <p>${esc(n.body)}</p>
        </details>
      </li>`).join('')}</ul>`;
  },
  galleryFilters() {
    return ['<button type="button" class="filter-btn is-on" data-filter="all" aria-pressed="true">전체</button>']
      .concat(site.services.map((s) => `<button type="button" class="filter-btn" data-filter="${esc(s.slug)}" aria-pressed="false">${esc(s.title)}</button>`))
      .join('');
  },
  galleryList() {
    if (!site.gallery.length) {
      return `<p class="empty-note">${icon('bi-camera')} 시공 사례를 정리하고 있습니다. 곧 차종별 작업 사진으로 찾아뵙겠습니다.</p>`;
    }
    return site.gallery.map((g) => `<figure class="gallery-card" data-service="${esc(g.service)}">
        <img src="${esc(g.image)}" alt="${esc(g.title)}" loading="lazy">
        <figcaption><strong>${esc(g.title)}</strong><span>${esc(g.vehicle || '')}</span></figcaption>
      </figure>`).join('');
  },
  beforeAfterList() {
    const pairs = site.gallery.filter((g) => g.before && g.after);
    if (!pairs.length) return '<p class="empty-note">작업 전 · 후 비교 사진을 준비하고 있습니다.</p>';
    return pairs.map((g) => `<div class="ba-card">
        <figure><img src="${esc(g.before)}" alt="${esc(g.title)} 작업 전" loading="lazy"><figcaption>Before</figcaption></figure>
        <figure><img src="${esc(g.after)}" alt="${esc(g.title)} 작업 후" loading="lazy"><figcaption>After</figcaption></figure>
        <p>${esc(g.title)}</p>
      </div>`).join('');
  },
  featuredList() {
    const f = site.gallery.filter((g) => g.featured);
    if (!f.length) return '<p class="empty-note">이달의 튜닝을 준비하고 있습니다.</p>';
    return f.map((g) => `<figure class="gallery-card"><img src="${esc(g.image)}" alt="${esc(g.title)}" loading="lazy"><figcaption><strong>${esc(g.title)}</strong></figcaption></figure>`).join('');
  },
  hoursList() {
    return site.company.hours.map((h) => `<li><span>${esc(h.label)}</span><strong>${esc(h.value)}</strong></li>`).join('');
  },
  mapLinks() {
    const q = encodeURIComponent(site.company.mapQuery || site.company.addressKo);
    return `<a class="btn btn-brand" href="https://map.kakao.com/link/search/${q}" target="_blank" rel="noopener noreferrer">${icon('bi-geo-alt-fill')} 카카오맵에서 보기</a>
      <a class="btn btn-outline-brand" href="https://map.naver.com/p/search/${q}" target="_blank" rel="noopener noreferrer">${icon('bi-map')} 네이버 지도에서 보기</a>`;
  },
};

// {{이름}} 자리에 넣는 회사 정보. 모두 글자로 이스케이프한다.
function fillValues(text) {
  const c = site.company;
  const values = {
    logoCompany: c.logoCompany, siteName: c.siteName, companyName: c.companyName,
    ceo: c.ceo, tel: c.tel, telHref: telHref(c.tel), fax: c.fax, email: c.email,
    addressKo: c.addressKo, addressEn: c.addressEn, conversionHeadline: site.conversion.headline,
  };
  return text.replace(/\{\{(\w+)\}\}/g, (all, key) => (key in values ? esc(values[key]) : all));
}

function renderPage({ view, pathname, ctx = {}, meta: extraMeta = {} }) {
  const { meta: fileMeta, body } = splitMeta(readView(`pages/${view}`));
  const meta = { ...fileMeta, ...extraMeta };
  let content = body.replace(/<!--=(\w+)-->/g, (all, name) => (blocks[name] ? blocks[name](ctx) : all));
  content = fillValues(content);

  const title = meta.title ? `${meta.title} | ${site.company.siteName}` : site.company.siteName;
  const scripts = (meta.scripts || []).map((s) => `<script src="${esc(s)}" defer></script>`).join('\n  ');
  const layout = readView('layout');
  const parts = {
    title: esc(title),
    description: esc(meta.description || '캠핑카 전기 · 배터리, 냉난방, 외장 · 실내 튜닝, 청수 · 오수 설비와 구조변경 대행까지 — 캠핑카 업그레이드 전문 센터입니다.'),
    canonical: esc(env.siteUrl + pathname),
    robots: meta.noindex ? '<meta name="robots" content="noindex">' : '',
    header: headerHtml(pathname),
    subHero: subHeroHtml(meta, pathname),
    content,
    footer: footerHtml(),
    fullMenu: fullMenuHtml(),
    scripts,
  };
  // 한 번에 바꾼다 — 차례로 바꾸면 앞에서 넣은 본문 안에 같은 표시가 있을 때 두 번 채워진다.
  return layout.replace(/\{\{(\w+)\}\}/g, (all, key) => (key in parts ? parts[key] : all));
}

module.exports = { renderPage, esc };
