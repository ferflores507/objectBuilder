import { getPathValue } from "../helpers/varios"
import type { Schema } from "../models"
import { ResultBuilder } from "./ResultBuilder"
import { ResultBuilderAsync } from "./ResultBuilderAsync"

type BuilderOptions = Partial<{
  target: any
  siblings: Record<string, any>
  stopPropiedades: string[]
  sources: Record<string, any>
}>

export class ObjectBuilder {
  constructor(source: Record<string, any>, options: BuilderOptions = {}) {
    this.source = source
    this.options = options
  }

  private readonly source: Record<string, any>
  readonly options: BuilderOptions
  
  getSource = () => this.source
  getSourcePathValue = (path: string) => getPathValue(this.getSource(), path)
  getInitialTarget = (schema: Schema | undefined) => {
    return schema == null ? null : (this.options?.target ?? this.source)
  }

  withSource(source: Record<string, any>) {
    return this.with({ 
      sources: { ...this.options.sources, ...source }
    })
  }

  with(options: BuilderOptions) {
    const newOptions = { ...this.options, ...options }
    
    return new ObjectBuilder(this.source, newOptions)
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
}