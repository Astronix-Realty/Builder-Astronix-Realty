"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
    Type, Image as ImageIcon, Square, Circle, Download,
    Trash2, Copy, Layers, Palette, Bold, Italic,
    AlignLeft, AlignCenter, AlignRight, Undo, Redo,
    ZoomIn, ZoomOut, Move, MousePointer, Plus, X,
    Sparkles, RotateCcw, Triangle, Star, Heart,
    Underline, Upload, Grid3X3, Lock, Unlock,
    FlipHorizontal, FlipVertical, RotateCw, Maximize2,
    Minimize2, Eye, EyeOff, ChevronDown, Wand2,
    Zap, Crown, Flame, Gift, Tag, Clock, Award,
    Sun, Moon, Droplets, Wind, Snowflake, Leaf
} from 'lucide-react'

interface BannerEditorProps {
    offerName: string
    benefitText: string
    benefitHighlight: string
    bannerType: 'strip' | 'badge' | 'card'  // Which preview type to edit
    projectImage?: string
    onSave: (dataUrl: string) => void
    onClose: () => void
}

// Premium Templates with gradients
const TEMPLATES = [
    { id: 'diwali', name: '🪔 Diwali', gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD700 100%)', accent: '#FFD700', textColor: '#fff' },
    { id: 'holi', name: '🎨 Holi', gradient: 'linear-gradient(135deg, #FF0080 0%, #7928CA 50%, #00D4FF 100%)', accent: '#FFE500', textColor: '#fff' },
    { id: 'christmas', name: '🎄 Christmas', gradient: 'linear-gradient(135deg, #1a472a 0%, #2d5a27 50%, #c41e3a 100%)', accent: '#FFD700', textColor: '#fff' },
    { id: 'newyear', name: '🎆 New Year', gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', accent: '#FFD700', textColor: '#fff' },
    { id: 'summer', name: '☀️ Summer', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #f093fb 100%)', accent: '#FFE500', textColor: '#fff' },
    { id: 'monsoon', name: '🌧️ Monsoon', gradient: 'linear-gradient(135deg, #0052D4 0%, #4364F7 50%, #6FB1FC 100%)', accent: '#00FF88', textColor: '#fff' },
    { id: 'luxury', name: '👑 Luxury', gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #0d0d0d 100%)', accent: '#D4AF37', textColor: '#D4AF37' },
    { id: 'modern', name: '💎 Modern', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', accent: '#00FFFF', textColor: '#fff' },
    { id: 'fresh', name: '🌿 Fresh', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', accent: '#FFFFFF', textColor: '#fff' },
    { id: 'fire', name: '🔥 Fire Sale', gradient: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)', accent: '#FFFFFF', textColor: '#fff' },
    { id: 'ocean', name: '🌊 Ocean', gradient: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)', accent: '#FFE500', textColor: '#fff' },
    { id: 'sunset', name: '🌅 Sunset', gradient: 'linear-gradient(135deg, #f83600 0%, #f9d423 100%)', accent: '#FFFFFF', textColor: '#fff' },
]

// Stickers with icons
const STICKERS = [
    { id: 'hot', text: '🔥 HOT DEAL', color: '#ef4444', icon: Flame },
    { id: 'new', text: '🆕 NEW', color: '#22c55e', icon: Sparkles },
    { id: 'limited', text: '⏰ LIMITED TIME', color: '#f59e0b', icon: Clock },
    { id: 'exclusive', text: '⭐ EXCLUSIVE', color: '#8b5cf6', icon: Star },
    { id: 'bestseller', text: '🏆 BESTSELLER', color: '#3b82f6', icon: Award },
    { id: 'premium', text: '👑 PREMIUM', color: '#d4af37', icon: Crown },
    { id: 'gift', text: '🎁 FREE GIFT', color: '#ec4899', icon: Gift },
    { id: 'flash', text: '⚡ FLASH SALE', color: '#fbbf24', icon: Zap },
]

// Decorative shapes
const DECORATIVE_ELEMENTS = [
    { id: 'burst', name: 'Star Burst', type: 'polygon', points: 12 },
    { id: 'ribbon', name: 'Ribbon', type: 'path' },
    { id: 'badge', name: 'Badge', type: 'circle' },
    { id: 'arrow', name: 'Arrow', type: 'triangle' },
]

// Font options
const FONTS = [
    { name: 'Impact', value: 'Impact' },
    { name: 'Arial Black', value: 'Arial Black' },
    { name: 'Georgia', value: 'Georgia' },
    { name: 'Verdana', value: 'Verdana' },
    { name: 'Trebuchet MS', value: 'Trebuchet MS' },
    { name: 'Comic Sans MS', value: 'Comic Sans MS' },
    { name: 'Courier New', value: 'Courier New' },
]

// Pre-made layouts
const LAYOUTS = [
    { id: 'centered', name: 'Centered', icon: AlignCenter },
    { id: 'left', name: 'Left Aligned', icon: AlignLeft },
    { id: 'split', name: 'Split View', icon: Maximize2 },
    { id: 'minimal', name: 'Minimal', icon: Minimize2 },
]

const BannerEditor: React.FC<BannerEditorProps> = ({
    offerName,
    benefitText,
    benefitHighlight,
    bannerType,
    projectImage,
    onSave,
    onClose
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fabricCanvasRef = useRef<any>(null)
    const [selectedObject, setSelectedObject] = useState<any>(null)
    const [activeTemplate, setActiveTemplate] = useState(TEMPLATES[0])
    const [canvasReady, setCanvasReady] = useState(false)
    const [zoom, setZoom] = useState(100)
    const [showGrid, setShowGrid] = useState(false)
    const [activeTab, setActiveTab] = useState<'templates' | 'elements' | 'text' | 'layers'>('templates')
    const [layers, setLayers] = useState<any[]>([])
    const [history, setHistory] = useState<string[]>([])
    const [historyIndex, setHistoryIndex] = useState(-1)
    const [isGenerating, setIsGenerating] = useState(false)

    // Text properties
    const [textProps, setTextProps] = useState({
        fontSize: 40,
        fontFamily: 'Impact',
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 0,
        shadow: true,
        opacity: 1
    })

    const updateLayers = useCallback(() => {
        if (!fabricCanvasRef.current) return
        const objects = fabricCanvasRef.current.getObjects()
        setLayers([...objects].reverse())
    }, [])

    // Save to history
    const saveToHistory = useCallback(() => {
        if (!fabricCanvasRef.current) return
        const json = JSON.stringify(fabricCanvasRef.current.toJSON(['name']))
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1)
            return [...newHistory, json]
        })
        setHistoryIndex(prev => prev + 1)
    }, [historyIndex])

    // Generate premium design based on bannerType - MATCHES THE LIVE PREVIEW EXACTLY
    const generatePremiumDesign = useCallback(async (fabric: any, canvas: any) => {
        if (!canvas) return

        canvas.clear()

        // Different layouts based on bannerType - colors MATCH the Live Preview exactly
        if (bannerType === 'strip') {
            // STRIP DESIGN - Matches "Listing Page Par (Blue Strip)" preview
            // Uses: bg-gradient-to-r from-blue-600 to-purple-600
            canvas.setDimensions({ width: 800, height: 120 })

            const bgGradient = new fabric.Gradient({
                type: 'linear',
                coords: { x1: 0, y1: 0, x2: 800, y2: 0 },
                colorStops: [
                    { offset: 0, color: '#2563eb' },    // blue-600
                    { offset: 1, color: '#9333ea' }     // purple-600
                ]
            })

            const bgRect = new fabric.Rect({
                left: 0, top: 0, width: 800, height: 120,
                fill: bgGradient, selectable: false, evented: false, name: 'background'
            })
            canvas.add(bgRect)

            // Left icon circle (bg-white/20)
            const iconBg = new fabric.Circle({
                radius: 30, fill: 'rgba(255,255,255,0.2)', left: 20, top: 30
            })
            canvas.add(iconBg)

            // Gift emoji
            const giftIcon = new fabric.Text('🎁', {
                fontSize: 24, left: 33, top: 38, name: 'icon'
            })
            canvas.add(giftIcon)

            // Offer Name (font-bold text-lg)
            const titleText = new fabric.IText(offerName || 'Offer Name', {
                left: 100, top: 28,
                fontFamily: 'Arial', fill: '#ffffff',
                fontSize: 24, fontWeight: 'bold',
                name: 'title'
            })
            canvas.add(titleText)

            // Benefit Text (text-2xl font-black)
            const benefitDisplay = new fabric.IText(benefitText || '₹2 Lakh Off', {
                left: 100, top: 58,
                fontFamily: 'Arial Black', fill: '#ffffff',
                fontSize: 32, fontWeight: 'bold',
                name: 'benefit'
            })
            canvas.add(benefitDisplay)

            // Timer box on right (bg-white/20 rounded-lg)
            const timerBg = new fabric.Rect({
                width: 100, height: 60, fill: 'rgba(255,255,255,0.2)', rx: 8, ry: 8,
                left: 670, top: 30
            })
            canvas.add(timerBg)

            const timerLabel = new fabric.Text('Ends in', {
                fontSize: 12, fill: 'rgba(255,255,255,0.8)', fontFamily: 'Arial',
                left: 690, top: 40, name: 'timerLabel'
            })
            canvas.add(timerLabel)

            const timerValue = new fabric.IText('7 Days', {
                fontSize: 18, fill: '#ffffff', fontFamily: 'Arial', fontWeight: 'bold',
                left: 685, top: 58, name: 'timerValue'
            })
            canvas.add(timerValue)

        } else if (bannerType === 'badge') {
            // BADGE DESIGN - Matches "Property Photo Par (Sticker Badge)" preview
            // Badge: bg-gradient-to-r from-red-500 to-orange-500, transform -rotate-3
            canvas.setDimensions({ width: 300, height: 280 })

            // Property placeholder background (bg-slate-300)
            const bgRect = new fabric.Rect({
                left: 0, top: 0, width: 300, height: 280,
                fill: '#cbd5e1', selectable: false, evented: false, name: 'background'
            })
            canvas.add(bgRect)

            // Inner gradient (from-slate-400 to-slate-500)
            const innerGradient = new fabric.Gradient({
                type: 'linear',
                coords: { x1: 0, y1: 0, x2: 300, y2: 280 },
                colorStops: [
                    { offset: 0, color: '#94a3b8' },
                    { offset: 1, color: '#64748b' }
                ]
            })
            const innerBg = new fabric.Rect({
                left: 0, top: 0, width: 300, height: 280,
                fill: innerGradient, selectable: false, evented: false
            })
            canvas.add(innerBg)

            // Building icon (text-slate-300)
            const buildingText = new fabric.Text('🏢', {
                fontSize: 60, left: 120, top: 100, opacity: 0.5
            })
            canvas.add(buildingText)

            // Sticker badge - Red to Orange gradient, rotated
            const stickerGradient = new fabric.Gradient({
                type: 'linear',
                coords: { x1: 0, y1: 0, x2: 120, y2: 0 },
                colorStops: [
                    { offset: 0, color: '#ef4444' },    // red-500
                    { offset: 1, color: '#f97316' }     // orange-500
                ]
            })

            const stickerBg = new fabric.Rect({
                width: 120, height: 65, fill: stickerGradient, rx: 8, ry: 8,
                originX: 'center', originY: 'center',
                shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.4)', blur: 10, offsetX: 2, offsetY: 2 })
            })

            const stickerLabel = new fabric.Text('LIMITED DEAL', {
                fontSize: 10, fill: '#ffffff', fontWeight: 'bold', fontFamily: 'Arial',
                originX: 'center', originY: 'center', top: -15
            })

            const stickerValue = new fabric.IText(benefitHighlight || benefitText?.slice(0, 10) || '2L OFF', {
                fontSize: 18, fill: '#ffffff', fontWeight: 'bold', fontFamily: 'Arial Black',
                originX: 'center', originY: 'center', top: 10
            })

            const stickerGroup = new fabric.Group([stickerBg, stickerLabel, stickerValue], {
                left: 15, top: 15, angle: -3, name: 'sticker'  // transform -rotate-3
            })
            canvas.add(stickerGroup)

            // Timer at bottom right (bg-black/70)
            const timerBg = new fabric.Rect({
                width: 120, height: 30, fill: 'rgba(0,0,0,0.7)', rx: 8, ry: 8,
                originX: 'center', originY: 'center'
            })

            const clockEmoji = new fabric.Text('⏰', {
                fontSize: 12, originX: 'center', originY: 'center', left: -40
            })

            const timerText = new fabric.IText('7 days left', {
                fontSize: 13, fill: '#fff', fontWeight: 'bold', fontFamily: 'Arial',
                originX: 'center', originY: 'center', left: 10
            })

            const timerGroup = new fabric.Group([timerBg, clockEmoji, timerText], {
                left: 175, top: 235, name: 'timer'
            })
            canvas.add(timerGroup)

        } else if (bannerType === 'card') {
            // CARD DESIGN - Matches "Price Card Ke Saath" preview exactly
            canvas.setDimensions({ width: 380, height: 220 })

            // White card background (bg-white rounded-xl shadow-md border)
            const bgRect = new fabric.Rect({
                left: 0, top: 0, width: 380, height: 220,
                fill: '#ffffff', selectable: false, evented: false, name: 'background',
                stroke: '#e5e7eb', strokeWidth: 1
            })
            canvas.add(bgRect)

            // Row 1: Base Price (text-slate-600 text-xl line-through)
            const baseLabel = new fabric.Text('Base Price', {
                left: 20, top: 20, fontSize: 16, fill: '#475569', fontFamily: 'Arial'
            })
            canvas.add(baseLabel)

            const basePrice = new fabric.IText('₹85 Lac', {
                left: 260, top: 16, fontSize: 20, fill: '#94a3b8', fontFamily: 'Arial',
                fontWeight: 'bold', linethrough: true, name: 'basePrice'
            })
            canvas.add(basePrice)

            // Row 2: Offer highlight (bg-green-50)
            const offerBg = new fabric.Rect({
                left: 0, top: 55, width: 380, height: 50,
                fill: '#f0fdf4', selectable: false, evented: false
            })
            canvas.add(offerBg)

            const giftIcon = new fabric.Text('🎁', {
                fontSize: 16, left: 20, top: 68
            })
            canvas.add(giftIcon)

            const offerLabel = new fabric.IText(offerName || 'Special Offer', {
                left: 45, top: 70, fontSize: 15, fill: '#15803d', fontFamily: 'Arial',
                fontWeight: 'bold', name: 'offerName'
            })
            canvas.add(offerLabel)

            const offerValue = new fabric.IText('-' + (benefitText || '₹2 Lac'), {
                left: 260, top: 68, fontSize: 17, fill: '#15803d', fontFamily: 'Arial',
                fontWeight: 'bold', name: 'offerValue'
            })
            canvas.add(offerValue)

            // Divider line (border-t)
            const divider = new fabric.Rect({
                left: 0, top: 120, width: 380, height: 1,
                fill: '#e5e7eb', selectable: false
            })
            canvas.add(divider)

            // Row 3: You Pay (text-slate-900 font-semibold, text-2xl font-black text-green-600)
            const finalLabel = new fabric.Text('You Pay', {
                left: 20, top: 145, fontSize: 16, fill: '#0f172a', fontFamily: 'Arial',
                fontWeight: 'bold'
            })
            canvas.add(finalLabel)

            const finalPrice = new fabric.IText('₹83 Lac', {
                left: 240, top: 135, fontSize: 32, fill: '#16a34a', fontFamily: 'Arial Black',
                fontWeight: 'bold', name: 'finalPrice'
            })
            canvas.add(finalPrice)
        }

        canvas.renderAll()
        updateLayers()
        saveToHistory()
    }, [bannerType, offerName, benefitText, benefitHighlight, updateLayers, saveToHistory])

    const updateTextPropsFromObject = useCallback((obj: any) => {
        if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
            setTextProps({
                fontSize: obj.fontSize || 40,
                fontFamily: obj.fontFamily || 'Impact',
                fill: obj.fill || '#ffffff',
                stroke: obj.stroke || '#000000',
                strokeWidth: obj.strokeWidth || 0,
                shadow: !!obj.shadow,
                opacity: obj.opacity || 1
            })
        }
    }, [])

    const initializedRef = useRef(false)

    // Initialize Fabric.js Canvas
    useEffect(() => {
        if (initializedRef.current) return
        initializedRef.current = true

        let fabricModule: any = null
        let canvas: any = null

        const initCanvas = async () => {
            try {
                fabricModule = await import('fabric')
                const fabric: any = (fabricModule as any).fabric || fabricModule

                if (!canvasRef.current || fabricCanvasRef.current) return

                canvas = new fabric.Canvas(canvasRef.current, {
                    width: 800,
                    height: 400,
                    backgroundColor: '#1a1a1a',
                    preserveObjectStacking: true,
                    selection: true,
                })

                fabricCanvasRef.current = canvas

                // Selection events
                canvas.on('selection:created', (e: any) => {
                    setSelectedObject(e.selected?.[0])
                    updateTextPropsFromObject(e.selected?.[0])
                })
                canvas.on('selection:updated', (e: any) => {
                    setSelectedObject(e.selected?.[0])
                    updateTextPropsFromObject(e.selected?.[0])
                })
                canvas.on('selection:cleared', () => setSelectedObject(null))

                // Update layers on changes
                canvas.on('object:added', updateLayers)
                canvas.on('object:removed', updateLayers)
                canvas.on('object:modified', () => saveToHistory())

                // Generate initial design with animation
                setIsGenerating(true)
                await generatePremiumDesign(fabric, canvas)
                setIsGenerating(false)
                setCanvasReady(true)

            } catch (error) {
                console.error('Error initializing canvas:', error)
            }
        }

        initCanvas()

        return () => {
            if (fabricCanvasRef.current) {
                fabricCanvasRef.current.dispose()
                fabricCanvasRef.current = null
            }
        }
    }, [generatePremiumDesign, updateLayers, saveToHistory, updateTextPropsFromObject])
    // Add premium text
    const addText = async (preset?: 'heading' | 'subheading' | 'body') => {
        const fabricModule = await import('fabric')
        const fabric: any = (fabricModule as any).fabric || fabricModule
        const canvas = fabricCanvasRef.current
        if (!canvas) return

        const presets = {
            heading: { text: 'HEADING', fontSize: 48, fontWeight: 'bold' },
            subheading: { text: 'Subheading Text', fontSize: 32, fontWeight: 'normal' },
            body: { text: 'Body text here...', fontSize: 20, fontWeight: 'normal' }
        }

        const config = preset ? presets[preset] : presets.heading

        const text = new fabric.IText(config.text, {
            left: 100,
            top: 150,
            fontFamily: textProps.fontFamily,
            fill: textProps.fill,
            fontSize: config.fontSize,
            fontWeight: config.fontWeight,
            shadow: textProps.shadow ? new fabric.Shadow({
                color: 'rgba(0,0,0,0.5)',
                blur: 10,
                offsetX: 2,
                offsetY: 2
            }) : null,
            name: 'custom-text'
        })
        canvas.add(text)
        canvas.setActiveObject(text)
        canvas.renderAll()
        saveToHistory()
    }

    // Add shapes
    const addShape = async (type: 'rect' | 'circle' | 'triangle' | 'star' | 'heart') => {
        const fabricModule = await import('fabric')
        const fabric: any = (fabricModule as any).fabric || fabricModule
        const canvas = fabricCanvasRef.current
        if (!canvas) return

        let shape

        switch (type) {
            case 'rect':
                shape = new fabric.Rect({
                    left: 200, top: 150, width: 120, height: 80,
                    fill: activeTemplate.accent, rx: 8, ry: 8,
                    shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.3)', blur: 10, offsetX: 3, offsetY: 3 })
                })
                break
            case 'circle':
                shape = new fabric.Circle({
                    left: 200, top: 150, radius: 50,
                    fill: activeTemplate.accent,
                    shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.3)', blur: 10, offsetX: 3, offsetY: 3 })
                })
                break
            case 'triangle':
                shape = new fabric.Triangle({
                    left: 200, top: 150, width: 100, height: 100,
                    fill: activeTemplate.accent,
                    shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.3)', blur: 10, offsetX: 3, offsetY: 3 })
                })
                break
            case 'star':
                const points = []
                for (let i = 0; i < 10; i++) {
                    const radius = i % 2 === 0 ? 50 : 25
                    const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2
                    points.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) })
                }
                shape = new fabric.Polygon(points, {
                    left: 200, top: 150,
                    fill: activeTemplate.accent,
                    shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.3)', blur: 10, offsetX: 3, offsetY: 3 })
                })
                break
            case 'heart':
                shape = new fabric.Path('M 50,30 A 20,20 0 0,1 90,30 A 20,20 0 0,1 50,75 A 20,20 0 0,1 10,30 A 20,20 0 0,1 50,30 z', {
                    left: 200, top: 150,
                    fill: '#ff4d6d',
                    scaleX: 1.2, scaleY: 1.2,
                    shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.3)', blur: 10, offsetX: 3, offsetY: 3 })
                })
                break
        }

        if (shape) {
            canvas.add(shape)
            canvas.setActiveObject(shape)
            canvas.renderAll()
            saveToHistory()
        }
    }

    // Add sticker
    const addSticker = async (sticker: typeof STICKERS[0]) => {
        const fabricModule = await import('fabric')
        const fabric: any = (fabricModule as any).fabric || fabricModule
        const canvas = fabricCanvasRef.current
        if (!canvas) return

        const stickerBg = new fabric.Rect({
            width: 160,
            height: 44,
            fill: sticker.color,
            rx: 22,
            ry: 22,
            originX: 'center',
            originY: 'center',
            shadow: new fabric.Shadow({
                color: 'rgba(0,0,0,0.4)',
                blur: 15,
                offsetX: 3,
                offsetY: 3
            })
        })

        const stickerText = new fabric.Text(sticker.text, {
            fontSize: 15,
            fill: '#ffffff',
            fontWeight: 'bold',
            fontFamily: 'Arial',
            originX: 'center',
            originY: 'center'
        })

        const group = new fabric.Group([stickerBg, stickerText], {
            left: 350,
            top: 180,
            name: 'sticker'
        })

        canvas.add(group)
        canvas.setActiveObject(group)
        canvas.renderAll()
        saveToHistory()
    }

    // Update selected object
    const updateSelectedObject = (property: string, value: any) => {
        if (!selectedObject) return

        if (property === 'shadow') {
            if (value) {
                const fabricModule = require('fabric')
                const fabric: any = (fabricModule as any).fabric || fabricModule
                selectedObject.set('shadow', new fabric.Shadow({
                    color: 'rgba(0,0,0,0.5)',
                    blur: 15,
                    offsetX: 3,
                    offsetY: 3
                }))
            } else {
                selectedObject.set('shadow', null)
            }
        } else {
            selectedObject.set(property, value)
        }

        fabricCanvasRef.current?.renderAll()
        updateTextPropsFromObject(selectedObject)
        saveToHistory()
    }

    // Delete selected
    const deleteSelected = () => {
        const canvas = fabricCanvasRef.current
        if (!canvas || !selectedObject) return
        canvas.remove(selectedObject)
        setSelectedObject(null)
        canvas.renderAll()
        updateLayers()
        saveToHistory()
    }

    // Duplicate selected
    const duplicateSelected = () => {
        const canvas = fabricCanvasRef.current
        if (!canvas || !selectedObject) return

        selectedObject.clone((cloned: any) => {
            cloned.set({
                left: (selectedObject.left || 0) + 20,
                top: (selectedObject.top || 0) + 20
            })
            canvas.add(cloned)
            canvas.setActiveObject(cloned)
            canvas.renderAll()
            updateLayers()
            saveToHistory()
        })
    }

    // Flip selected
    const flipSelected = (direction: 'horizontal' | 'vertical') => {
        if (!selectedObject) return
        if (direction === 'horizontal') {
            selectedObject.set('flipX', !selectedObject.flipX)
        } else {
            selectedObject.set('flipY', !selectedObject.flipY)
        }
        fabricCanvasRef.current?.renderAll()
        saveToHistory()
    }

    // Bring forward / Send backward
    const changeOrder = (direction: 'forward' | 'backward') => {
        const canvas = fabricCanvasRef.current
        if (!canvas || !selectedObject) return

        if (direction === 'forward') {
            canvas.bringForward(selectedObject)
        } else {
            canvas.sendBackwards(selectedObject)
        }
        canvas.renderAll()
        updateLayers()
        saveToHistory()
    }

    // Apply template
    const applyTemplate = async (template: typeof TEMPLATES[0]) => {
        const fabricModule = await import('fabric')
        const fabric: any = (fabricModule as any).fabric || fabricModule
        setActiveTemplate(template)
        setIsGenerating(true)
        await generatePremiumDesign(fabric, fabricCanvasRef.current)
        setIsGenerating(false)
    }

    // Undo/Redo
    const undo = async () => {
        if (historyIndex <= 0) return
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        fabricCanvasRef.current?.loadFromJSON(history[newIndex], () => {
            fabricCanvasRef.current?.renderAll()
            updateLayers()
        })
    }

    const redo = async () => {
        if (historyIndex >= history.length - 1) return
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        fabricCanvasRef.current?.loadFromJSON(history[newIndex], () => {
            fabricCanvasRef.current?.renderAll()
            updateLayers()
        })
    }

    // Zoom
    const handleZoom = (delta: number) => {
        const newZoom = Math.min(200, Math.max(50, zoom + delta))
        setZoom(newZoom)
        const canvas = fabricCanvasRef.current
        if (canvas) {
            canvas.setZoom(newZoom / 100)
            canvas.setDimensions({ width: 800 * (newZoom / 100), height: 400 * (newZoom / 100) })
        }
    }

    // Export
    const handleSave = () => {
        if (!fabricCanvasRef.current) return
        fabricCanvasRef.current.setZoom(1)
        fabricCanvasRef.current.setDimensions({ width: 800, height: 400 })
        const dataUrl = fabricCanvasRef.current.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2
        })
        onSave(dataUrl)
    }

    const handleDownload = () => {
        if (!fabricCanvasRef.current) return
        fabricCanvasRef.current.setZoom(1)
        fabricCanvasRef.current.setDimensions({ width: 800, height: 400 })
        const dataUrl = fabricCanvasRef.current.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 3 // Extra high res for download
        })
        const link = document.createElement('a')
        link.download = `${offerName || 'banner'}-premium.png`
        link.href = dataUrl
        link.click()
        fabricCanvasRef.current.setZoom(zoom / 100)
        fabricCanvasRef.current.setDimensions({ width: 800 * (zoom / 100), height: 400 * (zoom / 100) })
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
            {/* Top Bar */}
            <div className="h-14 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-purple-500/30 flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-1.5 mr-2 select-none">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Wand2 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <span className="text-white font-bold text-sm sm:text-base tracking-tight truncate max-w-[130px] sm:max-w-none block">Banner Studio Pro</span>
                            <span className="text-[9px] font-mono text-purple-300 font-extrabold uppercase tracking-widest hidden md:block">Creative Canvas Suite</span>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-slate-700 hidden md:block" />

                    {/* Undo/Redo */}
                    <div className="hidden md:flex items-center gap-1">
                        <button onClick={undo} disabled={historyIndex <= 0} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-30 transition-all">
                            <Undo className="h-4 w-4" />
                        </button>
                        <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-30 transition-all">
                            <Redo className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-slate-700 hidden md:block" />

                    {/* Zoom */}
                    <div className="hidden md:flex items-center gap-2 bg-slate-800 rounded-lg px-2 py-1">
                        <button onClick={() => handleZoom(-10)} className="p-1 text-slate-400 hover:text-white transition-colors">
                            <ZoomOut className="h-4 w-4" />
                        </button>
                        <span className="text-white text-sm w-12 text-center">{zoom}%</span>
                        <button onClick={() => handleZoom(10)} className="p-1 text-slate-400 hover:text-white transition-colors">
                            <ZoomIn className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        onClick={handleDownload}
                        className="px-3 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium flex items-center gap-1.5 sm:gap-2 transition-colors text-xs sm:text-sm"
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Export PNG</span>
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-3 sm:px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 sm:gap-2 transition-all shadow-lg text-xs sm:text-sm"
                    >
                        <Sparkles className="h-4 w-4" />
                        <span>Apply to Offer</span>
                        <span className="hidden sm:inline">Now</span>
                    </button>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Left Panel - Tools */}
                <div className="w-full lg:w-80 max-h-[38vh] lg:max-h-none order-2 lg:order-1 bg-slate-900 border-t lg:border-t-0 lg:border-r border-slate-800 flex flex-col shrink-0">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-800">
                        {[
                            { id: 'templates', label: 'Templates', icon: Layers },
                            { id: 'elements', label: 'Elements', icon: Square },
                            { id: 'text', label: 'Text', icon: Type },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 py-3 text-xs font-medium transition-all ${activeTab === tab.id
                                    ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/10'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4 mx-auto mb-1" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {activeTab === 'templates' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white font-semibold text-sm">Premium Templates</h3>
                                    <span className="text-xs text-purple-400">{TEMPLATES.length} designs</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {TEMPLATES.map(template => (
                                        <button
                                            key={template.id}
                                            onClick={() => applyTemplate(template)}
                                            className={`p-2 rounded-xl border-2 transition-all hover:scale-105 ${activeTemplate.id === template.id
                                                ? 'border-purple-500 ring-2 ring-purple-500/50'
                                                : 'border-slate-700 hover:border-slate-600'
                                                }`}
                                        >
                                            <div
                                                className="w-full h-12 rounded-lg mb-2"
                                                style={{ background: template.gradient }}
                                            />
                                            <p className="text-xs text-slate-300 truncate">{template.name}</p>
                                        </button>
                                    ))}
                                </div>

                                <div className="border-t border-slate-800 pt-4">
                                    <h3 className="text-white font-semibold text-sm mb-3">🏷️ Quick Stickers</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {STICKERS.map(sticker => (
                                            <button
                                                key={sticker.id}
                                                onClick={() => addSticker(sticker)}
                                                className="p-2 rounded-lg text-white text-xs font-bold transition-all hover:scale-105 hover:shadow-lg"
                                                style={{ backgroundColor: sticker.color }}
                                            >
                                                {sticker.text}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'elements' && (
                            <div className="space-y-4">
                                <h3 className="text-white font-semibold text-sm">Shapes</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { type: 'rect', icon: Square, label: 'Rectangle' },
                                        { type: 'circle', icon: Circle, label: 'Circle' },
                                        { type: 'triangle', icon: Triangle, label: 'Triangle' },
                                        { type: 'star', icon: Star, label: 'Star' },
                                        { type: 'heart', icon: Heart, label: 'Heart' },
                                    ].map(shape => (
                                        <button
                                            key={shape.type}
                                            onClick={() => addShape(shape.type as any)}
                                            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all hover:scale-110 group"
                                            title={shape.label}
                                        >
                                            <shape.icon className="h-6 w-6 text-slate-400 group-hover:text-purple-400 mx-auto" />
                                        </button>
                                    ))}
                                </div>

                                {selectedObject && (
                                    <div className="border-t border-slate-800 pt-4 space-y-3">
                                        <h3 className="text-white font-semibold text-sm">Selected Object</h3>

                                        <div className="grid grid-cols-4 gap-2">
                                            <button onClick={duplicateSelected} className="p-2 bg-slate-800 hover:bg-blue-600 rounded-lg transition-colors" title="Duplicate">
                                                <Copy className="h-4 w-4 text-slate-400 hover:text-white mx-auto" />
                                            </button>
                                            <button onClick={deleteSelected} className="p-2 bg-slate-800 hover:bg-red-600 rounded-lg transition-colors" title="Delete">
                                                <Trash2 className="h-4 w-4 text-slate-400 hover:text-white mx-auto" />
                                            </button>
                                            <button onClick={() => flipSelected('horizontal')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors" title="Flip H">
                                                <FlipHorizontal className="h-4 w-4 text-slate-400 hover:text-white mx-auto" />
                                            </button>
                                            <button onClick={() => flipSelected('vertical')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors" title="Flip V">
                                                <FlipVertical className="h-4 w-4 text-slate-400 hover:text-white mx-auto" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => changeOrder('forward')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300 transition-colors">
                                                Bring Forward
                                            </button>
                                            <button onClick={() => changeOrder('backward')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300 transition-colors">
                                                Send Back
                                            </button>
                                        </div>

                                        {/* Opacity */}
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Opacity</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={selectedObject.opacity || 1}
                                                onChange={(e) => updateSelectedObject('opacity', parseFloat(e.target.value))}
                                                className="w-full accent-purple-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'text' && (
                            <div className="space-y-4">
                                <h3 className="text-white font-semibold text-sm">Add Text</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => addText('heading')}
                                        className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left transition-all group"
                                    >
                                        <p className="text-2xl font-bold text-white group-hover:text-purple-400">Heading</p>
                                        <p className="text-xs text-slate-500">Big bold title</p>
                                    </button>
                                    <button
                                        onClick={() => addText('subheading')}
                                        className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left transition-all group"
                                    >
                                        <p className="text-lg font-medium text-white group-hover:text-purple-400">Subheading</p>
                                        <p className="text-xs text-slate-500">Medium sized text</p>
                                    </button>
                                    <button
                                        onClick={() => addText('body')}
                                        className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left transition-all group"
                                    >
                                        <p className="text-sm text-white group-hover:text-purple-400">Body text</p>
                                        <p className="text-xs text-slate-500">Smaller paragraph text</p>
                                    </button>
                                </div>

                                {selectedObject && (selectedObject.type === 'i-text' || selectedObject.type === 'text') && (
                                    <div className="border-t border-slate-800 pt-4 space-y-3">
                                        <h3 className="text-white font-semibold text-sm">Text Properties</h3>

                                        {/* Font */}
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Font</label>
                                            <select
                                                value={textProps.fontFamily}
                                                onChange={(e) => updateSelectedObject('fontFamily', e.target.value)}
                                                className="w-full bg-slate-800 text-white rounded-lg p-2 text-sm border border-slate-700"
                                            >
                                                {FONTS.map(font => (
                                                    <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                                                        {font.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Font Size */}
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Size: {textProps.fontSize}px</label>
                                            <input
                                                type="range"
                                                min="12"
                                                max="120"
                                                value={textProps.fontSize}
                                                onChange={(e) => updateSelectedObject('fontSize', parseInt(e.target.value))}
                                                className="w-full accent-purple-500"
                                            />
                                        </div>

                                        {/* Colors */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-slate-400 mb-1 block">Fill Color</label>
                                                <input
                                                    type="color"
                                                    value={textProps.fill}
                                                    onChange={(e) => updateSelectedObject('fill', e.target.value)}
                                                    className="w-full h-10 rounded-lg cursor-pointer bg-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-400 mb-1 block">Stroke</label>
                                                <input
                                                    type="color"
                                                    value={textProps.stroke}
                                                    onChange={(e) => updateSelectedObject('stroke', e.target.value)}
                                                    className="w-full h-10 rounded-lg cursor-pointer bg-transparent"
                                                />
                                            </div>
                                        </div>

                                        {/* Style buttons */}
                                        <div className="grid grid-cols-4 gap-2">
                                            <button
                                                onClick={() => updateSelectedObject('fontWeight', selectedObject.fontWeight === 'bold' ? 'normal' : 'bold')}
                                                className={`p-2 rounded-lg transition-colors ${selectedObject?.fontWeight === 'bold' ? 'bg-purple-600' : 'bg-slate-800 hover:bg-slate-700'}`}
                                            >
                                                <Bold className="h-4 w-4 text-white mx-auto" />
                                            </button>
                                            <button
                                                onClick={() => updateSelectedObject('fontStyle', selectedObject.fontStyle === 'italic' ? 'normal' : 'italic')}
                                                className={`p-2 rounded-lg transition-colors ${selectedObject?.fontStyle === 'italic' ? 'bg-purple-600' : 'bg-slate-800 hover:bg-slate-700'}`}
                                            >
                                                <Italic className="h-4 w-4 text-white mx-auto" />
                                            </button>
                                            <button
                                                onClick={() => updateSelectedObject('underline', !selectedObject.underline)}
                                                className={`p-2 rounded-lg transition-colors ${selectedObject?.underline ? 'bg-purple-600' : 'bg-slate-800 hover:bg-slate-700'}`}
                                            >
                                                <Underline className="h-4 w-4 text-white mx-auto" />
                                            </button>
                                            <button
                                                onClick={() => updateSelectedObject('shadow', !selectedObject.shadow)}
                                                className={`p-2 rounded-lg transition-colors ${selectedObject?.shadow ? 'bg-purple-600' : 'bg-slate-800 hover:bg-slate-700'}`}
                                            >
                                                <Sun className="h-4 w-4 text-white mx-auto" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 order-1 lg:order-2 bg-slate-950 flex items-center justify-center overflow-auto p-3 sm:p-8 relative min-h-[35vh]">
                    {/* Grid overlay */}
                    {showGrid && (
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                                backgroundSize: '20px 20px'
                            }}
                        />
                    )}

                    {/* Loading overlay */}
                    {isGenerating && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-white font-medium">Generating design...</p>
                            </div>
                        </div>
                    )}

                    <div className="shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/10">
                        <canvas ref={canvasRef} />
                    </div>
                </div>

                {/* Right Panel - Layers */}
                <div className="hidden lg:flex w-64 bg-slate-900 border-l border-slate-800 flex-col order-3 shrink-0">
                    <div className="p-4 border-b border-slate-800">
                        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                            <Layers className="h-4 w-4 text-purple-400" />
                            Layers ({layers.length})
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        {layers.map((layer, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    fabricCanvasRef.current?.setActiveObject(layer)
                                    fabricCanvasRef.current?.renderAll()
                                    setSelectedObject(layer)
                                }}
                                className={`w-full p-2 rounded-lg mb-1 text-left transition-all ${selectedObject === layer
                                    ? 'bg-purple-600/30 border border-purple-500'
                                    : 'bg-slate-800/50 hover:bg-slate-700/50 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center">
                                        {layer.type === 'i-text' || layer.type === 'text' ? (
                                            <Type className="h-4 w-4 text-slate-400" />
                                        ) : layer.type === 'rect' ? (
                                            <Square className="h-4 w-4 text-slate-400" />
                                        ) : layer.type === 'circle' ? (
                                            <Circle className="h-4 w-4 text-slate-400" />
                                        ) : layer.type === 'group' ? (
                                            <Layers className="h-4 w-4 text-slate-400" />
                                        ) : (
                                            <ImageIcon className="h-4 w-4 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-white truncate">
                                            {layer.name || layer.type || `Layer ${layers.length - index}`}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {layer.type}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            layer.set('visible', !layer.visible)
                                            fabricCanvasRef.current?.renderAll()
                                        }}
                                        className="p-1 hover:bg-slate-600 rounded"
                                    >
                                        {layer.visible !== false ? (
                                            <Eye className="h-3 w-3 text-slate-400" />
                                        ) : (
                                            <EyeOff className="h-3 w-3 text-slate-500" />
                                        )}
                                    </button>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Quick actions */}
                    <div className="p-4 border-t border-slate-800">
                        <button
                            onClick={() => applyTemplate(activeTemplate)}
                            className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium text-slate-300 flex items-center justify-center gap-2 transition-colors"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Regenerate Design
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BannerEditor
