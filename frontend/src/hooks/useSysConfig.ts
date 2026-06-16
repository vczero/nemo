import { useEffect } from 'react'
import useSWR from 'swr'
import { getSysConfig, GET_SYS_CONFIG_ENDPOINT } from '@/apis'
import type { TSysConfig } from '@/apis/types'
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from '@/utils/utils'

const SYS_CONFIG_CACHE_KEY = 'sys_config'

export const useSysConfig = () => {
  const { data } = useSWR<TSysConfig | null>(
    GET_SYS_CONFIG_ENDPOINT,
    () => getSysConfig(),
    {
      fallbackData: getLocalStorageItem<TSysConfig | null>(
        SYS_CONFIG_CACHE_KEY,
        null
      ),
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  )

  useEffect(() => {
    if (!data) return
    const cached = getLocalStorageItem<TSysConfig | null>(
      SYS_CONFIG_CACHE_KEY,
      null
    )
    if (JSON.stringify(cached) !== JSON.stringify(data)) {
      setLocalStorageItem(SYS_CONFIG_CACHE_KEY, data)
    }
  }, [data])

  return data ?? null
}
