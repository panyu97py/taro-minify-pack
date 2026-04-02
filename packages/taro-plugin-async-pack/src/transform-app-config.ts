import type { AsyncPackOpts } from './types'
import { RawSource } from 'webpack-sources'
import { generateDefaultDynamicPackageName } from './utils'

interface Opts extends AsyncPackOpts {
  assets: Record<string, RawSource>
  asyncComponents: Record<string, string>
}

const appConfigAssetKey = 'app.json'

export const transformAppConfig = (opts: Opts) => {
  const { dynamicPackageCount, customDynamicPackages, asyncComponents, assets } = opts

  const curAppConfig = JSON.parse(assets[appConfigAssetKey].source() as string)

  const { subPackages, subpackages, resolveAlias = {}, usingComponents = {}, componentPlaceholder = {}, ...otherAppJSON } = curAppConfig

  const finalSubPackages = subPackages || subpackages || []

  const defaultDynamicPackagesConfig = new Array(dynamicPackageCount).fill(null).map((_, order) => {
    return { root: generateDefaultDynamicPackageName({ ...opts, order }), pages: [] }
  })

  const customDynamicPackagesConfig = customDynamicPackages.map(customDynamicPackageItem => {
    return { root: customDynamicPackageItem.name, pages: [] }
  })

  const asyncComponentPlaceholder = Object.keys(asyncComponents).reduce((result, item) => {
    return { ...result, [item]: 'block' }
  }, {})

  const finalAppConfig = {
    ...otherAppJSON,
    usingComponents: { ...usingComponents, ...asyncComponents },
    componentPlaceholder: { ...componentPlaceholder, ...asyncComponentPlaceholder },
    subPackages: [...finalSubPackages, ...defaultDynamicPackagesConfig, ...customDynamicPackagesConfig],
    resolveAlias: { ...resolveAlias, '~/*': '/*' }
  }

  assets[appConfigAssetKey] = new RawSource(JSON.stringify(finalAppConfig))
}
