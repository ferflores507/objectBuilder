import { ObjectBuilder, Schema } from "../.."

export const buildResultsAsync = async (builder: ObjectBuilder, schema: Schema) => {
    return [builder.build(schema), await builder.buildAsync(schema)]
}