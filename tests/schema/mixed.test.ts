import { describe, expect, test } from 'vitest'
import { buildResultsAsync, Case, expectToEqualAsync } from './buildResultsASync'
import { PropiedadesBuilder } from '../../src/builders/PropiedadesBuilder'
import { getPathValue } from '../../src/helpers/varios'
import { SchemaTaskResultBuilder } from '../../src/builders/SchemaTaskResultBuilder'
import { ArrayBuilder } from '../../src/builders/ArrayBuilder'
import { Schema } from '../..'
import { Queue } from '../../src/helpers/Queue'
import { TaskBuilder } from '../../src/builders/TaskBuilder'

test("redefine getter with same name and value access", () => {
  const obj = { nombreInicial: "Melany" }

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
  const obj = {}

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
  const obj = {}

  Object.defineProperty(obj, "nombre", {
    configurable: true,
    get: () => "Melany"
  })

  Object.defineProperty(obj, "nombre", {
    value: "Fer"
  })

  expect(obj.nombre).toEqual("Fer")
})

test("object with function to set sibling", () => {
  const obj = new SchemaTaskResultBuilder()
    .with({
      schema: {
        propiedades: {
          nombre: {
            const: "Melany"
          },
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
          titulo: {
            const: titulo
          },
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
          import: "current"
        },
        topUser: {
          store: {
            path: "stores.allUsers.0"
          },
          import: "current"
        },
        mari: {
          store: {
            const: {
              nombre: "Mari",
              cedula: "9-750-104"
            }
          },
          import: "current"
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

test("map then filter from target", async () => {
  await expectToEqualAsync({
    schema: {
      propiedades: {
        search: {
          const: 1
        },
        items: {
          const: Array.from(Array(3).keys()),
          map: {
            propiedades: {
              id: {
                path: "current"
              }
            }
          },
        }
      },
      reduce: {
        path: "current.items",
        filter: {
          source: {
            path: "target.search",
          },
          match: {
            path: "current.id",
            equals: {
              path: "source"
            }
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
          source: {
            const: 1,
          },
          match: {
            path: "current.id",
            equals: {
              path: "source"
            }
          }
        }
      }
    },
    expected: [{ id: 1 }]
  })
})

test("filter with match", async () => {
  await expectToEqualAsync({
    schema: {
      const: Array.from(Array(3).keys()),
      filter: {
        source: {
          const: 1,
        },
        match: {
          path: "current",
          equals: {
            path: "source"
          }
        }
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
                nombre: {
                  const: "Melany"
                },
                setName: {
                  path: "setName"
                }
              }
            },
            reduce: {
              set: "updateName",
              function: {
                path: "nombre",
                call: "setName"
              },
              reduce: {
                call: "updateName"
              }
            }
          }
        }
      }
    },
    expected: { child: "Melany"}
  })
})

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
          const: "Melany",
          call: "getName"
        }
      },
      expected: "Melany"
    }
  )
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
          nombre: {
            const: "Melany"
          }
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

test("equals with current properties", async () => {
  await expectToEqualAsync({
    schema: {
      path: "current.uno",
      equals: {
        path: "target.one"
      }
    },
    initial: {
      uno: 1,
      one: 1
    },
    expected: true
  })
})

test("equals with current properties", async () => {
  await expectToEqualAsync({
    schema: {
      const: {
        uno: 1,
        one: 1
      },
      reduce: {
        path: "current.uno",
        equals: {
          path: "target.one"
        }
      }
    },
    expected: true
  })
})

test("definitions async", async () => {
  await expectToEqualAsync({
    schema: {
      definitions: [1,2,3].map(n => ({ delay: 2000, reduce: { const: n } }))
    },
    expected: [1,2,3]
  })
})

test("withFunction", async () => {
  const functionValue = new SchemaTaskResultBuilder()
    .with({
      store: {
        nombre: "Melany"
      },
      schema: {
        function: {
          path: "nombre"
        }
      }
    }).build()

  expect(functionValue()).toEqual("Melany")
})

