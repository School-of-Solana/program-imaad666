/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/findare.json`.
 */
export type Findare = {
  "address": "JAVuBXeBZqXNtS73azhBDAoYaaAFfo4gWXoZe2e7Jf8H",
  "metadata": {
    "name": "findare",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "approveClaim",
      "discriminator": [
        74,
        228,
        211,
        63,
        140,
        255,
        69,
        210
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "config",
          "relations": [
            "foundPost"
          ]
        },
        {
          "name": "foundPost",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  111,
                  117,
                  110,
                  100,
                  45,
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "found_post.finder",
                "account": "foundPost"
              },
              {
                "kind": "account",
                "path": "found_post.post_id",
                "account": "foundPost"
              }
            ]
          }
        },
        {
          "name": "claimTicket",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  108,
                  97,
                  105,
                  109,
                  45,
                  116,
                  105,
                  99,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "foundPost"
              },
              {
                "kind": "account",
                "path": "claim_ticket.claimer",
                "account": "claimTicket"
              }
            ]
          }
        },
        {
          "name": "finder",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "approveFoundReport",
      "discriminator": [
        125,
        30,
        145,
        67,
        188,
        85,
        146,
        93
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "config",
          "relations": [
            "lostPost"
          ]
        },
        {
          "name": "lostPost",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  115,
                  116,
                  45,
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "lost_post.owner",
                "account": "lostPost"
              },
              {
                "kind": "account",
                "path": "lost_post.post_id",
                "account": "lostPost"
              }
            ]
          }
        },
        {
          "name": "foundReport",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  111,
                  117,
                  110,
                  100,
                  45,
                  114,
                  101,
                  112,
                  111,
                  114,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "lostPost"
              },
              {
                "kind": "account",
                "path": "found_report.finder",
                "account": "foundReport"
              }
            ]
          }
        },
        {
          "name": "finder",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "claimFoundListing",
      "discriminator": [
        244,
        92,
        103,
        22,
        203,
        232,
        185,
        90
      ],
      "accounts": [
        {
          "name": "claimer",
          "writable": true,
          "signer": true
        },
        {
          "name": "foundPost",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  111,
                  117,
                  110,
                  100,
                  45,
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "found_post.finder",
                "account": "foundPost"
              },
              {
                "kind": "account",
                "path": "found_post.post_id",
                "account": "foundPost"
              }
            ]
          }
        },
        {
          "name": "config",
          "relations": [
            "foundPost"
          ]
        },
        {
          "name": "claimTicket",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  108,
                  97,
                  105,
                  109,
                  45,
                  116,
                  105,
                  99,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "foundPost"
              },
              {
                "kind": "account",
                "path": "claimer"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "claimNotes",
          "type": "string"
        },
        {
          "name": "claimDeposit",
          "type": "u64"
        }
      ]
    },
    {
      "name": "closeLostPost",
      "discriminator": [
        43,
        200,
        112,
        80,
        242,
        142,
        25,
        9
      ],
      "accounts": [
        {
          "name": "lostPost",
          "writable": true
        },
        {
          "name": "poster",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "createFoundListing",
      "discriminator": [
        64,
        56,
        172,
        124,
        253,
        31,
        73,
        79
      ],
      "accounts": [
        {
          "name": "finder",
          "writable": true,
          "signer": true
        },
        {
          "name": "config"
        },
        {
          "name": "foundPost",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  111,
                  117,
                  110,
                  100,
                  45,
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "finder"
              },
              {
                "kind": "arg",
                "path": "postId"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "postId",
          "type": "u64"
        },
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "attributes",
          "type": "string"
        },
        {
          "name": "photoRef",
          "type": "string"
        }
      ]
    },
    {
      "name": "createLostPost",
      "discriminator": [
        87,
        38,
        95,
        116,
        43,
        130,
        252,
        179
      ],
      "accounts": [
        {
          "name": "poster",
          "writable": true,
          "signer": true
        },
        {
          "name": "config"
        },
        {
          "name": "lostPost",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  115,
                  116,
                  45,
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "poster"
              },
              {
                "kind": "arg",
                "path": "postId"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "postId",
          "type": "u64"
        },
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "attributes",
          "type": "string"
        },
        {
          "name": "photoRef",
          "type": "string"
        },
        {
          "name": "rewardLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeApp",
      "discriminator": [
        75,
        120,
        190,
        52,
        218,
        180,
        222,
        75
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "admin",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "rejectClaim",
      "discriminator": [
        238,
        185,
        227,
        8,
        51,
        188,
        35,
        182
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "config",
          "relations": [
            "foundPost"
          ]
        },
        {
          "name": "foundPost",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  111,
                  117,
                  110,
                  100,
                  45,
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "found_post.finder",
                "account": "foundPost"
              },
              {
                "kind": "account",
                "path": "found_post.post_id",
                "account": "foundPost"
              }
            ]
          }
        },
        {
          "name": "claimTicket",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  108,
                  97,
                  105,
                  109,
                  45,
                  116,
                  105,
                  99,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "foundPost"
              },
              {
                "kind": "account",
                "path": "claim_ticket.claimer",
                "account": "claimTicket"
              }
            ]
          }
        },
        {
          "name": "claimer",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "rejectFoundReport",
      "discriminator": [
        103,
        106,
        137,
        244,
        253,
        192,
        115,
        247
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "config",
          "relations": [
            "lostPost"
          ]
        },
        {
          "name": "lostPost",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  115,
                  116,
                  45,
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "lost_post.owner",
                "account": "lostPost"
              },
              {
                "kind": "account",
                "path": "lost_post.post_id",
                "account": "lostPost"
              }
            ]
          }
        },
        {
          "name": "foundReport",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  111,
                  117,
                  110,
                  100,
                  45,
                  114,
                  101,
                  112,
                  111,
                  114,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "lostPost"
              },
              {
                "kind": "account",
                "path": "found_report.finder",
                "account": "foundReport"
              }
            ]
          }
        },
        {
          "name": "finder",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "submitFoundReport",
      "discriminator": [
        35,
        120,
        228,
        120,
        148,
        120,
        221,
        169
      ],
      "accounts": [
        {
          "name": "finder",
          "writable": true,
          "signer": true
        },
        {
          "name": "lostPost",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  115,
                  116,
                  45,
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "lost_post.owner",
                "account": "lostPost"
              },
              {
                "kind": "account",
                "path": "lost_post.post_id",
                "account": "lostPost"
              }
            ]
          }
        },
        {
          "name": "config",
          "relations": [
            "lostPost"
          ]
        },
        {
          "name": "foundReport",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  111,
                  117,
                  110,
                  100,
                  45,
                  114,
                  101,
                  112,
                  111,
                  114,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "lostPost"
              },
              {
                "kind": "account",
                "path": "finder"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "evidenceUri",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "appConfig",
      "discriminator": [
        35,
        142,
        177,
        102,
        131,
        31,
        162,
        52
      ]
    },
    {
      "name": "claimTicket",
      "discriminator": [
        239,
        28,
        188,
        14,
        190,
        134,
        159,
        174
      ]
    },
    {
      "name": "foundPost",
      "discriminator": [
        7,
        24,
        252,
        152,
        224,
        6,
        110,
        202
      ]
    },
    {
      "name": "foundReport",
      "discriminator": [
        64,
        132,
        164,
        87,
        153,
        22,
        183,
        238
      ]
    },
    {
      "name": "lostPost",
      "discriminator": [
        240,
        253,
        237,
        169,
        128,
        35,
        79,
        225
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "rewardTooSmall",
      "msg": "Reward too small"
    },
    {
      "code": 6001,
      "name": "claimDepositTooSmall",
      "msg": "Claim deposit too small"
    },
    {
      "code": 6002,
      "name": "lostPostNotOpen",
      "msg": "Lost post not open for this action"
    },
    {
      "code": 6003,
      "name": "unauthorized",
      "msg": "You are not authorized to perform this action"
    },
    {
      "code": 6004,
      "name": "reportAlreadyProcessed",
      "msg": "Report already processed"
    },
    {
      "code": 6005,
      "name": "claimAlreadyProcessed",
      "msg": "Claim already processed"
    },
    {
      "code": 6006,
      "name": "claimNotAllowed",
      "msg": "Claim not allowed in current state"
    },
    {
      "code": 6007,
      "name": "emptyField",
      "msg": "Input field is empty"
    },
    {
      "code": 6008,
      "name": "fieldTooLong",
      "msg": "Input field exceeds allowed length"
    },
    {
      "code": 6009,
      "name": "outstandingReward",
      "msg": "Outstanding reward remains in escrow"
    },
    {
      "code": 6010,
      "name": "insufficientEscrow",
      "msg": "Insufficient lamports in escrow account"
    }
  ],
  "types": [
    {
      "name": "appConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "lostPostCount",
            "type": "u64"
          },
          {
            "name": "foundPostCount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "claimStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "open"
          },
          {
            "name": "awaitingAdminReview"
          },
          {
            "name": "closed"
          }
        ]
      }
    },
    {
      "name": "claimTicket",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "foundPost",
            "type": "pubkey"
          },
          {
            "name": "claimer",
            "type": "pubkey"
          },
          {
            "name": "notes",
            "type": "string"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "verificationStatus"
              }
            }
          },
          {
            "name": "depositLamports",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "foundPost",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "config",
            "type": "pubkey"
          },
          {
            "name": "finder",
            "type": "pubkey"
          },
          {
            "name": "postId",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "claimStatus"
              }
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "attributes",
            "type": "string"
          },
          {
            "name": "photoRef",
            "type": "string"
          },
          {
            "name": "activeClaim",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "foundReport",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lostPost",
            "type": "pubkey"
          },
          {
            "name": "finder",
            "type": "pubkey"
          },
          {
            "name": "evidenceUri",
            "type": "string"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "verificationStatus"
              }
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "lostPost",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "config",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "finder",
            "type": "pubkey"
          },
          {
            "name": "postId",
            "type": "u64"
          },
          {
            "name": "rewardLamports",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "postStatus"
              }
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "attributes",
            "type": "string"
          },
          {
            "name": "photoRef",
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "postStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "open"
          },
          {
            "name": "awaitingAdminReview"
          },
          {
            "name": "awaitingPickup"
          },
          {
            "name": "closed"
          }
        ]
      }
    },
    {
      "name": "verificationStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "submitted"
          },
          {
            "name": "approved"
          },
          {
            "name": "rejected"
          }
        ]
      }
    }
  ]
};
