'use strict'
/* eslint-env browser */

// Copyright (C) 2023-2024  ANSSI
// SPDX-License-Identifier: MIT

import './lib/common.js'
import './lib/challengeVoteBtn.js'
import './lib/sortable.js'
import './lib/writeupVoteBtn.js'
import Modal from './vendor/bootstrap/modal.js'
import Toast from './vendor/bootstrap/toast.js'
import HackropoleApi from './lib/api.js'

/**
 * Update flag status from local storage state
 * @param {string} challenge - Challenge identifier, e.g. "fcsc2019-crypto-2tp"
 */
function refreshFlag (challenge) {
  if (!('flags' in window.localStorage)) {
    return // user is not logged in or has never submitted a flag
  }

  /** @type {{challenge: String, date: String, flag: String}[]} */
  const flags = JSON.parse(window.localStorage.getItem('flags') ?? '[]')
  const filteredFlags = flags.filter((f) => f.challenge === challenge)
  if (filteredFlags.length) {
    // Challenge is already solved, show solve date
    const badgeFlagEl = document.getElementById('badge-flag')
    if (badgeFlagEl) {
      const d = new Date(filteredFlags[0].date)
      badgeFlagEl.textContent += d.toLocaleDateString('fr-CA') + ', ' + d.toLocaleTimeString('en-GB')
      badgeFlagEl.classList.remove('d-none')
    }

    // Restore flag value
    document.getElementById('flag').value = filteredFlags[0].flag

    // Disable flag form
    document.querySelectorAll('#flag-form input, #flag-form button').forEach((e) => {
      e.disabled = true
      e.classList.add('border-success')
    })
    document.getElementById('social-share')?.classList.remove('d-none')

    // Show the writeup submit form
    document.getElementById('solution-form')?.classList.toggle('d-none', !HackropoleApi.isLogged())
    document.getElementById('solution-login-note')?.classList.toggle('d-none', HackropoleApi.isLogged())
    document.getElementById('submit-solution')?.classList.remove('d-none')

    // Show all writeups
    const detailWriteups = document.getElementById('details-writeups')
    if (detailWriteups instanceof HTMLDetailsElement) {
      detailWriteups.open = true
    }
  }
}

/**
 * Hash message using SHA-256 and return hexstring
 * @param {String} m - Message to hash
 * @returns {Promise<String>} Hash as hexstring
 */
async function sha256 (m) {
  const msgUint8 = new TextEncoder().encode(m)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Check flag attempt from user and update page accordingly
 * @param {String} attemptFlag - User input (might be an invalid flag)
 * @param {String} challenge - Challenge identifier, e.g. "fcsc2019-crypto-2tp"
 * @param {String[]} flagsHash - Array of valid hashed flags
 * @param {Boolean} caseInsensitive - Make user input case insensitive
 */
async function flagSubmit (attemptFlag, challenge, flagsHash, caseInsensitive) {
  // Verify flag
  const checkFlag = caseInsensitive ? attemptFlag.toLowerCase() : attemptFlag
  const checkFlagHash = await sha256(checkFlag)
  if (flagsHash.includes(checkFlagHash)) {
    const toast = new Toast(document.getElementById('toast-challenge-flag-correct'))
    toast.show()
  } else {
    const toast = new Toast(document.getElementById('toast-challenge-flag-incorrect'))
    toast.show()
    return // don't send to API as it will be refused
  }

  if (HackropoleApi.isLogged()) {
    // Send flag to API if it is new and if user is logged in
    /** @type {{challenge: String, date: String, flag: String}[]} */
    const flags = JSON.parse(window.localStorage.getItem('flags') ?? '[]')
    const flaggedChallenges = flags.map((f) => f.challenge)
    if (!flaggedChallenges.includes(challenge)) {
      HackropoleApi.submission(challenge, attemptFlag).then((d) => {
        window.localStorage.setItem('flags', JSON.stringify(d))
        refreshFlag(challenge)
      }).catch(() => {
        const toast = new Toast(document.getElementById('toast-api-error'))
        toast.show()
      })
    }
  } else {
    // If user is not logged in store the flag in local storage only
    /** @type {{challenge: String, date: String, flag: String}[]} */
    const challenges = JSON.parse(window.localStorage.getItem('flags') ?? '[]')
    if (!challenges.filter((f) => f.challenge === challenge).length) {
      challenges.push({
        challenge,
        date: new Date().toISOString(),
        flag: attemptFlag
      })
      window.localStorage.setItem('flags', JSON.stringify(challenges))
    }
    refreshFlag(challenge)
  }
}

window.addEventListener('load', () => {
  const challenge = location.pathname.split('/').reverse()[1]
  refreshFlag(challenge)

  // User has JavaScript enable, show flag form
  document.getElementById('flag-form')?.classList.remove('d-none')
  document.getElementById('flag-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const attemptFlag = document.getElementById('flag').value
    const flagsHash = document.getElementById('flag').dataset.flagsHash.split(',')
    const caseInsensitive = document.getElementById('flag').dataset.caseInsensitive === 'true'
    flagSubmit(attemptFlag, challenge, flagsHash, caseInsensitive)
  })

  // Handle writeup submission
  const modal = new Modal('#modal-solution', {})
  document.getElementById('solution-form')?.addEventListener('submit', (event) => {
    event.preventDefault()

    // Validate URL
    const url = document.getElementById('solution_url').value
    if (!url.startsWith('https://gist.github.com/') &&
      !url.startsWith('https://gitlab.com/')) {
      const toast = new Toast(document.getElementById('toast-writeup-submit-bad-url'))
      toast.show()
      return
    }

    modal.show()
  })
  document.getElementById('solution-confirm')?.addEventListener('click', () => {
    modal.hide()

    // Send writeup to API
    const url = document.getElementById('solution_url').value
    HackropoleApi.submitWriteUp(challenge, url).then((d) => {
      window.localStorage.setItem('solutions_pending', JSON.stringify(d))
      const toast = new Toast(document.getElementById('toast-writeup-submit-successful'))
      toast.show()
    }).catch(() => {
      const toast = new Toast(document.getElementById('toast-writeup-error'))
      toast.show()
    })
  })
})
