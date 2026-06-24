import fs from 'fs'
import path from 'path'
import { CacheData } from '@/types'

export const getCacheData = (cacheFilePath: string): CacheData => {
  try {
    fs.accessSync(cacheFilePath)
    return JSON.parse(fs.readFileSync(cacheFilePath).toString())
  } catch (error) {
    return {}
  }
}

export const saveCacheData = (cacheFilePath: string, cacheData: CacheData) => {
  const cacheDirPath = path.dirname(cacheFilePath)
  if (!fs.existsSync(cacheDirPath)) fs.mkdirSync(cacheDirPath, { recursive: true })
  fs.writeFileSync(cacheFilePath, JSON.stringify(cacheData))
}

export const noop = () => {}
