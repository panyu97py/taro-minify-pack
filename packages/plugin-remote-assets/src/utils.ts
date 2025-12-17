import fs from "fs";
import path from "path";

const cacheFilePath = path.join(__dirname, 'cache.json')

const getCacheData = (): Record<string, string> => {
  try {
    fs.accessSync(cacheFilePath);
    return JSON.parse(fs.readFileSync(cacheFilePath).toString());
  } catch (error) {
    return {}
  }
}

export const saveCacheData = (cacheData: Record<string, string>) => {
  fs.writeFileSync(cacheFilePath, JSON.stringify(cacheData));
}

const filePathFormat = (filePath: string) => filePath.replace(/^~/, '')


export const generateDefaultTransform = () => {
  let cacheData: Record<string, string>

  return (filePath: string) => {
    if (!cacheData) {
      cacheData = getCacheData()
    }

    filePath = filePathFormat(filePath)

    if (!cacheData[filePath]) return

    return cacheData[filePath]
  }
}
