export type Request = {
    id: any
    inProgress: boolean
    error: any
}

export const reducer = (requests: Request[], requestId: any) => {

    const patch = (value: Partial<Request>) => {
        return requests.map(request => request.id === value.id ? { ...request, ...value } : request)
    }

    const requestStarted = () => {
        const existingRequest = requests.find(req => req.id === requestId)
        const patchValue = { inProgress: true, error: null }

        return existingRequest
            ? patch(patchValue)
            : [{ id: requestId, ...patchValue }, ...requests]
    }

    const requestFinished = () => {
        return requests.filter(request => request.id !== requestId)
    }

    const requestFailed = (error: any) => {
        return patch({ inProgress: false, error })
    }

    return {
        requestStarted,
        requestFinished,
        requestFailed
    }
}