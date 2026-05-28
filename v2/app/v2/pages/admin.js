/* ============================================================
   Atomify · v2 · admin (page)
   ------------------------------------------------------------
   Page-specific logic for the account-management workspace.
   Keeps the same fetch endpoints + behaviour as the legacy page;
   all UI is rebuilt against the v2 admin design system.
   ============================================================ */

(function () {
  'use strict';

  /* ─── State ───────────────────────────────────────── */
  let currentUser = null;
  let currentClassId = null;

  let acSearchTimeout = null;
  let acSearchResults = [];
  let acHighlight = -1;

  let questionCounter = 0;
  let isEditMode = false;
  let currentEditQuizId = null;


  /* ─── tiny utils ──────────────────────────────────── */
  const $ = (id) => document.getElementById(id);
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function escapeHTML(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ro-RO');
  }

  function formatDateTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ro-RO', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function formatTime(seconds) {
    if (!seconds && seconds !== 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }


  /* ─── Page messages (top-level + per-section) ─────── */
  function showMessage(id, text, type = 'error', autoHide = true) {
    const el = $(id);
    if (!el) return;
    el.textContent = text;
    el.className = `adm-message is-visible ${type}`;
    if (autoHide) {
      clearTimeout(el._t);
      el._t = setTimeout(() => {
        el.classList.remove('is-visible');
      }, type === 'success' ? 4000 : 6000);
    }
  }


  /* ─── Auth check ──────────────────────────────────── */
  async function checkAuth() {
    console.log('[admin] checkAuth: start');
    try {
      const res = await fetch('/user', { credentials: 'same-origin', cache: 'no-store' });
      console.log('[admin] checkAuth: /user status', res.status, 'ok', res.ok);
      if (res.ok) {
        const data = await res.json();
        console.log('[admin] checkAuth: response body', data);
        currentUser = data.user || null;
        if (currentUser) {
          console.log('[admin] checkAuth: -> renderAuthenticated for user', currentUser.username);
          renderAuthenticated();
        } else {
          console.warn('[admin] checkAuth: 200 but no user field, falling back to unauth');
          renderUnauthenticated();
        }
      } else {
        console.warn('[admin] checkAuth: not ok, -> renderUnauthenticated');
        currentUser = null;
        renderUnauthenticated();
      }
    } catch (err) {
      console.error('[admin] auth check failed', err);
      currentUser = null;
      renderUnauthenticated();
    }
  }

  function renderUnauthenticated() {
    $('admAuthRequired')?.removeAttribute('hidden');
    $('admContent')?.setAttribute('hidden', '');
  }

  function renderAuthenticated() {
    $('admAuthRequired')?.setAttribute('hidden', '');
    $('admContent')?.removeAttribute('hidden');

    renderHero();

    const hasRole = !!(currentUser && currentUser.role);
    const isProf  = hasRole && currentUser.role === 'professor';
    const isStud  = hasRole && currentUser.role === 'student';

    toggleChapter('admChapterRole', !hasRole);
    toggleChapter('admChapterClasses', hasRole);
    toggleChapter('admChapterQuizzes', isProf);
    toggleChapter('admChapterHomework', isStud);

    // Cards inside the Classes chapter are role-specific
    toggleEl('admCreateClassCard', isProf);
    toggleEl('admMyClassesCard', isProf);
    toggleEl('admInvitationsCard', isStud);
    toggleEl('admJoinedClassesCard', isStud);

    // Password change only for non-Google users
    toggleChapter('admChapterSecurity', !(currentUser && currentUser.isGoogleUser));

    // Delete account form variants
    const isGoogle = !!(currentUser && currentUser.isGoogleUser);
    toggleEl('admDeletePwdGroup', !isGoogle);
    toggleEl('admDeleteGoogleNote', isGoogle);
    const dpw = $('admDeletePassword');
    if (dpw) {
      if (isGoogle) dpw.removeAttribute('required');
      else dpw.setAttribute('required', 'required');
    }

    // Country selector
    if (currentUser?.country) {
      $('admCountrySelect') && ($('admCountrySelect').value = currentUser.country);
      $('admCountryCurrent')?.removeAttribute('hidden');
      $('admCountryCurrentName') && ($('admCountryCurrentName').textContent = currentUser.country);
    } else {
      $('admCountryCurrent')?.setAttribute('hidden', '');
    }

    // Newsletter
    loadNewsletterStatus();
    // Load admin stats
    loadAdminStats();

    if (isProf) {
      loadMyClasses();
      loadMyQuizzes();
    } else if (isStud) {
      loadJoinedClasses();
      loadPendingInvitations();
      loadStudentHomework();
    }
  }

  function toggleChapter(id, on) {
    const el = $(id);
    if (!el) return;
    if (on) el.removeAttribute('hidden');
    else el.setAttribute('hidden', '');
  }

  function toggleEl(id, on) { toggleChapter(id, on); }


  /* ─── Hero / identity ─────────────────────────────── */
  function renderHero() {
    if (!currentUser) return;
    const name = currentUser.username || '—';
    $('admAvatar') && ($('admAvatar').textContent = (name[0] || '?').toUpperCase());
    $('admName') && ($('admName').textContent = name);

    const tags = [];
    if (currentUser.role === 'professor') tags.push(['Profesor', 'gold']);
    else if (currentUser.role === 'student') tags.push(['Student', 'green']);
    else tags.push(['Rol nedefinit', 'amber']);

    if (currentUser.country) tags.push([currentUser.country, 'cobalt']);
    if (currentUser.isGoogleUser) tags.push(['Cont Google', '']);

    const tagsEl = $('admTags');
    if (tagsEl) {
      tagsEl.innerHTML = tags
        .map(([label, mod]) => `<span class="pill ${mod ? 'pill--' + mod : ''}">${escapeHTML(label)}</span>`)
        .join('');
    }

    const metaParts = [];
    metaParts.push(`@${name}`);
    if (currentUser.created_at) metaParts.push(`Membru din ${formatDate(currentUser.created_at)}`);
    $('admMeta') && ($('admMeta').textContent = metaParts.join(' · '));

    // Hero aux
    const aux = $('admHeroAux');
    if (aux) {
      const lines = [];
      lines.push('CONT · SETĂRI');
      if (currentUser.role === 'professor') lines.push('MOD PROFESOR');
      else if (currentUser.role === 'student') lines.push('MOD STUDENT');
      aux.innerHTML = lines.join('<br/>');
    }
  }


  /* ─── Quick stats ─────────────────────────────────── */
  async function loadAdminStats() {
    const isTeacher = currentUser?.role === 'professor';
    const isStudent = currentUser?.role === 'student';

    // Build stat list dynamically per role
    const cells = [];
    if (isTeacher) {
      cells.push({ id: 'classes',   label: 'Clase create',   key: 'classes',          tone: 'accent' });
      cells.push({ id: 'students',  label: 'Studenți activi', key: 'students',         tone: '' });
      cells.push({ id: 'quizzes',   label: 'Chestionare',    key: 'quizzes',          tone: 'gold'   });
      cells.push({ id: 'homework',  label: 'Teme active',    key: 'homework',         tone: 'cobalt' });
    } else if (isStudent) {
      cells.push({ id: 'classes',   label: 'Clase alăturate', key: 'joinedClasses',   tone: 'accent' });
      cells.push({ id: 'quizzes',   label: 'Chestionare',    key: 'quizzes',          tone: 'gold'   });
      cells.push({ id: 'homework',  label: 'Teme primite',   key: 'homework',         tone: 'cobalt' });
      cells.push({ id: 'completed', label: 'Teme completate', key: 'completedHomework', tone: 'accent' });
    } else {
      // No role yet — show a single placeholder
      cells.push({ id: 'placeholder', label: 'Status',        key: '_role',           tone: '' });
    }

    const wrap = $('admStats');
    if (!wrap) return;

    wrap.innerHTML = cells.map(c => `
      <div class="adm-stat">
        <span class="adm-stat-label">${escapeHTML(c.label)}</span>
        <span class="adm-stat-value ${c.tone ? 'adm-stat-value--' + c.tone : ''}" data-stat="${c.id}"><span class="num">0</span></span>
      </div>
    `).join('');

    if (!isTeacher && !isStudent) {
      const ph = wrap.querySelector('[data-stat="placeholder"]');
      if (ph) ph.innerHTML = 'Alege rol';
      return;
    }

    try {
      const res = await fetch('/admin-stats');
      if (!res.ok) throw new Error('admin-stats failed');
      const stats = await res.json();
      cells.forEach(c => {
        const el = wrap.querySelector(`[data-stat="${c.id}"]`);
        if (!el) return;
        const final = Number(stats[c.key] ?? 0) || 0;
        Atomify.countUp(el, final, {
          format: v => `<span class="num">${Math.round(v)}</span>`,
        });
      });
    } catch (err) {
      console.error('[admin] stats load failed', err);
      cells.forEach(c => {
        const el = wrap.querySelector(`[data-stat="${c.id}"]`);
        if (el) el.innerHTML = '<span class="num">—</span>';
      });
    }
  }


  /* ─── Role selection ──────────────────────────────── */
  function bindRolePicker() {
    qsa('.adm-role').forEach(el => {
      el.addEventListener('click', () => {
        const role = el.getAttribute('data-role');
        if (!role) return;
        el.style.transform = 'scale(0.97)';
        setTimeout(() => { el.style.transform = ''; selectRole(role); }, 140);
      });
    });
  }

  async function selectRole(role) {
    try {
      const res = await fetch('/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('admRoleMessage',
          `Profil completat. Ești acum ${role === 'student' ? 'student' : 'profesor'}.`,
          'success', true);
        currentUser.role = role;
        setTimeout(renderAuthenticated, 900);
      } else {
        showMessage('admRoleMessage', data.error || 'Eroare la setarea rolului', 'error');
      }
    } catch (err) {
      showMessage('admRoleMessage', 'Eroare de conexiune.', 'error');
    }
  }


  /* ─── Classes (professor view) ────────────────────── */
  async function loadMyClasses() {
    try {
      const res = await fetch('/my-classes');
      const data = await res.json();
      if (res.ok) renderMyClasses(data.classes || []);
    } catch (err) { console.error('[admin] my-classes', err); }
  }

  function renderMyClasses(classes) {
    const wrap = $('admMyClassesList');
    if (!wrap) return;
    if (!classes.length) {
      wrap.innerHTML = `
        <div class="adm-empty">
          Nicio clasă creată încă. Începe cu formularul de mai sus.
        </div>`;
      return;
    }
    wrap.innerHTML = `<div class="adm-list">${classes.map(cls => `
      <article class="adm-tile">
        <div class="adm-tile-head">
          <h4 class="adm-tile-title">${escapeHTML(cls.name)}</h4>
        </div>
        <p class="adm-tile-desc">${escapeHTML(cls.description || 'Fără descriere')}</p>
        <div class="adm-tile-meta">
          <span><strong>Studenți</strong> · ${cls.student_count ?? 0}</span>
          <span><strong>Creată</strong> · ${formatDate(cls.created_at)}</span>
        </div>
        <div class="adm-tile-actions">
          <button class="btn btn-ghost" data-class-id="${cls.id}" data-class-name="${escapeHTML(cls.name)}" data-action="open-class">Detalii</button>
        </div>
      </article>
    `).join('')}</div>`;

    wrap.querySelectorAll('[data-action="open-class"]').forEach(btn => {
      btn.addEventListener('click', () => {
        openClassDetails(parseInt(btn.getAttribute('data-class-id'), 10), btn.getAttribute('data-class-name'));
      });
    });

    // Populate quiz creation class dropdown
    const sel = $('admQuizClass');
    if (sel) {
      sel.innerHTML = '<option value="">Selectează clasa</option>' +
        classes.map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('');
    }
  }


  /* ─── Joined classes (student view) ──────────────── */
  async function loadJoinedClasses() {
    try {
      const res = await fetch('/my-classes');
      const data = await res.json();
      if (res.ok) renderJoinedClasses(data.classes || []);
    } catch (err) { console.error('[admin] joined-classes', err); }
  }

  function renderJoinedClasses(classes) {
    const wrap = $('admJoinedClassesList');
    if (!wrap) return;
    if (!classes.length) {
      wrap.innerHTML = `<div class="adm-empty">Nu ești membru al niciunei clase.</div>`;
      return;
    }
    wrap.innerHTML = `<div class="adm-list">${classes.map(cls => `
      <article class="adm-tile">
        <div class="adm-tile-head">
          <h4 class="adm-tile-title">${escapeHTML(cls.name)}</h4>
        </div>
        <p class="adm-tile-desc">${escapeHTML(cls.description || 'Fără descriere')}</p>
        <div class="adm-tile-meta">
          <span><strong>Profesor</strong> · ${escapeHTML(cls.professor_name || '—')}</span>
          <span><strong>Alăturat</strong> · ${formatDate(cls.joined_at)}</span>
        </div>
        <div class="adm-tile-actions">
          <button class="btn btn-ghost btn-danger-soft" data-class-id="${cls.id}" data-class-name="${escapeHTML(cls.name)}" data-action="exit-class">Ieși din clasă</button>
        </div>
      </article>
    `).join('')}</div>`;

    wrap.querySelectorAll('[data-action="exit-class"]').forEach(btn => {
      btn.addEventListener('click', () => {
        exitClassroom(parseInt(btn.getAttribute('data-class-id'), 10), btn.getAttribute('data-class-name'));
      });
    });
  }


  /* ─── Pending invitations (student) ───────────────── */
  async function loadPendingInvitations() {
    try {
      const res = await fetch('/pending-invitations');
      const data = await res.json();
      if (res.ok) renderPendingInvitations(data.invitations || []);
    } catch (err) { console.error('[admin] pending-invitations', err); }
  }

  function renderPendingInvitations(invs) {
    const wrap = $('admPendingInvitationsList');
    if (!wrap) return;
    if (!invs.length) {
      wrap.innerHTML = `<div class="adm-empty">Nu ai invitații pendente.</div>`;
      return;
    }
    wrap.innerHTML = `<div class="adm-list">${invs.map(inv => `
      <article class="adm-tile">
        <div class="adm-tile-head">
          <h4 class="adm-tile-title">${escapeHTML(inv.class_name)}</h4>
          <span class="adm-badge adm-badge--gold">Invitație</span>
        </div>
        <p class="adm-tile-desc">${escapeHTML(inv.class_description || 'Fără descriere')}</p>
        <div class="adm-tile-meta">
          <span><strong>Profesor</strong> · ${escapeHTML(inv.professor_name || '—')}</span>
          <span><strong>Trimisă</strong> · ${formatDate(inv.created_at)}</span>
        </div>
        <div class="adm-tile-actions">
          <button class="btn btn-primary" data-inv-id="${inv.id}" data-action="accept">Acceptă</button>
          <button class="btn btn-ghost" data-inv-id="${inv.id}" data-action="reject">Respinge</button>
        </div>
      </article>
    `).join('')}</div>`;

    wrap.querySelectorAll('[data-inv-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        respondInvitation(parseInt(btn.getAttribute('data-inv-id'), 10), btn.getAttribute('data-action') === 'accept');
      });
    });
  }

  async function respondInvitation(invitationId, accept) {
    try {
      const res = await fetch('/respond-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, accept }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('admGlobalMessage', data.message || 'Salvat.', 'success');
        loadPendingInvitations();
        if (accept) { loadJoinedClasses(); loadAdminStats(); }
      } else {
        showMessage('admGlobalMessage', data.error || 'Eroare', 'error');
      }
    } catch {
      showMessage('admGlobalMessage', 'Eroare de conexiune.', 'error');
    }
  }


  /* ─── Class actions ───────────────────────────────── */
  async function exitClassroom(classId, className) {
    if (!confirm(`Ieși din clasa "${className}"?`)) return;
    try {
      const res = await fetch('/exit-classroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('admGlobalMessage', 'Ai ieșit din clasă.', 'success');
        loadJoinedClasses();
        loadAdminStats();
      } else {
        showMessage('admGlobalMessage', data.error || 'Eroare', 'error');
      }
    } catch {
      showMessage('admGlobalMessage', 'Eroare de conexiune.', 'error');
    }
  }

  async function handleCreateClass(e) {
    e.preventDefault();
    const name = $('admClassName').value.trim();
    const description = $('admClassDescription').value.trim();
    if (!name) return;
    try {
      const res = await fetch('/create-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('admGlobalMessage', 'Clasa a fost creată.', 'success');
        $('admCreateClassForm').reset();
        loadMyClasses();
        loadAdminStats();
      } else {
        showMessage('admGlobalMessage', data.error || 'Eroare la creare', 'error');
      }
    } catch {
      showMessage('admGlobalMessage', 'Eroare de conexiune.', 'error');
    }
  }


  /* ─── Class details modal ─────────────────────────── */
  async function openClassDetails(classId, className) {
    currentClassId = classId;
    $('admClassModalTitle').textContent = `Detalii · ${className}`;
    $('admClassModal').classList.add('is-open');
    showStandardClassView();
    $('admInviteForm')?.reset();
    hideAutocomplete();
    setValidation('');
    hideCreateHomework();
    $('admClassMembersList').innerHTML = '<div class="adm-loading">Se încarcă</div>';
    $('admClassPendingList').innerHTML = '<div class="adm-loading">Se încarcă</div>';
    $('admClassHomeworkList').innerHTML = '<div class="adm-loading">Se încarcă</div>';
    await Promise.all([
      loadClassMembers(classId),
      loadClassHomework(classId),
    ]);
  }

  function showStandardClassView() {
    $('admClassStandardView')?.removeAttribute('hidden');
    $('admHomeworkDetailsView')?.setAttribute('hidden', '');
  }

  function showHomeworkDetailsView() {
    $('admClassStandardView')?.setAttribute('hidden', '');
    $('admHomeworkDetailsView')?.removeAttribute('hidden');
  }

  function closeClassDetails() {
    $('admClassModal').classList.remove('is-open');
    currentClassId = null;
  }

  async function loadClassMembers(classId) {
    try {
      const res = await fetch(`/class-members/${classId}`);
      const data = await res.json();
      if (res.ok) {
        renderClassMembers(data.members || []);
        renderClassPending(data.pendingInvitations || []);
      }
    } catch (err) { console.error('[admin] class-members', err); }
  }

  function renderClassMembers(members) {
    const wrap = $('admClassMembersList');
    if (!wrap) return;
    if (!members.length) {
      wrap.innerHTML = `<div class="adm-empty">Nu există încă membri în această clasă.</div>`;
      return;
    }
    wrap.innerHTML = `<div class="adm-rows">${members.map(m => `
      <div class="adm-row">
        <div class="adm-row-main">
          <span class="adm-row-title">${escapeHTML(m.username)}</span>
          <span class="adm-row-meta">${escapeHTML(m.email || 'fără email')} · alăturat ${formatDate(m.joined_at)}</span>
        </div>
        <div class="adm-row-actions">
          <button class="adm-mini-btn is-danger" data-member-id="${m.id}" data-member-name="${escapeHTML(m.username)}" data-action="remove-member">Elimină</button>
        </div>
      </div>
    `).join('')}</div>`;

    wrap.querySelectorAll('[data-action="remove-member"]').forEach(btn => {
      btn.addEventListener('click', () => {
        removeStudent(parseInt(btn.getAttribute('data-member-id'), 10), btn.getAttribute('data-member-name'));
      });
    });
  }

  function renderClassPending(invs) {
    const wrap = $('admClassPendingList');
    if (!wrap) return;
    if (!invs.length) {
      wrap.innerHTML = `<div class="adm-empty">Nicio invitație pendentă.</div>`;
      return;
    }
    wrap.innerHTML = `<div class="adm-rows">${invs.map(inv => `
      <div class="adm-row">
        <div class="adm-row-main">
          <span class="adm-row-title">${escapeHTML(inv.username)}</span>
          <span class="adm-row-meta">${escapeHTML(inv.email || 'fără email')} · invitat ${formatDate(inv.created_at)}</span>
        </div>
        <div class="adm-row-actions">
          <span class="adm-badge adm-badge--gold">Așteaptă</span>
        </div>
      </div>
    `).join('')}</div>`;
  }

  async function removeStudent(studentId, username) {
    if (!currentClassId) return;
    if (!confirm(`Elimini studentul "${username}" din această clasă?`)) return;
    try {
      const res = await fetch('/remove-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: currentClassId, studentId }),
      });
      const data = await res.json();
      if (res.ok) {
        loadClassMembers(currentClassId);
      } else {
        alert(data.error || 'Eroare la eliminare');
      }
    } catch {
      alert('Eroare de conexiune.');
    }
  }


  /* ─── Invite student (autocomplete) ───────────────── */
  function bindAutocomplete() {
    const input = $('admInviteUsername');
    if (!input) return;
    input.addEventListener('input', () => {
      const q = input.value.trim();
      setValidation('');
      if (!q) { hideAutocomplete(); return; }
      clearTimeout(acSearchTimeout);
      acSearchTimeout = setTimeout(() => searchUsers(q), 280);
    });
    input.addEventListener('keydown', acKeyNav);
    input.addEventListener('blur', () => {
      setTimeout(() => {
        hideAutocomplete();
        const v = input.value.trim();
        if (v) validateUsername(v);
      }, 180);
    });
    document.addEventListener('click', (e) => {
      const drop = $('admInviteDropdown');
      if (drop && !input.contains(e.target) && !drop.contains(e.target)) hideAutocomplete();
    });
  }

  function acKeyNav(e) {
    const drop = $('admInviteDropdown');
    if (!drop || !drop.classList.contains('is-open')) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      acHighlight = Math.min(acHighlight + 1, acSearchResults.length - 1);
      paintHighlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      acHighlight = Math.max(acHighlight - 1, -1);
      paintHighlight();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (acHighlight >= 0) pickUser(acSearchResults[acHighlight]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      hideAutocomplete();
    }
  }

  async function searchUsers(query) {
    try {
      const res = await fetch(`/search-users?query=${encodeURIComponent(query)}&limit=8`);
      const data = await res.json();
      if (res.ok) {
        acSearchResults = data.users || [];
        renderAutocomplete(acSearchResults);
      }
    } catch (err) {
      console.error('[admin] search-users', err);
      hideAutocomplete();
    }
  }

  function renderAutocomplete(users) {
    const drop = $('admInviteDropdown');
    if (!drop) return;
    acHighlight = -1;
    if (!users.length) {
      drop.innerHTML = '<div class="adm-autocomplete-empty">Nu s-au găsit utilizatori</div>';
    } else {
      drop.innerHTML = users.map((u, i) => `
        <div class="adm-autocomplete-item" data-index="${i}">${escapeHTML(u.username)}</div>
      `).join('');
      drop.querySelectorAll('.adm-autocomplete-item').forEach((item, i) => {
        item.addEventListener('mousedown', (e) => { e.preventDefault(); pickUser(users[i]); });
      });
    }
    drop.classList.add('is-open');
  }

  function hideAutocomplete() {
    const drop = $('admInviteDropdown');
    if (!drop) return;
    drop.classList.remove('is-open');
    acHighlight = -1;
  }

  function paintHighlight() {
    qsa('.adm-autocomplete-item').forEach((el, i) => {
      el.classList.toggle('is-highlighted', i === acHighlight);
    });
  }

  function pickUser(user) {
    const input = $('admInviteUsername');
    if (input) input.value = user.username;
    hideAutocomplete();
    validateUsername(user.username);
  }

  function setValidation(text, type = '') {
    const el = $('admInviteValidation');
    if (!el) return;
    if (!text) {
      el.classList.remove('is-visible', 'success', 'error', 'warning');
      el.textContent = '';
      return;
    }
    el.textContent = text;
    el.className = `adm-validation is-visible ${type}`;
  }

  async function validateUsername(username) {
    if (!username) return;
    try {
      const res = await fetch(`/check-user/${encodeURIComponent(username)}`);
      const data = await res.json();
      if (!res.ok) { setValidation('Eroare la verificare.', 'error'); return; }
      if (!data.exists) setValidation(data.message, 'error');
      else if (!data.valid) setValidation(data.message, 'warning');
      else if (data.needsRoleSelection) setValidation(`✓ ${data.message}`, 'success');
      else setValidation(`✓ Student găsit: ${data.user?.username || username}`, 'success');
    } catch {
      setValidation('Eroare de conexiune.', 'error');
    }
  }

  async function handleInviteStudent(e) {
    e.preventDefault();
    const username = $('admInviteUsername').value.trim();
    if (!currentClassId || !username) { setValidation('Introdu numele studentului.', 'error'); return; }
    try {
      const res = await fetch('/invite-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: currentClassId, studentUsername: username }),
      });
      const data = await res.json();
      if (res.ok) {
        setValidation('✓ Invitația a fost trimisă.', 'success');
        $('admInviteForm').reset();
        hideAutocomplete();
        loadClassMembers(currentClassId);
        setTimeout(() => setValidation(''), 3000);
      } else {
        setValidation(data.error || 'Eroare la trimitere', 'error');
      }
    } catch {
      setValidation('Eroare de conexiune.', 'error');
    }
  }


  /* ─── Class homework (professor inside modal) ──────── */
  function showCreateHomework() {
    $('admHomeworkForm').removeAttribute('hidden');
    $('admShowHomeworkFormBtn').setAttribute('hidden', '');
    loadAvailableQuizzesForHomework();
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    $('admHomeworkDueDate').min = now.toISOString().slice(0, 16);
  }
  function hideCreateHomework() {
    $('admHomeworkForm')?.setAttribute('hidden', '');
    $('admShowHomeworkFormBtn')?.removeAttribute('hidden');
    $('admHomeworkCreationForm')?.reset();
  }

  async function loadAvailableQuizzesForHomework() {
    try {
      const res = await fetch('/api/quizzes');
      if (!res.ok) return;
      const quizzes = await res.json();
      const sel = $('admHomeworkQuiz');
      if (!sel) return;
      sel.innerHTML = '<option value="">Selectează chestionarul</option>' +
        (quizzes || []).map(q => `<option value="${q.id}" data-name="${escapeHTML(q.title)}">${escapeHTML(q.title)}</option>`).join('');
    } catch (err) { console.error('[admin] quizzes', err); }
  }

  async function handleCreateHomework(e) {
    e.preventDefault();
    const title = $('admHomeworkTitle').value.trim();
    const description = $('admHomeworkDescription').value.trim();
    const quizSelect = $('admHomeworkQuiz');
    const quizId = quizSelect.value;
    const quizName = quizSelect.selectedOptions[0]?.dataset.name || '';
    const dueDate = $('admHomeworkDueDate').value;
    const maxAttempts = parseInt($('admHomeworkMaxAttempts').value, 10) || 1;

    if (!currentClassId || !title || !quizId || !dueDate) {
      alert('Completează toate câmpurile obligatorii.');
      return;
    }
    try {
      const res = await fetch('/create-homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: currentClassId, title, description, quizId, quizName, dueDate, maxAttempts }),
      });
      const data = await res.json();
      if (res.ok) {
        hideCreateHomework();
        loadClassHomework(currentClassId);
      } else {
        alert(data.error || 'Eroare la creare');
      }
    } catch { alert('Eroare de conexiune.'); }
  }

  async function loadClassHomework(classId) {
    try {
      const res = await fetch(`/class/${classId}/homework`);
      if (!res.ok) return;
      const data = await res.json();
      renderClassHomework(data.assignments || []);
    } catch (err) { console.error('[admin] class homework', err); }
  }

  function homeworkStatus(a) {
    if (a.is_overdue) return ['Expirat', 'overdue'];
    const due = new Date(a.due_date);
    const days = Math.ceil((due - new Date()) / 86400000);
    if (days <= 2) return ['Expiră curând', 'due'];
    return ['Activă', 'active'];
  }

  function renderClassHomework(assignments) {
    const wrap = $('admClassHomeworkList');
    if (!wrap) return;
    if (!assignments.length) {
      wrap.innerHTML = `<div class="adm-empty">Nicio temă creată pentru această clasă.</div>`;
      return;
    }
    wrap.innerHTML = `<div class="adm-list">${assignments.map(a => {
      const [label, tone] = homeworkStatus(a);
      const completion = a.total_students > 0
        ? Math.round((a.submitted_count / a.total_students) * 100)
        : 0;
      return `
        <article class="adm-tile">
          <div class="adm-tile-head">
            <h4 class="adm-tile-title">${escapeHTML(a.title)}</h4>
            <span class="adm-badge adm-badge--${tone}">${label}</span>
          </div>
          <p class="adm-tile-desc">${escapeHTML(a.quiz_name || '—')}${a.description ? ' · ' + escapeHTML(a.description) : ''}</p>
          <div class="adm-tile-meta">
            <span><strong>Termen</strong> · ${formatDateTime(a.due_date)}</span>
            <span><strong>Trimise</strong> · ${a.submitted_count}/${a.total_students} (${completion}%)</span>
            <span><strong>Încercări</strong> · ${a.max_attempts}</span>
          </div>
          <div class="adm-tile-actions">
            <button class="btn btn-ghost" data-homework-id="${a.id}" data-action="homework-details">Vezi clasament</button>
          </div>
        </article>
      `;
    }).join('')}</div>`;

    wrap.querySelectorAll('[data-action="homework-details"]').forEach(btn => {
      btn.addEventListener('click', () => viewHomeworkDetails(parseInt(btn.getAttribute('data-homework-id'), 10)));
    });
  }

  async function viewHomeworkDetails(homeworkId) {
    try {
      const res = await fetch(`/homework/${homeworkId}/details`);
      if (!res.ok) { alert('Eroare la încărcarea detaliilor'); return; }
      const data = await res.json();
      renderHomeworkDetails(data);
    } catch { alert('Eroare de conexiune.'); }
  }

  function renderHomeworkDetails({ homework, submissions }) {
    const view = $('admHomeworkDetailsView');
    const title = $('admClassModalTitle');
    if (!view || !title) return;
    title.textContent = homework.title;
    view.innerHTML = `
      <section class="adm-card">
        <div class="adm-card-head">
          <h3 class="adm-card-title">Sumar temă</h3>
          <span class="adm-card-sub">Clasa: ${escapeHTML(homework.class_name)}</span>
        </div>
        <div class="adm-tile-meta">
          <span><strong>Chestionar</strong> · ${escapeHTML(homework.quiz_name || '—')}</span>
          <span><strong>Termen</strong> · ${formatDateTime(homework.due_date)}</span>
          <span><strong>Încercări</strong> · ${homework.max_attempts}</span>
        </div>
        ${homework.description ? `<p class="adm-tile-desc">${escapeHTML(homework.description)}</p>` : ''}
      </section>

      <section class="adm-card">
        <div class="adm-card-head">
          <h3 class="adm-card-title">Clasament studenți</h3>
          <span class="adm-card-sub">${submissions.length} înregistrări</span>
        </div>
        <div class="table-wrap">
          <table class="adm-sub-table">
            <thead>
              <tr>
                <th>Rang</th>
                <th>Student</th>
                <th class="right">Scor</th>
                <th class="right">Procent</th>
                <th class="right">Timp</th>
                <th class="right">Trimisă</th>
              </tr>
            </thead>
            <tbody>
              ${submissions.map(s => {
                if (s.score == null) {
                  return `
                    <tr>
                      <td>—</td>
                      <td>${escapeHTML(s.username)}</td>
                      <td colspan="4" class="adm-sub-empty">Nu a trimis tema</td>
                    </tr>
                  `;
                }
                const rankCls = s.rank <= 3 ? `adm-sub-rank adm-sub-rank--${s.rank}` : 'adm-sub-rank';
                const pctCls = s.percentage >= 80 ? 'adm-sub-pct--excellent'
                            : s.percentage >= 60 ? 'adm-sub-pct--good'
                            : 'adm-sub-pct--low';
                return `
                  <tr>
                    <td class="${rankCls}">${s.rank}</td>
                    <td>${escapeHTML(s.username)}</td>
                    <td class="right">${s.score}/${s.total_questions}</td>
                    <td class="right ${pctCls}">${s.percentage}%</td>
                    <td class="right num">${formatTime(s.time_taken)}</td>
                    <td class="right">${formatDateTime(s.submitted_at)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <div>
        <button type="button" class="btn btn-ghost" data-action="back-to-class">Înapoi la detalii clasă</button>
      </div>
    `;
    view.querySelector('[data-action="back-to-class"]')?.addEventListener('click', () => {
      // Restore the standard view title from currently-open class
      if (currentClassId != null) {
        // Try to recover the class name from the open tile (best-effort fallback).
        const tile = document.querySelector(`[data-class-id="${currentClassId}"][data-class-name]`);
        const name = tile ? tile.getAttribute('data-class-name') : '';
        if (name) title.textContent = `Detalii · ${name}`;
      }
      showStandardClassView();
    });
    showHomeworkDetailsView();
  }

  // (kept for reference; not used now that we toggle two persistent views instead of replacing innerHTML)
  // eslint-disable-next-line no-unused-vars
  function standardClassBody() {
    // The original structure expected by the modal — used to restore after homework details view
    return `
      <section class="adm-card">
        <div class="adm-card-head">
          <h3 class="adm-card-title">Invită student</h3>
          <span class="adm-card-sub">Autocomplete</span>
        </div>
        <form id="admInviteForm" class="adm-form" autocomplete="off">
          <div class="adm-form-group">
            <label class="adm-form-label" for="admInviteUsername">Nume utilizator</label>
            <div class="adm-autocomplete">
              <input id="admInviteUsername" class="adm-input" type="text" placeholder="Introdu numele studentului" autocomplete="off" required />
              <div id="admInviteDropdown" class="adm-autocomplete-dropdown"></div>
            </div>
            <div id="admInviteValidation" class="adm-validation"></div>
          </div>
          <div class="adm-form-actions">
            <button type="submit" class="btn btn-primary">Trimite invitație</button>
          </div>
        </form>
      </section>

      <section class="adm-card">
        <div class="adm-card-head">
          <h3 class="adm-card-title">Teme</h3>
          <button id="admShowHomeworkFormBtn" class="btn btn-ghost" type="button">Creează temă nouă</button>
        </div>
        <div id="admHomeworkForm" hidden>
          <form id="admHomeworkCreationForm" class="adm-form">
            <div class="adm-form-group">
              <label class="adm-form-label" for="admHomeworkTitle">Titlu</label>
              <input id="admHomeworkTitle" class="adm-input" type="text" placeholder="Ex: Tema 1 · Chimia organică" required />
            </div>
            <div class="adm-form-group">
              <label class="adm-form-label" for="admHomeworkDescription">Descriere (opțional)</label>
              <textarea id="admHomeworkDescription" class="adm-textarea" placeholder="Instrucțiuni suplimentare"></textarea>
            </div>
            <div class="adm-form-group">
              <label class="adm-form-label" for="admHomeworkQuiz">Chestionar</label>
              <select id="admHomeworkQuiz" class="adm-select" required></select>
            </div>
            <div class="adm-form-row">
              <div class="adm-form-group">
                <label class="adm-form-label" for="admHomeworkDueDate">Termen limită</label>
                <input id="admHomeworkDueDate" class="adm-input" type="datetime-local" required />
              </div>
              <div class="adm-form-group">
                <label class="adm-form-label" for="admHomeworkMaxAttempts">Încercări maxime</label>
                <select id="admHomeworkMaxAttempts" class="adm-select">
                  <option value="1">1 încercare</option>
                  <option value="2">2 încercări</option>
                  <option value="3">3 încercări</option>
                  <option value="5">5 încercări</option>
                </select>
              </div>
            </div>
            <div class="adm-form-actions">
              <button type="submit" class="btn btn-primary">Creează tema</button>
              <button type="button" class="btn btn-ghost" id="admCancelHomeworkBtn">Anulează</button>
            </div>
          </form>
        </div>
        <div id="admClassHomeworkList"></div>
      </section>

      <section class="adm-card">
        <div class="adm-card-head"><h3 class="adm-card-title">Membri clasă</h3></div>
        <div id="admClassMembersList"></div>
      </section>

      <section class="adm-card">
        <div class="adm-card-head"><h3 class="adm-card-title">Invitații pendente</h3></div>
        <div id="admClassPendingList"></div>
      </section>
    `;
  }


  /* ─── Quiz management (professor) ─────────────────── */
  async function loadMyQuizzes() {
    try {
      const res = await fetch('/api/classroom-quizzes/professor');
      const data = await res.json();
      if (res.ok) renderMyQuizzes(data || []);
    } catch (err) { console.error('[admin] my quizzes', err); }
  }

  function renderMyQuizzes(quizzes) {
    const wrap = $('admMyQuizzesList');
    if (!wrap) return;
    if (!quizzes.length) {
      wrap.innerHTML = `<div class="adm-empty">Nu ai creat încă niciun chestionar.</div>`;
      return;
    }
    wrap.innerHTML = `<div class="adm-list">${quizzes.map(q => `
      <article class="adm-tile">
        <div class="adm-tile-head">
          <h4 class="adm-tile-title">${escapeHTML(q.title)}</h4>
          <span class="adm-badge">${(q.questions || []).length} întrebări</span>
        </div>
        <p class="adm-tile-desc">${escapeHTML(q.description || 'Fără descriere')}</p>
        <div class="adm-tile-meta">
          <span><strong>Clasă</strong> · ${escapeHTML(q.class_name || '—')}</span>
          <span><strong>Timp</strong> · ${Math.max(1, Math.floor((q.time_limit || 0)/60))} min</span>
          <span><strong>Creat</strong> · ${formatDate(q.created_at)}</span>
        </div>
        <div class="adm-tile-actions">
          <button class="btn btn-ghost" data-quiz-id="${q.id}" data-action="edit-quiz">Editează</button>
          <button class="btn btn-ghost btn-danger-soft" data-quiz-id="${q.id}" data-quiz-title="${escapeHTML(q.title)}" data-action="delete-quiz">Șterge</button>
        </div>
      </article>
    `).join('')}</div>`;

    wrap.querySelectorAll('[data-action="edit-quiz"]').forEach(btn => {
      btn.addEventListener('click', () => editQuiz(parseInt(btn.getAttribute('data-quiz-id'), 10)));
    });
    wrap.querySelectorAll('[data-action="delete-quiz"]').forEach(btn => {
      btn.addEventListener('click', () => deleteQuiz(parseInt(btn.getAttribute('data-quiz-id'), 10), btn.getAttribute('data-quiz-title')));
    });
  }


  /* Quiz builder */
  function addQuestion() {
    questionCounter++;
    const qid = `q_${questionCounter}`;
    const html = `
      <div class="adm-question" data-question-id="${qid}">
        <div class="adm-question-head">
          <span class="adm-question-num">Întrebare ${questionCounter}</span>
          <button type="button" class="adm-mini-btn is-danger" data-action="remove-question">Șterge</button>
        </div>
        <div class="adm-type-row">
          <label class="adm-type-pill"><input type="radio" name="${qid}_type" value="multiple-choice" checked /> Alegere multiplă</label>
          <label class="adm-type-pill"><input type="radio" name="${qid}_type" value="text" /> Răspuns text</label>
        </div>
        <div class="adm-form-group">
          <label class="adm-form-label">Text întrebare</label>
          <textarea class="adm-textarea adm-question-text" placeholder="Scrie întrebarea…" required></textarea>
        </div>
        <div class="adm-form-group adm-options" data-qid="${qid}">
          <div class="adm-options-head">
            <span class="adm-form-label">Opțiuni de răspuns</span>
            <span class="adm-form-help">Selectează răspunsul corect</span>
          </div>
          <div class="adm-option is-correct">
            <label class="adm-option-correct"><input type="radio" name="${qid}_correct" value="0" checked /> Corect</label>
            <input type="text" class="adm-option-input" placeholder="Opțiunea 1" required />
            <button type="button" class="adm-mini-btn is-danger" data-action="remove-option" hidden>Șterge</button>
          </div>
          <div class="adm-option">
            <label class="adm-option-correct"><input type="radio" name="${qid}_correct" value="1" /> Corect</label>
            <input type="text" class="adm-option-input" placeholder="Opțiunea 2" required />
            <button type="button" class="adm-mini-btn is-danger" data-action="remove-option" hidden>Șterge</button>
          </div>
          <button type="button" class="adm-mini-btn" data-action="add-option">+ Adaugă opțiune</button>
        </div>
        <div class="adm-form-group adm-text-answers" data-qid="${qid}" hidden>
          <span class="adm-form-label">Răspunsuri corecte (≥ 1)</span>
          <div class="adm-text-answer">
            <input type="text" class="adm-input adm-text-answer-input" placeholder="Răspuns corect 1" />
            <button type="button" class="adm-mini-btn is-danger" data-action="remove-text-answer" hidden>Șterge</button>
          </div>
          <button type="button" class="adm-mini-btn" data-action="add-text-answer">+ Adaugă răspuns</button>
        </div>
        <div class="adm-form-group">
          <label class="adm-form-label">Explicație (opțional)</label>
          <textarea class="adm-textarea adm-question-explanation" placeholder="Explicație pentru răspunsul corect"></textarea>
        </div>
      </div>
    `;
    $('admQuestionsContainer').insertAdjacentHTML('beforeend', html);
    const node = qs(`[data-question-id="${qid}"]`);
    bindQuestionNode(node);
    refreshRemoveButtons();
  }

  function bindQuestionNode(node) {
    // type pills
    node.querySelectorAll(`input[type="radio"][name$="_type"]`).forEach(r => {
      r.addEventListener('change', () => {
        const isMC = r.value === 'multiple-choice' && r.checked;
        const isTxt = r.value === 'text' && r.checked;
        if (r.checked) {
          const opts = node.querySelector('.adm-options');
          const txt  = node.querySelector('.adm-text-answers');
          if (isMC) { opts.removeAttribute('hidden'); txt.setAttribute('hidden', ''); }
          if (isTxt) { opts.setAttribute('hidden', ''); txt.removeAttribute('hidden'); }
          // Toggle required attributes
          opts.querySelectorAll('.adm-option-input').forEach(i => isMC ? i.setAttribute('required','') : i.removeAttribute('required'));
          txt.querySelectorAll('.adm-text-answer-input').forEach(i => isTxt ? i.setAttribute('required','') : i.removeAttribute('required'));
        }
      });
    });

    // remove question
    node.querySelector('[data-action="remove-question"]')?.addEventListener('click', () => {
      node.remove();
      renumberQuestions();
      refreshRemoveButtons();
    });

    // option correct → visual
    node.querySelectorAll(`input[type="radio"][name$="_correct"]`).forEach(r => {
      r.addEventListener('change', () => {
        const opts = node.querySelector('.adm-options');
        opts.querySelectorAll('.adm-option').forEach(o => {
          const radio = o.querySelector('input[type="radio"]');
          o.classList.toggle('is-correct', !!(radio && radio.checked));
        });
      });
    });

    // add option
    node.querySelector('[data-action="add-option"]')?.addEventListener('click', () => {
      const opts = node.querySelector('.adm-options');
      const qid = opts.getAttribute('data-qid');
      const idx = opts.querySelectorAll('.adm-option').length;
      const optHtml = `
        <div class="adm-option">
          <label class="adm-option-correct"><input type="radio" name="${qid}_correct" value="${idx}" /> Corect</label>
          <input type="text" class="adm-option-input" placeholder="Opțiunea ${idx + 1}" required />
          <button type="button" class="adm-mini-btn is-danger" data-action="remove-option">Șterge</button>
        </div>
      `;
      node.querySelector('[data-action="add-option"]').insertAdjacentHTML('beforebegin', optHtml);
      const newOpt = opts.querySelector('.adm-option:last-of-type');
      bindOption(newOpt, node);
      refreshRemoveButtons();
    });

    // existing option remove buttons
    node.querySelectorAll('.adm-option').forEach(o => bindOption(o, node));

    // add text answer
    node.querySelector('[data-action="add-text-answer"]')?.addEventListener('click', () => {
      const txt = node.querySelector('.adm-text-answers');
      const idx = txt.querySelectorAll('.adm-text-answer').length;
      const html = `
        <div class="adm-text-answer">
          <input type="text" class="adm-input adm-text-answer-input" placeholder="Răspuns corect ${idx + 1}" />
          <button type="button" class="adm-mini-btn is-danger" data-action="remove-text-answer">Șterge</button>
        </div>
      `;
      node.querySelector('[data-action="add-text-answer"]').insertAdjacentHTML('beforebegin', html);
      const newAns = txt.querySelector('.adm-text-answer:last-of-type');
      bindTextAnswer(newAns);
      refreshRemoveButtons();
    });

    node.querySelectorAll('.adm-text-answer').forEach(a => bindTextAnswer(a));
  }

  function bindOption(opt, node) {
    opt.querySelector('input[type="radio"]')?.addEventListener('change', () => {
      node.querySelectorAll('.adm-option').forEach(o => {
        const r = o.querySelector('input[type="radio"]');
        o.classList.toggle('is-correct', !!(r && r.checked));
      });
    });
    opt.querySelector('[data-action="remove-option"]')?.addEventListener('click', () => {
      const opts = opt.parentElement;
      opt.remove();
      // Re-index radio button values + placeholders
      opts.querySelectorAll('.adm-option').forEach((o, i) => {
        const r = o.querySelector('input[type="radio"]');
        const inp = o.querySelector('.adm-option-input');
        if (r) r.value = i;
        if (inp) inp.placeholder = `Opțiunea ${i + 1}`;
      });
      refreshRemoveButtons();
    });
  }

  function bindTextAnswer(a) {
    a.querySelector('[data-action="remove-text-answer"]')?.addEventListener('click', () => {
      const parent = a.parentElement;
      a.remove();
      parent.querySelectorAll('.adm-text-answer').forEach((x, i) => {
        const inp = x.querySelector('.adm-text-answer-input');
        if (inp) inp.placeholder = `Răspuns corect ${i + 1}`;
      });
      refreshRemoveButtons();
    });
  }

  function renumberQuestions() {
    const list = qsa('.adm-question');
    list.forEach((q, i) => {
      const nlabel = q.querySelector('.adm-question-num');
      if (nlabel) nlabel.textContent = `Întrebare ${i + 1}`;
    });
    questionCounter = list.length;
  }

  function refreshRemoveButtons() {
    qsa('.adm-options').forEach(opts => {
      const list = opts.querySelectorAll('.adm-option');
      list.forEach(o => {
        const btn = o.querySelector('[data-action="remove-option"]');
        if (!btn) return;
        if (list.length > 2) btn.removeAttribute('hidden');
        else btn.setAttribute('hidden', '');
      });
    });
    qsa('.adm-text-answers').forEach(txt => {
      const list = txt.querySelectorAll('.adm-text-answer');
      list.forEach(a => {
        const btn = a.querySelector('[data-action="remove-text-answer"]');
        if (!btn) return;
        if (list.length > 1) btn.removeAttribute('hidden');
        else btn.setAttribute('hidden', '');
      });
    });
  }

  function collectQuizData() {
    const classId = $('admQuizClass').value;
    const title = $('admQuizTitle').value.trim();
    const description = $('admQuizDescription').value.trim();
    const timeLimit = (parseInt($('admQuizTimeLimit').value, 10) || 10) * 60;
    const questions = [];

    qsa('.adm-question').forEach(node => {
      const qid = node.getAttribute('data-question-id');
      const text = node.querySelector('.adm-question-text').value.trim();
      const explanation = node.querySelector('.adm-question-explanation').value.trim() || null;
      const typeR = node.querySelector(`input[name="${qid}_type"]:checked`);
      const type = typeR ? typeR.value : 'multiple-choice';

      const q = { id: qid, question: text, type, explanation };
      if (type === 'multiple-choice') {
        const options = [];
        node.querySelectorAll('.adm-option-input').forEach(inp => {
          const v = inp.value.trim();
          if (v) options.push(v);
        });
        const cr = node.querySelector(`input[name="${qid}_correct"]:checked`);
        q.options = options;
        q.correctAnswer = cr ? parseInt(cr.value, 10) : 0;
      } else {
        const answers = [];
        node.querySelectorAll('.adm-text-answer-input').forEach(inp => {
          const v = inp.value.trim();
          if (v) answers.push(v);
        });
        q.correctAnswers = answers;
      }
      questions.push(q);
    });

    return { classId, title, description, timeLimit, questions };
  }

  async function handleCreateQuiz(e) {
    e.preventDefault();
    const data = collectQuizData();
    if (!data.classId || !data.title || data.questions.length === 0) {
      alert('Completează toate câmpurile obligatorii și adaugă cel puțin o întrebare.');
      return;
    }
    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      if (!q.question) { alert(`Întrebarea ${i + 1} nu are text.`); return; }
      if (q.type === 'multiple-choice' && (!q.options || q.options.length < 2)) {
        alert(`Întrebarea ${i + 1} trebuie să aibă cel puțin 2 opțiuni.`); return;
      }
      if (q.type === 'text' && (!q.correctAnswers || q.correctAnswers.length === 0)) {
        alert(`Întrebarea ${i + 1} trebuie să aibă cel puțin un răspuns corect.`); return;
      }
    }

    const isUpdate = isEditMode && currentEditQuizId;
    const url = isUpdate ? `/api/classroom-quiz/${currentEditQuizId}` : '/api/classroom-quiz';
    const method = isUpdate ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const out = await res.json();
      if (res.ok) {
        showMessage('admGlobalMessage', isUpdate ? 'Chestionarul a fost actualizat.' : 'Chestionarul a fost creat.', 'success');
        if (isUpdate) cancelEdit();
        else {
          $('admCreateQuizForm').reset();
          $('admQuestionsContainer').innerHTML = '';
          questionCounter = 0;
          setTimeout(addQuestion, 60);
        }
        loadMyQuizzes();
        loadAdminStats();
      } else {
        alert('Eroare: ' + (out.error || ''));
      }
    } catch {
      alert('Eroare la salvarea chestionarului.');
    }
  }

  async function deleteQuiz(quizId, title) {
    if (!confirm(`Ștergi chestionarul "${title}"? Această acțiune nu poate fi anulată.`)) return;
    try {
      const res = await fetch(`/api/classroom-quiz/${quizId}`, { method: 'DELETE' });
      const out = await res.json();
      if (res.ok) {
        showMessage('admGlobalMessage', 'Chestionarul a fost șters.', 'success');
        loadMyQuizzes();
        loadAdminStats();
      } else { alert('Eroare: ' + (out.error || '')); }
    } catch { alert('Eroare la ștergere.'); }
  }

  async function editQuiz(quizId) {
    try {
      const res = await fetch(`/api/classroom-quiz/${quizId}`);
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Eroare la încărcare'); return; }

      isEditMode = true;
      currentEditQuizId = quizId;
      $('admQuizFormTitle').textContent = 'Editează chestionar';
      $('admQuizSubmitBtn').textContent = 'Actualizează chestionarul';
      $('admQuizCancelEditBtn').removeAttribute('hidden');

      $('admQuizClass').value = data.classId || '';
      $('admQuizTitle').value = data.title || '';
      $('admQuizDescription').value = data.description || '';
      $('admQuizTimeLimit').value = Math.max(1, Math.round((data.timeLimit || 600) / 60));

      $('admQuestionsContainer').innerHTML = '';
      questionCounter = 0;

      (data.questions || []).forEach(q => {
        addQuestion();
        const node = qs(`[data-question-id="q_${questionCounter}"]`);
        const qid = `q_${questionCounter}`;
        node.querySelector('.adm-question-text').value = q.question || '';
        node.querySelector('.adm-question-explanation').value = q.explanation || '';

        if (q.type === 'text') {
          node.querySelector(`input[name="${qid}_type"][value="text"]`).checked = true;
          node.querySelector(`input[name="${qid}_type"][value="text"]`).dispatchEvent(new Event('change'));
          const txt = node.querySelector('.adm-text-answers');
          txt.querySelectorAll('.adm-text-answer').forEach(a => a.remove());
          (q.correctAnswers || []).forEach((ans, i) => {
            const addBtn = txt.querySelector('[data-action="add-text-answer"]');
            const html = `
              <div class="adm-text-answer">
                <input type="text" class="adm-input adm-text-answer-input" placeholder="Răspuns corect ${i + 1}" value="${escapeHTML(ans)}" />
                <button type="button" class="adm-mini-btn is-danger" data-action="remove-text-answer">Șterge</button>
              </div>
            `;
            addBtn.insertAdjacentHTML('beforebegin', html);
            bindTextAnswer(txt.querySelector('.adm-text-answer:last-of-type'));
          });
        } else {
          const opts = node.querySelector('.adm-options');
          opts.querySelectorAll('.adm-option').forEach(o => o.remove());
          (q.options || []).forEach((optText, i) => {
            const addBtn = opts.querySelector('[data-action="add-option"]');
            const html = `
              <div class="adm-option">
                <label class="adm-option-correct"><input type="radio" name="${qid}_correct" value="${i}" ${i === q.correctAnswer ? 'checked' : ''} /> Corect</label>
                <input type="text" class="adm-option-input" placeholder="Opțiunea ${i + 1}" value="${escapeHTML(optText)}" required />
                <button type="button" class="adm-mini-btn is-danger" data-action="remove-option">Șterge</button>
              </div>
            `;
            addBtn.insertAdjacentHTML('beforebegin', html);
            const newOpt = opts.querySelector('.adm-option:last-of-type');
            bindOption(newOpt, node);
            if (i === q.correctAnswer) newOpt.classList.add('is-correct');
          });
        }
        refreshRemoveButtons();
      });

      if (questionCounter === 0) addQuestion();

      $('admChapterQuizzes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error('[admin] edit quiz', err);
      alert('Eroare la încărcarea chestionarului.');
    }
  }

  function cancelEdit() {
    isEditMode = false;
    currentEditQuizId = null;
    $('admQuizFormTitle').textContent = 'Creează chestionar';
    $('admQuizSubmitBtn').textContent = 'Creează chestionarul';
    $('admQuizCancelEditBtn').setAttribute('hidden', '');
    $('admCreateQuizForm').reset();
    $('admQuestionsContainer').innerHTML = '';
    questionCounter = 0;
    setTimeout(addQuestion, 60);
  }


  /* ─── Student homework ────────────────────────────── */
  async function loadStudentHomework() {
    try {
      const res = await fetch('/my-homework');
      if (!res.ok) {
        $('admStudentHomeworkList').innerHTML = `<div class="adm-empty">Eroare la încărcare.</div>`;
        return;
      }
      const data = await res.json();
      renderStudentHomework(data.assignments || []);
    } catch (err) {
      $('admStudentHomeworkList').innerHTML = `<div class="adm-empty">Eroare de conexiune.</div>`;
    }
  }

  function renderStudentHomework(assignments) {
    const wrap = $('admStudentHomeworkList');
    if (!wrap) return;
    if (!assignments.length) {
      wrap.innerHTML = `<div class="adm-empty">Nu ai teme atribuite momentan.</div>`;
      return;
    }
    wrap.innerHTML = `<div class="adm-list">${assignments.map(a => {
      const isSubmitted = !!a.is_submitted;
      let label = 'Activă', tone = 'active';
      if (isSubmitted) { label = 'Trimisă'; tone = 'submitted'; }
      else if (a.is_overdue) { label = 'Expirată'; tone = 'overdue'; }
      else {
        const days = Math.ceil((new Date(a.due_date) - new Date()) / 86400000);
        if (days <= 2) { label = 'Expiră curând'; tone = 'due'; }
      }
      const canSubmit = !a.is_overdue && (!isSubmitted || a.attempt_number < a.max_attempts);
      const submissionInfo = isSubmitted ? `
        <div class="adm-tile-meta">
          <span><strong>Scor</strong> · ${a.score}/${a.total_questions} (${a.percentage}%)</span>
          <span><strong>Timp</strong> · ${formatTime(a.time_taken)}</span>
          <span><strong>Trimisă</strong> · ${formatDateTime(a.submitted_at)}</span>
        </div>` : '';
      return `
        <article class="adm-tile">
          <div class="adm-tile-head">
            <h4 class="adm-tile-title">${escapeHTML(a.title)}</h4>
            <span class="adm-badge adm-badge--${tone}">${label}</span>
          </div>
          <p class="adm-tile-desc">${escapeHTML(a.class_name || '')}${a.quiz_name ? ' · ' + escapeHTML(a.quiz_name) : ''}</p>
          ${a.description ? `<p class="adm-tile-desc">${escapeHTML(a.description)}</p>` : ''}
          ${submissionInfo}
          <div class="adm-tile-meta">
            <span><strong>Termen</strong> · ${formatDateTime(a.due_date)}</span>
            <span><strong>Încercări max</strong> · ${a.max_attempts}</span>
            ${isSubmitted ? `<span><strong>Încercare curentă</strong> · ${a.attempt_number}</span>` : ''}
          </div>
          <div class="adm-tile-actions">
            ${canSubmit ? `
              <button class="btn btn-primary" data-action="start-homework" data-hw-id="${a.id}" data-quiz-id="${a.quiz_id}">${isSubmitted ? 'Încearcă din nou' : 'Începe tema'}</button>
            ` : `
              <button class="btn btn-ghost" disabled>${a.is_overdue ? 'Expirată' : 'Completată'}</button>
            `}
          </div>
        </article>
      `;
    }).join('')}</div>`;

    wrap.querySelectorAll('[data-action="start-homework"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const homeworkId = btn.getAttribute('data-hw-id');
        const quizId = btn.getAttribute('data-quiz-id');
        sessionStorage.setItem('currentHomeworkId', homeworkId);
        sessionStorage.setItem('isHomeworkMode', 'true');
        window.location.href = `chestionare.html?quiz=${quizId}&homework=${homeworkId}`;
      });
    });
  }


  /* ─── Country ─────────────────────────────────────── */
  async function handleCountrySubmit(e) {
    e.preventDefault();
    const country = $('admCountrySelect').value;
    if (!country) { showMessage('admPrefsMessage', 'Selectează o țară.', 'error'); return; }
    try {
      const res = await fetch('/set-country', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country }),
      });
      const data = await res.json();
      if (res.ok) {
        currentUser.country = data.country;
        $('admCountryCurrent').removeAttribute('hidden');
        $('admCountryCurrentName').textContent = data.country;
        renderHero();
        showMessage('admPrefsMessage', 'Țara a fost salvată.', 'success');
      } else {
        showMessage('admPrefsMessage', data.error || 'Eroare', 'error');
      }
    } catch {
      showMessage('admPrefsMessage', 'Eroare de conexiune.', 'error');
    }
  }


  /* ─── Newsletter ──────────────────────────────────── */
  async function loadNewsletterStatus() {
    try {
      const res = await fetch('/newsletter-status');
      const data = await res.json();
      const emailDisplay = $('admNlEmail');
      const statusEl = $('admNlStatus');
      const input = $('admNlEmailInput');
      const subBtn = $('admNlSubscribeBtn');
      const unsubBtn = $('admNlUnsubscribeBtn');

      if (data.email) {
        input.value = data.email;
        emailDisplay.textContent = data.email;
      } else {
        emailDisplay.textContent = 'Fără email';
      }
      if (data.subscribed) {
        statusEl.textContent = 'Abonat';
        statusEl.classList.add('is-subscribed');
        subBtn.setAttribute('hidden', '');
        unsubBtn.removeAttribute('hidden');
      } else {
        statusEl.textContent = 'Neabonat';
        statusEl.classList.remove('is-subscribed');
        subBtn.removeAttribute('hidden');
        unsubBtn.setAttribute('hidden', '');
      }
      updateNlButtons();
    } catch (err) {
      $('admNlStatus').textContent = 'Eroare la încărcare';
      $('admNlEmail').textContent = 'Eroare la încărcare';
    }
  }

  function updateNlButtons() {
    const v = $('admNlEmailInput').value;
    const valid = !!(v && v.includes('@'));
    [$('admNlSubscribeBtn'), $('admNlUnsubscribeBtn')].forEach(b => {
      if (!b) return;
      b.disabled = !valid;
    });
  }

  async function handleNlSubscribe() {
    const email = $('admNlEmailInput').value;
    const btn = $('admNlSubscribeBtn');
    btn.disabled = true;
    try {
      const res = await fetch('/newsletter-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('admPrefsMessage', data.message || 'Abonat.', 'success');
        await loadNewsletterStatus();
      } else {
        showMessage('admPrefsMessage', data.error || 'Eroare', 'error');
      }
    } catch {
      showMessage('admPrefsMessage', 'Eroare de conexiune.', 'error');
    } finally { btn.disabled = false; }
  }

  async function handleNlUnsubscribe() {
    const email = $('admNlEmailInput').value;
    const btn = $('admNlUnsubscribeBtn');
    btn.disabled = true;
    try {
      const res = await fetch('/newsletter-unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('admPrefsMessage', data.message || 'Dezabonat.', 'success');
        await loadNewsletterStatus();
      } else {
        showMessage('admPrefsMessage', data.error || 'Eroare', 'error');
      }
    } catch {
      showMessage('admPrefsMessage', 'Eroare de conexiune.', 'error');
    } finally { btn.disabled = false; }
  }


  /* ─── Password / delete account ───────────────────── */
  function validatePassword(p) {
    return { length: p.length >= 8, uppercase: /[A-Z]/.test(p), digit: /[0-9]/.test(p) };
  }

  function updatePwdReqs(password) {
    const r = validatePassword(password);
    const set = (id, ok) => {
      const el = $(id);
      if (el) el.className = `requirement ${ok ? 'met' : 'not-met'}`;
    };
    set('admReqLength',    r.length);
    set('admReqUppercase', r.uppercase);
    set('admReqDigit',     r.digit);
    return r.length && r.uppercase && r.digit;
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    const cur = $('admCurrentPassword').value;
    const np  = $('admNewPassword').value;
    const cf  = $('admConfirmNewPassword').value;
    if (!updatePwdReqs(np)) { showMessage('admSecurityMessage', 'Parola nu îndeplinește cerințele.', 'error'); return; }
    if (np !== cf) { showMessage('admSecurityMessage', 'Parolele nu coincid.', 'error'); return; }
    try {
      const res = await fetch('/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: cur, newPassword: np }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('admSecurityMessage', data.message || 'Parola a fost schimbată.', 'success');
        $('admChangePasswordForm').reset();
        updatePwdReqs('');
      } else {
        showMessage('admSecurityMessage', data.error || 'Eroare', 'error');
      }
    } catch {
      showMessage('admSecurityMessage', 'Eroare de conexiune.', 'error');
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    const confirmed = $('admConfirmDeletion').checked;
    if (!confirmed) { showMessage('admDangerMessage', 'Confirmă că înțelegi consecințele.', 'error'); return; }
    const isGoogle = !!(currentUser && currentUser.isGoogleUser);
    const msg = isGoogle
      ? 'Ești sigur că vrei să ștergi contul Google? Această acțiune NU poate fi anulată!'
      : 'Ești sigur că vrei să ștergi contul? Această acțiune NU poate fi anulată!';
    if (!confirm(msg)) return;
    const body = {};
    if (!isGoogle) {
      const pw = $('admDeletePassword').value;
      if (!pw) { showMessage('admDangerMessage', 'Parola este obligatorie.', 'error'); return; }
      body.password = pw;
    }
    try {
      const res = await fetch('/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Contul a fost șters. Vei fi redirecționat către pagina principală.');
        window.location.href = 'index.html';
      } else {
        showMessage('admDangerMessage', data.error || 'Eroare', 'error');
      }
    } catch {
      showMessage('admDangerMessage', 'Eroare de conexiune.', 'error');
    }
  }


  /* ─── Init ────────────────────────────────────────── */
  function bindGlobalEvents() {
    $('admAuthLoginBtn')?.addEventListener('click', () => Atomify.showAuthModal('login'));

    $('admCreateClassForm')?.addEventListener('submit', handleCreateClass);
    $('admCreateQuizForm')?.addEventListener('submit', handleCreateQuiz);
    $('admAddQuestionBtn')?.addEventListener('click', addQuestion);
    $('admQuizCancelEditBtn')?.addEventListener('click', cancelEdit);

    $('admCountryForm')?.addEventListener('submit', handleCountrySubmit);

    $('admNlSubscribeBtn')?.addEventListener('click', handleNlSubscribe);
    $('admNlUnsubscribeBtn')?.addEventListener('click', handleNlUnsubscribe);
    $('admNlEmailInput')?.addEventListener('input', updateNlButtons);

    $('admChangePasswordForm')?.addEventListener('submit', handleChangePassword);
    $('admNewPassword')?.addEventListener('input', (e) => updatePwdReqs(e.target.value));
    $('admDeleteAccountForm')?.addEventListener('submit', handleDeleteAccount);

    bindRolePicker();

    // Class modal: invite + homework
    $('admInviteForm')?.addEventListener('submit', handleInviteStudent);
    bindAutocomplete();
    $('admShowHomeworkFormBtn')?.addEventListener('click', showCreateHomework);
    $('admCancelHomeworkBtn')?.addEventListener('click', hideCreateHomework);
    $('admHomeworkCreationForm')?.addEventListener('submit', handleCreateHomework);
    $('admClassModalClose')?.addEventListener('click', closeClassDetails);
    $('admClassModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'admClassModal') closeClassDetails();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && $('admClassModal')?.classList.contains('is-open')) closeClassDetails();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    Atomify.initAuthModal();
    bindGlobalEvents();
    // Make sure quiz builder starts with one empty question
    if ($('admQuestionsContainer') && !$('admQuestionsContainer').children.length) {
      addQuestion();
    }
    checkAuth();
  });
})();
