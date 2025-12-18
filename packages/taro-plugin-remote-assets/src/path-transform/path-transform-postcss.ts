import { AcceptedPlugin } from 'postcss'
import { noop } from '@/utils'

const urlRegexp = /url\(['"]([^'"]*)['"]\)/

export interface AssetsPathTransformOpt {
  transform?: (filePath: string) => string
}

module.exports = (opt: AssetsPathTransformOpt): AcceptedPlugin => {
  return {
    postcssPlugin: 'assets-path-transform',

    Declaration (decl) {
      if (!urlRegexp.test(decl.value)) return

      const [_, filePath] = decl.value.match(urlRegexp)!

      const { transform = noop } = opt

      const transformedFilePath = transform(filePath) || ''

      if (!transformedFilePath || transformedFilePath === filePath) return

      decl.value = `url(${transformedFilePath})`
    }
  }
}
