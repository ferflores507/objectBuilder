import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'
import { buildResultsAsync, Case, expectToEqualAsync } from './buildResultsASync'
import { entry } from '../../src/helpers/varios'
import { ObjectBuilder } from '../../src/builders/ObjectBuilder'
import { Queue } from '../../src/helpers/Queue'
import { TaskBuilder } from '../../src/builders/TaskBuilder'
import { Schema } from '../../src/models'

describe("path or return", () => {
  test("expects text trimmed", async () => {
    await expectToEqualAsync({
      store: {
        text: " one "
      },
      schema: {
        pathOrReturn: "text",
        trim: true
      },
      expected: "one"
    })
  })

  test("expects undefined without throwing error", async () => {
    await expectToEqualAsync({
      schema: {
        pathOrReturn: "text",
        trim: true
      },
      expected: undefined
    })
  })
})

test("map reduce expect target null on non matches", async () => {
  await expectToEqualAsync({
    schema: {
      mapReduce: [
        {
          const: [
            {
              title: "Panameño",
              country: "pa"
            },
            {
              title: "Brasileño",
              country: "br"
            },
            {
              title: "American",
              country: "us"
            }
          ]
        },
        {
          leftKey: "country",
          key: "key",
          target: "country",
          items: {
            const: [
              {
                key: "pa",
                name: "Panamá"
              },
              {
                key: "us",
                name: "Usa"
              }
            ]
          }
        }
      ]
    },
    expected: [
      {
        title: "Panameño",
        country: {
          key: "pa",
          name: "Panamá"
        }
      },
      {
        title: "Brasileño",
        country: null
      },
      {
        title: "American",
        country: {
          key: "us",
          name: "Usa"
        }
      }
    ]
  })
})

describe("map async and promise all", () => {
  const initial = Array.from({ length: 2 })
  const builder = new ObjectBuilder().with({ initial })

  const cases = [
    {
      name: "reduce with last item with delay as schema",
      schema: {
        reduce: [
          {
            const: "Hola",
          },
          {
            delay: 50
          }
        ]
      },
      expected: initial.fill("Hola")
    },
    {
      name: "array as schema",
      schema: [
        {
          const: "Hola",
          reduce: {
            delay: 100,
          }
        },
        {
          path: "arg"
        }
      ],
      expected: initial.map(val => ["Hola", val])
    }
  ]

  describe.each(cases)("with $name", ({ schema, expected }) => {
    test("expect explicit await Promise.all of sync result to equal expected", async () => {
      const result = builder
        .with({ 
          schema: { 
            mapAsync: schema 
          }
        })
        .build()
  
      expect(await Promise.all(result)).toEqual(expected)
    })
  
    test("expect schema with promiseAll to equal expected", async () => {
      const result = await builder
        .with({
          schema: {
            promiseAll: {
              mapAsync: schema
            }
          }
        })
        .buildAsync()
  
      expect(result).toEqual(expected)
    })
  })
})

test("patch with preserver and replacer", async () => {
  await expectToEqualAsync({
    initial: [
      {
        id: 1,
        title: "one"
      },
      {
        id: 2,
      },
      {
        id: 3,
        title: "three"
      }
    ],
    schema: {
      patchWith: {
        value: {
          const: [
            {
              id: 1,
              title: "uno"
            },
            {
              id: 2,
              title: "   "
            },
            {
              id: 3,
              title: "tres",
              en: "three"
            }
          ]
        },
        preserver: {
          function: {
            path: "arg.title",
            reduceOrDefault: {
              trim: true
            }
          }
        },
        replacer: {
          function: {
            path: "arg.previousValue",
            spread: {
              propiedades: {
                title: {
                  path: "arg.newValue.title"
                }
              }
            }
          }
        }
      }
    },
    expected: [
      {
        id: 1,
        title: "uno",
      },
      {
        id: 3,
        title: "tres"
      }
    ],
  })
})

test("build propiedades with store as target", () => {
  const store = { count: 1 } as Record<string, any>

  const result = new ObjectBuilder()
    .with({
      store,
      schema: {
        propiedades: {
          $bind: {
            getters: {
              count: {
                path: "count"
              }
            }
          },
          initialCount: {
            path: "count",
          },
        }
      }
    })
    .build()

  const expected = {
    initialCount: 1,
    count: 1
  }

  expect(result).toMatchObject(expected)

  store.count = 2

  expect(result).toMatchObject({
    initialCount: 1,
    count: 2
  })
})

test("function with primitive", async () => {
  const fnSeven = new ObjectBuilder()
    .withSchema({ function: 7 })
    .build()

  expect(fnSeven()).toBe(7)
})

test("default null", async () => {
  await expectToEqualAsync({
    schema: {
      path: "not.found",
      default: null
    },
    expected: null
  })
})

describe("path from", () => {
  test("with array", async () => {
    await expectToEqualAsync({
      store: {
        details: {
          namePath: "current.name"
        }
      },
      schema: {
        const: {
          name: "Melany"
        },
        reduce: {
          pathFrom: ["details", "namePath"]
        }
      },
      expected: "Melany"
    })
  })
  
  test("with array 2", async () => {
    await expectToEqualAsync({
      store: {
        details: {
          namePath: "current.name"
        },
        rootPath: "details"
      },
      schema: {
        const: {
          name: "Melany"
        },
        reduce: {
          pathFrom: [
            {
              path: "rootPath"
            },
            {
              const: "namePath"
            }
          ]
        }
      },
      expected: "Melany"
    })
  })

  test("with string", async () => {
    await expectToEqualAsync({
      store: {
        namePath: "current.name"
      },
      schema: {
        const: {
          name: "Melany"
        },
        reduce: {
          pathFrom: "namePath"
        }
      },
      expected: "Melany"
    })
  })

})

describe("path with schema", () => {
  test("with nested path trim", async () => {
    await expectToEqualAsync({
      store: {
        user: {
          name: "Melany"
        },
        dirtyPath: "  user.name  "
      },
      schema: {
        path: {
          path: "dirtyPath",
          trim: true
        }
      },
      expected: "Melany"
    })
  })

  test("with definitions", async () => {
    await expectToEqualAsync({
      store: {
        user: {
          name: "Melany"
        },
        path1: "user",
        path2: "name"
      },
      schema: {
        path: {
          definitions: [
            {
              path: "path1"
            },
            {
              path: "path2"
            }
          ]
        }
      },
      expected: "Melany"
    })
  })
})

