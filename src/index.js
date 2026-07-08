const TestnetWallet = require('./wallet');

// Cria uma nova carteira ou restaura a partir de um mnemônico
// Para nova carteira:
const wallet = new TestnetWallet();
console.log('🔐 Nova carteira Testnet criada!');
console.log('Frase mnemônica (guarde em segurança):\n', wallet.getMnemonic());

// Exibe 5 endereços de depósito
console.log('\n📥 Endereços de depósito (recebimento):');
const depositAddresses = wallet.getDepositAddresses(5);
depositAddresses.forEach(addr => {
  console.log(`  Índice ${addr.index}: ${addr.address}`);
});

// Exemplo de criação de transação (com UTXOs fictícios)
console.log('\n💸 Exemplo de transação de envio:');
try {
  // Suponha que temos um UTXO controlado pelo índice 0
  const utxos = [
    {
      txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      vout: 0,
      value: 100000, // satoshis
      index: 0      // índice de derivação do endereço que detém esse UTXO
    }
  ];
  const destAddress = 'mpXwg4jKBDiP1cP1sBJz2v1Yd1qL6VeTmW'; // endereço testnet de exemplo
  const amount = 50000; // enviar 50.000 satoshis
  const fee = 1000;
  
  const txHex = wallet.createTransaction(utxos, destAddress, amount, fee);
  console.log('Transação assinada (hex):', txHex);
  // Essa transação pode ser transmitida via API de um explorador ou nó Bitcoin
} catch (err) {
  console.error('Erro ao criar transação:', err.message);
}