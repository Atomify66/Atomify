'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadAdmin, isVisible, isHidden } = require('./helpers/loadAdmin');

// Common stubs every authenticated flow hits.
function commonAuthedRoutes() {
  return {
    '/admin-stats': { body: {
      classes: 0, students: 0, quizzes: 0, homework: 0,
      joinedClasses: 0, completedHomework: 0,
    }},
    '/my-classes': { body: { classes: [] } },
    '/pending-invitations': { body: { invitations: [] } },
    '/newsletter-status': { body: { subscribed: false, email: '' } },
    '/api/classroom-quizzes/professor': { body: { quizzes: [] } },
    '/my-homework': { body: { homework: [] } },
  };
}

test('unauthenticated → only the auth-required panel is visible', async () => {
  const dom = await loadAdmin({
    routes: { '/user': { status: 401, body: { error: 'Not authenticated' } } },
  });
  assert.equal(isVisible(dom, 'admAuthRequired'), true, 'auth panel visible');
  assert.equal(isHidden(dom, 'admContent'), true, 'main content hidden');
});

test('logged in, no role → role-picker visible, class/quiz/homework chapters hidden', async () => {
  const dom = await loadAdmin({
    routes: {
      '/user': { body: { user: { id: 1, username: 'newbie', email: 'n@x', role: null } } },
      ...commonAuthedRoutes(),
    },
  });
  assert.equal(isHidden(dom, 'admAuthRequired'), true, 'auth panel hidden');
  assert.equal(isVisible(dom, 'admContent'), true, 'content visible');
  assert.equal(isVisible(dom, 'admChapterRole'), true, 'role picker visible');
  assert.equal(isHidden(dom, 'admChapterClasses'), true);
  assert.equal(isHidden(dom, 'admChapterQuizzes'), true);
  assert.equal(isHidden(dom, 'admChapterHomework'), true);
});

test('student → sees only student cards, NEVER the professor cards', async () => {
  const dom = await loadAdmin({
    routes: {
      '/user': { body: { user: { id: 2, username: 'stud', email: 's@x', role: 'student' } } },
      ...commonAuthedRoutes(),
    },
  });

  assert.equal(isHidden(dom, 'admChapterRole'), true, 'role picker hidden once role is set');
  assert.equal(isVisible(dom, 'admChapterClasses'), true, 'classes chapter visible');
  assert.equal(isVisible(dom, 'admChapterHomework'), true, 'homework chapter visible');
  assert.equal(isHidden(dom, 'admChapterQuizzes'), true, 'quizzes chapter hidden');

  // The regression we're fixing — student must NOT see "Creează o clasă" / "Clasele mele".
  assert.equal(isHidden(dom, 'admCreateClassCard'), true, 'create-class card hidden for student');
  assert.equal(isHidden(dom, 'admMyClassesCard'), true, 'my-classes card hidden for student');

  // Student-specific cards must be visible.
  assert.equal(isVisible(dom, 'admInvitationsCard'), true, 'invitations card visible for student');
  assert.equal(isVisible(dom, 'admJoinedClassesCard'), true, 'joined-classes card visible for student');
});

test('professor → sees only professor cards, NEVER the student cards', async () => {
  const dom = await loadAdmin({
    routes: {
      '/user': { body: { user: { id: 3, username: 'prof', email: 'p@x', role: 'professor' } } },
      ...commonAuthedRoutes(),
    },
  });

  assert.equal(isHidden(dom, 'admChapterRole'), true);
  assert.equal(isVisible(dom, 'admChapterClasses'), true);
  assert.equal(isVisible(dom, 'admChapterQuizzes'), true, 'quizzes chapter visible for prof');
  assert.equal(isHidden(dom, 'admChapterHomework'), true, 'student homework hidden for prof');

  // Professor must see the two professor cards…
  assert.equal(isVisible(dom, 'admCreateClassCard'), true);
  assert.equal(isVisible(dom, 'admMyClassesCard'), true);
  // …and must NOT see the two student cards.
  assert.equal(isHidden(dom, 'admInvitationsCard'), true);
  assert.equal(isHidden(dom, 'admJoinedClassesCard'), true);
});

test('professor sees password section, Google user does not', async () => {
  const normalProf = await loadAdmin({
    routes: {
      '/user': { body: { user: { id: 4, username: 'prof', email: 'p@x', role: 'professor', isGoogleUser: false } } },
      ...commonAuthedRoutes(),
    },
  });
  assert.equal(isVisible(normalProf, 'admChapterSecurity'), true, 'normal user sees password section');

  const googleProf = await loadAdmin({
    routes: {
      '/user': { body: { user: { id: 5, username: 'gprof', email: 'g@x', role: 'professor', isGoogleUser: true } } },
      ...commonAuthedRoutes(),
    },
  });
  assert.equal(isHidden(googleProf, 'admChapterSecurity'), true, 'google user does not see password section');
});

test('delete-account: password input required for normal users, hidden + Google note shown for Google users', async () => {
  const normal = await loadAdmin({
    routes: {
      '/user': { body: { user: { id: 6, username: 'u', role: 'student', isGoogleUser: false } } },
      ...commonAuthedRoutes(),
    },
  });
  assert.equal(isVisible(normal, 'admDeletePwdGroup'), true);
  assert.equal(isHidden(normal, 'admDeleteGoogleNote'), true);
  assert.equal(normal.window.document.getElementById('admDeletePassword').hasAttribute('required'), true);

  const google = await loadAdmin({
    routes: {
      '/user': { body: { user: { id: 7, username: 'g', role: 'student', isGoogleUser: true } } },
      ...commonAuthedRoutes(),
    },
  });
  assert.equal(isHidden(google, 'admDeletePwdGroup'), true);
  assert.equal(isVisible(google, 'admDeleteGoogleNote'), true);
  assert.equal(google.window.document.getElementById('admDeletePassword').hasAttribute('required'), false);
});
