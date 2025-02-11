// Node modules
import React, { Component } from "react";
import { Link } from "react-router-dom";

// Components
import Navbar from "../Navbar/Navigation";
import NavbarAdmin from "../Navbar/NavigationAdmin";
import NotInit from "../NotInit";

// Contract
import getWeb3 from "../../getWeb3";
import Election from "../../contracts/Election.json";

// CSS
import "./Voting.css";

export default class Voting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ElectionInstance: undefined,
      account: null,
      web3: null,
      isAdmin: false,
      candidateCount: undefined,
      candidates: [],
      isElStarted: false,
      isElEnded: false,
      currentVoter: {
        address: undefined,
        name: null,
        phone: null,
        hasVoted: false,
        isVerified: false,
        isRegistered: false,
      },
    };
  }
  componentDidMount = async () => {
    try {
      // Prevent infinite reload loop
      if (!window.location.hash.includes("loaded")) {
        window.location.hash = "loaded";
        window.location.reload();
        return;
      }
  
      // Get Web3 instance and accounts
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];
  
      if (!deployedNetwork) {
        throw new Error("Smart contract not deployed to the detected network.");
      }
  
      const instance = new web3.eth.Contract(Election.abi, deployedNetwork.address);
  
      // Set web3, accounts, and contract instance before making contract calls
      this.setState({ web3, ElectionInstance: instance, account: accounts[0] }, async () => {
        try {
          // Get total number of candidates
          const candidateCount = await instance.methods.getTotalCandidate().call();
          this.setState({ candidateCount });
  
          // Get election start & end status
          const start = await instance.methods.getStart().call();
          const end = await instance.methods.getEnd().call();
          this.setState({ isElStarted: start, isElEnded: end });
  
          // Load candidates
          const candidates = [];
          for (let i = 0; i < candidateCount; i++) {
            const candidate = await instance.methods.candidateDetails(i).call();
            candidates.push({
              id: candidate.candidateId,
              header: candidate.header,
              slogan: candidate.slogan,
            });
          }
          this.setState({ candidates });
  
          // Load current voter
          const voter = await instance.methods.voterDetails(this.state.account).call();
          this.setState({
            currentVoter: {
              address: voter.voterAddress,
              name: voter.name,
              phone: voter.phone,
              hasVoted: voter.hasVoted,
              isVerified: voter.isVerified,
              isRegistered: voter.isRegistered,
            },
          });
  
          // Admin account verification
          const admin = await instance.methods.getAdmin().call();
          this.setState({ isAdmin: this.state.account === admin });
        } catch (contractError) {
          console.error("Error interacting with smart contract:", contractError);
        }
      });
    } catch (error) {
      console.error("Failed to load web3, accounts, or contract:", error);
      alert("Failed to load web3, accounts, or contract. Check console for details.");
    }
  };
  

  renderCandidates = (candidate) => {
    const castVote = async (id) => {
      await this.state.ElectionInstance.methods
        .vote(id)
        .send({ from: this.state.account, gas: 1000000 });
      window.location.reload();
    };
    const confirmVote = (id, header) => {
      var r = window.confirm(
        "Vote for " + header + " with Id " + id + ".\nAre you sure?"
      );
      if (r === true) {
        castVote(id);
      }
    };
    return (
      <div className="container-item">
        <div className="candidate-info">
          <h2>
            {candidate.header} <small>#{candidate.id}</small>
          </h2>
          <p className="slogan">{candidate.slogan}</p>
        </div>
        <div className="vote-btn-container">
          <button
            onClick={() => confirmVote(candidate.id, candidate.header)}
            className="vote-bth"
            disabled={
              !this.state.currentVoter.isRegistered ||
              !this.state.currentVoter.isVerified ||
              this.state.currentVoter.hasVoted
            }
          >
            Vote
          </button>
        </div>
      </div>
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

    return (
      <>
        {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}
        <div>
          {!this.state.isElStarted && !this.state.isElEnded ? (
            <NotInit />
          ) : this.state.isElStarted && !this.state.isElEnded ? (
            <>
              {this.state.currentVoter.isRegistered ? (
                this.state.currentVoter.isVerified ? (
                  this.state.currentVoter.hasVoted ? (
                    <div className="container-item success">
                      <div>
                        <strong>You've casted your vote.</strong>
                        <p />
                        <center>
                          <Link
                            to="/Results"
                            style={{
                              color: "black",
                              textDecoration: "underline",
                            }}
                          >
                            See Results
                          </Link>
                        </center>
                      </div>
                    </div>
                  ) : (
                    <div className="container-item info">
                      <center>Go ahead and cast your vote.</center>
                    </div>
                  )
                ) : (
                  <div className="container-item attention">
                    <center>Please wait for admin to verify.</center>
                  </div>
                )
              ) : (
                <>
                  <div className="container-item attention">
                    <center>
                      <p>You're not registered. Please register first.</p>
                      <br />
                      <Link
                        to="/Registration"
                        style={{ color: "black", textDecoration: "underline" }}
                      >
                        Registration Page
                      </Link>
                    </center>
                  </div>
                </>
              )}
              <div className="container-main">
                <h2>Candidates</h2>
                <small>Total candidates: {this.state.candidates.length}</small>
                {this.state.candidates.length < 1 ? (
                  <div className="container-item attention">
                    <center>Not one to vote for.</center>
                  </div>
                ) : (
                  <>
                    {this.state.candidates.map(this.renderCandidates)}
                    <div
                      className="container-item"
                      style={{ border: "1px solid black" }}
                    >
                      <center>That is all.</center>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : !this.state.isElStarted && this.state.isElEnded ? (
            <>
              <div className="container-item attention">
                <center>
                  <h3>The Election ended.</h3>
                  <br />
                  <Link
                    to="/Results"
                    style={{ color: "black", textDecoration: "underline" }}
                  >
                    See results
                  </Link>
                </center>
              </div>
            </>
          ) : null}
        </div>
      </>
    );
  }
}
