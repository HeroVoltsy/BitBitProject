import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../src/kyc.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } }).outputText;
const { validateIdentity, validateAddress, validateDocuments, requiresBackImage, validateImage, getDemoKycStatus, resolveCurrentAddress, MAX_IMAGE_BYTES } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const today = new Date('2026-11-06T12:00:00Z');
const details = {
  firstName: 'Alex', lastName: 'Sample', middleName: '', dateOfBirth: '1995-06-15', contactNumber: '09123456789',
  addressLine1: '1 Test Street', addressLine2: '', barangay: 'Test District', city: 'Test City',
  province: 'Test Province', postalCode: '4400', country: 'Philippines',
  documentType: 'National ID', organization: '', authorized: false,
};

test('first and last names are required; middle name is optional', () => {
  assert.deepEqual(validateIdentity(details, 'attendee', today), {});
  for (const field of ['firstName', 'lastName']) {
    assert.ok(validateIdentity({ ...details, [field]: ' ' }, 'attendee', today)[field]);
    assert.ok(validateIdentity({ ...details, [field]: 'A'.repeat(101) }, 'attendee', today)[field]);
  }
  assert.deepEqual(validateIdentity({ ...details, firstName: 'A', lastName: 'Ng', middleName: 'de la Cruz' }, 'attendee', today), {});
  assert.ok(validateIdentity({ ...details, middleName: 'A'.repeat(101) }, 'attendee', today).middleName);
});
test('host requires organizer details and authorization', () => {
  const errors = validateIdentity(details, 'host', today);
  assert.ok(errors.organization); assert.ok(errors.authorized);
  assert.deepEqual(validateIdentity({ ...details, organization: 'Test Club', authorized: true }, 'host', today), {});
});
test('birth date rejects impossible, future, current, and malformed dates', () => {
  for (const dateOfBirth of ['2026-02-30', '2027-01-01', '2026-11-06', '', 'abc', '1995-6-1']) {
    assert.ok(validateIdentity({ ...details, dateOfBirth }, 'attendee', today).dateOfBirth, dateOfBirth);
  }
  assert.deepEqual(validateIdentity({ ...details, dateOfBirth: '2000-02-29' }, 'attendee', today), {});
});
test('Philippine residential address requires all core fields and a four-digit postal code', () => {
  assert.deepEqual(validateAddress(details), {});
  for (const field of ['addressLine1', 'barangay', 'city', 'province', 'postalCode', 'country']) {
    assert.ok(validateAddress({ ...details, [field]: ' ' })[field], field);
  }
  for (const postalCode of ['123', '12345', 'ABCD']) assert.ok(validateAddress({ ...details, postalCode }).postalCode);
  assert.ok(validateAddress({ ...details, addressLine2: 'A'.repeat(151) }).addressLine2);
  assert.deepEqual(validateAddress({ ...details, postalCode: '0400', addressLine2: 'Unit 2' }), {});
});
test('international address allows an optional district and alphanumeric postal code', () => {
  assert.deepEqual(validateAddress({ ...details, country: 'United Kingdom', barangay: '', postalCode: 'SW1A 1AA' }), {});
});
test('card IDs require separate front and back images plus a selfie', () => {
  for (const type of ['National ID', "Driver's license"]) {
    assert.equal(requiresBackImage(type), true);
    assert.ok(validateDocuments(type, { front: true, back: false, selfie: true }).back);
    const errors = validateDocuments(type, { front: false, back: false, selfie: false });
    assert.ok(errors.front); assert.ok(errors.back); assert.ok(errors.selfie);
    assert.deepEqual(validateDocuments(type, { front: true, back: true, selfie: true }), {});
  }
  assert.ok(validateDocuments('Unsupported', { front: true, back: true, selfie: true }).documentType);
});
test('passport requires its photo page and selfie without a card-back image', () => {
  assert.equal(requiresBackImage('Passport'), false);
  assert.deepEqual(validateDocuments('Passport', { front: true, back: false, selfie: true }), {});
  assert.ok(validateDocuments('Passport', { front: false, back: false, selfie: true }).front);
});
test('image validation rejects unsupported formats, empty files, and oversized images', () => {
  for (const type of ['image/svg+xml', 'application/pdf', 'text/html', '']) assert.ok(validateImage({ size: 20, type }));
  assert.ok(validateImage({ size: 0, type: 'image/png' }));
  assert.ok(validateImage({ size: MAX_IMAGE_BYTES + 1, type: 'image/jpeg' }));
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) assert.equal(validateImage({ size: MAX_IMAGE_BYTES, type }), undefined);
});
test('prototype outcomes remain separate by role and cannot become real verified status', () => {
  const record = { attendee: 'demo_approved', host: 'demo_pending' };
  assert.equal(getDemoKycStatus(record, 'attendee'), 'demo_approved');
  assert.equal(getDemoKycStatus(record, 'host'), 'demo_pending');
  assert.equal(getDemoKycStatus(undefined, 'host'), 'not_started');
  for (const value of ['verified', 'approved', 'toString', '__proto__']) assert.equal(getDemoKycStatus({ host: value }, 'host'), 'not_started');
});

test('contact number accepts local and international formatting and rejects invalid input', () => {
  for (const contactNumber of ['09123456789', '+63 912 345 6789', '(02) 8123-4567']) {
    assert.equal(validateIdentity({ ...details, contactNumber }, 'attendee', today).contactNumber, undefined);
  }
  for (const contactNumber of ['', 'call me', '123456', '1'.repeat(16), '09+123456789']) {
    assert.ok(validateIdentity({ ...details, contactNumber }, 'attendee', today).contactNumber);
  }
});
test('current address remains independent unless same-as-permanent is selected', () => {
  const current = { ...details, city: 'Different City', addressLine1: '2 Other Street' };
  assert.equal(resolveCurrentAddress(details, current, false).city, 'Different City');
  assert.equal(resolveCurrentAddress(details, current, true).city, details.city);
  const updatedPermanent = { ...details, city: 'Updated City' };
  assert.equal(resolveCurrentAddress(updatedPermanent, current, true).city, 'Updated City');
  assert.equal(resolveCurrentAddress(updatedPermanent, current, false).addressLine1, '2 Other Street');
  assert.ok(validateAddress({ ...current, city: '' }).city);
});
