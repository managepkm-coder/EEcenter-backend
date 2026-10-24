// 문의 · 예약 관리 화면. 손님이 적은 값은 모두 textContent 로 넣는다(태그가 살아나지 않게).
(function () {
  var SERVICE = { electric: '전기/배터리', hvac: '냉난방/공조', exterior: '외장 튜닝', interior: '실내 인테리어', plumbing: '청수/오수', conversion: '구조변경 대행' };
  var TIME = { am: '오전', pm: '오후' };
  var rows = document.getElementById('rows');
  var count = document.getElementById('count');
  var view = 'new';
  var all = [];

  // 저장된 시각은 UTC 문자열이라 서울 시각으로 바꿔 찍는다.
  function kst(utc) {
    if (!utc) return '';
    var d = new Date(utc.replace(' ', 'T') + 'Z');
    return d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function cell(tr, text, cls) {
    var td = document.createElement('td');
    td.textContent = text == null ? '' : text;
    if (cls) td.className = cls;
    tr.appendChild(td);
    return td;
  }

  function render() {
    var list = all.filter(function (r) { return view === 'all' || r.status === view; });
    count.textContent = list.length + '건';
    rows.textContent = '';
    if (!list.length) {
      var tr = document.createElement('tr');
      var td = cell(tr, '해당하는 접수가 없습니다.', 'text-center text-secondary py-4');
      td.colSpan = 9;
      rows.appendChild(tr);
      return;
    }
    list.forEach(function (r) {
      var tr = document.createElement('tr');
      cell(tr, kst(r.createdAt));
      cell(tr, r.kindLabel);
      var who = cell(tr, r.name);
      var a = document.createElement('a');
      a.href = 'tel:' + r.phone.replace(/\D/g, '');
      a.textContent = r.phone;
      who.appendChild(document.createElement('br'));
      who.appendChild(a);
      cell(tr, r.vehicle || '-');
      cell(tr, r.services.map(function (s) { return SERVICE[s] || s; }).join(', ') || '-');
      cell(tr, r.preferredDate ? r.preferredDate + (r.preferredTime ? ' ' + TIME[r.preferredTime] : '') : '-');
      cell(tr, r.message || '-', 'msg');

      var st = cell(tr, '', 'memo');
      var badge = document.createElement('span');
      badge.className = 'badge mb-1 ' + (r.status === 'done' ? 'badge-done' : 'badge-new');
      badge.textContent = r.status === 'done' ? '처리 완료' : '미처리';
      var memo = document.createElement('textarea');
      memo.className = 'form-control form-control-sm';
      memo.rows = 2;
      memo.maxLength = 1000;
      memo.placeholder = '상담 메모';
      memo.setAttribute('aria-label', r.name + ' 접수 메모');
      memo.value = r.staffMemo || '';
      st.appendChild(badge);
      st.appendChild(memo);

      var act = cell(tr, '');
      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'btn btn-sm btn-success d-block w-100 mb-1';
      toggle.textContent = r.status === 'done' ? '미처리로' : '처리 완료';
      toggle.addEventListener('click', function () {
        save(r.id, r.status === 'done' ? 'new' : 'done', memo.value, toggle);
      });
      var saveMemo = document.createElement('button');
      saveMemo.type = 'button';
      saveMemo.className = 'btn btn-sm btn-outline-secondary d-block w-100 mb-1';
      saveMemo.textContent = '메모 저장';
      saveMemo.addEventListener('click', function () { save(r.id, r.status, memo.value, saveMemo); });
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn btn-sm btn-outline-danger d-block w-100';
      del.textContent = '삭제';
      del.addEventListener('click', function () {
        if (!confirm(r.name + ' 님의 ' + r.kindLabel + '을(를) 삭제할까요?')) return;
        request('DELETE', '/api/admin/inquiries/' + r.id).then(load);
      });
      act.appendChild(toggle);
      act.appendChild(saveMemo);
      act.appendChild(del);
      rows.appendChild(tr);
    });
  }

  function request(method, url, body) {
    return fetch(url, {
      method: method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (res) {
      if (!res.ok) throw new Error('요청이 실패했습니다 (' + res.status + ')');
      return res.json();
    }).catch(function (err) { alert(err.message); throw err; });
  }

  function save(id, status, memo, btn) {
    btn.disabled = true;
    request('PUT', '/api/admin/inquiries/' + id, { status: status, staffMemo: memo })
      .then(load)
      .finally(function () { btn.disabled = false; });
  }

  function load() {
    return request('GET', '/api/admin/inquiries').then(function (data) { all = data; render(); });
  }

  document.querySelectorAll('[data-view]').forEach(function (b) {
    b.addEventListener('click', function () {
      view = b.getAttribute('data-view');
      document.querySelectorAll('[data-view]').forEach(function (x) {
        x.classList.toggle('active', x === b);
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      render();
    });
  });
  document.getElementById('reload').addEventListener('click', load);
  load();
})();
