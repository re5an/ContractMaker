// const {Wallet} = require ("@ethersproject/wallet");
const express = require ('express');
const ethers = require('ethers');
const Web3 = require('web3');
const web3 = new Web3("ws://localhost:8545");

const HDWalletProvider = require('@truffle/hdwallet-provider');
const Wallet = ethers.Wallet;
// const PaymentProcessor = require('../frontend/src/contracts/PaymentProcessor.json');

const { Payment } = require('./Models/db.js');

// const session = require('express-session');
const cors = require('cors');
// const errorhandler = require('errorhandler');

//--- To Generate Mnemonic :
// const mnemonic = await ethers.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
const mnemonic = 'hazard cost opera cancel shell recipe ladder rice crash ghost purse pistol'; // mnemonic of my metamask
// const mnemonic = 'lady name quote impose solid huge acid attitude fiscal ahead such add'; // mnemonic of Genache

const app = express();
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(cors());

const init = async () => {

    //----------- Ethereum -----------//
    // dd(typeof web3, 'Type of WEB3');
    //--- Web3 for Ethereum
    // if (typeof web3 !== 'undefined') {
    //     const web3 = new Web3(web3.currentProvider);
    //     const ethAccounts = await web3.eth.getAccounts();
    //     const ethAdmin = ethAccounts[0];
    // } else {
    //     const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
    //     const ethAccounts = await web3.eth.getAccounts();
    //     const ethAdmin = ethAccounts[0];
    // }
    // const web3 = new Web3("ws://localhost:8545" || Web3.givenProvider);
    // const web3 = new Web3("ws://localhost:8545");
    // let web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");


    // let HDprovider = new HDWalletProvider({
    //     mnemonic: {
    //         phrase: mnemonic
    //     },
    //     providerOrUrl: "ws://localhost:8545"
    // });
    // let hdAccounts = await HDprovider.getAddresses();
    // dd(hdAccounts, 'HD ACCOUNT');
    // const web3 = new Web3(HDprovider);

    const ethAccounts = await web3.eth.getAccounts();
    const ethAdmin = ethAccounts[0];

    //----------- Binance -----------//
    // mainnet
    // const web3bsc = new Web3('https://bsc-dataseed1.binance.org:443');
    // testnet
    // const web3bsc = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545');

    console.log('--------------------');
    console.log('Init Loaded');
    dd(ethAccounts, 'ACCOUNT');

    //--- make variables accessible in other routes by using express ---//
    app.set('web3', web3);
    // app.set('web3bsc', web3bsc);
    app.set('ethAccounts', ethAccounts);
    app.set('ethAdmin', ethAdmin);

}

init()
    .then(async function () {
        const web3 = app.get('web3');

        // ----------- Init PaymentProcessor ----------- //
        const PaymentProcessorArtifact = require('./build/contracts/PaymentProcessor.json');
        // const PaymentProcessorArtifact = require('../frontend/src/contracts/PaymentProcessor.json');
        const id = await web3.eth.net.getId();
        dd(id, 'id: ');
        const deploymentNetwork = PaymentProcessorArtifact.networks[id];
        const PaymentProcessor = new web3.eth.Contract(
            PaymentProcessorArtifact.abi,
            deploymentNetwork.address
        );

        app.set('PaymentProcessor', PaymentProcessor);

        // ----------- Init Token ----------- //
        const TokenArtifact = require('./build/contracts/BCT.json');

        const idToken = await web3.eth.net.getId();
        const deploymentNetworkToken = TokenArtifact.networks[id];

        // if (deploymentNetwork == deploymentNetworkToken)
        //     dd('networks ===');
        // else
        //     dd('Networks are NOO==');
        // if (id == idToken)
        //     dd('idToken ===');
        // else
        //     dd('idToken are NOO==');


        const Token = new web3.eth.Contract(
            TokenArtifact.abi,
            deploymentNetworkToken.address
            // deploymentNetwork.address
        );

        app.set('token', Token);

    })
    .then(()=>{
        dd('Contracts Initiated');
    })

    .catch(e => {
        console.log('------------ ERROR -------------')
        console.log('There has been a problem in INIT : ' + e.message);
        // dumpError(e);
    })
