const axios = require('axios');
const TestnetWallet = require('./wallet');

// Use a mesma frase gerada anteriormente
const MNEMONIC = 'ginger whisper enrich choice antenna since turkey gadget super sheriff labor trumpet'; // substitua
const wallet = new TestnetWallet(MNEMONIC);

async function getUtxos(addresses) {
  // Blockstream API: retorna UTXOs para um endereço
  const utxos = [];
  for (const addr of addresses) {
    try {
      const { data } = await axios.get(`https://blockstream.info/testnet/api/address/${addr}/utxo`);
      for (const utxo of data) {
        utxos.push({
          ...utxo,
          address: addr,         // guardamos o endereço para mapear o índice
        });
      }
    } catch (err) {
      console.error(`Erro ao buscar UTXOs para ${addr}`);
    }
  }
  return utxos;
}

(async () => {
  // Gera os mesmos 5 endereços
  const depositAddresses = wallet.getDepositAddresses(5);
  const addrs = depositAddresses.map(a => a.address);
  console.log('Consultando UTXOs...');
  const utxos = await getUtxos(addrs);
  console.log('UTXOs encontrados:');
  utxos.forEach(u => console.log(`${u.address} | txid: ${u.txid} | vout: ${u.vout} | valor: ${u.value} sat`));
})();