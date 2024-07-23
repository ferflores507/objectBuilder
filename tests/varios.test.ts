import { expect, describe, test } from 'vitest';
import { LocalDefinitionBuilder } from '../src/builders/LocalDefinitionBuilder';
import * as varios from '../src/helpers/varios';
import { Schema } from '../src/models';
import { ResultBuilderLocal } from '../src/builders/ResultBuilderLocal';

test("class with method destructure", () => {
    class Form {
        id = 0
        
        updateId = () => {
            this.id++
        }
        
        getId = () => {
            return this.id
        }

        build = () => {
            return {
                set: (value: number) => this.id = value
            }
        }
    }

    const { getId, build }= new Form()
    const { set } = build()
    const value = 7

    set(value)

    expect(getId()).toBe(value)
})

test("class destructure", () => {
    class Form {
        id = 0
        
        updateId = () => {
            this.id++
        }
        
        getId = () => {
            return this.id
        }
    }

    const { updateId, getId }= new Form()

    updateId()

    expect(getId()).toBe(1)
})

test("function destructure with new", () => {
    function Form() {
        this.id = 0
        this.updateId = () => {
            this.id++
        }
        this.getId = () => {
            return this.id
        }
    }

    const { updateId, getId } = new Form()
    const form2 = new Form()
    form2.updateId()
    form2.updateId()

    updateId()

    expect(getId()).toBe(1)
    expect(form2.getId()).toBe(2)
})

describe("spread", () => {
    test("en result builder solamente", async () => {
        const source = { uno: 1, dos: 2 }
        
        const schema: Schema = {
            const: {
                tres: 3,
                cuatro: 4
            }
        }

        const builder = new LocalDefinitionBuilder({})
        const resultBuilder = await new ResultBuilderLocal(source, builder).withSpread(schema)
        const resultado = resultBuilder.getTarget()
        const expected = { 
            uno: 1, 
            dos: 2, 
            tres: 3, 
            cuatro: 4
        }

        expect(resultado).toEqual(expected)
    })
  })

describe("varios", () => {

    test("setUpdateProp", () => {
        const usuario = {
            nombre: "Melany",
            apellido: "Flores"
        }

        const path = ["detalles", "id"]
        varios.setUpdateProp(usuario, path, 1)
        const expected = {
            ...usuario,
            detalles: {
                id: 1
            }
        }

        expect(usuario).toEqual(expected)
    })

    test("entries", () => {
        const source = {
            nombre: "Melany",
            cedula: "9-123-456",
            fechaDeNacimiento: "18/09/2019"
        }

        const resultado = varios.entries(source)
        const expected = [
            {
                key: "nombre",
                value: "Melany"
            },
            {
                key: "cedula",
                value: "9-123-456"
            },
            {
                key: "fechaDeNacimiento",
                value: "18/09/2019"
            }
        ]

        expect(resultado).toEqual(expected)
    })
})