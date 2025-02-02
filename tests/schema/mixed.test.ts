import { describe, expect, test } from 'vitest'
import { buildResultsAsync, Case, expectToEqualAsync } from './buildResultsASync'
import { PropiedadesBuilder } from '../../src/builders/PropiedadesBuilder'
import { entry } from '../../src/helpers/varios'
import { SchemaTaskResultBuilder } from '../../src/builders/SchemaTaskResultBuilder'
import { ArrayBuilder } from '../../src/builders/ArrayBuilder'
import { Schema } from '../..'
import { Queue } from '../../src/helpers/Queue'
import { TaskBuilder } from '../../src/builders/TaskBuilder'
import { Propiedades } from '../../src/models'

describe("and", async () => {

  const truthyValues = [true, {}, [], 1, "0", "false"]
  
  test.each(truthyValues)("and...", async (value) => {
    await expectToEqualAsync({
      store: {
        value
      },
      schema: {
        path: "value",
        and: "default"
      },
      expected: "default"
    })
  })
})

describe("sort by", () => {
  test("sort by completed (boolean) then by completed (numeric) descending", async () => {
    const items = Array.from(Array(6).keys()).map(i => i + 1)
    const zeros = [0, 0, 0]
    
    await expectToEqualAsync({
      initial: items.toSpliced(3, 0, ...zeros).map(completed => ({ completed })),
      schema: {
        sortBy: [
          {
            propiedades: {
              path: "completed",
              type: "boolean"
            }
          },
          {
            propiedades: {
              path: "completed",
              type: "numeric",
              descending: true
            }
          }
        ]
      },
      expected: [...zeros, ...items.reverse()].map(completed => ({ completed }))
    })
  })

  describe("sort by multiple options", () => {
    const cases = [
      {
        name: "sort by id then by name",
        items: [
          [3, "b"],
          [3, "a"],
          [2, "b"],
          [2, "a"],
          [1, "b"],
          [1, "a"]
        ],
      },
      {
        name: "sort by id then by name descending",
        items: [
          [3, "a"],
          [3, "b"],
          [2, "a"],
          [2, "b"],
          [1, "a"],
          [1, "b"],
        ],
        descending: ["name"],
      },
      {
        name: "sort by id descending then by name",
        items: [
          [1, "b"],
          [1, "a"],
          [2, "b"],
          [2, "a"],
          [3, "b"],
          [3, "a"],
        ],
        descending: ["id"]
      },
      {
        name: "sort by id descending then by name descending",
        items: [
          [1, "a"],
          [1, "b"],
          [2, "a"],
          [2, "b"],
          [3, "a"],
          [3, "b"],
        ],
        descending: ["id", "name"]
      }
    ]
    
    test.each(cases)("$name", async ({ items, descending }) => {
      const initial = items.map(([id, name]) => ({ id, name }))
      await expectToEqualAsync({
        initial,
        schema: {
          sortBy: [
            {
              const: {
                path: "id",
                type: "numeric",
                descending: descending?.includes("id")
              }
            },
            {
              const: {
                path: "name",
                descending: descending?.includes("name")
              }
            }
          ]
        },
        expected: initial.toReversed()
      })
    })
  })

  test("sort by name then by id", async () => {
    const items = [
      [3, "b"],
      [2, "b"],
      [1, "b"],
      [3, "a"],
      [2, "a"],
      [1, "a"],
    ].map(([id, name]) => ({ id, name }))
  
    await expectToEqualAsync({
      schema: {
        const: items,
        sortBy: [
          {
            propiedades: {
              path: "name",
            }
          },
          {
            propiedades: {
              path: "id",
              type: "numeric",
            }
          }
        ]
      },
      expected: items.toReversed()
    })
  
  })
})

test("propiedadesAsync", async () => {

  const result = await new SchemaTaskResultBuilder()
    .with({
      schema: {
        init: {
          getNum: {
            asyncFunction: {
              delay: 1000,
              const: 1
            }
          }
        },
        propiedadesAsync: {
          total: {
            call: "$getNum",
            reduce: {
              plus: 1
            }
          }
        }
      }
    })
    .buildAsync()

  expect(result).toEqual({ total: 2 })
})

test("definitions with async call works", async () => {

  const result = await new SchemaTaskResultBuilder()
    .with({
      schema: {
        init: {
          getNum: {
            asyncFunction: {
              delay: 1000,
              const: 1
            }
          }
        },
        definitions: [
          {
            call: "$getNum",
            reduce: {
              plus: 1
            }
          }
        ]
      }
    })
    .buildAsync()

  expect(result).toEqual([2])
})

test.fails("propiedades fails with async call", async () => {

  const result = await new SchemaTaskResultBuilder()
    .with({
      schema: {
        init: {
          getNum: {
            asyncFunction: {
              delay: 1000,
              const: 1
            }
          }
        },
        propiedades: {
          total: {
            call: "$getNum",
            reduce: {
              plus: 1
            }
          }
        }
      }
    })
    .buildAsync()

  expect(result).toEqual({ total: 2 })
})

describe("sort", () => {
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
      sort: "descending",
      items: [1, 2, 10],
      expected: [2, 10, 1]
    },
    {
      name: "sort desc with options",
      sortBy: {
        descending: true
      },
      items: [1, 2, 10],
      expected: [2, 10, 1]
    },
    {
      name: "sort by name",
      sortBy: "name",
      items: mapWithName(["b", undefined, "c", "a"]),
      expected: mapWithName([undefined, "a", "b", "c"])
    },
    {
      name: "sort by name desc",
      sortBy: {
        path: "name",
        descending: true
      },
      items: mapWithName(["b", undefined, "c", "a"]),
      expected: mapWithName(["c", "b", "a", undefined])
    },
    {
      name: "sort by id numeric",
      sortBy: {
        path: "id",
        type: "numeric"
      },
      items: mapWithId([1, 2, undefined, 10]),
      expected: mapWithId([undefined, 1, 2, 10])
    },
    {
      name: "sort by id numeric desc",
      sortBy: {
        path: "id",
        type: "numeric",
        descending: true
      },
      items: mapWithId([1, 2, undefined, 10]),
      expected: mapWithId([10, 2, 1, undefined])
    },
    {
      name: "sort by completed ascending (falsy values first)",
      sortBy: {
        path: "completed",
        type: "numeric",
      },
      items: mapWithId([true, undefined, true, false], "completed"),
      expected: mapWithId([undefined, false, true, true], "completed")
    },
    {
      name: "sort by completed descending (truthy values first)",
      sortBy: {
        path: "completed",
        type: "numeric",
        descending: true
      },
      items: mapWithId([true, undefined, true, false], "completed"),
      expected: mapWithId([true, true, undefined, false], "completed")
    },
  ]

  test.each(cases)("expect $name, value: $sort $items to equal $expected", async ({ sort, sortBy, items, expected }) => {
    await expectToEqualAsync({
      initial: items,
      schema: sort 
        ? { sort } 
        : { sortBy: { const: sortBy } },
      expected
    })
  })

})

