import { SelectSchema, Join, Schema } from "../models"
import { ArrayBuilderBase } from "./ArrayBuilderBase"

export class ArrayMapBuilder extends ArrayBuilderBase {

    build = () => this.items

    withSelect(selectSchema: SelectSchema | undefined) {
        if(selectSchema) {
            const getSelected = (items: any[], value: any) => {
                const index = items.indexOf(value)

                return index > -1 
                    ? items.toSpliced(index, 1) 
                    : [...items, value]
            }

            const { value, max = Infinity, multiple } = selectSchema
            this.items = getSelected(this.items, value)
                .slice(...multiple ? [0, max] : [-1])

            // this.items = (mandatory && tems.length) ? this.items : [value]
        }

        return this
    }

    withMap(schema: Schema | undefined) {
        if(schema) {
            this.items = this.items.map(x => {
                return this.builder.with({ target: x }).withSchema(schema).build()
            })
        }

        return this
    }

    withGroupJoin(join: Join | undefined) {
        if(join) {
            const target = this.builder.with({ schema: join.items }).build()

            this.items = this.items.map(item => {
                const group = this.builder
                    .with({ target, sources: { item } })
                    .withSchema(join.match)
                    .build()

                return { item, group }
            })
        }

        return this
    }
}