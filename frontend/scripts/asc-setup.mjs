import { readFileSync } from 'fs'
import { createSign } from 'crypto'
import { request } from 'https'

const KEY_ID    = 'N82P3R4ADL'
const ISSUER_ID = 'b01fda7d-8f20-43d7-bc8e-de43880f0036'
const TEAM_ID   = '586TH89965'
const BUNDLE_ID = 'nl.robinzegers.tripsync'
const APP_NAME  = 'TripSync.'
const SKU       = 'nl.robinzegers.tripsync'

const key = readFileSync('C:/Users/robin/.apple/AuthKey_N82P3R4ADL.p8', 'utf8')

function makeToken() {
  const header  = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ iss: ISSUER_ID, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+1200, aud: 'appstoreconnect-v1' })).toString('base64url')
  const sign = createSign('SHA256')
  sign.update(header + '.' + payload)
  const sig = sign.sign({ key, dsaEncoding: 'ieee-p1363' }).toString('base64url')
  return header + '.' + payload + '.' + sig
}

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const token = makeToken()
    const opts = {
      hostname: 'api.appstoreconnect.apple.com',
      path,
      method,
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
    }
    const req = request(opts, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function main() {
  // 1. Register bundle ID
  console.log('\n=== 1. Registreer Bundle ID ===')
  let bundleIdRes = await api('GET', `/v1/bundleIds?filter[identifier]=${BUNDLE_ID}&limit=5`)
  let bundleIdData = bundleIdRes.body.data?.[0]
  if (bundleIdData) {
    console.log('Bundle ID al geregistreerd:', bundleIdData.id)
  } else {
    console.log('Bundle ID aanmaken...')
    const r = await api('POST', '/v1/bundleIds', {
      data: {
        type: 'bundleIds',
        attributes: { name: 'TripSync', identifier: BUNDLE_ID, platform: 'IOS' }
      }
    })
    if (r.status >= 400) {
      console.error('Fout bij aanmaken bundle ID:', JSON.stringify(r.body, null, 2).slice(0, 500))
      process.exit(1)
    }
    bundleIdData = r.body.data
    console.log('Bundle ID aangemaakt:', bundleIdData.id)
  }

  // 2. Check/create app in ASC
  console.log('\n=== 2. App aanmaken in App Store Connect ===')
  let appRes = await api('GET', `/v1/apps?filter[bundleId]=${BUNDLE_ID}`)
  let appData = appRes.body.data?.[0]
  if (appData) {
    console.log('App al aanwezig. ID:', appData.id, '| Naam:', appData.attributes.name)
  } else {
    console.log('App aanmaken...')
    const r = await api('POST', '/v1/apps', {
      data: {
        type: 'apps',
        attributes: {
          bundleId: BUNDLE_ID,
          name: APP_NAME,
          primaryLocale: 'nl-NL',
          sku: SKU,
          contentRightsDeclaration: 'DOES_NOT_USE_THIRD_PARTY_CONTENT',
        },
        relationships: {
          bundleId: { data: { type: 'bundleIds', id: bundleIdData.id } }
        }
      }
    })
    if (r.status >= 400) {
      console.error('Fout bij aanmaken app:', JSON.stringify(r.body, null, 2).slice(0, 1000))
    } else {
      appData = r.body.data
      console.log('App aangemaakt! ID:', appData.id)
    }
  }

  // 3. Check app store version
  if (appData) {
    console.log('\n=== 3. Check App Store versie ===')
    const vRes = await api('GET', `/v1/apps/${appData.id}/appStoreVersions?filter[platform]=IOS&limit=5`)
    const versions = vRes.body.data || []
    if (versions.length === 0) {
      console.log('Geen versie gevonden. Aanmaken...')
      const r = await api('POST', '/v1/appStoreVersions', {
        data: {
          type: 'appStoreVersions',
          attributes: { platform: 'IOS', versionString: '1.0' },
          relationships: { app: { data: { type: 'apps', id: appData.id } } }
        }
      })
      if (r.status >= 400) {
        console.error('Versie aanmaken mislukt:', JSON.stringify(r.body, null, 2).slice(0, 500))
      } else {
        console.log('Versie 1.0 aangemaakt! ID:', r.body.data.id)
      }
    } else {
      console.log('Versie(s):', versions.map(v => v.attributes.versionString + ' (' + v.attributes.appStoreState + ')').join(', '))
    }
  }

  console.log('\nKlaar!')
}

main().catch(e => { console.error(e); process.exit(1) })
