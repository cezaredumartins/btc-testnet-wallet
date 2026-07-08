const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const ecpairModule = require('ecpair');
const bip39 = require('bip39');
const { BIP32Factory } = require('bip32');

// Compatibilidade com ecpair v2.x (export default) e v1.x
const ECPairFactory = ecpairModule.default || ecpairModule;
const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);

const network = bitcoin.networks.testnet;

class TestnetWallet {
  constructor(mnemonic = null) {
    if (!mnemonic) {
      this.mnemonic = bip39.generateMnemonic();
    } else {
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Frase mnemônica inválida');
      }
      this.mnemonic = mnemonic;
    }

    this.seed = bip39.mnemonicToSeedSync(this.mnemonic);
    this.masterKey = bip32.fromSeed(this.seed, network);
    this.account = this.masterKey.derivePath("m/44'/1'/0'");
  }

  getMnemonic() {
    return this.mnemonic;
  }

  getDepositAddress(index = 0) {
    const child = this.account.derive(0).derive(index);
    const { address } = bitcoin.payments.p2pkh({
      pubkey: child.publicKey,
      network,
    });
    return {
      address,
      path: `m/44'/1'/0'/0/${index}`,
      index,
    };
  }

  getDepositAddresses(count = 5, startIndex = 0) {
    const addresses = [];
    for (let i = 0; i < count; i++) {
      addresses.push(this.getDepositAddress(startIndex + i));
    }
    return addresses;
  }

  getPrivateKey(index, change = 0) {
    const child = this.account.derive(change).derive(index);
    return child.toWIF();
  }

  getKeyPair(index, change = 0) {
    const child = this.account.derive(change).derive(index);
    return ECPair.fromPrivateKey(child.privateKey, { network });
  }

  createTransaction(utxos, toAddress, amount, fee = 1000) {
    const psbt = new bitcoin.Psbt({ network });
    let totalInput = 0;

    for (const utxo of utxos) {
      if (!utxo.nonWitnessUtxo) {
        throw new Error('É necessário fornecer a transação anterior (nonWitnessUtxo) em hex para cada UTXO');
      }
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        nonWitnessUtxo: Buffer.from(utxo.nonWitnessUtxo, 'hex'),
      });
      totalInput += utxo.value;
    }

    psbt.addOutput({
      address: toAddress,
      value: amount,
    });

    const change = totalInput - amount - fee;
    if (change < 0) throw new Error('Fundos insuficientes');
    if (change > 0) {
      const changeAddr = this.getDepositAddress(utxos.length);
      psbt.addOutput({
        address: changeAddr.address,
        value: change,
      });
    }

    for (let i = 0; i < utxos.length; i++) {
      const keyPair = this.getKeyPair(utxos[i].index, 0);
      psbt.signInput(i, keyPair);
    }

    psbt.finalizeAllInputs();
    return psbt.extractTransaction().toHex();
  }
}

module.exports = TestnetWallet;