describe("map key value", () => {

  const expected = [
    { key: "one", value: 1 }, 
    { key: "two", value: 2 }
  ]

  test("with object", async () => {
    await expectToEqualAsync({
      schema: {
        mapKeyValue: {
          const: {
            one: 1,
            two: 2
          }
        }
      },
      expected
    })
  })

  test("with true", async () => {
    await expectToEqualAsync({
      schema: {
        const: {
          one: 1,
          two: 2
        },
        mapKeyValue: true
      },
      expected
    })
  })
})

describe("map reduce", () => {
  const catalog = {
    countries: {
      us: {
        name: "Usa",
        flag: "https://www.svgrepo.com/show/365950/usa.svg"
      },
      br: {
        name: "Brazil",
        flag: "https://www.svgrepo.com/show/401552/flag-for-brazil.svg"
      }
    },
    sportsDetails: {
      americanfootball_ncaaf: {
        country: "us"
      },
      soccer_brazil_campeonato: {
        country: "br"
      }
    },
    sports: [
      {
        key: "americanfootball_ncaaf",
        group: "American Football"
      },
      {
        key: "soccer_brazil_campeonato",
        group: "Soccer"
      }
    ],
    groups: [
      {
        key: "Soccer",
        titleEs: "Futbol",
        avatar: "https://www.svgrepo.com/show/484685/soccer-ball-illustration.svg"
      },
      {
        key: "American Football",
        titleEs: "Futbol Americano",
        avatar: "https://www.svgrepo.com/show/395762/american-football.svg"
      },
    ]
  }

  test("countries into sports details expects object", async () => {
    await expectToEqualAsync({
      schema: {
        mapReduce: [
          {
            const: catalog.sportsDetails
          },
          {
            target: "country",
            leftKey: "country",
            items: {
              const: catalog.countries
            }
          }
        ]
      },
      expected: {
        americanfootball_ncaaf: {
          country: {
            name: "Usa",
            flag: "https://www.svgrepo.com/show/365950/usa.svg"
          },
        },
        soccer_brazil_campeonato: {
          country: {
            name: "Brazil",
            flag: "https://www.svgrepo.com/show/401552/flag-for-brazil.svg"
          }
        }
      }
    })
  })

  test("objects with same keys expects objects merged", async () => {
    await expectToEqualAsync({
      schema: {
        mapReduce: [
          {
            const: {
              us: {
                name: "Usa"
              },
              br: {
                name: "Brazil"
              }
            }
          },
          {
            items: {
              const: {
                us: {
                  flag: "https://www.svgrepo.com/show/365950/usa.svg"
                },
                br: {
                  flag: "https://www.svgrepo.com/show/401552/flag-for-brazil.svg"
                }
              }
            }
          }
        ]
      },
      expected: catalog.countries
    })
  })

  test("expect arrays without key to be zipped", async () => {
    await expectToEqualAsync({
      schema: {
        mapReduce: [
          {
            const: [
              {
                name: "Usa"
              },
              {
                name: "Brazil"
              }
            ]
          },
          {
            items: {
              const: [
                {
                  flag: "https://www.svgrepo.com/show/365950/usa.svg"
                },
                {
                  flag: "https://www.svgrepo.com/show/401552/flag-for-brazil.svg"
                }
              ]
            }
          }
        ]
      },
      expected: Object.values(catalog.countries)
    })
  })

  test("expects object with property with value same as key merged into object", async () => {
    await expectToEqualAsync({
      schema: {
        mapReduce: [
          {
            const: {
              us: {
                name: "Usa"
              },
              br: {
                name: "Brazil"
              }
            }
          },
          {
            key: "key",
            items: {
              const: {
                us: {
                  key: "us",
                  flag: "https://www.svgrepo.com/show/365950/usa.svg"
                },
                br: {
                  key: "br",
                  flag: "https://www.svgrepo.com/show/401552/flag-for-brazil.svg"
                }
              }
            }
          }
        ]
      },
      expected: {
        us: {
          name: "Usa",
          key: "us",
          flag: "https://www.svgrepo.com/show/365950/usa.svg"
        },
        br: {
          name: "Brazil",
          key: "br",
          flag: "https://www.svgrepo.com/show/401552/flag-for-brazil.svg"
        }
      }
    })
  })

  test("expects object with key different than object key merged into object", async () => {
    await expectToEqualAsync({
      schema: {
        mapReduce: [
          {
            const: {
              us: {
                name: "Usa"
              },
              br: {
                name: "Brazil"
              }
            }
          },
          {
            key: "key",
            items: {
              const: {
                uno: {
                  key: "us",
                  flag: "https://www.svgrepo.com/show/365950/usa.svg"
                },
                dos: {
                  key: "br",
                  flag: "https://www.svgrepo.com/show/401552/flag-for-brazil.svg"
                }
              }
            }
          }
        ]
      },
      expected: {
        us: {
          name: "Usa",
          key: "us",
          flag: "https://www.svgrepo.com/show/365950/usa.svg"
        },
        br: {
          name: "Brazil",
          key: "br",
          flag: "https://www.svgrepo.com/show/401552/flag-for-brazil.svg"
        }
      }
    })
  })

  test("expect array merged into object", async () => {
    await expectToEqualAsync({
      schema: {
        mapReduce: [
          {
            const: {
              us: {
                name: "Usa"
              },
              br: {
                name: "Brazil"
              }
            }
          },
          {
            key: "key",
            items: {
              const: [
                {
                  key: "us",
                  flag: "https://www.svgrepo.com/show/365950/usa.svg"
                },
                {
                  key: "br",
                  flag: "https://www.svgrepo.com/show/401552/flag-for-brazil.svg"
                }
              ]
            }
          }
        ]
      },
      expected: {
        us: {
          name: "Usa",
          key: "us",
          flag: "https://www.svgrepo.com/show/365950/usa.svg"
        },
        br: {
          name: "Brazil",
          key: "br",
          flag: "https://www.svgrepo.com/show/401552/flag-for-brazil.svg"
        }
      }
    })
  })

  test("countries, sportDetails and sports (previous map object)", async () => {

    const result = await new ObjectBuilder()
      .with({
        store: catalog,
        schema: {
          mapReduce: [
            {
              path: "sports"
            },
            {
              leftKey: "key",
              items: {
                path: "sportsDetails"
              }
            },
            {
              leftKey: "country",
              target: "country",
              items: {
                path: "countries"
              }
            }
          ]
        },
      })
      .buildAsync()

    const expected = [
      {
        key: "americanfootball_ncaaf",
        group: "American Football",
        country: {
          name: "Usa",
          flag: "https://www.svgrepo.com/show/365950/usa.svg"
        }
      },
      {
        key: "soccer_brazil_campeonato",
        group: "Soccer",
        country: {
          name: "Brazil",
          flag: "https://www.svgrepo.com/show/401552/flag-for-brazil.svg"
        }
      }
    ]

    expect(result).toEqual(expected)
  })

  test("full catalog with nested map reduce", async () => {
    await expectToEqualAsync({
      store: catalog,
      schema: {
        mapReduce: [
          {
            path: "sports"
          },
          {
            key: "key",
            leftKey: "group",
            target: "group",
            items: {
              path: "groups"
            }
          },
          {
            leftKey: "key",
            items: {
              path: "sportsDetails"
            }
          },
          {
            target: "country",
            leftKey: "country",
            items: {
              path: "countries"
            }
          }
        ]
      },
      expected: [
        {
          key: "americanfootball_ncaaf",
          country: {
            name: "Usa",
            flag: "https://www.svgrepo.com/show/365950/usa.svg"
          },
          group: {
            titleEs: "Futbol Americano",
            key: "American Football",
            avatar: "https://www.svgrepo.com/show/395762/american-football.svg"
          }
        },
        {
          key: "soccer_brazil_campeonato",
          country: {
            name: "Brazil",
            flag: "https://www.svgrepo.com/show/401552/flag-for-brazil.svg"
          },
          group: {
            titleEs: "Futbol",
            key: "Soccer",
            avatar: "https://www.svgrepo.com/show/484685/soccer-ball-illustration.svg"
          }
        }
      ]
    })
  })
})

