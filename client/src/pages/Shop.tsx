import { useState, useEffect } from 'react'
import { ShoppingBag, Coins, Sparkles, Crown, TrendingUp } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import GlassCard from '../components/GlassCard'
import api from '../lib/api'

interface ShopItem {
  id: string
  name: string
  emoji: string
  price: number
  category: string
  limited?: boolean
  maxStock?: number
  soldCount?: number
  remaining?: number
  soldOut?: boolean
}

interface UserData {
  coins: number
  inventory: string[]
}

export default function Shop() {
  const { colors } = useTheme()
  const { user } = useAuth()
  const [items, setItems] = useState<ShopItem[]>([])
  const [userData, setUserData] = useState<UserData>({ coins: 0, inventory: [] })
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'roles' | 'limited'>('all')

  useEffect(() => {
    fetchShopData()
  }, [])

  const fetchShopData = async () => {
    try {
      const [itemsRes, coinsRes, inventoryRes] = await Promise.all([
        api.get('/api/shop/items'),
        api.get(`/api/coins/${user?.id}`),
        api.get(`/api/inventory/${user?.id}`)
      ])

      setItems(itemsRes.data.items || [])
      setUserData({
        coins: coinsRes.data.coins || 0,
        inventory: inventoryRes.data.items || []
      })
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch shop data:', error)
      setLoading(false)
    }
  }

  const handlePurchase = async (item: ShopItem) => {
    if (!user?.id) {
      alert('Please login first!')
      return
    }

    if (purchasing) return

    // Check if already owned
    if (userData.inventory.includes(item.id)) {
      alert('You already own this item!')
      return
    }

    // Check if enough coins
    if (userData.coins < item.price) {
      alert(`Not enough coins! You need ${item.price - userData.coins} more coins.`)
      return
    }

    // Check if sold out
    if (item.soldOut) {
      alert('This item is sold out!')
      return
    }

    setPurchasing(item.id)

    try {
      const guildId = user.guilds?.[0]?.id || '1482354951689605150'
      
      const response = await api.post('/api/shop/purchase', {
        userId: user.id,
        guildId: guildId,
        itemId: item.id
      })

      if (response.data.success) {
        alert(`✅ ${response.data.message}`)
        // Refresh data
        await fetchShopData()
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Purchase failed'
      alert(`❌ ${errorMsg}`)
    } finally {
      setPurchasing(null)
    }
  }

  const filteredItems = items.filter(item => {
    if (selectedCategory === 'all') return true
    if (selectedCategory === 'limited') return item.limited
    return item.category === selectedCategory
  })

  const limitedItems = items.filter(i => i.limited)
  const regularItems = items.filter(i => !i.limited)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: colors.primary }}
        ></div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen p-8 relative"
      style={{
        backgroundImage: 'url("/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#f9f9f9'
      }}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20" style={{ zIndex: 0 }} />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: colors.text }}>
              <ShoppingBag className="h-8 w-8" style={{ color: colors.primary }} />
              Role Shop
            </h1>
            <p className="mt-1" style={{ color: colors.textSecondary }}>
              Mua roles độc quyền với coins của bạn
            </p>
          </div>

          {/* Coins Display */}
          <GlassCard variant="strong" className="px-6 py-3">
            <div className="flex items-center gap-3">
              <Coins className="h-6 w-6" style={{ color: '#FFD700' }} />
              <div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>Your Balance</p>
                <p className="text-2xl font-bold" style={{ color: colors.text }}>
                  {userData.coins.toLocaleString()} 🪙
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Category Filter */}
        <div className="flex gap-3">
          {['all', 'roles', 'limited'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat as any)}
              className="px-6 py-2 rounded-xl font-medium transition-all"
              style={{
                backgroundColor: selectedCategory === cat ? colors.primary : 'rgba(255, 255, 255, 0.12)',
                color: selectedCategory === cat ? 'white' : colors.text,
                border: `2px solid ${selectedCategory === cat ? colors.primary : 'transparent'}`
              }}
            >
              {cat === 'all' && '✨ All Items'}
              {cat === 'roles' && '🎭 Roles'}
              {cat === 'limited' && '💎 Limited'}
            </button>
          ))}
        </div>

        {/* Limited Edition Section */}
        {limitedItems.length > 0 && selectedCategory !== 'roles' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Crown className="h-6 w-6" style={{ color: '#FFD700' }} />
              <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
                Limited Edition Roles
              </h2>
              <span 
                className="px-3 py-1 rounded-full text-sm font-bold"
                style={{ 
                  backgroundColor: '#FF6B00',
                  color: 'white'
                }}
              >
                EXCLUSIVE
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {limitedItems.map((item) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  owned={userData.inventory.includes(item.id)}
                  onPurchase={handlePurchase}
                  purchasing={purchasing === item.id}
                  colors={colors}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Items Section */}
        {regularItems.length > 0 && selectedCategory !== 'limited' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6" style={{ color: colors.primary }} />
              <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
                Regular Roles
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularItems.map((item) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  owned={userData.inventory.includes(item.id)}
                  onPurchase={handlePurchase}
                  purchasing={purchasing === item.id}
                  colors={colors}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

interface ShopItemCardProps {
  item: ShopItem
  owned: boolean
  onPurchase: (item: ShopItem) => void
  purchasing: boolean
  colors: any
}

function ShopItemCard({ item, owned, onPurchase, purchasing, colors }: ShopItemCardProps) {
  const canPurchase = !owned && !item.soldOut && !purchasing

  return (
    <GlassCard 
      variant="hover" 
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        border: item.limited ? `2px solid #FFD700` : `2px solid ${colors.primary}20`,
        opacity: item.soldOut ? 0.6 : 1
      }}
    >
      {/* Limited Badge */}
      {item.limited && (
        <div 
          className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold"
          style={{
            backgroundColor: item.soldOut ? '#666' : '#FF6B00',
            color: 'white'
          }}
        >
          {item.soldOut ? 'SOLD OUT' : `LIMITED ${item.remaining}/${item.maxStock}`}
        </div>
      )}

      {/* Owned Badge */}
      {owned && (
        <div 
          className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold"
          style={{
            backgroundColor: '#10b981',
            color: 'white'
          }}
        >
          ✓ OWNED
        </div>
      )}

      {/* Item Icon */}
      <div className="flex justify-center mb-4">
        <div 
          className="text-6xl transition-transform duration-300 hover:scale-110"
          style={{
            filter: item.soldOut ? 'grayscale(100%)' : 'none'
          }}
        >
          {item.emoji}
        </div>
      </div>

      {/* Item Info */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>
          {item.name}
        </h3>
        <div className="flex items-center justify-center gap-2">
          <Coins className="h-5 w-5" style={{ color: '#FFD700' }} />
          <span className="text-2xl font-bold" style={{ color: colors.primary }}>
            {item.price.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Stock Indicator */}
      {item.limited && !item.soldOut && item.remaining !== undefined && (
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1" style={{ color: colors.textSecondary }}>
            <span>Stock</span>
            <span>{item.remaining} left</span>
          </div>
          <div 
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <div 
              className="h-full transition-all duration-300"
              style={{
                width: `${((item.maxStock! - item.remaining) / item.maxStock!) * 100}%`,
                backgroundColor: item.remaining < 3 ? '#ef4444' : '#FFD700'
              }}
            />
          </div>
        </div>
      )}

      {/* Purchase Button */}
      <button
        onClick={() => onPurchase(item)}
        disabled={!canPurchase}
        className="w-full py-3 rounded-xl font-bold transition-all disabled:cursor-not-allowed"
        style={{
          backgroundColor: canPurchase ? colors.primary : '#666',
          color: 'white',
          opacity: canPurchase ? 1 : 0.5,
          transform: purchasing ? 'scale(0.95)' : 'scale(1)'
        }}
        onMouseEnter={(e) => {
          if (canPurchase) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)'
          }
        }}
        onMouseLeave={(e) => {
          if (canPurchase) {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }
        }}
      >
        {purchasing ? '⏳ Purchasing...' : owned ? '✓ Owned' : item.soldOut ? '🔒 Sold Out' : '🛒 Purchase'}
      </button>
    </GlassCard>
  )
}
