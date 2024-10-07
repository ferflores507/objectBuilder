import { ObjectBuilder } from "./src/builders/ObjectBuilder"
import { SchemaTaskResultBuilder } from "./src/builders/SchemaTaskResultBuilder"
import type { Schema } from "./src/models"

const sayHi = () => console.log("Hi, this is my first package")

export {
    ObjectBuilder,
    SchemaTaskResultBuilder,
    Schema,
    sayHi
}