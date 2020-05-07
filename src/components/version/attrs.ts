
import { Artifact, IArtifact } from './artifact'
import { Argument, IArgument } from './arg'

export interface IVersionDownloads {
    client: IArtifact
    // server: IArtifact
}

export class VersionDownloads implements IVersionDownloads {

    static resolve(downloads: Partial<IVersionDownloads>) {
        if (downloads instanceof VersionDownloads) {
            return downloads
        } else {
            if (!downloads.client) { throw new Error('missing client artifact in version downloads!') }
            // if (!downloads.server) { throw new Error('missing server artifact in version downloads!') }

            const { client, /* server */ } = downloads
            // const _server = Artifact.resolve(server, { path: 'server.jar' })
            const _client = Artifact.resolve(client, { path: 'client.jar' })

            return new VersionDownloads(_client /* _server */)
        }
    }

    constructor(readonly client: Artifact /* readonly server: Artifact */) { }

}

type VersionArgument = string | /* or */ Required<IArgument>

export interface IVersionArguments { game: VersionArgument[], jvm: VersionArgument[] }

export class VersionArguments implements IVersionArguments {

    static resolve(_args: Partial<IVersionArguments>) {
        if (_args instanceof VersionArguments) {
            return _args
        } else {
            const { game = [], jvm = [] } = _args

            const argResolver = (value: VersionArgument) => {
                switch (typeof value) {
                    case 'string': return Argument.fromString(value)
                    default: {
                        const [arg] = Argument.resolve([value])
                        return arg
                    }
                }
            }

            return new VersionArguments(game.map(argResolver), jvm.map(argResolver))
        }
    }

    static fromLegacyStringArguments(minecraftArguments: string) {
        const gameArgs = minecraftArguments.split(/\s/g).map(value => {
            return Argument.fromString(value)
        })

        return new VersionArguments(gameArgs /* defaultJvmArgs */)
    }

    constructor(readonly game: Argument[] = [], readonly jvm: Argument[] = []) { }

}

import { Library, ILibrary } from './lib'

export interface IVersion {
    id: string
    type: string
    assets: string
    downloads: IVersionDownloads
    arguments: IVersionArguments
    mainClass: string
    libraries: ILibrary[]
}

export class Version {

    static resolve(_attrs: Partial<IVersion>) {
        if (_attrs instanceof Version) {
            return _attrs
        } else {
            if (!_attrs.id) throw new Error('missing version id!')
            if (!_attrs.type) throw new Error('missing version type!')
            if (!_attrs.assets) throw new Error('missing version assets!')
            if (!_attrs.downloads) throw new Error('missing version downloads!')
            if (!_attrs.mainClass) throw new Error('missing version mainClass!')

            const {
                id,
                type,
                assets,
                downloads,
                arguments: args = { game: [], jvm: [] },
                libraries: libs = [],
                mainClass
            } = _attrs

            return new Version(
                id,
                type,
                assets,
                VersionDownloads.resolve(downloads),
                VersionArguments.resolve(args),
                Library.resolve(libs),
                mainClass
            )
        }
    }

    constructor(
        readonly id: string,
        readonly type: string,
        readonly assets: string,
        readonly downloads: VersionDownloads,
        readonly args: VersionArguments,
        readonly libs: Library[],
        readonly mainClass: string
    ) { }

}