
export interface IArtifact {
    path: string
    url: string
    sha1: string
}

import { Resource } from '../downloader'
import { join } from 'path'

export class Artifact implements IArtifact {

    static resolve(_artifact: Partial<IArtifact>, _default: Partial<IArtifact> = { /* default */ }) {
        if (_artifact instanceof Artifact) {
            return _artifact
        } else {
            const { path: defaultPath = '/', sha1: defaultSHA1 = String(), url: defaultURL = '/' } = _default
            const {
                path: _path = defaultPath,
                sha1: _sha1 = defaultSHA1, url: _url = defaultURL } = _artifact

            return new Artifact(_url, _path, _sha1)
        }
    }

    static toResource(artifact: IArtifact, directory: string) {
        return new Resource(artifact.url, join(directory, artifact.path), artifact.sha1)
    }

    static isDownloadable(artifact: Partial<IArtifact>) {
        return !['url'].map(prop => prop in artifact).includes(false)
    } // checking required props

    static changeSHA1(artifact: Partial<IArtifact>, sha1: string) {
        artifact.sha1 = sha1
    }

    static changeURL(artifact: Partial<IArtifact>, url: string) {
        artifact.url = url
    }

    static changePath(artifact: Partial<IArtifact>, path: string) {
        artifact.path = path
    }

    constructor(readonly url: string, readonly path: string, readonly sha1: string) { }

    changeSHA1(sha1: string) {
        Artifact.changeSHA1(this, sha1)
        return this
    }

    changeURL(url: string) {
        Artifact.changeURL(this, url)
        return this
    }

    changePath(path: string) {
        Artifact.changePath(this, path)
        return this
    }

    toResource(directory: string) {
        return Artifact.toResource({ ...this }, directory)
    }

} // resolved artifact
