//To transfer ownership only (FreeWallet).

// Setup some short aliases
var ls = localStorage,
    ss = sessionStorage,
    bc = bitcore;

// Define FreeWallet namespace
FW = {};


// Define list of API keys used
FW.API_KEYS = {};

// Load wallet network (1=Mainnet, 2=Testnet)
FW.WALLET_NETWORK = ls.getItem('walletNetwork') || 1;

// Load latest network information (btc/xcp price, fee info, block info)
FW.NETWORK_INFO =  JSON.parse(ls.getItem('networkInfo')) || {};

// Wallet format (0=Counterwallet, 1=BIP39)
FW.WALLET_FORMAT = ls.getItem('walletFormat') || 0;

// Load current wallet address and address label
FW.WALLET_ADDRESS       = ls.getItem('walletAddress') || null;
FW.WALLET_ADDRESS_LABEL = ls.getItem('walletAddressLabel') || null;

// Array of the known wallet addresses any labels
FW.WALLET_ADDRESSES = JSON.parse(ls.getItem('walletAddresses')) || [];
// Example record

FW.WALLET_KEYS      = {}; // Address/Private keys



// Define default server info
FW.WALLET_SERVER_INFO = {
    mainnet: {
        host: 'public.coindaddy.io',
        port: 4001,                 
        user: 'rpc',                
        pass: '1234',               
        ssl: true,
        api_host: 'xchain.io',
        api_ssl: true
    },
    testnet: {
        host: 'public.coindaddy.io',
        port: 14001,                
        user: 'rpc',                
        pass: '1234',               
        ssl: true,
        api_host: 'testnet.xchain.io',
        api_ssl: true
    }
};

// Define cache for asset information
// We cache the data in order to reduce duplicate API calls as much as possible
FW.ASSET_INFO  = {};
// Example of cached asset data
// FW.ASSET_INFO['BTC'] = {
//     block:     0, // Block # when data was last updated
//     ...
// }


// Start loading the wallet 
$(document).ready(function(){

  
   
    // Load the server information
    var info = ls.getItem('serverInfo');
    if(info)
        FW.WALLET_SERVER_INFO = JSON.parse(info);

    // Setup the xchain API url
    setXChainAPI(FW.WALLET_NETWORK);


});


// Handle getting XChain API url for given network
function getXChainAPI( network ){
    var name = (network==2||network=='testnet') ? 'testnet' : 'mainnet',
        o    = FW.WALLET_SERVER_INFO[name],
        url  = ((o.api_ssl) ? 'https' : 'http') + '://' + o.api_host;
    return url;
}

// Handle setting server information based off current network
function setXChainAPI( network ){
    FW.XCHAIN_API = getXChainAPI(network);
}



// Function to handle generating a passphrase
function generateWalletPassphrase(isBip39=false){
    var passphrase = false;
    if(isBip39){
        passphrase = bip39.generateMnemonic();
    } else {
        passphrase = new Mnemonic(128).toWords().toString().replace(/,/gi, " ");
    }
    return passphrase;
}


function createWallet(isBip39 = false) {
    var passphrase = ls.getItem('passphrase');
    var wallet = false;
    // Generate a passphrase if one is not passed
    if (!passphrase) {
      passphrase = generateWalletPassphrase(isBip39);
    }
  
    // Support BIP39 and counterwallet's shorter wordlist
    if (isBip39) {
      wallet = bip39.mnemonicToEntropy(passphrase);
    } else {
      wallet = Mnemonic.fromWords(passphrase.trim().split(" ")).toHex();
    }
  
    ss.setItem("wallet", wallet);
    ls.setItem("wallet", wallet);
    ls.setItem("walletKeys", JSON.stringify(FW.WALLET_KEYS));
    ls.setItem("walletNetwork", 1);
  
    // Set the wallet format (0 = Counterwallet, 1=BIP39)
    FW.WALLET_FORMAT = isBip39 ? 1 : 0;
    ls.setItem("walletFormat", FW.WALLET_FORMAT);
  
    // Add the first 10 addresses to the wallet (both mainnet and testnet)
    var networks = ["mainnet", "testnet"];
    networks.forEach(function (net) {
      var network = bc.Networks[net],
        netname = net == "testnet" ? "testnet" : "bitcoin";
      var s = bc.HDPrivateKey.fromSeed(wallet, network);
      for (var i = 0; i < 10; i++) {
        var d = s.derive("m/0'/0/" + i),
          a = bc.Address(d.publicKey, network).toString(),
          b = bitcoinjs
            .payments.p2wpkh({ pubkey: d.publicKey.toBuffer(), network: bitcoinjs.networks[netname] })
            .address;
        addWalletAddress(net, a, "Address #" + (i + 1), 1, i);
        addWalletAddress(net, b, "Segwit Address #" + (i + 1), 7, i);
      }
    });
  
    // Set current address to first address in wallet
    // This also handles saving TBE.WALLET_ADDRESSES to disk
    setWalletAddress(getWalletAddress(0), true);
  }
  

