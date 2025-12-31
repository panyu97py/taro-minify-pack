import type { AsyncPackOpts } from './types'
import { RawSource } from 'webpack-sources'

interface Opts extends AsyncPackOpts {
    assets: Record<string, RawSource>
    asyncComponents: Record<string, string>
}

const appConfigAssetKey = 'app.json'

export const transformAppConfig = (opts: Opts) => {
  const { dynamicPackageName, asyncComponents, assets } = opts

  const curAppConfig = JSON.parse(assets[appConfigAssetKey].source() as string)

  const { subPackages, subpackages, resolveAlias = {}, usingComponents = {}, componentPlaceholder = {}, ...otherAppJSON } = curAppConfig

  const finalSubPackages = subPackages || subpackages || []

  const dynamicPackagesConfig = { root: dynamicPackageName, pages: [] }

  const asyncComponentPlaceholder = Object.keys(asyncComponents).reduce((result, item) => {
    return { ...result, [item]: 'block' }
  }, {})

  const finalAppConfig = {
    ...otherAppJSON,
    usingComponents: { ...usingComponents, ...asyncComponents },
    componentPlaceholder: { ...componentPlaceholder, ...asyncComponentPlaceholder },
    subPackages: [...finalSubPackages, dynamicPackagesConfig],
    resolveAlias: { ...resolveAlias, [`${dynamicPackageName}/*`]: `/${dynamicPackageName}/*` }
  }

  assets[appConfigAssetKey] = new RawSource(JSON.stringify(finalAppConfig))
}
