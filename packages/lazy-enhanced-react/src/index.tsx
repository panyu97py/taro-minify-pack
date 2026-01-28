import React, {
  ComponentPropsWithoutRef,
  ComponentRef,
  ComponentType,
  ForwardRefExoticComponent,
  useEffect
} from 'react'

enum Status {
    Uninitialized = 'uninitialized',
    Pending = 'pending',
    Resolved = 'resolved',
    Rejected = 'rejected',
}

interface Result<T> {
    default: T;
}

interface LoadData<T> {
    status: Status;
    result?: T | Error;
    promise?: Promise<void>;
}

type Factory<T extends ComponentType<any>> = () => Promise<Result<T>>;

export const lazyEnhanced = <T extends ComponentType<any>>(factory: Factory<T>) => {
  const LazyComponent = React.lazy(factory) as ForwardRefExoticComponent<any>
  const loadData: LoadData<T> = { status: Status.Uninitialized }

  const load = () => {
    if (loadData.status !== Status.Uninitialized) return
    const successCallback = (res: Result<T>) => {
      loadData.status = Status.Resolved
      loadData.result = res.default
    }
    const errorCallback = (err: Error) => {
      loadData.status = Status.Rejected
      loadData.result = err
    }
    loadData.promise = factory().then(successCallback, errorCallback)
    loadData.status = Status.Pending
  }

  const resetLoadData = () => {
    loadData.status = Status.Uninitialized
    loadData.result = undefined
    loadData.promise = undefined
  }

  return React.forwardRef<ComponentRef<T>, ComponentPropsWithoutRef<T>>((props, ref) => {
    if (loadData.status === Status.Uninitialized) load()

    if (loadData.status === Status.Pending) throw loadData.promise

    if (loadData.status === Status.Rejected) throw loadData.result

    useEffect(() => {
      return resetLoadData()
    }, [])

    return <LazyComponent {...props} ref={ref} />
  })
}