test("override spread operator", async () => {
  await expectToEqualAsync({
    operators: {
      spread: (value, source) => {
        return [...value, ...source ]
      }
    },
    schema: {
      const: [
        1,
        2
      ],
      spreadFlat: {
        const: [
          3,
          [4, 5],
          6,
          7
        ]
      }
    },
    expected: Array.from(Array(7).keys()).map(i => i +1)
  })
})

test("keywords", async () => {
  await expectToEqualAsync({
    schema: {
      const: " AccéntéD   téxT  WitH    eXtra  spaCes  and  CapiTals ",
      keywords: true
    },
    expected: ["accented", "text", "with", "extra", "spaces", "and", "capitals"]
  })
})

test("is keywords of", async () => {
  await expectToEqualAsync({
    schema: {
      const: ["uno", "dos"],
      isKeywordsOf: {
        const: ["tres", "dos", "uno"]
      }
    },
    expected: true
  })
})

test("is subset with", async () => {
  await expectToEqualAsync({
    schema: {
      const: ["uno", "dos"],
      isSubsetOf: {
        propiedades: {
          container: {
            const: ["1 - uno", "2 - dos", "3 - tres"]
          },
          match: {
            function: {
              path: "arg.containerItem",
              includes: {
                path: "arg.item"
              }
            }
          }
        }
      }
    },
    expected: true
  })
})

describe("or", async () => {

  const falsyValues = [undefined, null, NaN, false, 0, ""]
  Array
  test.each(falsyValues)("or...", async (value) => {
    await expectToEqualAsync({
      store: {
        value
      },
      schema: {
        path: "value",
        or: "default"
      },
      expected: "default"
    })
  })
})

test("assign", async () => {
  await expectToEqualAsync({
    schema: {
      const: { id: 1 },
      assign: {
        propiedades: {
          titulo: "uno"
        }
      },
      reduce: {
        equals: {
          const: { 
            id: 1,
            titulo: "uno"
          }
        }
      }
    },
    expected: true
  })
})

describe("with boolean", () => {
  const cases = [
    [undefined, false],
    [null, false],
    [NaN, false],
    [false, false],
    [true, true],
    [0, false],
    [1, true],
    ["", false],
    [" ", true],
    ["0", true],
    ["2", true],
    [{}, true],
    [[], true]
  ] as const

  test.each(cases)("", async (initial, expected) => {
    await expectToEqualAsync({
      initial,
      schema: {
        boolean: true
      },
      expected
    })
  })
})

test("remove accents", async () => {
  await expectToEqualAsync({
    schema: {
      const: "Éxàmplê òf áccéntéd téxt",
      removeAccents: true
    },
    expected: "Example of accented text"
  })
})
test("definitions with primitives", async () => {
  await expectToEqualAsync({
    schema: {
      definitions: [1, 2, 3]
    },
    expected: [1, 2, 3]
  })
})

test("with init", async () => {
  await expectToEqualAsync({
    schema: {
      init: {
        search: "b"
      },
      const: [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
        { id: 3, text: "c" }
      ],
      find: {
        path: "current.text",
        equals: {
          path: "$search"
        }
      }
    },
    expected: { id: 2, text: "b" }
  })
})

test("array spread start", async () => {
  await expectToEqualAsync({
    schema: {
      const: [2, 3],
      spreadStart: {
        const: 1
      }
    },
    expected: [1, 2, 3]
  })
})

describe("array with", () => {
  const cases: Case[] = [
    {
      initial: [1, 2, 3].map(id => ({ id, a: id, b: id })),
      schema: {
        withPatch: {
          propiedades: {
            value: {
              const: { id: 2, b: "Dos" }
            }
          },
        },
      },
      expected: [1, 2, 3].map(id => {
        return {
          id,
          a: id,
          b: id === 2 ? "Dos" : id
        }
      })
    },
    {
      initial: [1, 2, 3],
      schema: {
        with: {
          propiedades: {
            value: 4
          },
        },
      },
      expected: [4, 2, 3]
    },
    {
      initial: [4, 7, 7],
      schema: {
        with: {
          propiedades: {
            index: 1,
            value: 6
          },
        },
      },
      expected: [4, 6, 7]
    }
  ]

  test.each(cases)("expect array with value replaced at index or value with same key", async options => {
    await expectToEqualAsync(options)
  })

})

test("unpack as getters", () => {
  const user = {
    nombre: "Melany",
    id: 1
  }

  const obj = new SchemaTaskResultBuilder()
    .with({
      store: {
        user
      },
      schema: {
        path: "user",
        unpackAsGetters: {
          const: ["nombre", "id", "nombre", "id"]
        }
      }
    })
    .build()

    expect(obj.nombre).toBe("Melany")
    expect(obj.id).toBe(1)

    user.nombre = "Fernando"
    user.id = 2

    expect(obj.nombre).toBe("Fernando")
    expect(obj.id).toBe(2)
})

test("default schema", async () => {
  await expectToEqualAsync({
    schema: {
      trim: true,
      default: ""
    },
    expected: ""
  })
})

test("default schema", async () => {
  await expectToEqualAsync({
    store: {
      nombre: "Fernando"
    },
    schema: {
      path: "nombre",
      default: "Melany"
    },
    expected: "Fernando"
  })
})

test("default schema", async () => {
  await expectToEqualAsync({
    schema: {
      path: "nombre",
      default: "Melany"
    },
    expected: "Melany"
  })
})

test("spread flat", async() => {
  await expectToEqualAsync({
    schema: {
      const: [
        1,
        2
      ],
      spreadFlat: {
        const: [
          3,
          [4, 5],
          6,
          7
        ]
      }
    },
    expected: Array.from(Array(7).keys()).map(i => i +1)
  })
})

test("delete operator: expect to equal items toSpliced with 1 deleted element", async () => {
  await expectToEqualAsync({
    operators: {
      delete: (initial: [], index: any) => {
        return initial.toSpliced(index, 1)
      }
    },
    schema: {
      const: [1, 2, 3],
      delete: 1
    },
    expected: [1, 3]
  })
})

describe("arithmetic", () => {

  const schema = {
    plus: 10,
    minus: 6,
    times: 16,
    dividedBy: 4
  }
  
  test.each(Object.entries(schema))("expect 8 %s 2 to equal: %d", async (method, expected) => {
    await expectToEqualAsync({
      schema: {
        const: 8,
        [method]: {
          const: 2
        }
      },
      expected
    })
  })

  const total = 16

  test(`expect all operators to equal ${total}`, async () => {
    await expectToEqualAsync({
      schema: {
        const: 0,
        ...schema
      },
      expected: total
    })
  })
})

