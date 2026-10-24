// 사이트 전체가 함께 쓰는 값 — 회사 정보 · 메뉴 · 서비스.
// 메뉴는 머리말 · 전체메뉴 · 바닥글 · sitemap.xml 이 모두 여기서 그려진다. 화면마다 메뉴를 복사해 두면
// 한 곳만 고치고 나머지를 놓친다(캠카 사이트에서 메뉴 하나 바꿀 때마다 34개 화면을 고쳐야 했던 자리).

const company = {
  brand: 'EE Up Battery',
  brandFull: 'Electric Equipment Up Battery',
  siteName: 'EE Up Battery 캠핑카 업그레이드 센터',
  companyName: 'Korea BTS Co., Ltd.',
  ceo: 'Roberts Jang',
  bizNo: '631-88-00985',
  email: 'hanulkid@naver.com',
  tel: '02-6956-7074',
  fax: '02-6956-7075',
  // 바닥글의 영문 주소를 옮긴 것이다. 도로명 표기가 맞는지 확인이 필요하다.
  addressKo: '인천광역시 부평구 백범로577번길 20, 경인센터 223호',
  addressEn: 'Room 223, Gyeongin Center, 20 Baekbeom-ro 577beon-gil, Bupyeong-gu, Incheon, Korea',
  hours: [
    { label: '평일', value: '09:00 ~ 18:00' },
    { label: '토요일', value: '사전 예약제' },
  ],
};

// 서비스 다섯 가지. 메인 카드 · 운영내용 목록 · 서비스별 화면 · 문의 폼의 체크박스가 이 표를 쓴다.
// 가격 · 보증 기간은 적지 않는다 — 차량마다 진단 뒤 견적이라 정해진 값이 없고, 적으면 약속이 된다.
const services = [
  {
    slug: 'electric',
    title: '전기 / 배터리',
    icon: 'bi-battery-charging',
    summary: '리튬인산철 배터리, 고출력 주행충전기, 순수정현파 인버터 시공',
    lead: '캠핑카 전기의 중심은 배터리입니다. 차량의 사용 패턴에 맞춰 용량을 설계하고, 충전 · 변환 · 보호 장치까지 한 번에 맞춥니다.',
    items: [
      { title: '리튬인산철 배터리 교체 · 증설', desc: '기존 납산 · AGM 배터리를 리튬인산철로 교체하거나 용량을 늘립니다. 셀 밸런싱을 맞춘 뒤 장착합니다.' },
      { title: '주행 충전기 설치', desc: '달리는 동안 메인 배터리에서 캠핑용 배터리로 안정적으로 충전되도록 고출력 주행충전기를 연결합니다.' },
      { title: '순수정현파 인버터', desc: '가전제품을 안전하게 쓸 수 있도록 차량 전력 구성에 맞는 용량의 순수정현파 인버터를 설치합니다.' },
      { title: '배선 · 보호 장치 정비', desc: '난연성 배선과 퓨즈 · 차단기 · 배터리 모니터를 갖춰 과전류와 접촉 불량을 예방합니다.' },
    ],
  },
  {
    slug: 'hvac',
    title: '냉난방 / 공조',
    icon: 'bi-fan',
    summary: '무시동 히터, 저소음 차량용 인버터 에어컨 및 덕트 맞춤 설치',
    lead: '사계절 캠핑을 위해 시동을 끈 상태에서도 쓸 수 있는 냉난방 장치를 차량 구조에 맞춰 설치합니다.',
    items: [
      { title: '무시동 히터', desc: '연료 라인 · 배기 · 흡기 위치를 차량에 맞게 잡고, 실내 온도 조절기를 함께 설치합니다.' },
      { title: '차량용 인버터 에어컨', desc: '저소음 인버터 에어컨을 장착하고 배터리 · 인버터 용량과 맞는지 함께 점검합니다.' },
      { title: '덕트 맞춤 설치', desc: '실내 구조에 맞춰 덕트를 배치해 바람이 고르게 퍼지도록 합니다.' },
    ],
  },
  {
    slug: 'exterior',
    title: '외장 튜닝',
    icon: 'bi-sun',
    summary: '대형 어닝 설치, 태양광 패널, 루프랙 및 외장 파츠 장착',
    lead: '야외 생활 공간을 넓히고 전력 자급을 높이는 외장 장비를 차량 하중과 구조를 고려해 장착합니다.',
    items: [
      { title: '대형 어닝 설치', desc: '차체에 맞는 브래킷으로 어닝을 고정해 그늘과 생활 공간을 만듭니다.' },
      { title: '태양광 패널', desc: '지붕 면적과 배터리 구성에 맞는 패널과 충전 컨트롤러를 설치합니다.' },
      { title: '루프랙 · 외장 파츠', desc: '루프랙 · 사다리 · 수납함 등 외장 파츠를 장착합니다.' },
    ],
  },
  {
    slug: 'interior',
    title: '실내 인테리어',
    icon: 'bi-house-heart',
    summary: '침상 평탄화 튜닝, 편백/자작나무 가구 제작 및 실내 수납 시스템',
    lead: '머무는 시간이 긴 실내를 사용자의 캠핑 방식에 맞춰 편하고 정돈된 공간으로 만듭니다.',
    items: [
      { title: '침상 평탄화 튜닝', desc: '좌석 · 적재 공간을 평평한 잠자리로 바꿀 수 있도록 구조를 맞춥니다.' },
      { title: '편백 / 자작나무 가구 제작', desc: '실내 치수에 맞춰 가구를 제작하고 흔들림 없이 고정합니다.' },
      { title: '실내 수납 시스템', desc: '캠핑 장비와 생활용품을 정리할 수 있는 수납 공간을 설계합니다.' },
    ],
  },
  {
    slug: 'plumbing',
    title: '청수 / 오수 설비',
    icon: 'bi-droplet-half',
    summary: '대용량 워터탱크, 압력펌프, 온수 시스템 및 동파 방지 배관',
    lead: '물을 쓰는 설비는 누수와 동파가 가장 큰 문제입니다. 탱크부터 배관까지 사계절 사용을 고려해 설치합니다.',
    items: [
      { title: '대용량 워터탱크', desc: '청수 · 오수 탱크를 차량 하중과 공간에 맞춰 배치합니다.' },
      { title: '압력펌프', desc: '수도꼭지를 열면 바로 물이 나오도록 압력펌프와 배관을 연결합니다.' },
      { title: '온수 시스템', desc: '샤워 · 설거지에 쓸 수 있는 온수 장치를 설치합니다.' },
      { title: '동파 방지 배관', desc: '겨울철 배관이 얼지 않도록 단열과 배수 구조를 갖춥니다.' },
    ],
  },
];

