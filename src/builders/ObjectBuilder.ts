import { getObjPath } from "../helpers/varios"
import type { Schema } from "../models"
import { ResultBuilder } from "./ResultBuilder"
import { ResultBuilderAsync } from "./ResultBuilderAsync"

type BuilderOptions = Partial<{
  siblings: Record<string, any>
}>

export class ObjectBuilder {
  constructor(source: Record<string, any>, target?: any, options?: BuilderOptions) {
    this.source = source
    this.target = target
    this.options = options
  }

  private readonly source: Record<string, any>
  private readonly target: any
  readonly options?: BuilderOptions
  
  getSource = () => this.source
  getSourcePathValue = (path: string) => getObjPath(this.getSource(), path)
  getInitialTarget = (schema: Schema | undefined) => schema == null ? null : (this.target ?? this.source)

  with(options: BuilderOptions) {
    options = { ...this.options, ...options }
    return new ObjectBuilder(this.source, this.target, options)
  }

  build(schema: Schema | undefined) {

    const target = this.getInitialTarget(schema)

    return new ResultBuilder(target, this)
      .build(schema)
  }

  async buildAsync(schema: Schema | undefined, controller: AbortController = new AbortController()) {

    const target = this.getInitialTarget(schema)
    const builder = new ResultBuilderAsync(target, this, controller)

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

    return new ObjectBuilder(source).build(schema)
  }
}