describe("validate", () => {
  const validate = [
    {
      path: "id",
      greaterThan: 6,
      lessThan: 8
    },
    {
      path: "name.length",
      greaterThan: 4,
      lessThan: 10
    }
  ]

  test("validate with explicit schema", async () => {
    await expectToEqualAsync({
      store: {
        id: 6,
        name: "Mel",
        age: 5
      },
      schema: {
        validate: {
          const: validate
        }
      },
      expected: validate
    })
  })

  test("validate returns array of failed schemas", async () => {
    await expectToEqualAsync({
      store: {
        id: 6,
        name: "Mel",
        age: 5
      },
      schema: {
        validate
      },
      expected: validate
    })
  })

  test("validate returns true", async () => {
    await expectToEqualAsync({
      store: {
        id: 7,
        name: "Melany",
        age: 5
      },
      schema: {
        validate
      },
      expected: true
    })
  })
  
})

describe("children schema", () => {
  const childrenSchema = {
    a: {
      setup: {
        init: {
          details: {
            const: {
              id: 1,
              name: "  one  " 
            }
          }
        }
      },
      schema: {
        const: "path a"
      },
      children: {
        a1: {
          schema: {
            path: "$details.name",
            trim: true
          }
        },
        a2: {
          schema: {
            path: "$details.name"
          }
        }
      }
    }
  }

  const a = childrenSchema.a

  const cases = [
    {
      path: ["a"],
      expected: [
        a.setup,
        a.schema
      ],
      expectedResult: "path a"
    },
    {
      path: ["a", "a1"],
      expected: [
        a.setup,
        a.children.a1.schema
      ],
      expectedResult: "one"
    },
    {
      path: ["a", "a2"],
      expected: [
        a.setup,
        a.children.a2.schema
      ],
      expectedResult: a.setup.init.details.const.name
    },
    {
      path: ["a", "a3"],
      expected: null,
      expectedResult: undefined
    },
    {
      path: ["a", "a2", "a21"],
      expected: null,
      expectedResult: undefined
    }
  ]

  test.each(cases)("children schema path: $path", async ({ path, expected, expectedResult }) => {
    const schema = {
      const: childrenSchema,
      childrenSchema: path
    }

    await expectToEqualAsync({ schema, expected })

    const result = new ObjectBuilder()
      .withSchema({ 
        reduce: new ObjectBuilder().withSchema(schema).build() 
      })
      .build()

    expect(result).toEqual(expectedResult)
  })
})

test("propiedades $bind", async () => {
  await expectToEqualAsync({
    store: {
      details: {
        id: 1,
        en: "one"
      }
    },
    schema: {
      propiedades: {
        $bind: {
          path: "details"
        }
      }
    },
    expected: {
      id: 1,
      en: "one"
    }
  })
})

test("merge by keys with empty array from is equals to mergeItemsWithSameKey", async () => {
  const source = [
    {
      id: 1,
      title: "Odd number",
      group: "odd"
    },
    {
      id: 2,
      title: "Even number",
      group: "even"
    },
    {
      id: 3,
      title: "Odd number",
      group: "odd"
    },
    {
      id: 4,
      en: "four"
    }
  ]

  const expected = [
    {
      id: 3,
      title: "Odd number",
      group: "odd"
    },
    {
      id: 2,
      title: "Even number",
      group: "even"
    },
    {
      id: 4,
      en: "four"
    }
  ]

  await expectToEqualAsync({
    schema: {
      const: [
        source,
        []
      ],
      mergeByKeys: "group"
    },
    expected
  })

  await expectToEqualAsync({
    schema: {
      const: source,
      mergeItemsWithSameKey: "group"
    },
    expected
  })
})

describe("expect merge by keys with id or true to equal the same", () => {

  test.each(["id", true])("merge by %s", async (val) => {
    await expectToEqualAsync({
      schema: {
        const: [
          [
            { 
              id: 1, 
              en: "one"
            }, 
            { 
              id: 3, 
              nombre: "tres" 
            }
          ],
          [
            { 
              id: 1, 
              nombre: "uno" 
            }, 
            { 
              id: 2, 
              en: "two" 
            }
          ]
        ],
        mergeByKeys: val
      },
      expected: [
        {
          id: 1,
          nombre: "uno",
          en: "one"
        },
        {
          id: 3,
          nombre: "tres"
        },
        {
          id: 2,
          en: "two"
        }
      ]
    })
  })

})

describe("merge by keys (string)", async () => {

  test.each(["num", "code"])("merge by %s", async (key) => {
    await expectToEqualAsync({
      schema: {
        const: [
          [
            { 
              [key]: 1, 
              en: "one"
            }, 
            { 
              [key]: 3, 
              nombre: "tres" 
            }
          ],
          [
            { 
              [key]: 1, 
              nombre: "uno" 
            }, 
            { 
              [key]: 2, 
              en: "two" 
            }
          ]
        ],
        mergeByKeys: key
      },
      expected: [
        {
          [key]: 1,
          nombre: "uno",
          en: "one"
        },
        {
          [key]: 3,
          nombre: "tres"
        },
        {
          [key]: 2,
          en: "two"
        }
      ]
    })
  })
})

