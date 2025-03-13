import { reducer, Request } from "./requestReducer"

type Options = {
    requests: [],
    dispatch: (requests: Request[]) => any
}

export const reduceRequest = async (request: Promise<any>, requestId: any, { requests, dispatch } : Options) => {
    
    const actions = reducer(requests, requestId)

    dispatch(actions.requestStarted())

    try {
        const result = await request

        dispatch(actions.requestFinished())

        return result
    }
    catch (error) {
        dispatch(actions.requestFailed(error))

        return Promise.reject(error)
    }
}