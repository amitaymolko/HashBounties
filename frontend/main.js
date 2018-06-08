


function closeModals() {
    $('#exampleModal').modal('hide');
    $('#cancelModal').modal('hide');
    $('#submitModal').modal('hide');
}

function closeModal(tx, tx_id) {
    closeModals();

    $('#thanksYou').modal('show');
    window.tx_id = tx_id;
    document.getElementById('tx').innerText = tx_id.substr(0, 12) + "...";
    document.getElementById('tx').href = "http://ropsten.etherscan.io/tx/" + tx_id;
}

var app = angular.module("myApp", []);
app.directive("fileread", [function () {
  return {
    scope: {
      fileread: "="
    },
    link: function (scope, element, attributes) {
      element.bind("change", function (changeEvent) {
        var reader = new FileReader();
        reader.onload = function (loadEvent) {
          scope.$apply(function () {
            scope.fileread = loadEvent.target.result;
          });
        }
        reader.readAsDataURL(changeEvent.target.files[0]);
      });
    }
  }
}]);

app.controller('hashBountiesCtrl', function ($scope, $http) {
  $scope.hashTypes = [
    { name: 'sha256', value: 'sha256' }, 
    { name: 'sha3', value: 'sha3' },
    { name: 'Ethereum Wallet', value: 'scrypt', file: 1 },
  ];
  $scope.hideCancelled= true;
  $scope.getHashTypeName = function(value) {
    for(var hashType of $scope.hashTypes) {
      if (hashType.value == value) {
        return hashType.name
      }
    }
    return ""
  }

  fetch("HashBounties.json").then((e) => e.json().then(function (text) {
    $scope.HashBountiesJson = text
    $scope.HashBountiesAbi = web3.eth.contract($scope.HashBountiesJson.abi);
    $scope.HashBounties = $scope.HashBountiesAbi.at($scope.HashBountiesJson['networks']['3'].address);
    loadedHashBounties($scope)
  }));

  function loadedHashBounties($scope) {
    loadHashBounties($scope)
  }

  function loadHashBounties($scope) {
    $scope.HashBounties.getHashBountysLength(function (err, value) {
      if (err) {
        console.log('err', err);
      } else {
        var length = value.toNumber();
        $scope.hashBounties = [];
        for (var index = 0; index < length; index++) {
          loadHashBounty(index, $scope)
        }
      }
    })
  }

  function loadHashBounty(index, $scope) {
    $scope.HashBounties.hashBountys(index, function (err, value) {
      if (err) {
        console.log('err', err);
      } else {
        $scope.$apply(function () {
            value[8] = index;
            if (value[2] != 0x00)
              $scope.hashBounties.push(value);
          console.log('$scope.hashBounties', $scope.hashBounties)
        });
      }
    })
  }

  $scope.getHashbountiesToDisplay = function() {
    var hashbounties = []
    for (const hashbounty of $scope.hashBounties) {
      if(hashbounty[6] && $scope.hideCancelled) {
        continue;
      }
      hashbounties.push(hashbounty)
    }
    return hashbounties
  }
  
  $scope.setUploadFile = function(changeEvent) {
    var reader = new FileReader();
    reader.onload = function (loadEvent) {
      $scope.$apply(function () {
        $scope.inputFile = loadEvent.target.result;
      });
    }
    reader.readAsDataURL(changeEvent.target.files[0]);
  }
    $scope.bounty_price = function(bignum) {
        return web3.fromWei(bignum.toNumber(), "ether" )
    }
    $scope.status = function(hash_bounty) {
        
        if(hash_bounty[6])
            return 'Cancelled';
            
        if(hash_bounty[5].length > 0)
            return 'Cracked (' + hash_bounty[5] + ')'
        
        return 'Pending';
        
    }
    $scope.check_user = function(address) {
        
        if(address == web3.eth.accounts[0]) {
            return 'user_request';
        } 
        return 0;
    }
    
    $scope.openCancelModal = function(index) {
        $scope.selectedIndex = index;
        $('#cancelModal').modal('show')
    }
    
    $scope.openSubmitCrackModal = function(index) {
          $scope.selectedIndex = index;
        $('#submitModal').modal('show')
    }
  function decimalToHex(d, padding) {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

    while (hex.length < padding) {
      hex = "0" + hex;
    }

    return hex;
  } 

  $scope.requestHashBounty = function() {
    console.log('$scope', $scope)
    
    var hash = $scope.inputHash
    var hash_type = $scope.selectedItem.value
    var file = $scope.inputFile
    var price = $scope.inputPrice
    var inputData = ""

    if (hash_type == 'scrypt' && file.startsWith('data:;base64,')) {
      var data = file.substring('data:;base64,'.length)
      var dataString = atob(data)
      var json = JSON.parse(dataString)
      inputData = `0x${json.Crypto.ciphertext}${decimalToHex(json.Crypto.kdfparams.dklen)}${json.Crypto.kdfparams.salt}${decimalToHex(json.Crypto.kdfparams.n, 4)}${decimalToHex(json.Crypto.kdfparams.r)}${decimalToHex(json.Crypto.kdfparams.p)}${json.Crypto.mac}`      
      hash = web3.sha3(inputData, { encoding: "hex" })
    }

    console.log(hash, hash_type, price, inputData);
    $scope.HashBounties.requestHashBounty(hash, hash_type, inputData, { 'value': price * 10**18}, closeModal)
  }
    
    $scope.submitCrack = function() {
        console.log($scope.selectedIndex, document.forms['submit_crack'].password.value);
      $scope.HashBounties.submitCrack($scope.selectedIndex, document.forms['submit_crack'].password.value, { 'value': 0.01 * 10 ** 18 }, closeModal)
    }

    $scope.claimReward = function(index) {
      $scope.HashBounties.redeemRewardUnsafe(index, closeModal)
    }
    
    $scope.cancelHashBounty = function() {
        $scope.HashBounties.cancelHashBounty($scope.selectedIndex, closeModal)
    }
});

