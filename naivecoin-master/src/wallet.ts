import {ec} from 'elliptic';
import {existsSync, readFileSync, unlinkSync, writeFileSync} from 'fs';
import * as _ from 'lodash';
import {getPublicKey, getTransactionId, signTxIn, Transaction, TxIn, TxOut, UnspentTxOut, safeStringify} from './transaction';
import * as Pedersen from 'simple-js-pedersen-commitment'
import {Hasher} from './lib/hasher';
import {PrivateKey} from './lib/private-key';
import {PublicKey} from './lib/public-key';
import {Prng} from './lib/prng';
import {Signature} from './lib/signature';

const PedersenCommitment = (amount:number): any =>{
    const pederson = new Pedersen(
        '925f15d93a513b441a78826069b4580e3ee37fc5',
        '959144013c88c9782d5edd2d12f54885aa4ba687'
    );
    let secret = '1184c47884aeead9816654a63d4209d6e8e906e29';
    //console.log(secret)

    const commitment = pederson.commit(amount.toString(), secret)
    //secret = pederson.newSecret();
    //console.log(secret)
    //const testB = pederson.commit('4', secret)

    //console.log(pederson.verify('5', [pederson.combine([testA, testB])], secret));
    //console.log('✅ pedersen tests passed')
    return [commitment,secret]
};

const EC = new ec('secp256k1');
const privateKeyLocation = process.env.PRIVATE_KEY || 'node/wallet/private_key';
const privateKeyLocation1 = process.env.PRIVATE_KEY || 'node/wallet/private_key1';
const privateKeyLocation2 = process.env.PRIVATE_KEY || 'node/wallet/private_key2';
const privateKeyLocation3 = process.env.PRIVATE_KEY || 'node/wallet/private_key3';
const privateKeyLocation4 = process.env.PRIVATE_KEY || 'node/wallet/private_key4';

//All ring keys are written here
const getRingPrivateFromWallet = (): string[] => {
    const buffer = [readFileSync(privateKeyLocation1, 'utf8'),
                    readFileSync(privateKeyLocation2, 'utf8'),
                    readFileSync(privateKeyLocation3, 'utf8'),
                    readFileSync(privateKeyLocation4, 'utf8')];
    return buffer;
};

const getRingPublicFromWallet = (): PublicKey[] => {
    const privateKey = getRingPrivateFromWallet();
    const hasher = new Hasher();
    const foreign_keys = [new PrivateKey(privateKey[1],hasher).public_key,
                          new PrivateKey(privateKey[2],hasher).public_key,
                          new PrivateKey(privateKey[3],hasher).public_key];
    //const key = EC.keyFromPrivate(privateKey, 'hex');
    //return key.getPublic().encode('hex');
    return foreign_keys;
};

const generateRingPrivateKey = (): PrivateKey => {
    //const keyPair = EC.genKeyPair();
    //const privateKey = keyPair.getPrivate();
    const privateKey = getRingPrivateFromWallet();
    const hasher = new Hasher();
    const key = new PrivateKey(privateKey,hasher);
    return key;
};
 
//Normal keys
const getPrivateFromWallet = (): string => {
    const buffer = readFileSync(privateKeyLocation, 'utf8');
    return buffer.toString();
};

const getPublicFromWallet = (): string => {
    const privateKey = getPrivateFromWallet();
    const key = EC.keyFromPrivate(privateKey, 'hex');
    return key.getPublic().encode('hex');
};

const generatePrivateKey = (): string => {
    const keyPair = EC.genKeyPair();
    const privateKey = keyPair.getPrivate();
    return privateKey.toString(16);
};

const initWallet = () => {
    // let's not override existing private keys
    if (existsSync(privateKeyLocation)) {
        return;
    }
    
    const newPrivateKey = generatePrivateKey();

    writeFileSync(privateKeyLocation, newPrivateKey);
    console.log('new wallet with private key created to : %s', privateKeyLocation);
};

const deleteWallet = () => {
    if (existsSync(privateKeyLocation)) {
        unlinkSync(privateKeyLocation);
    }
};

const getBalance = (address: string, unspentTxOuts: UnspentTxOut[]): number => {
    return _(findUnspentTxOuts(address, unspentTxOuts))
        .map((uTxO: UnspentTxOut) => uTxO.amount)
        .sum();
};

