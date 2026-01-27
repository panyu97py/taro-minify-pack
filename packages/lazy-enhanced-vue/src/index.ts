import { h, defineAsyncComponent, defineComponent, Fragment } from 'vue'
import type { Component, ComponentPublicInstance, AsyncComponentLoader, AsyncComponentOptions } from 'vue'

type Source<T> = AsyncComponentLoader<T> | AsyncComponentOptions<T>

interface Instance {
    new(): ComponentPublicInstance;
}

export const defineAsyncComponentEnhanced = <T extends Component = Instance>(source: Source<T>): T => {
  const loader = (() => {
    const isFunctionSource = typeof source === 'function'
    return isFunctionSource ? source : source.loader
  })()

  const AsyncComponent = defineAsyncComponent(source)

  const SuspenseTrigger = defineComponent({
    name: 'SuspenseTrigger',
    async setup () {
      await loader()
      return () => null
    }
  })

  return defineComponent({
    name: 'AsyncComponentWrapper',
    setup (_, ctx) {
      return () => {
        const suspenseTriggerVNode = h(SuspenseTrigger)
        const asyncComponentVNode = h(AsyncComponent, ctx.attrs, ctx.slots)
        return h(Fragment, [suspenseTriggerVNode, asyncComponentVNode])
      }
    }
  }) as T
}
