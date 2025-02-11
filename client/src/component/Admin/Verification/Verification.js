import React, { Component } from "react";

import Navbar from "../../Navbar/Navigation";
import NavbarAdmin from "../../Navbar/NavigationAdmin";

import AdminOnly from "../../AdminOnly";

import getWeb3 from "../../../getWeb3";
import Election from "../../../contracts/Election.json";

import "./Verification.css";

export default class Registration extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ElectionInstance: undefined,
      account: null,
      web3: null,
      isAdmin: false,
      voterCount: undefined,
      voters: [],
    };
  }

  componentDidMount = async () => {
    try {
      // Prevent infinite reload loops
      if (!window.location.hash.includes("loaded")) {
        window.location.hash = "loaded";
        window.location.reload();
        return;
      }
  
      // Get network provider and web3 instance
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];
  
      if (!deployedNetwork) {
        throw new Error("Smart contract not deployed to the detected network.");
      }
  
      const instance = new web3.eth.Contract(Election.abi, deployedNetwork.address);
  
      // Set web3, accounts, and contract first
      this.setState({ web3, ElectionInstance: instance, account: accounts[0] }, async () => {
        try {
          // Fetch total number of candidates
          const candidateCount = await instance.methods.getTotalCandidate().call();
          this.setState({ candidateCount });
  
          // Fetch admin details
          const admin = await instance.methods.getAdmin().call();
          this.setState({ isAdmin: this.state.account === admin });
  
          // Fetch total number of voters
          const voterCount = await instance.methods.getTotalVoter().call();
          this.setState({ voterCount });
  
          // Load all voters
          const voters = [];
          for (let i = 0; i < voterCount; i++) {
            const voterAddress = await instance.methods.voters(i).call();
            const voter = await instance.methods.voterDetails(voterAddress).call();
            voters.push({
              address: voter.voterAddress,
              name: voter.name,
              phone: voter.phone,
              hasVoted: voter.hasVoted,
              isVerified: voter.isVerified,
              isRegistered: voter.isRegistered,
            });
          }
  
          // Update state properly
          this.setState({ voters });
        } catch (contractError) {
          console.error("Error interacting with smart contract:", contractError);
        }
      });
    } catch (error) {
      console.error("Failed to load web3, accounts, or contract:", error);
      alert("Failed to load web3, accounts, or contract. Check console for details.");
    }
  };
  
  renderUnverifiedVoters = (voter) => {
    const verifyVoter = async (verifiedStatus, address) => {
      await this.state.ElectionInstance.methods
        .verifyVoter(verifiedStatus, address)
        .send({ from: this.state.account, gas: 1000000 });
      window.location.reload();
    };
    return (
      <>
        {voter.isVerified ? (
          <div className="container-list success">
            <p style={{ margin: "7px 0px" }}>AC: {voter.address}</p>
            <table>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Voted</th>
              </tr>
              <tr>
                <td>{voter.name}</td>
                <td>{voter.phone}</td>
                <td>{voter.hasVoted ? "True" : "False"}</td>
              </tr>
            </table>
          </div>
        ) : null}
        <div
          className="container-list attention"
          style={{ display: voter.isVerified ? "none" : null }}
        >
          <table>
            <tr>
              <th>Account address</th>
              <td>{voter.address}</td>
            </tr>
            <tr>
              <th>Name</th>
              <td>{voter.name}</td>
            </tr>
            <tr>
              <th>Phone</th>
              <td>{voter.phone}</td>
            </tr>
            <tr>
              <th>Voted</th>
              <td>{voter.hasVoted ? "True" : "False"}</td>
            </tr>
            <tr>
              <th>Verified</th>
              <td>{voter.isVerified ? "True" : "False"}</td>
            </tr>
            <tr>
              <th>Registered</th>
              <td>{voter.isRegistered ? "True" : "False"}</td>
            </tr>
          </table>
          <div style={{}}>
            <button
              className="btn-verification approve"
              disabled={voter.isVerified}
              onClick={() => verifyVoter(true, voter.address)}
            >
              Approve
            </button>
          </div>
        </div>
      </>
    );
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
          <AdminOnly page="Verification Page." />
        </>
      );
    }
    return (
      <>
        <NavbarAdmin />
        <div className="container-main">
          <h3>Verification</h3>
          <small>Total Voters: {this.state.voters.length}</small>
          {this.state.voters.length < 1 ? (
            <div className="container-item info">None has registered yet.</div>
          ) : (
            <>
              <div className="container-item info">
                <center>List of registered voters</center>
              </div>
              {this.state.voters.map(this.renderUnverifiedVoters)}
            </>
          )}
        </div>
      </>
    );
  }
}
