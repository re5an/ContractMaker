
/** Source :
 * https://github.com/jklepatch/eattheblocks/blob/master/screencast/200-send-transaction-with-web3-nodejs/script.js
 * */

/**
 * Full Version :
 */

const Web3 = require('web3');
const Provider = require('@truffle/hdwallet-provider');
const MyContract = require('./build/contracts/MyContract.json');
const address = '';
const privateKey = '';
const infuraUrl = '';

//Hard way (web3#signTransaction() + web3#sendSignedTransaction())
const init1 = async () => {
    const web3 = new Web3(infuraUrl);
    const networkId = await web3.eth.net.getId();
    const myContract = new web3.eth.Contract(
        MyContract.abi,
        MyContract.networks[networkId].address
    );

    const tx = myContract.methods.setData(1);
    const gas = await tx.estimateGas({from: address});
    const gasPrice = await web3.eth.getGasPrice();
    const data = tx.encodeABI();
    const nonce = await web3.eth.getTransactionCount(address);

    const signedTx = await web3.eth.accounts.signTransaction(
        {
            to: myContract.options.address,
            data,
            gas,
            gasPrice,
            nonce,
            chainId: networkId
        },
        privateKey
    );
    // console.log(`Old data value: ${await myContract.methods.data().call()}`);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log(`Transaction hash: ${receipt.transactionHash}`);
    console.log(`New data value: ${await myContract.methods.data().call()}`);
}

//Slightly easier (web3#sendTransaction())
const init2 = async () => {
    const web3 = new Web3(infuraUrl);
    const networkId = await web3.eth.net.getId();
    const myContract = new web3.eth.Contract(
        MyContract.abi,
        MyContract.networks[networkId].address
    );

    const tx = myContract.methods.setData(2);
    const gas = await tx.estimateGas({from: address});
    const gasPrice = await web3.eth.getGasPrice();
    const data = tx.encodeABI();
    const nonce = await web3.eth.getTransactionCount(address);

    web3.eth.accounts.wallet.add(privateKey);

    const txData = {
        from: address,
        to: myContract.options.address,
        data: data,
        gas,
        gasPrice,
        nonce,
        chain: 'rinkeby',
        hardfork: 'istanbul'
    };

    // console.log(`Old data value: ${await myContract.methods.data().call()}`);
    const receipt = await web3.eth.sendTransaction(txData);
    console.log(`Transaction hash: ${receipt.transactionHash}`);
    console.log(`New data value: ${await myContract.methods.data().call()}`);
}

//Easy way (Web3 + @truffle/hdwallet-provider)
const init3 = async () => {
    const provider = new Provider(privateKey, 'https://rinkeby.infura.io/v3/74aa9a15e2524f6980edb8a377301f3c');
    const web3 = new Web3(provider);
    const networkId = await web3.eth.net.getId();
    const myContract = new web3.eth.Contract(
        MyContract.abi,
        MyContract.networks[networkId].address
    );

    console.log(await myContract.methods.data().call());
    console.log(`Old data value: ${await myContract.methods.data().call()}`);
    const receipt = await myContract.methods.setData(3).send({ from: address });
    console.log(`Transaction hash: ${receipt.transactionHash}`);
    console.log(`New data value: ${await myContract.methods.data().call()}`);
}

init3();


// const Web3 = require('web3');
// // const HD_Provider = require('truffle-hdwallet-provider');
// const Provider = require('@truffle/hdwallet-provider');
// const PaymentProcessor = require('./build/contracts/PaymentProcessor.json');
// const Coin = require('./build/contracts/BCT.json');
//
// let address = '0x4402B4C2A48F6FfE58E3b3d69Af4aD7Fd6BC1d8E';
// let privateKey = '6653b6f2a4712198018889b97d9be95f9afcb9e0f3ebe9fe66c28ffe0cbc7e43';
//
// const infuraUrl = 'ws://localhost:8545';
//
// const mnemonic = 'lady name quote impose solid huge acid attitude fiscal ahead such add'; // mnemonic of Genache
//
// //Easy way (Web3 + @truffle/hdwallet-provider)
// const init3 = async () => {
//
//     const provider = new Provider(mnemonic, 'ws://localhost:8545');
//     // const provider = new Provider(privateKey, 'ws://localhost:8545');
//     const web3 = new Web3(provider);
//
//     const ethAccounts = await web3.eth.getAccounts();
//     // const ethAdmin = ethAccounts[0];
//     address = ethAccounts[0];
//
//     console.log(ethAccounts);
//
//     const networkId = await web3.eth.net.getId();
//     const paymentProcessor = new web3.eth.Contract(
//         PaymentProcessor.abi,
//         PaymentProcessor.networks[networkId].address
//     );
//     const coin = new web3.eth.Contract(
//         Coin.abi,
//         Coin.networks[networkId].address
//     );
//
//     const paymentContractAddress = PaymentProcessor.networks[networkId].address;
//
//     const approve = await coin.methods.approve(paymentContractAddress, 40).send({from: address});
//     console.log('Approve:', approve);
//
//     const uAllowance = await coin.methods.allowance(address, paymentContractAddress).call();
//     console.log('uAllowance: ', uAllowance);
//
//     const cBalance = await paymentProcessor.methods.balanceOfContractToken().call();
//     console.log('cBalance : ' , cBalance);
//
//     const tknAddress = await paymentProcessor.methods.token().call();
//     console.log('tknAddress : ' , tknAddress);
//
//     const receipt = await paymentProcessor.methods.sellToken(3).send({ from: address });
//     console.log('receipt: ', receipt);
//     // console.log(`Transaction hash: ${receipt.transactionHash}`);
//     // console.log(`New Balance: ${await paymentProcessor.methods.balanceOfContractToken().call()}`);
// }
//
// init3();

