/* eslint-env browser */

// Copyright (C) 2023-2024  ANSSI
// SPDX-License-Identifier: MIT

import AutoComplete from '../vendor/autoComplete.min.js'
import '../vendor/bootstrap/collapse.js'
import HackropoleApi from './api.js'

/**
 * This has to be changed when local storage data changes
 */
const STORAGE_VERSION = '1'

/**
 * Fill login dropdown using providers from session storage
 */
function fillLogin () {
  /** @type {{url: string, name: string}[]} */
  const providers = JSON.parse(window.sessionStorage.getItem('providers') ?? '[]')
  const menu = document.getElementById('login-providers')
  menu?.querySelector('div')?.classList.add('d-none')
  menu?.querySelector('ul')?.classList.remove('d-none')
  if (providers.length === 0) {
    const li = document.createElement('li')
    li.classList.add('dropdown-item')
    li.textContent = 'API not available'
    menu?.querySelector('ul')?.appendChild(li)
  }
  providers.forEach((provider) => {
    const li = document.createElement('li')
    const a = document.createElement('a')
    const text = document.createTextNode(`${menu?.dataset.prefix}${provider.name}`)
    const bi = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'use')
    icon.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + provider.name.toLowerCase().replace(/[^a-z0-9_]+/g, '_'))
    bi.classList.add('bi')
    bi.ariaHidden = 'true'
    bi.appendChild(icon)
    a.classList.add('dropdown-item')
    a.classList.add('icon-link')
    a.href = provider.url
    a.appendChild(bi)
    a.appendChild(text)
    li.appendChild(a)
    menu?.querySelector('ul')?.appendChild(li)
  })
}

/**
 * Import user data to local storage, and submit new flags if logged in
 * @param {{
 *   name: string,
 *   solves: {challenge: string, date: string, flag: string}[],
 *   solutions_pending: {challenge: string, url: string, date: string}[],
 *   solutions_rejected: {challenge: string, url: string, date: string}[],
 *   solutions_accepted: {challenge: string, date: string, uuid: string}[],
 *   solution_votes: string[],
 *   challenge_votes: string[]
 * }} newUserData - User data to merge
 */
export async function importUserData (newUserData) {
  /** @type {{challenge: String, date: String, flag: String}[]} */
  const previousFlags = JSON.parse(window.localStorage.getItem('flags') ?? '[]')

  // Submit previous flags, player might have played offline before reconnecting
  let newFlags = newUserData.solves
  if (HackropoleApi.isLogged() && previousFlags.length) {
    for (const fl of previousFlags) {
      if (newFlags.map(f => f.challenge).includes(fl.challenge)) {
        continue // already validated
      }
      newFlags = await HackropoleApi.submission(fl.challenge, fl.flag)
    }
  }

  window.localStorage.setItem('username', newUserData.name)
  window.localStorage.setItem('flags', JSON.stringify(newFlags))
  window.localStorage.setItem('solutions_pending', JSON.stringify(newUserData.solutions_pending))
  window.localStorage.setItem('solutions_rejected', JSON.stringify(newUserData.solutions_rejected))
  window.localStorage.setItem('solutions_accepted', JSON.stringify(newUserData.solutions_accepted))
  window.localStorage.setItem('challenge_votes', JSON.stringify(newUserData.challenge_votes))
  window.localStorage.setItem('solution_votes', JSON.stringify(newUserData.solution_votes))
  window.localStorage.setItem('version', STORAGE_VERSION)
}

document.getElementById('btn-logout')?.addEventListener('click', (e) => {
  e.preventDefault()
  HackropoleApi.logout()
})

const redirectUri = document.getElementById('menu-login')?.dataset.redirectUri
if (sessionStorage.getItem('providers_redirect_uri') === redirectUri) {
  fillLogin() // already cached, fill dropdown
} else if (redirectUri) {
  // Query API for auth providers when menu first open
  // Use animationstart event to detect opened menu, this is simpler than trying to map click, touch and keyboard events
  document.querySelector('#menu-login .spinner-border')?.addEventListener('animationstart', () => {
    HackropoleApi.authorize({ redirect_uri: redirectUri }).then(d => {
      window.sessionStorage.setItem('providers', JSON.stringify(d))
      window.sessionStorage.setItem('providers_redirect_uri', redirectUri)
      fillLogin()
    }).catch(() => {
      console.log('Unable to fetch providers from API, switching to local-only mode')
      window.sessionStorage.setItem('providers', '[]')
      window.sessionStorage.setItem('providers_redirect_uri', redirectUri)
      fillLogin()
    })
  }, { once: true })
}

