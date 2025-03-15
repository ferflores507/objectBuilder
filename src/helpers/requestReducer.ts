export type RequestBaseInfo = {
    id: any
    controller: AbortController
}

export type ActiveRequest = RequestBaseInfo & {
    inProgress: boolean
    error: any
}

export const reducer = (state: { requests?: ActiveRequest[] }, newRequest: RequestBaseInfo) => {

    const patch = (value: Partial<ActiveRequest>) => {
        return state.requests?.map(request => request.id === newRequest.id ? { ...request, ...value } : request)
    }

    const requestStarted = () : ActiveRequest[] | undefined => {
        const existingRequest = state.requests?.find(req => req.id === newRequest.id)

        existingRequest?.controller.abort("restarted")

        const patchValue = { ...newRequest, inProgress: true, error: null }

        return existingRequest ? patch(patchValue) : [patchValue, ...state.requests ?? []]
    }

    const requestFinished = () => {
        return state.requests?.filter(request => request.id !== newRequest.id)
    }

    const requestFailed = (error: any) => {
        return error === "restarted" ? state.requests : patch({ inProgress: false, error })
    }

    return {
        requestStarted,
        requestFinished,
        requestFailed
    }
}