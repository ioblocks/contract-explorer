import * as Drago from '../_utils/drago_utils'
import * as abis from '../abi/index'
import BigNumber from 'bignumber.js'
import LockToken from './lockToken'
import PropTypes from 'prop-types'
import React, { Component } from 'react'

class LockUnlockActions extends Component {
  state = {
    amountToLock: '0',
    amountToUnlock: '0',
    errorMsg: {
      amountToLock: '',
      amountToUnlock: ''
    }
  }

  static propTypes = {
    token: PropTypes.object.isRequired,
    fund: PropTypes.object,
    managerAddress: PropTypes.string.isRequired,
    exchange: PropTypes.object.isRequired
  }

  static defaultProps = {
    fund: {},
    managerAddress: ''
  }

  static contextTypes = {
    web3: PropTypes.object.isRequired,
    accounts: PropTypes.array.isRequired
  }

  componentDidMount = async () => {}

  tokenUnLock = async () => {
    const { amountToUnlock } = this.state
    const { web3 } = this.context
    const { amountToLock } = this.state
    const { token, fund, exchange } = this.props
    const amount = Drago.toBaseUnitAmount(
      new BigNumber(amountToLock),
      token.decimals
    ).toFixed()
    if (fund.address === '') {
      let options = {
        from: this.context.accounts[0]
      }
      const v = 1
      const r =
        '0xfa39c1a29cab1aa241b62c2fd067a6602a9893c2afe09aaea371609e11cbd92d'
      const s =
        '0xfa39c1a29cab1aa241b62c2fd067a6602a9893c2afe09aaea371609e11cbd92d'
      const validUntil = 1
      console.log(token.wrappers.Ethfinex.address)
      console.log(amount)
      let receipt
      const abi = token.address === '0x0' ? abis.ethw : abis.wrapper
      const contractWrapper = await new web3.eth.Contract(
        abi,
        token.wrappers.Ethfinex.address
      )
      console.log(contractWrapper)
      if (token.address === '0x0') {
        console.log('locking ETH')
        options.value = amount
        receipt = await contractWrapper.methods
          .withdraw(amount, v, r, s, validUntil)
          .estimateGas(options)
          .then(gasEstimate => {
            console.log(gasEstimate)
            options.gas = gasEstimate
          })
          .then(() => {
            return contractWrapper.methods
              .withdraw(amount, v, r, s, validUntil)
              .send(options)
          })
        console.log(receipt)
      } else {
        receipt = await contractWrapper.methods
          .withdraw(amount, 1)
          .estimateGas(options)
          .then(gasEstimate => {
            console.log(gasEstimate)
            options.gas = gasEstimate
          })
          .then(() => {
            return contractWrapper.methods.withdraw(amount, 1).send(options)
          })
        console.log(receipt)
      }
    } else {
      await Drago.operateOnExchangeEFXUnlock(
        this.context.accounts[0],
        fund.address,
        exchange.exchangeContractAddress,
        token.address,
        token.wrappers.Ethfinex.address,
        Drago.toBaseUnitAmount(new BigNumber(amountToUnlock), token.decimals)
      )
    }
  }

  tokenLock = async () => {
    const { web3 } = this.context
    const { amountToLock } = this.state
    const { token, fund, exchange } = this.props
    const amount = Drago.toBaseUnitAmount(
      new BigNumber(amountToLock),
      token.decimals
    ).toFixed()
    if (fund.address === '') {
      let options = {
        from: this.context.accounts[0]
      }
      console.log(token.wrappers.Ethfinex.address)
      console.log(amount)
      let receipt
      const abi = token.address === '0x0' ? abis.ethw : abis.wrapper
      const contractWrapper = await new web3.eth.Contract(
        abi,
        token.wrappers.Ethfinex.address
      )
      console.log(contractWrapper)
      if (token.address === '0x0') {
        console.log('locking ETH')
        options.value = amount
        receipt = await contractWrapper.methods
          .deposit(amount, 1)
          .estimateGas(options)
          .then(gasEstimate => {
            console.log(gasEstimate)
            options.gas = gasEstimate
          })
          .then(() => {
            return contractWrapper.methods.deposit(amount, 1).send(options)
          })
        console.log(receipt)
      } else {
        receipt = await contractWrapper.methods
          .deposit(amount, 1)
          .estimateGas(options)
          .then(gasEstimate => {
            console.log(gasEstimate)
            options.gas = gasEstimate
          })
          .then(() => {
            return contractWrapper.methods.deposit(amount, 1).send(options)
          })
        console.log(receipt)
      }
    } else {
      console.log(this.props)
      await Drago.operateOnExchangeEFXLock(
        this.context.accounts[0],
        fund.address,
        exchange.exchangeContractAddress,
        token.address,
        token.wrappers.Ethfinex.address,
        Drago.toBaseUnitAmount(new BigNumber(amountToLock), token.decimals),
        1,
        token.isOldERC20
      )
    }
  }

  onChangeAmount = async (newAmount, amountType) => {
    let { token } = this.props
    try {
      let amount = new BigNumber(newAmount)
      return amount.gt(0) &&
        Drago.toBaseUnitAmount(amount, token.decimals).lte(
          amountType === 'amountToLock'
            ? token.availableBalance
            : token.wrappedBalance
        )
        ? this.setState({
            [amountType]: newAmount,
            errorMsg: {
              [amountType]: ''
            }
          })
        : this.setState({
            [amountType]: newAmount,
            errorMsg: {
              [amountType]:
                'Please enter an amount <= than the available balance.'
            }
          })
    } catch (err) {
      console.warn(err)
      this.setState({
        [amountType]: newAmount,
        errorMsg: {
          [amountType]: 'Please enter a valid number.'
        }
      })
    }
  }

  render() {
    const { token, exchange } = this.props
    const { errorMsg, amountToLock, amountToUnlock } = this.state
    return (
      <LockToken
        token={token}
        amountToLock={amountToLock}
        amountToUnlock={amountToUnlock}
        disabled={exchange.needAllowance}
        onChangeAmount={this.onChangeAmount}
        errorMsg={errorMsg}
        tokenLock={this.tokenLock}
        tokenUnLock={this.tokenUnLock}
      />
    )
  }
}

export default LockUnlockActions
