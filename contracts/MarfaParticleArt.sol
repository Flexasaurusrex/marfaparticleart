// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MarfaParticleArt
 * @notice Interactive desert-inspired generative art NFT collection on Base
 * @dev Each NFT contains unique particle design with embedded HTML from Marfa, Texas
 */
contract MarfaParticleArt is ERC721, ERC721URIStorage, ERC721Royalty, Ownable, Pausable, ReentrancyGuard {
    uint256 private _tokenIdCounter;
    uint256 public constant MAX_SUPPLY = 333;
    uint256 public mintPrice = 0; // Start at 0 (free), owner can change
    
    event Minted(address indexed minter, uint256 indexed tokenId, string uri);
    event MintPriceUpdated(uint256 newPrice);
    event ContractPaused(address indexed by);
    event ContractUnpaused(address indexed by);
    event FundsWithdrawn(address indexed to, uint256 amount);
    
    constructor() ERC721("Marfa Particle Art", "MARFA") Ownable(msg.sender) {
        // Set default royalty to 10% (1000 basis points) to contract owner
        _setDefaultRoyalty(msg.sender, 1000);
    }
    
    /**
     * @notice Mint a new Marfa Particle Art NFT
     * @param uri IPFS URI pointing to metadata JSON
     * @return tokenId The ID of the newly minted token
     */
    function mint(string memory uri) public payable whenNotPaused returns (uint256) {
        require(_tokenIdCounter < MAX_SUPPLY, "Max supply reached");
        require(bytes(uri).length > 0, "Token URI cannot be empty");
        require(msg.value >= mintPrice, "Insufficient payment");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit Minted(msg.sender, tokenId, uri);
        
        return tokenId;
    }
    
    /**
     * @notice Set mint price (in wei)
     * @param newPrice Price in wei (1 ETH = 1e18 wei)
     * Examples: 
     * - Free: 0
     * - 0.001 ETH: 1000000000000000
     * - 0.01 ETH: 10000000000000000
     */
    function setMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }
    
    /**
     * @notice Withdraw contract balance to owner
     */
    function withdraw() public onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(owner(), balance);
    }
    
    /**
     * @notice Get total number of minted tokens
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @notice Get remaining supply
     */
    function remainingSupply() public view returns (uint256) {
        return MAX_SUPPLY - _tokenIdCounter;
    }
    
    /**
     * @notice Emergency pause minting
     */
    function pause() public onlyOwner {
        _pause();
        emit ContractPaused(msg.sender);
    }
    
    /**
     * @notice Unpause minting
     */
    function unpause() public onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }
    
    /**
     * @notice Update royalty info
     * @param receiver Address to receive royalties
     * @param feeNumerator Royalty percentage in basis points (100 = 1%)
     */
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) public onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Royalty)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
