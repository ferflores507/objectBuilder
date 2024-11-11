import * as varios from "../helpers/varios"

export class ObjectValueStore {
    constructor(private data: Record<string, any> | undefined) {
    }

    values = new Map()

    import(key: string | undefined, value: any) {

        if(!key) {
            throw "El path no esta definido"
        }

        this.values.set(key, value)

        return value
    }

    get(path?: string | string[]) {
        return path 
            ? varios.getPathValue(this.data, path)
            : this.data
    }

    export(path: string) {
        return { 
            value: this.values.get(path), 
            hasValue: this.values.has(path) }
    }
}