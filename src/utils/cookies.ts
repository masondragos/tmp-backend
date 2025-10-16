import { Response } from 'express'

export interface CookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  maxAge?: number
  path?: string
  domain?: string
}

export interface UserInfo {
  id: string
  email: string
  name: string
  avatar?: string | null
}

// const isProduction = process.env.NODE_ENV === 'production'
const isProduction = false

const defaultCookieOptions: CookieOptions = {
  httpOnly: false, // Allow frontend access to cookies
  secure: isProduction, // HTTPS only in production
  sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-site cookies in production
  path: '/',
  domain: isProduction ? '.themortgageplatform.com' : undefined // Allow subdomain sharing in production
}

/**
 * Sets a JWT authentication token cookie
 */
export const setAuthTokenCookie = (
  res: Response,
  token: string,
  cookieName: string = 'authToken',
  maxAge: number = 7 * 24 * 60 * 60 * 1000 // 7 days default
): void => {
  res.cookie(cookieName, token, {
    ...defaultCookieOptions,
    maxAge,
  })
}

/**
 * Sets user information cookie
 */
export const setUserInfoCookie = (
  res: Response,
  userInfo: UserInfo,
  cookieName: string = 'userInfo',
  maxAge: number = 7 * 24 * 60 * 60 * 1000 // 7 days default
): void => {
  res.cookie(cookieName, JSON.stringify(userInfo), {
    ...defaultCookieOptions,
    maxAge,
  })
}

/**
 * Sets both auth token and user info cookies
 */
export const setAuthCookies = (
  res: Response,
  token: string,
  userInfo: UserInfo,
  authTokenName: string = 'authToken',
  userInfoName: string = 'userInfo',
  maxAge: number = 7 * 24 * 60 * 60 * 1000, // 7 days default
): void => {
  setAuthTokenCookie(res, token, authTokenName, maxAge)
  setUserInfoCookie(res, userInfo, userInfoName, maxAge)
}

/**
 * Clears authentication cookies
 */
export const clearAuthCookies = (
  res: Response,
  authTokenName: string = 'authToken',
  userInfoName: string = 'userInfo'
): void => {
  res.clearCookie(authTokenName, {
    ...defaultCookieOptions,
  })
  res.clearCookie(userInfoName, {
    ...defaultCookieOptions,
  })
}

/**
 * Sets a custom cookie with default options
 */
export const setCookie = (
  res: Response,
  name: string,
  value: string,
  options: CookieOptions = {}
): void => {
  res.cookie(name, value, {
    ...defaultCookieOptions,
    ...options,
  })
}

/**
 * Clears a specific cookie
 */
export const clearCookie = (
  res: Response,
  name: string,
  options: CookieOptions = {}
): void => {
  res.clearCookie(name, {
    ...defaultCookieOptions,
    ...options,
  })
}

/**
 * Gets cookie options for development (less strict)
 */
export const getDevCookieOptions = (): CookieOptions => ({
  httpOnly: false, // Allow frontend access to cookies
  secure: false, // Allow HTTP in development
  sameSite: 'lax',
  path: '/',
  domain: undefined // No domain restriction in development
})

/**
 * Gets cookie options for production
 */
export const getProdCookieOptions = (): CookieOptions => ({
  httpOnly: false, // Allow frontend access to cookies
  secure: true, // HTTPS only in production
  sameSite: 'none', // Required for cross-site cookies
  path: '/',
  domain: '.themortgageplatform.com' // Allow subdomain sharing
})

/**
 * Gets environment-specific cookie options
 */
export const getCookieOptions = (): CookieOptions => {
  return isProduction ? getProdCookieOptions() : getDevCookieOptions()
}
