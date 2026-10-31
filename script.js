"use strict";

const languageToggle = document.getElementById("language-toggle");
const menuToggle = document.getElementById("menu-toggle");
const navigation = document.getElementById("site-nav");
const translations = [];

// Capture the English HTML once, so switching back restores the original copy.
for (const [marker, attribute] of [
  ["data-zh", null],
  ["data-alt-zh", "alt"],
  ["data-aria-zh", "aria-label"],
  ["data-content-zh", "content"],
]) {
  for (const element of document.querySelectorAll(`[${marker}]`)) {
    translations.push({
      element,
      attribute,
      en: attribute ? element.getAttribute(attribute) : element.textContent,
      zh: element.getAttribute(marker),
    });
  }
}

function updateMenuLabel() {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  const chinese = document.documentElement.lang === "zh-CN";
  menuToggle.setAttribute("aria-label", chinese
    ? (open ? "关闭导航" : "打开导航")
    : (open ? "Close navigation" : "Open navigation"));
}

function setLanguage(language) {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  for (const entry of translations) {
    const text = entry[language];
    if (entry.attribute) entry.element.setAttribute(entry.attribute, text);
    else entry.element.textContent = text;
  }
  languageToggle.textContent = language === "en" ? "中文 ↗" : "EN ↗";
  languageToggle.setAttribute("aria-label", language === "en" ? "Switch to Chinese" : "切换为英文");
  updateMenuLabel();
}

function setMenu(open, returnFocus = false) {
  navigation.classList.toggle("is-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  updateMenuLabel();
  if (open) navigation.querySelector("a").focus();
  else if (returnFocus) menuToggle.focus();
}

languageToggle.addEventListener("click", () => {
  setLanguage(document.documentElement.lang === "en" ? "zh" : "en");
});
menuToggle.addEventListener("click", () => {
  setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
});
for (const link of navigation.querySelectorAll("a")) {
  link.addEventListener("click", () => {
    if (menuToggle.getAttribute("aria-expanded") === "true") setMenu(false, true);
  });
}
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
    setMenu(false, true);
  }
});
window.matchMedia("(min-width: 801px)").addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});

setLanguage("en");
languageToggle.hidden = false;
menuToggle.hidden = false;
document.documentElement.classList.add("js");