// 구조변경 대행 — 메인 띠배너와 운영내용 화면이 같은 문장을 쓴다.
const conversion = {
  headline: '한국교통안전공단 정식 구조변경 승인 및 검사 대행',
  steps: [
    { title: '상담 · 차량 확인', desc: '설치할 장비와 차량 상태를 확인하고 구조변경이 필요한지 안내합니다.' },
    { title: '구조변경 승인 신청', desc: '한국교통안전공단에 구조변경 승인을 신청합니다.' },
    { title: '시공', desc: '승인된 내용대로 센터에서 작업합니다.' },
    { title: '구조변경 검사', desc: '작업을 마친 차량의 구조변경 검사를 대행합니다.' },
    { title: '출고', desc: '검사를 마친 차량을 인도하고 사용 방법을 안내합니다.' },
  ],
};

// 시공 사례 · 공지. 아직 올릴 것이 없어 비워 둔다 — 화면은 "준비 중" 안내를 그린다.
// 항목을 더할 때: gallery { title, service(slug), vehicle, image('/assets/images/...'), featured?, before?, after? }
//                  notices { date('YYYY-MM-DD'), title, body }
const gallery = [];
const notices = [];

// 메뉴. href 의 # 은 그 화면 안의 구역이다.
const nav = [
  {
    label: '회사 소개', href: '/about/greeting', icon: 'bi-building',
    children: [
      { label: '인사말', href: '/about/greeting' },
      { label: '시설안내', href: '/about/facilities' },
      { label: '오시는 길', href: '/about/location' },
    ],
  },
  {
    label: '업그레이드 운영내용', href: '/services', icon: 'bi-tools',
    children: [
      { label: '전체 서비스 목록', href: '/services' },
      { label: '구조변경 대행 안내', href: '/services#conversion' },
      ...services.map((s) => ({ label: s.title, href: `/services/${s.slug}` })),
    ],
  },
  {
    label: '시공 갤러리', href: '/gallery', icon: 'bi-images',
    children: [
      { label: '차종별 시공 사례', href: '/gallery' },
      { label: 'Before & After 비교', href: '/gallery#before-after' },
      { label: '이달의 튜닝', href: '/gallery#featured' },
    ],
  },
  {
    label: '부품 및 쇼핑몰', href: '/shop', icon: 'bi-cart3',
    children: [
      { label: '취급 브랜드 안내', href: '/shop#brands' },
      { label: '캠핑카 추천 용품', href: '/shop#recommend' },
    ],
  },
  {
    label: '고객 센터', href: '/support', icon: 'bi-headset',
    children: [
      { label: '공지사항 & FAQ', href: '/support' },
      { label: '견적 및 상담 문의', href: '/support/inquiry' },
      { label: '작업 예약 신청', href: '/support/booking' },
    ],
  },
];

// 자주 묻는 질문 — 이 센터가 실제로 하는 일만 적는다. 정해지지 않은 값(비용 · 기간)은 "상담 시 안내".
const faqs = [
  { q: '시공 비용은 얼마인가요?', a: '차량 상태와 설치할 장비 · 용량에 따라 달라집니다. 견적 및 상담 문의를 남겨주시면 차량을 확인한 뒤 견적을 안내해드립니다.' },
  { q: '작업 기간은 얼마나 걸리나요?', a: '작업 범위에 따라 다릅니다. 상담할 때 예상 기간을 함께 안내해드립니다.' },
  { q: '방문 전에 예약이 필요한가요?', a: '네. 작업 공간과 장비를 미리 준비하기 위해 예약 후 방문을 부탁드립니다. 작업 예약 신청을 남기시면 담당자가 전화로 일정을 확정해드립니다.' },
  { q: '구조변경 승인과 검사도 맡길 수 있나요?', a: '네. 한국교통안전공단 구조변경 승인 신청부터 작업 후 검사까지 센터에서 대행합니다. 구조변경이 필요한 작업인지는 상담 때 확인해드립니다.' },
  { q: '대형 모터홈이나 트레일러도 작업할 수 있나요?', a: '대형 모터홈까지 입고할 수 있는 실내 작업장을 운영합니다. 차량 크기는 예약할 때 미리 알려주세요.' },
];

module.exports = { company, services, conversion, gallery, notices, nav, faqs };
