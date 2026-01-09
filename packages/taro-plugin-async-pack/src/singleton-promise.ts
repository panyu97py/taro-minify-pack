export class SingletonPromise {
  // 静态属性存放单例
  private static instance?: Record<string, SingletonPromise>

  private loadTimes = 0

  private promise?: Promise<void>

  private resolve?: () => void

  constructor () {
    this.resetPromise()
  }

  static getInstance (key:string) {
    if (!SingletonPromise.instance) SingletonPromise.instance = {}
    if (!SingletonPromise.instance[key]) SingletonPromise.instance[key] = new SingletonPromise()
    return SingletonPromise.instance[key]
  }

  private resetPromise () {
    this.promise = new Promise<void>((resolve) => {
      this.resolve = resolve
    })
  }

  static wait (key:string) {
    return this.getInstance(key).promise
  }

  static loaded (key:string) {
    this.getInstance(key).resolve?.()
    this.getInstance(key).loadTimes += 1
  }

  static unloaded (key:string) {
    this.getInstance(key).loadTimes -= 1
    if (this.getInstance(key).loadTimes > 0) return
    this.getInstance(key).resetPromise()
  }
}
