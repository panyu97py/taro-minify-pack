import {AcceptedPlugin} from "postcss";
import {generateDefaultTransform} from "../utils";

const urlRegexp = /url\(['"]([^'"]*)['"]\)/

export interface AssetsTransformOpt {
    transform?: (filePath: string) => string
}


module.exports = (opt: AssetsTransformOpt): AcceptedPlugin => {

  const defaultTransform = generateDefaultTransform()

  return {
    postcssPlugin: 'assets-path-transform',

    Declaration(decl) {

      if (!urlRegexp.test(decl.value)) return

      const [_, filePath] = decl.value.match(urlRegexp)!;

      const {transform = defaultTransform} = opt

      if (!transform(filePath)) return;

      decl.value = `url(${transform(filePath)})`

    }
  }
}