;

app.get('/', (req, res) => {
    //const id = req.query.id; // to get GET parameters
    // const id = req.params; // to get Slug parameters
    // const id = req.body.id; // to get POST parameters
    console.log('ROOOOOT');
    return res.send('Received a GET HTTP method');
});

app.get('/setPaymentContract', (req, res) => {
    //const id = req.query.id; // to get GET parameters
    const adr = req.params.adr; // to get Slug parameters
    dd(req.params, 'ALLLLL  params: ');
    dd(adr, 'params: ');
    // const id = req.body.id; // to get POST parameters
    app.set('PaymentAddress', adr);
    return res.send('SETTTTtt');
});
app.get('/setTokenContract', (req, res) => {
    //const id = req.query.id; // to get GET parameters
    const adr = req.params.adr; // to get Slug parameters
    // const id = req.body.id; // to get POST parameters
    app.set('TokenAddress', adr);
    return res.send('SETTTTtt');
});

// Todo: test passed
app.get('/getPaymentInfo', async (req, res) => {
    const id = req.query.id; // to get GET parameters
    // const id = req.params; // to get Slug parameters
    // const id = req.body.id; // to get POST parameters
    const payment = await Payment.findOne({id: id});
    return res.send(payment);
});

// Todo: test passed
app.get('/getUserPayments', async (req, res) => {
    const payer = req.query.payer; // to get GET parameters
    // const payer = req.params; // to get Slug parameters
    // const id = req.body.id; // to get POST parameters
    const payments = await Payment.find({payer});
    // dd(payments, 'payments')
    return res.send(payments);
});

// Todo: test passed
app.get('/makeContract', async (req, res) => {
    // const id = req.body.id; // to get POST parameters
    dd( req.query,'GET Make Contract')
    const id = req.query.id;
    const payer = req.query.payer;
    const receiver = req.query.receiver;
    const amount = req.query.amount;

    await Payment.create({
        id: id,
        payer: payer,
        receiver: receiver,
        amount: amount,
        frozen: false,
        paid: false,
        status: 1
    });

    return res.send('Saved');
});
// Todo: test passed
app.post('/makeContract', async (req, res) => {
    dd(req.body, 'POST Make');
    const id = req.body.id;
    const payer = req.body.payer;
    const receiver = req.body.receiver;
    const amount = req.body.amount;
    const whenPay = 1000 && req.body.whenPay;

    try {
        await Payment.create({
            id: id,
            payer: payer,
            receiver: receiver,
            amount: amount,
            frozen: false,
            paid: false,
            status: 1,
            whenPay:whenPay
        });
    } catch (e) {
        return res.send(e).status(500);
    }


    return res.send('Saved').status(200);
});

app.get('/changeStatus', async (req, res) => {
    // const id = req.body.id; // to get POST parameters
    dd('GET Make Contract' , req.query);
    const id = req.query.id;
    const newStatus = req.query.status;

    const payment = await Payment.findOne({id: id});
    if (!payment) return res.send({msg: 'did not find in db', payment, error:'', tx:''}).status(404);
    dd('Payment Found : ', payment);

    let doc = await Payment.findOneAndUpdate({id: id}, {status: newStatus});
    doc = await Payment.findOne({id: id});
    return res.send({msg: 'Update Success', payment:doc , error:'', tx:''}).status(200);

    /** For now, I disabled handleStatusChange, which is in charge of Paying to Receiver Automatically */
    //--- Checks if its the time to pay the receiver
    let {msg, timeToPay, hasFund, payable, tx, error} = handleStatusChange(payment);

    if (!timeToPay) return res.send({msg: 'Updated status' , error, payment,tx});

    if (!hasFund) return res.send({msg , error, payment,tx}).status(200);
    if (error != null) return res.send({msg , error, payment,tx}).status(500);

    //--- has Paid Receiver Automatically
    return res.send({msg , error, payment,tx}).status(200);

});

