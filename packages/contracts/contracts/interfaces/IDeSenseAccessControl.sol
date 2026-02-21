// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDeSenseAccessControl {
    function OPERATOR_ROLE() external view returns (bytes32);
    function BUYER_ROLE() external view returns (bytes32);
    function AUDITOR_ROLE() external view returns (bytes32);

    function grantOperatorRole(address account) external;
    function grantBuyerRole(address account) external;
    function grantAuditorRole(address account) external;
    function revokeOperatorRole(address account) external;
    function revokeBuyerRole(address account) external;
    function revokeAuditorRole(address account) external;

    function isOperator(address account) external view returns (bool);
    function isBuyer(address account) external view returns (bool);
    function isAuditor(address account) external view returns (bool);
    function isAdmin(address account) external view returns (bool);
}