if (HackropoleApi.isLogged() && localStorage.getItem('version') !== STORAGE_VERSION) {
  HackropoleApi.logout()
}

// Update menu status
document.getElementById('menu-login')?.classList.toggle('d-none', HackropoleApi.isLogged())
document.getElementById('menu-account')?.classList.toggle('d-none', !HackropoleApi.isLogged())

// Search engine
const indexUrl = `${window.location.origin}/${location.pathname.split('/')[1]}/index.json`
export const searchAutocomplete = new AutoComplete({
  selector: '#challenges-search',
  data: {
    src: async () => {
      const source = await fetch(indexUrl)
      const data = await source.json()
      return data
    },
    keys: ['title', 'content'],
    cache: true,
    // Sort entries with match in title first and filter out entries with same title
    filter: function (list) {
      list.sort(function (a, b) {
        if (a.key === b.key) {
          return 0
        }
        if (a.key === 'title') {
          return -1
        }
        return 1
      })
      const set = new Set()
      return list.filter(function (a) {
        if (set.has(a.value.title)) {
          return false
        }
        set.add(a.value.title)
        return true
      })
    }
  },
  diacritics: true,
  threshold: 0,
  resultsList: {
    tabSelect: true,
    maxResults: undefined
  },
  resultItem: {
    // Format result item
    element: (item, data) => {
      const found = data.match.match(/([^\s]*.{0,10}<mark>.*<\/mark>.{0,10}[^\s]*)/)
      if (found) {
        if (data.key === 'title') {
          item.innerHTML = `<b>${data.value.title}</b>`
        } else {
          item.innerHTML = `<b>${data.value.title}</b> : ${found[1]}`
        }
      }
    },
    highlight: true
  }
})
document.querySelector('#challenges-search')?.addEventListener('selection', function (event) {
  window.location = event.detail.selection.value.uri
})

// Focus search bar when pressing `/` outside of an input
document.addEventListener('keydown', (e) => {
  if ((e.target instanceof HTMLElement && e.target.tagName === 'INPUT') || e.repeat || e.ctrlKey) {
    // ignore input fields or key repeat
  } else if (e.key === '/') {
    document.getElementById('challenges-search')?.focus()
    e.preventDefault()
  } else if (e.key === 't') {
    document.querySelector('.theme-switch')?.dispatchEvent(new MouseEvent('click'))
    e.preventDefault()
  }
})

document.querySelectorAll('[data-countdown]').forEach(el => {
  const countDownDate = (el instanceof HTMLElement) ? new Date(parseInt(el.dataset.countdown ?? '0')).getTime() : 0
  const updateTimer = () => {
    const now = new Date().getTime()
    const dist = countDownDate - now
    const countdownDay = el.querySelector('.countdown-day')
    const countdownHour = el.querySelector('.countdown-hour')
    const countdownMin = el.querySelector('.countdown-min')
    const countdownSec = el.querySelector('.countdown-sec')
    if (countdownDay) { countdownDay.textContent = (dist >= 0) ? String(Math.floor(dist / 86400000)) : '0' }
    if (countdownHour) { countdownHour.textContent = (dist >= 0) ? String(Math.floor((dist % 86400000) / 3600000)).padStart(2, '0') : '00' }
    if (countdownMin) { countdownMin.textContent = (dist >= 0) ? String(Math.floor((dist % 3600000) / 60000)).padStart(2, '0') : '00' }
    if (countdownSec) { countdownSec.textContent = (dist >= 0) ? String(Math.floor((dist % 60000) / 1000)).padStart(2, '0') : '00' }
  }
  setInterval(updateTimer, 500)
  updateTimer()
})
