'use strict'
/* eslint-env browser */

// Copyright (C) 2023-2024  ANSSI
// SPDX-License-Identifier: MIT

import './lib/sortable.js'
import './lib/common.js'
import './lib/challengeVoteBtn.js'
import './lib/writeupVoteBtn.js'
import Modal from './vendor/bootstrap/modal.js'
import Toast from './vendor/bootstrap/toast.js'
import HackropoleApi from './lib/api.js'

/**
 * Helper to load JSON data from local storage
 * @param {string} name
 * @returns {any}
 */
function loadJSONStorage (name) {
  const jsonData = window.localStorage.getItem(name)
  return jsonData !== null ? JSON.parse(jsonData) : null
}

/**
 * Update flags and solutions status from local storage state
 */
function refreshFlags () {
  /** @type {{challenge: String, date: String, flag: String}[] | null} */
  const flags = loadJSONStorage('flags')

  const challengesFlagged = flags?.map((f) => f.challenge)
  document.querySelectorAll('#flags-table tr[data-challenge]').forEach((el) => {
    if (challengesFlagged?.includes(el.dataset.challenge)) {
      el.classList.remove('d-none')
      el.firstElementChild.dataset.sort = -challengesFlagged.indexOf(el.dataset.challenge)
    } else {
      el.remove()
    }
  })

  // Show flags status badges
  flags?.forEach((flag) => {
    document.querySelectorAll(`[data-challenge="${flag.challenge}"] .badge-flag`).forEach((el) => {
      const d = new Date(flag.date)
      el.textContent = d.toLocaleDateString('fr-CA') + ', ' + d.toLocaleTimeString('en-GB')
      el.classList.remove('invisible')
      el.closest('td')?.setAttribute('data-sort', flag.date)
    })
  })

  // Show write-ups status
  const categories = ['pending', 'rejected', 'accepted']
  categories.forEach((cat) => {
    /** @type {{challenge: String}[] | null} */
    const solutions = loadJSONStorage('solutions_' + cat)
    solutions?.forEach((solution) => {
      document.querySelectorAll(`[data-challenge="${solution.challenge}"] .badge-solution`).forEach((el) => {
        switch (cat) {
          case 'accepted':
            el.querySelector('.text-bg-success')?.classList.remove('d-none')
            el.closest('td')?.setAttribute('data-sort', '3')
            break
          case 'pending':
            el.querySelector('.text-bg-warning')?.classList.remove('d-none')
            el.closest('td')?.setAttribute('data-sort', '2')
            break
          case 'rejected':
            el.querySelector('.text-bg-danger')?.classList.remove('d-none')
            el.closest('td')?.setAttribute('data-sort', '1')
            break
        }
      })
    })
  })

  // Trigger sortable
  document.querySelector('#flags-table thead tr th')?.click()
}

/**
 * Update votes status from local storage state
 */
function refreshVotes () {
  /** @type {String[] | null} */
  const challengesVotes = loadJSONStorage('challenge_votes')
  if (challengesVotes?.length) {
    document.getElementById('section-votes-challenges')?.classList.remove('d-none')
    document.querySelectorAll('#votes-challenges tr[data-challenge]').forEach((el) => {
      if (challengesVotes.includes(el.dataset.challenge)) {
        el.classList.remove('d-none')
      } else {
        el.remove()
      }
    })
  }

  /** @type {String[] | null} */
  const solutionsVotes = loadJSONStorage('solution_votes')
  if (solutionsVotes?.length) {
    document.getElementById('section-votes-solutions')?.classList.remove('d-none')
    document.querySelectorAll('#votes-solutions tr[data-solution]').forEach((el) => {
      if (solutionsVotes.includes(el.dataset.solution)) {
        el.classList.remove('d-none')
      } else {
        el.remove()
      }
    })
  }
}

window.addEventListener('load', () => {
  if (HackropoleApi.isLogged()) {
    const refreshButton = document.getElementById('refresh')
    refreshButton?.classList.remove('d-none')
    refreshButton?.addEventListener('click', (event) => {
      event.preventDefault()
      HackropoleApi.getSelfUserData().then((userData) => {
        window.localStorage.setItem('username', userData.name)
        window.localStorage.setItem('flags', JSON.stringify(userData.solves))
        window.localStorage.setItem('solutions_pending', JSON.stringify(userData.solutions_pending))
        window.localStorage.setItem('solutions_rejected', JSON.stringify(userData.solutions_rejected))
        window.localStorage.setItem('solutions_accepted', JSON.stringify(userData.solutions_accepted))
        window.localStorage.setItem('challenge_votes', JSON.stringify(userData.challenge_votes))
        window.localStorage.setItem('solution_votes', JSON.stringify(userData.solution_votes))
        document.location.reload()
      }).catch(() => {
        const toast = new Toast(document.getElementById('toast-api-error'))
        toast.show()
      })
    })
  }

  document.getElementById('download-data')?.addEventListener('click', (event) => {
    event.preventDefault()

    // Replace null by undefined to skip null keys on stringify
    const userData = {
      name: window.localStorage.getItem('username') ?? undefined,
      solves: loadJSONStorage('flags') ?? undefined,
      solutions_accepted: loadJSONStorage('solutions_accepted') ?? undefined,
      solutions_pending: loadJSONStorage('solutions_pending') ?? undefined,
      solutions_rejected: loadJSONStorage('solutions_rejected') ?? undefined,
      solutions_votes: loadJSONStorage('solution_votes') ?? undefined,
      challenge_votes: loadJSONStorage('challenge_votes') ?? undefined
    }
    const encodedJson = new TextEncoder().encode(JSON.stringify(userData))

    // Create download
    const blob = new Blob([encodedJson], { type: 'application/json;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.classList.add('d-none')
    a.href = url
    a.download = 'hackropole.json'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
  })

  // 'Delete my user data' button, with confirmation modal
  if (HackropoleApi.isLogged()) {
    const modal = new Modal('#modal-delete', {})
    const deleteLink = document.getElementById('delete')
    deleteLink?.classList.remove('d-none')
    deleteLink?.addEventListener('click', (event) => {
      event.preventDefault()
      modal.show()
    })

    document.getElementById('delete-confirm')?.addEventListener('click', () => {
      modal.hide()
      HackropoleApi.deleteUserData().then(() => HackropoleApi.logout()).catch(() => {
        const toast = new Toast(document.getElementById('toast-api-error'))
        toast.show()
      })
    })
  } else {
    document.getElementById('warning-offline')?.classList.remove('d-none')
  }

  refreshFlags()
  refreshVotes()
  const username = window.localStorage.getItem('username')
  const dashboardTitle = document.getElementById('dashboard-title')
  if (username && dashboardTitle) {
    dashboardTitle.textContent = `${dashboardTitle.dataset.usernamePrefix} ${username}`
  }
})