// Handle generating a new indexed address and adding it to the wallet
function addNewWalletAddress(net=1, type='normal'){
    // Force network to numeric value and net to string value
    var ls   = localStorage;
    net      = (net=='testnet' || net==2) ? 2 : 1;
    network  = (net==2) ? 'testnet' : 'mainnet',
    addrtype = (type=='segwit') ? 7 : 1; 
    address  = false;
    // Lookup the highest indexed address so far
    var idx = 0;
    FW.WALLET_ADDRESSES.forEach(function(item){
        if(item.type==addrtype && item.network==net && item.index>idx)
            idx = item.index;
    });
    console.log('idx A=',idx);
    idx++; // Increase index for new address
    console.log('idx B=',idx);
    // Generate new address
    var w = getWallet(),
        n = bc.Networks[network],
        s = bc.HDPrivateKey.fromSeed(w, n),
        d = s.derive("m/0'/0/" + idx);
    address = bc.Address(d.publicKey, n).toString();
    label   = 'Address #' + (idx + 1);
    // Support generating Segwit Addresses (Bech32)
    if(type=='segwit'){
        var netname = (net==2) ? 'testnet' : 'bitcoin';
        var address = bitcoinjs.payments.p2wpkh({ pubkey: d.publicKey.toBuffer(), network: bitcoinjs.networks[netname] }).address;
        label = 'Segwit ' + label;
    }
    // Add the address to the wallet
    addWalletAddress(network, address, label, addrtype, idx);
    // Save wallet addresses info to disk
    ls.setItem('walletAddresses', JSON.stringify(FW.WALLET_ADDRESSES));
    return address;
}



// Get decrypted wallet from sessionStorage
function getWallet(){
    return ss.getItem('wallet');
}



// Get wallet addresses using given index 
function getWalletAddress( index ){
    // console.log('getWalletAddress index=',index);
    // update network (used in CWBitcore)
    var net = (FW.WALLET_NETWORK==2) ? 'testnet' : 'mainnet',
    NETWORK = bc.Networks[net];
    if(typeof index === 'number'){
        // var type
        var w = getWallet(),
            a = null;
        if(w){
            k = bc.HDPrivateKey.fromSeed(w, NETWORK),
            d = k.derive("m/0'/0/" + index),
            a = bc.Address(d.publicKey, NETWORK).toString();
        } 
        return a;
    } else {
        return ls.getItem('walletAddress');
    }
}

// Set wallet address
function setWalletAddress( address, load=0 ){
    // console.log('setWalletAddress address, load=',address,load);
    FW.WALLET_ADDRESS = address;
    var info = getWalletAddressInfo(address);
    if(!info)
        info = addWalletAddress(address);
    // Save the label info to disk
    FW.WALLET_ADDRESS_LABEL = info.label;
    // Save updated information to disk
    ls.setItem('walletAddresses', JSON.stringify(FW.WALLET_ADDRESSES));
    // Update the wallet display to reflect the new address
}

// Handle adding addresses to FW.WALLET_ADDRESSES array
function addWalletAddress( network=1, address='', label='', type=1, index='', path='' ){
    // console.log('addWalletAddress network,address,label,type,index=',network,address,label,type,index, path);
    // Bail out if no address is passed
    if(address=='')
        return;
    // Bail out if address already exists
    var found = false;
    FW.WALLET_ADDRESSES.forEach(function(item){
        if(item.address==address)
            found = true;
    });
    if(found)
        return;
    // Convert network to integer value
    if(typeof network == 'string')
        network = (network=='testnet') ? 2 : 1;
    var info = {
        address: address, // Address to add
        network: network, // Default to mainnet (1=mainnet, 2=testnet)
        label: label,     // Default to blank label
        type: type,       // 1=indexed, 2=imported (privkey), 3=watch-only, 4=trezor, 5=ledger, 6=keepkey, 7=segwit
        path: path,       // node path for address (ex: m/44'/0'/0)
        index: index      // wallet address index (used in address sorting)
    };
    FW.WALLET_ADDRESSES.push(info);
    return info;
}


