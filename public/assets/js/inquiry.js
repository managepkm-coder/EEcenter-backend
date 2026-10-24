// 견적 · 상담 문의와 작업 예약 신청이 함께 쓰는 폼 처리.
// 서버도 같은 기준으로 다시 막는다(inquiryController) — 화면 검사는 개발자도구로 지나간다.
(function () {
  var form = document.querySelector('.inquiry-form');
  if (!form) return;
  var kind = form.getAttribute('data-kind');
  var errorsBox = form.querySelector('.form-errors');
  var done = document.querySelector('.form-done');
  var submitBtn = form.querySelector('[type="submit"]');
  // form.name 은 폼 자신의 name 속성이라, 칸은 늘 elements 로 찾는다.
  function field(n) { return form.elements.namedItem(n); }

  // 치는 동안 010-0000-0000 모양으로 맞춘다.
  var phone = form.querySelector('[name="phone"]');
  if (phone) {
    phone.addEventListener('input', function () {
      var d = phone.value.replace(/\D/g, '').slice(0, 11);
      phone.value = d.length < 4 ? d : d.length < 8 ? d.slice(0, 3) + '-' + d.slice(3) : d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
    });
  }

  // 날짜는 서울 기준 오늘부터 고른다.
  var date = form.querySelector('[name="preferredDate"]');
  function todayKst() {
    return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  }
  if (date) date.min = todayKst();

  function values() {
    var services = Array.prototype.map.call(form.querySelectorAll('[name="services"]:checked'), function (el) { return el.value; });
    var time = form.querySelector('[name="preferredTime"]:checked');
    return {
      kind: kind,
      name: field('name').value.trim(),
      phone: phone ? phone.value.trim() : '',
      vehicle: field('vehicle').value.trim(),
      services: services,
      preferredDate: date ? date.value : undefined,
      preferredTime: time ? time.value : undefined,
      message: field('message').value.trim(),
      agree: field('agree').checked,
      website: field('website') ? field('website').value : '',
    };
  }

  // 문제마다 어느 칸인지 함께 돌려줘서, 알린 뒤 첫 번째 칸으로 커서를 보낸다.
  function check(v) {
    var p = [];
    if (!v.name) p.push({ el: field('name'), msg: '이름을 입력해주세요.' });
    if (!/^010\d{8}$/.test(v.phone.replace(/\D/g, ''))) p.push({ el: phone, msg: '휴대폰 번호를 010-0000-0000 형식으로 입력해주세요.' });
    var chips = document.getElementById('fServices');
    if (kind === 'booking') {
      if (!v.services.length) p.push({ el: chips, focus: chips.querySelector('input'), msg: '받으실 작업을 하나 이상 골라주세요.' });
      if (!v.preferredDate) p.push({ el: date, msg: '희망 날짜를 골라주세요.' });
      else if (v.preferredDate < todayKst()) p.push({ el: date, msg: '지난 날짜는 고를 수 없습니다.' });
    } else if (!v.services.length && !v.message) {
      p.push({ el: chips, focus: chips.querySelector('input'), msg: '원하시는 작업을 고르시거나 문의 내용을 적어주세요.' });
    }
    if (!v.agree) p.push({ el: field('agree'), msg: '개인정보 수집 · 이용에 동의해주세요.' });
    return p;
  }

  function clearMarks() {
    form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
  }

  function showErrors(list) {
    // 글자는 textContent 로만 넣는다 — 서버가 보낸 문구도 이 길로 온다.
    errorsBox.textContent = '';
    var head = document.createElement('strong');
    head.textContent = '확인해주세요';
    var ul = document.createElement('ul');
    list.forEach(function (it) {
      var li = document.createElement('li');
      li.textContent = it.msg;
      ul.appendChild(li);
      if (it.el) it.el.setAttribute('aria-invalid', 'true');
    });
    errorsBox.appendChild(head);
    errorsBox.appendChild(ul);
    errorsBox.hidden = false;
    var first = list[0] && (list[0].focus || list[0].el);
    if (first && first.focus) first.focus();
    else errorsBox.scrollIntoView({ block: 'center' });
  }

  form.addEventListener('change', function (e) {
    if (e.target.getAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid');
    if (e.target.name === 'services') document.getElementById('fServices').removeAttribute('aria-invalid');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearMarks();
    var v = values();
    var problems = check(v);
    if (problems.length) { showErrors(problems); return; }

    // 내보낸 오프라인 미리보기(file://)에는 접수를 받을 서버가 없다 — 인터넷 탓으로 읽히지 않게 따로 알린다.
    if (location.protocol === 'file:') {
      showErrors([{ msg: '오프라인 미리보기에서는 접수되지 않습니다. 서버에 올린 뒤에 동작합니다.' }]);
      return;
    }
    errorsBox.hidden = true;
    submitBtn.disabled = true;   // 두 번 눌러 같은 접수가 두 건 들어가지 않게
    var label = submitBtn.textContent;
    submitBtn.textContent = '보내는 중…';

    fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(v),
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) { return { ok: res.ok, body: body }; });
      })
      .then(function (r) {
        if (!r.ok) throw new Error((r.body && r.body.message) || '접수하지 못했습니다. 잠시 후 다시 시도해주세요.');
        form.hidden = true;
        done.hidden = false;
        done.focus();
      })
      .catch(function (err) {
        var msg = err && err.message && err.message !== 'Failed to fetch' ? err.message : '인터넷 연결을 확인한 뒤 다시 시도해주세요.';
        showErrors([{ msg: msg }]);
        submitBtn.disabled = false;
        submitBtn.textContent = label;
      });
  });
})();
