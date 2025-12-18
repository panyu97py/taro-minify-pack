import type { NodePath, PluginItem, PluginPass } from '@babel/core'
import type { ImportDeclaration, Statement } from '@babel/types'
import template from '@babel/template'
import { noop } from '@/utils'

export interface AssetsTransformOpt {
    transform?: (filePath: string) => string
}

module.exports = (): PluginItem => {
  return {
    visitor: {
      ImportDeclaration (importDeclarationAstPath: NodePath<ImportDeclaration>, state: PluginPass) {
        if (state.file.opts.filename?.includes('node_modules')) return

        const { transform = noop } = state.opts as AssetsTransformOpt

        const { node } = importDeclarationAstPath

        const { value } = node.source

        const fileUrl = transform(value) || ''

        if (!fileUrl || fileUrl === value) return

        const [specifier] = node.specifiers

        const assignExpression = template.ast(`const ${specifier.local.name} = '${fileUrl}';`)

        importDeclarationAstPath.replaceWith(assignExpression as Statement)
      }
    }
  }
}
