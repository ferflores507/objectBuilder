import type { ArraySchema } from "../models";
import { ArrayResultBuilder } from "./ArrayResultBuilder";
import { ObjectBuilder } from "./ObjectBuilder";

export class ArrayBuilder {

    constructor(target: [], builder: ObjectBuilder) {
        this.target = target
        this.builder = builder
    }

    target: any[]
    builder: ObjectBuilder

    validar(schema: ArraySchema | undefined) {
        const { filter, find, items, contains, map, groupJoin } = schema ?? {}

        const isEmpty = [filter, find, items, contains, map, groupJoin].every(x => x == null)
        const isArray = Array.isArray(this.target)

        return isArray || isEmpty
    }

    build(schema: ArraySchema | undefined) {
        if(this.validar(schema) == false) {
            throw "El elemento debe ser de tipo arreglo."
        }

        return new ArrayResultBuilder(this.target, this.builder)
            .withSchema(schema)
            .build()
    }
}