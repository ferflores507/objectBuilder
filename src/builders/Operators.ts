import { Builder, OperatorTask, Propiedades, WithTaskOptions } from "../models"
import { reduceRequest, type RequestInfo } from "../helpers/requestHelper"

import {
    argsPair,
    buildRequest,
    createDebounce,
    entries, entry,
    fetchHelper,
    formatSortOptions,
    Path,
    removeAccents,
    RequestInitWithUrl,
    type RequestPlainOptions,
    sortCompare,
    type SortOptions,
    spread,
    toArray
} from "../helpers/varios"

type PatchOptions = { 
    key?: string
    value: any 
    transform?: (options: { previousValue: any, newValue: any }) => any
    checkNotFound?: boolean
}

export class Operators implements WithTaskOptions<Operators> {
    constructor(otherOperators = {}) {
        Object.assign(this, otherOperators)
    }
    assign: OperatorTask = (current, previous) => Object.assign(current, previous)
    boolean = (value: any) => !!value
    date = (value: any, options: Intl.DateTimeFormatOptions & { locale: string }) => {
        return new Date(value).toLocaleString(options.locale, options)
    }
    debounce = (fn: (...args: []) => any, ms: number | true) => {
        return createDebounce(fn, ms === true ? 500 : ms)
    }
    entries = entries
    spreadStart = (target: any[], value: any) => {
        return Array.isArray(value) ? [...value, ...target] : [value, ...target]
    }
    with = (array: any[], { index = 0, value }: { index?: number, value: any }) => {
        return array.with(index, value)
    }
    patch = (array: any[], value: any) => {
        return this.patchWith(array, { key: "id", value })
    }
    patchOrAdd = (array: any[], value: any) => {
        return this.patchWith(array, { key: "id", value, checkNotFound: false })
    }
    patchWith = (array: any[], options: PatchOptions) => {
        const { 
            key = "id", 
            value, 
            transform = ({ previousValue, newValue }) => ({ ...previousValue, ...newValue }),
            checkNotFound = true
        } = options

        const concreteValue = Array.isArray(value) ? value : [value]
        const matchesToFind = [...concreteValue]
        const resultArray = [...array]

        for (let i = 0; i < array.length; i++) {
            const index = matchesToFind.findIndex(matchToFind => matchToFind[key] === array[i][key])

            if (index !== -1) {
                resultArray[i] = transform({ 
                    previousValue: resultArray[i],
                    newValue: matchesToFind[index]
                })
                matchesToFind.splice(index, 1)

                if (!matchesToFind.length) {
                    break
                }
            }
        }

        if (matchesToFind.length && checkNotFound) {
            throw {
                msg: `Unable to patch. One or more items were not found.`,
                array,
                itemsNotFound: matchesToFind
            }
        }

        return matchesToFind.length 
            ? [...resultArray, ...matchesToFind]
            : resultArray
    }
    unpackAsGetters = (obj: {}, b: string[]) => entry(obj).unpackAsGetters(b)
    spread = (obj: {}, value: true | {}) => {
        return value === true
            ? { ...obj }
            : spread(obj, value)
    }
    spreadFlat = (a: any, b: any[]) => this.spread(a, b.flat())
    propiedadesFunction = {
        transform: (propiedades: Propiedades) => {
            const target = { ...propiedades }

            for(const key in target) {
                target[key] = { function: target[key] }
            }

            return { propiedades: target }
        },
        task: (initial: Record<string, any>, current: Record<string, any>) => current
    }
    request = (initial: any, options: RequestPlainOptions) => {
        return buildRequest(options)
    }
    reduceFetch = (requestInit: RequestInitWithUrl, id: any, builder: Builder) => {
        const requestInfo: RequestInfo = {
            id,
            controller: new AbortController(),
            promise() { 
                return fetchHelper(requestInit, { signal: this.controller.signal }) 
            }
        }

        const { store } = builder.options

        return reduceRequest(requestInfo, { 
            state: store, 
            dispatch: (requests) => store.requests = requests
        })
    }
    formatPropiedades = (source: Record<string, any>, formatter: Record<string, Function>) => {
        const target = { ...source }

        for(const key in formatter) {
            const arg = { source, target, current: source[key] }
            target[key] = formatter[key](arg, { initial: arg.current })
        }

        return target
    }
    filterPropiedades = {
        transform: (schema: any) => ({ function: schema }),
        task: (propiedades: Record<string, any>, filterFn: Function) => {
            const filteredEntries = Object
                .entries(propiedades)
                .filter(([key, value]) => filterFn({ key, value }, { initial: value }))
    
            return Object.fromEntries(filteredEntries)
        }
    }
    join = {
        task: (source: [], separator: any) => source.join(separator),
        transform: (schema: any) => schema === true ? "" : schema
    }
    keywords = (value: string) => {
        return value
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map(word => this.removeAccents(word).toLowerCase())
    }
    keywordsOrDefault = (value: Path) => Array.isArray(value) ? value : this.keywords(value)
    plus = (a: number, b: number) => a + b
    minus = (a: number, b: number) => a - b
    times = (a: number, b: number) => a * b
    dividedBy = (a: number, b: number) => a / b
    parse = (text: string) => JSON.parse(text)
    prepend = (target: any, value: any) => value.toString() + target.toString()
    trim = (value: string) => value.trim()
    removeAccents = removeAccents
    stringify = (value: any) => JSON.stringify(value)
    sort = (array: any[], option: true | "descending" = true) => {
        return this.sortBy(array, { descending: option === "descending" })
    }
    sortBy = (array: any[], options: SortOptions | SortOptions[]) => {
        const concreteOptions = toArray(options).map(formatSortOptions)

        return array.toSorted((a, b) => {
            let result = 0

            for (const option of concreteOptions) {
                result = sortCompare(a, b, option)

                if (result !== 0) break
            }

            return result
        })
    }
    values = (obj: any[]) => {
        try {
            return Array.isArray(obj) ? obj : Object.values(obj)
        }
        catch {
            throw {
                mensaje: "Error al obtener los valores enumerables",
                fuente: obj
            }
        }
    }
    unpack = (target: Record<string, any>, keys: string[]) => keys.reduce((obj, key) => {
        return { ...obj, [key]: target[key] }
    }, {})
    UUID = () => crypto.randomUUID()
    set: OperatorTask = (initial, value, builder) => {
        const [path, arg] = argsPair(value, initial)

        return builder.set(path, arg)
    }
    log = (initial: any, current: any) => (console.log(current), initial)
}