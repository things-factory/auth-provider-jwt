import { store } from '@things-factory/shell'
import { auth } from '@things-factory/auth-base'

import JWTAuthProvider from './jwt-auth-provider'

export default function bootstrap() {
  store.subscribe(() => {
    var state = store.getState()

    var baseUrl = state.app.baseUrl

    auth.contextPath = state.app.contextPath

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
}
