import { FunctionComponent } from 'react'
import { PerpMarket } from '@blockworks-foundation/mango-client'
import useMangoStore from '../stores/useMangoStore'

interface OrderSideTabsProps {
  onChange: (x) => void
  side: string
}

const OrderSideTabs: FunctionComponent<OrderSideTabsProps> = ({
  side,
  onChange,
}) => {
  const market = useMangoStore((s) => s.selectedMarket.current)
  return (
    <div className={`border-b border-th-fgd-4 mb-4 relative`}>
      <div
        className={`absolute ${
          side === 'buy'
            ? 'bg-th-green translate-x-0'
            : 'bg-th-red translate-x-full'
        } bottom-[-1px] default-transition left-0 h-0.5 transform w-1/2`}
      />
      <nav className="-mb-px flex" aria-label="Tabs">
        <button
          onClick={() => onChange('buy')}
          className={`cursor-pointer default-transition flex font-semibold items-center justify-center p-2 relative text-base w-1/2 whitespace-nowrap hover:opacity-100
                    ${
                      side === 'buy'
                        ? `text-th-green`
                        : `text-th-fgd-4 hover:text-th-green`
                    }
                  `}
        >
          {market instanceof PerpMarket ? 'Long' : 'Buy'}
        </button>
        <button
          onClick={() => onChange('sell')}
          className={`cursor-pointer default-transition flex font-semibold items-center justify-center p-2 relative text-base w-1/2 whitespace-nowrap hover:opacity-100
                    ${
                      side === 'sell'
                        ? `text-th-red`
                        : `text-th-fgd-4 hover:text-th-red`
                    }
                  `}
        >
          {market instanceof PerpMarket ? 'Short' : 'Sell'}
        </button>
      </nav>
    </div>
  )
}

export default OrderSideTabs
