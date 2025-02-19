Project Setup
1. Compiling the Smart Contracts
Run the following command to compile the smart contracts using Truffle:

bash
Copy
truffle compile
This will compile all the smart contracts in the contracts/ directory.

2. Migrate the Smart Contracts
After compiling, migrate the contracts to the blockchain. Run the following command:

bash
Copy
truffle migrate
This command deploys the compiled contracts to your local or specified Ethereum network.

3. Client-side Setup
Navigate to the Client directory and install the necessary dependencies:

bash
Copy
cd Client
npm install
This will install all the packages listed in the package.json for the front-end of your application.

4. Start the Application
Once the dependencies are installed, you can start the application by running:

bash
Copy
npm start
This will start a development server, and you should be able to view the application in your browser at http://localhost:3000 (or whatever port is specified).
