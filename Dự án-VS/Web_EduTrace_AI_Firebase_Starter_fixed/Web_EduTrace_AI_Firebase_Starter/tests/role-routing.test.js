import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageForRole } from '../js/role-routing.js';

test('mỗi vai trò được đưa tới đúng trang', () => {
  assert.equal(pageForRole('parent'), 'index.html');
  assert.equal(pageForRole('doctor'), 'workspace.html');
  assert.equal(pageForRole('center'), 'workspace.html');
  assert.equal(pageForRole('investor'), 'workspace.html');
  assert.equal(pageForRole('admin'), 'admin.html');
});
