export class SingletonPromise {
  // 静态属性存放单例
  private static instance?: SingletonPromise

  private promise?: Promise<void>

  private resolve?: () => void

  constructor () {
    this.promise = new Promise<void>(resolve => {
      this.resolve = resolve
    })
  }

  static getInstance () {
    if (!SingletonPromise.instance) {
      SingletonPromise.instance = new SingletonPromise()
    }
    return SingletonPromise.instance
  }

  static wait () {
    return this.getInstance().promise
  }

  static resolve () {
    this.getInstance().resolve?.()
  }
}