describe("comparison", () => {

  test("not equals but includes", async () => {
    await expectToEqualAsync({
      schema: {
        const: "not just Melany",
        not: {
          equals: "Melany",
        },
        includes: "Melany"
      },
      expected: true
    })
  })

  test("equals and includes", async () => {
    await expectToEqualAsync({
      schema: {
        const: "Melany",
        equals: "Melany",
        includes: "Melany"
      },
      expected: true
    })
  })
  
  test("greater than", async () => {
    await expectToEqualAsync({
      schema: {
        const: 2,
        greaterThan: 1
      },
      expected: true
    })
  })
  
  test("less than", async () => {
    await expectToEqualAsync({
      schema: {
        const: 0,
        lessThan: 1
      },
      expected: true
    })
  })

  test("greater than and less than (between)", async () => {
    await expectToEqualAsync({
      schema: {
        const: 7,
        greaterThan: 6,
        lessThan: 8
      },
      expected: true
    })
  })

})

describe("schema from async", () => {

  const expected = "ok"
  const cases = [
    {
      message: "works because awaits delay promise at the end",
      schema: {
        const: expected,
        reduce: {
          delay: 50
        }
      }
    },
    {
      message: "doesnt works (delay is not awaited) and expects a nested property of current (promise) to be expected value",
      schema: {
        const: {
          msg: expected
        },
        reduce: {
          delay: 50,
          path: "current.msg"
        }
      }
    },
  ]

  test.each(cases)("$message", async ({ schema }) => {
    const result = await new SchemaTaskResultBuilder()
      .with({
        schema: {
          schemaFrom: {
            schema
          }
        },
      })
      .buildAsync()
  
      expect(result).toEqual(expected)
  })
})

describe("schema string join", () => {

  const values = [
    "Fernando",
    "Flores"
  ]

  describe("with filled schema", () => {
    const cases = [
      {
        title: "empty string",
        join: true,
        separator: ""
      },
      {
        title: "dash",
        join: "-",
        separator: "-"
      }
    ] as const

    test.each(cases)("expects $join as value of join to be joined with $title", async ({ join, separator }) => {
      await expectToEqualAsync({
        schema: {
          const: values,
          join
        },
        expected: values.join(separator)
      })
    })

    test("dash with async fails on buildAsync", async () => {
      const separator = "-"
      const result = await new SchemaTaskResultBuilder()
        .with({
          schema: {
            const: values,
            join: {
              const: "-",
              reduce: {
                delay: 50,
              }
            },
          }
        })
        .buildAsync()

      expect(result).toEqual(values.join(separator))
    })
  })

  describe("with empty schema fails", () => {
    const cases = [",", ""].map(s => values.join(s))

    test.fails.each(cases)("fails to expect '%s'", async (expected) => {
      await expectToEqualAsync({
        schema: {
          const: [
            "Fernando",
            "Flores"
          ],
          join: {
          }
        },
        expected
      })
    })
  })
})

test("schema isComputed property", () => {
  const store = {
    nombre: "Fernando"
  }

  const result = new SchemaTaskResultBuilder()
    .with({
      store,
      schema: {
        propiedades: {
          titulo: {
            isComputed: true,
            path: "nombre"
          }
        },
      },
    })
    .build()

  expect(result.titulo).toEqual("Fernando")

  store.nombre = "Melany"

  expect(result.titulo).toEqual("Melany")
})

describe("schema async function", async () => {
  const store = new SchemaTaskResultBuilder()
    .withSchema({
      propiedades: {
        getSeven: {
          asyncFunction: {
            delay: 50,
            const: 7
          }
        }
      }
    })
    .build()

  test("expect call to be instance of Promise", () => {
    expect(store.getSeven()).toBeInstanceOf(Promise)
  })

  test("expect await call to be result: 7", async () => {
    expect(await store.getSeven()).toBe(7)
  })
})

test("with bind arg", () => {
  const func = new SchemaTaskResultBuilder()
    .with({
      schema: {
        function: {
          set: "nombre"
        },
        bindArg: {
          const: "Melany"
        }
      },
    })
    .build()

  expect(func()).toEqual("Melany")
})

describe("define property", () => {

  type Obj = Partial<{
    nombreInicial: string,
    nombre: string,
    _nombre: string
  }>

  test("redefine getter with same name and value access", () => {
  
    const obj: Obj = { nombreInicial: "Melany" }
  
    Object.defineProperty(obj, "nombre", {
      configurable: true,
      get: () => obj.nombreInicial
    })
  
    Object.defineProperty(obj, "_nombre", Object.getOwnPropertyDescriptor(obj, "nombre"))
  
    Object.defineProperty(obj, "nombre", {
      get: () => obj["_nombre"] + " Flores"
    })
  
    obj.nombreInicial = "Fer"
  
    expect(obj.nombre).toEqual("Fer Flores")
  })

  test.fails("reuse getter from obj copy", () => {
    const obj: Obj = {}
  
    Object.defineProperty(obj, "nombre", {
      configurable: true,
      get: () => "Melany"
    })
  
    const objCopy = obj
  
    // throws
  
    Object.defineProperty(obj, "nombre", {
      get: () => objCopy.nombre + " Flores"
    })
  
    expect(obj.nombre).toEqual("Melany Flores")
  })

  test("redefine property", () => {
    const obj: Obj = {}
  
    Object.defineProperty(obj, "nombre", {
      configurable: true,
      get: () => "Melany"
    })
  
    Object.defineProperty(obj, "nombre", {
      value: "Fer"
    })
  
    expect(obj.nombre).toEqual("Fer")
  })

})

test("object with function to set sibling", () => {
  const obj = new SchemaTaskResultBuilder()
    .with({
      schema: {
        propiedades: {
          nombre: "Melany",
          setNombre: {
            function: {
              set: "sibling.nombre"
            }
          }
        }
      }
    })
    .build()

  obj.setNombre("Fer")

  expect(obj.nombre).toEqual("Melany")
})

test("import with multiple stores", async () => {

  const titulo = "detalles de store"

  const stores = {
    user: {
      nombre: "Melany",
      cedula: "9-123",
      schema: "1-mel-1"
    },
    allUsers: [
      {
        nombre: "Fernando",
        cedula: "8-123-456",
        schema: "2-fer-2"
      }
    ],
  }

  await expectToEqualAsync({
    stores,
    store: {
      userSchema: {
        propiedades: {
          titulo,
          detalles: {
            propiedades: {
              nombre: {
                path: "nombre"
              },
              id: {
                path: "cedula"
              }
            }
          }
        }
      }
    },
    schema: {
      path: "userSchema",
      propiedades: {
        currentUser: {
          store: {
            path: "stores.user"
          },
          schemaFrom: {
            path: "current"
          }
        },
        topUser: {
          store: {
            path: "stores.allUsers.0"
          },
          schemaFrom: {
            path: "current"
          }
        },
        mari: {
          store: {
            const: {
              nombre: "Mari",
              cedula: "9-750-104"
            }
          },
          schemaFrom: {
            path: "current"
          }
        }
      }
    },
    expected: {
      currentUser: {
        titulo,
        detalles: {
          nombre: stores.user.nombre,
          id: stores.user.cedula
        }
      },
      topUser: {
        titulo,
        detalles: {
          nombre: stores.allUsers[0].nombre,
          id: stores.allUsers[0].cedula
        }
      },
      mari: {
        titulo,
        detalles: {
          nombre: "Mari",
          id: "9-750-104"
        }
      }
    }
  })
})

