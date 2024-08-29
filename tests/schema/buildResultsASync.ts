import { expect } from "vitest"
import { ObjectBuilder, Schema } from "../.."
import { BuilderOptions } from "../../src/builders/ObjectBuilder"

export const buildResultsAsync = async (builder: ObjectBuilder, schema: Schema) => {
    return [builder.build(schema), await builder.buildAsync(schema)]
}

export type Case = {
    source: Record<string, any>
    schema: Schema
    expected: any
    options?: BuilderOptions
}

export const expectToEqualAsync = async (caseArg: Case) => {
    const { source, schema, expected, options } = caseArg
    const builder = new ObjectBuilder(source, options)
    const results = [builder.build(schema), await builder.buildAsync(schema)]

    expect(results).toEqual([expected, expected])
}