const findUnspentTxOuts = (ownerAddress: string, unspentTxOuts: UnspentTxOut[]) => {
    return _.filter(unspentTxOuts, (uTxO: UnspentTxOut) => uTxO.address === ownerAddress);
};

const findTxOutsForAmount = (amount: number, myUnspentTxOuts: UnspentTxOut[]) => {
    let currentAmount = 0;
    const includedUnspentTxOuts = [];
    for (const myUnspentTxOut of myUnspentTxOuts) {
        includedUnspentTxOuts.push(myUnspentTxOut);
        currentAmount = currentAmount + myUnspentTxOut.amount;
        if (currentAmount >= amount) {
            const leftOverAmount = currentAmount - amount;
            return {includedUnspentTxOuts, leftOverAmount};
        }
    }

    const eMsg = 'Cannot create transaction from the available unspent transaction outputs.' +
        ' Required amount:' + amount + '. Available unspentTxOuts:' + safeStringify(myUnspentTxOuts);
    throw Error(eMsg);
};

const createTxOuts = (receiverAddress: string, myAddress: string, amount, leftOverAmount: number) => {

    const txOut1: TxOut = new TxOut(receiverAddress, amount, PedersenCommitment(amount)[0], PedersenCommitment(amount)[1]);
    if (leftOverAmount === 0) {
        return [txOut1];
    } else {
        const leftOverTx = new TxOut(myAddress, leftOverAmount, PedersenCommitment(leftOverAmount)[0], PedersenCommitment(leftOverAmount)[1]);
        return [txOut1, leftOverTx];
    }
};

const filterTxPoolTxs = (unspentTxOuts: UnspentTxOut[], transactionPool: Transaction[]): UnspentTxOut[] => {
    const txIns: TxIn[] = _(transactionPool)
        .map((tx: Transaction) => tx.txIns)
        .flatten()
        .value();
    const removable: UnspentTxOut[] = [];
    for (const unspentTxOut of unspentTxOuts) {
        const txIn = _.find(txIns, (aTxIn: TxIn) => {
            return aTxIn.txOutIndex === unspentTxOut.txOutIndex && aTxIn.txOutId === unspentTxOut.txOutId;
        });

        if (txIn === undefined) {

        } else {
            removable.push(unspentTxOut);
        }
    }

    return _.without(unspentTxOuts, ...removable);
};

const createTransaction = (receiverAddress: string, amount: number, privateKey: string,
                           unspentTxOuts: UnspentTxOut[], txPool: Transaction[]): Transaction => {

    console.log('txPool: %s', safeStringify(txPool));
    const myAddress: string = getPublicKey(privateKey);
    const myUnspentTxOutsA = unspentTxOuts.filter((uTxO: UnspentTxOut) => uTxO.address === myAddress);

    const myUnspentTxOuts = filterTxPoolTxs(myUnspentTxOutsA, txPool);

    // filter from unspentOutputs such inputs that are referenced in pool
    const {includedUnspentTxOuts, leftOverAmount} = findTxOutsForAmount(amount, myUnspentTxOuts);

    const toUnsignedTxIn = (unspentTxOut: UnspentTxOut) => {
        const txIn: TxIn = new TxIn();
        txIn.txOutId = unspentTxOut.txOutId;
        txIn.txOutIndex = unspentTxOut.txOutIndex;
        return txIn;
    };

    const unsignedTxIns: TxIn[] = includedUnspentTxOuts.map(toUnsignedTxIn);

    const tx: Transaction = new Transaction();
    const foreign_keys = getRingPublicFromWallet();
    tx.txIns = unsignedTxIns;
    tx.txOuts = createTxOuts(receiverAddress, myAddress, amount, leftOverAmount);
    tx.id = getTransactionId(tx);

    tx.txIns = tx.txIns.map((txIn: TxIn, index: number) => {
        txIn.signature = signTxIn(tx, index, foreign_keys, unspentTxOuts);
        txIn.signaturestring = txIn.signature.getc_summation();
        return txIn;
    });
    return tx;
};

export {createTransaction, getPublicFromWallet,
    getPrivateFromWallet, getBalance, generatePrivateKey, initWallet, deleteWallet, findUnspentTxOuts,
    getRingPrivateFromWallet,getRingPublicFromWallet, generateRingPrivateKey,PedersenCommitment};