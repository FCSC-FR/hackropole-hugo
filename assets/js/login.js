'use strict'
/* eslint-env browser */

// Copyright (C) 2023-2024  ANSSI
// SPDX-License-Identifier: MIT

import { STORAGE_VERSION } from './lib/common.js'
import * as params from '@params'
import HackropoleApi from './lib/api.js'

/**
 * Send credentials to API and save returned data in the local storage
 */
async function login () {
  const urlParams = new URLSearchParams(document.location.search)
  if (!urlParams.get('code')) {
    document.location = params.home_url
  }
  await HackropoleApi.login(Object.fromEntries(urlParams.entries()))
  const userData = await HackropoleApi.getSelfUserData()
  window.localStorage.setItem('username', userData.name)
  window.localStorage.setItem('flags', JSON.stringify(userData.solves))
  window.localStorage.setItem('solutions_pending', JSON.stringify(userData.solutions_pending))
  window.localStorage.setItem('solutions_rejected', JSON.stringify(userData.solutions_rejected))
  window.localStorage.setItem('solutions_accepted', JSON.stringify(userData.solutions_accepted))
  window.localStorage.setItem('challenge_votes', JSON.stringify(userData.challenge_votes))
  window.localStorage.setItem('solution_votes', JSON.stringify(userData.solution_votes))
  window.localStorage.setItem('version', STORAGE_VERSION)
  document.location = params.dashboard_url
}

window.addEventListener('load', () => {
  login().catch((error) => {
    const errorEl = document.getElementById('error')
    if (errorEl) {
      errorEl.textContent = `${error}`
    }
  })
})
