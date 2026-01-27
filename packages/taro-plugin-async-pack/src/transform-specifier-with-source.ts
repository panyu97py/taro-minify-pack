import { PluginObj, NodePath, PluginPass } from '@babel/core'
import * as types from '@babel/types'
import { CallExpression, ImportDeclaration, Program, VariableDeclarator } from '@babel/types'
import { normalizeFileName } from './utils'

interface ModuleReference {
    source: string;
    specifier: string;
}

interface Opts {
    original: ModuleReference;
    transformed:ModuleReference
}

interface State extends PluginPass {
    opts: Opts
    namespaces: Set<string>;
    bindings: Set<string>;
}

export default (): PluginObj<State> => {
  return {
    visitor: {
      Program: {
        enter (programPath: NodePath<Program>, state: State) {
          const { filename = '', opts } = state

          if (new RegExp(opts.transformed.source).test(normalizeFileName(filename))) return

          state.namespaces = new Set()

          state.bindings = new Set()

          programPath.traverse({
            ImportDeclaration (path: NodePath<ImportDeclaration>) {
              if (!types.isStringLiteral(path.node.source, { value: opts.original.source })) return

              const { specifiers } = path.node

              specifiers.forEach((spec) => {
                const { name } = spec.local

                //  import namespace from 'source'
                if (types.isImportDefaultSpecifier(spec)) return state.namespaces.add(name)

                //  import * as namespace from 'source'
                if (types.isImportNamespaceSpecifier(spec)) return state.namespaces.add(name)

                // import  { specifier } from 'source'
                if (types.isImportSpecifier(spec) && types.isIdentifier(spec.imported, { name: opts.original.specifier })) {
                  state.bindings.add(name)
                }
              })
            }
          })

          programPath.traverse({
            VariableDeclarator (path: NodePath<VariableDeclarator>) {
              const { id, init } = path.node

              // const alias = namespace.specifier
              if (types.isIdentifier(id)) {
                if (!types.isMemberExpression(init)) return

                if (!types.isIdentifier(init.object)) return

                if (!types.isIdentifier(init.property, { name: opts.original.specifier })) return

                if (!state.namespaces.has(init.object.name)) return

                state.bindings.add(id.name)
              }

              // const { specifier: alias } = namespace;
              if (types.isObjectPattern(id) && types.isIdentifier(init)) {
                const { properties } = id

                if (!state.namespaces.has(init.name)) return

                properties.forEach((prop) => {
                  if (!types.isObjectProperty(prop)) return

                  if (!types.isIdentifier(prop.key, { name: opts.original.specifier })) return

                  if (!types.isIdentifier(prop.value)) return

                  state.bindings.add(prop.value.name)
                })
              }
            }
          })
        },

        exit (programPath: NodePath<Program>, state: State) {
          const { filename = '', opts } = state

          if (new RegExp(opts.transformed.source).test(normalizeFileName(filename))) return

          let needInject = false

          const transformedSpecifierId = programPath.scope.generateUidIdentifier(opts.transformed.specifier)

          programPath.traverse({
            CallExpression (path: NodePath<CallExpression>) {
              const { callee } = path.node

              if (types.isMemberExpression(callee)) {
                if (!types.isIdentifier(callee.object)) return

                if (!state.namespaces.has(callee.object.name)) return

                if (!types.isIdentifier(callee.property, { name: 'lazy' })) return

                path.node.callee = transformedSpecifierId

                needInject = true
              }

              if (types.isIdentifier(callee) && state.bindings.has(callee.name)) {
                path.node.callee = transformedSpecifierId
                needInject = true
              }
            }
          })

          const hasImport = programPath.node.body.some((node) => {
            return types.isImportDeclaration(node) && node.source.value === opts.transformed.source
          })

          if (hasImport || !needInject) return

          const specifier = types.importSpecifier(transformedSpecifierId, types.identifier(opts.transformed.specifier))

          const nodes = types.importDeclaration([specifier], types.stringLiteral(opts.transformed.source))

          programPath.unshiftContainer('body', nodes)
        }
      }
    }
  }
}
