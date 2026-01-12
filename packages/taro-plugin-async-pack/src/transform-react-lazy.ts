import { PluginObj, NodePath, PluginPass } from '@babel/core'
import * as types from '@babel/types'
import { CallExpression, ImportDeclaration, Program, VariableDeclarator } from '@babel/types'
import { normalizeFileName } from './utils'

const customLazySource = '@taro-minify-pack/react-lazy-enhanced'

interface State extends PluginPass {
  reactNamespaces: Set<string>;
  reactLazyBindings: Set<string>;
}

export default (): PluginObj<State> => {
  return {
    visitor: {
      Program: {
        enter (programPath: NodePath<Program>, state: State) {
          const { filename = '' } = state

          if (new RegExp(customLazySource).test(normalizeFileName(filename))) return

          state.reactNamespaces = new Set()

          state.reactLazyBindings = new Set()

          programPath.traverse({
            ImportDeclaration (path: NodePath<ImportDeclaration>) {
              if (!types.isStringLiteral(path.node.source, { value: 'react' })) return

              const { specifiers } = path.node

              specifiers.forEach((spec) => {
                const { name } = spec.local

                //  import React from 'react'
                if (types.isImportDefaultSpecifier(spec)) return state.reactNamespaces.add(name)

                //  import * as React from 'react'
                if (types.isImportNamespaceSpecifier(spec)) return state.reactNamespaces.add(name)

                // import  { lazy } from 'react'
                if (types.isImportSpecifier(spec) && types.isIdentifier(spec.imported, { name: 'lazy' })) {
                  state.reactLazyBindings.add(name)
                }
              })
            }
          })

          programPath.traverse({
            VariableDeclarator (path: NodePath<VariableDeclarator>) {
              const { id, init } = path.node

              // const a = React.lazy
              if (types.isIdentifier(id)) {
                if (!types.isMemberExpression(init)) return

                if (!types.isIdentifier(init.object)) return

                if (!types.isIdentifier(init.property, { name: 'lazy' })) return

                if (!state.reactNamespaces.has(init.object.name)) return

                state.reactLazyBindings.add(id.name)
              }

              // const { lazy: a } = React;
              if (types.isObjectPattern(id) && types.isIdentifier(init)) {
                const { properties } = id

                if (!state.reactNamespaces.has(init.name)) return

                properties.forEach((prop) => {
                  if (!types.isObjectProperty(prop)) return

                  if (!types.isIdentifier(prop.key, { name: 'lazy' })) return

                  if (!types.isIdentifier(prop.value)) return

                  state.reactLazyBindings.add(prop.value.name)
                })
              }
            }
          })
        },

        exit (programPath: NodePath<Program>, state: State) {
          const { filename = '' } = state

          if (new RegExp(customLazySource).test(normalizeFileName(filename))) return

          let needInject = false

          const customLazyId = programPath.scope.generateUidIdentifier('customLazy')

          programPath.traverse({
            CallExpression (path: NodePath<CallExpression>) {
              const { callee } = path.node

              if (types.isMemberExpression(callee)) {
                if (!types.isIdentifier(callee.object)) return

                if (!state.reactNamespaces.has(callee.object.name)) return

                if (!types.isIdentifier(callee.property, { name: 'lazy' })) return

                path.node.callee = customLazyId

                needInject = true
              }

              if (types.isIdentifier(callee) && state.reactLazyBindings.has(callee.name)) {
                path.node.callee = customLazyId
                needInject = true
              }
            }
          })

          const hasImport = programPath.node.body.some((node) => {
            return types.isImportDeclaration(node) && node.source.value === customLazySource
          })

          if (hasImport || !needInject) return

          const specifier = types.importSpecifier(customLazyId, types.identifier('lazy'))

          const nodes = types.importDeclaration([specifier], types.stringLiteral(customLazySource))

          programPath.unshiftContainer('body', nodes)
        }
      }
    }
  }
}
