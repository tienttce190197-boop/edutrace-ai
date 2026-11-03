import { test } from 'node:test';
import assert from 'node:assert/strict';

class Element {
  constructor() { this.listeners = {}; this.children = []; this.value = ''; this.hidden = false; this.textContent = ''; }
  addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); }
  dispatchEvent(event) { for (const handler of this.listeners[event.type] || []) handler(event); }
  replaceChildren(...children) { this.children = children; }
  append(...children) { this.children.push(...children); }
  click() { this.dispatchEvent({type: 'click'}); }
  scrollIntoView() { this.scrolled = true; }
}

test('gợi ý trên trang mở đúng bảng và tuổi sau khi phụ huynh đăng nhập', async () => {
  const input = new Element(), output = new Element(), analyze = new Element();
  const panel = new Element(), workspace = new Element();
  const mode = new Element(), age = new Element(), externalAge = new Element();
  const form = { elements: {mode, ageMonths: age, externalAgeMonths: externalAge} };
  const elements = { aiCustomInput:input, screeningSuggestion:output, btnAIAnalyze:analyze,
    parentReferralPanel:panel, roleWorkspace:workspace, parentReferralForm:form };
  const previousDocument = globalThis.document;
  globalThis.document = {getElementById: id => elements[id], querySelectorAll: () => [], createElement: () => new Element()};
  try {
    await import('../js/screening-suggestions-ui.js');
    input.value = 'Bé 2 tuổi chậm nói';
    analyze.click();
    assert.match(output.children[0].textContent, /CDC 2 tuổi/);
    workspace.hidden = true;
    output.children[1].click();
    assert.match(output.children[0].textContent, /đăng nhập/);
    workspace.hidden = false;
    output.children[1].click();
    assert.equal(mode.value, 'milestones');
    assert.equal(age.value, '24');
    assert.equal(panel.scrolled, true);
    input.dispatchEvent({type:'input'});
    assert.equal(output.children.length, 0);
  } finally { globalThis.document = previousDocument; }
});
