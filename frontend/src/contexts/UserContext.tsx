import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { App } from 'antd'
import {
  GET_USER_ENDPOINT,
  GET_UNREAD_MESSAGE_COUNT_ENDPOINT,
  type TGetUnreadMessageCountResponse,
  type TAccountSubscription,
  GET_ACCOUNT_SUBSCRIPTION_ENDPOINT,
} from '@/apis'
import type { User } from '@/types'
import useSWR from 'swr'
import { fetcher } from '@/utils/fetcher'
import type { TFetcherOptions, FetchError } from '@/utils/fetcher'
/**
 * Defines the shape of the UserContext, based on the return value of our custom API hook.
 */
interface UserContextType {
  user: User | undefined
  accountSubscription: TAccountSubscription | undefined
  unreadMessages: number | undefined
  loading: boolean
  isAccountSubscriptionLoading: boolean
  error: any
  mutateUserData: (data?: any, shouldRevalidate?: boolean) => Promise<any>
  mutateAccountSubscriptionData: (
    data?: any,
    shouldRevalidate?: boolean
  ) => Promise<any>
  mutateUnreadMessageCountData: () => Promise<any>
}

// Create the context with an undefined default value to enforce provider usage.
const UserContext = createContext<UserContextType | undefined>(undefined)

/**
 * Provides the UserContext to its children.
 * It consumes the `useUserApi` hook and provides the fetched data to the rest of the app.
 * @param {object} props - The component props.
 * @param {ReactNode} props.children - The child components to be rendered within the provider.
 */
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { message: messageApi } = App.useApp()
  const requiredAuth = () =>
    location.pathname !== '/signin' &&
    location.pathname !== '/signup' &&
    location.pathname !== '/reset-password' &&
    location.pathname !== '/payment-success' &&
    location.pathname !== '/'
  const retryOptions = {
    shouldRetryOnError: (err: FetchError) => err?.status !== 401,
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  }
  const {
    data: userData,
    error,
    isLoading: isUserDataLoading,
    mutate: mutateUserData,
  } = useSWR<User, FetchError>(
    GET_USER_ENDPOINT,
    (url: string) =>
      fetcher(url, { fetcherOptions: { silent: true, requiredAuth: requiredAuth() } }),
    {
      keepPreviousData: true,
      revalidateIfStale: true,
      ...retryOptions,
    }
  )
  const {
    data: accountSubscriptionData,
    isLoading: isAccountSubscriptionLoading,
    // isValidating: isValidatingAccountSubscription,
    mutate: mutateAccountSubscriptionData,
    error: accountSubscriptionError,
  } = useSWR<TAccountSubscription, FetchError>(
    GET_ACCOUNT_SUBSCRIPTION_ENDPOINT,
    (url: string) =>
      fetcher(url, { fetcherOptions: { silent: true, requiredAuth: requiredAuth() } }),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
      ...retryOptions,
    }
  )
  const { data: unreadMessageCountData, mutate: mutateUnreadMessageCountData } =
    useSWR<TGetUnreadMessageCountResponse, FetchError>(
      userData
        ? [
            GET_UNREAD_MESSAGE_COUNT_ENDPOINT,
            { fetcherOptions: { silent: true, requiredAuth: true } },
          ]
        : null,
      ([url, opts]: [string, TFetcherOptions]) => fetcher(url, opts),
      { refreshInterval: 10000 }
    )

  useEffect(() => {
    if (error && error.status !== 401 && !userData && requiredAuth()) {
      messageApi.error('获取用户信息失败，请稍后重试')
    }
  }, [error])

  useEffect(() => {
    if (
      accountSubscriptionError &&
      !accountSubscriptionData &&
      accountSubscriptionError.status !== 401 &&
      requiredAuth()
    ) {
      messageApi.error('获取用户订阅信息失败，请稍后重试')
    }
  }, [accountSubscriptionError])

  // accountSubscriptionData && (accountSubscriptionData.subscriptionStatus = 'EXPIRED')

  const value = {
    user: userData,
    accountSubscription: accountSubscriptionData,
    unreadMessages: unreadMessageCountData?.total || 0,
    loading: isUserDataLoading,
    isAccountSubscriptionLoading: isAccountSubscriptionLoading,
    error: error || accountSubscriptionError,
    mutateUserData,
    mutateAccountSubscriptionData,
    mutateUnreadMessageCountData,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

/**
 * Custom hook to consume the UserContext.
 * @throws {Error} If used outside of a UserProvider.
 * @returns {UserContextType} The context value.
 */
export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
