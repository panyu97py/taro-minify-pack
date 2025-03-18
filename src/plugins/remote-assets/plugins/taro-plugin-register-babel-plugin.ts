import type {IPluginContext} from "@tarojs/service";
import path from 'path';


module.exports = (ctx: IPluginContext,) => {

  ctx.modifyWebpackChain(({chain}) => {
    const tempPath = path.resolve(__dirname, './babel-plugin-assets-path-transform');

    chain.module
      .rule('script')
      .use('babelLoader')
      .options({plugins: [tempPath]})

  })

}
