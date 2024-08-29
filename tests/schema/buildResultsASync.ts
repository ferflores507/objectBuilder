import { expect } from "vitest"
import { ObjectBuilder, Schema } from "../.."
import { BuilderOptions } from "../../src/builders/ObjectBuilder"

export const buildResultsAsync = async (caseArg: CaseBase) => {
    const { source, schema, options } = caseArg
    const builder = new ObjectBuilder(source, options)

    return [builder.build(schema), await builder.buildAsync(schema)]
}

export type CaseBase = {
    source: Record<string, any>
    schema: Schema
    options?: BuilderOptions
}

export type Case = { expected: any } & CaseBase

export const expectToEqualAsync = async (caseArg: Case) => {
    const { expected } = caseArg
    const results = await buildResultsAsync(caseArg)

    expect(results).toEqual([expected, expected])
}