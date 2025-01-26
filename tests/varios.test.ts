import { expect, describe, test } from 'vitest';
import * as varios from '../src/helpers/varios';
import { expectToEqualAsync } from './schema/buildResultsASync';
import { removeAccents } from '../src/helpers/varios';

test("remove accents", () => {
    const str = "Éxàmplê òf áccéntéd téxt"
    const actual = removeAccents(str)

    expect(actual).toBe("Example of accented text")
})

test("expect get function from path is bind to container", () => {
    const source = {
        user: {
            details: {
                name: "Melany",
                getName() {
                    return this.name
                }
            }
        }
    }

    const func = varios.entry(source).get("user.details.getName")

    expect(func()).toBe("Melany")
})

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

        const value = varios.entry(source).withPathSeparator(separator).get(path)

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
        await expectToEqualAsync({
            schema: {
                spread: {
                    const: {
                        tres: 3,
                        cuatro: 4
                    }
                }
            },
            initial: { uno: 1, dos: 2 },
            expected: { 
                uno: 1, 
                dos: 2, 
                tres: 3, 
                cuatro: 4
            }
        })
    })
  })

describe("varios", () => {

    test("setPathValue", () => {
        const usuario = {
            nombre: "Melany",
            apellido: "Flores"
        }

        varios.entry(usuario).set("detalles.id", 1)
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
        const expected = Object.entries(source).map(([key, value]) => ({ key, value }))

        expect(resultado).toEqual(expected)
    })
})