'use strict'
/* eslint-env browser */

// Copyright (C) 2023-2024  ANSSI
// SPDX-License-Identifier: MIT

import { importUserData } from './lib/common.js'
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
  await importUserData(userData)
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
