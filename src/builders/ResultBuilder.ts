import type { Schema } from "../models"
import { ResultBuilderBase, SchemaResultBuilder } from "./ResultBuilderBase"

export class ResultBuilder extends ResultBuilderBase {

    build() {
        return this.getTarget()
    }

    withSchema(schema: Schema | undefined) {

        this.target = new SchemaResultBuilder(this.target)
            .with({
                store: this.builder.getSource(),
                siblings: this.builder.options.siblings ?? {},
                sources: this.builder.options.sources ?? {},
                functions: this.builder.options.functions ?? {}
            })
            .withSchema(schema)
            .build()
        
        return this
    }
}