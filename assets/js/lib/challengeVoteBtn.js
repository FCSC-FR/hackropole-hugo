'use strict'
/* eslint-env browser */

// Copyright (C) 2023-2024  ANSSI
// SPDX-License-Identifier: MIT

import Toast from '../vendor/bootstrap/toast.js'
import HackropoleApi from './api.js'

/**
 * Update challenge vote buttons status from local storage state
 */
function refreshChallVote () {
  /** @type {String[]} */
  let votes = []
  if (HackropoleApi.isLogged()) {
    votes = JSON.parse(window.localStorage.getItem('challenge_votes') ?? '[]')
  }
  document.querySelectorAll('a.challenge-vote-btn').forEach((el) => {
    if (!(el instanceof HTMLAnchorElement)) {
      return
    }
    const active = votes.includes(el.dataset.challenge ?? '')
    el.classList.toggle('text-opacity-25', !active)
    if (el.dataset.titleActive && el.dataset.titleInactive) {
      el.setAttribute('title', active ? el.dataset.titleActive : el.dataset.titleInactive)
    }
    if (el.parentElement instanceof HTMLTableCellElement) {
      el.parentElement.setAttribute('data-sort', active ? '1' : '0')
    }
  })
}

window.addEventListener('load', () => {
  refreshChallVote()

  // On challenge vote button click, toggle vote
  document.querySelectorAll('a.challenge-vote-btn').forEach((el) => {
    if (!(el instanceof HTMLAnchorElement)) {
      return
    }
    el.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopImmediatePropagation()
      if (HackropoleApi.isLogged()) {
        const challenge = el.dataset.challenge ?? ''
        HackropoleApi.voteChallenge(challenge).then((d) => {
          window.localStorage.setItem('challenge_votes', JSON.stringify(d || []))
          refreshChallVote()
        }).catch(() => {
          const toast = new Toast(document.getElementById('toast-api-error'))
          toast.show()
        })
      } else {
        const toast = new Toast(document.getElementById('toast-api-need-login'))
        toast.show()
      }
    })
  })
})
