import { reducer, type RequestBaseInfo, type ActiveRequest } from "./requestReducer"

export type RequestInfo = RequestBaseInfo & {
    promise: () => Promise<any>
}

type Options = {
    state: any,
    dispatch: (requests: ActiveRequest[]) => any
}

export const reduceRequest = async (requestInfo: RequestInfo, { state, dispatch } : Options) => {
    
    const actions = reducer(state, requestInfo)

    dispatch(actions.requestStarted())

    try {
        const result = await requestInfo.promise()

        dispatch(actions.requestFinished())

        return result
    }
    catch (error) {
        dispatch(actions.requestFailed(error))

        return Promise.reject(error)
    }
}