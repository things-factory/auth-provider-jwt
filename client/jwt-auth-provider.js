// async function encodeSha256(password) {
//   const encoder = new TextEncoder()
//   const encoded = encoder.encode(password)

//   const buffer = await crypto.subtle.digest('SHA-256', encoded)
//   return hexString(buffer)
// }

function _matchPass(newPassword, confirmPassword, currentPassword) {
  if (newPassword !== confirmPassword) {
    throw 'Your password is not matched'
  } else if (newPassword === currentPassword) {
    throw 'You are using old password'
  }
}

export default {
  signinPath: 'signin',
  signupPath: 'signup',
  profilePath: 'authcheck',
  signoutPath: 'signout',
  signinPage: 'signin',
  signupPage: 'signup',
  changepassPath: 'change_pass',

  //run after the base connect this provider function
  async changePassword(formProps) {
    var newPassword = formProps.new_pass
    var confirmPassword = formProps.confirm_pass
    var currentPassword = formProps.current_pass

    try {
      _matchPass(newPassword, confirmPassword, currentPassword)

      // formProps.new_pass = await encodeSha256(newPassword)
      // formProps.confirm_pass = await encodeSha256(confirmPassword)
      // formProps.current_pass = await encodeSha256(currentPassword)

      const response = await fetch(this.fullpath(`${this.changepassPath}`), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(formProps)
      })

      if (response.ok) {
        const data = await response.json()

        if (data && data.error) {
          this.onChangePwdError(data.error)
        } else {
          this.onPwdChanged(true)
        }
      } else {
        throw new Error(response.status)
      }
    } catch (e) {
      this.onChangePwdError(e)
    }
  },

  async signup(formProps) {
    try {
      const response = await fetch(this.fullpath(this.signupPath), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formProps)
      })

      if (response.ok) {
        const data = await response.json()

        if (data && data.error) {
          this.onAuthError(data.error)
          return
        }
        if (data && data.token) {
          // localStorage.setItem('access_token', data.token)

          /*
           data.token 이 전달되면, 서버는 특별한 확인과정없이 사용자 승인한 것으로 이해하고, 바로 자동 로그인 절차에 들어간다.
           즉, 사용자 auth dispatch 후에 바로 사용자 정보를 서버에 요청한다.
          */
          this.onSignedIn({
            accessToken: data.token,
            domains: data.domains
          })
          this.profile()
          return
        } else {
          throw new Error(response.status)
        }
      } else {
        throw new Error(response.status)
      }
    } catch (e) {
      this.onAuthError(e)
    }
  },

  async signin(formProps) {
    try {
      const response = await fetch(this.fullpath(this.signinPath), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formProps)
      })

      if (response.ok) {
        const data = await response.json()

        // localStorage.setItem('access_token', data.token)

        /* 사용자 auth dispatch 후에 바로 사용자 정보를 서버에 요청함. */
        this.onSignedIn({
          accessToken: data.token,
          domains: data.domains
        })
        this.profile()

        return
      } else {
        throw new Error(response.status)
      }
    } catch (e) {
      this.onAuthError(e)
    }
  },

  async profile() {
    try {
      var searchParams = new URLSearchParams(location.search)
      var token = searchParams.get('token')
      var headers = {
        'Content-Type': 'application/json'
      }

      if (token) headers.authorization = `Bearer ${token}`
      const response = await fetch(this.fullpath(this.profilePath), {
        method: 'GET',
        credentials: 'include',
        headers
      })

      if (response.ok) {
        const data = await response.json()

        // localStorage.setItem('user', JSON.stringify(data.user))
        // localStorage.setItem('access_token', data.token)

        this.onProfileFetched({
          credential: data.user,
          accessToken: data.token,
          domains: data.domains
        })

        return
      } else {
        let status = Number(response.status)
        if (status == 401) {
          this.onAuthRequired(response.status)
          return
        }
        if (status == 406) {
          response.json().then(json => {
            this.onDomainNotAvailable(json)
          })
          return
        }
        throw new Error(response)
      }
    } catch (e) {
      this.onAuthError(e)
    }
  },

  async signout() {
    try {
      const response = await fetch(this.fullpath(this.signoutPath), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        this.onSignedOut('signed out')
        return
      } else {
        throw new Error(response.status)
      }
    } catch (e) {
      this.onAuthError(e)
    }
  }
}
