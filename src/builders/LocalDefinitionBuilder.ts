import { getObjPath } from "../helpers/varios"
import type { Schema } from "../models"
import { ResultBuilderLocal } from "./ResultBuilderLocal"
import { ResultBuilderWithAsync } from "./ResultBuilderWithAsync"

export class LocalDefinitionBuilder {
  constructor(source: Record<string, any>, target?: any) {
    this.source = source
    this.target = target
  }

  private readonly source: Record<string, any>
  private readonly target: any
  
  getSource = () => this.source
  getSourcePathValue = (path: string) => getObjPath(this.getSource(), path)
  getInitialTarget = (schema: Schema | undefined) => schema == null ? null : (this.target ?? this.source)

  withTarget(value: any) {
    return new LocalDefinitionBuilder(this.source, value)
  }

  build(schema: Schema | undefined) {

    const target = this.getInitialTarget(schema)

    return new ResultBuilderLocal(target, this)
      .build(schema)
  }

  async buildAsync(schema: Schema | undefined, controller: AbortController = new AbortController()) {

    const target = this.getInitialTarget(schema)
    const builder = new ResultBuilderWithAsync(target, this, controller)

    try {
      const resultado = await builder.buildAsync(schema)

      return resultado
    }
    catch (e) {
      console.log("error al esperar promise:", e)
    }

  }

  buildWithOptions(schema: Schema | undefined) {

    const controller = new AbortController()

    return {
      response: this.buildAsync(schema, controller),
      cancel: () => controller.abort("cancel")
    }
  }

  buildWithOuter(inner: any, schema: Schema | undefined) {
    const source = { inner, outer: this.getSource() }

    return new LocalDefinitionBuilder(source).build(schema)
  }
}