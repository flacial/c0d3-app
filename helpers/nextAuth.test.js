jest.mock('./discordAuth.ts')
jest.mock('./middleware/user')
jest.mock('./middleware/session')
jest.mock('./middleware/logger')

import { updateRefreshandAccessTokens } from './discordAuth'
import prismaMock from '../__tests__/utils/prismaMock'
import loggingMiddleware from './middleware/logger'
import sessionMiddleware from './middleware/session'
import userMiddleware from './middleware/user'
import { getUserSession } from './getUserSession'
import DiscordProvider from 'next-auth/providers/discord'

const res = {
  setHeader: jest.fn(),
  json: jest.fn(),
  status: jest.fn()
}
const req = {}

const defaultMiddleware = (_req, _res, next) => next()

loggingMiddleware.mockImplementation(defaultMiddleware)
sessionMiddleware.mockReturnValue(defaultMiddleware)

describe('Providers', () => {
  expect.assertions(2)

  it('Should call DiscordProvider with empty clientId and clientSecret', () => {
    const clientId = process.env.DISCORD_KEY
    const clientSecret = process.env.DISCORD_SECRET

    // Used delete because (= undefined) set its value to "undefined"
    delete process.env.DISCORD_KEY
    delete process.env.DISCORD_SECRET

    const { providers } = require('./nextAuth')

    expect(providers[0].options.clientId).toBe('')
    expect(providers[0].options.clientSecret).toBe('')

    process.env.DISCORD_KEY = clientId
    process.env.DISCORD_SECRET = clientSecret
  })
})

describe('Signin callback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('Should return true when provider is not discord', async () => {
    expect.assertions(1)

    const { signIn } = require('./nextAuth')
    const signInCallback = signIn(req, res)

    const value = await signInCallback({
      account: {
        provider: 'credentials'
      },
      user: {
        id: 123
      }
    })

    expect(value).toBe(true)
  })

  describe('Connect to discord', () => {
    it('Should connect-to-discord when the provider is discord and there is previous session', async () => {
      expect.assertions(2)
      userMiddleware.mockImplementation((req, _res, next) => {
        req.user = {
          id: 123,
          username: 'fakeUser'
        }
        next()
      })

      const { signIn } = require('./nextAuth')
      const signInCallback = signIn(req, res)

      const value = await signInCallback({
        account: {
          provider: 'discord'
        },
        user: {
          id: 123
        }
      })

      expect(updateRefreshandAccessTokens).toBeCalled()
      expect(value).toBe('/discord/success')
    })
  })

  describe('Login with discord', () => {
    it('Should redirect to /curriculum when user is found', async () => {
      expect.assertions(1)

      prismaMock.user.findFirst.mockResolvedValue({ id: 123 })

      userMiddleware.mockImplementation((req, _res, next) => {
        req.user = null
        next()
      })

      const reqCopy = { ...req, session: { userId: null } }

      const { signIn } = require('./nextAuth')
      const signInCallback = signIn(reqCopy, res)

      const value = await signInCallback({
        account: {
          provider: 'discord'
        },
        user: {
          id: '123'
        }
      })

      expect(value).toBe('/curriculum')
    })

    it('Should redirect to /discord/404user when user is not found', async () => {
      expect.assertions(1)

      prismaMock.user.findFirst.mockResolvedValue(null)

      userMiddleware.mockImplementation((req, _res, next) => {
        req.user = null
        next()
      })

      const reqCopy = { ...req, session: { userId: null } }

      const { signIn } = require('./nextAuth')
      const signInCallback = signIn(reqCopy, res)

      const value = await signInCallback({
        account: {
          provider: 'discord'
        },
        user: {
          id: '123'
        }
      })

      expect(value).toBe('/discord/404user')
    })
  })

  describe('getUserSession', () => {
    it('Should return the user in getUserSession if user is found', async () => {
      expect.assertions(1)
      userMiddleware.mockImplementation((req, _res, next) => {
        req.user = {
          id: 123,
          username: 'fakeUser'
        }
        next()
      })

      const c0d3User = await getUserSession(req, res)

      expect(c0d3User).toStrictEqual({
        id: 123,
        username: 'fakeUser'
      })
    })

    it('Should return null in getUserSession if user not found', async () => {
      userMiddleware.mockImplementation((req, _res, next) => {
        req.user = null
        next()
      })

      const c0d3User = await getUserSession(req, res)

      expect(c0d3User).toBe(null)
    })
  })
})
