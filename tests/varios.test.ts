import { expect, describe, test } from 'vitest';
import { Schema } from "../";
import * as varios from '../src/helpers/varios';
import { SchemaTaskResultBuilder } from '../src/builders/SchemaTaskResultBuilder';

describe("getObjPath works with custom separator or default: '.'", () => {

    const source = {
        user: {
            address: {
                country: "Panama",
            },
            description: null,
            id: undefined
        }
    }

    const cases = [
        // {
        //     source,
        //     path: "path.does.not.exists",
        //     expected: {
        //         paths: ["path", "does", "not", "exists"]
        //     }
        // },
        {
            source,
            path: "user.address.country",
            expected: { 
                value: "Panama", 
                paths: ["user", "address", "country"] 
            }
        },
        // {
        //     source,
        //     path: "user.address.city",
        //     expected: {
        //         paths: ["user", "address", "city"]
        //     }
        // },
        {
            source,
            path: "user.description",
            expected: { 
                value: null,
                paths: ["user", "description"]
            }
        },
        {
            source,
            path: "user.id",
            expected: { 
                value: undefined,
                paths: ["user", "id"]
            }
        },
    ]

    test.each(cases)("expects path $path to equal $expected", ({ source, path, expected }) => {
        const { value, paths } = varios.entry(source).getWithProperties(path)

        expect({ value, paths }).toStrictEqual(expected)
    })
})

describe("getObjPath works with custom separator or default: '.'", () => {
    const cases = [
        {
            path: "user.address.country",
        },
        {
            path: "user/address/country",
            separator: "/"
        }
    ]

    test.each(cases)("with path $path and $separator as separator", ({ path, separator }) => {
        const country = "Panama"
        const source = {
            user: {
                address: {
                    country
                }
            }
        }

        const value = varios.getPathValue(source, path, separator)

        expect(value).toBe(country)
    })
})

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

        const resultBuilder = new SchemaTaskResultBuilder()
            .with({ target: source })
            .withSpread(schema)
        const resultado = resultBuilder.build()
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

    test("setPathValue", () => {
        const usuario = {
            nombre: "Melany",
            apellido: "Flores"
        }

        varios.setPathValue(usuario, "detalles.id", 1)
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