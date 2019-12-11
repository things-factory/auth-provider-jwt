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
  profilePath: 'profile',
  signoutPath: 'signout',
  changepassPath: 'change_pass',
  updateProfilePath: 'update-profile',
  deleteAccountPath: 'delete-account',
  signinPage: 'signin',
  signupPage: 'signup',

  //run after the base connect this provider function
  async updateProfile(formProps) {
    try {
      const response = await fetch(this.fullpath(`${this.updateProfilePath}`), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(formProps)
      })

      const data = await response.json()
      if (response.ok) {
        return {
          success: true,
          detail: data
        }
      } else {
        return {
          success: false,
          detail: data
        }
      }
    } catch (e) {
      return {
        success: false,
        detail: e
      }
    }
  },

  //run after the base connect this provider function
  async changePassword(formProps) {
    var newPassword = formProps.new_pass
    var confirmPassword = formProps.confirm_pass
    var currentPassword = formProps.current_pass

    try {
      _matchPass(newPassword, confirmPassword, currentPassword)

      const response = await fetch(this.fullpath(`${this.changepassPath}`), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(formProps)
      })

      const data = await response.json()
      if (response.ok) {
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

  async deleteAccount(formProps) {
    try {
      const response = await fetch(this.fullpath(`${this.deleteAccountPath}`), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(formProps)
      })

      const data = await response.json()
      if (response.ok) {
        return {
          success: true,
          detail: data
        }
      } else {
        return {
          success: false,
          detail: data
        }
      }
    } catch (e) {
      return {
        success: false,
        detail: e
      }
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

      const data = await response.json()
      if (response.ok) {
        if (data && data.token) {
          /*
           data.token 이 전달되면, 서버는 특별한 확인과정없이 사용자 승인한 것으로 이해하고, 바로 자동 로그인 절차에 들어간다.
           즉, 사용자 auth dispatch 후에 바로 사용자 정보를 서버에 요청한다.
          */
          this.onSignedIn({
            accessToken: data.token,
            domains: data.domains
          })
          return
        } else {
          this.onAuthError({
            success: false,
            detail: data
          })
        }
      } else {
        this.onAuthError({
          success: false,
          detail: data
        })
      }
    } catch (e) {
      this.onAuthError({
        success: false,
        detail: e
      })
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

      const data = await response.json()
      const status = Number(response.status)
      if (response.ok) {
        /* 사용자 auth dispatch 후에 바로 사용자 정보를 서버에 요청함. */
        this.onSignedIn({
          accessToken: data.token,
          domains: data.domains,
          redirectTo: data.redirectTo
        })

        return {
          success: true,
          detail: data
        }
      } else {
        if (data.message == 'user-not-activated') {
          this.onActivateRequired({
            email: formProps.email
          })
        }

        if (status == 406) {
          this.onDomainNotAvailable(data)
          return
        }

        this.onAuthError({
          success: false,
          detail: data
        })
      }
    } catch (e) {
      this.onAuthError({
        success: false,
        detail: e
      })
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

      const data = await response.json()
      if (response.ok) {
        this.onProfileFetched({
          credential: data.user,
          accessToken: data.token,
          domains: data.domains
        })

        return
      } else {
        let status = Number(response.status)
        var { message, email } = data
        if (status == 401) {
          if (message == 'user-locked') {
            this.onActivateRequired({
              email
            })
          } else {
            this.onAuthRequired(response.status)
          }
          return
        }
        if (status == 406) {
          this.onDomainNotAvailable(data)
          return
        }
        this.onAuthError({
          success: false,
          detail: data
        })
      }
    } catch (e) {
      this.onAuthError({
        success: false,
        detail: e
      })
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
