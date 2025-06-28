'use strict'
/* eslint-env browser */

// Copyright (C) 2023-2024  ANSSI
// SPDX-License-Identifier: MIT

import './lib/sortable.js'
import './lib/common.js'
import './lib/challengeVoteBtn.js'

/**
 * Update flags status from local storage state
 */
function refreshFlags () {
  if (!('flags' in window.localStorage)) {
    return // user is not logged in or has never submitted a flag
  }

  /** @type {{challenge: String, date: String, flag: String}[]} */
  const flags = JSON.parse(window.localStorage.getItem('flags') ?? '[]')
  flags.forEach((flag) => {
    document.querySelectorAll(`[data-challenge="${flag.challenge}"] .badge-flag`).forEach((el) => {
      const d = new Date(flag.date)
      el.textContent = d.toLocaleDateString('fr-CA') + ', ' + d.toLocaleTimeString('en-GB')
      el.classList.remove('invisible')
      el.closest('td')?.setAttribute('data-sort', flag.date)
    })
  })
}

window.addEventListener('load', () => {
  refreshFlags()
})
