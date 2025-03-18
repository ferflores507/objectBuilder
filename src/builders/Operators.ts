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
    formatArraysMerge = (arrays: [any[], any[]], keys?: [string, string] | true) => {

        arrays = this.values(arrays) as [any, any]

        const validateOrThrow = (operator: string, items: any[]) => {
            const firstInvalid = items.find(item => !item.isValid)

            if(firstInvalid) {
                throw {
                    operator,
                    ...firstInvalid
                }
            }
        }

        validateOrThrow("Merge by keys", [
            {
                isValid: arrays.length === 2,
                msg: "Expected an array of 2 elements.",
                value: arrays
            },
            {
                isValid: keys,
                msg: "Expected a 'true' value for keys.",
                value: keys,
            }
        ])

        const concreteKeys = Array.isArray(keys) 
            ? keys 
            : [1, 2].map(_ => typeof keys == "string" ? keys : "id")

        if (concreteKeys.length !== 2) {
            throw {
                operator: "Merge by keys",
                msg: "Expected 2 keys.",
                value: concreteKeys
            }
        }

        return [new Map(), ...concreteKeys] as const
    }
    leftJoin = (arrays: [any[], any[]], keys?: [string, string] | true) => {
        
        const [target, source] = arrays
        const [map, targetKey, sourceKey] = this.formatArraysMerge(arrays, keys)

        source.forEach(item => map.set(item[sourceKey], item))
        
        return target.map(item => ({ ...item, ...map.get(item[targetKey]) }))
    }
    mapObject = {
        transform: (propiedades: Record<string, any>) => ({ propiedades }),
        task: (array: any[], options: Record<string, any>) => {
            const { key, ...rest } = options
            const [name, source] = Object.entries(rest)[0]
            const index = key ?? name
    
            if(index === "$") {
                throw {
                    operator: "merge object",
                    msg: "name can't not be '$' if key is not defined."
                }
            }

            if(Array.isArray(array)) {
                return array.map(item => ({
                    ...item, 
                    ...(name === "$" ? source[item[index]] : { [name]: source[item[index]] })
                }))
            }

            return Object.entries(array).reduce((prev, [key, val]) => {
                return {
                    ...prev,
                    [key]: { ...val, ...(name === "$" ? source[val[index]] : { [name]: source[val[index]] }) } 
                }
            }, {})
        }
    }
    mergeItemsWithSameKey = (array: any[], key = "id") => {
        const map = new Map()
        array.forEach(item => map.set(item[key], { ...map.get(item[key]), ...item }))

        return Array.from(map.values())
    }
    mergeByKeys = (arrays: [any[], any[]], keys?: [string, string] | true) => {
        
        const [array1, array2] = arrays
        const [map, key1, key2] = this.formatArraysMerge(arrays, keys)

        array1.forEach(item => map.set(item[key1], item))
        array2.forEach(item => map.set(item[key2], { ...map.get(item[key2]), ...item }))
        
        return  Array.from(map.values());
    }
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