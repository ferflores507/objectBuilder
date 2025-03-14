import { reducer, ActiveRequest } from "./requestReducer"
import { RequestInitWithUrl, RequestWithUrl } from "./varios"

type Options = {
    requests: [],
    dispatch: (requests: ActiveRequest[]) => any
}

export const reduceRequest = async (request: RequestInitWithUrl, requestId: any, { requests, dispatch } : Options) => {
    
    const actions = reducer(requests, requestId)
    const controller = new AbortController()

    dispatch(actions.requestStarted(controller))

    try {
        // Verify if its ok to add signal in 2nd param object or spread to request
        const response = await fetch(new RequestWithUrl(request), { signal: controller.signal })

        if(!response.ok) {
            throw {
                status: response.status,
                statusText: response.statusText
            }
        }

        dispatch(actions.requestFinished())

        return response.json()
    }
    catch (error) {
        dispatch(actions.requestFailed(error))

        return Promise.reject(error)
    }
}