test("merge by keys", async () => {
  await expectToEqualAsync({
    schema: {
      const: [
        [
          { 
            id: 1, 
            en: "one"
          }, 
          { 
            id: 3, 
            nombre: "tres" 
          }
        ],
        [
          { 
            codeId: 1, 
            nombre: "uno" 
          }, 
          { 
            codeId: 2, 
            en: "two" 
          }
        ]
      ],
      mergeByKeys: ["id", "codeId"]
    },
    expected: [
      {
        id: 1,
        codeId: 1,
        nombre: "uno",
        en: "one"
      },
      {
        id: 3,
        nombre: "tres"
      },
      {
        codeId: 2,
        en: "two"
      }
    ]
  })
})

describe("spread", () => {
  test("spread true on object just returns equals but not the same", async () => {
    const details = { id: 1 }
    const builder = new ObjectBuilder()
      .with({
        store: {
          details
        },
        schema: {
          path: "details",
          spread: true
        }
      })
  
    const detailsCopy = await builder.buildAsync()
  
    expect(details).not.toBe(detailsCopy)
    expect(details).toEqual(detailsCopy)
  })
  
  test("spread true on array spreads true value", async () => {
    await expectToEqualAsync({
      schema: {
        const: [true, false],
        spread: true
      },
      expected: [true, false, true]
    })
  })
})

test("expect keywords to be empty array when string is empty", async () => {
  await expectToEqualAsync({
    schema: {
      const: "",
      keywords: true
    },
    expected: []
  })
})

test("patch or add", async () => {
  await expectToEqualAsync({
    schema: {
      const: [
        {
          id: 1,
          en: "one"
        },
        {
          id: 3,
          en: "three"
        }
      ],
      patchOrAdd: {
        const: {
          id: 2,
          es: "dos"
        }
      }
    },
    expected: [
      {
        id: 1,
        en: "one",
      },
      {
        id: 3,
        en: "three"
      },
      {
        id: 2,
        es: "dos"
      }
    ],
  })
})

test("patch or add array", async () => {
  await expectToEqualAsync({
    schema: {
      const: [
        {
          id: 1,
          en: "one"
        },
        {
          id: 3,
          en: "three"
        }
      ],
      patchOrAdd: {
        const: [
          {
            id: 1,
            es: "uno"
          },
          {
            id: 2,
            es: "dos"
          }
        ]
      }
    },
    expected: [
      {
        id: 1,
        en: "one",
        es: "uno"
      },
      {
        id: 3,
        en: "three"
      },
      {
        id: 2,
        es: "dos"
      }
    ],
  })
})

test("expect patch with empty array to reject with object as error", async () => {
  const promise = expectToEqualAsync({
    schema: {
      const: [],
      patch: {
        const: {
          id: 1,
          title: "Uno"
        }
      }
    },
    expected: []
  })

  await expect(promise).rejects.toMatchInlineSnapshot(`
    {
      "array": [],
      "itemsNotFound": [
        {
          "id": 1,
          "title": "Uno",
        },
      ],
      "msg": "Unable to patch. One or more items were not found.",
    }
  `)
})

describe("prepend", () => {
  const prepend = "Hola "
  const options = {
    initial: "como estas",
    expected: "Hola como estas"
  }

  const cases = [
    {
      schema: {
        prepend
      },
      ...options
    },
    {
      schema: {
        and: { prepend }
      },
      ...options
    }
  ] as const

  test.each(cases)("expect initial: $initial $schema to equal $expected", async (options) => {
    await expectToEqualAsync(options)
  })
})

test("schema date", async () => {
  await expectToEqualAsync({
    schema: {
      const: new Date(2025, 2, 4, 18),
      date: {
        propiedades: {
          locale: "es-US",
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          weekday: 'short',
          hour: "numeric",
          minute: "numeric"
        }
      }
    },
    expected: "mar, 4 de mar de 2025, 6:00 p.m."
  })
})

test("expect toLocaleDateString to equal DateTimeFormat short month", () => {
  const date = new Date(2025, 2, 4, 18);
  const locale = "es-US";

  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: "numeric",
    minute: "numeric"
  }

  // dateStyle and timeStyle can be used with each other, but not with other date-time component options (e.g. 
  // weekday, hour, month, etc.).
  const options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: "short" };

  const result = date.toLocaleString(locale, formatOptions)

  expect(result).toEqual("mar, 4 de mar de 2025, 6:00 p.m.")
})

test("expect toLocaleDateString to equal DateTimeFormat", () => { 
  const date = new Date(2025, 2, 4, 18)
  const locale = 'es-US' 
  const options: Intl.DateTimeFormatOptions = { dateStyle: 'long', timeStyle: 'short' }
  
  const toLocaleResult = date.toLocaleString(locale, options)
  const dtfResult = new Intl.DateTimeFormat(locale, options).format(date);

  expect(dtfResult).toEqual(toLocaleResult)
  expect(toLocaleResult).toEqual("4 de marzo de 2025, 6:00 p.m.")
})

test("date format with es-US", () => {  
  const date = new Date(2025, 2, 4, 18)
  
  const dtf = new Intl.DateTimeFormat('es-US', { dateStyle: 'long', timeStyle: 'short' });
  const result = dtf.format(date);

  expect(result).toEqual("4 de marzo de 2025, 6:00 p.m.")
})

test("date format (strange character)", () => {  
  const date = new Date(2025, 2, 4, 18)
  
  const dtf = new Intl.DateTimeFormat('es-PA', { dateStyle: 'long', timeStyle: 'short' });
  const result = dtf.format(date);

  const strangeSection = result.slice(result.lastIndexOf("p"))
  const partialSplit = "4 de marzo de 2025, 6:00".split(" ")
  const expected = [...partialSplit, strangeSection]

  expect(result.split(" ")).toEqual(expected)
})

