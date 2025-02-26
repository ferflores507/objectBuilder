import { OperatorTask } from "../models"

import {
    argsPair,
    createDebounce,
    entries, entry,
    formatSortOptions,
    Path,
    removeAccents,
    sortCompare,
    type SortOptions,
    spread,
    toArray
} from "../helpers/varios"

export class Operators {
    constructor(otherOperators = {}) {
        Object.assign(this, otherOperators)
    }
    assign: OperatorTask = (current, previous) => Object.assign(current, previous)
    boolean = (value: any) => !!value
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
    patchWith = (array: any[], { key = "id", value }: { key?: string, value: any }) => {
        const concreteValue = Array.isArray(value) ? value : [value]
        const matchesToFind = [...concreteValue]
        const resultArray = [...array]

        for (let i = 0; i <= array.length; i++) {
            const index = matchesToFind.findIndex(matchToFind => matchToFind[key] === array[i][key])

            if (index !== -1) {
                resultArray[i] = { ...resultArray[i], ...matchesToFind[index] }
                matchesToFind.splice(index, 1)

                if (!matchesToFind.length) {
                    break
                }
            }
        }

        if (matchesToFind.length) {
            throw {
                msg: `Unable to patch. One or more items were not found.`,
                array,
                itemsNotFound: matchesToFind
            }
        }

        return resultArray
    }
    unpackAsGetters = (obj: {}, b: string[]) => entry(obj).unpackAsGetters(b)
    spread = spread
    spreadFlat = (a: any, b: any[]) => this.spread(a, b.flat())
    join = {
        task: (source: [], separator: any) => source.join(separator),
        transform: (schema: any) => schema === true ? "" : schema
    }
    keywords = (value: string) => {
        return value
            .trim()
            .split(/\s+/)
            .map(word => this.removeAccents(word).toLowerCase())
    }
    keywordsOrDefault = (value: Path) => Array.isArray(value) ? value : this.keywords(value)
    plus = (a: number, b: number) => a + b
    minus = (a: number, b: number) => a - b
    times = (a: number, b: number) => a * b
    dividedBy = (a: number, b: number) => a / b
    parse = JSON.parse
    trim = (value: string) => value.trim()
    removeAccents = removeAccents
    stringify = JSON.stringify
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