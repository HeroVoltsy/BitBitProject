import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../src/discovery.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } }).outputText;
const { normalizeDiscoveryProfile, shouldOnboardJoiner, personalizeEvents } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const categories = ['Market', 'Music', 'Sports', 'Volunteer', 'Fun Run', 'Concert', 'Pop-Up'];
const event = (id, category, audiences = []) => ({ id, category, audiences, title: id, location: 'Naga City', going: 1, monthLabel: 'AUG', day: '23', dateLine: 'Aug 23' });

test('only new joiners see the post-signup questionnaire', () => {
  assert.equal(shouldOnboardJoiner('signup', 'attendee'), true);
  assert.equal(shouldOnboardJoiner('signup', undefined), true);
  assert.equal(shouldOnboardJoiner('signup', 'host'), false);
  assert.equal(shouldOnboardJoiner('login', 'attendee'), false);
  assert.equal(shouldOnboardJoiner('login', 'host'), false);
});
test('answers require a valid description and at least one catalog interest', () => {
  for (const value of [null, {}, { occupation: 'student', interests: [] }, { occupation: 'unknown', interests: ['Music'] }]) {
    assert.equal(normalizeDiscoveryProfile(value, categories), null);
  }
  assert.deepEqual(normalizeDiscoveryProfile({ occupation: 'teacher', interests: ['Sports', 'Music', 'Music', 'unknown'], other: 'discard' }, categories), { occupation: 'teacher', interests: ['Music', 'Sports'] });
});
test('other and prefer-not-to-say remain valid choices', () => {
  for (const occupation of ['other', 'prefer_not_to_say']) assert.ok(normalizeDiscoveryProfile({ occupation, interests: ['Music'] }, categories));
});
test('explicit interests lead over audience matching', () => {
  const events = [event('teacher-event', 'Volunteer', ['teacher']), event('music', 'Music')];
  const ranked = personalizeEvents(events, { occupation: 'teacher', interests: ['Music'] });
  assert.deepEqual(ranked.map((entry) => entry.id), ['music', 'teacher-event']);
});
test('audience metadata acts as a secondary signal without hiding other events', () => {
  const events = [event('general', 'Sports'), event('student', 'Sports', ['student'])];
  assert.deepEqual(personalizeEvents(events, { occupation: 'student', interests: ['Sports'] }).map((entry) => entry.id), ['student', 'general']);
  assert.equal(personalizeEvents(events, { occupation: 'teacher', interests: ['Sports'] }).length, 2);
});
test('prefer-not-to-say does not use occupational targeting', () => {
  const events = [event('general', 'Music'), event('tagged', 'Music', ['prefer_not_to_say'])];
  assert.deepEqual(personalizeEvents(events, { occupation: 'prefer_not_to_say', interests: ['Music'] }), events);
});
test('skipping preserves the regular feed order', () => {
  const events = [event('a', 'Sports'), event('b', 'Music')];
  assert.deepEqual(personalizeEvents(events, null), events);
});
test('sorting is stable and never mutates the catalog or answers', () => {
  const events = Object.freeze([Object.freeze(event('a', 'Music')), Object.freeze(event('b', 'Music'))]);
  const profile = Object.freeze({ occupation: 'student', interests: Object.freeze(['Music']) });
  assert.deepEqual(personalizeEvents(events, profile).map((entry) => entry.id), ['a', 'b']);
  assert.equal(events[0].id, 'a');
  assert.deepEqual(profile.interests, ['Music']);
});
