
import { Rule, IRule, Features } from './rule'
import { IPlatform } from '../util'

export interface IArgument {

    /**
     * An argument or a list of args that is
     * added when condition is matched.
     */
    value: string[] | /* or */ string

    rules: IRule[]

}

export class Argument {

    static resolve(_args: Partial<IArgument>[]) {
        return _args.map(_arg => {
            if (_arg instanceof Argument) {
                return _arg
            } else {
                const { rules: _rules = [] } = _arg, value: string[] = []

                switch (typeof _arg.value) {
                    case 'string': {
                        value.push(_arg.value)
                        break
                    }
                    case 'object': {
                        if (_arg.value instanceof Array) {
                            value.push(..._arg.value)
                            break
                        }
                    }
                    default: {
                        throw new Error('argument value not string or string array')
                    }
                }

                return new Argument(value, Rule.resolve(_rules))
            }
        })
    }

    static fromString(value: string) {
        return new Argument(value.split(/\s/g))
    }

    static format(template: string, fields: Map<string, string>) {
        return template.replace(/\$\{(.*?)}/g, key => {
            return fields.get(key.substring(2).substring(0, key.length - 3)) ?? key
        })
    } // https://github.com/voxelum/minecraft-launcher-core-node/blob/3d5aa7a38cbc66cdfc9b9d68a8bdf4988905cb72/packages/core/launch.ts

    constructor(readonly value: string[], readonly rules: Rule[] = []) { }

    isApplicable(platform: Partial<IPlatform>, features: Features = { /* features */ }) {
        return Rule.isAllowable(this.rules, platform, features)
    }

    format(fields: Map<string, string>) {
        return this.value.map(value => Argument.format(value, fields))
    }

}
