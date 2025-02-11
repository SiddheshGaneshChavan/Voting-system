import React, { Component } from "react";

import Navbar from "../../Navbar/Navigation";
import NavbarAdmin from "../../Navbar/NavigationAdmin";

import AdminOnly from "../../AdminOnly";

import getWeb3 from "../../../getWeb3";
import Election from "../../../contracts/Election.json";

import "./StartEnd.css";

export default class StartEnd extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ElectionInstance: undefined,
      web3: null,
      accounts: null,
      isAdmin: false,
      elStarted: false,
      elEnded: false,
    };
  }

  componentDidMount = async () => {
    try {
      // Refreshing page only once without infinite reload loop
      if (!window.location.hash.includes("loaded")) {
        window.location.hash = "loaded";
        window.location.reload();
        return;
      }
  
      // Get network provider and web3 instance.
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];
  
      if (!deployedNetwork) {
        throw new Error("Smart contract not deployed to the detected network.");
      }
  
      const instance = new web3.eth.Contract(Election.abi, deployedNetwork.address);
  
      // Update state first before making contract calls
      this.setState({ web3, ElectionInstance: instance, account: accounts[0] }, async () => {
        try {
          // Ensure ElectionInstance is available before calling contract methods
          const admin = await instance.methods.getAdmin().call();
          this.setState({ isAdmin: this.state.account === admin });
  
          // Get election start and end values
          const start = await instance.methods.getStart().call();
          const end = await instance.methods.getEnd().call();
          this.setState({ elStarted: start, elEnded: end });
        } catch (contractError) {
          console.error("Error interacting with smart contract:", contractError);
        }
      });
    } catch (error) {
      console.error("Failed to load web3, accounts, or contract:", error);
      alert("Failed to load web3, accounts, or contract. Check console for details.");
    }
  };
  

  startElection = async () => {
    await this.state.ElectionInstance.methods
      .startElection()
      .send({ from: this.state.account, gas: 1000000 });
    window.location.reload();
  };
  endElection = async () => {
    await this.state.ElectionInstance.methods
      .endElection()
      .send({ from: this.state.account, gas: 1000000 });
    window.location.reload();
  };

  render() {
    if (!this.state.web3) {
      return (
        <>
          {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}
          <center>Loading Web3, accounts, and contract...</center>
        </>
      );
    }
    if (!this.state.isAdmin) {
      return (
        <>
          <Navbar />
          <AdminOnly page="Start and end election page." />
        </>
      );
    }
    return (
      <>
        <NavbarAdmin />
        {!this.state.elStarted & !this.state.elEnded ? (
          <div className="container-item info">
            <center>The election have never been initiated.</center>
          </div>
        ) : null}
        <div className="container-main">
          <h3>Start or end election</h3>
          {!this.state.elStarted ? (
            <>
              <div className="container-item">
                <button onClick={this.startElection} className="start-btn">
                  Start {this.state.elEnded ? "Again" : null}
                </button>
              </div>
              {this.state.elEnded ? (
                <div className="container-item">
                  <center>
                    <p>The election ended.</p>
                  </center>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="container-item">
                <center>
                  <p>The election started.</p>
                </center>
              </div>
              <div className="container-item">
                <button onClick={this.endElection} className="start-btn">
                  End
                </button>
              </div>
            </>
          )}
          <div className="election-status">
            <p>Started: {this.state.elStarted ? "True" : "False"}</p>
            <p>Ended: {this.state.elEnded ? "True" : "False"}</p>
          </div>
        </div>
      </>
    );
  }
}
