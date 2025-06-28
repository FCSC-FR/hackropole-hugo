'use strict'
/* eslint-env browser */

// Copyright (C) 2023-2024  ANSSI
// SPDX-License-Identifier: MIT

/**
 * Get user preferred theme from their past choice or browser
 * @returns {String} User preferred theme
 */
function getPreferredTheme () {
  const storedTheme = localStorage.getItem('theme')
  if (storedTheme) {
    return storedTheme
  }
  // Privacy-hardened browsers always return light
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Update navbar icon to match given theme.
 * @param {String} theme - 'dark' or 'light'
 */
function showActiveTheme (theme) {
  const activeThemeIcon = document.querySelector('.theme-switch svg use')
  if (theme === 'dark') {
    activeThemeIcon?.setAttribute('href', '#moon-stars-fill')
  } else {
    activeThemeIcon?.setAttribute('href', '#sun-fill')
  }
}

// Change body theme early to prevent flash
let currentTheme = getPreferredTheme()
document.documentElement.setAttribute('data-bs-theme', currentTheme)

// On browser color-scheme change, update
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  currentTheme = getPreferredTheme()
  document.documentElement.setAttribute('data-bs-theme', currentTheme)
  showActiveTheme(currentTheme)
})

window.addEventListener('load', () => {
  showActiveTheme(currentTheme)

  // On button click, switch
  document.querySelectorAll('.theme-switch').forEach(e => {
    e.addEventListener('click', ev => {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light'
      document.documentElement.setAttribute('data-bs-theme', currentTheme)
      localStorage.setItem('theme', currentTheme)
      showActiveTheme(currentTheme)
      ev.preventDefault()
    })
  })
})
