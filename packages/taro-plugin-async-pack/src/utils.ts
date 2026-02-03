import { AsyncPackOpts } from './types'

export const generateKeyByOrder = (order: number) => {
  const startStr = 'a'.charCodeAt(0)
  const firstLetter = String.fromCharCode(startStr + Math.floor(order / 26))
  const secondLetter = String.fromCharCode(startStr + order % 26)
  return `${firstLetter}${secondLetter}`
}

export const hashModBigInt = (hash: string, mod: number) => {
  if (!hash) return 0
  return Number(BigInt('0x' + hash) % BigInt(mod))
}

export const isNumber = (val: any) => {
  return typeof val === 'number' && Number.isFinite(val)
}

export const isDynamicPackageName = (prefix: string, packageName: string) => {
  const dynamicModuleRegExp = new RegExp(`^${prefix}(?:-[a-z]{2})?/`)
  return dynamicModuleRegExp.test(packageName)
}

export const isDynamicPackageJsAsset = (prefix: string, assetName: string) => {
  const dynamicJsAssetRegExp = new RegExp(`^${prefix}(?:-[a-z]{2})?\\/.*\\.js$`)
  return dynamicJsAssetRegExp.test(assetName)
}

export const isDynamicPackageWXssAsset = (prefix: string, assetName: string) => {
  const dynamicWXssAssetRegExp = new RegExp(`^${prefix}(?:-[a-z]{2})?\\/.*\\.wxss$`)
  return dynamicWXssAssetRegExp.test(assetName)
}

export const generateDynamicPackageName = (opt: AsyncPackOpts & { order?: number }) => {
  if (!isNumber(opt.order) || opt.dynamicPackageCount <= 1) return opt.dynamicPackageNamePrefix
  return `${opt.dynamicPackageNamePrefix}-${generateKeyByOrder(opt.order!)}`
}
