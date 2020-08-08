//Payer
var Stealth = require('stealth');

// you get this from the person you're going to pay (receiver)
var addr = 'vJmtuUb8ysKiM1HtHQF23FGfjGAKu5sM94UyyjknqhJHNdj5CZzwtpGzeyaATQ2HvuzomNVtiwsTJSWzzCBgCTtUZbRFpzKVq9MAUr';
var stealth1 = Stealth.fromString(addr);
console.log("Receiver Address: ", stealth1);
// single-use nonce key pair, works with CoinKey, bitcoinjs-lib, bitcore, etc
var senderkeypair = require('coinkey').createRandom();
console.log("Sender keypair: ", senderkeypair.publicKey);
// generate payment address
var payToAddress = stealth1.genPaymentAddress(senderkeypair.privateKey);
console.log("Payment Address: ", payToAddress);

var opreturnpubkey =stealth1.genPaymentPubKeyHash(scanKeyPair.privateKey);
// create transaction with two outputs:
// 1. Regular pay-to-pubkeyhash with `payToAddress` as recipient
// 2. OP_RETURN with `keypair.publicKey`

//Sender

// you need to scan every transaction and look for the following:
// 1. does the transaction contain an OP_RETURN?
// 2. if yes, then extract the OP_RETURN
// 3. is the OP_RETURN data a compressed public key (33 bytes)?
// 4. if yes, check if mine

// generate two key pairs, can use CoinKey, bitcoinjs-lib, bitcore, etc
var payloadKeyPair = require('coinkey').createRandom();
var scanKeyPair = require('coinkey').createRandom();

// note, the private keys are NOT encoded in the Stealth address
// you need to save them somewhere
var stealth2 = new Stealth({
  payloadPrivKey: payloadKeyPair.privateKey,
  payloadPubKey: payloadKeyPair.publicKey,
  scanPrivKey: scanKeyPair.privateKey,
  scanPubKey: scanKeyPair.publicKey
});

var addr1 = stealth2.toString();
// => 'vJmtuUb8ysKiM1HtHQF23FGfjGAKu5sM94UyyjknqhJHNdj5CZzwtpGzeyaATQ2HvuzomNVtiwsTJSWzzCBgCTtUZbRFpzKVq9MAUr'

// publish addr or give it someone
// unlike regular Bitcoin addresses, you can use
// stealth address as much as you like

// scan and decode transactions

var opReturnPubKey = opreturnpubkey;
var pubKeyHashWithPayment = payToAddress;

var keypair = stealth2.checkPaymentPubKeyHash(opReturnPubKey, pubKeyHashWithPayment);

// it NOT YOURS, `keypair` will be falsey

if (keypair == null) {
  console.log('payment is not mine');
} else {
  console.log('payment is mine');

  // redeem with `privKey`
  console.log(senderkeypair.privKey);
}