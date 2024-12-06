export function toShift<T> (items: T[]) : [T, T[]] {
    return [
        items[0],
        items.slice(1)
    ]
}

export const toTitleCase = (value: string) => value[0].toUpperCase() + value.slice(1)

export function partition<T>(items: T[], pass: (item: T) => boolean | undefined) {

    const passed: T[] = []
    const failed: T[] = []

    for (const item of items) {
        (pass(item) ? passed : failed).push(item)
    }

    return [
        passed,
        failed
    ]
}

export const getFormData = (source: {}) => {

    const data = new FormData()

    for (const [k, v] of Object.entries(source)) {
        const items = Array.isArray(v) ? v : [v]

        items.forEach(v => data.append(k, v))
    }

    return data
}

const getPaths = (path: string | string[], separator = ".") => {
    return Array.isArray(path) ? path : path.split(separator)
}

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

type Path = string | string[]

class Entry {
    constructor(private source: Record<string, any>) {
        source ?? (() => { throw "source object is null or undefined" })()
    }

    paths: string[] = []
    private separator = "."

    with(path: Path) {
        this.paths = getPaths(path, this.separator)

        return this
    }

    withSeparator(separator: string) {
        this.separator = separator
    }

    get(callback = (prev: any, curr: any) => prev?.[curr], initial = this.source) {
        return this.paths.reduce(callback, initial)
    }

    set(value: any) {
        return setPathValueFromPaths(this.source, this.paths, value)
    }
}

export const entry = (obj: Record<string, any>) => {
    const entry = new Entry(obj)

    return {
        withPathSeparator(separator: string){
            entry.withSeparator(separator)

            return this
        },
        get(path: Path) {
            const { container, value } = this.getWithProperties(path)
            
            return typeof(value) == "function" ? value.bind(container) : value
        },
        getWithProperties(path: Path){
            const value = entry.with(path).get(({ value }, path) => {
                return {
                    container: value,
                    value: value?.[path],
                }
            }, { container: obj, value: obj })

            return Object.assign(value, { paths: entry.paths })
        },
        set(path: Path, value: any) {
            return entry.with(path).set(value)
        },
    }
}

export const assignAll = (target: any, ...source: any[]) => {
    source.filter(obj => typeof obj !== "undefined")
        .forEach(obj => {
            Object.defineProperties(target, Object.getOwnPropertyDescriptors(obj));
        })
    return target;
};

export const spreadArray = (target: any[], source: any) => {
    return Array.isArray(source) ? [...target, ...source] : [...target, source]
}

export const spreadObject = (target: Record<string, any> | undefined, source: any) => {
    return Array.isArray(source) 
        ? source.reduce((prev, curr) => ({ ...prev, ...curr }), target) 
        : { ...target, ...source }
}

export const spread = (target: any, source: any) => {
    return Array.isArray(target) ? spreadArray(target, source) : spreadObject(target, source)
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
    a = entry(a).get(orderBy)
    b = entry(b).get(orderBy)

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

export const removeNullOrUndefined = (source: {}) => {
    return Object.fromEntries(entriesWithValues(source));
}

export const entriesWithValues = (source: { [k: string]: any }) => {
    return Object.entries(source).filter(([k, v]) => v != null)
}

export const esIgual = (a: any, b: any) => {
    if (a === undefined && b === undefined) {
        console.warn("Ambos valores a comparar son undefined")
    }
    return JSON.stringify(a) === JSON.stringify(b)
}