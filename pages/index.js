import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useAddress, useStorageUpload, ConnectWallet, useChainId, useSwitchChain, useSigner } from "@thirdweb-dev/react";
import { Camera, Download, Sparkles, Zap, Loader } from 'lucide-react';
import { ethers } from 'ethers';

const BASE_CHAIN_ID = 8453;

export default function Home() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const figurePathRef = useRef([]);
  const [particles, setParticles] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const [particleColor, setParticleColor] = useState('#ffa500');
  const [backgroundColor, setBackgroundColor] = useState('#1a0f0a');
  const [backgroundColor2, setBackgroundColor2] = useState('#4a2c1a');
  const [gradientType, setGradientType] = useState('radial');
  const [particleCount, setParticleCount] = useState(15);
  const [trailLength, setTrailLength] = useState(60);
  const [glowIntensity, setGlowIntensity] = useState(1.5);
  const [particleSize, setParticleSize] = useState(3);
  const [animationSpeed, setAnimationSpeed] = useState(0.3);
  const [shapeType, setShapeType] = useState('saguaro');
  const [connectionDistance, setConnectionDistance] = useState(0);
  
  // NEW: Desert scene background
  const [sceneType, setSceneType] = useState('none');
  
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [designHistory, setDesignHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const address = useAddress();
  const chainId = useChainId();
  const switchChain = useSwitchChain();
  const { mutateAsync: upload } = useStorageUpload();
  const signer = useSigner();

  const contractAddress = "0xe2184682de09f774486EaA59DA0Eb14Cf133f875";
  const contractABI = [
    "function mint(string memory uri) public payable returns (uint256)",
    "function totalSupply() public view returns (uint256)",
    "function remainingSupply() public view returns (uint256)"
  ];

  const isCorrectChain = chainId === BASE_CHAIN_ID;
  
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };
  
  const saveToHistory = () => {
    const currentState = {
      particleColor, backgroundColor, backgroundColor2, gradientType,
      particleCount, trailLength, glowIntensity, particleSize,
      animationSpeed, shapeType, connectionDistance, sceneType
    };
    
    const newHistory = designHistory.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setDesignHistory(newHistory);
  };
  
  const applyDesignState = (state) => {
    setParticleColor(state.particleColor);
    setBackgroundColor(state.backgroundColor);
    setBackgroundColor2(state.backgroundColor2);
    setGradientType(state.gradientType);
    setParticleCount(state.particleCount);
    setTrailLength(state.trailLength);
    setGlowIntensity(state.glowIntensity);
    setParticleSize(state.particleSize);
    setAnimationSpeed(state.animationSpeed);
    setShapeType(state.shapeType);
    setConnectionDistance(state.connectionDistance);
    setSceneType(state.sceneType || 'none');
  };
  
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      applyDesignState(designHistory[newIndex]);
      setHistoryIndex(newIndex);
      showToast('Undid last change', 'info');
    }
  };
  
  const redo = () => {
    if (historyIndex < designHistory.length - 1) {
      const newIndex = historyIndex + 1;
      applyDesignState(designHistory[newIndex]);
      setHistoryIndex(newIndex);
      showToast('Redid change', 'info');
    }
  };

  useEffect(() => {
    if (address && chainId && !isCorrectChain) {
      const attemptSwitch = async () => {
        try {
          await switchChain(BASE_CHAIN_ID);
        } catch (error) {
          console.error("Failed to auto-switch to Base:", error);
        }
      };
      attemptSwitch();
    }
  }, [address, chainId, isCorrectChain, switchChain]);
  
  useEffect(() => {
    if (designHistory.length === 0) {
      saveToHistory();
    }
  }, []);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey && e.key === 'y') || (e.metaKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, designHistory]);

  // IMPROVED SHAPES - Much more recognizable!
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 600;

    const figurePath = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    if (shapeType === 'saguaro') {
      // IMPROVED: Tall realistic saguaro with 3 arms at different heights
      // Main trunk
      for (let i = 0; i <= 80; i++) {
        figurePath.push({ x: centerX, y: centerY - 140 + i * 3 });
      }
      // Left arm - lower
      for (let i = 0; i <= 30; i++) {
        figurePath.push({ x: centerX - i * 2.5, y: centerY - 20 + i * 1.5 });
      }
      for (let i = 0; i <= 40; i++) {
        figurePath.push({ x: centerX - 75, y: centerY + 25 - i * 2 });
      }
      // Right arm - higher
      for (let i = 0; i <= 35; i++) {
        figurePath.push({ x: centerX + i * 2.3, y: centerY - 60 + i * 1.2 });
      }
      for (let i = 0; i <= 50; i++) {
        figurePath.push({ x: centerX + 80, y: centerY - 18 - i * 2.5 });
      }
      // Small right arm - mid height
      for (let i = 0; i <= 20; i++) {
        figurePath.push({ x: centerX + i * 1.8, y: centerY + 10 + i * 0.8 });
      }
      for (let i = 0; i <= 25; i++) {
        figurePath.push({ x: centerX + 36, y: centerY + 26 - i * 2 });
      }
    } else if (shapeType === 'coyote') {
      // IMPROVED: Recognizable coyote side profile - howling
      // Body
      for (let i = 0; i < 40; i++) {
        const t = (i / 40) * Math.PI * 0.6;
        figurePath.push({
          x: centerX + Math.cos(t) * 100 - 20,
          y: centerY + Math.sin(t) * 50 + 30
        });
      }
      // Neck and head pointing up (howling)
      for (let i = 0; i <= 30; i++) {
        figurePath.push({ 
          x: centerX - 120 + i * 1.5, 
          y: centerY + 80 - i * 4 
        });
      }
      // Snout
      for (let i = 0; i <= 15; i++) {
        figurePath.push({ 
          x: centerX - 75 + i * 2, 
          y: centerY - 40 - i * 1.5 
        });
      }
      // Ears (pointy)
      for (let i = 0; i <= 10; i++) {
        figurePath.push({ 
          x: centerX - 90 + i, 
          y: centerY - 20 - i * 2.5 
        });
      }
      // Back of head
      for (let i = 0; i <= 15; i++) {
        figurePath.push({ 
          x: centerX - 100 + i * 1.5, 
          y: centerY - 45 + i * 2 
        });
      }
      // Front legs
      for (let i = 0; i <= 25; i++) {
        figurePath.push({ x: centerX - 50, y: centerY + 50 + i * 1.8 });
      }
      for (let i = 0; i <= 20; i++) {
        figurePath.push({ x: centerX - 30, y: centerY + 50 + i * 2 });
      }
      // Back legs
      for (let i = 0; i <= 25; i++) {
        figurePath.push({ x: centerX + 40, y: centerY + 60 + i * 1.5 });
      }
      for (let i = 0; i <= 20; i++) {
        figurePath.push({ x: centerX + 60, y: centerY + 60 + i * 1.8 });
      }
      // Tail (bushy, curved up)
      for (let i = 0; i <= 35; i++) {
        const t = (i / 35) * Math.PI * 0.5;
        figurePath.push({
          x: centerX + 80 + Math.cos(t) * 50,
          y: centerY + 80 - Math.sin(t) * 60
        });
      }
    } else if (shapeType === 'roadrunner') {
      // IMPROVED: Actual roadrunner bird profile
      // Body (oval)
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        figurePath.push({
          x: centerX + Math.cos(angle) * 60,
          y: centerY + Math.sin(angle) * 35
        });
      }
      // Long tail feathers
      for (let i = 0; i <= 40; i++) {
        figurePath.push({ 
          x: centerX + 60 + i * 2, 
          y: centerY + 10 + Math.sin(i * 0.2) * 15 
        });
      }
      // Neck
      for (let i = 0; i <= 15; i++) {
        figurePath.push({ x: centerX - 50 + i, y: centerY - 20 - i * 1.5 });
      }
      // Head
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        figurePath.push({
          x: centerX - 45 + Math.cos(angle) * 18,
          y: centerY - 40 + Math.sin(angle) * 15
        });
      }
      // Beak (long and pointy)
      for (let i = 0; i <= 20; i++) {
        figurePath.push({ x: centerX - 63 - i * 2, y: centerY - 42 });
      }
      // Crest (pointy feathers on head)
      for (let i = 0; i <= 10; i++) {
        figurePath.push({ x: centerX - 35 + i, y: centerY - 48 - i * 2 });
      }
      // Legs (thin and fast)
      for (let i = 0; i <= 30; i++) {
        figurePath.push({ x: centerX - 20, y: centerY + 35 + i * 2 });
      }
      for (let i = 0; i <= 30; i++) {
        figurePath.push({ x: centerX + 10, y: centerY + 35 + i * 2 });
      }
    } else if (shapeType === 'prickly-pear') {
      // IMPROVED: Stacked paddle cacti
      const pads = [
        { x: 0, y: -40, w: 40, h: 55 },
        { x: -35, y: 0, w: 45, h: 60 },
        { x: 35, y: 5, w: 42, h: 58 },
        { x: 0, y: 50, w: 38, h: 50 }
      ];
      pads.forEach(pad => {
        for (let i = 0; i < 30; i++) {
          const angle = (i / 30) * Math.PI * 2;
          figurePath.push({
            x: centerX + pad.x + Math.cos(angle) * pad.w,
            y: centerY + pad.y + Math.sin(angle) * pad.h
          });
        }
      });
    } else if (shapeType === 'desert-flower') {
      // IMPROVED: 5-petal flower with visible center
      const petals = 5;
      // Center
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        figurePath.push({
          x: centerX + Math.cos(angle) * 20,
          y: centerY + Math.sin(angle) * 20
        });
      }
      // Petals
      for (let i = 0; i < 100; i++) {
        const angle = (i / 100) * Math.PI * 2;
        const r = 50 + Math.sin(petals * angle) * 60;
        figurePath.push({
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r
        });
      }
    } else if (shapeType === 'tumbleweed') {
      // IMPROVED: More chaotic/spiky tumbleweed
      for (let i = 0; i < 120; i++) {
        const angle = (i / 120) * Math.PI * 2;
        const r = 70 + Math.sin(i * 0.7) * 35 + Math.sin(i * 1.3) * 20;
        figurePath.push({
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r
        });
      }
    } else if (shapeType === 'mesa') {
      // IMPROVED: Layered mesa with cliff face
      const width = 220;
      const height = 90;
      // Bottom slope
      for (let i = 0; i <= 15; i++) {
        figurePath.push({ x: centerX - width/2 + i * 3, y: centerY + height - i * 2 });
      }
      // Left cliff
      for (let i = 0; i <= 30; i++) {
        figurePath.push({ x: centerX - width/2 + 45, y: centerY + height - 30 - i * 5 });
      }
      // Top flat
      for (let i = 0; i <= 40; i++) {
        figurePath.push({ x: centerX - width/2 + 45 + i * 4, y: centerY - height });
      }
      // Right cliff
      for (let i = 0; i <= 30; i++) {
        figurePath.push({ x: centerX + width/2 - 15, y: centerY - height + i * 5 });
      }
      // Bottom slope right
      for (let i = 0; i <= 15; i++) {
        figurePath.push({ x: centerX + width/2 - 15 + i * 3, y: centerY + height - 80 + i * 3 });
      }
    } else if (shapeType === 'sand-dune') {
      // IMPROVED: Multiple rolling dunes
      for (let i = 0; i < 150; i++) {
        const x = centerX - 180 + i * 2.4;
        const y = centerY + Math.sin((i / 150) * Math.PI * 3) * 50 + Math.sin((i / 150) * Math.PI * 7) * 20 - 10;
        figurePath.push({ x, y });
      }
    } else if (shapeType === 'desert-sun') {
      // IMPROVED: Sun with varied ray lengths
      // Core
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        figurePath.push({
          x: centerX + Math.cos(angle) * 40,
          y: centerY + Math.sin(angle) * 40
        });
      }
      // Rays
      for (let ray = 0; ray < 12; ray++) {
        const angle = (ray / 12) * Math.PI * 2;
        const rayLength = ray % 2 === 0 ? 80 : 60;
        for (let i = 0; i <= 15; i++) {
          const r = 45 + (i / 15) * rayLength;
          figurePath.push({
            x: centerX + Math.cos(angle) * r,
            y: centerY + Math.sin(angle) * r
          });
        }
      }
    } else if (shapeType === 'crescent-moon') {
      // IMPROVED: Thinner crescent
      for (let i = 0; i < 100; i++) {
        const t = (i / 100) * Math.PI * 1.6;
        const r = 95;
        figurePath.push({
          x: centerX + Math.cos(t) * r + 25,
          y: centerY + Math.sin(t) * r
        });
      }
      for (let i = 0; i < 100; i++) {
        const t = (i / 100) * Math.PI * 1.6;
        const r = 75;
        figurePath.push({
          x: centerX + Math.cos(t) * r - 5,
          y: centerY + Math.sin(t) * r
        });
      }
    } else if (shapeType === 'yucca') {
      // IMPROVED: More dramatic spiky leaves
      const leaves = 12;
      for (let leaf = 0; leaf < leaves; leaf++) {
        const angle = (leaf / leaves) * Math.PI * 2;
        for (let i = 0; i <= 25; i++) {
          const r = 30 + i * 5 - Math.abs(i - 12) * 2;
          figurePath.push({
            x: centerX + Math.cos(angle) * r,
            y: centerY + Math.sin(angle) * r
          });
        }
      }
    } else if (shapeType === 'agave') {
      // IMPROVED: Tighter spiral with more leaves
      for (let i = 0; i < 150; i++) {
        const angle = (i / 150) * Math.PI * 6;
        const r = 25 + i * 0.65;
        figurePath.push({
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r
        });
      }
    } else if (shapeType === 'rock-formation') {
      // IMPROVED: More varied boulder sizes
      const rocks = [
        { cx: centerX - 40, cy: centerY - 50, r: 45 },
        { cx: centerX + 50, cy: centerY - 40, r: 55 },
        { cx: centerX, cy: centerY + 20, r: 60 },
        { cx: centerX - 60, cy: centerY + 30, r: 35 },
        { cx: centerX + 70, cy: centerY + 35, r: 40 }
      ];
      rocks.forEach(rock => {
        for (let i = 0; i < 25; i++) {
          const angle = (i / 25) * Math.PI * 2;
          const variation = Math.sin(i * 0.7) * 8;
          figurePath.push({
            x: rock.cx + Math.cos(angle) * (rock.r + variation),
            y: rock.cy + Math.sin(angle) * (rock.r + variation)
          });
        }
      });
    } else if (shapeType === 'desert-star') {
      // IMPROVED: Sharper 5-point star
      const spikes = 5;
      const outerRadius = 130;
      const innerRadius = 50;
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
        figurePath.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        });
      }
    } else if (shapeType === 'marfa-lights') {
      // IMPROVED: More mysterious floating orbs at different sizes
      const orbs = [
        { x: -80, y: -30, r: 30 },
        { x: -30, y: 20, r: 25 },
        { x: 30, y: -10, r: 35 },
        { x: 80, y: 25, r: 28 },
        { x: 0, y: -50, r: 20 }
      ];
      orbs.forEach(orb => {
        for (let i = 0; i < 25; i++) {
          const angle = (i / 25) * Math.PI * 2;
          figurePath.push({
            x: centerX + orb.x + Math.cos(angle) * orb.r,
            y: centerY + orb.y + Math.sin(angle) * orb.r
          });
        }
      });
    }

    figurePathRef.current = figurePath;

  }, [shapeType]);

  useEffect(() => {
    if (figurePathRef.current.length === 0) return;

    const figurePath = figurePathRef.current;
    const newParticles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const pathIndex = Math.floor((i / particleCount) * figurePath.length);
      const pos = figurePath[pathIndex];
      newParticles.push({
        x: pos.x,
        y: pos.y,
        baseX: pos.x,
        baseY: pos.y,
        vx: 0,
        vy: 0,
        pathIndex: pathIndex,
        trail: []
      });
    }
    
    setParticles(newParticles);
  }, [particleCount, shapeType]);

  // NEW: Render desert scene backgrounds
  const renderScene = (ctx, canvas) => {
    if (sceneType === 'none') return;
    
    if (sceneType === 'sunset-sky') {
      // Orange/red sunset gradient - FILLS ENTIRE CANVAS
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#ff6b35');
      gradient.addColorStop(0.3, '#ff8c42');
      gradient.addColorStop(0.6, '#ffa552');
      gradient.addColorStop(0.85, '#d2691e');
      gradient.addColorStop(1, '#8b4513');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
    } else if (sceneType === 'starry-night') {
      // Dark sky with stars - FILLS ENTIRE CANVAS
      const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width * 0.7);
      gradient.addColorStop(0, '#0a0624');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Stars scattered across ENTIRE canvas
      ctx.fillStyle = 'white';
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2 + 0.5;
        ctx.globalAlpha = Math.random() * 0.8 + 0.2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      
    } else if (sceneType === 'desert-landscape') {
      // Sky
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6);
      skyGradient.addColorStop(0, '#87CEEB');
      skyGradient.addColorStop(1, '#f4a460');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);
      
      // Mountains (layered)
      ctx.fillStyle = '#8b7355';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.6);
      for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * canvas.width;
        const y = canvas.height * 0.5 - Math.sin(i * 0.8) * 50 - Math.sin(i * 1.5) * 30;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height * 0.6);
      ctx.fill();
      
      ctx.fillStyle = '#6b5845';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.65);
      for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * canvas.width;
        const y = canvas.height * 0.55 - Math.sin(i * 1.2) * 40;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height * 0.65);
      ctx.fill();
      
      // Desert floor
      ctx.fillStyle = '#d2691e';
      ctx.fillRect(0, canvas.height * 0.65, canvas.width, canvas.height * 0.35);
      
    } else if (sceneType === 'prada-marfa') {
      // Sky
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#f4a460');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Desert floor
      ctx.fillStyle = '#d2b48c';
      ctx.fillRect(0, canvas.height * 0.75, canvas.width, canvas.height * 0.25);
      
      // Prada Marfa building at BOTTOM - particles float above
      const buildingW = 200;
      const buildingH = 90;
      const buildingX = canvas.width / 2 - buildingW / 2;
      const buildingY = canvas.height - buildingH;
      
      // Building
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(buildingX, buildingY, buildingW, buildingH);
      
      // Roof overhang
      ctx.fillStyle = '#000000';
      ctx.fillRect(buildingX - 10, buildingY - 8, buildingW + 20, 8);
      
      // Door
      ctx.fillStyle = '#000000';
      ctx.fillRect(buildingX + buildingW/2 - 18, buildingY + 25, 36, 65);
      
      // Windows
      ctx.fillRect(buildingX + 25, buildingY + 18, 32, 32);
      ctx.fillRect(buildingX + buildingW - 57, buildingY + 18, 32, 32);
      
      // PRADA text
      ctx.font = 'bold 22px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText('PRADA', canvas.width / 2, buildingY + 12);
      ctx.font = 'bold 11px Arial';
      ctx.fillText('MARFA', canvas.width / 2, canvas.height - 8);
      
    } else if (sceneType === 'judd-building') {
      // Sky
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#708090');
      gradient.addColorStop(1, '#8b7355');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Desert floor
      ctx.fillStyle = '#cd853f';
      ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
      
      // Donald Judd concrete boxes (minimalist)
      const boxes = [
        { x: 100, y: 350, w: 100, h: 80 },
        { x: 230, y: 370, w: 90, h: 60 },
        { x: 350, y: 360, w: 95, h: 70 }
      ];
      
      boxes.forEach(box => {
        // Main box
        ctx.fillStyle = '#a9a9a9';
        ctx.fillRect(box.x, box.y, box.w, box.h);
        
        // Shadow/depth
        ctx.fillStyle = '#696969';
        ctx.fillRect(box.x + 5, box.y + 5, box.w, box.h);
        
        // Highlight
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(box.x, box.y, box.w - 5, box.h - 5);
      });
      
    } else if (sceneType === 'tumbleweed-desert') {
      // Empty flat desert with tumbleweeds and cacti
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(0.5, '#f4a460');
      gradient.addColorStop(1, '#d2691e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw tumbleweed function
      const drawTumbleweed = (x, y, size) => {
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(
            x + Math.cos(angle) * size,
            y + Math.sin(angle) * size
          );
          ctx.stroke();
        }
        // Add some cross branches
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(x, y, size * 0.6, angle, angle + Math.PI / 3);
          ctx.stroke();
        }
      };
      
      // Draw small cactus function
      const drawCactus = (x, y, height) => {
        ctx.fillStyle = '#2d5016';
        ctx.strokeStyle = '#1a3d0f';
        ctx.lineWidth = 1;
        // Main trunk
        ctx.fillRect(x - 3, y - height, 6, height);
        ctx.strokeRect(x - 3, y - height, 6, height);
        // Left arm
        if (height > 20) {
          ctx.fillRect(x - 10, y - height * 0.6, 7, 3);
          ctx.fillRect(x - 10, y - height * 0.6, 3, height * 0.4);
          ctx.strokeRect(x - 10, y - height * 0.6, 7, 3);
          ctx.strokeRect(x - 10, y - height * 0.6, 3, height * 0.4);
        }
        // Right arm
        if (height > 25) {
          ctx.fillRect(x + 3, y - height * 0.7, 7, 3);
          ctx.fillRect(x + 7, y - height * 0.7, 3, height * 0.5);
          ctx.strokeRect(x + 3, y - height * 0.7, 7, 3);
          ctx.strokeRect(x + 7, y - height * 0.7, 3, height * 0.5);
        }
      };
      
      // Ground line
      const groundLevel = canvas.height * 0.75;
      
      // Draw cacti at various positions
      drawCactus(100, groundLevel, 35);
      drawCactus(180, groundLevel, 28);
      drawCactus(420, groundLevel, 40);
      drawCactus(520, groundLevel, 32);
      drawCactus(50, groundLevel, 25);
      
      // Draw tumbleweeds at various positions and sizes
      drawTumbleweed(150, canvas.height * 0.6, 25);
      drawTumbleweed(400, canvas.height * 0.7, 30);
      drawTumbleweed(500, canvas.height * 0.5, 20);
      drawTumbleweed(250, canvas.height * 0.65, 22);
      drawTumbleweed(550, canvas.height * 0.55, 18);
      drawTumbleweed(80, canvas.height * 0.68, 27);
      drawTumbleweed(320, canvas.height * 0.58, 24);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || particles.length === 0 || figurePathRef.current.length === 0) return;

    const ctx = canvas.getContext('2d');
    const figurePath = figurePathRef.current;

    const animate = () => {
      // 1. Render scene background FIRST (behind everything)
      renderScene(ctx, canvas);
      
      // 2. Then render gradient/solid background if scene is 'none'
      if (sceneType === 'none') {
        if (gradientType === 'radial') {
          const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
          gradient.addColorStop(0, backgroundColor);
          gradient.addColorStop(1, backgroundColor2);
          ctx.fillStyle = gradient;
        } else if (gradientType === 'linear') {
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, backgroundColor);
          gradient.addColorStop(1, backgroundColor2);
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = backgroundColor;
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 3. Render connection lines
      if (connectionDistance > 0) {
        ctx.lineWidth = 1.5;
        
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < connectionDistance) {
              const alpha = (1 - distance / connectionDistance) * 0.7;
              ctx.strokeStyle = particleColor;
              ctx.globalAlpha = alpha;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
        ctx.globalAlpha = 1;
      }

      // 4. Render particles with trails
      particles.forEach((particle) => {
        particle.pathIndex = (particle.pathIndex + animationSpeed) % figurePath.length;
        const targetPos = figurePath[Math.floor(particle.pathIndex)];
        
        const dx = targetPos.x - particle.x;
        const dy = targetPos.y - particle.y;
        particle.vx += dx * 0.02;
        particle.vy += dy * 0.02;
        
        if (isDrawing) {
          const distX = mousePos.x - particle.x;
          const distY = mousePos.y - particle.y;
          const distance = Math.sqrt(distX * distX + distY * distY);
          
          if (distance < 450) {
            const force = (450 - distance) / 450;
            const angle = Math.atan2(distY, distX);
            const pushForce = force * force * 120;
            const chaos = (Math.random() - 0.5) * pushForce * 0.5;
            
            particle.vx -= Math.cos(angle) * pushForce + chaos;
            particle.vy -= Math.sin(angle) * pushForce + chaos;
          }
        }
        
        particle.vx *= 0.92;
        particle.vy *= 0.92;
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        particle.trail.unshift({ x: particle.x, y: particle.y });
        if (particle.trail.length > trailLength) {
          particle.trail.pop();
        }
        
        if (particle.trail.length > 1) {
          ctx.strokeStyle = particleColor;
          ctx.lineWidth = 2.5;
          
          for (let i = 0; i < particle.trail.length - 1; i++) {
            const alpha = (1 - i / particle.trail.length) * 0.6;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(particle.trail[i].x, particle.trail[i].y);
            ctx.lineTo(particle.trail[i + 1].x, particle.trail[i + 1].y);
            ctx.stroke();
          }
        }
        
        ctx.globalAlpha = 1;
        
        if (glowIntensity > 0) {
          ctx.shadowBlur = 40 * glowIntensity;
          ctx.shadowColor = particleColor;
          ctx.fillStyle = particleColor;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particleSize + 2, 0, Math.PI * 2);
          ctx.fill();
          
          if (glowIntensity > 1) {
            ctx.shadowBlur = 60 * glowIntensity;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particleSize + 4, 0, Math.PI * 2);
            ctx.fill();
          }
          
          if (glowIntensity > 2) {
            ctx.shadowBlur = 80 * glowIntensity;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particleSize + 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.fillStyle = particleColor;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particleSize, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles, isDrawing, mousePos, particleColor, backgroundColor, backgroundColor2, gradientType, trailLength, glowIntensity, particleSize, animationSpeed, connectionDistance, sceneType]);

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    updateMousePos(e);
  };

  const handleMouseMove = (e) => {
    updateMousePos(e);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const updateMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    setMousePos({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    });
  };

  const captureDesign = () => {
    setIsCapturing(true);
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    setCapturedImage(dataUrl);
    showToast('Desert design captured! 🌵', 'success');
    
    setTimeout(() => {
      setIsCapturing(false);
    }, 500);
  };

  const downloadImage = () => {
    if (!capturedImage) return;
    
    const link = document.createElement('a');
    link.download = `marfa-art-${Date.now()}.png`;
    link.href = capturedImage;
    link.click();
    showToast('Image downloaded!', 'success');
  };

  const resetDesign = () => {
    setCapturedImage(null);
    setMintSuccess(false);
    showToast('Design reset', 'info');
  };

  const randomizeDesign = () => {
    saveToHistory();
    
    const desertColors = ['#ffa500', '#ff6b35', '#d4a574', '#8b4513', '#cd853f', '#daa520'];
    const shapes = ['saguaro', 'prickly-pear', 'desert-flower', 'tumbleweed', 'mesa', 'sand-dune', 'desert-sun', 'crescent-moon', 'roadrunner', 'coyote', 'yucca', 'agave', 'rock-formation', 'desert-star', 'marfa-lights'];
    const gradients = ['solid', 'radial', 'linear'];
    const scenes = ['none', 'sunset-sky', 'starry-night', 'desert-landscape', 'prada-marfa', 'judd-building', 'tumbleweed-desert'];
    
    setParticleColor(desertColors[Math.floor(Math.random() * desertColors.length)]);
    setBackgroundColor('#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'));
    setBackgroundColor2('#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'));
    setGradientType(gradients[Math.floor(Math.random() * gradients.length)]);
    setParticleCount(Math.floor(Math.random() * 20) + 10);
    setTrailLength(Math.floor(Math.random() * 60) + 40);
    setGlowIntensity(Math.random() * 2.5 + 0.5);
    setParticleSize(Math.random() * 3 + 2);
    setAnimationSpeed(Math.random() * 0.5 + 0.2);
    setShapeType(shapes[Math.floor(Math.random() * shapes.length)]);
    setConnectionDistance(Math.random() > 0.5 ? Math.floor(Math.random() * 100) + 50 : 0);
    setSceneType(scenes[Math.floor(Math.random() * scenes.length)]);
    
    showToast('Desert design randomized! 🌵', 'success');
  };

  const applyPreset = (preset) => {
    saveToHistory();
    
    setParticleColor(preset.particleColor);
    setBackgroundColor(preset.backgroundColor);
    setBackgroundColor2(preset.backgroundColor2);
    setGradientType(preset.gradientType);
    setGlowIntensity(preset.glowIntensity);
    setConnectionDistance(preset.connectionDistance);
    if (preset.sceneType) setSceneType(preset.sceneType);
    
    showToast('Desert preset applied!', 'success');
  };

  const presets = {
    sunset: {
      particleColor: '#ff6b35',
      backgroundColor: '#ff4500',
      backgroundColor2: '#8b0000',
      gradientType: 'linear',
      glowIntensity: 2.0,
      connectionDistance: 0,
      sceneType: 'sunset-sky'
    },
    night: {
      particleColor: '#ffa500',
      backgroundColor: '#000428',
      backgroundColor2: '#004e92',
      gradientType: 'radial',
      glowIntensity: 2.5,
      connectionDistance: 80,
      sceneType: 'starry-night'
    },
    desert: {
      particleColor: '#daa520',
      backgroundColor: '#8b4513',
      backgroundColor2: '#d2691e',
      gradientType: 'radial',
      glowIntensity: 1.5,
      connectionDistance: 0,
      sceneType: 'desert-landscape'
    },
    cactus: {
      particleColor: '#228b22',
      backgroundColor: '#f4a460',
      backgroundColor2: '#cd853f',
      gradientType: 'linear',
      glowIntensity: 1.2,
      connectionDistance: 60,
      sceneType: 'none'
    },
    marfa: {
      particleColor: '#ffa500',
      backgroundColor: '#191970',
      backgroundColor2: '#4b0082',
      gradientType: 'radial',
      glowIntensity: 3.0,
      connectionDistance: 100,
      sceneType: 'none'
    },
    heat: {
      particleColor: '#ff0000',
      backgroundColor: '#ffe4b5',
      backgroundColor2: '#ffdead',
      gradientType: 'radial',
      glowIntensity: 1.8,
      connectionDistance: 0,
      sceneType: 'tumbleweed-desert'
    }
  };

  const generateInteractiveHTML = () => {
    // Generate complete shape code for HTML
    let shapeCode = '';
    
    if (shapeType === 'saguaro') {
      shapeCode = `for (let i = 0; i <= 80; i++) { figurePath.push({ x: centerX, y: centerY - 140 + i * 3 }); }
        for (let i = 0; i <= 30; i++) { figurePath.push({ x: centerX - i * 2.5, y: centerY - 20 + i * 1.5 }); }
        for (let i = 0; i <= 40; i++) { figurePath.push({ x: centerX - 75, y: centerY + 25 - i * 2 }); }
        for (let i = 0; i <= 35; i++) { figurePath.push({ x: centerX + i * 2.3, y: centerY - 60 + i * 1.2 }); }
        for (let i = 0; i <= 50; i++) { figurePath.push({ x: centerX + 80, y: centerY - 18 - i * 2.5 }); }
        for (let i = 0; i <= 20; i++) { figurePath.push({ x: centerX + i * 1.8, y: centerY + 10 + i * 0.8 }); }
        for (let i = 0; i <= 25; i++) { figurePath.push({ x: centerX + 36, y: centerY + 26 - i * 2 }); }`;
    } else if (shapeType === 'coyote') {
      shapeCode = `for (let i = 0; i < 40; i++) {
          const t = (i / 40) * Math.PI * 0.6;
          figurePath.push({ x: centerX + Math.cos(t) * 100 - 20, y: centerY + Math.sin(t) * 50 + 30 });
        }
        for (let i = 0; i <= 30; i++) { figurePath.push({ x: centerX - 120 + i * 1.5, y: centerY + 80 - i * 4 }); }
        for (let i = 0; i <= 15; i++) { figurePath.push({ x: centerX - 75 + i * 2, y: centerY - 40 - i * 1.5 }); }
        for (let i = 0; i <= 10; i++) { figurePath.push({ x: centerX - 90 + i, y: centerY - 20 - i * 2.5 }); }
        for (let i = 0; i <= 15; i++) { figurePath.push({ x: centerX - 100 + i * 1.5, y: centerY - 45 + i * 2 }); }
        for (let i = 0; i <= 25; i++) { figurePath.push({ x: centerX - 50, y: centerY + 50 + i * 1.8 }); }
        for (let i = 0; i <= 20; i++) { figurePath.push({ x: centerX - 30, y: centerY + 50 + i * 2 }); }
        for (let i = 0; i <= 25; i++) { figurePath.push({ x: centerX + 40, y: centerY + 60 + i * 1.5 }); }
        for (let i = 0; i <= 20; i++) { figurePath.push({ x: centerX + 60, y: centerY + 60 + i * 1.8 }); }
        for (let i = 0; i <= 35; i++) {
          const t = (i / 35) * Math.PI * 0.5;
          figurePath.push({ x: centerX + 80 + Math.cos(t) * 50, y: centerY + 80 - Math.sin(t) * 60 });
        }`;
    } else if (shapeType === 'roadrunner') {
      shapeCode = `for (let i = 0; i < 30; i++) {
          const angle = (i / 30) * Math.PI * 2;
          figurePath.push({ x: centerX + Math.cos(angle) * 60, y: centerY + Math.sin(angle) * 35 });
        }
        for (let i = 0; i <= 40; i++) { figurePath.push({ x: centerX + 60 + i * 2, y: centerY + 10 + Math.sin(i * 0.2) * 15 }); }
        for (let i = 0; i <= 15; i++) { figurePath.push({ x: centerX - 50 + i, y: centerY - 20 - i * 1.5 }); }
        for (let i = 0; i < 20; i++) {
          const angle = (i / 20) * Math.PI * 2;
          figurePath.push({ x: centerX - 45 + Math.cos(angle) * 18, y: centerY - 40 + Math.sin(angle) * 15 });
        }
        for (let i = 0; i <= 20; i++) { figurePath.push({ x: centerX - 63 - i * 2, y: centerY - 42 }); }
        for (let i = 0; i <= 10; i++) { figurePath.push({ x: centerX - 35 + i, y: centerY - 48 - i * 2 }); }
        for (let i = 0; i <= 30; i++) { figurePath.push({ x: centerX - 20, y: centerY + 35 + i * 2 }); }
        for (let i = 0; i <= 30; i++) { figurePath.push({ x: centerX + 10, y: centerY + 35 + i * 2 }); }`;
    } else if (shapeType === 'prickly-pear') {
      shapeCode = `const pads = [
          { x: 0, y: -40, w: 40, h: 55 },
          { x: -35, y: 0, w: 45, h: 60 },
          { x: 35, y: 5, w: 42, h: 58 },
          { x: 0, y: 50, w: 38, h: 50 }
        ];
        pads.forEach(pad => {
          for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            figurePath.push({ x: centerX + pad.x + Math.cos(angle) * pad.w, y: centerY + pad.y + Math.sin(angle) * pad.h });
          }
        });`;
    } else if (shapeType === 'desert-flower') {
      shapeCode = `const petals = 5;
        for (let i = 0; i < 20; i++) {
          const angle = (i / 20) * Math.PI * 2;
          figurePath.push({ x: centerX + Math.cos(angle) * 20, y: centerY + Math.sin(angle) * 20 });
        }
        for (let i = 0; i < 100; i++) {
          const angle = (i / 100) * Math.PI * 2;
          const r = 50 + Math.sin(petals * angle) * 60;
          figurePath.push({ x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r });
        }`;
    } else if (shapeType === 'tumbleweed') {
      shapeCode = `for (let i = 0; i < 120; i++) {
          const angle = (i / 120) * Math.PI * 2;
          const r = 70 + Math.sin(i * 0.7) * 35 + Math.sin(i * 1.3) * 20;
          figurePath.push({ x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r });
        }`;
    } else if (shapeType === 'mesa') {
      shapeCode = `const width = 220, height = 90;
        for (let i = 0; i <= 15; i++) { figurePath.push({ x: centerX - width/2 + i * 3, y: centerY + height - i * 2 }); }
        for (let i = 0; i <= 30; i++) { figurePath.push({ x: centerX - width/2 + 45, y: centerY + height - 30 - i * 5 }); }
        for (let i = 0; i <= 40; i++) { figurePath.push({ x: centerX - width/2 + 45 + i * 4, y: centerY - height }); }
        for (let i = 0; i <= 30; i++) { figurePath.push({ x: centerX + width/2 - 15, y: centerY - height + i * 5 }); }
        for (let i = 0; i <= 15; i++) { figurePath.push({ x: centerX + width/2 - 15 + i * 3, y: centerY + height - 80 + i * 3 }); }`;
    } else if (shapeType === 'sand-dune') {
      shapeCode = `for (let i = 0; i < 150; i++) {
          const x = centerX - 180 + i * 2.4;
          const y = centerY + Math.sin((i / 150) * Math.PI * 3) * 50 + Math.sin((i / 150) * Math.PI * 7) * 20 - 10;
          figurePath.push({ x, y });
        }`;
    } else if (shapeType === 'desert-sun') {
      shapeCode = `for (let i = 0; i < 30; i++) {
          const angle = (i / 30) * Math.PI * 2;
          figurePath.push({ x: centerX + Math.cos(angle) * 40, y: centerY + Math.sin(angle) * 40 });
        }
        for (let ray = 0; ray < 12; ray++) {
          const angle = (ray / 12) * Math.PI * 2;
          const rayLength = ray % 2 === 0 ? 80 : 60;
          for (let i = 0; i <= 15; i++) {
            const r = 45 + (i / 15) * rayLength;
            figurePath.push({ x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r });
          }
        }`;
    } else if (shapeType === 'crescent-moon') {
      shapeCode = `for (let i = 0; i < 100; i++) {
          const t = (i / 100) * Math.PI * 1.6;
          figurePath.push({ x: centerX + Math.cos(t) * 95 + 25, y: centerY + Math.sin(t) * 95 });
        }
        for (let i = 0; i < 100; i++) {
          const t = (i / 100) * Math.PI * 1.6;
          figurePath.push({ x: centerX + Math.cos(t) * 75 - 5, y: centerY + Math.sin(t) * 75 });
        }`;
    } else if (shapeType === 'yucca') {
      shapeCode = `const leaves = 12;
        for (let leaf = 0; leaf < leaves; leaf++) {
          const angle = (leaf / leaves) * Math.PI * 2;
          for (let i = 0; i <= 25; i++) {
            const r = 30 + i * 5 - Math.abs(i - 12) * 2;
            figurePath.push({ x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r });
          }
        }`;
    } else if (shapeType === 'agave') {
      shapeCode = `for (let i = 0; i < 150; i++) {
          const angle = (i / 150) * Math.PI * 6;
          const r = 25 + i * 0.65;
          figurePath.push({ x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r });
        }`;
    } else if (shapeType === 'rock-formation') {
      shapeCode = `const rocks = [
          { cx: centerX - 40, cy: centerY - 50, r: 45 },
          { cx: centerX + 50, cy: centerY - 40, r: 55 },
          { cx: centerX, cy: centerY + 20, r: 60 },
          { cx: centerX - 60, cy: centerY + 30, r: 35 },
          { cx: centerX + 70, cy: centerY + 35, r: 40 }
        ];
        rocks.forEach(rock => {
          for (let i = 0; i < 25; i++) {
            const angle = (i / 25) * Math.PI * 2;
            const variation = Math.sin(i * 0.7) * 8;
            figurePath.push({ x: rock.cx + Math.cos(angle) * (rock.r + variation), y: rock.cy + Math.sin(angle) * (rock.r + variation) });
          }
        });`;
    } else if (shapeType === 'desert-star') {
      shapeCode = `const spikes = 5, outerRadius = 130, innerRadius = 50;
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
          figurePath.push({ x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius });
        }`;
    } else if (shapeType === 'marfa-lights') {
      shapeCode = `const orbs = [
          { x: -80, y: -30, r: 30 },
          { x: -30, y: 20, r: 25 },
          { x: 30, y: -10, r: 35 },
          { x: 80, y: 25, r: 28 },
          { x: 0, y: -50, r: 20 }
        ];
        orbs.forEach(orb => {
          for (let i = 0; i < 25; i++) {
            const angle = (i / 25) * Math.PI * 2;
            figurePath.push({ x: centerX + orb.x + Math.cos(angle) * orb.r, y: centerY + orb.y + Math.sin(angle) * orb.r });
          }
        });`;
    }

    // Generate scene rendering code
    let sceneRenderCode = '';
    if (sceneType !== 'none') {
      sceneRenderCode = `
        function renderScene() {
          if ('${sceneType}' === 'sunset-sky') {
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#ff6b35');
            gradient.addColorStop(0.3, '#ff8c42');
            gradient.addColorStop(0.6, '#ffa552');
            gradient.addColorStop(0.85, '#d2691e');
            gradient.addColorStop(1, '#8b4513');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if ('${sceneType}' === 'starry-night') {
            const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width * 0.7);
            gradient.addColorStop(0, '#0a0624');
            gradient.addColorStop(1, '#000000');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            for (let i = 0; i < 100; i++) {
              const x = Math.random() * canvas.width;
              const y = Math.random() * canvas.height;
              const size = Math.random() * 2 + 0.5;
              ctx.globalAlpha = Math.random() * 0.8 + 0.2;
              ctx.beginPath();
              ctx.arc(x, y, size, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.globalAlpha = 1;
          } else if ('${sceneType}' === 'desert-landscape') {
            const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6);
            skyGradient.addColorStop(0, '#87CEEB');
            skyGradient.addColorStop(1, '#f4a460');
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);
            ctx.fillStyle = '#8b7355';
            ctx.beginPath();
            ctx.moveTo(0, canvas.height * 0.6);
            for (let i = 0; i <= 10; i++) {
              const x = (i / 10) * canvas.width;
              const y = canvas.height * 0.5 - Math.sin(i * 0.8) * 50 - Math.sin(i * 1.5) * 30;
              ctx.lineTo(x, y);
            }
            ctx.lineTo(canvas.width, canvas.height * 0.6);
            ctx.fill();
            ctx.fillStyle = '#6b5845';
            ctx.beginPath();
            ctx.moveTo(0, canvas.height * 0.65);
            for (let i = 0; i <= 10; i++) {
              const x = (i / 10) * canvas.width;
              const y = canvas.height * 0.55 - Math.sin(i * 1.2) * 40;
              ctx.lineTo(x, y);
            }
            ctx.lineTo(canvas.width, canvas.height * 0.65);
            ctx.fill();
            ctx.fillStyle = '#d2691e';
            ctx.fillRect(0, canvas.height * 0.65, canvas.width, canvas.height * 0.35);
          } else if ('${sceneType}' === 'prada-marfa') {
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#f4a460');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#d2b48c';
            ctx.fillRect(0, canvas.height * 0.75, canvas.width, canvas.height * 0.25);
            const buildingW = 200, buildingH = 90;
            const buildingX = canvas.width / 2 - buildingW / 2;
            const buildingY = canvas.height - buildingH;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(buildingX, buildingY, buildingW, buildingH);
            ctx.fillStyle = '#000000';
            ctx.fillRect(buildingX - 10, buildingY - 8, buildingW + 20, 8);
            ctx.fillRect(buildingX + buildingW/2 - 18, buildingY + 25, 36, 65);
            ctx.fillRect(buildingX + 25, buildingY + 18, 32, 32);
            ctx.fillRect(buildingX + buildingW - 57, buildingY + 18, 32, 32);
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PRADA', canvas.width / 2, buildingY + 12);
            ctx.font = 'bold 11px Arial';
            ctx.fillText('MARFA', canvas.width / 2, canvas.height - 8);
          } else if ('${sceneType}' === 'judd-building') {
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#708090');
            gradient.addColorStop(1, '#8b7355');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#cd853f';
            ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
            const boxes = [
              { x: 100, y: 350, w: 100, h: 80 },
              { x: 230, y: 370, w: 90, h: 60 },
              { x: 350, y: 360, w: 95, h: 70 }
            ];
            boxes.forEach(box => {
              ctx.fillStyle = '#a9a9a9';
              ctx.fillRect(box.x, box.y, box.w, box.h);
              ctx.fillStyle = '#696969';
              ctx.fillRect(box.x + 5, box.y + 5, box.w, box.h);
              ctx.fillStyle = '#c0c0c0';
              ctx.fillRect(box.x, box.y, box.w - 5, box.h - 5);
            });
          } else if ('${sceneType}' === 'tumbleweed-desert') {
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(0.5, '#f4a460');
            gradient.addColorStop(1, '#d2691e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const drawTumbleweed = (x, y, size) => {
              ctx.strokeStyle = '#8b7355';
              ctx.lineWidth = 1.5;
              for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
                ctx.stroke();
              }
              for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(x, y, size * 0.6, angle, angle + Math.PI / 3);
                ctx.stroke();
              }
            };
            const drawCactus = (x, y, height) => {
              ctx.fillStyle = '#2d5016';
              ctx.strokeStyle = '#1a3d0f';
              ctx.lineWidth = 1;
              ctx.fillRect(x - 3, y - height, 6, height);
              ctx.strokeRect(x - 3, y - height, 6, height);
              if (height > 20) {
                ctx.fillRect(x - 10, y - height * 0.6, 7, 3);
                ctx.fillRect(x - 10, y - height * 0.6, 3, height * 0.4);
                ctx.strokeRect(x - 10, y - height * 0.6, 7, 3);
                ctx.strokeRect(x - 10, y - height * 0.6, 3, height * 0.4);
              }
              if (height > 25) {
                ctx.fillRect(x + 3, y - height * 0.7, 7, 3);
                ctx.fillRect(x + 7, y - height * 0.7, 3, height * 0.5);
                ctx.strokeRect(x + 3, y - height * 0.7, 7, 3);
                ctx.strokeRect(x + 7, y - height * 0.7, 3, height * 0.5);
              }
            };
            const groundLevel = canvas.height * 0.75;
            drawCactus(100, groundLevel, 35);
            drawCactus(180, groundLevel, 28);
            drawCactus(420, groundLevel, 40);
            drawCactus(520, groundLevel, 32);
            drawCactus(50, groundLevel, 25);
            drawTumbleweed(150, canvas.height * 0.6, 25);
            drawTumbleweed(400, canvas.height * 0.7, 30);
            drawTumbleweed(500, canvas.height * 0.5, 20);
            drawTumbleweed(250, canvas.height * 0.65, 22);
            drawTumbleweed(550, canvas.height * 0.55, 18);
            drawTumbleweed(80, canvas.height * 0.68, 27);
            drawTumbleweed(320, canvas.height * 0.58, 24);
          }
        }
      `;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marfa Particle Art NFT</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: ${backgroundColor}; overflow: hidden; }
        canvas { max-width: 100%; max-height: 100vh; cursor: crosshair; touch-action: none; }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 600; canvas.height = 600;
        const config = {
            particleColor: '${particleColor}', backgroundColor: '${backgroundColor}', backgroundColor2: '${backgroundColor2}',
            gradientType: '${gradientType}', particleCount: ${particleCount}, trailLength: ${trailLength},
            glowIntensity: ${glowIntensity}, particleSize: ${particleSize}, animationSpeed: ${animationSpeed},
            shapeType: '${shapeType}', connectionDistance: ${connectionDistance}, sceneType: '${sceneType}'
        };
        let isDrawing = false; let mousePos = { x: 0, y: 0 };
        const particles = []; const figurePath = [];
        const centerX = canvas.width / 2; const centerY = canvas.height / 2;
        ${shapeCode}
        ${sceneRenderCode}
        for (let i = 0; i < config.particleCount; i++) {
            const pathIndex = Math.floor((i / config.particleCount) * figurePath.length);
            const pos = figurePath[pathIndex];
            particles.push({ x: pos.x, y: pos.y, vx: 0, vy: 0, pathIndex: pathIndex, trail: [] });
        }
        function updateMousePos(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
            mousePos.x = (e.clientX - rect.left) * scaleX; mousePos.y = (e.clientY - rect.top) * scaleY;
        }
        canvas.addEventListener('mousedown', (e) => { isDrawing = true; updateMousePos(e); });
        canvas.addEventListener('mousemove', updateMousePos);
        canvas.addEventListener('mouseup', () => isDrawing = false);
        canvas.addEventListener('mouseleave', () => isDrawing = false);
        canvas.addEventListener('touchstart', (e) => {
            isDrawing = true; const touch = e.touches[0]; const rect = canvas.getBoundingClientRect();
            mousePos.x = (touch.clientX - rect.left) * canvas.width / rect.width;
            mousePos.y = (touch.clientY - rect.top) * canvas.height / rect.height;
        });
        canvas.addEventListener('touchmove', (e) => {
            const touch = e.touches[0]; const rect = canvas.getBoundingClientRect();
            mousePos.x = (touch.clientX - rect.left) * canvas.width / rect.width;
            mousePos.y = (touch.clientY - rect.top) * canvas.height / rect.height;
        });
        canvas.addEventListener('touchend', () => isDrawing = false);
        function animate() {
            if (config.sceneType !== 'none') {
              renderScene();
            } else {
              if (config.gradientType === 'radial') {
                  const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
                  gradient.addColorStop(0, config.backgroundColor); gradient.addColorStop(1, config.backgroundColor2);
                  ctx.fillStyle = gradient;
              } else if (config.gradientType === 'linear') {
                  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                  gradient.addColorStop(0, config.backgroundColor); gradient.addColorStop(1, config.backgroundColor2);
                  ctx.fillStyle = gradient;
              } else { ctx.fillStyle = config.backgroundColor; }
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            if (config.connectionDistance > 0) {
                ctx.lineWidth = 1.5;
                for (let i = 0; i < particles.length; i++) {
                    for (let j = i + 1; j < particles.length; j++) {
                        const dx = particles[i].x - particles[j].x; const dy = particles[i].y - particles[j].y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance < config.connectionDistance) {
                            const alpha = (1 - distance / config.connectionDistance) * 0.7;
                            ctx.strokeStyle = config.particleColor; ctx.globalAlpha = alpha;
                            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
                        }
                    }
                }
                ctx.globalAlpha = 1;
            }
            particles.forEach(particle => {
                particle.pathIndex = (particle.pathIndex + config.animationSpeed) % figurePath.length;
                const targetPos = figurePath[Math.floor(particle.pathIndex)];
                const dx = targetPos.x - particle.x; const dy = targetPos.y - particle.y;
                particle.vx += dx * 0.02; particle.vy += dy * 0.02;
                if (isDrawing) {
                    const distX = mousePos.x - particle.x; const distY = mousePos.y - particle.y;
                    const distance = Math.sqrt(distX * distX + distY * distY);
                    if (distance < 450) {
                        const force = (450 - distance) / 450; const angle = Math.atan2(distY, distX);
                        const pushForce = force * force * 120;
                        particle.vx -= Math.cos(angle) * pushForce; particle.vy -= Math.sin(angle) * pushForce;
                    }
                }
                particle.vx *= 0.92; particle.vy *= 0.92; particle.x += particle.vx; particle.y += particle.vy;
                particle.trail.unshift({ x: particle.x, y: particle.y });
                if (particle.trail.length > config.trailLength) particle.trail.pop();
                if (particle.trail.length > 1) {
                    ctx.strokeStyle = config.particleColor; ctx.lineWidth = 2.5;
                    for (let i = 0; i < particle.trail.length - 1; i++) {
                        const alpha = (1 - i / particle.trail.length) * 0.6; ctx.globalAlpha = alpha;
                        ctx.beginPath(); ctx.moveTo(particle.trail[i].x, particle.trail[i].y);
                        ctx.lineTo(particle.trail[i + 1].x, particle.trail[i + 1].y); ctx.stroke();
                    }
                }
                ctx.globalAlpha = 1;
                if (config.glowIntensity > 0) { ctx.shadowBlur = 40 * config.glowIntensity; ctx.shadowColor = config.particleColor; }
                ctx.fillStyle = config.particleColor;
                ctx.beginPath(); ctx.arc(particle.x, particle.y, config.particleSize, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
            });
            requestAnimationFrame(animate);
        }
        animate();
    </script>
</body>
</html>`;
  };

  const handleMint = async () => {
    if (!address) {
      showToast('Please connect your wallet first!', 'error');
      return;
    }

    if (!isCorrectChain) {
      showToast('Please switch to Base network', 'error');
      return;
    }

    if (!signer) {
      showToast('Wallet not connected properly', 'error');
      return;
    }

    try {
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const totalSupply = await contract.totalSupply();
      
      if (totalSupply.toNumber() >= 333) {
        showToast('Collection sold out!', 'error');
        return;
      }
    } catch (e) {
      console.log("Could not check supply:", e);
    }

    try {
      setIsMinting(true);
      showToast('Preparing your desert NFT... 🌵', 'info');

      const canvas = canvasRef.current;
      const imageToMint = canvas.toDataURL('image/png');
      const tokenNumber = Date.now();

      const htmlContent = generateInteractiveHTML();
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const htmlFile = new File([htmlBlob], `marfa-art-${tokenNumber}.html`, { type: 'text/html' });

      const imageResponse = await fetch(imageToMint);
      const imageBlob = await imageResponse.blob();
      const imageFile = new File([imageBlob], `marfa-art-${tokenNumber}.png`, { type: "image/png" });
      
      showToast('Uploading to IPFS...', 'info');
      const uris = await upload({ data: [imageFile, htmlFile] });
      const imageUri = uris[0];
      const animationUri = uris[1];
      
      const displayNumber = Math.floor(Math.random() * 9999) + 1;
      const metadata = {
        name: `Marfa Particle Art #${displayNumber}`,
        description: `An interactive desert-inspired particle artwork from Marfa, Texas. Created on ${new Date().toLocaleDateString()}. Click and drag to interact with the particles!`,
        image: imageUri,
        animation_url: animationUri,
        attributes: [
          { trait_type: "Shape", value: shapeType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') },
          { trait_type: "Scene", value: sceneType === 'none' ? 'None' : sceneType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') },
          { trait_type: "Particle Color", value: particleColor },
          { trait_type: "Background Color", value: backgroundColor },
          { trait_type: "Gradient Type", value: gradientType.charAt(0).toUpperCase() + gradientType.slice(1) },
          { trait_type: "Particle Count", value: particleCount },
          { trait_type: "Trail Length", value: trailLength },
          { trait_type: "Glow Intensity", value: glowIntensity.toFixed(1) },
          { trait_type: "Particle Size", value: particleSize.toFixed(1) },
          { trait_type: "Animation Speed", value: animationSpeed.toFixed(2) },
          { trait_type: "Connections", value: connectionDistance === 0 ? "None" : "Active" },
          { trait_type: "Type", value: "Interactive Desert Art" },
          { trait_type: "Location", value: "Marfa, Texas" }
        ]
      };
      
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      const metadataFile = new File([metadataBlob], `metadata-${tokenNumber}.json`, { type: 'application/json' });
      const metadataUris = await upload({ data: [metadataFile] });
      const metadataUri = metadataUris[0];
      
      showToast('Minting your desert NFT... 🌵', 'info');
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.mint(metadataUri);
      
      console.log('Transaction submitted:', tx.hash);
      showToast(`Transaction submitted: ${tx.hash.slice(0, 10)}...`, 'info');
      
      let receipt;
      try {
        showToast('Waiting for confirmation...', 'info');
        receipt = await tx.wait(1);
        console.log('Transaction confirmed:', receipt);
      } catch (waitError) {
        console.error('Error waiting for transaction:', waitError);
        showToast('NFT minted! Check BaseScan to verify: basescan.org/tx/' + tx.hash, 'success');
        setMintSuccess(true);
        return;
      }
      
      setMintSuccess(true);
      showToast('Success! Your Marfa desert NFT has been minted! 🌵✨', 'success');
      
    } catch (error) {
      console.error("Minting error:", error);
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Marfa Particle Art - Desert NFT Collection</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="description" content="Create interactive desert-inspired particle art NFTs from Marfa, Texas on Base." />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Marfa Particle Art - Desert NFT Collection" />
        <meta property="og:description" content="Create interactive desert-inspired particle art NFTs from Marfa, Texas on Base." />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Marfa Particle Art - Desert NFT Collection" />
        <meta name="twitter:description" content="Create interactive desert-inspired particle art NFTs from Marfa, Texas on Base." />
      </Head>
      
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #2c1810 0%, #0a0604 100%)',
        color: 'white',
        padding: '15px',
        overflowX: 'hidden'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '15px'
          }} className="header">
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ 
                fontSize: '48px', 
                fontWeight: '300',
                letterSpacing: '8px',
                marginBottom: '5px',
                margin: 0,
                color: '#ffa500'
              }}>
                MARFA PARTICLE ART
              </h1>
              <p style={{ 
                fontSize: '14px', 
                letterSpacing: '4px',
                color: '#d4a574',
                margin: 0
              }}>
                DESERT NFT COLLECTION
              </p>
            </div>
            <div>
              <ConnectWallet 
                theme="dark"
                btnTitle="Connect Wallet"
              />
            </div>
          </div>

          {address && (
            <div 
              className="wallet-status"
              style={{ 
                background: isCorrectChain ? 'rgba(255, 165, 0, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: isCorrectChain ? '1px solid rgba(255, 165, 0, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px 20px',
                marginBottom: '15px',
                fontSize: '12px',
                letterSpacing: '1px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
              <div>
                {isCorrectChain ? (
                  <>✓ Connected: {address.slice(0, 6)}...{address.slice(-4)} | Base Network</>
                ) : (
                  <>⚠ Wrong Network - Chain ID: {chainId}</>
                )}
              </div>
              {!isCorrectChain && (
                <button
                  onClick={async () => {
                    try {
                      await switchChain(BASE_CHAIN_ID);
                      showToast('Switched to Base!', 'success');
                    } catch (error) {
                      showToast('Failed to switch network', 'error');
                    }
                  }}
                  className="switch-network-btn"
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #ffa500 0%, #ff6b35 100%)',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    cursor: 'pointer'
                  }}
                >
                  SWITCH TO BASE
                </button>
              )}
            </div>
          )}

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '280px 1fr', 
            gap: '20px',
            alignItems: 'start'
          }} className="main-grid">
            
            <div style={{ 
              background: 'rgba(255,165,0,0.05)',
              border: '1px solid rgba(255,165,0,0.2)',
              borderRadius: '8px',
              padding: '15px'
            }} className="controls-panel">
              <h3 style={{ 
                fontSize: '12px', 
                letterSpacing: '2px',
                marginBottom: '15px',
                opacity: 0.7,
                margin: '0 0 15px 0',
                color: '#ffa500'
              }}>
                DESERT CONTROLS
              </h3>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '15px'
              }}>
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  style={{
                    padding: '10px',
                    background: historyIndex <= 0 ? 'rgba(100,100,100,0.3)' : 'rgba(255,165,0,0.1)',
                    border: '1px solid rgba(255,165,0,0.3)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '10px',
                    letterSpacing: '1px',
                    cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer',
                    opacity: historyIndex <= 0 ? 0.5 : 1
                  }}
                >
                  ↶ UNDO
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex >= designHistory.length - 1}
                  style={{
                    padding: '10px',
                    background: historyIndex >= designHistory.length - 1 ? 'rgba(100,100,100,0.3)' : 'rgba(255,165,0,0.1)',
                    border: '1px solid rgba(255,165,0,0.3)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '10px',
                    letterSpacing: '1px',
                    cursor: historyIndex >= designHistory.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: historyIndex >= designHistory.length - 1 ? 0.5 : 1
                  }}
                >
                  REDO ↷
                </button>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '11px', 
                  letterSpacing: '1px',
                  marginBottom: '8px',
                  opacity: 0.6
                }}>
                  DESERT PRESETS
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px'
                }} className="preset-buttons">
                  {Object.entries(presets).map(([name, preset]) => (
                    <button
                      key={name}
                      onClick={() => applyPreset(preset)}
                      style={{
                        padding: '8px 4px',
                        background: `linear-gradient(135deg, ${preset.backgroundColor} 0%, ${preset.backgroundColor2} 100%)`,
                        border: '1px solid rgba(255,165,0,0.3)',
                        borderRadius: '4px',
                        color: preset.particleColor,
                        fontSize: '8px',
                        fontWeight: 'bold',
                        letterSpacing: '0.5px',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        textShadow: '0 0 5px rgba(0,0,0,0.8)'
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '11px', 
                  letterSpacing: '1px',
                  marginBottom: '8px',
                  opacity: 0.6
                }}>
                  DESERT SCENE
                </label>
                <select
                  value={sceneType}
                  onChange={(e) => {
                    saveToHistory();
                    setSceneType(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,165,0,0.1)',
                    border: '1px solid rgba(255,165,0,0.3)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '10px',
                    letterSpacing: '1px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="none">NONE (GRADIENT/SOLID)</option>
                  <option value="sunset-sky">SUNSET SKY</option>
                  <option value="starry-night">STARRY NIGHT</option>
                  <option value="desert-landscape">DESERT LANDSCAPE</option>
                  <option value="prada-marfa">PRADA MARFA</option>
                  <option value="judd-building">JUDD BUILDING</option>
                  <option value="tumbleweed-desert">TUMBLEWEED DESERT</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '11px', 
                  letterSpacing: '1px',
                  marginBottom: '8px',
                  opacity: 0.6
                }}>
                  PARTICLE COLOR
                </label>
                <input
                  type="color"
                  value={particleColor}
                  onChange={(e) => setParticleColor(e.target.value)}
                  onBlur={saveToHistory}
                  style={{ 
                    width: '100%', 
                    height: '35px',
                    border: '1px solid rgba(255,165,0,0.3)',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
              </div>

              {sceneType === 'none' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '11px', 
                    letterSpacing: '1px',
                    marginBottom: '8px',
                    opacity: 0.6
                  }}>
                    BACKGROUND
                  </label>
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    onBlur={saveToHistory}
                    style={{ 
                      width: '100%', 
                      height: '35px',
                      border: '1px solid rgba(255,165,0,0.3)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginBottom: '8px'
                    }}
                  />
                  
                  <select
                    value={gradientType}
                    onChange={(e) => {
                      saveToHistory();
                      setGradientType(e.target.value);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'rgba(255,165,0,0.1)',
                      border: '1px solid rgba(255,165,0,0.3)',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '10px',
                      letterSpacing: '1px',
                      cursor: 'pointer',
                      marginBottom: '8px'
                    }}
                  >
                    <option value="solid">SOLID</option>
                    <option value="radial">RADIAL</option>
                    <option value="linear">LINEAR</option>
                  </select>

                  {gradientType !== 'solid' && (
                    <input
                      type="color"
                      value={backgroundColor2}
                      onChange={(e) => setBackgroundColor2(e.target.value)}
                      onBlur={saveToHistory}
                      style={{ 
                        width: '100%', 
                        height: '35px',
                        border: '1px solid rgba(255,165,0,0.3)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    />
                  )}
                </div>
              )}

              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '11px', 
                  letterSpacing: '1px',
                  marginBottom: '8px',
                  opacity: 0.6
                }}>
                  DESERT SHAPE
                </label>
                <select
                  value={shapeType}
                  onChange={(e) => {
                    saveToHistory();
                    setShapeType(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,165,0,0.1)',
                    border: '1px solid rgba(255,165,0,0.3)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '11px',
                    letterSpacing: '1px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="saguaro">SAGUARO CACTUS</option>
                  <option value="prickly-pear">PRICKLY PEAR</option>
                  <option value="desert-flower">DESERT FLOWER</option>
                  <option value="tumbleweed">TUMBLEWEED</option>
                  <option value="mesa">MESA</option>
                  <option value="sand-dune">SAND DUNE</option>
                  <option value="desert-sun">DESERT SUN</option>
                  <option value="crescent-moon">CRESCENT MOON</option>
                  <option value="roadrunner">ROADRUNNER</option>
                  <option value="coyote">COYOTE</option>
                  <option value="yucca">YUCCA</option>
                  <option value="agave">AGAVE</option>
                  <option value="rock-formation">ROCK FORMATION</option>
                  <option value="desert-star">DESERT STAR</option>
                  <option value="marfa-lights">MARFA LIGHTS</option>
                </select>
              </div>

              <button
                onClick={randomizeDesign}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #ffa500 0%, #ff6b35 100%)',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '11px',
                  letterSpacing: '2px',
                  cursor: 'pointer',
                  marginBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 'bold'
                }}
              >
                <Sparkles size={16} />
                RANDOMIZE
              </button>

              <div>
                <button
                  onClick={captureDesign}
                  disabled={isCapturing}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: isCapturing ? '#ffa500' : 'rgba(255,165,0,0.1)',
                    border: '1px solid rgba(255,165,0,0.3)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '11px',
                    letterSpacing: '2px',
                    cursor: isCapturing ? 'default' : 'pointer',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Camera size={16} />
                  {isCapturing ? 'CAPTURED!' : 'CAPTURE DESIGN'}
                </button>

                {capturedImage && (
                  <>
                    <button
                      onClick={downloadImage}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(255,165,0,0.1)',
                        border: '1px solid rgba(255,165,0,0.3)',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '11px',
                        letterSpacing: '2px',
                        cursor: 'pointer',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Download size={16} />
                      DOWNLOAD IMAGE
                    </button>

                    <button
                      onClick={handleMint}
                      disabled={isMinting || !address || mintSuccess || !isCorrectChain}
                      style={{
                        width: '100%',
                        padding: '15px',
                        background: mintSuccess 
                          ? 'rgba(255, 165, 0, 0.2)' 
                          : (isMinting || !address || !isCorrectChain)
                          ? 'rgba(100,100,100,0.3)'
                          : 'linear-gradient(135deg, #ffa500 0%, #ff6b35 100%)',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        letterSpacing: '2px',
                        cursor: (isMinting || !address || mintSuccess || !isCorrectChain) ? 'not-allowed' : 'pointer',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        opacity: (isMinting || !address || !isCorrectChain) ? 0.5 : 1
                      }}
                    >
                      {isMinting ? (
                        <>
                          <Loader size={16} className="spin" />
                          MINTING...
                        </>
                      ) : mintSuccess ? (
                        <>
                          <Sparkles size={16} />
                          MINTED! ✓
                        </>
                      ) : !address ? (
                        <>
                          <Sparkles size={16} />
                          CONNECT WALLET
                        </>
                      ) : !isCorrectChain ? (
                        <>
                          <Zap size={16} />
                          SWITCH TO BASE
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          MINT DESERT NFT
                        </>
                      )}
                    </button>

                    <button
                      onClick={resetDesign}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'transparent',
                        border: '1px solid rgba(255,165,0,0.2)',
                        borderRadius: '4px',
                        color: 'rgba(255,165,0,0.5)',
                        fontSize: '10px',
                        letterSpacing: '2px',
                        cursor: 'pointer'
                      }}
                    >
                      RESET
                    </button>
                  </>
                )}
              </div>
            </div>

            <div>
              <div style={{ 
                background: 'rgba(255,165,0,0.05)',
                border: '1px solid rgba(255,165,0,0.2)',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '15px'
              }}>
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const canvas = canvasRef.current;
                    const rect = canvas.getBoundingClientRect();
                    const scaleX = canvas.width / rect.width;
                    const scaleY = canvas.height / rect.height;
                    setMousePos({
                      x: (touch.clientX - rect.left) * scaleX,
                      y: (touch.clientY - rect.top) * scaleY
                    });
                    setIsDrawing(true);
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const canvas = canvasRef.current;
                    const rect = canvas.getBoundingClientRect();
                    const scaleX = canvas.width / rect.width;
                    const scaleY = canvas.height / rect.height;
                    setMousePos({
                      x: (touch.clientX - rect.left) * scaleX,
                      y: (touch.clientY - rect.top) * scaleY
                    });
                  }}
                  onTouchEnd={() => setIsDrawing(false)}
                  style={{
                    width: '100%',
                    maxWidth: '600px',
                    height: 'auto',
                    aspectRatio: '1/1',
                    border: '1px solid rgba(255,165,0,0.3)',
                    borderRadius: '4px',
                    cursor: 'crosshair',
                    display: 'block',
                    margin: '0 auto',
                    touchAction: 'none'
                  }}
                />
              </div>

              <div style={{ 
                background: 'rgba(255,165,0,0.05)',
                border: '1px solid rgba(255,165,0,0.2)',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '15px'
              }}>
                <h3 style={{ 
                  fontSize: '12px', 
                  letterSpacing: '2px',
                  marginBottom: '15px',
                  opacity: 0.7,
                  margin: '0 0 15px 0',
                  color: '#ffa500'
                }}>
                  ADVANCED SETTINGS
                </h3>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '15px',
                  marginBottom: '15px'
                }} className="advanced-grid">
                  <div>
                    <label style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '11px', 
                      letterSpacing: '1px',
                      marginBottom: '8px',
                      opacity: 0.6
                    }}>
                      <span>PARTICLES</span>
                      <span>{particleCount}</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={particleCount}
                      onChange={(e) => setParticleCount(parseInt(e.target.value))}
                      onMouseUp={saveToHistory}
                      onTouchEnd={saveToHistory}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '11px', 
                      letterSpacing: '1px',
                      marginBottom: '8px',
                      opacity: 0.6
                    }}>
                      <span>TRAIL</span>
                      <span>{trailLength}</span>
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={trailLength}
                      onChange={(e) => setTrailLength(parseInt(e.target.value))}
                      onMouseUp={saveToHistory}
                      onTouchEnd={saveToHistory}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '11px', 
                      letterSpacing: '1px',
                      marginBottom: '8px',
                      opacity: 0.6
                    }}>
                      <span>GLOW</span>
                      <span>{glowIntensity.toFixed(1)}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      step="0.1"
                      value={glowIntensity}
                      onChange={(e) => setGlowIntensity(parseFloat(e.target.value))}
                      onMouseUp={saveToHistory}
                      onTouchEnd={saveToHistory}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '15px'
                }} className="advanced-grid">
                  <div>
                    <label style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '11px', 
                      letterSpacing: '1px',
                      marginBottom: '8px',
                      opacity: 0.6
                    }}>
                      <span>SIZE</span>
                      <span>{particleSize.toFixed(1)}</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="0.5"
                      value={particleSize}
                      onChange={(e) => setParticleSize(parseFloat(e.target.value))}
                      onMouseUp={saveToHistory}
                      onTouchEnd={saveToHistory}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '11px', 
                      letterSpacing: '1px',
                      marginBottom: '8px',
                      opacity: 0.6
                    }}>
                      <span>SPEED</span>
                      <span>{animationSpeed.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={animationSpeed}
                      onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                      onMouseUp={saveToHistory}
                      onTouchEnd={saveToHistory}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '11px', 
                      letterSpacing: '1px',
                      marginBottom: '8px',
                      opacity: 0.6
                    }}>
                      <span>CONNECTIONS</span>
                      <span>{connectionDistance === 0 ? 'OFF' : connectionDistance}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      step="10"
                      value={connectionDistance}
                      onChange={(e) => setConnectionDistance(parseInt(e.target.value))}
                      onMouseUp={saveToHistory}
                      onTouchEnd={saveToHistory}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              {capturedImage && (
                <div style={{ 
                  background: 'rgba(255,165,0,0.05)',
                  border: '1px solid rgba(255,165,0,0.2)',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  <h3 style={{ 
                    fontSize: '12px', 
                    letterSpacing: '2px',
                    marginBottom: '15px',
                    opacity: 0.7,
                    margin: '0 0 15px 0',
                    color: '#ffa500'
                  }}>
                    {mintSuccess ? '🌵 DESERT NFT MINTED 🌵' : 'PREVIEW SNAPSHOT'}
                  </h3>
                  <img 
                    src={capturedImage} 
                    alt="Captured Desert Design"
                    style={{ 
                      width: '100%',
                      maxWidth: '400px',
                      border: '1px solid rgba(255,165,0,0.3)',
                      borderRadius: '4px'
                    }}
                  />
                  <p style={{ 
                    marginTop: '15px',
                    fontSize: '11px',
                    opacity: 0.6,
                    lineHeight: '1.6',
                    margin: '15px 0 0 0'
                  }}>
                    {mintSuccess 
                      ? '🎉 Your interactive Marfa desert NFT has been minted!'
                      : '🌵 When you mint, the NFT will be FULLY INTERACTIVE!'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '400px'
        }}>
          {toasts.map(toast => (
            <div
              key={toast.id}
              style={{
                background: toast.type === 'success' 
                  ? 'linear-gradient(135deg, #ffa500 0%, #ff6b35 100%)'
                  : toast.type === 'error'
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #ffa500 0%, #d4a574 100%)',
                border: '1px solid rgba(255,165,0,0.3)',
                borderRadius: '8px',
                padding: '16px 20px',
                color: 'white',
                fontSize: '13px',
                fontWeight: '500',
                letterSpacing: '0.5px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                animation: 'slideIn 0.3s ease-out',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <span style={{ fontSize: '18px' }}>
                {toast.type === 'success' ? '🌵' : toast.type === 'error' ? '✕' : 'ⓘ'}
              </span>
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @media (max-width: 768px) {
          .main-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 15px !important;
          }
          
          .controls-panel {
            width: 100% !important;
            max-width: 100% !important;
            padding: 12px !important;
          }
          
          .controls-panel h3 {
            font-size: 11px !important;
            margin-bottom: 12px !important;
          }
          
          .controls-panel button {
            font-size: 9px !important;
            padding: 8px 6px !important;
          }
          
          .controls-panel input[type="color"] {
            height: 40px !important;
          }
          
          .controls-panel select {
            font-size: 10px !important;
            padding: 8px !important;
          }
          
          .controls-panel label {
            font-size: 10px !important;
          }
          
          .preset-buttons {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          
          .advanced-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          
          .header {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 12px !important;
          }
          
          .header h1 {
            font-size: 32px !important;
            letter-spacing: 4px !important;
          }
          
          .header p {
            font-size: 11px !important;
            letter-spacing: 2px !important;
          }
          
          .switch-network-btn {
            width: 100% !important;
            min-height: 44px !important;
            padding: 12px 16px !important;
            font-size: 10px !important;
          }
          
          .wallet-status {
            flex-direction: column !important;
            text-align: center !important;
            font-size: 10px !important;
            padding: 12px 16px !important;
          }
          
          div[style*="position: fixed"] {
            top: 10px !important;
            right: 10px !important;
            left: 10px !important;
            max-width: calc(100% - 20px) !important;
          }
          
          div[style*="position: fixed"] > div {
            font-size: 12px !important;
            padding: 12px 16px !important;
          }
        }
        
        @media (max-width: 480px) {
          .controls-panel {
            padding: 10px !important;
          }
          
          .header h1 {
            font-size: 28px !important;
            letter-spacing: 3px !important;
          }
          
          .header p {
            font-size: 10px !important;
          }
        }
      `}</style>
    </>
  );
}
