import type {IPluginContext} from '@tarojs/service'
import {PromisePool} from '@supercharge/promise-pool'
import path from 'path';
import fs from 'fs';
import md5 from 'md5'
import {saveCacheData} from "../utils";

/**
 * 递归查找文件
 */
const travelFiles = (dir: string): string[] => {
  const files = fs.readdirSync(dir);
  return files.reduce<string[]>((result, file) => {
    const filePath = path.join(dir, file);
    if (!fs.statSync(filePath).isDirectory()) return [...result, filePath];
    return [...result, ...travelFiles(filePath)];
  }, [])
}

/**
 * 文件路径格式化
 */
const filePathFormat = (ctx: IPluginContext, filePath: string) => {
  return filePath.replace(ctx.paths.sourcePath, "@").replace(/\\/g, "/");
}

/**
 * 生成文件 key
 */
const generateFileUniqueKey = (filePath: string) => {
  const {dir, base, ext} = path.parse(filePath);
  const buffer = fs.readFileSync(`${dir}${path.sep}${base}`);
  return md5(buffer)
}

export interface UploadAssetsPluginOpts {
    fileDir: string,
    upload: (filePath: string, fileKey: string) => Promise<string>

}

module.exports = (ctx: IPluginContext, pluginOpts: UploadAssetsPluginOpts) => {
  ctx.onBuildStart(async () => {
    const {fileDir, upload} = pluginOpts
    const fileDirPath = `${ctx.paths.sourcePath}/${fileDir}`;
    const filePathList = travelFiles(fileDirPath);

    // 上传文件
    const {results: fileUrlList} = await PromisePool.withConcurrency(2)
      .for(filePathList)
      .process(async (filePath) => {
        const fileUrl = await upload(filePath, generateFileUniqueKey(filePath))
        return {filePath, fileUrl}
      })

    // 生成文件缓存数据
    const fileUrlMap = fileUrlList.reduce((result, item) => {
      const tempKey = filePathFormat(ctx, item.filePath)
      return {...result, [tempKey]: item.fileUrl}
    }, {})

    saveCacheData(fileUrlMap)
  })
}