// Todo: test passed
app.get('/forwardStatus', async (req, res) => {
    // const id = req.body.id; // to get POST parameters
    const id = req.query.id;

    const payment = await Payment.findOne({id: id});
    if (!payment) return res.send({msg: 'did not find in db', payment, error: 'not found'}).status(404);
    dd('Payment Found : ', payment);

    let doc = await Payment.findOneAndUpdate({id: id}, {status: (payment.status + 1)});
    doc = await Payment.findOne({id: id});
    return res.send({msg: 'Updated status' , payment: doc, error: null});
});

function isTimeToPay(payment){
    return payment.whenPay == payment.status;
    /*if (payment.whenPay != payment.status){
        return false;
    }
    return true;*/
}

async function handleStatusChange(payment){
    if (!isTimeToPay(payment)) return {msg:'Not the time to pay', timeToPay: false, hasFund:false , payable: false, tx: '', error:''}
    if (!hasFund(payment)) return {msg:'No fund to pay', timeToPay: true, hasFund:false, payable: false, tx: '', error:''}
    let {msg, error, tx} = await transferFromContractToReceiver(payment);
    // let {msg, error, tx} = await transferFromContractToReceiver(id);
    if (error != null){
        return {msg, timeToPay: true, hasFund:true, payable:true , tx, error:error};
    }

    return {msg, timeToPay: true, hasFund:true, payable: true, tx, error: ''};
}

/** ------------------ User ------------------ */

app.get('/makeMasterWallet', async (req, res) => {

    // const wallet = ethers.Wallet.fromMnemonic(mnemonic);
    const wallet = await Wallet.fromMnemonic(mnemonic);
    // const privateKey = wallet.privateKey;
    dd(wallet.privateKey, 'privateKey');
    console.log(wallet)

    // let HDprovider = new HDWalletProvider({
    //     mnemonic: {
    //         phrase: mnemonic
    //     },
    //     providerOrUrl: "ws://localhost:8545"
    // });

    return res.send(wallet);
});

app.get('/createERCWallet', async (req, res) => {
    // const init = async () => {

    try {
        // const web3 = app.get('web3');

        let acc = web3.eth.accounts.create();
        dd(acc);

        let encryptedAccount = web3.eth.accounts.encrypt(acc.privateKey, 'barpin@naser');
        dd(encryptedAccount);

        // todo: Save acc to db


        // const wallet = web3.eth.accounts.wallet.create(3);
        // dd(wallet[0])

        res.send({acc, encryptedAccount });
    } catch (error) {
        dd(error);

        // Passes errors into the error handler
        return next(error);
    }
});

app.get('/createBEPWallet', async (req, res) => {
    // const init = async () => {

    try {
        const web3 = app.get('web3bsc');
        // const loader = setupLoader({ provider: web3 }).web3;

        const acc = web3.eth.accounts.create();

        dd(acc);

        let encryptedAccount = web3.eth.accounts.encrypt(acc.privateKey, 'barpin@naser');
        dd(encryptedAccount);

        const wallet = web3.eth.accounts.wallet.create(1);
        dd(wallet)

        // res.send(wallet);
        res.send(encryptedAccount);
    } catch (error) {
        dd(error);

        // Passes errors into the error handler
        return next(error);
    }
});