describe("format propiedades", () => {
  const schemas: Schema[] = [
    {
      path: "details",
      formatPropiedades: {
        propiedadesFunction: {
          nombre: {
            trim: true,
            removeAccents: true
          },
          keywords: {
            path: "arg.target.nombre",
            keywords: true
          },
          size: {
            and: {
              path: "arg.target.nombre.length",
            }
          },
          trimmed: {
            path: "arg.source.nombre.length",
            minus: {
              path: "arg.target.nombre.length"
            },
          }
        }
      }
    },
    {
      reduce: [
        {
          path: "details",
        },
        {
          init: {
            nombre: {
              path: "current.nombre",
              trim: true,
              removeAccents: true
            }
          }
        },
        {
          init: {
            trimmed: {
              path: "current.nombre.length",
              minus: {
                path: "$nombre.length"
              },
            }
          }
        },
        {
          spread: {
            propiedades: {
              nombre: {
                path: "$nombre"
              },
              keywords: {
                path: "$nombre",
                keywords: true
              },
              size: {
                path: "current.size",
                and: {
                  path: "$nombre.length"
                }
              },
              trimmed: {
                path: "$trimmed"
              }
            }
          }
        }
      ]
    }
  ]

  test.each(schemas)("format propiedades", async (schema) => {
    await expectToEqualAsync({
      store: {
        details: {
          id: 1,
          nombre: "  Mélany  ",
          lastName: "Flores",
          size: true
        }
      },
      schema,
      expected: {
        id: 1,
        nombre: "Melany",
        lastName: "Flores",
        keywords: ["melany"],
        size: 6,
        trimmed: 4
      }
    })
  })
})

test("patch with replacer", async () => {
  await expectToEqualAsync({
    initial: [
      {
        id: 1,
        en: "one"
      },
      {
        id: 2,
        en: "two"
      },
      {
        id: 3,
        en: "three"
      }
    ],
    schema: {
      patchWith: {
        value: {
          const: [
            {
              id: 1,
              es: "uno"
            },
            {
              id: 2,
              es: "dos"
            },
            {
              id: 3,
              es: "tres"
            }
          ]
        },
        replacer: {
          function: {
            if: {
              path: "arg.newValue.id",
              lessThan: 3
            },
            then: {
              path: "arg.previousValue",
              spread: {
                path: "arg.newValue"
              }
            },
            else: {
              path: "arg.previousValue"
            }
          }
        }
      }
    },
    expected: [
      {
        id: 1,
        en: "one",
        es: "uno"
      },
      {
        id: 2,
        en: "two",
        es: "dos"
      },
      {
        id: 3,
        en: "three"
      }
    ],
  })
})

describe("filter propiedades", () => {
  
  test("truthy value", async () => {
    await expectToEqualAsync({
      initial: { id: 0, name: "zero" },
      schema: {
        filterPropiedades: {
          path: "current"
        }
      },
      expected: { name: "zero" }
    })
  })

  test("not null value", async () => {
    await expectToEqualAsync({
      initial: { id: 0, title: "", name: null },
      schema: {
        filterPropiedades: {
          isNull: false
        }
      },
      expected: { id: 0, title: "" }
    })
  })

  test("not empty value", async () => {
    await expectToEqualAsync({
      initial: { id: 0, title: "", details: [], items: [1] },
      schema: {
        filterPropiedades: {
          isNullOrEmpty: false
        }
      },
      expected: { id: 0, items: [1] }
    })
  })

  test("not empty value", async () => {
    await expectToEqualAsync({
      initial: { title: "", users: [], items: [1] },
      schema: {
        filterPropiedades: {
          isNullOrEmpty: false
        }
      },
      expected: { items: [1] }
    })
  })

  test("is null or empty", async () => {
    await expectToEqualAsync({
      initial: { id: 0, title: null, details: [], items: [1] },
      schema: {
        filterPropiedades: {
          isNullOrEmpty: true
        }
      },
      expected: { title: null, details: [] }
    })
  })

  test("is null or empty", async () => {
    await expectToEqualAsync({
      initial: { id: undefined, title: "", users: [], items: [1] },
      schema: {
        filterPropiedades: {
          isNullOrEmpty: true
        }
      },
      expected: { id: undefined, title: "", users: [] }
    })
  })

})

describe("is null or empty", () => {

  const cases = [
    {
      initial: undefined,
      condition: true,
      expected: true
    },
    {
      initial: null,
      condition: true,
      expected: true
    },
    {
      initial: {},
      condition: true,
      expected: true
    },
    {
      initial: [],
      condition: true,
      expected: true
    },
    {
      initial: { id: 1 },
      condition: true,
      expected: false
    },
    {
      initial: [1],
      condition: true,
      expected: false
    },
    {
      initial: {},
      condition: false,
      expected: false
    },
    {
      initial: [],
      condition: false,
      expected: false
    },
    {
      initial: { id: 1 },
      condition: false,
      expected: true
    },
    {
      initial: [1],
      condition: false,
      expected: true
    },
  ] as const

  test.each(cases)("expect is null or empty", async ({ initial, condition, expected }) => {
    await expectToEqualAsync({
      initial,
      schema: {
        isNullOrEmpty: condition
      },
      expected
    })
  })
})

describe("is empty", () => {

  const cases = [
    [
      {}, 
      true
    ],
    [
      { id: 1 },
      false
    ],
    [
      { id: undefined }, 
      false
    ]
  ] as const

  describe.each(cases)("expect is empty", (initial, expected) => {
    test.each([true, false])("", async isEmpty => {
      await expectToEqualAsync({
        initial,
        schema: {
          isEmpty
        },
        expected: expected === isEmpty
      })
    })
  })
})

describe("isNull", () => {
  const cases = [
    undefined,
    null,
    NaN,
    false,
    true,
    0,
    1,
    "",
    " ",
    "0",
    "2",
    {},
    [],
    [1, 2]
  ]

  describe.each(cases)("expect is null", initial => {
    test.each([true, false])("equals %s", async isNull => {
      await expectToEqualAsync({
        initial,
        schema: {
          isNull
        },
        expected: (initial == null) === isNull
      })
    })
  })
})

test("set array path", async () => {
  await expectToEqualAsync({
    store: {
      key: "nombre"
    },
    schema: {
      set: [
        {
          definitions: [
            "detalles",
            "usuario",
            { 
              path: "key"
            }
          ]
        },
        "Melany"
      ],
      reduce: {
        path: "detalles.usuario.nombre"
      }
    },
    expected: "Melany"
  })
})

test("set single propiedades", async () => {
  await expectToEqualAsync({
    schema: {
      set: {
        nombre: "Melany"
      },
      reduce: {
        path: "nombre"
      }
    },
    expected: "Melany"
  })
})

test("set multiple propiedades", async () => {
  await expectToEqualAsync({
    schema: {
      set: {
        nombre: "Melany",
        "details.id": 1
      },
      reduce: {
        definitions: [
          {
            path: "nombre"
          },
          {
            path: "details.id"
          }
        ]
      }
    },
    expected: ["Melany", 1]
  })
})