test("init search then map with filter", async () => {
  await expectToEqualAsync({
    schema: {
      init: {
        search: 1,
      },
      const: Array.from(Array(3).keys()),
      map: {
        propiedades: {
          id: {
            path: "current"
          }
        }
      },
      reduce: {
        filter: {
          path: "current.id",
          equals: {
            path: "$search"
          }
        }
      }
    },
    expected: [{ id: 1 }]
  })
})

test("map then filter", async () => {
  await expectToEqualAsync({
    schema: {
      const: Array.from(Array(3).keys()),
      map: {
        propiedades: {
          id: {
            path: "current"
          }
        }
      },
      reduce: {
        filter: {
          path: "current.id",
          equals: 1
        }
      }
    },
    expected: [{ id: 1 }]
  })
})

test("filter simple case", async () => {
  await expectToEqualAsync({
    schema: {
      const: Array.from(Array(3).keys()),
      filter: {
        path: "current",
        equals: 1
      }
    },
    expected: [1]
  })
})

describe("schema with functions useFirst and useLast with source (a, b, c)", () => {

  const cases = [
    {
      use: "First",
      expected: "a"
    },
    {
      use: "Last",
      expected: "c"
    }
  ]

  test.each(cases)("expects use$use to return $expected", async ({ use, expected }) => {
    await expectToEqualAsync({
      functions: {
        useFirst: (items: any[], builder: SchemaTaskResultBuilder) => {
          builder.add(() => items[0])
        },
        useLast: (items: any[], builder: SchemaTaskResultBuilder) => {
          builder.add(() => items[items.length - 1])
        }
      },
      schema: {
        ["use" + use]: ["a", "b", "c"]
      },
      expected
    })
  })

})

test("nested stores with call to root store", async () => {
  const store = {}
  await expectToEqualAsync({
    store,
    schema: {
      set: "setName",
      function: {
        set: "store.name",
        path: "current"
      },
      reduce: {
        propiedades: {
          child: {
            store: {
              propiedades: {
                nombre: "Melany",
                setName: {
                  path: "setName"
                }
              }
            },
            reduce: {
              set: "updateName",
              function: {
                call: {
                  setName: {
                    path: "nombre"
                  }
                }
              },
              reduce: {
                call: "updateName"
              }
            }
          }
        }
      }
    },
    expected: { child: "Melany" }
  })
})

describe("with call", () => {

  test("with call", async () => {
    await expectToEqualAsync(
      {
        store: {},
        schema: {
          set: "getName",
          function: {
            path: "current"
          },
          reduce: {
            call: {
              getName: "Melany"
            }
          }
        },
        expected: "Melany"
      }
    )
  })

  test("with call arg path", async () => {
    await expectToEqualAsync(
      {
        store: {
          name: "Melany"
        },
        schema: {
          set: "getName",
          function: {
            path: "current"
          },
          reduce: {
            call: ["getName", "name"]
          }
        },
        expected: "Melany"
      }
    )
  })

  test("with call current as arg path", async () => {
    await expectToEqualAsync(
      {
        schema: {
          set: "getName",
          function: {
            path: "current"
          },
          reduce: {
            const: "Melany",
            call: ["getName", "current"]
          }
        },
        expected: "Melany"
      }
    )
  })

})

