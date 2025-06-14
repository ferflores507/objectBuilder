import { Builder, ChildrenSchema, DebounceOptions, DebounceSchema, MapReduceOption, OperatorTask, PatchOptions, Propiedades, RequestInitWithUrl, RequestPlainOptions, Schema, SchemaDefinition, WithTaskOptions } from "../models"
import { reduceRequest, type RequestInfo } from "../helpers/requestHelper"

import {
    argsPair,
    buildRequest,
    createDebounce,
    entries, entry,
    fetchHelper,
    formatSortOptions,
    isObject,
    Path,
    removeAccents,
    sortCompare,
    type SortOptions,
    spread,
    toArray
} from "../helpers/varios"
import { ObjectBuilder } from "./ObjectBuilder"

export class Operators implements WithTaskOptions<Operators> {
    constructor(otherOperators = {}) {
        Object.assign(this, otherOperators)
    }
    useStore = (initial: any, current: any, builder: Builder) => {
        builder.setStore(current)

        return initial
    }
    path = (initial: any, path: string, builder: Builder) => {
        return builder.get(path, initial)
    }
    pathOrReturn = (initial: any, path: string, builder: ObjectBuilder) => {
        return builder.get(path, initial) ?? builder.taskBuilder.tasks.map.clear()
    }
    pathFrom = {
        transform: (schema: any) => ({ path: { path: schema }}),
        task: (initial: any, current: any) => current
    }
    assign: OperatorTask = (current, previous) => Object.assign(current, previous)
    boolean = {
        transform: (schema: any) => schema === true ? { path: "current" } : schema,
        task: (initial: any, current: any) => !!current
    }
    childrenSchema = (childrenSchema: Record<string, ChildrenSchema>, path: string[]) => {
        const schemas: any[] = []
        const push = (val: any, condition = val) => condition && schemas.push(val)

        for (const [i, name] of path.entries()) {
            const next = childrenSchema[name]

            if (!next) {
                schemas.length = 0
                break
            }

            const { setup, schema, children = {} } = next

            push(setup)
            push(schema, i === path.length - 1)

            childrenSchema = children
        }

        return schemas.length ? schemas : null
    }
    date = (value: any, options: Intl.DateTimeFormatOptions & { locale: string }) => {
        return new Date(value).toLocaleString(options.locale, options)
    }
    debounce = (fn: Function, ms: number | true | Function) => {
        if(typeof ms == "function") {
            fn = ms
            ms = true
        }

        return this.debounceWith.task(null, { function: fn, ms })
    }
    debounceWith = {
        transform: ({ function: fn, ms, target, report }: DebounceSchema) => {
            return {
                propiedades: {
                    function: target ? target : { function: fn },
                    ms,
                    report
                }
            }
        },
        task: (initial: any, { function: fn, ms, report }: DebounceOptions) => {
            const obj = createDebounce(fn, typeof ms == "number" ? ms : 500, report)

            return report ? obj : obj.fn
        }
    }
    entries = entries
    spreadStart = (target: any[], value: any) => {
        return Array.isArray(value) ? [...value, ...target] : [value, ...target]
    }
    with = (array: any[], { index = 0, value }: { index?: number, value: any }) => {
        return array.with(index, value)
    }
    patch = (array: any[], value: any) => {
        return this.patchWith.task(array, { key: "id", value })
    }
    patchOrAdd = (array: any[], value: any) => {
        return this.patchWith.task(array, { key: "id", value, checkNotFound: false })
    }
    patchWith = {
        transform: (propiedades: Propiedades) => ({ propiedades }),
        task: (array: any[], options: PatchOptions) => {
            const { 
                key = "id", 
                value, 
                preserver = (value: any) => true,
                replacer = ({ previousValue, newValue }) => ({ ...previousValue, ...newValue }),
                checkNotFound = true
            } = options
    
            const concreteValue = Array.isArray(value) ? value : [value]
            const matchesToFind = [...concreteValue]
            const resultArray = [...array]
    
            for (let i = 0; i < array.length; i++) {
                const index = matchesToFind.findIndex(matchToFind => matchToFind[key] === array[i][key])
    
                if (index !== -1) {
                    resultArray[i] = replacer({ 
                        previousValue: resultArray[i],
                        newValue: matchesToFind[index]
                    })

                    if(!preserver(resultArray[i])) {
                        // resultArray.splice(i, 1) // Doesn't work, it messes up with next matches
                        delete resultArray[i] // make sure to return Object.values to remove gaps
                    }

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
                : Object.values(resultArray)
        }
    }
    unpackAsGetters = (obj: {}, b: string[]) => entry(obj).unpackAsGetters(b)
    spread = (obj: {}, value: any) => spread(obj, value)
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
    request = {
        transform: (propiedades: Propiedades) => ({ propiedades }),
        task: (initial: any, options: RequestPlainOptions) => buildRequest(options)
    }
    reduceFetch = (initial: any, current: any, builder: Builder) => {
        const [requestInit, id] = typeof current === "object"
            ? [current, current.url] 
            : [initial, current]

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
    validate = {
        transform: (schema: SchemaDefinition, builder: Builder) : Schema => {
            const newSchema = Array.isArray(schema)
                ? schema 
                : builder.with({ schema }).build()

            return {
                const: {
                    result: builder.with({ schema: newSchema }).build(),
                    schema: newSchema
                }
            }
        },
        task: (initial: any, { result, schema }: { result: any, schema: SchemaDefinition }) => {
            const [results, schemas] = [result, schema].map(toArray)

            return results.every(Boolean) || schemas.filter((el, i) => !results[i])
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
    mapAsync = {
        transform: (asyncFunction: SchemaDefinition) => ({ asyncFunction }),
        task: (array: any[], callback: () => any) => array.map(callback)
    }
    mapKeyValue = (current: any, initial: any[] | true) => {
        const target: Record<string, any> = initial === true ? current : initial

        return Object.entries(target).map(([key, value]) => ({ key, value }))
    }
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
    mapReduce = {
        transform: (schema: Propiedades[] | Schema) => {
            return Array.isArray(schema)
                ? schema.map((val, ix) => {
                    return ix === 0 
                        ? val 
                        : { 
                            propiedades: {
                                ...val
                            } 
                        }
                })
                : schema
        },
        task: (initial: any, options: [Record<string, any>, ...MapReduceOption[]]) => {
            type GetKeyFn = (key: string, val: any) => any
            
            const getKeyFn = (keyOrFn: string | Function | undefined) => {
                const functions: Record<string, GetKeyFn> = {
                    undefined: key => key,
                    string: (key, val) => val[keyOrFn as string],
                    function: (key, val) => (keyOrFn as Function)({ key, val })
                }

                return functions[typeof keyOrFn]
            }

            const getCurrentItemsMap = (items: Record<string, any>, getKey: GetKeyFn) => {
                const entries = Object
                    .entries(items)
                    .map(([key, val]) => [getKey(key, val), val] as const)

                return new Map(entries)
            }

            const getMatchesMap = (items: Record<string, any>, sourceMap: Map<string, any>, getKey: GetKeyFn, target?: string) => {
                const map = new Map()

                const entries = Object.entries(items).map(([key, val]) => {
                    const result = sourceMap.get(getKey(key, val))
                    const union = { 
                        ...val, 
                        ...(target ? { [target]: result ?? null } : result)
                    }
                    
                    result && map.set(key, union)

                    return [key, union] as const
                })

                return { entries, matchesMap: map }
            }
            
            return options.reduce((leftItems, curr) => {
                const { items, leftKey, key, target } = curr as MapReduceOption // to force types assertions
                
                const map = getCurrentItemsMap(items, getKeyFn(key))
                const matchResult = getMatchesMap(leftItems, map, getKeyFn(leftKey), target)
                
                const { entries: leftEntries, matchesMap } = matchResult

                const results = {
                    left: () => new Map([...leftEntries]),
                    inner: () => matchesMap,
                }
                const result = results.left()
                
                return Array.isArray(leftItems) 
                    ? [...result.values()] 
                    : Object.fromEntries([...result.entries()])
            })
        }

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

            const callback = (item: any) => {
                const value = source[item[index]]

                return { 
                    ...item, 
                    ...(name === "$" ? value : { [name]: value }) 
                }
            }

            return Array.isArray(array) 
                ? array.map(callback) 
                : Object
                    .entries(array)
                    .reduce((prev, [key, val]) => ({ ...prev, [key]: callback(val) }), {})
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
    promiseAll = (initial: any, current: Promise<any>[] | true) => {
        const promises = current === true ? initial as Promise<any>[] : current

        return Promise.all(promises)
    }
    message = (initial: any, path: Path, builder: ObjectBuilder) => {
        // entry with empty object only used to retrieve partial path normalized to array
        const { paths } = entry({}).getWithProperties(path)
        
        return builder.get(["messages", ...paths])
    }
    packWith = (initial: Path, current: any) => {
        return toArray(initial).reduce((prev, curr) => ({ ...prev, [curr]: current}), {})
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
    find = {
        task: (array: [], current: ((item: any) => any) | any[]) => {
            return typeof current == "function"
                ? array.find(current)
                : current.find(Boolean)
        },
        transform: (schema: SchemaDefinition) => {
            return Array.isArray(schema) ? schema : { function: schema }
        }
    }
    unpack = (target: Record<string, any>, keys: string[]) => keys.reduce((obj, key) => {
        return { ...obj, [key]: target[key] }
    }, {})
    UUID = () => crypto.randomUUID()
    map = (items: any[], matchFunction: () => any) => {
        return items.map(matchFunction)
    }
    set = {
        transform: (value: any) => isObject(value) ? { propiedades: value }: value,
        task: (initial: any, value: any, builder: Builder) => {
            const entries = isObject(value) ? Object.entries(value) : [value]
            return entries.forEach(([key, val]) => builder.set(key, val)) 
        }
    }
    setValueOrGetter = {
        transform: (value: any) => isObject(value) ? { propiedades: value } : value,
        task: (initial: any, value: any, builder: Builder) => {
            const [path, arg] = argsPair(value, initial)

            return builder.setValueOrGetter(path, arg)
        }
    }
    log = (initial: any, current: any) => (console.log(current), initial)
}