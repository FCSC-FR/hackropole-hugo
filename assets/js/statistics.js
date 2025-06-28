'use strict'
/* eslint-env browser */

// Copyright (C) 2023-2024  ANSSI
// SPDX-License-Identifier: MIT

import './lib/common.js'
import './lib/challengeVoteBtn.js'
import './lib/writeupVoteBtn.js'

/**
 * Update flags status from local storage state
 */
function refreshFlags () {
  /** @type {{challenge: String, date: String, flag: String}[]} */
  const flags = JSON.parse(window.localStorage.getItem('flags') ?? '[]')
  flags?.forEach((flag) => {
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

  // Show confirmation prompt if users click a write-up associated with a challenge they haven't solved yet
  /** @type {{challenge: String, date: String, flag: String}[]} */
  const flags = JSON.parse(window.localStorage.getItem('flags') ?? '[]')
  const flaggedChalls = flags.map(i => i.challenge)
  document.querySelectorAll('tr[data-solution] a.stretched-link').forEach(e => {
    e.addEventListener('click', ev => {
      const chall = e.closest('tr')?.dataset.challenge ?? ''
      const msg = document.getElementById('wu-confirm-msg')?.innerText
      if (!flaggedChalls?.includes(chall) && !window.confirm(msg)) {
        ev.preventDefault()
      }
    })
  })
})
