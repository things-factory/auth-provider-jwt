import { store, auth, HOMEPAGE, updateAuthenticated, showSnackbar, updateUser } from '@things-factory/shell'

import JWTAuthProvider from './jwt-auth-provider'

function onProfileChanged(e) {
  store.dispatch(updateUser(e.detail.profile))
}

function onAuthenticatedChanged(e) {
  var auth = e.detail
  store.dispatch(updateAuthenticated(auth))
}

function onAuthErrorChanged(e) {
  store.dispatch(showSnackbar(e.detail))
}

export default function bootstrap() {
  auth.on('signin', accessToken => {
    dispatchEvent(
      new CustomEvent('authenticated-changed', {
        bubbles: true,
        composed: true,
        detail: { authenticated: true, accessToken }
      })
    )
  })

  auth.on('signout', () => {
    document.dispatchEvent(
      new CustomEvent('authenticated-changed', { bubbles: true, composed: true, detail: { authenticated: false } })
    )
  })

  auth.on('profile', profile => {
    document.dispatchEvent(new CustomEvent('profile-changed', { bubbles: true, composed: true, detail: { profile } }))
  })

  auth.on('error', error => {
    console.error(error)

    document.dispatchEvent(new CustomEvent('auth-error-changed', { bubbles: true, composed: true, detail: { error } }))
  })

  store.subscribe(() => {
    var state = store.getState()

    var baseUrl = state.app.baseUrl

    auth.contextPath = state.app.contextPath
    auth.defaultRoutePage = state.app.defaultRoutePage

    if (baseUrl && baseUrl !== auth.endpoint) {
      auth.endpoint = baseUrl

      auth.profile()
    }
  })

  auth.authProvider = JWTAuthProvider

  auth.signinPath = 'signin'
  auth.signupPath = 'signup'
  auth.profilePath = 'authcheck'
  auth.signoutPath = ''

  auth.signinPage = 'signin'
  auth.signupPage = 'signup'
  auth.signoutPage = ''

  auth.contextPath = ''
  auth.defaultRoutePage = HOMEPAGE

  document.addEventListener('profile-changed', onProfileChanged)
  document.addEventListener('authenticated-changed', onAuthenticatedChanged)
  document.addEventListener('auth-error-changed', onAuthErrorChanged)
}
