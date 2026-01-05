export class SingletonPromise {
  // 静态属性存放单例
  private static instance?: Record<string, SingletonPromise>

  private promise?: Promise<void>

  private resolve?: () => void

  constructor () {
    this.promise = new Promise<void>(resolve => {
      this.resolve = resolve
    })
  }

  static getInstance (key:string) {
    if (!SingletonPromise.instance) SingletonPromise.instance = {}
    if (!SingletonPromise.instance[key]) SingletonPromise.instance[key] = new SingletonPromise()
    return SingletonPromise.instance[key]
  }

  static wait (key:string) {
    return this.getInstance(key).promise
  }

  static resolve (key:string) {
    this.getInstance(key).resolve?.()
  }
}
