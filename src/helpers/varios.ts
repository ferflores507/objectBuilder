export const getFormData = (source: {}) => {

    const data = new FormData()

    for (const [k, v] of Object.entries(source)) {
        const items = Array.isArray(v) ? v : [v]

        items.forEach(v => data.append(k, v))
    }

    return data
}

export const getValueFromPaths: any = (obj: Record<string, any>, paths: string[] | undefined) => {
    return paths?.reduce((p, c) => p?.[c], obj);
}

export const getPathValue = (obj: {}, path: string | string[] | undefined, separator = ".") => {

    const paths = Array.isArray(path) ? path : path?.toString().split(separator)

    return getValueFromPaths(obj, paths)
}

export const spread = (target: any, source: any) => {
    return Array.isArray(target) ? [...target, ...source] : { ...target, ...source }
}

export const entries = (source: Record<string, any>) => {
    return Object.entries(source).map(([key, value]) => ({ key, value }))
}

export const comparar = (a: any, b: any, method = "equal") => {

    const metodos: Record<string, () => boolean> = {
        equal: () => esIgual(a, b),
        notEqual: () => a !== b,
        greaterThan: () => a > b,
        lessThan: () => a < b
    }

    return metodos[method]()
}

export const ordenar = (objs: any[], orderBy: string) => objs.sort((a, b) => {
    a = getPathValue(a, orderBy)
    b = getPathValue(b, orderBy)

    return (a > b) ? 1 : ((b > a) ? -1 : 0)
})

export const isObject = (value: any) => {
    return typeof value === "object"
        && value !== null
        && !Array.isArray(value)
}

export const flat = (obj: {}) => Object.entries(obj).reduce((p, [k, v]) => {
    const valor: any = isObject(v) ? v : { [k]: v }
    return { ...p, ...valor }
}, {})

const copy = (obj: {}) => JSON.parse(JSON.stringify(obj))

export const tryCopy = (obj: {}) => {
    try {
        return copy(obj)
    }
    catch (e) {
        console.log(e)
        console.error(`No se pudo copiar el valor "${obj}"`, { obj })
    }

    return obj
}

const toArray = (value: any) => Array.isArray(value) ? value : [value]

export const toArrayOrNull = (value: any) => value != null ? toArray(value) : null

const setPathValueFromPaths = (obj: Record<string, any>, path: string[], value: any) => {
    const first = path[0]

    if (path.length === 1) {
        obj[first] = value;
    }
    else if (path.length === 0) {
        throw "No hay paths para actualizar el objeto";
    }
    else {
        obj[first] = obj[first] ?? {}

        return setPathValueFromPaths(obj[first], path.slice(1), value);
    }
};

export const setPathValue = (obj: Record<string, any>, path: string | string[], value: any, separator = ".") => {
    const paths = Array.isArray(path) ? path : path.split(separator)

    return setPathValueFromPaths(obj, paths, value)
};

export const removeNullOrUndefined = (source: {}) => {
    return Object.fromEntries(Object.entries(source).filter(([_, v]) => v != null));
}

export const esIgual = (a: any, b: any) => {
    if (a === undefined && b === undefined) {
        console.warn("Ambos valores a comparar son undefined")
    }
    return JSON.stringify(a) === JSON.stringify(b)
}