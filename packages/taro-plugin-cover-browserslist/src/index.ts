import { getBrowsersList } from 'miniprogram-compat'
import type { IPluginContext } from '@tarojs/service'

export interface CoverBrowsersListOpt {
    minBaseLibraryVersion?: string
}

export default (ctx: IPluginContext, pluginOpts:CoverBrowsersListOpt) => {
  ctx.onBuildStart(() => {
    if (process.env.TARO_ENV !== 'weapp' || !pluginOpts.minBaseLibraryVersion) return

    const browsersList = getBrowsersList(pluginOpts.minBaseLibraryVersion)

    if (!browsersList) return

    process.env.BROWSERSLIST = browsersList.join(',')
  })
}
