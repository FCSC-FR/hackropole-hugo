'use strict'
/* eslint-env browser */

// Copyright (C) 2023-2024  ANSSI
// SPDX-License-Identifier: MIT

import { api as apiPath } from '@params'

/**
 * Hackropole API client
 *
 * Handle API access and auth.
 * This code should never interact with browser DOM.
 */
export default class HackropoleApi {
  static apiUrl = `${apiPath}api/hackropole`

  static isLogged () {
    return 'auth' in window.localStorage
  }

  /**
   * Call API to get URL for authentication providers
   * @param {{redirect_uri: string}} params - The parameters needed to resolve the URL
   * @returns {Promise<{name: string, url: string}[]>} List of providers
   */
  static async authorize (params) {
    const response = await fetch(this.apiUrl + '/auth/authorize', {
      method: 'post',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(params)
    })
    if (!response.ok) {
      throw Error('authorize failed')
    }

    const data = await response.json()
    return data
  }

  /**
   * Call API to login and return an access token
   *
   * This occurs after Github has redirected us and given a temporary code.
   * We need to send the code back to the API to get an AccessToken in exchange.
   *
   * @param {Object} params - The parameters returned by the provider and the provider name
   */
  static async login (params) {
    const response = await fetch(this.apiUrl + '/auth/authenticate', {
      method: 'post',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(params)
    })
    if (!response.ok) {
      throw Error('login failed')
    }

    const data = await response.json()
    window.localStorage.setItem('auth', JSON.stringify(data))
  }

  /**
   * Empty all local storage, except theme
   *
   * This function never returns as it refreshes the window.
   */
  static logout () {
    // Backup and restore theme in localStorage
    let theme
    if ('theme' in window.localStorage) {
      theme = window.localStorage.getItem('theme')
    }
    window.localStorage.clear()
    if (theme) {
      window.localStorage.setItem('theme', theme)
    }
    window.location.reload()
  }

  /**
   * Call API to refresh the access token
   *
   * This occurs when the access token is expired.
   * This function may never return as it refreshes the window if unable to
   * refresh the token.
   */
  static async refresh () {
    const auth = JSON.parse(window.localStorage.getItem('auth'))
    const response = await fetch(this.apiUrl + '/auth/refresh', {
      method: 'post',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(auth)
    })
    if (!response.ok) {
      // Refresh failed, which means we should disconnect the user
      alert('Authentication has expired, please try again after logging in.')
      this.logout()
    }

    const data = await response.json()
    window.localStorage.setItem('auth', JSON.stringify(data))

    return data
  }

  /**
   * Call API and handle login error
   * @param {string} ep - Endpoint URL
   * @param {Object} params - The parameters to pass to API
   * @param {boolean} hasData - Whether return data is expected
   * @returns {Promise<any>} The API call result
   */
  static async api (ep, params = {}, hasData = true) {
    const auth = JSON.parse(window.localStorage.getItem('auth'))
    const headers = new Headers({ 'Content-Type': 'application/json' })
    let response = await fetch(this.apiUrl + ep, {
      method: 'post',
      headers,
      body: JSON.stringify({
        ...auth,
        ...params
      })
    })
    if (response.status === 401) {
      const auth = await this.refresh()
      response = await fetch(this.apiUrl + ep, {
        method: 'post',
        headers,
        body: JSON.stringify({
          ...auth,
          ...params
        })
      })
    }
    if (!response.ok) {
      throw Error(`API returned ${response.status}`)
    }
    if (hasData) {
      const data = await response.json()
      return data
    }
  }

  /**
   * Call API to retrieve all user data
   * @returns {Promise<{
   *   name: string,
   *   solves: {challenge: string, date: string, flag: string}[],
   *   solutions_pending: {challenge: string, url: string, date: string}[],
   *   solutions_rejected: {challenge: string, url: string, date: string}[],
   *   solutions_accepted: {challenge: string, date: string, uuid: string}[],
   *   solution_votes: string[],
   *   challenge_votes: string[]
   * }>} User data
   */
  static async getSelfUserData () {
    return await this.api('/user/self')
  }

  /**
   * Call API to delete all user data
   */
  static async deleteUserData () {
    await this.api('/user/delete', {}, false)
  }

  /**
   * Call API to toggle a vote on a challenge.
   * @param {string} challenge - Challenge identifier, e.g. "fcsc2019-crypto-2tp"
   * @returns {Promise<string[]>} List of currently voted challenges
   */
  static async voteChallenge (challenge) {
    return await this.api('/vote/challenge',
      {
        challenge
      })
  }

  /**
   * Call API to toggle a vote on a writeup.
   * @param {string} solution - Write-up UUID
   * @returns {Promise<string[]>} List of currently voted write-ups
   */
  static async voteSolution (solution) {
    return await this.api('/vote/solution',
      {
        solution
      })
  }

  /**
   * Call API to flag a challenge.
   * @param {string} challenge - Challenge identifier, e.g. "fcsc2019-crypto-2tp"
   * @param {string} flag - Flag
   * @returns {Promise<{challenge: string, date: string, flag: string}[]>} List of flagged challenges
   */
  static async submission (challenge, flag) {
    return await this.api('/submit_flag',
      {
        challenge,
        flag
      })
  }

  /**
   * Call API to submit a new writeup for review.
   * @param {string} challenge - Challenge identifier, e.g. "fcsc2019-crypto-2tp"
   * @param {string} url - URL to the writeup
   * @returns {Promise<{challenge: string, url: string, date: string}[]>} List of submitted write-ups in pending state
   */
  static async submitWriteUp (challenge, url) {
    return await this.api('/submit_solution',
      {
        challenge,
        url
      })
  }
}