app.get('/test', async (req, res) => {
    // const init = async () => {

    try {
        // const web3 = app.get('web3');

        let acc = web3.eth.accounts.create();
        dd(acc, 'New Account');



        // let wlt = await web3.eth.accounts.wallet.load('pass');
        // dd(wlt, 'Wlt Loaded');

        // const wallet = web3.eth.accounts.wallet.create(3);
        // dd(wallet[0]);

        // if (!wlt)
        wlt = await web3.eth.accounts.wallet;

        // dd(wlt[0], 'wlt 0');
        dd(wlt.length, 'wlt length');

        let newU = await wlt.add(acc);
        // let newU = await web3.eth.accounts.wallet.add(acc);
        dd(newU, 'wlt New Acc');
        // dd(wlt[0], 'wlt 0');
        // dd(wlt, 'WLT');
        dd(wlt.length, 'wlt length');
        // dd(wlt._accounts, 'wlt _accounts');

        // let isSaved = await web3.eth.accounts.wallet.save('pass');
        // dd(isSaved, 'isSaved');




        //--- Makes A Real Persistent Account which shows on web3.eth.personal.getAccounts()
        // let val = await web3.eth.personal.newAccount('!@superpassword');
        // dd(val, 'New Acc');

        // let alac = await web3.eth.personal.getAccounts();
        // dd(alac, 'All Node Acc');

        // res.send(wallet);
        res.send({acc  })
    } catch (error) {
        dd(error , 'Error in Test ');

        // Passes errors into the error handler
        res.send({error});
    }
});

/** ------------------ Payment Contract ------------------ */

// TODO: Test Passed
app.get('/freezeAmount', async (req, res) => {
// app.get('/freezeAmount/:id', async (req, res) => {
    // const id = req.params; // to get Slug parameters
    const id = req.query.id; // to get GET parameters
    // // const id = req.body.id; // to get POST parameters
    // // const payment = await Payment.findOne({id: id});
    // dd(id, 'ID');
    const payment = await Payment.findOne({id: id});
    if (!payment) return res.send({msg: 'did not find in db', payment})
    // dd(payment, 'Payment Found : ');

    const {tx , error} = await freeze(id, payment.amount);
    // dd(tx, 'tx');
    dd(error, 'Error of Freeze :')
    // if (error != null){
    if (error){
        dd(error, 'RETURN BACK Because of this Error in TransferFrom :')
        return res.send({tx, error, msg: 'TX transferFrom Error'}).status(500)
    }
    const doc = await Payment.findOneAndUpdate({id: id}, {frozen: true});
    dd(doc, 'Doc');
    return res.send({tx, error, msg: 'Success'})
});

// TODO: Test Passed
app.get('/transferToReceiver', async (req, res) => {
    const id = req.query.id; // to get GET parameters

    const payment = await Payment.findOne({id: id});
    if (!payment) return res.send({msg: 'Did not find Payment Contract', tx:null, error:'Did not find Payment Contract'}).status(404);

    let {msg, error, tx, doc} = await transferFromContractToReceiver(payment);
    dd({msg, error, tx, doc}, 'transferFromContractToReceiver Returns');
    // if (error != null){
    if (error){
        return res.send({msg, tx, error}).status(400);
    }

    return res.send({msg, tx, error}).status(200);
});

//todo: test Passed
async function transferFromContractToReceiver(payment){
    // const payment = await Payment.findOne({id: id});
    // //--- check if did not already transfer or have frozen tokens (Otherwise he can send all token inside Contract to himself)
    // if (!payment.frozen) return res.send({msg: 'The Payment Contract dont have frozen token.', error: 'No Fund', tx: ''});
    // if (payment.paid) return res.send({msg:'The Payment Contract has already Paid to receiver', error:'already done', tx:''});

    let {msg, payable, error} = await hasFund(payment);
    // dd({msg, payable, error}, 'hasFund Returns');
    if (!payable) return {msg, error, tx:''};

    const weiAmount = Web3.utils.toWei(payment.amount, 'ether');
    dd(weiAmount, 'weiAmount:');

    // const tx = await unFreeze(payment.receiver , payment.amount, payment.id, payment.payer);
    const tx = await unFreeze(payment.receiver , weiAmount, payment.id, payment.payer);
    // dd(tx, 'unFreeze returns');
    if ( tx.error){
        return {tx: tx.tx , error:tx.error, msg: 'TX UnFreeze Error'};
    }
    let doc = await Payment.findOneAndUpdate({id: payment.id}, {paid: true});

    dd(doc, 'doc 1:');
    doc = await Payment.findOne({id: payment.id});
    dd(doc, 'doc 2 : ');

    return {tx: tx.tx , error: tx.error, msg: 'Success', doc};
    // return {msg: 'success', error: '' , tx: tx};
}