test("use with reduce", async () => {

  const sumar = ({ a, b } : { a: number, b: number }) => a + b

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

test.todo("reduceOrDefault with nested checkout", async () => {
  await expectToEqualAsync({
    schema: {
      const: " uno ",
      reduceOrDefault: {
        trim: true,
        checkout: {
          path: "target.length",
        }
      },
      reduce: {
        path: "target"
      }
    },
    expected: undefined
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

test("filter with source tres", async () => {
  await expectToEqualAsync(
    {
      schema: {
        const: ["tres", "dos", "cuatro"],
        filter: {
          source: {
            propiedades: {
              length: {
                path: "current.length"
              },
              sourceSchema: {
                schema: {
                  path: "current.length",
                  equals: {
                    path: "source.length"
                  }
                }
              }
            }
          },
          match: {
            schemaFrom: {
              path: "source.sourceSchema"
            }
          }
        }
      },
      expected: ["dos"]
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
        const: ["uno", "Melany", "tres", "cuatro", "cinco", "seis"],
        filter: {
          source: {
            path: "search",
            trim: true
          },
          match: {
            path: "current",
            includes: {
              path: "source"
            }
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
        filter: {
          source: {
            path: "current.length"
          },
          match: {
            path: "current.length",
            equals: {
              path: "source"
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
        target: 100,
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

test("target defined and const with undefined", async () => {
  await expectToEqualAsync({
    schema: {
      const: undefined,
    },
    expected: undefined,
    // initial: undefined, // stops failing
    target: 1
  })
})

test("map targetPath", async () => {

  await expectToEqualAsync({
    schema: {
      const: [1, 2, 3, 4],
      map: {
        path: "target"
      }
    },
    expected: [1, 1, 1, 1],
    target: 1
  })

})

describe("includes", () => {

  const keywords = ["h", "o", "l", "a", "ho", "ol", "la", "hol", "ola", "hola"]

  test.each(keywords)("includes", async (keyword) => {
    await expectToEqualAsync({
      schema: {
        const: "hola",
        includes: {
          const: keyword
        }
      },
      expected: true,
    })
  })

  test("with array", async () => {
    const schema = {
      path: "local.selectedItems",
      includes: {
        path: "target.id"
      }
    }
  
    await expectToEqualAsync({
      store: {
        local: {
          selectedItems: [1]
        }
      },
      schema,
      expected: true,
      target: { id: 1 }
    })
  })
})

test("path target", async () => {

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
    .with({
      target: { activated: true }
    })
    .withSchema({
      targetPath: "activated", 
      not: {
      }
    })
    .build()

  expect(result).toBe(false)
})

test("array builder with undefined schema", () => {
  const schema = {
    find: {
      path: "current.nombre",
      equals: {
        const: "Melany"
      }
    }
  }

  const target = [
    1, 
    "dos", 
    { nombre: "Mari" }, 
    { nombre: "Melany" }
  ]

  const builder = new SchemaTaskResultBuilder()
    .with({ 
      target: [
        1, 
        "dos", 
        { nombre: "Mari" }, 
        { nombre: "Melany" }
      ]
    })
    .withSchema(schema)
    // .build()

  const result = new ArrayBuilder(target, builder).build(schema)

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
          includes: {
            const: "Melany"
          }
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
        nombre: {
          const: "Melany"
        }
      }
    }
  }
  
  await expectToEqualAsync({
    store: {},
    schema,
    expected: schema.schema
  })
})

test("add", async () => {
  await expectToEqualAsync({
    store: {},
    schema: {
      const: [
        1, 2, 3
      ],
      add: {
        const: 4
      }
    },
    expected: [1, 2, 3, 4]
  })
})

test("UUID", async () => {
  const store = {}
  const schema: Schema = {
    UUID: true
  }
  
  await expect(buildResultsAsync({ store, schema })).resolves.not.toThrow()
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

    const expected = source.map(x => !x)

    await expectToEqualAsync({
      schema: {
        map: {
          not: {}
        }
      },
      target: [
        true,
        false,
        false,
        true
      ],
      expected
    })
  })

  test("propiedades", async () => {
    await expectToEqualAsync({
      store: {},
      schema: {
        propiedades: {
          activated: {
            not: {
              source: "activated"
            }
          }
        }
      },
      expected: {
        activated: true
      },
      sources: {
        activated: false
      }
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
        if: {
          path: "mod",
          equals: {
            const: 0
          }
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

  expect(() => getPathValue(source, "test")).toThrow()
})

describe("select", () => {
  const builder = new SchemaTaskResultBuilder()
    .with({ 
      store: {
        selected: [2]
      },
      target: { id: 3 }
    })

  const cases = [
    { selected: [3] },
    { selected: [] }
  ]

  test.each(cases)("select value", ({ selected }) => {
    const resultado = builder
      .with({ 
        schema: {
          targetPath: "id",
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

test.skip("stopPropiedades", async () => {
  const caseArg = {
    source: { 
      evaluatedTitle: "evaluated" 
    },
    schema: {
      propiedades: {
        uno: {
          const: 1
        },
        dos: {
          path: "not evaluated",
        },
        tres: {
          propiedades: {
            title: {
              path: "evaluatedTitle"
            },
            dos: {
              const: "not evaluated"
            },
          }
        },
      }
    }
  }
  const [result] = await buildResultsAsync(caseArg)
  const [resultWithStop] = await buildResultsAsync({
    ...caseArg,
    stopPropiedades: ["dos"]
  })

  const expected = {
    uno: 1,
    dos: {
      path: "not evaluated"
    },
    tres: {
      title: "evaluated",
      dos: {
        const: "not evaluated"
      }
    }
  }

  expect(result).not.toEqual(expected)
  expect(resultWithStop).toEqual(expected)
})

describe("propiedades builder", () => {

  type CaseOptions = {
    target?: any,
    source?: any,
    propiedades: Record<string, Schema>
    expected: Record<string, any>
  }

  const expectResultsAsync = async (options: CaseOptions) => {
    const { source, target, propiedades, expected } = options
    const builder = new SchemaTaskResultBuilder(target, { store: source })
    const propiedadesBuilder = new PropiedadesBuilder(propiedades, builder)
    const results = [propiedadesBuilder.build(), await propiedadesBuilder.buildAsync()]

    expect(results).toEqual([expected, expected])
  }

  test("target path", async () => {
    await expectResultsAsync({
      target: { detalles: { titulo: "Hola" } },
      propiedades: {
        uno: {
          const: 1
        },
        dos: {
          path: "siblings.uno"
        },
        tres: {
          const: 3
        },
        saludo: {
          targetPath: "detalles.titulo",
        },
        saludoNested: {
          targetPath: "detalles",
          propiedades: {
            titulo: {
              path: "current.titulo"
            }
          }
        }
      },
      expected: {
        uno: 1,
        dos: 1,
        tres: 3,
        saludo: "Hola",
        saludoNested: { titulo: "Hola" }
      }
    })
  })

  test("sibling", async () => {
    await expectResultsAsync({
      propiedades: {
        uno: {
          const: 1
        },
        dos: {
          path: "siblings.uno"
        },
        tres: {
          const: 3
        }
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
        uno: {
          const: 1
        },
        dos: {
          const: 2
        },
        tres: {
          const: 3
        }
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
        id: {
          const: id++
        },
        idCopy,
        children: {
          propiedades: {
            id: {
              const: id++
            },
            idCopy,
            children: {
              propiedades: {
                id: {
                  const: id++
                },
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
          title: {
            const: "One"
          },
          value: {
            const: 1
          },
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
        reduceMany: [
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
      target: {
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
      target: {
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

describe("calc", () => {

  test.each([
    ["sumar", 115],
    ["restar", 85],
    ["multiplicar", 5000],
    ["dividir", 2]
  ])("%s 100, 10, 5 da: %s", async (calc, expected) => {

    await expectToEqualAsync({
      store: {},
      schema: {
        const: [100, 10, 5],
        calc
      },
      expected
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
          equals: {
            const: nombre
          }
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
              targetPath: "nombre",
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
            checkout: {
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
                    targetPath: "nombre"
                  }
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
            equals: {
              const: "Melany"
            }
          }
        },
        target: [
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
                {
                  const: false
                },
                {
                  path: "current.detalles.activo"
                },
                {
                  const: false
                }
              ],
              contains: {
                equals: {
                  const: true
                }
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
        checkout: {
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
                targetPath: "id"
              }
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
            equals: {
              const: "Melany"
            }
          }
        },
        expected: true
      })
    })

  })

  describe("all equal (sin itemSchema)", () => {

    test.each([
      ["const", { const: ["Melany", "Melany", "Melany"] }],
      ["path", { path: "store.items" }]
    ])("con definition %s", async (tipo, schema: Schema) => {

      await expectToEqualAsync({
        store: { 
          store: { items: [] } 
        },
        schema: {
          ...schema,
          items: {
            equals: {
              const: "Melany"
            }
          }
        },
        expected: true
      })
    })

  })

  test("reduce: filtrar array y luego asignar length a propiedad total por medio de target", async () => {
    const melany = { nombre: "Melany" }
    const source = [melany, { nombre: "Fernando" }, melany, melany]

    await expectToEqualAsync({
      source,
      schema: {
        const: source,
        filter: {
          path: "current.nombre",
          equals: {
            const: "Melany"
          }
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
      reduceMany: [
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

  describe("checkout", () => {

    test("path", async () => {
      await expectToEqualAsync({
        store: { 
          detalles: { 
            personal: { nombre: "Melany" } 
          } 
        },
        schema: {
          path: "detalles.personal",
          checkout: {
            propiedades: {
              nombre: {
                targetPath: "nombre"
              }
            }
          }
        },
        expected: { nombre: "Melany" }
      })
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
            nombre: {
              const: "Melany",
            },
            cedula: {
              const: "9-123",
            },
            id: {
              const: 7
            }
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