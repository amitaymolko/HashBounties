import binascii
import os
import subprocess
import time
import requests
import rlp
from ethereum import transactions
from web3 import HTTPProvider, Web3


def load_contract(url):
    r = requests.get(url)
    return r.json()


contract_details = load_contract('https://hashbounty.com/HashBounties.json')
contract_abi = contract_details.get('abi')
contract_address = Web3.toChecksumAddress(contract_details.get('networks').get('3').get('address'))
web3 = Web3(HTTPProvider("https://ropsten.infura.io/"))
contract = web3.eth.contract(address=contract_address, abi=contract_abi)
hash_count = contract.call().getHashBountysLength()
already_cracked = set()


def send_solution(index, solution):
    print(index, solution)
    owner = os.getenv('BREAKER_FROM_ADDRES')
    private_key = binascii.unhexlify(os.getenv('BREAKER_PRIVATE_KEY'))

    nonce = web3.eth.getTransactionCount(owner)
    params = contract.encodeABI('submitCrack', [index, solution])
    params = binascii.unhexlify(params[2:])
    tx = transactions.Transaction(to=contract_address, nonce=nonce, gasprice=int(web3.eth.gasPrice / 4),
                                  startgas=250000, value=int(0.2 * (10 ** 18)), data=params).sign(private_key)
    ret = web3.eth.sendRawTransaction(web3.toHex(rlp.encode(tx)))
    print(binascii.hexlify(ret))


while True:
    time.sleep(3)
    print("Looping...")
    for i in range(int(hash_count)):
        single_hash = contract.call().hashBountys(i)
        requester, bounty, hash_bytes, hash_type, cracker, password, cancelled, redeemed = single_hash

        if password and hash_type == 'scrypt':
            already_cracked.add(hash_bytes)
            continue

        if hash_type == 'scrypt' and not (password or cancelled or redeemed) and hash_bytes not in already_cracked:

            print("requester: ", requester)
            print("bounty: ", bounty)
            print(binascii.hexlify(hash_bytes))

            scrypt_item = contract.call().getScrypt(hash_bytes)
            if scrypt_item:
                printable_hash_bytes = binascii.hexlify(hash_bytes).decode()
                ciphertext, dklen, salt, n, r, p, mac = scrypt_item

                ciphertext = binascii.hexlify(ciphertext).decode()
                mac = binascii.hexlify(mac).decode()
                salt = binascii.hexlify(salt).decode()

                hashcat_hash = "$ethereum$s*%s*%s*%s*%s*%s*%s" % (
                    n, r, p, salt, ciphertext, mac)

                os.chdir(os.getcwd() + '//hashcat')

                hashcat_file = '../wallets/{0}.txt'.format(printable_hash_bytes)
                with open(hashcat_file, 'w') as h:
                    h.write(hashcat_hash)

                p = subprocess.run(
                    ['hashcat64.exe', '-m', '15700', '-a', '0', '--scrypt-tmto', '1', '-w', '1', '-D1', '-n',
                     '1', '--force', hashcat_file, '../passwords.txt'])

                with open('hashcat.potfile') as h:
                    for line in h:
                        if line.find(hashcat_hash) > -1:
                            password = line.split(':')[-1].strip()
                            if password:
                                send_solution(i, password)
                                already_cracked.add(hash_bytes)
                os.chdir(os.path.relpath(os.getcwd() + '//..'))