//--- id can be ID or Payment object
async function hasFund(id){    // Tested
    const payment = (typeof id == 'number' || typeof id == 'string')
        ? await Payment.findOne({id: id})
        : id
    ;

    if (!payment) return ({msg: 'The Payment not found with id: ${id}.', error: 'Not Found' , payable: false});
    //--- check if did not already transfer or have frozen tokens (Otherwise he can send all token inside Contract to himself)
    if (!payment.frozen) return ({msg: 'The Payment Contract dont have frozen token.', error: 'No Fund' , payable: false});
    if (payment.paid) return ({msg:'The Payment Contract has already Paid to receiver', error:'already done', payable: false});

    return ({msg:'The Payment is Payable', error:'', payable: true});
}
// todo: test unFreeze
app.get('/unFreeze', async (req, res) => {
    const id = req.query.id; // to get GET parameters
    const payment = await Payment.findOne({id: id});

    //--- check if did not already transfer or have frozen tokens (Otherwise he can send all token inside Contract to himself)
    if (!payment.frozen) return res.send('The Payment Contract dont have frozen token.');
    if (payment.paid) return res.send('The Payment Contract has already Paid to receiver');

    const weiAmount = Web3.utils.toWei(payment.amount, 'ether');

    const {tx, error} = await unFreeze(payment.payer , weiAmount, payment.id, payment.payer);
    // const {tx, error} = await unFreeze(payment.payer , payment.amount, payment.id, payment.payer);
    dd({tx, error}, 'unFreeze returns');
    if ( error){
        return res.send({error, tx, msg: 'TX UnFreeze Error'});
    }
    const doc = await Payment.findOneAndUpdate({id: id}, {frozen: false});
    dd(doc, 'doc:');
    return res.send({tx, error, msg: 'Success'});
});

//todo: test Passed
app.get('/balanceOf', async (req, res) => {
    const address = req.query.a; // to get GET parameters

    const web3 = app.get('web3');
    const Token = app.get('token');
    // let address2 = web3.utils.toChecksumAddress(address);
    let balance = 0;
    try {
        balance = await Token.methods.balanceOf(address).call({from: address});
        balance = web3.utils.fromWei(balance, 'ether')
        dd(balance, 'Balance Try:');
    } catch (err){
        dd(err, 'Catch. Error :');
    }

    return res.send(balance);
});

//todo: test PASSED
app.get('/balanceOfCurrent', async (req, res) => {
    const web3 = app.get('web3');
    const Token = app.get('token');
    const paymentProcessor = app.get('PaymentProcessor');
    const accounts = app.get('ethAccounts');
    const paymentProcessorContractAddress = paymentProcessor._address;
    // const paymentProcessorContractAddress = '0x89628f97c366bd3EFDAdbcf61D47e49Ff02f9EF7';
    dd(accounts[0], 'account 0')
    let balance = 0;
    try {
        balance = await Token.methods.balanceOf(paymentProcessorContractAddress).call({from: accounts[0]});
        // const balance = await Token.methods.balanceOf(accounts[0]).send({from: accounts[0]});
        balance = web3.utils.fromWei(balance, 'ether');
        dd(balance, 'Try. Balance: ');
        dd(paymentProcessor._address, 'paymentProcessor.address');
    } catch (err) {
        dd(err, 'Catch. Error:');
    }

    // dd(paymentProcessor, 'paymentProcessor : ');
    return res.send(balance);
});



let port = process.env.PORT || 4000;
app.listen(port, () =>
    console.log(`Example app listening on port ${port}!`),
);


