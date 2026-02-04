import type { AsyncPackOpts } from './types'
import { RawSource } from 'webpack-sources'
import { generateDynamicPackageName } from './utils'

interface Opts extends AsyncPackOpts {
  assets: Record<string, RawSource>
}

const appConfigAssetKey = 'app.json'

export const transformAppConfig = (opts: Opts) => {
  const { dynamicPackageCount, assets } = opts

  const curAppConfig = JSON.parse(assets[appConfigAssetKey].source() as string)

  const { subPackages, subpackages, resolveAlias = {}, usingComponents = {}, componentPlaceholder = {}, ...otherAppJSON } = curAppConfig

  const finalSubPackages = subPackages || subpackages || []

  const dynamicPackagesConfigs = new Array(dynamicPackageCount).fill(null).map((_, order) => {
    return { root: generateDynamicPackageName({ ...opts, order }), pages: [] }
  })

  const finalAppConfig = {
    ...otherAppJSON,
    subPackages: [...finalSubPackages, ...dynamicPackagesConfigs],
    resolveAlias: { ...resolveAlias, '~/*': '/*' }
  }

  assets[appConfigAssetKey] = new RawSource(JSON.stringify(finalAppConfig))
}
