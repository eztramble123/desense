// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./SimpleAccount.sol";

/**
 * @title SimpleAccountFactory
 * @notice CREATE2-based factory for deploying SimpleAccount proxies at deterministic addresses
 */
contract SimpleAccountFactory {
    address public immutable accountImplementation;

    event AccountCreated(address indexed account, address indexed owner);

    constructor(address _entryPoint) {
        accountImplementation = address(new SimpleAccount(_entryPoint));
    }

    /**
     * @notice Deploy a new SimpleAccount for the given owner with CREATE2
     * @param owner The owner of the new account
     * @param salt Unique salt for deterministic address
     */
    function createAccount(address owner, uint256 salt) external returns (SimpleAccount) {
        bytes32 combinedSalt = keccak256(abi.encodePacked(owner, salt));

        // Check if already deployed
        address predicted = Clones.predictDeterministicAddress(accountImplementation, combinedSalt);
        if (predicted.code.length > 0) {
            return SimpleAccount(payable(predicted));
        }

        SimpleAccount account = SimpleAccount(
            payable(Clones.cloneDeterministic(accountImplementation, combinedSalt))
        );
        account.initialize(owner);

        emit AccountCreated(address(account), owner);
        return account;
    }

    /**
     * @notice Get the deterministic address for a given owner and salt (without deploying)
     */
    function getAddress(address owner, uint256 salt) external view returns (address) {
        bytes32 combinedSalt = keccak256(abi.encodePacked(owner, salt));
        return Clones.predictDeterministicAddress(accountImplementation, combinedSalt);
    }
}