// Handle returning the information from TBE.WALLET_ADDRESSES for a given address
function getWalletAddressInfo( address ){
    var info = false;
    FW.WALLET_ADDRESSES.forEach(function(item){
        if(item.address==address)
            info = item;
    });
    return info;
}



// Handle setting the wallet network (1=mainnet/2=testnet)
function setWalletNetwork(network, load=false){
    ls.setItem('walletNetwork', network);
    FW.WALLET_NETWORK = network;
    // Update the xchain API url
    setXChainAPI(network);
    // Set current address to first address in wallet
    setWalletAddress(getWalletAddress(0), load);
}

// Handle adding private key to wallet
function addWalletPrivkey(key){
    // Verify that the private key is added
    var net     = FW.WALLET_NETWORK,                // Numeric
        network = (net==2) ? 'testnet' : 'mainnet', // Text
        ls      = localStorage,
        n       = bc.Networks[network],
        address = false;
    // Try to generate a public key and address using the key
    try {
        privkey = new bc.PrivateKey.fromWIF(key);
        pubkey  = privkey.toPublicKey();
        address = pubkey.toAddress(n).toString();
    } catch (e){
        console.log('error : ',e);
    }
    // Add wallet to address
    if(address){
        // Check if the address has alreaday been added to the list
        var found = false,
            cnt   = 0;
        FW.WALLET_ADDRESSES.forEach(function(item){
            if(item.address==address)
                found = true;
            if(item.network==net && item.type==2)
                cnt++;
        });
        if(!found){
            // Add the address to the wallet 
            addWalletAddress(network, address, 'Imported Address #' + (cnt + 1), 2, null);
            // Save wallet addresses info to disk
            ls.setItem('walletAddresses', JSON.stringify(FW.WALLET_ADDRESSES));
            // Add address and private key to keys array
            FW.WALLET_KEYS[address] = key;
        }
    }
    return address;
}



// Validate wallet passphrase
function isValidWalletPassphrase( passphrase, isBip39=false ){
    var arr   = passphrase.trim().split(" "),
        valid = true;
    if(arr.length<12)
        valid = false;
    for(var i=0;i<arr.length;i++){
        if(isBip39){
            if($.inArray(arr[i], bip39.wordlists.english)==-1)
                valid = false;
        } else {
            if($.inArray(arr[i], Mnemonic.words)==-1)
                valid = false;
        }
    }
    return valid;
}

// Validate address
function isValidAddress(addr){
    var net  = (FW.WALLET_NETWORK==2) ? 'testnet' : 'mainnet';
    // update network (used in CWBitcore)
    NETWORK  = bc.Networks[net];
    if(CWBitcore.isValidAddress(addr))
        return true;
    return false;
}


// Display error message and run callback (if any)
function cbError(msg, callback){
    if(typeof callback === 'function')
        callback();
}

// Convert an amount to satoshis
function getSatoshis(amount){
    var num = numeral(amount);
    if(/\./.test(amount))
        num.multiply(100000000);
    return parseInt(num.format('0'));
}


// Handle checking if addresses is bech32
function isBech32(addr) {
    try {
        bitcoinjs.address.fromBech32(addr)
        return true
    } catch (e) {
        return false
    }
}

// Get private key for a given network and address
function getPrivateKey(network, address, prepend=false){
    var wallet = getWallet(),
        net    = (network=='testnet') ? 'testnet' : 'livenet',
        priv   = false;
    // Check any we have a match in imported addresses
    if(FW.WALLET_KEYS[address])
        priv = FW.WALLET_KEYS[address];
    // Loop through HD addresses trying to find private key
    if(!priv){
        var key = bc.HDPrivateKey.fromSeed(wallet, bc.Networks[net]),
            idx = false;
        FW.WALLET_ADDRESSES.forEach(function(item){
            if(item.address==address)
                idx = item.index;
        });
        // If we found the address index, use it to generate private key
        if(idx !== false){
            var d = key.derive("m/0'/0/" + idx),
                a = bc.Address(d.publicKey, bc.Networks[net]).toString();
            // Handle generating the bech32 address
            if(a!=address){
                var netname = (network=='testnet') ? 'testnet' : 'bitcoin';
                a = bitcoinjs.payments.p2wpkh({ pubkey: d.publicKey.toBuffer(), network: bitcoinjs.networks[netname] }).address;
                if(a==address){
                    priv = d.privateKey.toWIF();
                    if(prepend)
                        priv = 'p2wpkh:' + d.privateKey.toWIF();
                }
            } else {
                priv = d.privateKey.toWIF();
            }
        } 
    }
    return priv;
}