// TODO : fix Event Listener
// const listenToEvents = () => {
//     const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
//     const networkId = '5777';
//     //when connecting to mainnet or public testnets, use this instead
//     //const provider = ethers.providers.getDefaultProvider('mainnet | kovan | etc..');
//     //const networkId = '1'; //mainnet
//     //const networkId = '42'; //kovan
//
//     // const paymentProcessor = new ethers.Contract(
//     //     PaymentProcessor.networks[networkId].address,
//     //     PaymentProcessor.abi,
//     //     provider
//     // );
//     const paymentProcessor = app.get('PaymentProcessor');
//
//     paymentProcessor.on('PaymentDone', async (payer, amount, paymentId, date) => {
//         console.log(`New payment received:
//           from ${payer}
//           amount ${amount.toString()}
//           paymentId ${paymentId}
//           date ${(new Date(date.toNumber() * 1000)).toLocaleString()}
//         `);
//         const payment = await Payment.findOne({id: paymentId.toString()});
//         if(payment) {
//             payment.paid = true;
//             await payment.save();
//         }
//     });
// };
// listenToEvents();


//------------- Helper Functions -------------//

// async function freeze(from, to, amount){
async function freeze( id, amount){
    try{
        const PaymentProcessor = app.get('PaymentProcessor');
        const web3 = app.get('web3');

        const BN = web3.utils.BN;     //--- Big Number
        let amountBig = new BN(amount);
        let FIX = new BN('1000000000000000000');

        let totalAmountBig = amountBig.mul(FIX);

        dd(amountBig.toString(), 'amountBig');
        dd(totalAmountBig.toString(), 'totalAmountBig');

        const ethAdmin = app.get('ethAdmin');
        const tx = await PaymentProcessor.methods.userToContract(id.toString(), totalAmountBig).send({from: ethAdmin});
        dd(tx, 'tx');
        // await tx.wait();

        return {tx , error: null};
    } catch (error) {
        // Passes errors into the error handler
        return {tx: null , error};
    }
}

async function unFreeze(to, amount, id, from){
    try{
        const PaymentProcessor = app.get('PaymentProcessor');
        const web3 = app.get('web3');

        const BN = web3.utils.BN;     //--- Big Number
        let amountBig = new BN(amount);

        //--- Makw Wei
        // let FIX = new BN('1000000000000000000');
        // let totalAmountBig = amountBig.mul(FIX);

        const ethAdmin = app.get('ethAdmin');
        const tx = await PaymentProcessor.methods.transferFromContractToReceiver(to,amountBig, id.toString(), from).send({from: ethAdmin});
        // const tx = await PaymentProcessor.methods.transferFromContractToReceiver(to,totalAmountBig, id.toString(), from).send({from: ethAdmin});

        return {tx , error: null};
    } catch (error) {
        // Passes errors into the error handler
        return {tx: null , error};
    }
}


// async function initPaymentProcessor(){
//     const web3 = app.get('web3');
//     const PaymentProcessorArtifact = require('./build/contracts/PaymentProcessor.json');
//     const id = await web3.eth.net.getId();
//     const deploymentNetwork = PaymentProcessorArtifact.networks[id];
//     const PaymentProcessor = new web3.eth.Contract(
//         PaymentProcessorArtifact.abi,
//         deploymentNetwork.address
//     );
//     app.set('PaymentProcessor', PaymentProcessor);
// }

/**
 * Shows Error with Details and line number
 * @param err
 */
function dumpError(error) {
    console.log("  ERROR----------------- ERROR : ");
    if (typeof error === 'object') {
        if (error.message) {
            console.log('\nMessage: ' + error.message)
        }
        if (error.stack) {
            console.log('\nStacktrace:')
            console.log('====================')
            console.log(error.stack);
        }
    } else {
        console.log('dumpError :: argument is not an object');
    }
}

function dd(val, msg = ''){
    console.log("-----------------");
    if (msg) console.log(msg + ' :  ' );
    console.log(val);
}