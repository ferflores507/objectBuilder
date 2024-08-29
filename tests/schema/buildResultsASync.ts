import { expect } from "vitest"
import { ObjectBuilder, Schema } from "../.."

export const buildResultsAsync = async (builder: ObjectBuilder, schema: Schema) => {
    return [builder.build(schema), await builder.buildAsync(schema)]
}

export type Case = {
    source: Record<string, any>
    schema: Schema
    expected: any
}

export const expectToEqualAsync = async (caseArg: Case) => {
    const { source, schema, expected } = caseArg
    const results = await buildResultsAsync(new ObjectBuilder(source), schema)

    expect(results).toEqual([expected, expected])
}