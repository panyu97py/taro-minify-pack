import fs from 'fs'
import path from 'path'
import md5 from 'md5'

/**
 * 递归查找文件
 */
export const travelFiles = (dir: string): string[] => {
  const files = fs.readdirSync(dir)
  return files.reduce<string[]>((result, file) => {
    const filePath = path.join(dir, file)
    if (!fs.statSync(filePath).isDirectory()) return [...result, filePath]
    return [...result, ...travelFiles(filePath)]
  }, [])
}

/**
 * 生成文件 key
 */
export const generateFileUniqueKey = (filePath: string) => {
  const { dir, base } = path.parse(filePath)
  const buffer = fs.readFileSync(`${dir}${path.sep}${base}`)
  return md5(buffer)
}

export const getCacheData = (cacheFilePath:string): any => {
  try {
    fs.accessSync(cacheFilePath)
    return JSON.parse(fs.readFileSync(cacheFilePath).toString())
  } catch (error) {
    return null
  }
}

export const saveCacheData = (cacheFilePath:string, cacheData:any) => {
  fs.writeFileSync(cacheFilePath, JSON.stringify(cacheData))
}

export const noop = () => {}
