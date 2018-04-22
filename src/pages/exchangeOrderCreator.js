import React from 'react';
import Typography from 'material-ui/Typography';
import Grid from 'material-ui/Grid';
import PropTypes from 'prop-types';
import { BigNumber } from '@0xproject/utils';
import JsonView from '../elements/jsonView'
import ReactJson from 'react-json-view'

// 0x stuff
import * as Web3ProviderEngine from 'web3-provider-engine';
import * as RPCSubprovider from 'web3-provider-engine/subproviders/rpc';
import { InjectedWeb3Subprovider } from '@0xproject/subproviders';
import {ZeroEx} from '0x.js';

import OrderInputFields from "../elements/orderInputFields"


class ExchangeOrderCreator extends React.Component {

  constructor(props) {
    super(props)
    const KOVAN_NETWORK_ID = 42;
    const DECIMALS = 18;
    const ZeroExConfig = {
      networkId: KOVAN_NETWORK_ID,
      // exchangeContractAddress: this.state.fundProxyAddress
    }
    // Create a Web3 Provider Engine
    const providerEngine = new Web3ProviderEngine();
    providerEngine.addProvider(new InjectedWeb3Subprovider(window.web3.currentProvider));
    providerEngine.addProvider(new RPCSubprovider({ rpcUrl: 'https://srv03.endpoint.network:8545' }));
    providerEngine.start();
    var zeroEx = new ZeroEx(providerEngine, ZeroExConfig);
    const WETH_ADDRESS = zeroEx.etherToken.getContractAddressIfExists(); // The wrapped ETH token contract
    const ZRX_ADDRESS = zeroEx.exchange.getZRXTokenAddress(); // The ZRX token contract
    const EXCHANGE_ADDRESS = zeroEx.exchange.getContractAddress();
    const order = {
      maker: ZeroEx.NULL_ADDRESS,
      taker: ZeroEx.NULL_ADDRESS,
      feeRecipient: ZeroEx.NULL_ADDRESS,
      makerTokenAddress: ZRX_ADDRESS,
      takerTokenAddress: WETH_ADDRESS,
      exchangeContractAddress: EXCHANGE_ADDRESS,
      salt: ZeroEx.generatePseudoRandomSalt(),
      makerFee: new BigNumber(0),
      takerFee: new BigNumber(0),
      makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(0), DECIMALS), // Base 18 decimals
      takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(0), DECIMALS), // Base 18 decimals
      expirationUnixTimestampSec: new BigNumber(Date.now() + 3600000), // Valid for up to an hour
    };
    this.state = {
      zeroEx: zeroEx,
      json_object: {},
      order: order,
      orderHash: '',
    };
  }

  static contextTypes = {web3: PropTypes.object.isRequired};

  componentDidMount() {
    const { zeroEx } = this.state
    const { order } = this.state
    zeroEx._web3Wrapper._web3.eth.getAccounts((error, result) => {
      this.setState({
        order: {...order, maker: result[0]} 
      })
    })
  }

  onOrderChange = (order) =>{
    this.setState({
      order: order
    })
  }

  async signOrder() {
    const { order, zeroEx } = this.state
    const orderHash = ZeroEx.getOrderHashHex(order);

    const signerAddress = await zeroEx.getAvailableAddressesAsync()

    // Signing orderHash -> ecSignature
    const shouldAddPersonalMessagePrefix = true;
    const ecSignature = await zeroEx.signOrderHashAsync(orderHash, signerAddress[0], shouldAddPersonalMessagePrefix);

    // Append signature to order
    const signedOrder = {
      ...order,
      ecSignature,
    };
    this.setState({
      signedOrder: signedOrder,
      orderHash: orderHash
    })
  }

  onSignOrder = () =>{
    this.signOrder()
  }

  render() {
    return (
      <Grid container spacing={8}>
        <Grid item xs={12}>
          <br />
          <Typography variant="headline" >
            ORDER
          </Typography>
          <OrderInputFields order={this.state.order} onOrderChange={this.onOrderChange} onSignOrder={this.onSignOrder}/>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="headline" >
            ORDER HASH
          </Typography>
          {/* <FormControl fullWidth={true}>
            <Button variant="raised" onClick={this.onSubmitOrder}>
              SUBMIT
            </Button>
          </FormControl> */}
          {[this.state.orderHash]}
        </Grid>
        <Grid item xs={12}>
          <Typography variant="headline" >
            ORDER OBJECT
          </Typography>
          <ReactJson
            src={this.state.signedOrder}
            style={{ padding: "5px" }}
            theme="codeschool"
            indentWidth="2"
            collapsed="2"
          />
        </Grid>
      </Grid>
    );
  }
}

export default ExchangeOrderCreator;