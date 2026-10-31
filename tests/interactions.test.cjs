const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Minimal DOM boundary for testing the real, dependency-free page script.
class Element {
  constructor(text = '', attributes = {}) {
    this.textContent = text;
    this.attributes = { ...attributes };
    this.listeners = {};
    this.hidden = true;
    this.focused = false;
    this.classes = new Set();
    this.classList = {
      add: (name) => this.classes.add(name),
      remove: (name) => this.classes.delete(name),
      contains: (name) => this.classes.has(name),
      toggle: (name, force) => force ? this.classes.add(name) : this.classes.delete(name),
    };
  }
  getAttribute(name) { return this.attributes[name] ?? null; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener(name, listener) { (this.listeners[name] ??= []).push(listener); }
  dispatch(name, event = {}) { for (const fn of this.listeners[name] ?? []) fn(event); }
  focus() { this.focused = true; }
}

function loadPage() {
  const text = new Element('Explore my work', { 'data-zh': '浏览精选项目' });
  const title = new Element('Wenjin Wang | Resume & Portfolio', { 'data-zh': '王文晋｜个人简历与作品集' });
  const image = new Element('', { alt: 'A real project screenshot', 'data-alt-zh': '真实项目截图' });
  const label = new Element('', { 'aria-label': 'Main navigation', 'data-aria-zh': '主导航' });
  const meta = new Element('', { content: 'Personal portfolio', 'data-content-zh': '个人作品集' });
  const language = new Element('中文');
  const menu = new Element('', { 'aria-expanded': 'false' });
  const nav = new Element();
  const firstLink = new Element('Work');
  const lastLink = new Element('Contact');
  const links = [firstLink, lastLink];
  nav.querySelectorAll = () => links;
  nav.querySelector = () => firstLink;
  const root = new Element();
  root.lang = 'en';
  const selectors = {
    '[data-zh]': [text, title],
    '[data-alt-zh]': [image],
    '[data-aria-zh]': [label],
    '[data-content-zh]': [meta],
  };
  const doc = new Element();
  doc.documentElement = root;
  doc.getElementById = (id) => ({ 'language-toggle': language, 'menu-toggle': menu, 'site-nav': nav })[id];
  doc.querySelectorAll = (selector) => selectors[selector] ?? [];
  const breakpoint = new Element();
  breakpoint.matches = false;
  const win = { matchMedia: () => breakpoint };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8'), { document: doc, window: win });
  return { text, title, image, label, meta, language, menu, nav, firstLink, lastLink, root, doc, breakpoint };
}

test('Chinese switch updates content, metadata, image alt and accessible names; English restores exactly', () => {
  const p = loadPage();
  assert.equal(p.language.hidden, false);
  p.language.dispatch('click');
  assert.equal(p.root.lang, 'zh-CN');
  assert.equal(p.text.textContent, '浏览精选项目');
  assert.equal(p.title.textContent, '王文晋｜个人简历与作品集');
  assert.equal(p.image.getAttribute('alt'), '真实项目截图');
  assert.equal(p.label.getAttribute('aria-label'), '主导航');
  assert.equal(p.meta.getAttribute('content'), '个人作品集');
  p.language.dispatch('click');
  assert.equal(p.root.lang, 'en');
  assert.equal(p.text.textContent, 'Explore my work');
  assert.equal(p.title.textContent, 'Wenjin Wang | Resume & Portfolio');
  assert.equal(p.image.getAttribute('alt'), 'A real project screenshot');
  assert.equal(p.meta.getAttribute('content'), 'Personal portfolio');
});

test('opening the mobile menu focuses a link; Escape closes it and returns focus', () => {
  const p = loadPage();
  assert.equal(p.menu.hidden, false);
  p.menu.dispatch('click');
  assert.equal(p.menu.getAttribute('aria-expanded'), 'true');
  assert.equal(p.nav.classes.has('is-open'), true);
  assert.equal(p.firstLink.focused, true);
  p.doc.dispatch('keydown', { key: 'Escape' });
  assert.equal(p.menu.getAttribute('aria-expanded'), 'false');
  assert.equal(p.nav.classes.has('is-open'), false);
  assert.equal(p.menu.focused, true);
});

test('navigation links and desktop resizing close the menu; Chinese labels reflect open state', () => {
  const p = loadPage();
  p.language.dispatch('click');
  p.menu.dispatch('click');
  assert.equal(p.menu.getAttribute('aria-label'), '关闭导航');
  p.lastLink.dispatch('click');
  assert.equal(p.menu.getAttribute('aria-expanded'), 'false');
  assert.equal(p.menu.getAttribute('aria-label'), '打开导航');
  p.menu.dispatch('click');
  p.breakpoint.dispatch('change', { matches: true });
  assert.equal(p.menu.getAttribute('aria-expanded'), 'false');
  assert.equal(p.nav.classes.has('is-open'), false);
});
