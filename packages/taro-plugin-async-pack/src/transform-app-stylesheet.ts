import type { CompilationAssets, AsyncPackOpts } from './types'

interface Opts extends AsyncPackOpts {
    assets: CompilationAssets;
}

export const transformAppStylesheet = (code: string, opts: Opts) => {
  const { dynamicModuleStyleFile, assets } = opts

  const isDynamicModuleStyleFileExist = Object.keys(assets).some(assetName => {
    return new RegExp(`${dynamicModuleStyleFile}\\.wxss`).test(assetName)
  })

  if (!isDynamicModuleStyleFileExist) return code

  return code.concat(`@import './${dynamicModuleStyleFile}.wxss';`)
}
