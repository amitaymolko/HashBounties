const scryptsy = require('scryptsy')
const ethUtil = require('ethereumjs-util')
const crypto = require('crypto')

function DecipherBuffer(decipher, data) {
    return Buffer.concat([decipher.update(data), decipher.final()])
}

const password = '1234567890'

const kdfparams = {
    dklen: 32,
    salt: "52d7e775c9b3a5d8ebf40e2be3be234707816a758b6eec1ba28c54a4b6cf63de",
    n: 8192,
    r: 8,
    p: 1
}

const ciphertextJs = '19af5e7a09875927cdec8900a5b4ce1e428b6746836586ea6838d1cf5a027115'
const macJs = '0994fb7a49c0f5f4b2c365e168f27701366acb3c326c11366b027eb96119140b'
// const iv = 'c7bb97d71c57458777502a569075717d'

let derivedKey = scryptsy(Buffer.from(password), Buffer.from(kdfparams.salt, 'hex'), kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen)
console.log('derivedKey.slice(16, 32)', derivedKey.slice(16, 32))
// console.log('derivedKey', derivedKey)

let ciphertext = Buffer.from(ciphertextJs, 'hex')
console.log('ciphertext', ciphertext)

let mac = ethUtil.sha3(Buffer.concat([derivedKey.slice(16, 32), ciphertext]))
if (mac.toString('hex') !== macJs) {
    throw new Error('Key derivation failed - possibly wrong passphrase')
}

// let HashBounties = crypto.createDecipheriv('aes-128-ctr', derivedKey.slice(0, 16), Buffer.from(iv, 'hex'))
// let seed = DecipherBuffer(Decipher, ciphertext, 'hex')
// console.log('seed', seed)


