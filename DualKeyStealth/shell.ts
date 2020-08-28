import * as bigi from 'bigi'
import * as ecurve from 'ecurve'
import * as bitcoin from 'bitcoinjs-lib'
import * as math from 'mathjs'
var secp256k1 = ecurve.getCurveByName('secp256k1')
var G = secp256k1.G
var n = secp256k1.n

// vG = (rG \+ sha256(e * dG)G)
function stealthDualSend (e, R, Q) {
  var eQ = Q.multiply(e) // shared secret
  var c = bigi.fromBuffer(bitcoin.crypto.sha256(eQ.getEncoded()))
  var cG = G.multiply(c)
  var vG = new bitcoin.ECPair(null, R.add(cG))

  return vG
}

// vG = (rG \+ sha256(eG * d)G)
function stealthDualScan (d, R, eG) {
  var eQ = eG.multiply(d) // shared secret
  var c = bigi.fromBuffer(bitcoin.crypto.sha256(eQ.getEncoded()))
  var cG = G.multiply(c)
  var vG = new bitcoin.ECPair(null, R.add(cG))

  return vG
}

// v = (r + sha256(eG * d))
function stealthDualReceive (d, r, eG) {
  var eQ = eG.multiply(d) // shared secret
  var c = bigi.fromBuffer(bitcoin.crypto.sha256(eQ.getEncoded()))
  var v = new bitcoin.ECPair(r.add(c).mod(n))

  return v
}

// XXX: should be randomly generated, see next test for example
var recipient:any = bitcoin.ECPair.fromWIF('5KYZdUEo39z3FPrtuX2QbbwGnNP5zTd7yyr2SC1j299sBCnWjss') // private to recipient
var scan:any = bitcoin.ECPair.fromWIF('L5DkCk3xLLoGKncqKsWQTdaPSR4V8gzc14WVghysQGkdryRudjBM') // private to scanner/recipient
var nonce:any = bitcoin.ECPair.fromWIF('KxVqB96pxbw1pokzQrZkQbLfVBjjHFfp2mFfEp8wuEyGenLFJhM9') // private to sender

var forSender = stealthDualSend(nonce.d, recipient.Q, scan.Q)

var forScanner = stealthDualScan(scan.d, recipient.Q, nonce.Q)

var forRecipient = stealthDualReceive(scan.d, recipient.d, nonce.Q)

if (forSender.getAddress()===forRecipient.getAddress()) {
  console.log("Use this private key for the money", forRecipient.toWIF());
}
//assert.doesNotThrow(function () { forRecipient.toWIF() })

// scanner, sender and recipient, all derived same address
console.log(forSender.getAddress()===forScanner.getAddress())
console.log(forSender.getAddress()===forRecipient.getAddress())