describe("debounce", function () {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  describe("function call", () => {
    const schemas: Schema[] = [
      {
        debounce: {
          function: {
            set: {
              nombre: {
                path: "arg"
              }
            }
          }
        }
      },
      {
        function: {
          set: {
            nombre: {
              path: "arg"
            }
          }
        },
        debounce: true
      },
      {
        debounceWith: {
          ms: 1000,
          function: {
            set: {
              nombre: {
                path: "arg"
              }
            }
          }
        }
      },
      {
        reduce: [
          {
            set: [
              "setNombre",
              {
                function: {
                  set: {
                    nombre: {
                      path: "arg"
                    }
                  }
                }
              }
            ]
          },
          {
            debounceWith: {
              ms: 1000,
              target: {
                path: "setNombre"
              }
            }
          }
        ]
      }
    ]

    it.each(schemas)("expects function call to set arg as 'store.nombre' value", schema => {
      const builder = new ObjectBuilder().with({ schema })
      const debounceSet = builder.build()
  
      debounceSet("Melany")
      
      vi.runAllTimers()
  
      expect(builder.options.store.nombre).toBe("Melany")
    })
  })

  const cases = [true, 300, 1000] as const
  
  test.each(cases)("expects function with debounce: %s to be called one time", (debounce) => {
    const builder = new ObjectBuilder()
      .with({
        store: {
          total: 0
        },
        schema: {
          function: {
            increment: "total"
          },
          debounce
        }
      })

    const incrementTotal = builder.build()
  
    incrementTotal()
    incrementTotal()
    incrementTotal()

    const ms = debounce === true ? 500 : debounce

    vi.advanceTimersByTime(ms - 1)
    
    expect(builder.options.store.total).toBe(0)

    vi.advanceTimersByTime(2)

    expect(builder.options.store.total).toBe(1)
  })
})

test("with logical and after comparison", async () => {
  await expectToEqualAsync({
    schema: {
      const: 7,
      greaterThan: 5,
      lessThan: 10,
      and: "ok"
    },
    expected: "ok"
  })
})

describe("logical", () => {
  const initialValues = [true, {}, [], 1, "0", "false", undefined, null, NaN, false, 0, ""]

  describe.each(["and", "or"])("with logical (%s)", andOr => {
    const values = initialValues.map(v => [v, andOr === "and" ? v && "ok" : v || "ok"])
    
    test.each(values)(`expect %s ${andOr} 'ok' to equal '%s'`, async (initial, expected) => {
      await expectToEqualAsync({
        initial,
        schema: { [andOr]: "ok" },
        expected
      })
    })
  })

})

