/**
 * ENS Response Templates
 * Provides consistent JSON response formats for ENS-related operations
 */

export const ENSResponses = {
  // Success responses
  ensResolved: (ens: string, address: string) => ({
    success: true,
    message: "ENS name resolved successfully",
    ens,
    address,
    ensUrl: `https://app.ens.domains/${ens}`
  }),

  ensVerified: (ens: string, address: string) => ({
    success: true,
    message: "ENS verification completed",
    ens,
    address,
    verified: true
  }),

  reverseEnsFound: (address: string, ens: string) => ({
    success: true,
    message: "Reverse ENS lookup successful",
    address,
    ens,
    ensUrl: `https://app.ens.domains/${ens}`
  }),

  // Error responses
  ensNotResolved: (ens: string) => ({
    success: false,
    error: "ENS name does not resolve",
    ens,
    suggestion: "Please verify the ENS name is correct and properly configured"
  }),

  ensMismatch: (ens: string, expectedAddress: string, resolvedAddress: string) => ({
    success: false,
    error: "ENS does not resolve to signer address",
    ens,
    expectedAddress,
    resolvedAddress,
    suggestion: "The ENS name resolves to a different address than the one signing"
  }),

  reverseEnsMissing: (address: string) => ({
    success: false,
    error: "Reverse ENS lookup returned no name for address",
    address,
    suggestion: "Set up reverse resolution at https://app.ens.domains/"
  }),

  reverseEnsMismatch: (address: string, expectedEns: string, reverseEns: string) => ({
    success: false,
    error: "Reverse ENS name does not match provided ENS",
    address,
    expectedEns,
    reverseEns,
    suggestion: "The reverse ENS lookup returned a different name"
  }),

  // Info responses
  ensInfo: (ens?: string) => ({
    message: "ENS domain information",
    ensProvided: !!ens,
    ens: ens || null,
    ensUrl: ens ? `https://app.ens.domains/${ens}` : "https://app.ens.domains/",
    reverseResolutionRequired: false
  })
};
