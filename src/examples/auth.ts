
import { Authenticator } from '../index'

async function authenticate(username: string, password: string, clientToken: string) {
    try {
        const { data: authFromMojang } = await Authenticator.authenticate(username, password, clientToken, true)

        console.log('profiles =>', authFromMojang.availableProfiles)
        console.log('selected profile =>', authFromMojang.selectedProfile)
        console.log('user =>', authFromMojang.user)
        console.log('invalidate =>', await Authenticator.invalidate(authFromMojang.accessToken, authFromMojang.clientToken))
    } catch {
        const defaultAuth = Authenticator.default(username)

        console.log('profiles =>', defaultAuth.availableProfiles)
        console.log('selected profile =>', defaultAuth.selectedProfile)
    }
}

require('dotenv').config()

const { AUTH_USERNAME = 'steve', AUTH_PASSWORD = '123', AUTH_TOKEN = 'abc' } = process.env

authenticate(AUTH_USERNAME, AUTH_PASSWORD, AUTH_TOKEN).catch(err => {
    console.error(err)
})
