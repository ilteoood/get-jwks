'use strict'

const {test} = require('node:test')
const nock = require('nock')
const jwkToPem = require('jwk-to-pem')

const { jwks, domain } = require('./constants')

const buildGetJwks = require('../src/get-jwks')

test(
  'if there is already a key in cache, it should not make a http request',
  async t => {
    const getJwks = buildGetJwks()
    const localKey = jwks.keys[0]
    const alg = localKey.alg
    const kid = localKey.kid

    getJwks.cache.set(`${alg}:${kid}:${domain}`, Promise.resolve(localKey))

    const publicKey = await getJwks.getPublicKey({ domain, alg, kid })
    const jwk = await getJwks.getJwk({ domain, alg, kid })
    t.assert.ok(publicKey)
    t.assert.ok(jwk)
    t.assert.equal(publicKey, jwkToPem(jwk))
    t.assert.equal(jwk, localKey)
  }
)

test(
  'if initialized without any cache settings it should use default values',
  async t => {
    nock('https://localhost/').get('/.well-known/jwks.json').reply(200, jwks)
    const getJwks = buildGetJwks()
    const cache = getJwks.cache
    const [{ alg, kid }] = jwks.keys
    const publicKey = await getJwks.getPublicKey({ domain, alg, kid })
    const jwk = await getJwks.getJwk({ domain, alg, kid })

    t.assert.ok(publicKey)
    t.assert.ok(jwk)
    t.assert.ok(getJwks.cache)
    t.assert.equal(cache.max, 100)
    t.assert.equal(cache.ttl, 60000)
  }
)