// Function to handle making a URL a url valid by ensuring it starts with http or https
function getValidUrl( url ){
    var re1 = /^http:\/\//,
        re2 = /^https:\/\//;
    if(!(re1.test(url)||re2.test(url)))
        url = 'http://' + url;
    return url;
}

// Convert array of serialized form values into object with name:value pairs
function array2Object(arr){
    var vals   = {};
    for(var i=0;i<arr.length;i++){
        var o = arr[i];
        vals[o.name] = o.value;
    }
    return vals;
}



// Handle creating/signing/broadcasting an 'Issuance' transaction
function cpIssuance(network, source, asset, quantity, divisible, description, destination, fee, callback){
    var cb  = (typeof callback === 'function') ? callback : false;
    // Create unsigned send transaction
    createIssuance(network, source, asset, quantity, divisible, description, destination, fee, function(o){
        if(o && o.result){
            // Sign the transaction
            signTransaction(network, source, source, o.result, function(signedTx){
                if(signedTx){
                    // Broadcast the transaction
                    broadcastTransaction(network, signedTx, function(txid){
                        if(txid){
                            if(cb)
                                cb(txid);
                        } else {
                            cbError('Error while trying to broadcast issuance transaction. Please try again.', cb);
                        }
                    });
                } else {
                    cbError('Error while trying to sign issuance transaction. Please try again.',cb);
                }
            });
        } else {
            var msg = (o.error && o.error.message) ? o.error.message : 'Error while trying to create issuance transaction';
            cbError(msg, cb);
        }
    });
}


// Handle sending request to counterparty servers
function cpRequest(network, data, callback){
    var net  = (network=='testnet') ? 'testnet' : 'mainnet',
        info = FW.WALLET_SERVER_INFO[net],
        url  = ((info.ssl) ? 'https' : 'http') + '://' + info.host + ':' + info.port + '/api/',
        auth = $.base64.btoa(info.user + ':' + info.pass);
        // console.log('info=',info);
        // console.log('url=',url);
    // Send request to server, process response
    $.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(data),
        dataType: 'json',
        crossDomain: false,
        headers: {
            'Authorization': 'Basic ' + auth, 
            'Content-Type': 'application/json; charset=UTF-8'
        },
        success: function(data){
            if(typeof callback === 'function')
                callback(data);
        }
    });
}



// Handle creating issuance transaction
function createIssuance(network, source, asset, quantity, divisible, description, destination, fee, callback){
    // console.log('createIssuance=', network, source, asset, quantity, divisible, description, destination, fee, callback);
    var data = {
       method: "create_issuance",
       params: {
            source: source,
            asset: asset,
            quantity: parseInt(quantity),
            divisible: (divisible) ? 1 : 0,
            description:  (description) ? description : null,
            transfer_destination: (destination) ? destination : null,
            fee: parseInt(fee),
            allow_unconfirmed_inputs: true
        },
        jsonrpc: "2.0",
        id: 0
    };
    cpRequest(network, data, function(o){
        if(typeof callback === 'function')
            callback(o);
    });
}




