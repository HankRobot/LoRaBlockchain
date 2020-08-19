import { PythonShell } from 'python-shell';

/*
let options: any = {
  mode: 'text',
  pythonPath: 'C:/Users/Hank Bot/Anaconda3/python.exe',
  pythonOptions: ['-u'], // get print results in real-time
  args: ['1']
};

let v: any;
let b: any;
let c: any;

PythonShell.run('my_script.py', options, function (err, results) {
  if (err) throw err;
  console.log(results)
});
*/
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
console.log("Receiver public keys", recipient.Q.getEncoded().toString('hex'));
console.log("Receiver scan key", scan.Q.toString())
// ... recipient reveals public key(s) (recipient.Q, scan.Q) to sender
var test = recipient.Q.getEncoded().toString('hex');
//console.log("Test", test)

var forSender = stealthDualSend(bigi.fromHex(recipient.d.toHex()),  ecurve.Point.decodeFrom(secp256k1,Buffer.from(test,"hex")), scan.Q)

//var forSender = stealthDualSend(nonce.d, ecurve.Point.decodeFrom(secp256k1,recipient.Q.getEncoded()), scan.Q)
console.log("recipient d before hex conversion:", recipient.d)
console.log("recipient d after hex conversion:", recipient.d.toHex())
console.log("recipient d retrieved", bigi.fromHex(recipient.d.toHex()))
//create the address for the receiver the check later, then the forrecipient will try to generate and check if its the same address


//assert.throws(function () { forSender.toWIF() }, /Error: Missing private key/)

// ... sender reveals nonce public key (nonce.Q) to scanner
var forScanner = stealthDualScan(scan.d, recipient.Q, recipient.Q)
//assert.throws(function () { forScanner.toWIF() }, /Error: Missing private key/)

// ... scanner reveals relevant transaction + nonce public key (nonce.Q) to recipient

var forRecipient = stealthDualReceive(scan.d, recipient.d, recipient.Q)
if (forSender.getAddress()===forRecipient.getAddress()) {
  console.log("Use this private key for the money", forRecipient.toWIF());
}
//assert.doesNotThrow(function () { forRecipient.toWIF() })

// scanner, sender and recipient, all derived same address
console.log(forSender.getAddress()===forScanner.getAddress())
console.log(forSender.getAddress()===forRecipient.getAddress())