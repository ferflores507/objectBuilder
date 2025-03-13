export type ActiveRequest = {
    id: any
    controller: AbortController
    inProgress: boolean
    error: any
}

export const reducer = (requests: ActiveRequest[], requestId: any) => {

    const patch = (value: Partial<ActiveRequest>) => {
        return requests.map(request => request.id === value.id ? { ...request, ...value } : request)
    }

    const requestStarted = (controller: AbortController) => {
        const existingRequest = requests.find(req => req.id === requestId)

        existingRequest?.controller.abort("restarted")

        const patchValue = { controller, inProgress: true, error: null }

        return existingRequest
            ? patch(patchValue)
            : [{ id: requestId, ...patchValue }, ...requests]
    }

    const requestFinished = () => {
        return requests.filter(request => request.id !== requestId)
    }

    const requestFailed = (error: any) => {
        return error === "restarted" ? requests : patch({ inProgress: false, error })
    }

    return {
        requestStarted,
        requestFinished,
        requestFailed
    }
}