// Handle signing a transaction based on what type of address it is
function signTransaction(network, source, destination, unsignedTx, callback){
   
        var net      = (network=='testnet') ? 'testnet' : 'mainnet', 
            netName  = (network=='testnet') ? 'testnet' : 'livenet', // bitcore
            callback = (typeof callback === 'function') ? callback : false,
            privKey  = getPrivateKey(net, source);
        // Set the appropriate network and get key
        NETWORK   = bc.Networks[netName];
        var cwKey = new CWPrivateKey(privKey);
        // Convert destination to array if not already
        if(typeof(destination)==='string')
            destination = [destination];
        // Callback to processes response from signRawTransaction()
        var cb = function(e, signedTx){
            if(e)
                console.log('error =',e);
            if(callback)
                callback(signedTx);
        }
        // Check if any of the addresses are bech32
        var sourceIsBech32 = isBech32(source);
        var hasDestBech32  = destination.reduce((p, x) => p || isBech32(x), false);
        var hasAnyBech32   = hasDestBech32 || sourceIsBech32;
        // Handle signing bech32 addresses
        if(hasAnyBech32){
            // Use bitcoinjs implementation
            var tx      = bitcoinjs.Transaction.fromHex(unsignedTx),
                netName = (net=='testnet') ? 'testnet' : 'bitcoin', // bitcoinjs
                network = bitcoinjs.networks[netName],
                txb     = new bitcoinjs.TransactionBuilder(network),
                keypair = bitcoinjs.ECPair.fromWIF(cwKey.getWIF(), network);
            // Callback to modify transaction after we get a list of UTXOs back
            var utxoCb = function(data){
                var utxoMap = {};
                data.forEach(utxo => {
                    utxoMap[utxo.txId] = utxo;
                });
                if(sourceIsBech32){
                    var input = bitcoinjs.payments.p2wpkh({ pubkey: keypair.publicKey, network: network });
                } else {
                    var input = bitcoinjs.payments.p2pkh({ pubkey: keypair.publicKey, network: network });
                }
                // Handle adding inputs
                for(var i=0; i < tx.ins.length; i++){
                    // We get reversed tx hashes somehow after parsing
                    var txhash = tx.ins[i].hash.reverse().toString('hex');
                    var prev = utxoMap[txhash];
                    txb.addInput(tx.ins[i].hash.toString('hex'), prev.vout, null, input.output);
                }
                // Handle adding outputs
                for(var i=0; i < tx.outs.length; i++){
                    var txout = tx.outs[i];
                    txb.addOutput(txout.script, txout.value);
                }
                // var signedHex = txb.build().toHex();
                // console.log('signedHex before=',signedHex);                
                // Loop through the inputs and sign
                for (var i=0; i < tx.ins.length; i++) {
                    var txhash = tx.ins[i].hash.toString('hex');
                    if(txhash in utxoMap){
                        var prev = utxoMap[txhash];
                        var redeemScript = undefined;
                        /*if (hasDestBech32) {
                          redeemScript =  // Future support for P2WSH
                        }*/
                        // Math.floor is less than ideal in this scenario, we need to get the raw satoshi value in the utxo map
                        txb.sign(i, keypair, null, null, prev.value, redeemScript);
                    } else {
                        // Throw error that we couldn't sign tx
                        console.log("Failed to sign transaction: " + "Incomplete SegWit inputs");
                        return;
                    }
                }
                var signedHex = txb.build().toHex();
                cb(null, signedHex);
            }
            // Get list of utxo
            getUTXOs(net, source, utxoCb);
        } else {
            // Sign using bitcore
            CWBitcore.signRawTransaction(unsignedTx, cwKey, cb);
        }
    }


// Handle getting a list of raw UTXOs for a given address
function getUTXOs(network, address, callback){
    var utxos = [];
    // Make call to indexd to get list of UTXOs
    $.getJSON(FW.XCHAIN_API +  '/api/utxos/' + address, function(o){
        if(o && o.data){
            o.data.forEach(function(utxo){
                if(utxo.confirmations>=1)
                    utxos.push(utxo);
            });
        }
        if(callback)
            callback(utxos);
    });

}


// Broadcast a given transaction
function broadcastTransaction(network, tx, callback){
    // Prevent broadcasting any other transaction for 5 seconds
    // Temporary solution to prevent issue where occasionally duplicate transaction is created and broadcast
    // Remove this hack fix once we have determined why duplicate transaction is being created
    if(FW.BROADCAST_LOCK==true){
        cbError('Broadcasting another transaction too quickly',callback);
        return;
    } else {1665207
        FW.BROADCAST_LOCK = true;
        setTimeout(function(){ 
            FW.BROADCAST_LOCK = false;
        }, 5000);
    }
    var net  = (network=='testnet') ? 'BTCTEST' : 'BTC';
    // First try to broadcast using the XChain API
    $.ajax({
        type: "POST",
        url: FW.XCHAIN_API +  '/api/send_tx',
        data: { 
            tx_hex: tx 
        },
        complete: function(o){
            // console.log('o=',o);
            // Handle successful broadcast
            if(o.responseJSON.tx_hash){
                var txid = o.responseJSON.tx_hash;
                if(callback)
                    callback(txid);
                if(txid)
                    console.log('Broadcasted transaction hash=',txid);
            } else {
                // If the request to XChain API failed, fallback to chain.so API
                $.ajax({
                    type: "POST",
                    url: 'https://chain.so/api/v2/send_tx/' + net,
                    data: { 
                        tx_hex: tx 
                    },
                    dataType: 'json',
                    complete: function(o){
                        // console.log('o=',o);
                        if(o.responseJSON.data && o.responseJSON.data.txid){
                            var txid = o.responseJSON.data.txid;
                            if(callback)
                                callback(txid);
                            if(txid)
                                console.log('Broadcast transaction tx_hash=',txid);
                        } else {
                            cbError('Error while trying to broadcast signed transaction',callback);
                        }
                    }
                });                
            }
        }
    });
}
