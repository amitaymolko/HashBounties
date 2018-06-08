pragma solidity 0.4.23;

import "./Scrypt.sol";
import "./Oracle.sol";

contract HashBounties is Scrypt, Oracle {
  
    event NewHashEvent(address requestorAddress, uint bountyValue, bytes32 hashBytes, string hashType);
    event RequestHashCheck(uint hashBountyIndex, address crackerAddress, string crackerPassword);
    event CrackedHashEvent(address crackerAddress, uint hashBountyIndex);
 
    struct HashBounty {
        address requestorAddress;
        uint bountyValue;

        bytes32 hashBytes;
        string hashType;
       
        address crackerAddress;
        string crackerPassword;

        bool cancelled;
        bool redeemed;

        mapping (string => address) pendingCrackRequests;
    }

    HashBounty[] public hashBountys;
    mapping (string => bool) validHashTypes;

    modifier hashBountyBySender(uint _index) {
        require(hashBountys[_index].requestorAddress == msg.sender);
        _;
    }

    modifier validHashType(string _hashType) {
        require(validHashTypes[_hashType]);
        _;
    }

    modifier validHashBounty(uint _index) {
        require(hashBountys[_index].crackerAddress == 0x00 && !hashBountys[_index].cancelled);
        _;
    }
    
    modifier validMinValue(uint _value) {
        require(msg.value >= _value);
        _;
    }

    constructor(address _oracleAddress)
    Oracle(_oracleAddress)
    public 
    {
        validHashTypes["sha256"] = true;
        validHashTypes["sha3"] = true;
        validHashTypes["scrypt"] = true;
    }

    function requestHashBounty(bytes32 _hash, string _hashType, bytes _input)
    validHashType(_hashType)
    validMinValue(0.1 ether)
    payable
    public 
    {
        if (keccak256(_hashType) == keccak256("scrypt")) {
            requestScryptHashBounty(_hash, _input);
        }
        hashBountys.push(HashBounty(msg.sender, msg.value, _hash, _hashType, 0x00, "", false, false));
        emit NewHashEvent(msg.sender, msg.value, _hash, _hashType);
    }

    function submitCrack(uint _index, string _password) 
    validMinValue(0.01 ether)
    payable
    public 
    {
        HashBounty storage hashBounty = hashBountys[_index];
        if (hashBounty.pendingCrackRequests[_password] != 0x00) { // other user witth same password request
            revert();
        } 
        oracle.transfer(msg.value);
        bytes32 hashedPassword;
        if (keccak256(hashBounty.hashType) == keccak256("sha256")) {
            hashedPassword = sha256(_password);
            handleCrackAttemptInternal(_index, msg.sender, _password, hashedPassword);
        } else if (keccak256(hashBounty.hashType) == keccak256("sha3")) {
            hashedPassword = keccak256(_password);
            handleCrackAttemptInternal(_index, msg.sender, _password, hashedPassword);
        } else if (keccak256(hashBounty.hashType) == keccak256("scrypt")) {
            hashBounty.pendingCrackRequests[_password] = msg.sender;
            emit RequestHashCheck(_index, msg.sender, _password);
        } else {
            revert();
        }
    }

    function submitValidCrack(uint _index, address _crackerAddress, string _crackerPassword) 
    onlyOracle
    public 
    {
        HashBounty storage hashBounty = hashBountys[_index];
        handleCrackAttemptInternal(_index, _crackerAddress, _crackerPassword, hashBounty.hashBytes);
    }

    function handleCrackAttemptInternal(uint _index, address _crackerAddress, string _crackerPassword, bytes32 _hashedPassword)
    validHashBounty(_index)
    internal
    {
        HashBounty storage hashBounty = hashBountys[_index];
        if (_hashedPassword == hashBounty.hashBytes) {
            hashBounty.crackerAddress = _crackerAddress;
            hashBounty.crackerPassword = _crackerPassword;

            emit CrackedHashEvent(_crackerAddress, _index);
            
            // if (keccak256(hashBounty.hashType) == keccak256("sha256") || keccak256(hashBounty.hashType) == keccak256("sha3")) {
            //     redeemRewardUnsafe(_index);
            // }
        } else {
            revert();
        }
    }

    function cancelHashBounty(uint _index)
    hashBountyBySender(_index) 
    validHashBounty(_index)
    public 
    {
        HashBounty storage hashBounty = hashBountys[_index];
        hashBounty.cancelled = true;
        address(hashBounty.requestorAddress).transfer(hashBounty.bountyValue);
    }

    function redeemRewardUnsafe(uint _index)
    public
    {
        HashBounty storage hashBounty = hashBountys[_index];
        if (msg.sender == hashBounty.crackerAddress && !hashBounty.redeemed) {
            hashBounty.redeemed = true;
            address(msg.sender).transfer(hashBounty.bountyValue);
        } else {
            revert();
        }
    }

    function getHashBountysLength() 
    public 
    view 
    returns(uint) 
    {
        return hashBountys.length;
    }
}
