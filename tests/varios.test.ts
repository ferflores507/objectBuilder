import { expect, describe, test } from 'vitest';
import * as varios from '../src/helpers/varios';
import { expectToEqualAsync } from './schema/buildResultsASync';
import { sortCompare, formatSortOptions, removeAccents, SortOptions } from '../src/helpers/varios';

const toSorted = (array: any[], options: SortOptions) => {
    const concreteOptions = formatSortOptions(options)
    
    return array.toSorted((a, b) => sortCompare(a, b, concreteOptions))
}

describe.only("sort", () => {
    const mapWithId = (array: any[], id = "id") => array.map(item => item === undefined ? {} : ({ [id]: item }))
    const mapWithName = (array: any[]) => mapWithId(array, "name")
    const cases = [
        {
            name: "sort",
            sort: true,
            items: ["b", "c", "a"],
            expected: ["a", "b", "c"]
        },
        {
            name: "sort",
            sort: true,
            items: [1, 2, 10],
            expected: [1, 10, 2]
        },
        {
            name: "sort desc",
            sort: {
                descending: true
            },
            items: [1, 2, 10],
            expected: [2, 10, 1]
        },
        {
            name: "sort by name",
            sort: "name",
            items: mapWithName(["b", undefined, "c", "a"]),
            expected: mapWithName([undefined, "a", "b", "c"])
        },
        {
            name: "sort by name desc",
            sort: {
                path: "name",
                descending: true
            },
            items: mapWithName(["b", undefined, "c", "a"]),
            expected: mapWithName(["c", "b", "a", undefined])
        },
        {
            name: "sort by id numeric",
            sort: {
                path: "id",
                type: "numeric"
            },
            items: mapWithId([1, 2, undefined, 10]),
            expected: mapWithId([undefined, 1, 2, 10])
        },
        {
            name: "sort by id numeric desc",
            sort: {
                path: "id",
                type: "numeric",
                descending: true
            },
            items: mapWithId([1, 2, undefined, 10]),
            expected: mapWithId([10, 2, 1, undefined])
        },
        {
            name: "sort by completed ascending (falsy values first)",
            sort: {
                path: "completed",
                type: "numeric",
            },
            items: mapWithId([true, undefined, true, false], "completed"),
            expected: mapWithId([undefined, false, true, true], "completed")
        },
        {
            name: "sort by completed descending (truthy values first)",
            sort: {
                path: "completed",
                type: "numeric",
                descending: true
            },
            items: mapWithId([true, undefined, true, false], "completed"),
            expected: mapWithId([true, true, undefined, false], "completed")
        },
    ] as const

    test.each(cases)("sort", ({ name, sort, items, expected }) => {
        const actual = toSorted(items, sort)

        expect(actual).toEqual(expected)
    })

})

test("split string with extra spaces", () => {
    const str = "No   extra   spaces    allowed"

    expect(str.split(/\s+/)).toEqual(["No", "extra", "spaces", "allowed"])
})

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