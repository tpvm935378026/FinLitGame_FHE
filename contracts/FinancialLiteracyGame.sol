// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract FinancialLiteracyGame is SepoliaConfig {
    // Player profile with encrypted attributes
    struct PlayerProfile {
        euint32 encryptedKnowledgeLevel;
        euint32 encryptedRiskTolerance;
        euint32 encryptedFinancialGoals;
        uint256 lastPlayed;
        bool isRegistered;
    }
    
    // Game challenge structure
    struct GameChallenge {
        euint32 difficultyLevel;
        euint32 rewardAmount;
        string challengeType;
        bool isActive;
    }
    
    // Player game state
    struct PlayerState {
        euint32 encryptedScore;
        euint32 encryptedProgress;
        uint256 lastChallengeCompleted;
    }

    // Contract state
    mapping(address => PlayerProfile) private playerProfiles;
    mapping(address => PlayerState) public playerStates;
    GameChallenge[] public challenges;
    
    // Encrypted leaderboard
    euint32 private encryptedTopScore;
    address private topPlayer;
    
    // Request tracking
    mapping(uint256 => address) private requestToPlayer;
    mapping(uint256 => string) private requestType;
    
    // Events
    event PlayerRegistered(address indexed player);
    event ChallengeCompleted(address indexed player, uint256 challengeId);
    event PersonalizedChallengeGenerated(address indexed player, uint256 challengeId);
    event ScoreUpdated(address indexed player);

    /// @dev Modifier to check if player is registered
    modifier onlyRegistered() {
        require(playerProfiles[msg.sender].isRegistered, "Player not registered");
        _;
    }

    /// @notice Register player with encrypted attributes
    function registerPlayer(
        euint32 knowledgeLevel,
        euint32 riskTolerance,
        euint32 financialGoals
    ) public {
        require(!playerProfiles[msg.sender].isRegistered, "Already registered");
        
        playerProfiles[msg.sender] = PlayerProfile({
            encryptedKnowledgeLevel: knowledgeLevel,
            encryptedRiskTolerance: riskTolerance,
            encryptedFinancialGoals: financialGoals,
            lastPlayed: 0,
            isRegistered: true
        });
        
        // Initialize game state
        playerStates[msg.sender] = PlayerState({
            encryptedScore: FHE.asEuint32(0),
            encryptedProgress: FHE.asEuint32(0),
            lastChallengeCompleted: 0
        });
        
        emit PlayerRegistered(msg.sender);
    }

    /// @notice Request personalized challenge generation
    function requestPersonalizedChallenge() public onlyRegistered {
        PlayerProfile storage profile = playerProfiles[msg.sender];
        
        // Prepare encrypted attributes for computation
        bytes32[] memory ciphertexts = new bytes32[](3);
        ciphertexts[0] = FHE.toBytes32(profile.encryptedKnowledgeLevel);
        ciphertexts[1] = FHE.toBytes32(profile.encryptedRiskTolerance);
        ciphertexts[2] = FHE.toBytes32(profile.encryptedFinancialGoals);
        
        // Request challenge generation
        uint256 reqId = FHE.requestComputation(ciphertexts, this.generateChallenge.selector);
        requestToPlayer[reqId] = msg.sender;
        requestType[reqId] = "generate";
        
        emit PersonalizedChallengeGenerated(msg.sender, reqId);
    }

    /// @notice Callback for personalized challenge generation
    function generateChallenge(
        uint256 requestId,
        bytes memory results,
        bytes memory proof
    ) public {
        address player = requestToPlayer[requestId];
        require(player != address(0), "Invalid request");
        require(keccak256(abi.encodePacked(requestType[requestId])) == keccak256(abi.encodePacked("generate")), "Invalid type");
        
        // Verify computation proof
        FHE.checkSignatures(requestId, results, proof);
        
        // Process generated challenge parameters
        euint32[] memory challengeParams = abi.decode(results, (euint32[]));
        
        // Create new challenge
        challenges.push(GameChallenge({
            difficultyLevel: challengeParams[0],
            rewardAmount: challengeParams[1],
            challengeType: "Personalized",
            isActive: true
        }));
        
        uint256 newChallengeId = challenges.length - 1;
        emit PersonalizedChallengeGenerated(player, newChallengeId);
    }

    /// @notice Submit challenge solution
    function submitChallengeSolution(
        uint256 challengeId,
        euint32 encryptedSolution
    ) public onlyRegistered {
        require(challengeId < challenges.length, "Invalid challenge");
        require(challenges[challengeId].isActive, "Challenge not active");
        
        // Prepare data for solution verification
        bytes32[] memory ciphertexts = new bytes32[](1);
        ciphertexts[0] = FHE.toBytes32(encryptedSolution);
        
        // Request solution verification
        uint256 reqId = FHE.requestComputation(ciphertexts, this.verifySolution.selector);
        requestToPlayer[reqId] = msg.sender;
        requestType[reqId] = "verify";
    }

    /// @notice Callback for solution verification
    function verifySolution(
        uint256 requestId,
        bytes memory results,
        bytes memory proof
    ) public {
        address player = requestToPlayer[requestId];
        require(player != address(0), "Invalid request");
        require(keccak256(abi.encodePacked(requestType[requestId])) == keccak256(abi.encodePacked("verify")), "Invalid type");
        
        // Verify computation proof
        FHE.checkSignatures(requestId, results, proof);
        
        // Process verification result
        ebool isCorrect = abi.decode(results, (ebool));
        
        if (FHE.decrypt(isCorrect)) {
            // Update player progress
            PlayerState storage state = playerStates[player];
            state.encryptedScore = FHE.add(state.encryptedScore, FHE.asEuint32(10));
            state.encryptedProgress = FHE.add(state.encryptedProgress, FHE.asEuint32(1));
            
            // Update leaderboard
            ebool isHigher = FHE.gt(state.encryptedScore, encryptedTopScore);
            if (FHE.decrypt(isHigher)) {
                encryptedTopScore = state.encryptedScore;
                topPlayer = player;
            }
            
            emit ChallengeCompleted(player, requestId);
            emit ScoreUpdated(player);
        }
    }

    /// @notice Update player knowledge level
    function updateKnowledgeLevel(euint32 newLevel) public onlyRegistered {
        playerProfiles[msg.sender].encryptedKnowledgeLevel = newLevel;
    }

    /// @notice Get encrypted player score
    function getEncryptedScore(address player) public view returns (euint32) {
        return playerStates[player].encryptedScore;
    }

    /// @notice Request score decryption
    function requestScoreDecryption() public onlyRegistered {
        euint32 score = playerStates[msg.sender].encryptedScore;
        
        bytes32[] memory ciphertexts = new bytes32[](1);
        ciphertexts[0] = FHE.toBytes32(score);
        
        uint256 reqId = FHE.requestDecryption(ciphertexts, this.decryptScore.selector);
        requestToPlayer[reqId] = msg.sender;
        requestType[reqId] = "decrypt";
    }

    /// @notice Callback for decrypted score
    function decryptScore(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory proof
    ) public {
        address player = requestToPlayer[requestId];
        require(player != address(0), "Invalid request");
        require(keccak256(abi.encodePacked(requestType[requestId])) == keccak256(abi.encodePacked("decrypt")), "Invalid type");
        
        // Verify decryption proof
        FHE.checkSignatures(requestId, cleartexts, proof);
        
        // Process decrypted score
        uint32 score = abi.decode(cleartexts, (uint32));
        // Could emit event or store temporarily
    }

    /// @notice Add predefined challenge
    function addPredefinedChallenge(
        euint32 difficulty,
        euint32 reward,
        string memory challengeType
    ) public {
        challenges.push(GameChallenge({
            difficultyLevel: difficulty,
            rewardAmount: reward,
            challengeType: challengeType,
            isActive: true
        }));
    }
}