describe("sort by", () => {
  test("sort by completed (boolean) then by completed (numeric) descending", async () => {
    const items = [...Array(6).keys()].map(i => i + 1)
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

test("propiedades with async call", async () => {

  const result = await new ObjectBuilder()
    .with({
      schema: {
        init: {
          getNum: {
            asyncFunction: {
              delay: 50,
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

test("definitions with async call works", async () => {

  const result = await new ObjectBuilder()
    .with({
      schema: {
        init: {
          getNum: {
            asyncFunction: {
              delay: 50,
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
      isKeywordsOf: ["tres", "dos", "uno"]
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
          container: ["1 - uno", "2 - dos", "3 - tres"],
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
    undefined,
    null,
    NaN,
    false,
    true,
    0,
    1,
    "",
    " ",
    "0",
    "2",
    {},
    []
  ]

  describe.each(cases)("expect boolean %o to equal %s", initial => {
    const schemas = [{ path: "current" }, true] as const

    test.each(schemas)("", async boolean => {
      await expectToEqualAsync({
        initial,
        schema: {
          boolean
        },
        expected: !!initial
      })
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
      const: ["a", "b", "c"].map((text, ix) => ({ id: ix + 1, text })),
      find: {
        path: "arg.text",
        equals: {
          path: "$search"
        }
      }
    },
    expected: { id: 2, text: "b" }
  })
})

test("with init returns previous", async () => {
  await expectToEqualAsync({
    schema: {
      const: 2,
      reduce: {
        init: {
          b: 3
        },
        plus: { // here current is still 2
          path: "$b"
        }
      }
    },
    expected: 5
  })
})

test("array spread start", async () => {
  await expectToEqualAsync({
    schema: {
      const: [2, 3],
      spreadStart: 1
    },
    expected: [1, 2, 3]
  })
})

describe.todo("array with", () => {
  const cases = [
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
})

describe("array patch throw and patch with key", () => {
  const casesThrow = [
    {
      const: {
        id: 6
      }
    },
    {
      const: [
        {
          id: 6
        },
        {
          id: 7
        }
      ]
    }
  ]

  test.each(casesThrow)("expect patch to throw when original item is not found", (patch) => {
    const builder = new ObjectBuilder()
      .with({
        schema: {
          const: [...Array(5).keys()].map(val => ({ id: val + 1 })),
          patch
        }
      })

    expect(() => builder.build()).toThrow()
  })

  const cases: Case[] = [
    {
      initial: [1, 2, 3].map(id => ({ testId: id, a: id, b: id })),
      schema: {
        patchWith: {
          key: "testId",
          value: {
            const: { testId: 2, b: "Dos" }
          }
        },
      },
      expected: [1, 2, 3].map(id => {
        return {
          testId: id,
          a: id,
          b: id === 2 ? "Dos" : id
        }
      })
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

  const obj = new ObjectBuilder()
    .with({
      store: {
        user
      },
      schema: {
        path: "user",
        unpackAsGetters: ["nombre", "id", "nombre", "id"]
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

describe("spread flat", () => {
  const schema = {
    const: [0, 1],
    spreadFlat: {
      const: [
        2,
        [3, 4],
        5,
        6
      ]
    }
  }

  const expected = [...Array(7).keys()]

  test("with simple schema", async() => {
    await expectToEqualAsync({ schema, expected })
  })

  test("with spread operator overwritten", async () => {
    await expectToEqualAsync({
      operators: {
        spread: (value, source) => {
          return [...value, ...source ]
        }
      },
      schema,
      expected
    })
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
        [method]: 2
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
    const result = await new ObjectBuilder()
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
    ]

    test.each(cases)("expects $join as value of join to be joined with $title", async ({ join, separator }) => {
      await expectToEqualAsync({
        schema: {
          const: values,
          join
        },
        expected: values.join(separator)
      })
    })
  })

  describe("with empty schema fails", () => {
    const cases = [",", ""].map(s => values.join(s))

    test.fails.each(cases)("fails to expect '%s'", async (expected) => {
      await expectToEqualAsync({
        schema: {
          const: values,
          join: {}
        },
        expected
      })
    })
  })
})

test("schema propiedades getter", () => {
  const store = {
    nombre: "Fernando"
  }

  const result = new ObjectBuilder()
    .with({
      store,
      schema: {
        getters: {
          titulo: {
            path: "nombre"
          }
        }
      },
    })
    .build()

  expect(result.titulo).toEqual("Fernando")

  store.nombre = "Melany"

  expect(result.titulo).toEqual("Melany")
})

describe("schema async function", async () => {
  const store = new ObjectBuilder()
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
  const builder = new ObjectBuilder()
    .with({
      schema: {
        function: {
          set: {
            nombre: {
              path: "arg"
            }
          }
        },
        bindArg: {
          const: "Melany"
        }
      },
    })

  const func = builder.build()

  func()

  expect(builder.get("nombre")).toEqual("Melany")
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
          useStore: {
            path: "stores.user"
          },
          schemaFrom: {
            path: "current"
          }
        },
        topUser: {
          useStore: {
            path: "stores.allUsers.0"
          },
          schemaFrom: {
            path: "current"
          }
        },
        mari: {
          useStore: {
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
        function: {
          propiedades: {
            id: {
              path: "arg"
            }
          }
        }
      },
      reduce: {
        filter: {
          path: "arg.id",
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
        function: {
          propiedades: {
            id: {
              path: "arg"
            }
          }
        }
      },
      reduce: {
        filter: {
          path: "arg.id",
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
        path: "arg",
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
        useFirst: (items: any[], builder: ObjectBuilder) => {
          builder.add(() => items[0])
        },
        useLast: (items: any[], builder: ObjectBuilder) => {
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

test.skip("nested stores with call to root store", async () => {
  const store = {}
  await expectToEqualAsync({
    store,
    schema: {
      set: {
        setName: {
          function: {
            set: {
              "store.name": {
                path: "arg"
              }
            }
          }
        }
      },
      reduce: {
        propiedades: {
          child: {
            useStore: {
              propiedades: {
                nombre: "Melany",
                setName: {
                  path: "setName"
                }
              }
            },
            reduce: {
              set: {
                updateName: {
                  function: {
                    call: {
                      setName: {
                        path: "nombre"
                      }
                    }
                  },
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
          set: {
            getName: {
              function: {
                path: "arg"
              },
            }
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
          set: {
            getName: {
              function: {
                path: "arg"
              },
            }
          },
          reduce: {
            call: ["getName", "name"]
          }
        },
        expected: "Melany"
      }
    )
  })

  test.fails("call to function that expects same arg fails with current as path", async () => {
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
            useStore: {
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
      useStore: {
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
  const expected = [...Array(3).keys()]
  await expectToEqualAsync({
    schema: expected.map((n): Schema => ({ delay: 50, reduce: { const: n } })),
    expected
  })
})

describe("withFunction", () => {
  test.fails.each([/* "arg", */ "current"])("expect function call to return array with arg", async (path) => {
    const func = new ObjectBuilder()
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
        filter: {
          path: "arg"
        }
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
          path: "arg",
          includes: {
            path: "$search"
          }
        }
      },
      expected: ["cinco"]
    }
  )
})

test("expect strings with length of current (array)", async () => {
  await expectToEqualAsync(
    {
      schema: {
        const: ["uno", "Melany", "tres", "cuatro", "cinco", "seis"],
        filter: {
          path: "current.length",
          equals: {
            path: "arg.length",
          }
        }
      },
      expected: ["Melany", "cuatro"]
    }
  )
})

test("map builder with undefined", async () => {
  const items = [1, undefined, 2, 3]
  const result = items.map(initial => {
    return new ObjectBuilder()
      .with({
        initial,
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

describe("includes", () => {

  const keywords = ["h", "o", "l", "a", "ho", "ol", "la", "hol", "ola", "hola"]

  test.each(keywords)("hola includes %s", async (keyword) => {
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

test("not", () => {
  const result = new ObjectBuilder()
    .withSchema({
      const: { activated: true },
      not: {
        path: "current.activated",
      }
    })
    .build()

  expect(result).toBe(false)
})

describe("array filter property 'keywords' contains string", () => {

  const items = [
    {
      keywords: ["Melany", "uno"]
    },
    {
      keywords: ["uno", "dos"]
    },
    {
      keywords: ["uno", "Melany"]
    },
    {
      keywords: ["tres", "cuatro"]
    }
  ]

  const cases = [
    {
      items,
      expected: items.filter(i => i.keywords.includes("Melany"))
    },
    {
      items: items.filter(i => i.keywords.includes("Melany") === false),
      expected: []
    }
  ]

  test.each(cases)("case", async ({ items, expected }) => {

    await expectToEqualAsync({
      store: {},
      schema: {
        const: items,
        filter: {
          path: "arg.keywords",
          includes: "Melany"
        }
      },
      expected
    })
  })

})

test("schema as value", async () => {
  const schema = {
    propiedades: {
      value: {
        path: "id"
      },
      nombre: "Melany"
    }
  }

  await expectToEqualAsync({
    schema: {
      schema
    },
    expected: schema
  })
})

test("spread item to array", async () => {
  const initial = [...Array(3).keys()]
  await expectToEqualAsync({
    schema: {
      const: initial,
      spread: 3
    },
    expected: [0, 1, 2, 3]
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

  const operations = ["increment", "decrement"] as const
  const store = { total: 7 }

  test.each(operations)("%s", async (operation) => {
    const schema = {
      [operation]: "total",
      reduce: {
        path: "total"
      }
    }
  
    const amount = operation === "increment" ? 1 : -1
    const builder = new ObjectBuilder().with({ store, schema })
    const expected = store.total + amount
    const results = [builder.build(), await builder.with({ schema}).buildAsync()]

    expect(results).toEqual([expected, expected + amount])
  })

})

describe("trim", () => {
  const cases = [
    "  hello   ",
    "  this is a test",
    "",
    "   "
  ]

  test.each(cases)("(%s).trim equals: (%s)", async initial => {
    await expectToEqualAsync({
      initial,
      schema: {
        trim: true
      },
      expected: initial.trim()
    })
  })
})

describe("isNullOrWhiteSpace (value)?", () => {
  // First 4 values are null or whitespace
  const cases = [
    "", 
    "   ", 
    null, 
    undefined,
    "ok", 
    1, 
    false, 
    true
  ].map((initial, ix) => ({ initial, expected: ix < 4 }))

  test.each(cases)("(%s): %s", async ({ initial, expected }) => {
    await expectToEqualAsync({
      initial,
      schema: {
        isNullOrWhiteSpace: true
      },
      expected
    })
  })
})

describe("not", () => {

  test("every item is opposite boolean", async () => {
    const initial = [
      true,
      false,
      false,
      true
    ]

    await expectToEqualAsync({
      initial,
      schema: {
        map: {
          function: {
            not: {
              path: "arg"
            }
          }
        }
      },
      expected: initial.map(x => !x)
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
    const schemas = [
      {
        const: false
      },
      {
        path: "activated"
      }
    ]

    test.each(schemas)("schema: $schema", async (schema) => {
      const store = { activated: false }
      const results = await buildResultsAsync({ store, schema })

      const resultsNot = await buildResultsAsync({
        store,
        schema: {
          not: schema
        }
      })

      const mergedResults = [...results.map(r => !r), ...resultsNot]

      expect(new Set(mergedResults).size).toBe(1)
    })
  })
})

describe("schema select", () => {

  test("multiple with max", async () => {
    await expectToEqualAsync({
      store: {},
      schema: {
        const: [1, 2],
        select: {
          multiple: true,
          max: 2,
          value: 3
        }
      },
      expected: [1, 2]
    })
  })

  test("multiple with value only", async () => {
    await expectToEqualAsync({
      store: {},
      schema: {
        const: [1, 2],
        select: {
          multiple: true,
          value: 3
        }
      },
      expected: [1, 2, 3]
    })

  })

  test("with value only, already containing an item and then reduce", () => {
    const schema: Schema = {
      set: [
        "items",
        {
          const: [4],
          select: {
            value: 3
          },
        }
      ],
      reduce: { // same without reduce
        path: "items"
      }
    }

    const result = new ObjectBuilder()
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
          value: 3
        }
      },
      expected: [3]
    })
  })

})

describe("if schema", () => {

  describe("if is invalid then 'ok' or 'invalid'", () => {

    const [ok, invalid] = ["ok", "invalid"]
    const cases = [1, 2, 3].map(num => [num, num % 2 == 0 ? ok : invalid] as const)
  
    test.each(cases)("if %d % 2 == 0 %s", async (id, expected) => {
      const store = { isValid: id % 2 == 0 }
  
      await expectToEqualAsync({
        store,
        schema: {
          if: "isValid",
          then: ok,
          else: invalid
        },
        expected
      })
      
      await expectToEqualAsync({
        store,
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
  
      await expectToEqualAsync({
        store,
        schema: {
          if: {
            path: "isValid"
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

  test("if with current", async () => {
    await expectToEqualAsync({
      schema: {
        const: 2,
        if: {
          const: 1,
          lessThan: 3,
        },
        then: {
          path: "current"
        },
        else: "error"
      },
      expected: 2
    })
  })
})

test("getPathValue throws on null source", () => {
  const source = null

  expect(() => entry(source!).get("test")).toThrow()
})

describe("select", () => {
  const store = { selected: [2] }

  const cases = [
    { selected: [3] },
    { selected: [] }
  ]

  test.each(cases)("select value", ({ selected }) => {
    const resultado = new ObjectBuilder()
      .with({
        store,
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
            function: {
              path: "arg",
              spread: {
                init: {
                  temp: {
                    path: "current"
                  }
                },
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
                  path: "arg.nombre",
                  equals: {
                    path: "$temp.nombre"
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
            path: "arg.nombre",
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
        name: "find with array as value expects first boolean value",
        schema: {
          find: [
            "",
            null,
            "0",
            3
          ]
        },
        expected: "0"
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
                path: "arg",
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
            path: "arg.nombre",
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

    await expectToEqualAsync({
      store: {},
      schema: {
        const: [{ id: 1 }, ...ids],
        map: {
          function: {
            path: "arg",
            spread: {
              init: {
                temp: {
                  path: "current"
                }
              },
              const: [
                {
                  id: 1,
                  nombre: "Melany"
                }
              ],
              find: {
                path: "arg.id",
                equals: {
                  path: "$temp.id"
                }
              }
            }
          }
        }
      },
      expected: [{ id: 1, nombre: "Melany" }, ...ids]
    })
  })

  test("map", async () => {
    const initial = [1, 2, 3, 4]

    await expectToEqualAsync({
      schema: {
        const: initial,
        map: {
          function: {
            propiedades: {
              id: {
                path: "arg"
              }
            }
          }
        }
      },
      expected: initial.map(id => ({ id }))
    })
  })

  test("map with array", async () => {
    const initial = [1, 2, 3, 4]

    await expectToEqualAsync({
      schema: {
        const: initial,
        map: {
          function: [
            {
              path: "arg"
            },
            {
              path: "arg",
              plus: 1
            }
          ]
        }
      },
      expected: initial.map(id => [id, id + 1])
    })
  })

  test("map with empty array to return equal array", async () => {
    const array = [] as const
    const results = await  buildResultsAsync({
      schema: {
        const: array,
        map: {
          function: 1
        }
      }
    })

    expect(results).toEqual([array, array])
  })

  test("map with empty value fails", async () => {  
    const promise = buildResultsAsync({
      schema: {
        const: [...Array(3).keys()],
        map: {}
      }
    })

    await expect(promise).rejects.toThrow()
  })

  test("array contains", async () => {
    const match = { nombre: "Melany" }

    await expectToEqualAsync({
      store: match,
      schema: {
        const: [match, { one: 1 }],
        contains: {
          path: "arg.nombre",
          equals: {
            path: "nombre"
          }
        }
      },
      expected: true
    })
  })

  describe("all equal (sin itemSchema)", () => {
    const cases = [
      { const: ["a", "a", "a"] },
      { path: "items" }
    ] as const

    test.each(cases)("con definition %s", async (schema: Schema) => {

      await expectToEqualAsync({
        store: {
          items: []
        },
        schema: {
          ...schema,
          items: {
            path: "arg",
            equals: "a"
          }
        },
        expected: true
      })
    })

  })

  test("reduce: filtrar array y luego asignar a nuevo objeto con propiedad 'total' con valor de length", async () => {
    const melany = { nombre: "Melany" }
    const items = [melany, { nombre: "Fernando" }, melany, melany]

    await expectToEqualAsync({
      schema: {
        const: items,
        filter: {
          path: "arg.nombre",
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
      expected: { total: items.length - 1 }
    })
  })
})

describe("mixed", () => {
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