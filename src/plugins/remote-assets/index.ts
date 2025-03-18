import {UploadAssetsPluginOpts} from "./plugins/taro-plugin-upload-assets";
import path from 'path';
import type {IPluginContext} from "@tarojs/service";

type PresetOpts = UploadAssetsPluginOpts

// ctx.modifyRunnerOpts

module.exports = (_ctx: IPluginContext, opt: PresetOpts) => {
  return {
    plugins: [
      [path.resolve(__dirname, 'plugins', 'taro-plugin-register-babel-plugin')],
      [path.resolve(__dirname, 'plugins', 'taro-plugin-upload-assets'), opt],
    ]
  }
}
