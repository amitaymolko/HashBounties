const HashBounties = artifacts.require('HashBounties')

contract('HashBounties', (accounts) => {
  
  var account = accounts[0]
  var account2 = accounts[1]
  var oracle = accounts[2]

  const minValue = web3.toWei(0.001, 'ether')
  const inputBytes = "0x19af5e7a09875927cdec8900a5b4ce1e428b6746836586ea6838d1cf5a0271152052d7e775c9b3a5d8ebf40e2be3be234707816a758b6eec1ba28c54a4b6cf63de200008010994fb7a49c0f5f4b2c365e168f27701366acb3c326c11366b027eb96119140b"

  it('deploy and grab', async () => {
    // Contract = await HashBounties.new()
    Contract = await HashBounties.deployed()
    // console.log('Contract', Contract.address)
  })

  it('fails to submit hashcrack with invalid hashtype', async () => {
    try {
      const value = web3.toWei(0.1, 'ether')
      const tx = await Contract.requestHashBounty(0x19513FDC9DA4FB72A4A05EB66917548D3C90FF94D5419E1F2363EEA89DFEE1DD, "invalid_hash_type", "", { value })
      console.log('tx', tx)
      throw new Error('unauthorized tx')
    } catch (err) {
      if (!err.message.endsWith('revert')) {
        throw err
      }
      return
    }
  })

  it('fails to submit hashcrack with invalid amount', async () => {
    try {
      const value = web3.toWei(0.0001, 'ether')
      const tx = await Contract.requestHashBounty(0x19513FDC9DA4FB72A4A05EB66917548D3C90FF94D5419E1F2363EEA89DFEE1DD, "sha256", "", { value })
      console.log('tx', tx)
      throw new Error('unauthorized tx')
    } catch (err) {
      if (!err.message.endsWith('revert')) {
        throw err
      }
      return
    }
  })

  it('fires NewHashEvent', (done) => {
    const value = web3.toWei(0.1, 'ether')
    var event = Contract.NewHashEvent()
    event.watch(function (err, result) {
      if (err) {
        console.log(err)
        return
      }      
      
      assert.isTrue(result.args.requestorAddress == account)
      assert.isTrue(result.args.bountyValue.toString() == value)
      assert.isTrue(result.args.hashBytes == "0x19513fdc9da4fb72a4a05eb66917548d3c90ff94d5419e1f2363eea89dfee1dd")
      assert.isTrue(result.args.hashType == "sha256")

      event.stopWatching()
      done()
    })
    Contract.requestHashBounty("0x19513FDC9DA4FB72A4A05EB66917548D3C90FF94D5419E1F2363EEA89DFEE1DD", "sha256", "", { value }) //Password1
  })

  it('fails to submit crack with wrong password', async () => {
    try {
      const value = web3.toWei(0.1, 'ether')
      const tx = await Contract.submitCrack(0, "wrong_password", { value })
      console.log('tx', tx)
      throw new Error('unauthorized tx')
    } catch (err) {
      if (!err.message.endsWith('revert')) {
        throw err
      }
      return
    }
  })

  it('fails to cancel crack with wrong account', async () => {
    try {
      const tx = await Contract.cancelHashBounty(0, {from: account2})
      console.log('tx', tx)
      throw new Error('unauthorized tx')
    } catch (err) {
      if (!err.message.endsWith('revert')) {
        throw err
      }
      return
    }
  })

  it('fires CrackedHashEvent', (done) => {
    const value = web3.toWei(0.1, 'ether')
    var event = Contract.CrackedHashEvent()
    event.watch(function (err, result) {
      if (err) {
        console.log(err)
        return
      }

      assert.isTrue(result.args.crackerAddress == account2)
    
      event.stopWatching()
      done()
    })
    Contract.submitCrack(0, "Password1", { from: account2, value })
  })

  it('redeem reward', async () => {
    const initialHashBounty = (await Contract.hashBountys(0))
    assert.isFalse(initialHashBounty[7])
    await Contract.redeemRewardUnsafe(0, { from: account2 })
    const finalHashBounty = (await Contract.hashBountys(0))
    assert.isTrue(finalHashBounty[7])
  })

  // it('fails to redeem redeemed hash', async () => {
  //   const initialHashBounty = (await Contract.hashBountys(0))
  //   assert.isTrue(initialHashBounty[7])
  //   try {
  //     const tx = await Contract.redeemCrackAttemptUnsafe(0, { from: account2 })
  //     console.log('tx', tx)
  //     throw new Error('unauthorized tx')
  //   } catch (err) {
  //     if (!err.message.endsWith('revert')) {
  //       throw err
  //     }
  //     return
  //   }
  // })

  it('fails to submit crack on already cracked hash', async () => {
    const length = (await Contract.getHashBountysLength()).toNumber()
    const hashBounty = (await Contract.hashBountys(0))
    // console.log('length', length)
    // console.log('hashBounty', hashBounty)

    try {
      const value = web3.toWei(0.1, 'ether')
      const tx = await Contract.submitCrack(0, "Password1", { from: account2, value })
      console.log('tx', tx)
      throw new Error('unauthorized tx')
    } catch (err) {
      if (!err.message.endsWith('revert')) {
        throw err
      }
      return
    }
  })

  it('submits and cancels crack with password', async() => { 
    const value = web3.toWei(0.1, 'ether')
    await Contract.requestHashBounty("0x19513FDC9DA4FB72A4A05EB66917548D3C90FF94D5419E1F2363EEA89DFEE1DD", "sha256", "", { value }) //Password1
    await Contract.cancelHashBounty(1)
    const hashBounty = (await Contract.hashBountys(1))    
    assert.isTrue(hashBounty[6])
  })

  it('submits scrypt hash', async () => {
    const value = web3.toWei(0.1, 'ether')
    const hash = web3.sha3(inputBytes, { encoding: "hex" })
    await Contract.requestHashBounty(hash, "scrypt", inputBytes, { value })
    // const hashBounty = (await Contract.hashBountys(1))
    const scryptHashParam = await Contract.getScrypt(hash)

    assert.isTrue(scryptHashParam[0] == "0x19af5e7a09875927cdec8900a5b4ce1e428b6746836586ea6838d1cf5a027115")
    assert.isTrue(scryptHashParam[1].toNumber() == 32)
    assert.isTrue(scryptHashParam[2] == "0x52d7e775c9b3a5d8ebf40e2be3be234707816a758b6eec1ba28c54a4b6cf63de")
    assert.isTrue(scryptHashParam[3].toNumber() == 8192)
    assert.isTrue(scryptHashParam[4].toNumber() == 8)
    assert.isTrue(scryptHashParam[5].toNumber() == 1)
    assert.isTrue(scryptHashParam[6] == "0x0994fb7a49c0f5f4b2c365e168f27701366acb3c326c11366b027eb96119140b")
  })

  it('submits scrypt hash', async () => {
    const value = web3.toWei(0.1, 'ether')
    const length = (await Contract.getHashBountysLength()).toNumber()
    await Contract.submitCrack(length - 1, "1234567890", { value, from: account2 })
  })

  it('fails to submit crack on already requested password', async () => {
    const value = web3.toWei(0.1, 'ether')
    const length = (await Contract.getHashBountysLength()).toNumber()

    try {
      const tx = await Contract.submitCrack(length - 1, "1234567890", { value, from: oracle })
      console.log('tx', tx)
      throw new Error('unauthorized tx')
    } catch (err) {
      if (!err.message.endsWith('revert')) {
        throw err
      }
      return
    }
  })
  

  // it('redeems crack', async () => {
  //   const initialHashBounty = (await Contract.hashBountys(2))
  //   console.log('initialHashBounty', initialHashBounty)
    
  //   await Contract.redeemCrackAttemptUnsafe(2, {from: account2})
  //   const hashBounty = (await Contract.hashBountys(2))
  //   assert.isTrue(hashBounty[7])
  // })
})