test("schema with multiple stores", async () => {
  await expectToEqualAsync({
    schema: {
      propiedades: [1, 2, 3, 4].reduce((obj, id) => {
        return {
          ...obj,
          ["grandParent" + id]: {
            store: {
              const: {
                id
              }
            },
            propiedades: {
              parent: {
                propiedades: {
                  child: {
                    propiedades: {
                      grandChild: {
                        path: "id"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }, {})
    },
    expected: [1, 2, 3, 4].reduce((obj, id) => {
      return {
        ...obj,
        ["grandParent" + id]: {
          parent: {
            child: {
              grandChild: id
            }
          }
        }
      }
    }, {})
  })
})

test("schema withStore", async () => {
  await expectToEqualAsync({
    schema: {
      store: {
        propiedades: {
          nombre: "Melany"
        }
      },
      path: "nombre"
    },
    expected: "Melany"
  })
})

describe("schema import", () => {
  const cases = [
    {
      sourcePath: "empty",
      store: {
        total: {
          const: 7
        }
      },
      expected: 7,
    },
  ]

  test.each(cases)("expects 'total' with source path $sourcePath to equal $expected", async ({ store, expected }) => {
    await expectToEqualAsync({
      store,
      schema: {
        import: "total",
      },
      expected
    })
  })
})

test("all equal false (not all equal)", async () => {
  await expectToEqualAsync({
    initial: {
      uno: 1,
      one: 1,
      dos: 2
    },
    schema: {
      allEqual: false
    },
    expected: true
  })
})

test("all equal true", async () => {
  await expectToEqualAsync({
    initial: {
      uno: 1,
      one: 1,
      dos: 2
    },
    schema: {
      unpack: ["uno", "one"],
      allEqual: true
    },
    expected: true
  })
})

test("all equal to primitive", async () => {
  await expectToEqualAsync({
    initial: {
      one: 1,
      seven: 7,
      siete: 7,
    },
    schema: {
      unpack: ["seven", "siete"],
      allEqualTo: 7
    },
    expected: true
  })
})

test("all equal to schema", async () => {
  await expectToEqualAsync({
    store: {
      value: 7
    },
    initial: {
      one: 1,
      seven: 7,
      siete: 7,
    },
    schema: {
      unpack: ["seven", "siete"],
      allEqualTo: {
        path: "value"
      }
    },
    expected: true
  })
})

test("schema array async", async () => {
  await expectToEqualAsync({
    schema: [1, 2, 3].map((n): Schema => ({ delay: 50, reduce: { const: n } })),
    expected: [1, 2, 3]
  })
})

describe("withFunction", () => {
  test.each(["arg", "current"])("expect function call to return array with arg", async (path) => {
    const func = new SchemaTaskResultBuilder()
      .with({
        schema: {
          function: [{ path }]
        }
      }).build()
  
    expect(func("Melany")).toEqual(["Melany"])
  })
})

test("use with reduce", async () => {

  const sumar = ({ a, b }: { a: number, b: number }) => a + b

  await expectToEqualAsync({
    functions: {
      sumar
    },
    schema: {
      use: "sumar",
      const: {
        a: 1,
        b: 2
      },
      reduce: {
        use: "sumar",
        propiedades: {
          a: {
            path: "current"
          },
          b: {
            path: "current"
          }
        }
      }
    },
    expected: 6
  })
})

test("schemaFrom nested", async () => {
  await expectToEqualAsync({
    store: {
      schemaFinal: {
        const: {
          nombre: "Fernando"
        }
      },
      usuario: {
        schemaFrom: {
          path: "schemaFinal"
        }
      }
    },
    schema: {
      schemaFrom: {
        path: "usuario"
      }
    },
    expected: {
      nombre: "Fernando"
    }
  })
})

test("reduceOrDefault followed by reduce", async () => {
  await expectToEqualAsync({
    schema: {
      const: " uno ",
      reduceOrDefault: {
        trim: true,
      },
      reduce: {
        path: "current.length"
      },
    },
    expected: 3
  })
})

test("reduceOrDefault", async () => {
  await expectToEqualAsync({
    schema: {
      const: " uno ",
      reduceOrDefault: {
        trim: true
      }
    },
    expected: "uno"
  })
})

test("reduceOrDefault doesnt fail with null or undefined", async () => {
  await expectToEqualAsync({
    schema: {
      reduceOrDefault: {
        trim: true
      }
    },
    expected: undefined
  })
})

test("task builder", () => {
  const builder = new TaskBuilder().with({ target: 2 })

  builder.add(target => target + 1) // current = 6 + 1 = 7
  builder.add(target => target + 3) // current = 7 + 3 = 10
  builder.unshift(target => target * 3) // initial task: current = 2 * 3 = 6

  expect(builder.build()).toEqual(10)
})

test("Queue with unshift", () => {
  const queue = new Queue()

  queue.enqueue("tres", "cuatro", "cinco")
  queue.unshift("uno", "dos")

  const result = []
  let item = null

  while (item = queue.dequeue()) {
    result.push(item)
  }

  const expected = ["uno", "dos", "tres", "cuatro", "cinco"]

  expect(result).toEqual(expected)
})

test("Queue", () => {
  const queue = new Queue()

  queue.enqueue("uno", "dos", "tres")

  const expected = []
  let item = null

  while (item = queue.dequeue()) {
    expected.push(item)
  }

  expect(expected).toEqual(["uno", "dos", "tres"])
})

test("filter with empty schema return all items === true", async () => {
  await expectToEqualAsync(
    {
      schema: {
        const: [1, true, 0, "0", {}, false, "", " ", true, [], NaN],
        filter: {}
      },
      expected: [1, true, "0", {}, " ", true, []]
    }
  )
})

test("filter with source dos", async () => {
  await expectToEqualAsync(
    {
      store: {
        search: "  in  "
      },
      schema: {
        init: {
          search: {
            path: "search",
            trim: true,
          }
        },
        const: ["uno", "Melany", "tres", "cuatro", "cinco", "seis"],
        filter: {
          path: "current",
          includes: {
            path: "$search"
          }
        }
      },
      expected: ["cinco"]
    }
  )
})

test("filter with source", async () => {
  await expectToEqualAsync(
    {
      schema: {
        const: ["uno", "Melany", "tres", "cuatro", "cinco", "seis"],
        reduce: {
          filter: {
            path: "current.length",
            equals: {
              path: "target.length"
            }
          }
        }
      },
      expected: ["Melany", "cuatro"]
    }
  )
})

test("map builder with undefined", async () => {
  const items = [1, undefined, 2, 3]
  const result = items.map(x => {
    return new SchemaTaskResultBuilder()
      .with({
        initial: x,
        schema: {
          propiedades: {
            id: {
              path: "current"
            }
          }
        }
      })
      .build()
  })

  const expected = items.map(id => ({ id }))
  expect(result).toEqual(expected)
})

test("initial defined and const with undefined", async () => {
  await expectToEqualAsync({
    schema: {
      const: undefined,
    },
    expected: undefined,
    initial: 1,
  })
})

test("map path target", async () => {

  await expectToEqualAsync({
    schema: {
      const: 1,
      reduce: {
        const: [1, 2, 3, 4],
        map: {
          path: "target"
        }
      }
    },
    expected: [1, 1, 1, 1],
  })

})

describe("includes", () => {

  const keywords = ["h", "o", "l", "a", "ho", "ol", "la", "hol", "ola", "hola"]

  test.each(keywords)("includes", async (keyword) => {
    await expectToEqualAsync({
      schema: {
        const: "hola",
        includes: keyword
      },
      expected: true,
    })
  })

  test("with array", async () => {
    const schema = {
      path: "local.selectedItems",
      includes: {
        path: "search.id"
      }
    }

    await expectToEqualAsync({
      store: {
        search: { id: 1 },
        local: {
          selectedItems: [1]
        }
      },
      schema,
      expected: true,
    })
  })
})

test("path current", async () => {

  const items = [1, 2, 3]

  await expectToEqualAsync({
    schema: {
      const: items,
      map: {
        propiedades: {
          id: {
            path: "current"
          }
        }
      }
    },
    expected: items.map(id => ({ id }))
  })
})

test("not", () => {
  const result = new SchemaTaskResultBuilder()
    .withSchema({
      const: { activated: true },
      not: {
        path: "current.activated",
      }
    })
    .build()

  expect(result).toBe(false)
})

test("array builder with schema with find", () => {
  const schema = {
    find: {
      path: "current.nombre",
      equals: "Melany"
    }
  }

  const items = [
    1,
    "dos",
    { nombre: "Mari" },
    { nombre: "Melany" }
  ]

  const builder = new SchemaTaskResultBuilder()
  const result = new ArrayBuilder(items, builder).build(schema)

  expect(result).toEqual({ nombre: "Melany" })
})

describe("array filter property 'keywords' contains string", () => {

  const items = [
    {
      match: true,
      keywords: ["Melany", "uno"]
    },
    {
      match: false,
      keywords: ["uno", "dos"]
    },
    {
      match: true,
      keywords: ["uno", "Melany"]
    },
    {
      match: false,
      keywords: ["tres", "cuatro"]
    }
  ]

  const cases = [
    {
      items,
      expected: items.filter(i => i.match === true)
    },
    {
      items: items.filter(i => i.match === false),
      expected: []
    }
  ]

  test.each(cases)("case", async ({ items, expected }) => {

    await expectToEqualAsync({
      store: {},
      schema: {
        const: items,
        filter: {
          path: "current.keywords",
          includes: "Melany"
        }
      },
      expected
    })
  })

})

test("schema as value", async () => {
  const schema: Schema = {
    schema: {
      propiedades: {
        value: {
          path: "id"
        },
        nombre: "Melany"
      }
    }
  }

  await expectToEqualAsync({
    store: {},
    schema,
    expected: schema.schema
  })
})

test("spread item to array", async () => {
  await expectToEqualAsync({
    store: {},
    schema: {
      const: [
        1, 2, 3
      ],
      spread: {
        const: 4
      }
    },
    expected: [1, 2, 3, 4]
  })
})

test("UUID", async () => {
  const schema: Schema = {
    UUID: true
  }

  await expect(buildResultsAsync({ schema })).resolves.not.toThrow()
  
  const results = await buildResultsAsync({ schema })
  
  expect(results).not.contain(undefined)
  expect(results).not.contain(null)
})

describe("increment or decrement", () => {

  const operations = ["increment", "decrement"]

  test.each(operations)("%s", async (operation) => {
    const store = { total: 7 }
    const schema: Schema = {
      [operation]: "total",
      reduce: {
        path: "total"
      }
    }
    const builder = new SchemaTaskResultBuilder()
      .with({
        store,
        schema
      })
    const amount = schema.increment ? 1 : -1
    const expected = store.total + amount
    const resultados = [builder.build(), await builder.with({ schema }).buildAsync()]

    expect(resultados).toEqual([expected, expected + amount])
  })

})

describe("trim", () => {
  const cases = [
    "  hello   ",
    "  this is a test",
    "",
    "   "
  ].map(val => [val, val.trim()])

  test.each(cases)("(%s).trim equals: (%s)", async (value, expected) => {
    await expectToEqualAsync({
      store: { value },
      schema: {
        path: "value",
        trim: true
      },
      expected
    })
  })
})

describe("isNullOrWhiteSpace (value)?", () => {

  const falseValues: [any, false][] = ["hello", 1, false, true].map(val => [val, false])
  const trueValues: [any, true][] = ["", "   ", null, undefined].map(val => [val, true])

  const cases = [
    ...falseValues,
    ...trueValues
  ]

  test.each(cases)("(%s): %s", async (value, expected) => {
    await expectToEqualAsync({
      store: { value },
      schema: {
        path: "value",
        isNullOrWhiteSpace: true
      },
      expected
    })
  })
})

describe("not", () => {

  test("every item is opposite boolean", async () => {
    const source = [
      true,
      false,
      false,
      true
    ]

    await expectToEqualAsync({
      schema: {
        map: {
          not: {}
        }
      },
      initial: source,
      expected: source.map(x => !x)
    })
  })

  test("propiedades", async () => {
    await expectToEqualAsync({
      schema: {
        propiedades: {
          active: {
            not: {
              path: "active"
            }
          }
        }
      },
      expected: {
        active: true
      },
    })
  })

  describe("simple not", () => {
    const schemas: Schema[] = [
      {
        const: false
      },
      {
        path: "activated"
      }
    ]

    test.each(schemas)("schema: $schema", async (schema: Schema) => {
      const store = { activated: false }
      const builder = new SchemaTaskResultBuilder()
        .with({ store })

      const results = [
        !builder.with({ schema }).build(),
        !(await builder.with({ schema }).buildAsync()),
        builder.with({ schema: { not: schema } }).build(),
        await builder.with({ schema: { not: schema } }).buildAsync()
      ]

      expect(new Set(results).size).toBe(1)
    })
  })
})

describe("add schema", () => {

  test("multiple with max", async () => {
    await expectToEqualAsync({
      store: {},
      schema: {
        const: [
          1,
          2
        ],
        select: {
          multiple: {
            const: true
          },
          max: {
            const: 2
          },
          value: {
            const: 3
          }
        }
      },
      expected: [1, 2]
    })
  })

  test("multiple with value only", async () => {
    await expectToEqualAsync({
      store: {},
      schema: {
        const: [
          1,
          2
        ],
        select: {
          multiple: {
            const: true
          },
          value: {
            const: 3
          }
        }
      },
      expected: [1, 2, 3]
    })

  })

  test("with value only, already containing an item and then reduce", () => {
    const schema: Schema = {
      const: [4],
      select: {
        value: {
          const: 3
        }
      },
      set: "items",
      reduce: { // same without reduce
        path: "items"
      }
    }

    const result = new SchemaTaskResultBuilder()
      .withSchema(schema)
      .build()
    const expected = [3]

    expect(result).toEqual(expected)

  })

  test("with value only", async () => {
    await expectToEqualAsync({
      store: {},
      schema: {
        const: [],
        select: {
          value: {
            const: 3
          }
        }
      },
      expected: [3]
    })
  })

})

describe("if schema", () => {
  const [ok, invalid] = ["ok", "invalid"]
  const cases = [1, 2, 3].map(num => {
    return [num, num % 2 == 0 ? ok : invalid] as [number, string]
  })

  test.each(cases)("if as string (path)", async (id: number, expected: string) => {
    await expectToEqualAsync({
      store: {
        isValid: id % 2 == 0
      },
      schema: {
        if: "isValid",
        then: {
          const: ok
        },
        else: {
          const: invalid
        }
      },
      expected
    })
  })

  const modCases = [1, 2, 3].map(num => {
    const mod = num % 2

    return [mod, mod == 0 ? ok : invalid] as [number, string]
  })

  test.each(modCases)("if as schema", async (mod: number, expected: string) => {
    await expectToEqualAsync({
      store: { mod },
      schema: {
        const: mod,
        if: {
          equals: 0
        },
        then: {
          const: ok
        },
        else: {
          const: invalid
        }
      },
      expected
    })
  })
})

test("getPathValue throws on null source", () => {
  const source = null

  expect(() => entry(source!).get("test")).toThrow()
})

describe("select", () => {
  const builder = new SchemaTaskResultBuilder()
    .with({
      store: {
        selected: [2]
      },
    })

  const cases = [
    { selected: [3] },
    { selected: [] }
  ]

  test.each(cases)("select value", ({ selected }) => {
    const resultado = builder
      .with({
        schema: {
          const: 3,
          selectSet: "selected",
          reduce: {
            path: "selected"
          }
        }
      })
      .build()

    expect(resultado).toEqual(selected)
  })
})

describe("propiedades builder", () => {

  type CaseOptions = {
    target?: any,
    source?: any,
    propiedades: Propiedades
    expected: Record<string, any>
  }

  const expectResultsAsync = async (options: CaseOptions) => {
    const { propiedades, expected, ...rest } = options
    const builder = new SchemaTaskResultBuilder()
      .with(rest)
      
    const propiedadesBuilder = new PropiedadesBuilder(propiedades, builder)
    const results = [propiedadesBuilder.build(), await propiedadesBuilder.buildAsync()]

    expect(results).toEqual([expected, expected])
  }

  test("options value path", async () => {
    await expectResultsAsync({
      store: { dos: 2 },
      value: { detalles: { titulo: "Hola" } },
      propiedades: {
        uno: 1,
        unoCopy: {
          path: "siblings.uno"
        },
        dos: {
          path: "dos"
        },
        saludo: {
          path: "value.detalles.titulo",
        },
        saludoNested: {
          path: "value.detalles",
          propiedades: {
            titulo: {
              path: "current.titulo"
            }
          }
        }
      },
      expected: {
        uno: 1,
        unoCopy: 1,
        dos: 2,
        saludo: "Hola",
        saludoNested: { titulo: "Hola" }
      }
    })
  })

  test("sibling", async () => {
    await expectResultsAsync({
      propiedades: {
        uno: 1,
        dos: {
          path: "siblings.uno"
        },
        tres: 3
      },
      expected: {
        uno: 1,
        dos: 1,
        tres: 3
      }
    })
  })

  test("basico", async () => {
    await expectResultsAsync({
      propiedades: {
        uno: 1,
        dos: 2,
        tres: 3
      },
      expected: {
        uno: 1,
        dos: 2,
        tres: 3
      }
    })
  })
})

describe("use", () => {

  const cases = [
    {
      use: "first",
      expected: "a"
    },
    {
      use: "last",
      expected: "c"
    }
  ]

  test.each(cases)("use %s", async ({ use, expected }) => {
    await expectToEqualAsync({
      store: {
        items: ["a", "b", "c"]
      },
      schema: {
        path: "items",
        use
      },
      expected,
      functions: {
        first: (array: any[]) => array[0],
        last: (array: any[]) => array[array.length - 1]
      }
    })
  })

})

test("sibling nested", async () => {
  const idCopy = {
    path: "siblings.id"
  }
  let id = 1

  await expectToEqualAsync({
    store: {},
    schema: {
      propiedades: {
        id: id++,
        idCopy,
        children: {
          propiedades: {
            id: id++,
            idCopy,
            children: {
              propiedades: {
                id: id++,
                idCopy
              }
            }
          }
        }
      }
    },
    expected: {
      id: 1,
      idCopy: 1,
      children: {
        id: 2,
        idCopy: 2,
        children: {
          id: 3,
          idCopy: 3
        }
      }
    }
  })
})

describe("sibling", () => {

  test("set value from a sibling property", async () => {
    await expectToEqualAsync({
      store: {},
      schema: {
        propiedades: {
          title: "One",
          value: 1,
          titleCopy: {
            path: "siblings.title"
          }
        }
      },
      expected: {
        title: "One",
        value: 1,
        titleCopy: "One"
      }
    })
  })

})

describe("spread", () => {

  const cases: Array<{ tipo: string, schema: Schema, expected: any }> = [
    {
      tipo: "simple",
      schema: {
        spread: {
          path: "dos"
        }
      },
      expected: {
        subUno: 1,
        subDos: 2
      }
    },
    {
      tipo: "con reduce",
      schema: {
        reduce: [
          {
            spread: {
              path: "dos"
            }
          },
          {
            spread: {
              path: "tres"
            }
          },
        ]
      },
      expected: {
        subUno: 1,
        subDos: 2,
        subTres: 3
      }
    }
  ]

  test.each(cases)("spread $tipo", async ({ schema, expected }) => {
    await expectToEqualAsync({
      store: {
        dos: {
          subDos: 2
        },
        tres: {
          subTres: 3
        }
      },
      schema,
      expected,
      initial: {
        subUno: 1
      }
    })
  })
})

describe("entries", () => {
  test("default key, value", async () => {
    await expectToEqualAsync({
      schema: {
        entries: true
      },
      initial: {
        nombre: "Melany",
        cedula: "9-123-456",
        fechaDeNacimiento: "18/09/2019"
      },
      expected: [
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
    })
  })
})

test("nested propiedades", async () => {

  const store = {
    objOne: {
      id: 1
    },
    objTwo: {
      id: 1
    },
    publicacion: {
      mensaje: "prueba"
    }
  }

  const schema: Schema = {
    propiedades: {
      mensajeRoot: {
        path: "publicacion.mensaje",
      },
      nested: {
        propiedades: {
          mensaje: {
            path: "publicacion.mensaje"
          },
          objectsIdsAreEqual: {
            path: "objOne.id",
            equals: {
              path: "objTwo.id"
            }
          }
        }
      }
    }
  }

  const expected = {
    mensajeRoot: "prueba",
    nested: {
      mensaje: "prueba",
      objectsIdsAreEqual: true
    }
  }

  await expectToEqualAsync({
    store,
    schema,
    expected
  })
})

describe("comparacion", () => {

  describe("equal: nombre en source (Melany)", () => {

    test.each([
      ["Melany", true],
      ["Fernando", false]
    ])('es igual a %s => %s', async (nombre: string, expected: boolean) => {

      await expectToEqualAsync({
        store: { nombre: "Melany" },
        schema: {
          path: "nombre",
          equals: nombre,
        },
        expected
      })
    })

  })

})

describe("array", () => {

  test.todo("groupJoin", () => {
    const caseObj = {
      name: "groupJoin",
      store: {},
      schema: {
        const: [
          {
            nameId: 1,
            nombre: "nombre",
          },
          {
            nameId: 2,
            nombre: "cedula",
          }
        ],
        groupJoin: {
          items: {
            const: [
              {
                nombre: "nombre",
                valor: "Melany"
              },
              {
                nombre: "nombre",
                valor: "Melany"
              }
            ]
          },
          match: {
            find: {
              path: "target.nombre",
              equals: {
                source: "item.nombre"
              }
            }
          }
        }
      },
      expected: [
        {
          item: {
            nameId: 1,
            nombre: "nombre",
          },
          group: {
            nombre: "nombre",
            valor: "Melany"
          }
        },
        {
          item: {
            nameId: 2,
            nombre: "cedula"
          },
          group: undefined
        }
      ]
    }
  })

  describe("mixed", () => {
    const cases = [
      {
        name: "map join dos",
        store: {},
        schema: { // 36 lineas
          const: [
            {
              nameId: 1,
              nombre: "nombre",
            },
            {
              nameId: 2,
              nombre: "cedula",
            }
          ],
          map: {
            init: {
              temp: {
                path: "current"
              }
            },
            spread: {
              const: [
                {
                  nombre: "nombre",
                  valor: "Melany"
                },
                {
                  nombre: "nombre",
                  valor: "Melany"
                }
              ],
              find: {
                path: "current.nombre",
                equals: {
                  path: "$temp.nombre"
                }
              }
            }
          }
        },
        expected: [
          {
            nameId: 1,
            nombre: "nombre",
            valor: "Melany"
          },
          {
            nameId: 2,
            nombre: "cedula"
          }
        ]
      }
    ]

    test.each(cases)("$name", async (caseArg: Case) => {
      await expectToEqualAsync(caseArg)
    })

  })

  describe("mixed 2", () => {
    const cases = [
      {
        name: "find",
        schema: {
          find: {
            path: "current.nombre",
            equals: "Melany"
          }
        },
        initial: [
          1,
          "dos",
          { nombre: "Mari" },
          { nombre: "Melany" }
        ],
        expected: { nombre: "Melany" }
      },
      {
        name: "some are true: from inner definition",
        store: {},
        schema: {
          const: {
            detalles: {
              nombre: "Melany",
              activo: true
            }
          },
          propiedades: {
            inner: {
              definitions: [
                false,
                {
                  path: "current.detalles.activo"
                },
                1
              ],
              contains: {
                equals: 1
              }
            }
          }
        },
        expected: {
          inner: true
        }
      },
      {
        name: "filtrar por nombre de item es igual nombre en source",
        store: { nombre: "Fernando" },
        schema: {
          const: Array(3).fill({ nombre: "Melany" }).toSpliced(1, 0, { nombre: "Fernando" }),
          filter: {
            path: "current.nombre",
            equals: {
              path: "nombre"
            }
          }
        },
        expected: [{ nombre: "Fernando" }]
      }
    ]

    test.each(cases)("$name", async (caseArg: Case) => {
      await expectToEqualAsync(caseArg)
    })

  })

  test("map join", async () => {
    const ids = [2, 3, 4].map(id => ({ id }))

    const schema = {
      const: [{ id: 1 }, ...ids],
      map: {
        init: {
          temp: {
            path: "current"
          }
        },
        spread: {
          const: [
            {
              id: 1,
              nombre: "Melany"
            }
          ],
          find: {
            path: "current.id",
            equals: {
              path: "$temp.id"
            }
          }
        }
      }
    }

    const expected = [{ id: 1, nombre: "Melany" }, ...ids]

    await expectToEqualAsync({
      store: {},
      schema,
      expected
    })
  })

  test("map", async () => {

    const numbers = [1, 2, 3, 4]

    await expectToEqualAsync({
      store: {},
      schema: {
        const: numbers,
        map: {
          propiedades: {
            id: {}
          }
        }
      },
      expected: numbers.map(id => ({ id }))
    })
  })

  describe("array item validation (source items are all equal to filterSchema)", () => {

    test.each([
      "all",
      "some"
    ])("%s equal -> true", async (method) => {

      const store = { nombre: "Melany" }

      await expectToEqualAsync({
        store,
        schema: {
          const: Array(2).fill(store),
          contains: {
            path: "current.nombre",
            equals: "Melany"
          }
        },
        expected: true
      })
    })

  })

  describe("all equal (sin itemSchema)", () => {

    test.each([
      ["const", { const: ["Melany", "Melany", "Melany"] }],
      ["path", { path: "items" }]
    ])("con definition %s", async (tipo, schema: Schema) => {

      await expectToEqualAsync({
        store: {
          items: []
        },
        schema: {
          ...schema,
          items: {
            equals: "Melany"
          }
        },
        expected: true
      })
    })

  })

  test("reduce: filtrar array y luego asignar a nuevo objeto con propiedad 'total' con valor de length", async () => {
    const melany = { nombre: "Melany" }
    const source = [melany, { nombre: "Fernando" }, melany, melany]

    await expectToEqualAsync({
      source,
      schema: {
        const: source,
        filter: {
          path: "current.nombre",
          equals: "Melany"
        },
        reduce: {
          propiedades: {
            total: {
              path: "current.length"
            }
          }
        }
      },
      expected: { total: source.length - 1 }
    })
  })

  describe.todo("orderBy", () => {
    const source = [
      [[2, 3, 8, 10].map(id => ({ id })), true],
      [[3, 2, 10, 8].map(id => ({ id })), false]
    ]

    test.each(source)("%o is ordered by id => %s", async (expectedItem, value) => {

      const schema: Schema = {
        const: [10, 2, 8, 3].map(id => ({ id })),
        // array: {
        //   orderBy: true
        // }
      }

      const resultados = await buildResultsAsync({ store: {}, schema })
      const expected = [expectedItem, expectedItem]

      value
        ? expect(resultados).toEqual(expected)
        : expect(resultados).not.toEqual(expected)
    })
  })
})

describe("mixed", () => {

  test.todo("reduce, orderBy and filter", async () => {
    const schema: Schema = {
      const: [3, 10, 2, 4, 1].map(id => ({ id, nombre: [4, 10].includes(id) ? "Melany" : "Fernando" })),
      reduce: [
        {
          // array: {
          //   orderBy: "id"
          // }
        },
        {
          // array: {
          //   filter: {
          //     path: "inner.nombre",
          //     comparacion: {
          //       method: "equal",
          //       schema: {
          //         path: "outer.source.nombre"
          //       }
          //     }
          //   }
          // }
        }
      ]
    }

    await expectToEqualAsync({
      store: { nombre: "Melany" },
      schema,
      expected: [4, 10].map(id => ({ id, nombre: "Melany" }))
    })
  })

  describe.todo("flat", () => {

    test("flat", async () => {
      await expectToEqualAsync({
        store: {},
        schema: {
          flat: true,
          propiedades: {
            propsA: {
              const: { nombre: "Melany" },
            }
          }
        },
        expected: { nombre: "Melany" }
      })
    })

    test("flat (path)", async () => {
      await expectToEqualAsync({
        store: {
          usuario: {
            personal: { nombre: "Melany" },
            direccion: { provincia: "Santiago" }
          }
        },
        schema: {
          flat: true,
          path: "usuario"
        },
        expected: { nombre: "Melany", provincia: "Santiago" }
      })
    })

  })

  describe("unpack", () => {
    const cases = [
      {
        name: "propiedades",
        store: {},
        schema: {
          propiedades: {
            nombre: "Melany",
            cedula: "9-123",
            id: 7
          },
          reduce: {
            unpack: ["nombre", "id"],
          }
        },
        expected: { nombre: "Melany", id: 7 }
      },
      {
        name: "const",
        store: {},
        schema: {
          const: {
            nombre: "Fernando",
            apellido: "Flores",
            id: 7
          },
          unpack: ["nombre", "id"],
        },
        expected: { nombre: "Fernando", id: 7 }
      },
      {
        name: "path",
        store: {
          usuario: { nombre: "Melany", id: 1, cedula: "9-123" }
        },
        schema: {
          unpack: ["nombre", "id"],
          path: "usuario"
        },
        expected: { nombre: "Melany", id: 1 }
      }
    ]

    test.each(cases)("$name", async ({ name, ...caseArg }) => {
      await expectToEqualAsync(caseArg)
    })
  })

})