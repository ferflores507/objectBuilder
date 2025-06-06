import { RequestInitWithUrl, RequestPlainOptions } from "../models"

export const fetchHelper = async (request: RequestInitWithUrl, init?: RequestInit) => {
    // Verify if its ok to add signal in 2nd param object or spread to request
    const response = await fetch(new RequestWithUrl(request), init)

    if (!response.ok) {
        throw {
            status: response.status,
            statusText: response.statusText
        }
    }

    return response.json()
}

export const urlWithCleanQueryString = (url: string, query: Record<string, any>) => {
    const queryString = new URLSearchParams(removeNullOrUndefined(query)).toString()
    
    return url + (queryString && "?") + queryString
}

export class RequestWithUrl extends Request {
    constructor(input: RequestInitWithUrl) {
        super(input.url, input)
    }
}

const findFirstAndFormat = (items: [any, (val: any) => any][]) => {
    return items.find(([val, format]) => val && format(val))
}

export const buildRequest = (options: RequestPlainOptions) : RequestInitWithUrl => {
    const {
        url,
        method = "GET",
        headers = {},
        query = {},
        body,
        formData
    } = options

    return {
        url: urlWithCleanQueryString(url, query),
        method,
        headers: {
            ...((formData || method === "GET") ? {} : { "content-type": "application/json" }),
            ...headers
        },
        body: findFirstAndFormat([
            [body, JSON.stringify],
            [formData, getFormData]
        ])
    }
}

export const isEmpty = (value: string | Record<string, any> | any[]) => {
    const type = Array.isArray(value) ? "array" : (value != null ? typeof value : "null")
    let result = false

    switch (type) {
        case "null":
            result = true
            break
        case "string":
        case "array":
            result = !value.length
            break
        case "object":
            result = !Object.keys(value).length
    }

    return result
}

const argsPairFn = () => {
    const options = {
        string: (value: string, rightValue: any) : [string, any] => [value, rightValue],
        object: (value: Record<string, any>) => Object.entries(value)[0],
        array: (value: [string, any]) => value
    }

    return (leftValue: any, rightValue: any) => {
        const type = (Array.isArray(leftValue) ? "array" : typeof leftValue) as keyof typeof options

        return options[type](leftValue, rightValue)
    }
}

export const argsPair = argsPairFn()

export const createDebounce = (callback: Function, ms: number, reportStatus = false) => {
    let timeoutId: NodeJS.Timeout

    return {
        pending: false,
        fn: function (...args: any[]) {
            reportStatus && (this.pending = true)
            clearTimeout(timeoutId)
            
            timeoutId = setTimeout(() => {
                callback(...args)
                reportStatus && (this.pending = false)
            }, ms)
        }
    }
}

type ConcreteSortOptions = {
    path: string | undefined
    descending: boolean | undefined
    compareFn: (a: any, b: any) => number
}

export type SortOptions = string | {
    path?: string
    descending?: boolean
    type?: "numeric" | "string"
}

const compareOptions: Record<string, (a: any, b: any) => number> = {
    boolean: (a, b) => Number(!!a) - Number(!!b),
    numeric: (a, b) => Number(a ?? 0) - Number(b ?? 0),
    string: (a, b) => (a ? String(a) : "").localeCompare(b || "")
}

export const formatSortOptions = (options: SortOptions) : ConcreteSortOptions => {
    const { path, descending, type = "string" } = typeof options == "object"
        ? options
        : { path: options }

    if(path && typeof path != "string") {
        throw {
            msg: "El path definido para las opciones de ordenamiento no es de tipo texto",
            path
        }
    }
    
    return {
        path,
        descending,
        compareFn: compareOptions[type]
    }
}

export const sortCompare = (a: any, b: any, options: ConcreteSortOptions) => {
    const { path, descending, compareFn } = options
    const values = (descending ? [b, a] : [a, b])
    const [newA, newB] = values.map(obj => path ? entry(obj).get(path) : obj)
    
    return compareFn(newA, newB)
}

export const splitAccents = (str: string) => str.normalize("NFD")

export const removeAccents = (str: string) => {
    return splitAccents(str).replace(/[\u0300-\u036f]/g, "")
}

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

type Set = (obj: Record<string, any>, key: string) => any

const setPathValueFromPaths = (obj: Record<string, any>, path: string[], set: Set) => {
    const { length } = path

    if(length === 0) {
        throw "No hay paths para actualizar el objeto";
    }
    
    for(let i = 0; i < length; i++) {
        const key = path[i]
        
        if(i === length - 1) {
            set(obj, key)
        }
        else {
            obj[key] ??= {}
            obj = obj[key]
        }
    }
}

export type Path = string | string[]

class Entry {
    constructor(private source: Record<string, any>) {
        source ?? (() => { throw "source object is null or undefined" })()
    }

    paths: string[] = []
    private separator = "."

    with(path: Path) {
        this.paths = Array.isArray(path) ? path : path.split(this.separator)

        return this
    }

    withSeparator(separator: string) {
        this.separator = separator ?? this.separator
    }

    get(callback = (prev: any, curr: any) => prev?.[curr], initial = this.source) {
        return this.paths.reduce(callback, initial)
    }

    set(value: unknown) {
        return setPathValueFromPaths(this.source, this.paths, (obj, key) => obj[key] = value)
    }

    setValueOrGetter(valueOrFn: any) {
        const set: Set = typeof valueOrFn == "function"
            ? (obj, key) => assignAll(obj, { get [key]() { return valueOrFn() } })
            : (obj, key) => obj[key] = valueOrFn

        return setPathValueFromPaths(this.source, this.paths, set)
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
        setValueOrGetter(path: Path, value: any) {
            return entry.with(path).setValueOrGetter(value)
        },
        unpackAsGetters(keys: string[] = Object.getOwnPropertyNames(obj)) {
            return assignAll({}, ...keys.map(key => ({ get [key]() { return obj[key] } })))
        }
    }
}

export const assignAll = (target: any, ...source: any[]) => {
    source.filter(obj => typeof obj !== "undefined")
        .forEach(obj => {
            Object.defineProperties(target, Object.getOwnPropertyDescriptors(obj));
        })
    return target;
};

export const getterTrap = <T extends Record<string, any>>(defaultSource: T, ...sources: T[]) => {
    return new Proxy({} as T, {
        get: (target, prop: string) => {
            const source = sources.find(s => prop in s) ?? defaultSource

            return source[prop]
        }
    })
}

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

export const isNotPrimitive = <T>(value: T) => {
    return typeof value === "object" && value != null
}

export const isObject = (value: any) => {
    return isNotPrimitive(value) && !Array.isArray(value)
}

export const flat = (obj: Record<string, any>) => Object.entries(obj).reduce((p, [k, v]) => {
    const valor = isObject(v) ? v : { [k]: v }
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

export const toArray = <T>(value: T | T[]) => Array.isArray(value) ? value : [value]

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

    return typeof (b) != "object" || b == null
        ? a == b
        : JSON.stringify(a) === JSON.stringify(b)
}