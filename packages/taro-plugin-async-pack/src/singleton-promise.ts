interface Opt {
  dynamicPackageName: string
  pageRoute: string
}

export class SingletonPromise {
  // 静态属性存放单例
  private static instance?: Map<string, Map<string, SingletonPromise>>

  private promise?: Promise<void>

  private resolve?: () => void

  constructor () {
    this.resetPromise()
  }

  private resetPromise () {
    this.promise = new Promise<void>((resolve) => {
      this.resolve = resolve
    })
  }

  static getInstance (opt: Pick<Opt, 'dynamicPackageName'>) {
    const { dynamicPackageName } = opt
    if (!SingletonPromise.instance) SingletonPromise.instance = new Map()
    if (!SingletonPromise.instance.has(dynamicPackageName)) SingletonPromise.instance.set(dynamicPackageName, new Map())
    return SingletonPromise.instance.get(dynamicPackageName)!
  }

  static wait (opt: Pick<Opt, 'dynamicPackageName'>) {
    const instance = this.getInstance(opt)
    const currentPages = getCurrentPages()
    return Promise.all(currentPages.map(page => {
      if (!instance.has(page.route)) instance.set(page.route, new SingletonPromise())
      return instance.get(page.route)?.promise
    }))
  }

  static loaded (opt: Opt) {
    const { pageRoute } = opt
    const instance = this.getInstance(opt)
    if (!instance.has(pageRoute)) instance.set(pageRoute, new SingletonPromise())
    instance.get(pageRoute)?.resolve?.()
  }

  static unloaded (opt: Opt) {
    const { pageRoute } = opt
    const instance = this.getInstance(opt)
    instance.delete(pageRoute)
  }
}
