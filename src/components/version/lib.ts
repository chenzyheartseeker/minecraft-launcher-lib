
import { Artifact, IArtifact } from './artifact'

export interface ILibraryDownloads {

    artifact: IArtifact

    /**
     * Like `javadoc`, `sources`, `natives-${os}` or `natives-${os}-${arch}`
     */
    classifiers?: { [name: string]: IArtifact }

}

type LibraryNatives = { [os: string]: string }

export class LibraryDownloads implements ILibraryDownloads {

    static resolve(_downloads: Partial<ILibraryDownloads>, _name: string, _natives: LibraryNatives, _repo: string = urls.DEFAULT_REPO_URL) {
        if (_downloads instanceof LibraryDownloads) {
            return _downloads
        } else {
            let downloads: LibraryDownloads

            {
                const _default = LibraryDownloads.artifactFromLibraryName(_name, _repo)
                const { artifact: _artifact = _default } = _downloads
                const _a = Artifact.resolve(_artifact, _default)
                downloads = new LibraryDownloads(_a, { /* classifiers */ })
            } // library artifact

            {
                const { classifiers = { /* classifier: artifact */ } } = _downloads

                const artifactFromLibraryName = (classifier: string) => {
                    return LibraryDownloads.artifactFromLibraryName(`${_name}:${classifier}`, _repo)
                }

                Object.entries(_natives).map(([os, classifier]) => {
                    return {
                        classifier,
                        // os,
                        include: classifier in classifiers
                    }
                }).filter(({ include }) => !include).forEach(({ classifier }) => {
                    // ! format classifier !
                    classifiers[classifier] = artifactFromLibraryName(classifier)
                })

                Object.entries(classifiers).forEach(([classifier, artifact]) => {
                    const _default = artifactFromLibraryName(classifier)
                    const _a = Artifact.resolve(artifact, _default)
                    return downloads.setArtifactForClassifier(classifier, _a)
                })
            } // classifiers

            return downloads
        }
    }

    /**
     * @param path It should look like `com.mojang:patchy:1.1`
     */
    static artifactFromLibraryName(name: string, repo: string = urls.DEFAULT_REPO_URL): Artifact {
        const splitted = name.split(':')
        {
            if (splitted.length >= 3) {
                const [group, artifact, version, ...extra] = splitted
                const classifier = extra.map(e => `-${e}`)
                const path = `${group.replace(/\./g, '/')}/${artifact}/${version}/${artifact}-${version.concat(...classifier)}.jar`

                return Artifact.resolve({
                    path,
                    url: `${repo}/${path}`
                })
            } else {
                return Artifact.resolve({ path: `${splitted.join('-')}.jar` })
            }
        }
    }

    constructor(readonly artifact: Artifact, readonly classifiers: { [name: string]: Artifact }) { }

    setArtifactForClassifier(classifier: string, artifact: IArtifact) {
        this.classifiers[classifier] = Artifact.resolve(artifact) // resolved classified artifact
    }

}

import { Rule, IRule, Features } from './rule'
import { currentPlatform, Platform, IPlatform, OS } from '../util'
import { urls } from '../../constants'

type LibraryExtract = { exclude: string[] }

export interface ILibrary {

    downloads: ILibraryDownloads

    /**
     * A maven name for library,
     * in form of `group:artifact:version`.
     */
    name: string

    natives: LibraryNatives

    rules: IRule[]

    extract: LibraryExtract

}

import { unpack } from '../util'
import { join } from 'path'
import { Argument } from './arg'

export class Library implements ILibrary {

    static resolve(_libs: Partial<ILibrary>[], _repo: string = urls.DEFAULT_REPO_URL) {
        return _libs.map(_lib => {
            if (_lib instanceof Library) {
                return _lib
            } else {
                if (!_lib.name) throw new Error('missing library name!')

                const {
                    name,
                    downloads = { /* artifact, classifiers */ } as Partial<ILibraryDownloads>,
                    extract = {
                        exclude: [
                            'META-INF/'
                        ]
                    },
                    rules = [],
                    natives = { /* `${os}`: `natives-${os}` or `natives-${os}-${arch}` */ }
                } = _lib

                return new Library(
                    name,
                    LibraryDownloads.resolve(downloads, name, natives, _repo),
                    natives,
                    extract,
                    Rule.resolve(rules)
                )
            }
        })
    }

    static extractNatives(library: ILibrary, platform: IPlatform, libsDirectory: string, nativesDirectory: string) {
        const [lib] = Library.resolve([library])
        const classifier = lib.getNativeClassifier(platform), { [classifier]: artifact } = lib.downloads.classifiers
        unpack(join(libsDirectory, artifact.path), nativesDirectory, lib.extract.exclude)
    }

    constructor(
        readonly name: string,
        readonly downloads: LibraryDownloads,
        readonly natives: LibraryNatives,
        readonly extract: LibraryExtract,
        readonly rules: Rule[]
    ) { }

    isApplicable(platform: Partial<IPlatform>, features: Features = { /* features */ }): boolean {
        return Rule.isAllowable(this.rules, platform, features)
    }

    hasNatives(os: OS = currentPlatform.name): boolean {
        return this.natives[os] ? true : false
    }

    getNativeClassifier(platform: Platform = currentPlatform): string {
        switch (platform.arch) {
            case 'x64': {
                return Argument.format(this.natives[platform.name], { arch: '64' })
            }
            default: {
                return Argument.format(this.natives[platform.name], { arch: '32' })
            } // x32 or other
        }
    }

}
