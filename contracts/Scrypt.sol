pragma solidity 0.4.23;

contract Scrypt {
    event Log(bytes32 hash);

    struct ScryptHashParam {
        bytes32 hash;

        bytes32 ciphertext;
        uint8 dklen;
        bytes32 salt;
        uint16 n;
        uint8 r;
        uint8 p;
        bytes32 mac;
    }

    mapping (bytes32 => ScryptHashParam) public scryptHashParams;

    modifier hashMatches(bytes32 _hash, bytes _input) {
        require(_hash == keccak256(_input));
        _;
    }

    modifier validBytesLength(bytes _input) {
        require(_input.length == 101);
        _;
    }

    function parseScryptInput(bytes _input)
    private 
    pure
    validBytesLength(_input)
    returns(
        bytes32 ciphertext,
        uint8 dklen,
        bytes32 salt,
        uint16 n,
        uint8 r,
        uint8 p,
        bytes32 mac
    ) {
        
        ciphertext = bytesToBytes32(_input, 0);
        dklen = bytesToUint8(_input, 32);
        salt = bytesToBytes32(_input, 33);
        n = bytesToUint16(_input, 65);
        r = bytesToUint8(_input, 67);
        p = bytesToUint8(_input, 68);
        mac = bytesToBytes32(_input, 69);
    }

    function bytesToBytes32(bytes b, uint offset) private pure returns (bytes32) {
        bytes32 out;

        for (uint i = 0; i < 32; i++) {
            out |= bytes32(b[offset + i] & 0xFF) >> (i * 8);
        }
        return out;
    }

    function bytesToUint8(bytes b, uint offset) private pure returns (uint8) {
        uint8 out;
        out |= uint8(b[offset] & 0xFF);
        return out;
    }

    function bytesToUint16(bytes b, uint offset) private pure returns (uint16) {
        bytes2 out;

        for (uint i = 0; i < 2; i++) {
            out |= bytes2(b[offset + i] & 0xFF) >> (i * 8);
        }
        return uint16(out);
    }

    function requestScryptHashBounty(bytes32 _hash, bytes _input)
    hashMatches(_hash, _input)
    // payable
    public 
    {
        bytes32 ciphertext;
        uint8 dklen;
        bytes32 salt;
        uint16 n;
        uint8 r;
        uint8 p;
        bytes32 mac;

        (ciphertext, dklen, salt, n, r, p, mac) = parseScryptInput(_input);
        scryptHashParams[_hash] = ScryptHashParam(_hash, ciphertext, dklen, salt, n, r, p, mac);
    }

    function getScrypt(bytes32 _hash)
    public 
    view
    returns (
        bytes32 ciphertext,
        uint8 dklen,
        bytes32 salt,
        uint16 n,
        uint8 r,
        uint8 p,
        bytes32 mac
    ) {
        ScryptHashParam storage scryptHashParam = scryptHashParams[_hash];
        ciphertext = scryptHashParam.ciphertext;
        dklen = scryptHashParam.dklen;
        salt = scryptHashParam.salt;
        n = scryptHashParam.n;
        r = scryptHashParam.r;
        p = scryptHashParam.p;
        mac = scryptHashParam.mac;
    }
}
