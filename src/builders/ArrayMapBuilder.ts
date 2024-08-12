import { AddSchema, Join, Schema } from "../models"
import { ObjectBuilder } from "./ObjectBuilder"

export class ArrayMapBuilder {
    constructor(items: any[], builder: ObjectBuilder) {
        this.items = items
        this.builder = builder
    }

    private items: any[]
    private readonly builder: ObjectBuilder

    build = () => this.items

    withAdd(addSchema: AddSchema | undefined) {
        if(addSchema) {
            const { value: valueSchema, max = Infinity, multiple } = addSchema
            const value = this.builder.build(valueSchema)
            const newMax = multiple ? max : 1
            
            this.items = this.items.length < newMax 
                ? [...this.items, value] 
                : this.items
        }

        return this
    }

    withMap(schema: Schema | undefined) {
        if(schema) {
            this.items = this.items.map(x => {
                return this.builder.with({ target: x }).build(schema)
            })
        }

        return this
    }

    withGroupJoin(join: Join | undefined) {
        if(join) {
            const target = this.builder.build(join.items)

            this.items = this.items.map(item => {
                const group = this.builder
                    .with({ target })
                    .withSource({ item })
                    .build(join.match)

                return { item, group }
            })
        }

        return this
    }
}