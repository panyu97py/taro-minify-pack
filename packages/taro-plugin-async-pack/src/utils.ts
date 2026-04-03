import { AsyncPackOpts } from './types'
import type { PathData } from 'webpack'

export const hashModBigInt = (hash: string, mod: number) => {
  if (!hash || mod <= 0) return 0
  return Number(BigInt('0x' + hash) % BigInt(mod))
}

export const generateKeyByOrder = (order: number) => {
  const startStr = 'a'.charCodeAt(0)
  const firstLetter = String.fromCharCode(startStr + Math.floor(order / 26))
  const secondLetter = String.fromCharCode(startStr + order % 26)
  return `${firstLetter}${secondLetter}`
}

export const generateDefaultDynamicPackageName = (opt: AsyncPackOpts & { order?: number }) => {
  if (!isNumber(opt.order) || opt.dynamicPackageCount <= 1) return opt.dynamicPackageNamePrefix
  return `${opt.dynamicPackageNamePrefix}-${generateKeyByOrder(opt.order!)}`
}

export const generateCustomDynamicPackageName = (opt: AsyncPackOpts, packageName: string) => {
  return `${opt.dynamicPackageNamePrefix}-${packageName}`
}

export const generateChunkFilename = (opt: AsyncPackOpts & { pathData: PathData, ext: string }) => {
  const { chunk } = opt.pathData
  if (chunk?.name) return `${chunk?.name}${opt.ext}`
  const order = hashModBigInt(chunk?.hash || '', opt.dynamicPackageCount)
  return `${generateDefaultDynamicPackageName({ ...opt, order })}/[chunkhash]${opt.ext}`
}

export const isNumber = (val: any) => {
  return typeof val === 'number' && Number.isFinite(val)
}

export const isDefaultDynamicPackageAsset = (opt: AsyncPackOpts, assetName: string) => {
  const dynamicModuleRegExp = new RegExp(`^${opt.dynamicPackageNamePrefix}(?:-[a-z]{2})?/`)
  return dynamicModuleRegExp.test(assetName)
}

export const isCustomDynamicPackageAsset = (opt: AsyncPackOpts, assetName: string) => {
  const customDynamicPackageNames = opt.customDynamicPackages.map(item => generateCustomDynamicPackageName(opt, item.name))
  if (!customDynamicPackageNames.length) return false
  return new RegExp(`^(${customDynamicPackageNames.join('|')})`).test(assetName)
}

export const isDynamicPackageAsset = (opt: AsyncPackOpts, assetName: string) => {
  return isDefaultDynamicPackageAsset(opt, assetName) || isCustomDynamicPackageAsset(opt, assetName)
}

export const isAsyncStyleDynamicPackageAsset = (opt: AsyncPackOpts, assetName: string) => {
  const asyncStylDynamicPackageNames = opt.customDynamicPackages.filter(item => item.asyncStyle).map(item => `${opt.dynamicPackageNamePrefix}-${item.name}`)
  if (!asyncStylDynamicPackageNames.length) return false
  return new RegExp(`^(${asyncStylDynamicPackageNames.join('|')})`).test(assetName)
}

export const isSyncStyleDynamicPackageAsset = (opt: AsyncPackOpts, assetName: string) => {
  return isDynamicPackageAsset(opt, assetName) && !isAsyncStyleDynamicPackageAsset(opt, assetName)
}

export const matchSuffix = (suffix: string, assetName: string) => {
  return new RegExp(`\\.${suffix}$`).test(assetName)
}
