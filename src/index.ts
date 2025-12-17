import type {IPluginContext} from "@tarojs/service";
import path from "path";
import {DynamicPackOpts} from "./plugins/async-pack/types";

type Opt = Partial<DynamicPackOpts>

export default (_ctx: IPluginContext, options: Opt = {}) => {
  return {
    plugins: [
      [path.resolve(__dirname, 'plugins', 'async-pack'), options],
    ]
  }
}
