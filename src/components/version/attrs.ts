
import { Artifact, IArtifact } from './artifact'
import { Argument, IArgument } from './arg'

export interface IVersionDownloads {
    client: IArtifact
    // server: IArtifact
}

export class VersionDownloads implements IVersionDownloads {

    static resolve(_downloads: Partial<IVersionDownloads>) {
        if (_downloads instanceof VersionDownloads) {
            return _downloads
        } else {
            if (!_downloads.client) { throw new Error('missing client artifact in version downloads!') }
            // if (!downloads.server) { throw new Error('missing server artifact in version downloads!') }

            const { client: _client, /* server: _server */ } = _downloads
            // const server = Artifact.resolve(server, { path: 'server.jar' })
            const client = Artifact.resolve(_client, { path: 'client.jar' })

            return new VersionDownloads(client)
        }
    }

    constructor(readonly client: Artifact) { }

}

type VersionArgument = string | /* or */ Required<IArgument>

export interface IVersionArguments { game: VersionArgument[], jvm: VersionArgument[] }

export class VersionArguments implements IVersionArguments {

    static DEFAULT_JVM_ARGS: Argument[] = [
        new Argument([
            '-Dminecraft.launcher.brand=${launcher_name}'
        ]),
        new Argument([
            '-Dminecraft.launcher.version=${launcher_version}'
        ]),
        new Argument([
            '-Djava.library.path=${natives_directory}'
        ]),
        new Argument(['-cp', '${classpath}'])
    ]

    static resolve(_args: Partial<IVersionArguments>) {
        if (_args instanceof VersionArguments) {
            return _args
        } else {
            const { game = [], jvm = VersionArguments.DEFAULT_JVM_ARGS } = _args

            const argResolver = (value: VersionArgument) => {
                switch (typeof value) {
                    case 'string': {
                        return Argument.fromString(value)
                    }
                    default: {
                        const [arg] = Argument.resolve([value])
                        return arg
                    }
                }
            }

            return new VersionArguments(game.map(argResolver), jvm.map(argResolver))
        }
    }

    static fromLegacyArguments(minecraftArguments: string) {
        const gameArgs = minecraftArguments.split(/\s(?!\$)/g).map(value => Argument.fromString(value))
        return new VersionArguments(gameArgs)
    }

    constructor(readonly game: Argument[] = [], readonly jvm: Argument[] = VersionArguments.DEFAULT_JVM_ARGS) { }

}

import { Library, ILibrary } from './lib'
import { urls } from '../../constants'

export interface IVersion {
    id: string
    type: string
    assets: string
    downloads: IVersionDownloads
    arguments: IVersionArguments
    mainClass: string
    libraries: ILibrary[]
    assetIndex: IAssetIndexFile
    minecraftArguments?: string
}

interface IAssetIndexFile {
    id: string // like assets prop in version attrs
    url: string
    sha1: string
    totalSize: number
}

export class Version {

    static resolve(_attrs: Partial<IVersion>, _repo: string = urls.DEFAULT_REPO_URL) {
        if (_attrs instanceof Version) {
            return _attrs
        } else {
            if (!_attrs.assetIndex) throw new Error('missing version assetIndex!')
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
                arguments: args = { game: [], jvm: VersionArguments.DEFAULT_JVM_ARGS },
                libraries: libs = [],
                mainClass,
                assetIndex
            } = _attrs

            if (_attrs.minecraftArguments) {
                const { game, jvm } = VersionArguments.fromLegacyArguments(_attrs.minecraftArguments)
                args.game.push(...game), args.jvm.push(...jvm)
            }

            return new Version(
                id,
                type,
                assets,
                VersionDownloads.resolve(downloads),
                VersionArguments.resolve(args),
                Library.resolve(libs, _repo),
                assetIndex,
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
        readonly assetIndex: IAssetIndexFile,
        readonly mainClass: string
    ) { }

}
