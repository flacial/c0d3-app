import React from 'react'
import { WithLayout } from '../../@types/page'
import { getLayout } from '../../components/Layout'
import Title from '../../components/Title'
import Card from '../../components/Card'
import NavLink from '../../components/NavLink'
import { NextApiResponse } from 'next'
import { Request, Response } from 'express'
import { LoggedRequest } from '../../@types/helpers'
import Link from 'next/link'
import Image from 'next/image'
import {
  DiscordUserInfo,
  setTokenFromAuthCode,
  getDiscordUserInfo,
  updateRefreshandAccessTokens
} from '../../helpers/discordAuth'
import { getSession } from 'next-auth/react'
import { Session } from '../../@types/auth'
import { PrismaClient } from '@prisma/client'

type ConnectToDiscordSuccessProps = {
  errorCode: number
  username: string
  userInfo: DiscordUserInfo
  error: Error
}

type DiscordErrorPageProps = {
  error: Error
  username: string
  navPath: string
  navText: string
}

type Error = {
  message: string
}

type Query = {
  code: string
}

export enum ErrorCode {
  USER_NOT_LOGGED_IN = 1,
  DISCORD_ERROR = 2
}

const DISCORD_BUGS_FEEDBACK_URL =
  'https://discord.com/channels/828783458469675019/836343487531712512'

const DiscordErrorPage: React.FC<DiscordErrorPageProps> = ({
  username,
  error,
  navPath,
  navText
}) => {
  let errorMessage = <></>,
    errorLog = <></>
  if (!username) {
    errorMessage = (
      <>
        <p>You need to be logged in to connect to Discord.</p>
        <p>
          or go straight <NavLink path="/curriculum">to the curriculum</NavLink>{' '}
          without an account
        </p>
      </>
    )
  } else {
    errorMessage = (
      <>
        <p>
          Dear {username}, we had trouble connecting to Discord, please try
          again.
        </p>
      </>
    )
  }
  if (error?.message) {
    errorLog = (
      <>
        <hr />
        <p>Error log</p>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </>
    )
  }
  return (
    <>
      <Title title="Error" />
      <Card title="Error">
        <div className="mt-3">{errorMessage}</div>
        <p>
          If this problem persists, please ask for help in our{' '}
          <NavLink path={DISCORD_BUGS_FEEDBACK_URL} external>
            Discord channel.
          </NavLink>
        </p>
        <NavLink path={navPath}>
          <button
            type="button"
            className="btn btn-primary btn-lg btn-block mb-3"
          >
            {navText}
          </button>
        </NavLink>
        {errorLog}
      </Card>
    </>
  )
}

export const ConnectToDiscordSuccess: React.FC<ConnectToDiscordSuccessProps> &
  WithLayout = ({ errorCode, username, userInfo, error }) => {
  if (errorCode === ErrorCode.DISCORD_ERROR)
    return (
      <DiscordErrorPage
        username={username}
        error={error}
        navPath="/curriculum"
        navText="Try Again"
      />
    )
  if (errorCode === ErrorCode.USER_NOT_LOGGED_IN)
    return (
      <DiscordErrorPage
        username=""
        error={error}
        navPath="/login"
        navText="Log In Here"
      />
    )
  return (
    <>
      <Title title="Success!" />
      <Card title="Success!">
        <>
          <div className="ms-auto me-auto">
            <Image
              className="avatar"
              src={userInfo.avatarUrl}
              width={120}
              height={120}
            />
          </div>
          <h5 className="mb-4">
            <Link href={`https://discordapp.com/users/${userInfo.userId}/`}>
              {userInfo.username}
            </Link>
          </h5>
          <style jsx global>{`
            .avatar {
              border-radius: 50%;
            }
          `}</style>
        </>
        <p>{username}, you are now connected to Discord!</p>
        <NavLink path="/curriculum">
          <button
            type="button"
            className="btn btn-primary btn-lg btn-block mb-3"
          >
            Continue to Curriculum
          </button>
        </NavLink>
      </Card>
    </>
  )
}

// getServerSideProps to get query param (authCode) using /success route as callback
// instead of a middleware-modified query resolver at /api/auth/discord/callback
// because NextJS throws an error when trying to res.redirect from that path

export const getServerSideProps = async ({
  req
}: {
  // NextJS request and response types are extended with Express request and response types
  // request type is initially NextApiRequest until it goes through all the middlewares
  req: LoggedRequest & Request
  res: NextApiResponse & Response
  query?: Query
}) => {
  const prisma = new PrismaClient()

  const session = (await getSession({ req })) as Session

  if (!session) return { props: { errorCode: ErrorCode.USER_NOT_LOGGED_IN } }

  const user = await prisma.user.findUnique({
    where: { id: session?.user.id }
  })

  const userInfo = await getDiscordUserInfo(user!)

  return { props: { userInfo, username: session.user.username } }
}

ConnectToDiscordSuccess.getLayout = getLayout

export default ConnectToDiscordSuccess
