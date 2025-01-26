import * as helpers from "../helpers/varios"
import { Schema } from "../models"

export class PlainResultBuilder {
    constructor(private target: any) {}

    build() {
        return this.target
    }

    withSchema(schema: Schema | undefined) {
        const {
            entries,
            unpack,
            stringify,
            parse,
            isNullOrWhiteSpace,
            trim,
            UUID,
            removeAccents
        } = schema ?? {}

        this.target = this
            .withRemoveAccents(removeAccents)
            .withEntries(entries)
            .withUnpack(unpack)
            .withStringify(stringify)
            .withParse(parse)
            .withIsNullOrWhiteSpace(isNullOrWhiteSpace)
            .withTrim(trim)
            .withUUID(UUID)
            .build()

        return this
    }

    withValue(callback: (value: any) => any) {
        this.target = callback(this.target)

        return this
    }

    withRemoveAccents(removeAccents: true | undefined) {
        return removeAccents
            ? this.withValue(helpers.removeAccents)
            : this
    }

    withStringify(stringify: true | undefined) {
        if(stringify) {
            this.target = JSON.stringify(this.target)
        }

        return this
    }

    withParse(parse: true | undefined) {
        if(parse) {
            this.target = JSON.parse(this.target as string)
        }

        return this
    }

    withUUID(uuid: true | undefined) {
        if(uuid) {
            this.target = crypto.randomUUID()
        }

        return this
    }

    withIsNullOrWhiteSpace(isNullOrWhiteSpace: boolean | undefined) {
        if(typeof(isNullOrWhiteSpace) == "boolean") {
            this.target = ((this.target as string ?? "").toString().trim() === "") === isNullOrWhiteSpace
        }

        return this
    }

    withTrim(trim: true | undefined) {
        if(trim) {
            this.target = (this.target as string).trim()
        }

        return this
    }

    withUnpack(keys: string[] | undefined) {
        if (keys) {
            const target = this.target as Record<string, object>
            
            this.target = keys.reduce((obj, key) => {
                return { ...obj, [key]: target[key] }
            }, {})
        }

        return this
    }

    withEntries(entries: true | undefined){
        if(entries){
          this.target = helpers.entries(this.target as {})
        }
  
        return this
      }
}