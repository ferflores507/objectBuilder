import { Join, Schema } from "../models"
import { ObjectBuilder } from "./ObjectBuilder"

export class ArrayMapBuilder {
    constructor(items: any[], builder: ObjectBuilder) {
        this.items = items
        this.builder = builder
    }

    items: any[]
    private readonly builder: ObjectBuilder

    build = () => this.items

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

            this.items = this.items.map(inner => {
                // this builder is missing the sibling...
                const group = new ObjectBuilder(inner, { target }).build(join.match)

                return { inner, group }
            })
        }

        return this
    }
}