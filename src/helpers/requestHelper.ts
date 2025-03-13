import { reducer, ActiveRequest } from "./requestReducer"

type Options = {
    requests: [],
    dispatch: (requests: ActiveRequest[]) => any
}

export const reduceRequest = async (request: Request, requestId: any, { requests, dispatch } : Options) => {
    
    const actions = reducer(requests, requestId)
    const controller = new AbortController()

    dispatch(actions.requestStarted(controller))

    try {
        const result = await fetch(request, { signal: controller.signal })

        dispatch(actions.requestFinished())

        return result
    }
    catch (error) {
        dispatch(actions.requestFailed(error))

        return Promise.reject(error)
    }
}